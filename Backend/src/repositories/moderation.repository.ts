import { prisma } from "../config/database";
import {
  ModerationCase,
  ModerationDecision,
  ModerationPriority,
  ModerationStatus,
  ModerationResolutionType,
  Prisma,
} from "@prisma/client";

export class ModerationRepository {
  /**
   * Generates a human-readable unique case number
   */
  public static async generateCaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.moderationCase.count();
    const sequence = (count + 1).toString().padStart(4, "0");
    return `MOD-${year}-${sequence}`;
  }

  /**
   * Creates a new moderation case inside a transaction
   */
  public static async createCase(data: {
    questionAttemptId: string;
    evaluationId?: string;
    riskAssessmentId?: string;
    doubleEvaluationResultId?: string;
    priority: ModerationPriority;
    triggerReason: string;
    createdById?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ModerationCase> {
    const caseNumber = await this.generateCaseNumber();

    return prisma.moderationCase.create({
      data: {
        caseNumber,
        questionAttemptId: data.questionAttemptId,
        evaluationId: data.evaluationId || null,
        riskAssessmentId: data.riskAssessmentId || null,
        doubleEvaluationResultId: data.doubleEvaluationResultId || null,
        priority: data.priority,
        triggerReason: data.triggerReason,
        status: "OPEN",
        createdById: data.createdById || null,
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
      },
      include: {
        questionAttempt: {
          include: {
            question: true,
            script: true,
          },
        },
      },
    });
  }

  /**
   * Finds an existing case for a question attempt
   */
  public static async findOpenCaseByAttempt(questionAttemptId: string): Promise<ModerationCase | null> {
    return prisma.moderationCase.findFirst({
      where: {
        questionAttemptId,
        status: { in: ["OPEN", "ASSIGNED", "IN_REVIEW", "ESCALATED"] },
      },
      include: {
        decisions: true,
      },
    });
  }

  /**
   * Fetches a case by ID with full inspection graph
   */
  public static async findCaseById(id: string) {
    return prisma.moderationCase.findUnique({
      where: { id },
      include: {
        assignedModerator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        decisions: {
          orderBy: { version: "desc" },
          include: {
            moderatorUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        questionAttempt: {
          include: {
            question: {
              include: {
                criteria: { orderBy: { orderIndex: "asc" } },
                subject: { include: { exam: true } },
              },
            },
            script: {
              include: {
                pages: { orderBy: { pageNumber: "asc" } },
              },
            },
            evaluations: {
              orderBy: { version: "desc" },
              include: {
                criterionResults: {
                  include: {
                    evidence: true,
                  },
                },
                decisionHistory: {
                  orderBy: { version: "desc" },
                  include: {
                    examinerUser: {
                      select: { id: true, fullName: true, email: true },
                    },
                    criteriaDecisions: true,
                  },
                },
              },
            },
            riskAssessments: {
              orderBy: { version: "desc" },
              include: {
                factors: true,
              },
            },
            evaluationRounds: {
              orderBy: { roundNumber: "asc" },
              include: {
                evaluatorUser: {
                  select: { id: true, fullName: true, email: true },
                },
              },
            },
            doubleEvaluationResult: true,
          },
        },
      },
    });
  }

  /**
   * Lists moderation cases with sorting and filtering
   * Default ordering: CRITICAL -> HIGH -> MEDIUM -> LOW, then oldest unresolved
   */
  public static async listCases(filters: {
    status?: ModerationStatus;
    priority?: ModerationPriority;
    assignedModeratorId?: string;
    questionAttemptId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ModerationCaseWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedModeratorId) where.assignedModeratorId = filters.assignedModeratorId;
    if (filters.questionAttemptId) where.questionAttemptId = filters.questionAttemptId;

    const [total, cases] = await Promise.all([
      prisma.moderationCase.count({ where }),
      prisma.moderationCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: "asc" }, // Enum order is CRITICAL, HIGH, MEDIUM, LOW
          { createdAt: "asc" }, // Oldest first
        ],
        include: {
          assignedModerator: {
            select: { id: true, fullName: true, email: true },
          },
          questionAttempt: {
            include: {
              question: {
                select: {
                  id: true,
                  questionNumber: true,
                  maximumMarks: true,
                  section: true,
                  subject: {
                    select: { name: true, code: true },
                  },
                },
              },
              script: {
                select: { id: true, scriptCode: true },
              },
              riskAssessments: {
                take: 1,
                orderBy: { version: "desc" },
                select: { overallRiskScore: true, riskBand: true },
              },
            },
          },
        },
      }),
    ]);

    return { total, page, limit, cases };
  }

  /**
   * Assigns a case to a moderator
   */
  public static async assignModerator(
    caseId: string,
    moderatorId: string
  ): Promise<ModerationCase> {
    return prisma.moderationCase.update({
      where: { id: caseId },
      data: {
        assignedModeratorId: moderatorId,
        status: "ASSIGNED",
      },
      include: {
        assignedModerator: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  /**
   * Starts review on an assigned case
   */
  public static async startReview(caseId: string): Promise<ModerationCase> {
    return prisma.moderationCase.update({
      where: { id: caseId },
      data: {
        status: "IN_REVIEW",
      },
    });
  }

  /**
   * Resolves a moderation case with an immutable ModerationDecision record
   */
  public static async resolveCase(params: {
    caseId: string;
    resolutionType: ModerationResolutionType;
    marksBefore: number;
    marksAfter: number;
    reason: string;
    moderatorUserId: string;
    criterionOverrides?: Array<{
      criterionId: string;
      criterionName: string;
      marksAwarded: number;
      comment?: string;
    }>;
    notes?: string;
  }): Promise<{ case: ModerationCase; decision: ModerationDecision }> {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch case and determine version
      const existingCase = await tx.moderationCase.findUnique({
        where: { id: params.caseId },
        include: { decisions: { orderBy: { version: "desc" }, take: 1 } },
      });

      if (!existingCase) {
        throw new Error(`Moderation case ${params.caseId} not found`);
      }

      const nextVersion = (existingCase.decisions[0]?.version || 0) + 1;
      const previousDecisionId = existingCase.decisions[0]?.id || null;
      const delta = params.marksAfter - params.marksBefore;

      // 2. Create immutable ModerationDecision record
      const decision = await tx.moderationDecision.create({
        data: {
          moderationCaseId: params.caseId,
          version: nextVersion,
          decisionType: params.resolutionType,
          marksBefore: params.marksBefore,
          marksAfter: params.marksAfter,
          delta,
          reason: params.reason,
          moderatorUserId: params.moderatorUserId,
          previousDecisionId,
          criterionOverridesJson: params.criterionOverrides
            ? JSON.stringify(params.criterionOverrides)
            : null,
          metadataJson: JSON.stringify({
            resolvedAt: new Date().toISOString(),
            notes: params.notes || null,
          }),
        },
      });

      // 3. Update ModerationCase status
      const updatedCase = await tx.moderationCase.update({
        where: { id: params.caseId },
        data: {
          status: "RESOLVED",
          resolutionType: params.resolutionType,
          resolutionNotes: params.reason,
          resolvedAt: new Date(),
        },
        include: {
          assignedModerator: { select: { id: true, fullName: true, email: true } },
          decisions: true,
        },
      });

      return { case: updatedCase, decision };
    });
  }

  /**
   * Escalates a moderation case to Head Examiner
   */
  public static async escalateCase(params: {
    caseId: string;
    reason: string;
    moderatorUserId: string;
  }): Promise<ModerationCase> {
    return prisma.moderationCase.update({
      where: { id: params.caseId },
      data: {
        status: "ESCALATED",
        resolutionNotes: `Escalated: ${params.reason}`,
      },
    });
  }

  /**
   * Summary metrics for moderation queue
   */
  public static async getModerationSummary() {
    const [totalCases, openCases, inReviewCases, resolvedCases, escalatedCases, criticalCount, highCount] =
      await Promise.all([
        prisma.moderationCase.count(),
        prisma.moderationCase.count({ where: { status: "OPEN" } }),
        prisma.moderationCase.count({ where: { status: "IN_REVIEW" } }),
        prisma.moderationCase.count({ where: { status: "RESOLVED" } }),
        prisma.moderationCase.count({ where: { status: "ESCALATED" } }),
        prisma.moderationCase.count({ where: { priority: "CRITICAL", status: { not: "RESOLVED" } } }),
        prisma.moderationCase.count({ where: { priority: "HIGH", status: { not: "RESOLVED" } } }),
      ]);

    return {
      totalCases,
      openCases,
      inReviewCases,
      resolvedCases,
      escalatedCases,
      criticalBacklog: criticalCount,
      highBacklog: highCount,
      activeBacklog: openCases + inReviewCases + escalatedCases,
    };
  }
}
