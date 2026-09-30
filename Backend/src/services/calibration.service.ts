import { CalibrationRepository } from "../repositories/calibration.repository";
import { generateCalibrationFeedback } from "../config/calibration.config";
import { AuditService } from "./audit.service";

export class CalibrationService {
  /**
   * Creates an approved calibration set with reference criteria
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
  }) {
    if (!params.items || params.items.length === 0) {
      throw new Error("A calibration set must contain at least one sample answer item");
    }

    const set = await CalibrationRepository.createSet(params);

    await AuditService.recordEvent({
      event: "CALIBRATION_SET_CREATED",
      userId: params.createdById,
      details: {
        setId: set.id,
        code: set.code,
        itemCount: set.items.length,
      },
    });

    return set;
  }

  /**
   * Lists available calibration sets
   */
  public static async listSets(filters: { examId?: string; subjectId?: string }) {
    return CalibrationRepository.listSets(filters);
  }

  /**
   * Retrieves or starts a calibration session for an evaluator
   */
  public static async startSession(params: {
    calibrationSetId: string;
    evaluatorUserId: string;
  }) {
    const session = await CalibrationRepository.createOrGetSession(params);

    await AuditService.recordEvent({
      event: "CALIBRATION_SESSION_STARTED",
      userId: params.evaluatorUserId,
      details: {
        sessionId: session.id,
        calibrationSetId: params.calibrationSetId,
      },
    });

    return session;
  }

  /**
   * Retrieves calibration session data with server-side reference protection
   */
  public static async getSession(params: {
    sessionId: string;
    requestingUserId: string;
    userRole: string;
  }) {
    const session = await CalibrationRepository.findSessionById(params.sessionId);
    if (!session) {
      throw new Error(`Calibration session ${params.sessionId} not found`);
    }

    // Role check: Only assigned evaluator or admin/head examiner can view
    const isOwner = session.evaluatorUserId === params.requestingUserId;
    const isAdmin = ["HEAD_EXAMINER", "SUPER_ADMIN"].includes(params.userRole);

    if (!isOwner && !isAdmin) {
      throw new Error("Unauthorized to access this calibration session");
    }

    // If session is NOT completed and user is the evaluator, apply server-side redaction
    const isCompleted = session.status === "COMPLETED";
    if (!isCompleted && !isAdmin) {
      const redactedItems = session.calibrationSet.items.map((item) =>
        CalibrationRepository.redactReferenceData(item)
      );

      return {
        ...session,
        calibrationSet: {
          ...session.calibrationSet,
          items: redactedItems,
        },
      };
    }

    // Otherwise return full unredacted session
    return session;
  }

  /**
   * Evaluator submits marks for a single calibration item
   */
  public static async submitItem(params: {
    sessionId: string;
    itemId: string;
    awardedMarks: number;
    criteriaScores: Record<string, number>;
    evaluatorUserId: string;
  }) {
    const session = await CalibrationRepository.findSessionById(params.sessionId);
    if (!session) {
      throw new Error(`Calibration session ${params.sessionId} not found`);
    }

    if (session.evaluatorUserId !== params.evaluatorUserId) {
      throw new Error("Cannot submit calibration for another evaluator");
    }

    if (session.status === "COMPLETED") {
      throw new Error("Cannot submit item to an already completed calibration session");
    }

    const item = session.calibrationSet.items.find((i) => i.id === params.itemId);
    if (!item) {
      throw new Error(`Item ${params.itemId} not found in this calibration set`);
    }

    if (params.awardedMarks < 0 || params.awardedMarks > item.maxMarks) {
      throw new Error(`Awarded marks must be between 0 and ${item.maxMarks}`);
    }

    // 1. Calculate criterion differences
    let refCriteria: Array<{
      criterionId: string;
      criterionName: string;
      maxMarks: number;
      referenceMarks: number;
      rationale: string;
    }> = [];
    try {
      refCriteria = JSON.parse(item.referenceCriteriaJson);
    } catch {
      refCriteria = [];
    }

    const criteriaDifferences: Array<{
      criterionId: string;
      criterionName: string;
      awardedMarks: number;
      referenceMarks: number;
      explanation?: string;
    }> = [];

    refCriteria.forEach((ref) => {
      const awarded = params.criteriaScores[ref.criterionId] ?? 0;
      if (Math.abs(awarded - ref.referenceMarks) > 0.001) {
        criteriaDifferences.push({
          criterionId: ref.criterionId,
          criterionName: ref.criterionName,
          awardedMarks: awarded,
          referenceMarks: ref.referenceMarks,
          explanation: ref.rationale,
        });
      }
    });

    const markDelta = params.awardedMarks - item.referenceMarks;

    // 2. Generate objective feedback
    const feedbackNotes = generateCalibrationFeedback({
      awardedMarks: params.awardedMarks,
      referenceMarks: item.referenceMarks,
      criteriaDifferences,
    });

    // 3. Persist submission
    const submission = await CalibrationRepository.submitItemEvaluation({
      sessionId: params.sessionId,
      itemId: params.itemId,
      awardedMarks: params.awardedMarks,
      referenceMarks: item.referenceMarks,
      markDelta,
      criteriaScores: params.criteriaScores,
      feedbackNotes,
    });

    await AuditService.recordEvent({
      event: "CALIBRATION_SUBMITTED",
      userId: params.evaluatorUserId,
      details: {
        sessionId: params.sessionId,
        itemId: params.itemId,
        awardedMarks: params.awardedMarks,
        referenceMarks: item.referenceMarks,
        markDelta,
      },
    });

    return {
      submission,
      feedbackNotes,
      criteriaDifferences,
      referenceMarks: item.referenceMarks,
    };
  }

