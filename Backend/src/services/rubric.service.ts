import { rubricRepository } from '../repositories/rubric.repository';
import { aiService } from '../ai/aiService';
import { RubricAnalysisInput } from '../ai/types';
import { AuditService } from './audit.service';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

// In-memory set to prevent concurrent analysis requests on the same marking scheme
const activeAnalysesInProgress = new Set<string>();

export class RubricService {
  /**
   * Triggers an AI rubric analysis for a human marking scheme
   */
  async analyzeMarkingScheme(
    markingSchemeId: string,
    userId: string,
    auditContext?: { ip?: string; userAgent?: string }
  ) {
    // 1. Concurrency control: prevent duplicate simultaneous analyses on the same scheme
    if (activeAnalysesInProgress.has(markingSchemeId)) {
      throw new AppError(
        'An AI rubric analysis is already currently in progress for this marking scheme.',
        409
      );
    }

    // 2. Fetch context
    const scheme = await rubricRepository.findSchemeWithFullContext(markingSchemeId);
    if (!scheme) {
      throw new AppError(`Marking scheme not found with ID: ${markingSchemeId}`, 404);
    }

    if (!scheme.subject || !scheme.subject.questions || scheme.subject.questions.length === 0) {
      throw new AppError(
        'Cannot analyze marking scheme: Subject has no defined questions.',
        400
      );
    }

    activeAnalysesInProgress.add(markingSchemeId);

    // 3. Audit request
    await AuditService.recordEvent({
      event: 'RUBRIC_ANALYSIS_REQUESTED',
      userId,
      ipAddress: auditContext?.ip,
      userAgent: auditContext?.userAgent,
      details: {
        markingSchemeId,
        subjectId: scheme.subjectId,
        questionCount: scheme.subject.questions.length,
      },
    });

    const nextVersion = (await rubricRepository.getLatestAnalysisVersion(markingSchemeId)) + 1;

    // 4. Construct typed AI input
    const aiInput: RubricAnalysisInput = {
      subject: {
        code: scheme.subject.code,
        name: scheme.subject.name,
      },
      examTitle: scheme.subject.exam.title,
      markingScheme: {
        id: scheme.id,
        version: scheme.version,
        instructions: scheme.instructions || undefined,
        totalMarks: scheme.subject.questions.reduce((sum: number, q) => sum + q.maximumMarks, 0),
      },
      questions: scheme.subject.questions.map((q) => ({
        id: q.id,
        questionNumber: q.questionNumber,
        text: q.questionText,
        maxMarks: q.maximumMarks,
        humanCriteria: q.criteria.map((c) => ({
          name: c.name,
          description: c.description || '',
          maxMarks: c.maximumMarks,
          orderIndex: c.orderIndex,
        })),
      })),
    };

    try {
      // 5. Call AI Engine
      const normalizedResult = await aiService.analyzeMarkingScheme(aiInput);

      // 6. Persist to Database
      const persistedAnalysis = await rubricRepository.createAnalysisRecord(
        markingSchemeId,
        nextVersion,
        normalizedResult
      );

      // 7. Audit success & fallback
      if (normalizedResult.fallbackUsed) {
        await AuditService.recordEvent({
          event: 'RUBRIC_ANALYSIS_FALLBACK_USED',
          userId,
          ipAddress: auditContext?.ip,
          userAgent: auditContext?.userAgent,
          details: {
            analysisId: persistedAnalysis.id,
            markingSchemeId,
            provider: normalizedResult.provider,
            model: normalizedResult.model,
          },
        });
      }

      await AuditService.recordEvent({
        event: 'RUBRIC_ANALYSIS_COMPLETED',
        userId,
        ipAddress: auditContext?.ip,
        userAgent: auditContext?.userAgent,
        details: {
          analysisId: persistedAnalysis.id,
          markingSchemeId,
          version: nextVersion,
          confidence: normalizedResult.confidence,
          confidenceBand: normalizedResult.confidenceBand,
          overallStatus: normalizedResult.overallStatus,
          provider: normalizedResult.provider,
          model: normalizedResult.model,
        },
      });

      return await rubricRepository.findAnalysisById(persistedAnalysis.id);
    } catch (err: any) {
      logger.error({ err, markingSchemeId }, 'Rubric analysis execution failed');

      // Safely persist failed attempt record
      await rubricRepository.createFailedAnalysisRecord(
        markingSchemeId,
        nextVersion,
        'ai-engine',
        'unknown',
        'rubric-analysis-v1',
        err.message || 'Unknown AI error',
        false
      );

      await AuditService.recordEvent({
        event: 'RUBRIC_ANALYSIS_FAILED',
        userId,
        ipAddress: auditContext?.ip,
        userAgent: auditContext?.userAgent,
        details: {
          markingSchemeId,
          version: nextVersion,
          error: err.message,
        },
      });

      throw new AppError(`AI rubric analysis failed: ${err.message}`, 502);
    } finally {
      activeAnalysesInProgress.delete(markingSchemeId);
    }
  }

  /**
   * Request re-analysis, creating a new version without overwriting past analyses
   */
  async reanalyzeMarkingScheme(
    markingSchemeId: string,
    userId: string,
    auditContext?: { ip?: string; userAgent?: string }
  ) {
    await AuditService.recordEvent({
      event: 'RUBRIC_REANALYSIS_REQUESTED',
      userId,
      ipAddress: auditContext?.ip,
      userAgent: auditContext?.userAgent,
      details: { markingSchemeId },
    });

    return this.analyzeMarkingScheme(markingSchemeId, userId, auditContext);
  }

