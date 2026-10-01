/**
 * ANKLYZE Phase 9 - Answer Reconstruction Service
 * "Analyse the marks, not just the paper."
 * 
 * Strict Architectural Rules:
 * - Two-Stage Hybrid Pipeline:
 *   Stage 1: Deterministic layout, OCR, question normalization, bounding boxes, sequence continuity.
 *   Stage 2: Multimodal AI resolution (Gemini primary / Groq fallback) used ONLY for ambiguous cases.
 * - Versioned reconstruction results (v1 -> v2) preserving complete history.
 * - Handles duplicate attempts without silent deletion.
 * - Accurately differentiates BLANK from UNREADABLE.
 * - Preserves provenance (OCR version, pipeline version, provider, model, prompt version, fallback).
 * - Strictly NO marks, NO scoring, NO rubric evaluation.
 */

import {
  ReconstructionRepository,
  reconstructionRepository,
  CreateAttemptInput,
} from '../repositories/reconstruction.repository';
import {
  VisionReconstructionService,
  visionReconstructionService,
} from '../ai/visionReconstruction.service';
import {
  QuestionMatcher,
  ExamQuestionReference,
} from './questionMatcher';
import { AuditService } from './audit.service';
import { logger } from '../utils/logger';
import { OCRBlock } from '../ocr/types';
import {
  QuestionAttemptState,
  ReconstructionStatus,
} from '@prisma/client';
import { config } from '../config/env';

export interface ReconstructScriptOptions {
  forceRerun?: boolean;
  userContext?: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface ReconstructedAttemptDto {
  id?: string;
  questionId: string;
  questionNumber: string;
  questionText: string;
  attemptIndex: number;
  state: QuestionAttemptState;
  confidence: number;
  startPageNumber: number;
  endPageNumber: number;
  pages: Array<{
    pageId: string;
    pageNumber: number;
    pageOrder: number;
    isContinuation: boolean;
  }>;
  reason?: string;
}

export interface StructuredAnswerMap {
  scriptId: string;
  scriptCode: string;
  reconstructionVersion: number;
  status: ReconstructionStatus;
  pipelineVersion: string;
  ocrVersion: number;
  provider: string;
  model: string;
  fallbackUsed: boolean;
  confidence: number;
  totalPages: number;
  mappedQuestionsCount: number;
  reviewCasesCount: number;
  attempts: ReconstructedAttemptDto[];
  pageToQuestionMap: Array<{
    pageNumber: number;
    pageId: string;
    questionNumbers: string[];
    isContinuation: boolean;
    state: QuestionAttemptState;
  }>;
  reviewCases: Array<{
    issue: string;
    affectedPages: number[];
    questionNumber?: string;
    reason: string;
    confidence: number;
  }>;
}

export class ReconstructionService {
  constructor(
    private readonly repo: ReconstructionRepository = reconstructionRepository,
    private readonly visionAI: VisionReconstructionService = visionReconstructionService
  ) {}