  /**
   * Finalizes and completes a calibration session
   */
  public static async completeSession(params: {
    sessionId: string;
    evaluatorUserId: string;
  }) {
    const session = await CalibrationRepository.findSessionById(params.sessionId);
    if (!session) {
      throw new Error(`Calibration session ${params.sessionId} not found`);
    }

    if (session.evaluatorUserId !== params.evaluatorUserId) {
      throw new Error("Cannot complete session for another evaluator");
    }

    const totalItems = session.calibrationSet.items.length;
    const submittedCount = session.submissions.length;

    if (submittedCount < totalItems) {
      throw new Error(
        `All items must be submitted before completion (${submittedCount}/${totalItems} submitted)`
      );
    }

    // Compute summary metrics: Mean Absolute Deviation and Criteria agreement
    let totalAbsDelta = 0;
    let criteriaMatchCount = 0;
    let criteriaTotalCount = 0;

    session.submissions.forEach((sub) => {
      totalAbsDelta += Math.abs(sub.markDelta || 0);
      const item = session.calibrationSet.items.find((i) => i.id === sub.itemId);
      if (item) {
        try {
          const refCriteria: Array<{ criterionId: string; referenceMarks: number }> = JSON.parse(
            item.referenceCriteriaJson
          );
          const evalScores: Record<string, number> = JSON.parse(sub.criteriaScoresJson);
          refCriteria.forEach((rc) => {
            criteriaTotalCount++;
            if (Math.abs((evalScores[rc.criterionId] ?? 0) - rc.referenceMarks) < 0.001) {
              criteriaMatchCount++;
            }
          });
        } catch {
          // pass
        }
      }
    });

    const totalDeviation = totalItems > 0 ? totalAbsDelta / totalItems : 0;
    const matchRatio = criteriaTotalCount > 0 ? (criteriaMatchCount / criteriaTotalCount) * 100 : 100;
    const feedbackSummary = `Calibration completed. Mean absolute deviation: ${totalDeviation.toFixed(
      2
    )} marks. Rubric criterion agreement: ${matchRatio.toFixed(1)}% (${criteriaMatchCount}/${criteriaTotalCount}).`;

    const completed = await CalibrationRepository.completeSession({
      sessionId: params.sessionId,
      totalDeviation,
      criteriaMatchCount,
      criteriaTotalCount,
      feedbackSummary,
    });

    await AuditService.recordEvent({
      event: "CALIBRATION_COMPLETED",
      userId: params.evaluatorUserId,
      details: {
        sessionId: params.sessionId,
        totalDeviation,
        criteriaMatchCount,
        criteriaTotalCount,
      },
    });

    return completed;
  }
}
