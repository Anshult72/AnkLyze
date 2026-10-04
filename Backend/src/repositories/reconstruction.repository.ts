/**
 * ANKLYZE Phase 9 - Answer Reconstruction Repository
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Versioned reconstruction results (v1, v2) preserving full historical audit trail.
 * - Stores structured question attempts, attempt-to-page mappings, and answer regions.
 * - Human override records original system decision, resolver ID, reason, and timestamp.
 * - Strictly NO marks, NO answer grading.
 */

import { prisma } from '../config/database';
import {
  QuestionAttemptState,
  ReconstructionStatus,
} from '@prisma/client';

export interface CreateAttemptInput {
  questionId: string;
  attemptIndex: number;
  state: QuestionAttemptState;
  detectedQuestionLabel?: string;
  confidence: number;
  startPageNumber: number;
  endPageNumber: number;
  reconstructionReason?: string;
  pages: Array<{
    pageId: string;
    pageNumber: number;
    pageOrder: number;
    isContinuation: boolean;
    regionJson?: string;
  }>;
  regions?: Array<{
    pageId: string;
    pageNumber: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    coordinateSystem?: string;
    confidence: number;
    label?: string;
  }>;
}

export interface CreateReconstructionInput {
  scriptId: string;
  status: ReconstructionStatus;
  pipelineVersion: string;
  ocrVersion: number;
  provider?: string;
  model?: string;
  promptVersion?: string;
  fallbackUsed?: boolean;
  confidence: number;
  attemptsCount: number;
  reviewCasesCount: number;
  notes?: string;
  metadata?: string;
  attempts: CreateAttemptInput[];
}