  /**
   * Orchestrates hybrid two-stage answer reconstruction for an answer script.
   */
  public async reconstructScript(
    scriptId: string,
    options: ReconstructScriptOptions = {}
  ): Promise<StructuredAnswerMap> {
    const script = await this.repo.findScriptForReconstruction(scriptId);

    if (!script) {
      throw new Error(`SCRIPT_NOT_FOUND: Answer sheet ${scriptId} not found`);
    }

    // Check idempotency: If already completed and not forced, return existing summary
    const latestRecon = await this.repo.findReconstruction(scriptId);
    if (
      latestRecon &&
      latestRecon.status === ReconstructionStatus.COMPLETED &&
      !options.forceRerun
    ) {
      logger.info(
        { scriptId, scriptCode: script.scriptCode, version: latestRecon.version },
        'Script already has completed reconstruction. Returning existing answer map.'
      );
      return this.formatAnswerMap(script, latestRecon);
    }

    // Audit: RECONSTRUCTION_REQUESTED & RECONSTRUCTION_STARTED
    await AuditService.recordEvent({
      event: options.forceRerun ? 'RECONSTRUCTION_RETRY_REQUESTED' : 'RECONSTRUCTION_REQUESTED',
      userId: options.userContext?.userId,
      ipAddress: options.userContext?.ipAddress,
      userAgent: options.userContext?.userAgent,
      details: { scriptId, scriptCode: script.scriptCode, forceRerun: !!options.forceRerun },
    });

    await AuditService.recordEvent({
      event: 'RECONSTRUCTION_STARTED',
      userId: options.userContext?.userId,
      ipAddress: options.userContext?.ipAddress,
      userAgent: options.userContext?.userAgent,
      details: { scriptId, scriptCode: script.scriptCode },
    });

    // Ensure OCR data is present
    if (!script.pages || script.pages.length === 0) {
      throw new Error(`OCR_DATA_NOT_FOUND: No pages found for sheet ${scriptId}`);
    }

    const examQuestions: ExamQuestionReference[] = (script.subject?.questions || []).map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      maximumMarks: q.maximumMarks,
    }));

    if (examQuestions.length === 0) {
      throw new Error(
        `EXAM_STRUCTURE_NOT_FOUND: Subject ${script.subject?.code} has no registered questions`
      );
    }

    // --------------------------------------------------------------------------
    // STAGE 1: Deterministic Candidate Detection
    // --------------------------------------------------------------------------
    const stage1Result = this.runDeterministicStage(script.pages, examQuestions);

    let activeProvider = 'deterministic';
    let activeModel = 'hybrid-rules-v1';
    let fallbackUsed = false;
    const finalAttempts: CreateAttemptInput[] = [...stage1Result.attempts];
    const reviewCases = [...stage1Result.reviewCases];

    // --------------------------------------------------------------------------
    // STAGE 2: Multimodal AI Resolution (Invoked ONLY if ambiguous pages exist)
    // --------------------------------------------------------------------------
    if (stage1Result.ambiguousPages.length > 0) {
      logger.info(
        { scriptId, ambiguousCount: stage1Result.ambiguousPages.length },
        'Stage 1 identified ambiguous pages. Engaging Stage 2 multimodal AI resolution.'
      );

      try {
        const aiExecution = await this.visionAI.reconstructAmbiguities({
          scriptId: script.id,
          scriptCode: script.scriptCode,
          subjectCode: script.subject?.code || '',
          subjectName: script.subject?.name || '',
          examTitle: script.exam?.title || '',
          questions: examQuestions,
          ambiguousPages: stage1Result.ambiguousPages,
          deterministicCandidates: stage1Result.deterministicCandidates,
          task: 'Resolve ambiguous question candidates, verify continuation or cancellation boundaries',
          timeoutMs: config.RECONSTRUCTION_TIMEOUT_MS,
        });

        activeProvider = aiExecution.provider;
        activeModel = aiExecution.model;
        fallbackUsed = aiExecution.fallbackUsed;

        // Merge resolved AI attempts
        for (const aiAttempt of aiExecution.data.attempts) {
          const matchingQuestion = examQuestions.find((q) => q.id === aiAttempt.questionId);
          if (!matchingQuestion) continue;

          // Check if already represented in finalAttempts
          const existingIdx = finalAttempts.findIndex(
            (a) => a.questionId === aiAttempt.questionId && a.attemptIndex === aiAttempt.attemptIndex
          );

          const attemptPages = aiAttempt.pageIds.map((pid, idx) => {
            const pageObj = script.pages.find((p) => p.id === pid);
            return {
              pageId: pid,
              pageNumber: pageObj?.pageNumber || idx + 1,
              pageOrder: idx + 1,
              isContinuation: idx > 0,
            };
          });

          const formattedAttempt: CreateAttemptInput = {
            questionId: aiAttempt.questionId,
            attemptIndex: aiAttempt.attemptIndex,
            state: aiAttempt.state,
            detectedQuestionLabel: matchingQuestion.questionNumber,
            confidence: aiAttempt.confidence,
            startPageNumber: attemptPages[0]?.pageNumber || 1,
            endPageNumber: attemptPages[attemptPages.length - 1]?.pageNumber || 1,
            reconstructionReason: aiAttempt.reason,
            pages: attemptPages,
          };

          if (existingIdx >= 0) {
            if (
              finalAttempts[existingIdx].state === QuestionAttemptState.REQUIRES_REVIEW ||
              finalAttempts[existingIdx].confidence < aiAttempt.confidence
            ) {
              finalAttempts[existingIdx] = formattedAttempt;
            }
          } else {
            finalAttempts.push(formattedAttempt);
          }
        }

        // Add any remaining unresolved review cases from AI
        for (const rc of aiExecution.data.reviewCases) {
          const affectedPageNums = rc.pageIds.map((pid) => {
            const p = script.pages.find((pg) => pg.id === pid);
            return p?.pageNumber || 1;
          });

          const qObj = examQuestions.find((q) => q.id === rc.questionId);

          reviewCases.push({
            issue: rc.issue,
            affectedPages: affectedPageNums,
            questionNumber: qObj?.questionNumber,
            reason: rc.reason,
            confidence: rc.confidence,
          });
        }
      } catch (aiErr: any) {
        logger.error(
          { scriptId, error: aiErr.message },
          'Stage 2 Multimodal AI resolution encountered error. Preserving deterministic result and flagging for human review.'
        );
        // Flag review case instead of failing entire script
        reviewCases.push({
          issue: 'AI_RECONSTRUCTION_UNAVAILABLE',
          affectedPages: stage1Result.ambiguousPages.map((p) => p.pageNumber),
          reason: `Multimodal AI assistance failed (${aiErr.message}). Requires manual review.`,
          confidence: 0.3,
        });
      }
    }

    // Determine overall reconstruction status
    const hasUnresolvedReview =
      reviewCases.length > 0 ||
      finalAttempts.some((a) => a.state === QuestionAttemptState.REQUIRES_REVIEW);

    const overallStatus = hasUnresolvedReview
      ? finalAttempts.length > 0
        ? ReconstructionStatus.PARTIALLY_RECONSTRUCTED
        : ReconstructionStatus.NEEDS_REVIEW
      : ReconstructionStatus.COMPLETED;

    // Calculate normalized overall confidence
    const confidenceSum = finalAttempts.reduce((sum, a) => sum + a.confidence, 0);
    const overallConfidence =
      finalAttempts.length > 0
        ? parseFloat((confidenceSum / finalAttempts.length).toFixed(2))
        : 0.5;

    // Get latest OCR version from pages
    const latestOcrVersion = Math.max(
      ...script.pages.map((p) => p.ocrResults[0]?.version || 1),
      1
    );

    // Persist reconstruction
    const savedReconstruction = await this.repo.createReconstruction({
      scriptId: script.id,
      status: overallStatus,
      pipelineVersion: config.RECONSTRUCTION_PIPELINE_VERSION,
      ocrVersion: latestOcrVersion,
      provider: activeProvider,
      model: activeModel,
      promptVersion: config.RECONSTRUCTION_PROMPT_VERSION,
      fallbackUsed,
      confidence: overallConfidence,
      attemptsCount: finalAttempts.length,
      reviewCasesCount: reviewCases.length,
      metadata: JSON.stringify({ reviewCases }),
      attempts: finalAttempts,
    });

    // Audit: Completed / Partial
    await AuditService.recordEvent({
      event:
        overallStatus === ReconstructionStatus.COMPLETED
          ? 'RECONSTRUCTION_COMPLETED'
          : 'RECONSTRUCTION_PARTIAL',
      userId: options.userContext?.userId,
      ipAddress: options.userContext?.ipAddress,
      userAgent: options.userContext?.userAgent,
      details: {
        scriptId,
        reconstructionId: savedReconstruction?.id,
        status: overallStatus,
        provider: activeProvider,
        fallbackUsed,
        attemptsCount: finalAttempts.length,
        reviewCasesCount: reviewCases.length,
      },
    });

    return this.formatAnswerMap(script, savedReconstruction, reviewCases);
  }

  /**
   * Executes deterministic Stage 1 detection across all pages of the script.
   */
  private runDeterministicStage(
    pages: any[],
    examQuestions: ExamQuestionReference[]
  ) {
    const attemptsMap = new Map<string, CreateAttemptInput[]>();
    const ambiguousPages: any[] = [];
    const deterministicCandidates: any[] = [];
    const reviewCases: Array<{
      issue: string;
      affectedPages: number[];
      questionNumber?: string;
      reason: string;
      confidence: number;
    }> = [];

    let currentOpenAttempt: {
      question: ExamQuestionReference;
      attemptIndex: number;
      pages: any[];
    } | null = null;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const latestOcr = page.ocrResults?.[0];
      const fullText = latestOcr?.fullText || '';
      const ocrConfidence = latestOcr?.confidence ?? 0.85;

      let blocks: OCRBlock[] = [];
      try {
        if (latestOcr?.blocksJson) {
          blocks = JSON.parse(latestOcr.blocksJson);
        }
      } catch {
        blocks = [];
      }

      // Check unreadable first
      const isUnreadable = QuestionMatcher.isUnreadable(
        page.qualityScore ?? 1.0,
        ocrConfidence,
        fullText
      );

      if (isUnreadable) {
        ambiguousPages.push({
          pageId: page.id,
          pageNumber: page.pageNumber,
          ocrFullText: fullText,
          ocrConfidence,
          qualityScore: page.qualityScore,
        });
        reviewCases.push({
          issue: 'UNREADABLE_PAGE',
          affectedPages: [page.pageNumber],
          reason: `Page ${page.pageNumber} scan quality or OCR clarity is severely degraded`,
          confidence: 0.25,
        });
        continue;
      }

      // Detect question markers
      const detectedMarkers = QuestionMatcher.detectMarkersOnPage(fullText, blocks);
      const cancellation = QuestionMatcher.isCancelledAnswer(fullText, blocks);

      if (detectedMarkers.length === 0) {
        // No new question marker found on this page
        if (currentOpenAttempt) {
          // Detect continuation from previous question
          currentOpenAttempt.pages.push({
            pageId: page.id,
            pageNumber: page.pageNumber,
            pageOrder: currentOpenAttempt.pages.length + 1,
            isContinuation: true,
          });
        } else {
          // Page has text without known question header or continuation context
          ambiguousPages.push({
            pageId: page.id,
            pageNumber: page.pageNumber,
            ocrFullText: fullText,
            ocrConfidence,
            qualityScore: page.qualityScore,
          });
          reviewCases.push({
            issue: 'ORPHAN_PAGE_CONTENT',
            affectedPages: [page.pageNumber],
            reason: `Page ${page.pageNumber} contains content without a detectable question heading or active continuation`,
            confidence: 0.45,
          });
        }
        continue;
      }

      // One or more markers detected on this page
      for (const marker of detectedMarkers) {
        const matchResult = QuestionMatcher.matchMarkerToQuestions(marker, examQuestions);

        if (matchResult.isAmbiguous || !matchResult.matchedQuestionId) {
          // Ambiguous question label: send to AI
          ambiguousPages.push({
            pageId: page.id,
            pageNumber: page.pageNumber,
            ocrFullText: fullText,
            ocrConfidence,
            blocksSummary: blocks.map((b) => b.text).join(' | ').substring(0, 300),
          });
          deterministicCandidates.push({
            pageNumber: page.pageNumber,
            detectedLabel: marker.rawText,
            reason: matchResult.ambiguityReason || 'Question identifier ambiguous',
          });
          reviewCases.push({
            issue: 'AMBIGUOUS_QUESTION_LABEL',
            affectedPages: [page.pageNumber],
            reason: matchResult.ambiguityReason || `Uncertain question label '${marker.rawText}'`,
            confidence: matchResult.confidence,
          });
          continue;
        }

        const matchedQ = examQuestions.find((q) => q.id === matchResult.matchedQuestionId)!;

        // Check if blank
        const isBlank = QuestionMatcher.isBlankAnswer(
          fullText,
          marker.rawText,
          page.qualityScore ?? 1.0,
          ocrConfidence
        );

        let attemptState: QuestionAttemptState = QuestionAttemptState.ACTIVE;
        let attemptReason = `Detected ${matchedQ.questionNumber} marker on page ${page.pageNumber}`;

        if (cancellation.isCancelled) {
          attemptState = QuestionAttemptState.CANCELLED;
          attemptReason = cancellation.reason || 'Answer marked cancelled';
        } else if (isBlank) {
          attemptState = QuestionAttemptState.BLANK;
          attemptReason = 'Question heading present with empty answer content';
        }

        // Check for duplicate attempts
        const existingAttempts = attemptsMap.get(matchedQ.id) || [];
        const nextAttemptIndex = existingAttempts.length + 1;

        if (existingAttempts.length > 0) {
          // Duplicate attempt detected!
          // If first attempt was cancelled, this attempt can remain active
          const firstAttempt = existingAttempts[0];
          if (firstAttempt.state === QuestionAttemptState.CANCELLED && attemptState === QuestionAttemptState.ACTIVE) {
            attemptState = QuestionAttemptState.ACTIVE;
            attemptReason = `Second attempt for ${matchedQ.questionNumber} active; previous attempt cancelled`;
          } else if (firstAttempt.state === QuestionAttemptState.ACTIVE && attemptState === QuestionAttemptState.CANCELLED) {
            // first stays active, this is cancelled
            attemptReason = `Second attempt for ${matchedQ.questionNumber} explicitly cancelled`;
          } else {
            // Both attempts appear valid or ambiguous cancellation: require human review!
            attemptState = QuestionAttemptState.REQUIRES_REVIEW;
            firstAttempt.state = QuestionAttemptState.REQUIRES_REVIEW;
            firstAttempt.reconstructionReason = `Multiple attempts found for ${matchedQ.questionNumber}. Requires examiner review.`;
            attemptReason = `Multiple attempts found for ${matchedQ.questionNumber}. Requires examiner review.`;

            reviewCases.push({
              issue: 'DUPLICATE_ATTEMPTS_UNRESOLVED',
              affectedPages: [firstAttempt.startPageNumber, page.pageNumber],
              questionNumber: matchedQ.questionNumber,
              reason: `Multiple valid attempts detected for question ${matchedQ.questionNumber} on pages ${firstAttempt.startPageNumber} and ${page.pageNumber}`,
              confidence: 0.55,
            });
          }
        }

        const newAttempt: CreateAttemptInput = {
          questionId: matchedQ.id,
          attemptIndex: nextAttemptIndex,
          state: attemptState,
          detectedQuestionLabel: matchedQ.questionNumber,
          confidence: matchResult.confidence,
          startPageNumber: page.pageNumber,
          endPageNumber: page.pageNumber,
          reconstructionReason: attemptReason,
          pages: [
            {
              pageId: page.id,
              pageNumber: page.pageNumber,
              pageOrder: 1,
              isContinuation: false,
            },
          ],
        };

        existingAttempts.push(newAttempt);
        attemptsMap.set(matchedQ.id, existingAttempts);

        // Keep as active open attempt for subsequent page continuation tracking
        if (attemptState === QuestionAttemptState.ACTIVE && !isBlank) {
          currentOpenAttempt = {
            question: matchedQ,
            attemptIndex: nextAttemptIndex,
            pages: newAttempt.pages,
          };
        } else {
          currentOpenAttempt = null;
        }
      }
    }

    // Flatten all attempts and finalize endPageNumbers
    const attempts: CreateAttemptInput[] = [];
    for (const [, attList] of attemptsMap.entries()) {
      for (const att of attList) {
        if (att.pages && att.pages.length > 0) {
          att.startPageNumber = att.pages[0].pageNumber;
          att.endPageNumber = att.pages[att.pages.length - 1].pageNumber;
        }
        attempts.push(att);
      }
    }

    return {
      attempts,
      ambiguousPages,
      deterministicCandidates,
      reviewCases,
    };
  }

  /**
   * Formats a complete structured answer map.
   */
  private formatAnswerMap(
    script: any,
    reconstruction: any,
    extraReviewCases: any[] = []
  ): StructuredAnswerMap {
    const attempts = reconstruction?.attempts || [];

    const formattedAttempts: ReconstructedAttemptDto[] = attempts.map((att: any) => ({
      id: att.id,
      questionId: att.questionId,
      questionNumber: att.question?.questionNumber || att.detectedQuestionLabel || 'Unknown',
      questionText: att.question?.questionText || '',
      attemptIndex: att.attemptIndex,
      state: att.state,
      confidence: att.confidence,
      startPageNumber: att.startPageNumber,
      endPageNumber: att.endPageNumber,
      pages: (att.pages || []).map((p: any) => ({
        pageId: p.pageId,
        pageNumber: p.pageNumber,
        pageOrder: p.pageOrder,
        isContinuation: p.isContinuation,
      })),
      reason: att.reconstructionReason,
    }));

    // Build page-to-question map
    const pageToQuestionMap: StructuredAnswerMap['pageToQuestionMap'] = (
      script.pages || []
    ).map((page: any) => {
      const matchingAttempts = formattedAttempts.filter((att) =>
        att.pages.some((p) => p.pageNumber === page.pageNumber)
      );

      const isContinuation = matchingAttempts.some((att) =>
        att.pages.some((p) => p.pageNumber === page.pageNumber && p.isContinuation)
      );

      const primaryState =
        matchingAttempts.length > 0 ? matchingAttempts[0].state : QuestionAttemptState.REQUIRES_REVIEW;

      return {
        pageNumber: page.pageNumber,
        pageId: page.id,
        questionNumbers: matchingAttempts.map((a) => a.questionNumber),
        isContinuation,
        state: primaryState,
      };
    });

    let storedReviewCases: any[] = [];
    try {
      if (reconstruction?.metadata) {
        const parsed = JSON.parse(reconstruction.metadata);
        if (parsed?.reviewCases) storedReviewCases = parsed.reviewCases;
      }
    } catch {
      storedReviewCases = [];
    }

    const allReviewCases = [...storedReviewCases, ...extraReviewCases];

    return {
      scriptId: script.id,
      scriptCode: script.scriptCode,
      reconstructionVersion: reconstruction?.version || 1,
      status: reconstruction?.status || ReconstructionStatus.NOT_STARTED,
      pipelineVersion: reconstruction?.pipelineVersion || config.RECONSTRUCTION_PIPELINE_VERSION,
      ocrVersion: reconstruction?.ocrVersion || 1,
      provider: reconstruction?.provider || 'deterministic',
      model: reconstruction?.model || 'hybrid-rules-v1',
      fallbackUsed: reconstruction?.fallbackUsed || false,
      confidence: reconstruction?.confidence ?? 1.0,
      totalPages: script.pages?.length || 0,
      mappedQuestionsCount: new Set(formattedAttempts.map((a) => a.questionId)).size,
      reviewCasesCount: reconstruction?.reviewCasesCount ?? allReviewCases.length,
      attempts: formattedAttempts,
      pageToQuestionMap,
      reviewCases: allReviewCases,
    };
  }

  /**
   * Retrieves the current reconstruction for a script.
   */
  public async getReconstruction(scriptId: string, version?: number) {
    const script = await this.repo.findScriptForReconstruction(scriptId);
    if (!script) {
      throw new Error(`SCRIPT_NOT_FOUND: Answer sheet ${scriptId} not found`);
    }

    const reconstruction = await this.repo.findReconstruction(scriptId, version);
    if (!reconstruction) {
      return null;
    }

    return this.formatAnswerMap(script, reconstruction);
  }

  /**
   * Retrieves all attempts for a script.
   */
  public async getAttempts(scriptId: string) {
    const attempts = await this.repo.findAttemptsByScriptId(scriptId);
    return attempts;
  }

  /**
   * Retrieves a single attempt.
   */
  public async getAttemptById(attemptId: string) {
    const attempt = await this.repo.findAttemptById(attemptId);
    if (!attempt) {
      throw new Error(`ATTEMPT_NOT_FOUND: Question attempt ${attemptId} not found`);
    }
    return attempt;
  }

  /**
   * Manually resolves a question attempt review case with human audit provenance.
   */
  public async resolveAttempt(params: {
    attemptId: string;
    state?: QuestionAttemptState;
    questionId?: string;
    userId: string;
    reason: string;
    userContext?: {
      ipAddress?: string;
      userAgent?: string;
    };
  }) {
    const updated = await this.repo.updateAttemptResolution(params.attemptId, {
      state: params.state,
      questionId: params.questionId,
      resolvedByUserId: params.userId,
      resolutionReason: params.reason,
    });

    await AuditService.recordEvent({
      event: 'RECONSTRUCTION_RESOLVED',
      userId: params.userId,
      ipAddress: params.userContext?.ipAddress,
      userAgent: params.userContext?.userAgent,
      details: {
        attemptId: params.attemptId,
        newState: params.state,
        newQuestionId: params.questionId,
        reason: params.reason,
      },
    });

    return updated;
  }
}

export const reconstructionService = new ReconstructionService();