  /**
   * Fetches all analyses versions for a marking scheme
   */
  async getAnalysesBySchemeId(markingSchemeId: string) {
    return rubricRepository.findAnalysesBySchemeId(markingSchemeId);
  }

  /**
   * Fetches detailed analysis by ID
   */
  async getAnalysisById(
    analysisId: string,
    userId?: string,
    auditContext?: { ip?: string; userAgent?: string }
  ) {
    const analysis = await rubricRepository.findAnalysisById(analysisId);
    if (!analysis) {
      throw new AppError(`Rubric analysis not found with ID: ${analysisId}`, 404);
    }

    if (userId) {
      await AuditService.recordEvent({
        event: 'RUBRIC_REVIEWED',
        userId,
        ipAddress: auditContext?.ip,
        userAgent: auditContext?.userAgent,
        details: { analysisId, version: analysis.version },
      });
    }

    return analysis;
  }

  /**
   * Modifies an AI criterion with human provenance tracking
   */
  async modifyCriterion(
    criterionId: string,
    data: {
      name?: string;
      description?: string;
      maxMarks?: number;
      partialCreditAllowed?: boolean;
      alternateMethodAccepted?: boolean;
      orderIndex?: number;
      reason?: string;
    },
    userId: string,
    auditContext?: { ip?: string; userAgent?: string }
  ) {
    const updated = await rubricRepository.updateCriterionWithProvenance(criterionId, {
      ...data,
      userId,
    });

    await AuditService.recordEvent({
      event: 'RUBRIC_MODIFIED',
      userId,
      ipAddress: auditContext?.ip,
      userAgent: auditContext?.userAgent,
      details: {
        criterionId,
        modifiedFields: Object.keys(data).filter((k) => k !== 'reason'),
        reason: data.reason,
      },
    });

    return updated;
  }

  /**
   * Human approval of rubric analysis
   */
  async approveAnalysis(
    analysisId: string,
    userId: string,
    auditContext?: { ip?: string; userAgent?: string }
  ) {
    const analysis = await rubricRepository.findAnalysisById(analysisId);
    if (!analysis) {
      throw new AppError(`Rubric analysis not found with ID: ${analysisId}`, 404);
    }

    if (analysis.overallStatus === 'FAILED') {
      throw new AppError('Cannot approve a failed rubric analysis.', 400);
    }

    if (analysis.overallStatus === 'APPROVED') {
      throw new AppError('This rubric analysis is already approved.', 409);
    }

    // Build question map to validate question max marks
    const questions = analysis.markingScheme.subject.questions;
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Validate that questions have criteria and criterion mark totals match question max marks
    for (const q of analysis.questions) {
      if (!q.criteria || q.criteria.length === 0) {
        throw new AppError(
          `Cannot approve rubric: Question ${q.questionNumber} has no criteria defined.`,
          400
        );
      }

      const originalQuestion = questionMap.get(q.questionId);
      const expectedMarks = originalQuestion ? originalQuestion.maximumMarks : 0;

      const criteriaSum = q.criteria.reduce((sum: number, c: { maximumMarks: number }) => sum + c.maximumMarks, 0);
      const roundedCriteriaSum = Math.round(criteriaSum * 100) / 100;
      const roundedExpectedMarks = Math.round(expectedMarks * 100) / 100;

      if (expectedMarks > 0 && Math.abs(roundedCriteriaSum - roundedExpectedMarks) > 0.001) {
        throw new AppError(
          `Cannot approve rubric: Criteria mark sum (${roundedCriteriaSum}) does not match Question ${originalQuestion?.questionNumber || q.questionNumber} maximum marks (${roundedExpectedMarks}). Please resolve mark mismatch before approving.`,
          400
        );
      }
    }

    const approved = await rubricRepository.approveAnalysis(analysisId, userId);

    await AuditService.recordEvent({
      event: 'RUBRIC_APPROVED',
      userId,
      ipAddress: auditContext?.ip,
      userAgent: auditContext?.userAgent,
      details: {
        analysisId,
        version: analysis.version,
        markingSchemeId: analysis.markingSchemeId,
      },
    });

    return approved;
  }

  /**
   * Rejects an AI rubric analysis
   */
  async rejectAnalysis(
    analysisId: string,
    reason: string,
    userId: string,
    auditContext?: { ip?: string; userAgent?: string }
  ) {
    const analysis = await rubricRepository.findAnalysisById(analysisId);
    if (!analysis) {
      throw new AppError(`Rubric analysis not found with ID: ${analysisId}`, 404);
    }

    if (!reason || reason.trim().length === 0) {
      throw new AppError('A rejection reason must be provided.', 400);
    }

    const rejected = await rubricRepository.rejectAnalysis(analysisId, reason);

    await AuditService.recordEvent({
      event: 'RUBRIC_REJECTED',
      userId,
      ipAddress: auditContext?.ip,
      userAgent: auditContext?.userAgent,
      details: {
        analysisId,
        version: analysis.version,
        reason,
      },
    });

    return rejected;
  }

  /**
   * Resolves a flagged ambiguity or incomplete rule
   */
  async resolveIssue(
    issueId: string,
    userId: string,
    notes?: string
  ) {
    return rubricRepository.resolveIssue(issueId, userId, notes);
  }
}

export const rubricService = new RubricService();
