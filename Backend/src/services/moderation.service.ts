import { ModerationRepository } from "../repositories/moderation.repository";
import { determineModerationPriority } from "../config/moderation.config";
import { AuditService } from "./audit.service";
import {
  ModerationPriority,
  ModerationStatus,
  ModerationResolutionType,
} from "@prisma/client";
import { prisma } from "../config/database";

export class ModerationService {
  /**
   * Evaluates if a question attempt needs moderation and creates or updates a case
   */
  public static async evaluateAndCreateCase(params: {
    questionAttemptId: string;
    evaluationId?: string;
    riskAssessmentId?: string;
    doubleEvaluationResultId?: string;
    overallRiskScore?: number;
    triggerReason: string;
    createdById?: string;
    metadata?: Record<string, unknown>;
  }) {
    // 1. Check if an active case already exists for this attempt
    const existingCase = await ModerationRepository.findOpenCaseByAttempt(params.questionAttemptId);
    if (existingCase) {
      return existingCase;
    }

    // 2. Determine priority based on observable criteria
    const isDoubleEvalDisagreement =
      params.triggerReason === "DOUBLE_EVALUATION_DISAGREEMENT";
    const priority = determineModerationPriority({
      triggerReason: params.triggerReason,
      overallRiskScore: params.overallRiskScore,
      isDoubleEvalDisagreement,
    });

    // 3. Create case
    const moderationCase = await ModerationRepository.createCase({
      questionAttemptId: params.questionAttemptId,
      evaluationId: params.evaluationId,
      riskAssessmentId: params.riskAssessmentId,
      doubleEvaluationResultId: params.doubleEvaluationResultId,
      priority,
      triggerReason: params.triggerReason,
      createdById: params.createdById,
      metadata: params.metadata,
    });

    // 4. Audit Log
    await AuditService.recordEvent({
      event: "MODERATION_CASE_CREATED",
      userId: params.createdById,
      details: {
        caseId: moderationCase.id,
        caseNumber: moderationCase.caseNumber,
        questionAttemptId: params.questionAttemptId,
        priority,
        triggerReason: params.triggerReason,
      },
    });

    return moderationCase;
  }

  /**
   * Retrieves paginated list of moderation cases
   */
  public static async listCases(filters: {
    status?: ModerationStatus;
    priority?: ModerationPriority;
    assignedModeratorId?: string;
    questionAttemptId?: string;
    page?: number;
    limit?: number;
  }) {
    return ModerationRepository.listCases(filters);
  }

  /**
   * Retrieves a single moderation case by ID
   */
  public static async getCaseById(caseId: string) {
    const moderationCase = await ModerationRepository.findCaseById(caseId);
    if (!moderationCase) {
      throw new Error(`Moderation case ${caseId} not found`);
    }
    return moderationCase;
  }

  /**
   * Assigns a moderator to a case
   */
  public static async assignModerator(params: {
    caseId: string;
    moderatorId: string;
    assignedByUserId: string;
  }) {
    // 1. Verify moderator exists
    const moderator = await prisma.user.findUnique({
      where: { id: params.moderatorId },
      include: { role: true },
    });

    if (!moderator) {
      throw new Error(`Moderator ${params.moderatorId} not found`);
    }

    if (!["MODERATOR", "HEAD_EXAMINER", "SUPER_ADMIN"].includes(moderator.role.name)) {
      throw new Error(`User ${params.moderatorId} is not authorized as a Moderator`);
    }

    const updatedCase = await ModerationRepository.assignModerator(
      params.caseId,
      params.moderatorId
    );

    await AuditService.recordEvent({
      event: "MODERATION_CASE_ASSIGNED",
      userId: params.assignedByUserId,
      details: {
        caseId: params.caseId,
        assignedModeratorId: params.moderatorId,
        assignedModeratorName: moderator.fullName,
      },
    });

    return updatedCase;
  }

  /**
   * Starts review on an assigned case
   */
  public static async startReview(params: {
    caseId: string;
    moderatorUserId: string;
  }) {
    const existingCase = await ModerationRepository.findCaseById(params.caseId);
    if (!existingCase) {
      throw new Error(`Moderation case ${params.caseId} not found`);
    }

    if (existingCase.status === "RESOLVED") {
      throw new Error(`Cannot start review on already resolved case ${params.caseId}`);
    }

    const updatedCase = await ModerationRepository.startReview(params.caseId);

    await AuditService.recordEvent({
      event: "MODERATION_STARTED",
      userId: params.moderatorUserId,
      details: {
        caseId: params.caseId,
        caseNumber: existingCase.caseNumber,
      },
    });

    return updatedCase;
  }

  /**
   * Resolves a moderation case with authoritative resolution and immutable provenance
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
  }) {
    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error("A clear resolution reason (minimum 5 characters) is required");
    }

    if (params.marksAfter < 0) {
      throw new Error("Awarded marks cannot be negative");
    }

    const result = await ModerationRepository.resolveCase({
      caseId: params.caseId,
      resolutionType: params.resolutionType,
      marksBefore: params.marksBefore,
      marksAfter: params.marksAfter,
      reason: params.reason.trim(),
      moderatorUserId: params.moderatorUserId,
      criterionOverrides: params.criterionOverrides,
      notes: params.notes,
    });

    await AuditService.recordEvent({
      event: "MODERATION_RESOLVED",
      userId: params.moderatorUserId,
      details: {
        caseId: params.caseId,
        resolutionType: params.resolutionType,
        marksBefore: params.marksBefore,
        marksAfter: params.marksAfter,
        delta: params.marksAfter - params.marksBefore,
        decisionVersion: result.decision.version,
      },
    });

    return result;
  }

  /**
   * Escalates a moderation case
   */
  public static async escalateCase(params: {
    caseId: string;
    reason: string;
    moderatorUserId: string;
  }) {
    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error("An escalation reason (minimum 5 characters) is required");
    }

    const updatedCase = await ModerationRepository.escalateCase(params);

    await AuditService.recordEvent({
      event: "MODERATION_ESCALATED",
      userId: params.moderatorUserId,
      details: {
        caseId: params.caseId,
        reason: params.reason,
      },
    });

    return updatedCase;
  }

  /**
   * Retrieves summary backlog metrics
   */
  public static async getSummary() {
    return ModerationRepository.getModerationSummary();
  }
}