export class ReconstructionRepository {
  /**
   * Retrieves full script context required for reconstruction:
   * Exam, Subject (with Question paper definitions), and Pages (with latest OCR results).
   */
  public async findScriptForReconstruction(scriptId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scriptId);
    return prisma.answerScript.findFirst({
      where: isUuid ? { id: scriptId } : { scriptCode: scriptId },
      include: {
        exam: {
          select: { id: true, code: true, title: true },
        },
        subject: {
          include: {
            questions: {
              where: { isArchived: false },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        pages: {
          orderBy: { pageNumber: 'asc' },
          include: {
            ocrResults: {
              orderBy: { version: 'desc' },
              take: 1,
            },
          },
        },
        reconstructions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * Finds latest version number for a script's reconstructions.
   */
  public async getLatestVersion(scriptId: string): Promise<number> {
    const latest = await prisma.scriptReconstruction.findFirst({
      where: { scriptId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return latest?.version ?? 0;
  }

  /**
   * Persists a versioned reconstruction result with its attempts, pages, and regions.
   */
  public async createReconstruction(input: CreateReconstructionInput) {
    const nextVersion = (await this.getLatestVersion(input.scriptId)) + 1;

    return prisma.$transaction(async (tx) => {
      const reconstruction = await tx.scriptReconstruction.create({
        data: {
          scriptId: input.scriptId,
          version: nextVersion,
          status: input.status,
          pipelineVersion: input.pipelineVersion,
          ocrVersion: input.ocrVersion,
          provider: input.provider,
          model: input.model,
          promptVersion: input.promptVersion,
          fallbackUsed: input.fallbackUsed ?? false,
          confidence: input.confidence,
          attemptsCount: input.attemptsCount,
          reviewCasesCount: input.reviewCasesCount,
          notes: input.notes,
          metadata: input.metadata,
        },
      });

      // Track attempt indices per questionId to prevent unique constraint violation
      const attemptIndexMap = new Map<string, number>();

      for (const att of input.attempts) {
        const nextIndex = (attemptIndexMap.get(att.questionId) || 0) + 1;
        attemptIndexMap.set(att.questionId, nextIndex);

        const createdAttempt = await tx.questionAttempt.create({
          data: {
            reconstructionId: reconstruction.id,
            scriptId: input.scriptId,
            questionId: att.questionId,
            attemptIndex: nextIndex,
            state: att.state,
            detectedQuestionLabel: att.detectedQuestionLabel,
            confidence: att.confidence,
            startPageNumber: att.startPageNumber,
            endPageNumber: att.endPageNumber,
            reconstructionReason: att.reconstructionReason,
            originalSystemState: att.state,
          },
        });

        // Insert attempt pages with de-duplication by pageId to satisfy @@unique([attemptId, pageId])
        if (att.pages && att.pages.length > 0) {
          const uniquePagesMap = new Map<string, any>();
          for (const p of att.pages) {
            if (!uniquePagesMap.has(p.pageId)) {
              uniquePagesMap.set(p.pageId, p);
            }
          }
          const uniquePages = Array.from(uniquePagesMap.values());

          await tx.questionAttemptPage.createMany({
            data: uniquePages.map((p, idx) => ({
              attemptId: createdAttempt.id,
              pageId: p.pageId,
              pageNumber: p.pageNumber,
              pageOrder: idx + 1,
              isContinuation: p.isContinuation,
              regionJson: p.regionJson,
            })),
          });
        }

        // Insert answer regions if any
        if (att.regions && att.regions.length > 0) {
          await tx.answerRegion.createMany({
            data: att.regions.map((r) => ({
              attemptId: createdAttempt.id,
              pageId: r.pageId,
              pageNumber: r.pageNumber,
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              coordinateSystem: r.coordinateSystem || 'NORMALIZED_0_1',
              confidence: r.confidence,
              label: r.label,
            })),
          });
        }
      }

      // Update script's reconstruction status
      await tx.answerScript.update({
        where: { id: input.scriptId },
        data: {
          reconstructionStatus: input.status,
        },
      });

      return tx.scriptReconstruction.findUnique({
        where: { id: reconstruction.id },
        include: {
          attempts: {
            include: {
              question: true,
              pages: {
                orderBy: { pageOrder: 'asc' },
              },
              regions: true,
            },
          },
        },
      });
    });
  }

  /**
   * Retrieves a reconstruction for a script, optionally specifying version.
   * If version not specified, returns latest.
   */
  public async findReconstruction(scriptId: string, version?: number) {
    if (version) {
      return prisma.scriptReconstruction.findUnique({
        where: {
          scriptId_version: {
            scriptId,
            version,
          },
        },
        include: {
          attempts: {
            orderBy: [{ question: { orderIndex: 'asc' } }, { attemptIndex: 'asc' }],
            include: {
              question: true,
              pages: {
                orderBy: { pageOrder: 'asc' },
              },
              regions: true,
            },
          },
        },
      });
    }

    return prisma.scriptReconstruction.findFirst({
      where: { scriptId },
      orderBy: { version: 'desc' },
      include: {
        attempts: {
          orderBy: [{ question: { orderIndex: 'asc' } }, { attemptIndex: 'asc' }],
          include: {
            question: true,
            pages: {
              orderBy: { pageOrder: 'asc' },
            },
            regions: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves all attempts for a given script (from its latest reconstruction).
   */
  public async findAttemptsByScriptId(scriptId: string) {
    const latestRecon = await prisma.scriptReconstruction.findFirst({
      where: { scriptId },
      orderBy: { version: 'desc' },
      select: { id: true },
    });

    if (!latestRecon) return [];

    return prisma.questionAttempt.findMany({
      where: { reconstructionId: latestRecon.id },
      orderBy: [{ question: { orderIndex: 'asc' } }, { attemptIndex: 'asc' }],
      include: {
        question: true,
        pages: {
          orderBy: { pageOrder: 'asc' },
        },
        regions: true,
      },
    });
  }

  /**
   * Retrieves a single attempt by ID.
   */
  public async findAttemptById(attemptId: string) {
    return prisma.questionAttempt.findUnique({
      where: { id: attemptId },
      include: {
        question: true,
        pages: {
          orderBy: { pageOrder: 'asc' },
        },
        regions: true,
        reconstruction: true,
        resolvedByUser: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  /**
   * Updates an attempt manually (Human resolution).
   * Preserves original system state and records resolution provenance.
   */
  public async updateAttemptResolution(
    attemptId: string,
    params: {
      state?: QuestionAttemptState;
      questionId?: string;
      resolvedByUserId: string;
      resolutionReason: string;
    }
  ) {
    const existing = await prisma.questionAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!existing) {
      throw new Error(`ATTEMPT_NOT_FOUND: Question attempt ${attemptId} not found`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.questionAttempt.update({
        where: { id: attemptId },
        data: {
          state: params.state ?? existing.state,
          questionId: params.questionId ?? existing.questionId,
          originalSystemState: existing.originalSystemState ?? existing.state,
          originalQuestionId: existing.originalQuestionId ?? existing.questionId,
          resolvedByUserId: params.resolvedByUserId,
          resolutionReason: params.resolutionReason,
          resolvedAt: new Date(),
        },
        include: {
          question: true,
          pages: {
            orderBy: { pageOrder: 'asc' },
          },
          regions: true,
          resolvedByUser: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      // Re-evaluate reconstruction overall status
      const remainingUnresolved = await tx.questionAttempt.count({
        where: {
          reconstructionId: existing.reconstructionId,
          state: QuestionAttemptState.REQUIRES_REVIEW,
        },
      });

      const newStatus =
        remainingUnresolved === 0
          ? ReconstructionStatus.COMPLETED
          : ReconstructionStatus.NEEDS_REVIEW;

      await tx.scriptReconstruction.update({
        where: { id: existing.reconstructionId },
        data: {
          status: newStatus,
          reviewCasesCount: remainingUnresolved,
        },
      });

      await tx.answerScript.update({
        where: { id: existing.scriptId },
        data: { reconstructionStatus: newStatus },
      });

      return updated;
    });
  }

  /**
   * Links a supplementary script to a main answer script.
   */
  public async linkSupplementaryScript(params: {
    mainScriptId: string;
    supplementaryScriptId: string;
    barcodeValue?: string;
    status?: 'LINKED' | 'NEEDS_REVIEW';
    sequenceOrder?: number;
    linkedByUserId?: string;
    notes?: string;
  }) {
    return prisma.supplementaryScriptLink.upsert({
      where: { supplementaryScriptId: params.supplementaryScriptId },
      create: {
        mainScriptId: params.mainScriptId,
        supplementaryScriptId: params.supplementaryScriptId,
        barcodeValue: params.barcodeValue,
        status: params.status || 'LINKED',
        sequenceOrder: params.sequenceOrder || 1,
        linkedByUserId: params.linkedByUserId,
        notes: params.notes,
      },
      update: {
        mainScriptId: params.mainScriptId,
        barcodeValue: params.barcodeValue,
        status: params.status || 'LINKED',
        sequenceOrder: params.sequenceOrder || 1,
        linkedByUserId: params.linkedByUserId,
        notes: params.notes,
      },
    });
  }

  /**
   * Retrieves supplementary script links for a main script.
   */
  public async findSupplementaryLinks(mainScriptId: string) {
    return prisma.supplementaryScriptLink.findMany({
      where: { mainScriptId },
      orderBy: { sequenceOrder: 'asc' },
      include: {
        supplementaryScript: {
          select: {
            id: true,
            scriptCode: true,
            pageCount: true,
            status: true,
            reconstructionStatus: true,
          },
        },
      },
    });
  }
}

export const reconstructionRepository = new ReconstructionRepository();
