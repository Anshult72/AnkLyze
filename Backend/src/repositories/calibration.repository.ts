import { prisma } from "../config/database";
import {
  CalibrationSet,
  CalibrationItem,
  CalibrationSession,
  CalibrationSubmission,
  CalibrationSetStatus,
  Prisma,
} from "@prisma/client";

export class CalibrationRepository {
  /**
   * Creates a new Calibration Set with items in a transaction
   */
  public static async createSet(params: {
    code: string;
    title: string;
    description?: string;
    examId?: string;
    subjectId?: string;
    createdById?: string;
    items: Array<{
      questionId?: string;
      sampleQuestionText: string;
      sampleAnswerText: string;
      maxMarks: number;
      referenceMarks: number;
      referenceCriteria: Array<{
        criterionId: string;
        criterionName: string;
        maxMarks: number;
        referenceMarks: number;
        rationale: string;
      }>;
      referenceEvidence?: string;
      explanation: string;
      orderIndex?: number;
    }>;
  }): Promise<CalibrationSet & { items: CalibrationItem[] }> {
    return prisma.$transaction(async (tx) => {
      const set = await tx.calibrationSet.create({
        data: {
          code: params.code,
          title: params.title,
          description: params.description || null,
          examId: params.examId || null,
          subjectId: params.subjectId || null,
          createdById: params.createdById || null,
          status: "APPROVED",
        },
      });

      const items = await Promise.all(
        params.items.map((item, idx) =>
          tx.calibrationItem.create({
            data: {
              calibrationSetId: set.id,
              questionId: item.questionId || null,
              sampleQuestionText: item.sampleQuestionText,
              sampleAnswerText: item.sampleAnswerText,
              maxMarks: item.maxMarks,
              referenceMarks: item.referenceMarks,
              referenceCriteriaJson: JSON.stringify(item.referenceCriteria),
              referenceEvidenceJson: item.referenceEvidence ? JSON.stringify(item.referenceEvidence) : null,
              explanation: item.explanation,
              orderIndex: item.orderIndex || idx + 1,
            },
          })
        )
      );

      return { ...set, items };
    });
  }

  /**
   * Lists Calibration Sets
   */
  public static async listSets(filters: {
    examId?: string;
    subjectId?: string;
    status?: CalibrationSetStatus;
  }) {
    const where: Prisma.CalibrationSetWhereInput = {};
    if (filters.examId) where.examId = filters.examId;
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.status) where.status = filters.status;

    return prisma.calibrationSet.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        exam: { select: { id: true, title: true, code: true } },
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { items: true, sessions: true } },
      },
    });
  }

  /**
   * Finds a calibration set by ID (full unredacted version for admins)
   */
  public static async findSetById(id: string) {
    return prisma.calibrationSet.findUnique({
      where: { id },
      include: {
        exam: true,
        subject: true,
        items: { orderBy: { orderIndex: "asc" } },
      },
    });
  }

  /**
   * Creates or gets a calibration session for an evaluator
   */
  public static async createOrGetSession(params: {
    calibrationSetId: string;
    evaluatorUserId: string;
  }): Promise<CalibrationSession & { calibrationSet: CalibrationSet }> {
    const existing = await prisma.calibrationSession.findUnique({
      where: {
        calibrationSetId_evaluatorUserId: {
          calibrationSetId: params.calibrationSetId,
          evaluatorUserId: params.evaluatorUserId,
        },
      },
      include: { calibrationSet: true },
    });

    if (existing) {
      return existing;
    }

    return prisma.calibrationSession.create({
      data: {
        calibrationSetId: params.calibrationSetId,
        evaluatorUserId: params.evaluatorUserId,
        status: "NOT_STARTED",
      },
      include: { calibrationSet: true },
    });
  }

  /**
   * Finds a calibration session with all items and submissions
   */
  public static async findSessionById(sessionId: string) {
    return prisma.calibrationSession.findUnique({
      where: { id: sessionId },
      include: {
        evaluatorUser: { select: { id: true, fullName: true, email: true } },
        calibrationSet: {
          include: {
            exam: true,
            subject: true,
            items: { orderBy: { orderIndex: "asc" } },
          },
        },
        submissions: {
          include: {
            item: true,
          },
        },
      },
    });
  }

  /**
   * Submits evaluation for a single calibration item
   */
  public static async submitItemEvaluation(params: {
    sessionId: string;
    itemId: string;
    awardedMarks: number;
    referenceMarks: number;
    markDelta: number;
    criteriaScores: Record<string, number>;
    feedbackNotes: string;
  }): Promise<CalibrationSubmission> {
    return prisma.$transaction(async (tx) => {
      // 1. Mark session as in progress
      await tx.calibrationSession.update({
        where: { id: params.sessionId },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });

      // 2. Upsert submission
      return tx.calibrationSubmission.upsert({
        where: {
          sessionId_itemId: {
            sessionId: params.sessionId,
            itemId: params.itemId,
          },
        },
        create: {
          sessionId: params.sessionId,
          itemId: params.itemId,
          awardedMarks: params.awardedMarks,
          referenceMarks: params.referenceMarks,
          markDelta: params.markDelta,
          criteriaScoresJson: JSON.stringify(params.criteriaScores),
          feedbackNotes: params.feedbackNotes,
        },
        update: {
          awardedMarks: params.awardedMarks,
          referenceMarks: params.referenceMarks,
          markDelta: params.markDelta,
          criteriaScoresJson: JSON.stringify(params.criteriaScores),
          feedbackNotes: params.feedbackNotes,
          submittedAt: new Date(),
        },
      });
    });
  }

  /**
   * Completes a calibration session with summary statistics
   */
  public static async completeSession(params: {
    sessionId: string;
    totalDeviation: number;
    criteriaMatchCount: number;
    criteriaTotalCount: number;
    feedbackSummary: string;
  }): Promise<CalibrationSession> {
    return prisma.calibrationSession.update({
      where: { id: params.sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        totalDeviation: params.totalDeviation,
        criteriaMatchCount: params.criteriaMatchCount,
        criteriaTotalCount: params.criteriaTotalCount,
        feedbackSummary: params.feedbackSummary,
      },
      include: {
        submissions: true,
        calibrationSet: true,
      },
    });
  }

  /**
   * Redacts protected reference marks from calibration items when served to active evaluators
   */
  public static redactReferenceData(item: CalibrationItem): Omit<CalibrationItem, "referenceMarks" | "referenceCriteriaJson" | "referenceEvidenceJson" | "explanation"> & {
    rubricCriteria: Array<{ criterionId: string; criterionName: string; maxMarks: number }>;
  } {
    let rubricCriteria: Array<{ criterionId: string; criterionName: string; maxMarks: number }> = [];
    try {
      const parsed = JSON.parse(item.referenceCriteriaJson);
      rubricCriteria = parsed.map((c: { criterionId: string; criterionName: string; maxMarks: number }) => ({
        criterionId: c.criterionId,
        criterionName: c.criterionName,
        maxMarks: c.maxMarks,
      }));
    } catch {
      rubricCriteria = [];
    }

    return {
      id: item.id,
      calibrationSetId: item.calibrationSetId,
      questionId: item.questionId,
      sampleQuestionText: item.sampleQuestionText,
      sampleAnswerText: item.sampleAnswerText,
      maxMarks: item.maxMarks,
      orderIndex: item.orderIndex,
      createdAt: item.createdAt,
      rubricCriteria,
    };
  }
}
