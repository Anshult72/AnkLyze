import {
  PrismaClient,
  ResultStatus,
  ResultValidationStatus,
  ResultValidationSeverity,
  RevaluationScope,
  RevaluationStatus,
} from "@prisma/client";
import { prisma } from "../config/database";

export class ResultRepository {
  private db: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.db = client;
  }

  async findResultById(id: string) {
    return this.db.examinationResult.findUnique({
      where: { id },
      include: {
        exam: true,
        subject: true,
        script: {
          include: {
            reconstructions: {
              where: { status: "COMPLETED" },
              orderBy: { version: "desc" },
              take: 1,
              include: {
                attempts: {
                  include: {
                    question: true,
                    evaluations: {
                      include: {
                        decisionHistory: {
                          orderBy: { version: "desc" },
                          take: 1,
                          include: { criteriaDecisions: true },
                        },
                      },
                    },
                    moderationCases: {
                      include: { decisions: { orderBy: { version: "desc" } } },
                    },
                  },
                },
              },
            },
          },
        },
        approvedBy: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        supersedesResult: true,
        supersededBy: true,
        questionMarks: {
          include: {
            questionAttempt: {
              include: {
                question: true,
              },
            },
          },
          orderBy: { questionNumber: "asc" },
        },
        validations: {
          orderBy: { validationVersion: "desc" },
          take: 5,
          include: {
            issues: true,
          },
        },
        revaluationRequests: {
          orderBy: { createdAt: "desc" },
          include: {
            requestedBy: { select: { id: true, fullName: true, email: true } },
            reviewedBy: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
  }

  async findLatestResultByScript(scriptId: string) {
    return this.db.examinationResult.findFirst({
      where: { scriptId },
      orderBy: { version: "desc" },
      include: {
        questionMarks: true,
        validations: {
          orderBy: { validationVersion: "desc" },
          take: 1,
          include: { issues: true },
        },
      },
    });
  }

  async findResultByScriptAndVersion(scriptId: string, version: number) {
    return this.db.examinationResult.findUnique({
      where: {
        scriptId_version: { scriptId, version },
      },
      include: {
        exam: true,
        subject: true,
        script: true,
        approvedBy: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        questionMarks: {
          include: {
            questionAttempt: {
              include: { question: true },
            },
          },
        },
        validations: {
          orderBy: { validationVersion: "desc" },
          take: 1,
          include: { issues: true },
        },
      },
    });
  }

  async listResults(filters: {
    examId?: string;
    subjectId?: string;
    scriptId?: string;
    status?: ResultStatus;
    validationStatus?: ResultValidationStatus;
    page?: number;
    limit?: number;
  }) {
    const { examId, subjectId, scriptId, status, validationStatus, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (examId) where.examId = examId;
    if (subjectId) where.subjectId = subjectId;
    if (scriptId) where.scriptId = scriptId;
    if (status) where.status = status;
    if (validationStatus) where.validationStatus = validationStatus;

    const [items, total] = await Promise.all([
      this.db.examinationResult.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { version: "desc" }],
        include: {
          exam: { select: { id: true, title: true, code: true } },
          subject: { select: { id: true, name: true, code: true } },
          script: { select: { id: true, scriptCode: true, originalFilename: true } },
          approvedBy: { select: { id: true, fullName: true } },
          _count: {
            select: { questionMarks: true, validations: true, revaluationRequests: true },
          },
        },
      }),
      this.db.examinationResult.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createResultWithQuestionMarks(data: {
    examId: string;
    subjectId: string;
    scriptId: string;
    version: number;
    status: ResultStatus;
    totalMarks: number;
    maximumMarks: number;
    percentage: number;
    resultCode?: string;
    validationStatus: ResultValidationStatus;
    fingerprint?: string;
    supersedesResultId?: string;
    questionMarks: Array<{
      questionAttemptId: string;
      questionNumber: string;
      maximumMarks: number;
      awardedMarks: number;
      sourceDecisionId?: string;
      sourceModerationDecisionId?: string;
      status?: string;
    }>;
  }) {
    return this.db.$transaction(async (tx) => {
      // If creating a new version that supersedes an existing result, update previous status
      if (data.supersedesResultId) {
        await tx.examinationResult.update({
          where: { id: data.supersedesResultId },
          data: { status: "SUPERSEDED" },
        });
      }

      const result = await tx.examinationResult.create({
        data: {
          examId: data.examId,
          subjectId: data.subjectId,
          scriptId: data.scriptId,
          version: data.version,
          status: data.status,
          totalMarks: data.totalMarks,
          maximumMarks: data.maximumMarks,
          percentage: data.percentage,
          resultCode: data.resultCode,
          validationStatus: data.validationStatus,
          fingerprint: data.fingerprint,
          supersedesResultId: data.supersedesResultId,
          questionMarks: {
            create: data.questionMarks.map((qm) => ({
              questionAttemptId: qm.questionAttemptId,
              questionNumber: qm.questionNumber,
              maximumMarks: qm.maximumMarks,
              awardedMarks: qm.awardedMarks,
              sourceDecisionId: qm.sourceDecisionId,
              sourceModerationDecisionId: qm.sourceModerationDecisionId,
              status: qm.status || "FINAL",
            })),
          },
        },
        include: {
          questionMarks: true,
        },
      });

      return result;
    });
  }

  async recordValidationRun(data: {
    resultId: string;
    validationVersion: number;
    status: ResultValidationStatus;
    passed: Boolean;
    issues: Array<{
      ruleCode: string;
      severity: ResultValidationSeverity;
      message: string;
      entityType?: string;
      entityId?: string;
      blocking: boolean;
    }>;
  }) {
    return this.db.$transaction(async (tx) => {
      const validation = await tx.resultValidation.create({
        data: {
          resultId: data.resultId,
          validationVersion: data.validationVersion,
          status: data.status,
          passed: Boolean(data.passed),
          issues: {
            create: data.issues.map((iss) => ({
              ruleCode: iss.ruleCode,
              severity: iss.severity,
              message: iss.message,
              entityType: iss.entityType,
              entityId: iss.entityId,
              blocking: iss.blocking,
            })),
          },
        },
        include: {
          issues: true,
        },
      });

      // Update examination result status based on validation result
      const newResultStatus: ResultStatus = validation.passed ? "VALIDATED" : "BLOCKED";
      await tx.examinationResult.update({
        where: { id: data.resultId },
        data: {
          validationStatus: data.status,
          status: newResultStatus,
        },
      });

      return validation;
    });
  }

  async approveResult(id: string, approvedById: string) {
    return this.db.examinationResult.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById,
        approvedAt: new Date(),
      },
      include: {
        approvedBy: { select: { id: true, fullName: true, email: true, role: true } },
        questionMarks: true,
      },
    });
  }

  async createRevaluationRequest(data: {
    resultId: string;
    questionAttemptId?: string;
    scope: RevaluationScope;
    reason: string;
    requestedById: string;
  }) {
    return this.db.revaluationRequest.create({
      data: {
        resultId: data.resultId,
        questionAttemptId: data.questionAttemptId,
        scope: data.scope,
        reason: data.reason,
        status: "REQUESTED",
        requestedById: data.requestedById,
      },
      include: {
        result: true,
        requestedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async findRevaluationRequestById(id: string) {
    return this.db.revaluationRequest.findUnique({
      where: { id },
      include: {
        result: {
          include: {
            exam: true,
            subject: true,
            script: true,
            questionMarks: true,
          },
        },
        questionAttempt: {
          include: { question: true },
        },
        requestedBy: { select: { id: true, fullName: true, email: true } },
        reviewedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async updateRevaluationRequest(
    id: string,
    data: {
      status?: RevaluationStatus;
      reviewedById?: string;
      previousTotalMarks?: number;
      newTotalMarks?: number;
      deltaMarks?: number;
      revaluationResultId?: string;
      completedAt?: Date;
    }
  ) {
    return this.db.revaluationRequest.update({
      where: { id },
      data,
      include: {
        result: true,
        reviewedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async listRevaluationRequests(filters: {
    resultId?: string;
    status?: RevaluationStatus;
    requestedById?: string;
  }) {
    const where: any = {};
    if (filters.resultId) where.resultId = filters.resultId;
    if (filters.status) where.status = filters.status;
    if (filters.requestedById) where.requestedById = filters.requestedById;

    return this.db.revaluationRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        result: {
          select: {
            id: true,
            version: true,
            totalMarks: true,
            maximumMarks: true,
            script: { select: { scriptCode: true } },
          },
        },
        requestedBy: { select: { id: true, fullName: true, email: true } },
        reviewedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }
}
