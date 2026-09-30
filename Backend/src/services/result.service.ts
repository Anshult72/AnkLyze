import crypto from "crypto";
import { PrismaClient, RevaluationScope, ResultStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { ResultRepository } from "../repositories/result.repository";
import { resultValidationService } from "./resultValidation.service";
import { auditService } from "./audit.service";
import { RESULT_CONFIG } from "../config/result.config";

export class ResultService {
  private repository: ResultRepository;
  private db: PrismaClient;

  constructor(repository: ResultRepository = new ResultRepository(), client: PrismaClient = prisma) {
    this.repository = repository;
    this.db = client;
  }

  // Deterministic SHA-256 fingerprint for result package
  private computeFingerprint(payload: {
    scriptId: string;
    version: number;
    totalAwardedMarks: number;
    totalMaxMarks: number;
    questions: Array<{
      questionNumber: string;
      awardedMarks: number;
      maximumMarks: number;
      sourceDecisionId?: string;
      sourceModerationDecisionId?: string;
    }>;
  }): string {
    const dataStr = JSON.stringify({
      scriptId: payload.scriptId,
      version: payload.version,
      total: payload.totalAwardedMarks,
      max: payload.totalMaxMarks,
      q: payload.questions.map((q) => ({
        num: q.questionNumber,
        awarded: q.awardedMarks,
        max: q.maximumMarks,
        dec: q.sourceDecisionId || null,
        mod: q.sourceModerationDecisionId || null,
      })),
    });
    return crypto.createHash("sha256").update(dataStr).digest("hex");
  }

  private determineResultCode(percentage: number): string {
    if (percentage >= RESULT_CONFIG.DISTINCTION_PERCENTAGE) return "DISTINCTION";
    if (percentage >= RESULT_CONFIG.FIRST_CLASS_PERCENTAGE) return "FIRST_CLASS";
    if (percentage >= RESULT_CONFIG.DEFAULT_PASSING_PERCENTAGE) return "PASS";
    return "FAIL";
  }

  async generateResult(scriptId: string, userId: string, forceNewVersion: boolean = false) {
    await auditService.logEvent({
      userId,
      event: "RESULT_GENERATION_STARTED",
      details: `Initiating result generation for script ${scriptId}`,
    });

    const script = await this.db.answerScript.findUnique({
      where: { id: scriptId },
      include: { exam: true, subject: true },
    });

    if (!script) {
      throw new Error(`AnswerScript ${scriptId} not found.`);
    }

    // 1. Run Validation
    const validationOutput = await resultValidationService.validateScriptAttempts(scriptId);

    const { totalAwardedMarks, totalMaxMarks, questionBreakdowns } = validationOutput.aggregatedMarks;
    const percentage = totalMaxMarks > 0 ? (totalAwardedMarks / totalMaxMarks) * 100 : 0;
    const resultCode = this.determineResultCode(percentage);

    // 2. Check for latest existing result
    const latestResult = await this.repository.findLatestResultByScript(scriptId);
    const targetVersion = latestResult ? (forceNewVersion ? latestResult.version + 1 : latestResult.version) : 1;

    const fingerprint = this.computeFingerprint({
      scriptId,
      version: targetVersion,
      totalAwardedMarks,
      totalMaxMarks,
      questions: questionBreakdowns,
    });

    // Idempotency check: if unchanged and not forcing new version, return existing
    if (latestResult && !forceNewVersion && latestResult.fingerprint === fingerprint) {
      return this.repository.findResultById(latestResult.id);
    }

    // Determine target version
    const newVersion = latestResult ? latestResult.version + 1 : 1;
    const initialStatus: ResultStatus = validationOutput.passed ? "VALIDATED" : "BLOCKED";

    // 3. Create Result record in transaction
    const newResult = await this.repository.createResultWithQuestionMarks({
      examId: script.examId,
      subjectId: script.subjectId,
      scriptId,
      version: newVersion,
      status: initialStatus,
      totalMarks: totalAwardedMarks,
      maximumMarks: totalMaxMarks,
      percentage: parseFloat(percentage.toFixed(2)),
      resultCode,
      validationStatus: validationOutput.status,
      fingerprint,
      supersedesResultId: latestResult?.id,
      questionMarks: questionBreakdowns,
    });

    // 4. Record validation issues
    await this.repository.recordValidationRun({
      resultId: newResult.id,
      validationVersion: 1,
      status: validationOutput.status,
      passed: validationOutput.passed,
      issues: validationOutput.issues,
    });

    await auditService.logEvent({
      userId,
      event: "RESULT_GENERATED",
      details: `Generated examination result ${newResult.id} (v${newVersion}) - Total: ${totalAwardedMarks}/${totalMaxMarks} (${percentage.toFixed(1)}%) - Status: ${initialStatus}`,
    });

    return this.repository.findResultById(newResult.id);
  }

  async validateExistingResult(resultId: string, userId: string) {
    const result = await this.repository.findResultById(resultId);
    if (!result) {
      throw new Error(`Result with ID ${resultId} not found.`);
    }

    if (result.status === "APPROVED") {
      throw new Error("Cannot re-validate an APPROVED result package. Approved results are immutable.");
    }

    await auditService.logEvent({
      userId,
      event: "RESULT_VALIDATION_STARTED",
      details: `Validating result ${resultId} (v${result.version})`,
    });

    const validationOutput = await resultValidationService.validateScriptAttempts(result.scriptId);
    const nextValidationVersion = (result.validations[0]?.validationVersion || 0) + 1;

    const validationRecord = await this.repository.recordValidationRun({
      resultId: result.id,
      validationVersion: nextValidationVersion,
      status: validationOutput.status,
      passed: validationOutput.passed,
      issues: validationOutput.issues,
    });

    await auditService.logEvent({
      userId,
      event: validationOutput.passed ? "RESULT_VALIDATED" : "RESULT_VALIDATION_BLOCKED",
      details: `Result ${resultId} validation ${validationOutput.passed ? "PASSED" : "BLOCKED"} with ${validationOutput.issues.length} issues`,
    });

    return {
      validation: validationRecord,
      result: await this.repository.findResultById(resultId),
    };
  }

  async approveResult(resultId: string, approvedById: string, userRole: string) {
    if (!["HEAD_EXAMINER", "SUPER_ADMIN"].includes(userRole)) {
      throw new Error("Unauthorized: Only HEAD_EXAMINER or SUPER_ADMIN may approve examination results.");
    }

    const result = await this.repository.findResultById(resultId);
    if (!result) {
      throw new Error(`Result with ID ${resultId} not found.`);
    }

    if (result.status === "APPROVED") {
      throw new Error("Result is already approved.");
    }

    if (result.validationStatus !== "PASSED" && result.status !== "VALIDATED") {
      throw new Error(
        `Cannot approve result ${resultId}. Current validation status is ${result.validationStatus}. Resolve all blocking issues first.`
      );
    }

    const approved = await this.repository.approveResult(resultId, approvedById);

    await auditService.logEvent({
      userId: approvedById,
      event: "RESULT_APPROVED",
      details: `Approved result ${resultId} (v${result.version}) - Total: ${result.totalMarks}/${result.maximumMarks}`,
    });

    return approved;
  }

  async requestRevaluation(data: {
    resultId: string;
    questionAttemptId?: string;
    scope: RevaluationScope;
    reason: string;
    requestedById: string;
  }) {
    const result = await this.repository.findResultById(data.resultId);
    if (!result) {
      throw new Error(`Result ${data.resultId} not found.`);
    }

    if (result.status !== "APPROVED") {
      throw new Error("Revaluation can only be requested on an APPROVED result package.");
    }

    const request = await this.repository.createRevaluationRequest(data);

    // Update result status to REVALUATION_PENDING
    await this.db.examinationResult.update({
      where: { id: data.resultId },
      data: { status: "REVALUATION_PENDING" },
    });

    await auditService.logEvent({
      userId: data.requestedById,
      event: "REVALUATION_REQUESTED",
      details: `Revaluation requested for result ${data.resultId} (${data.scope}) - Reason: ${data.reason}`,
    });

    return request;
  }

  async authorizeRevaluation(revaluationId: string, reviewerId: string, userRole: string, authorize: boolean) {
    if (!["HEAD_EXAMINER", "SUPER_ADMIN"].includes(userRole)) {
      throw new Error("Unauthorized: Only HEAD_EXAMINER or SUPER_ADMIN may authorize revaluation requests.");
    }

    const req = await this.repository.findRevaluationRequestById(revaluationId);
    if (!req) {
      throw new Error(`RevaluationRequest ${revaluationId} not found.`);
    }

    if (req.status !== "REQUESTED") {
      throw new Error(`RevaluationRequest is in ${req.status} state, cannot authorize.`);
    }

    const newStatus = authorize ? "AUTHORIZED" : "REJECTED";
    const updated = await this.repository.updateRevaluationRequest(revaluationId, {
      status: newStatus,
      reviewedById: reviewerId,
    });

    await auditService.logEvent({
      userId: reviewerId,
      event: authorize ? "REVALUATION_AUTHORIZED" : "REVALUATION_REJECTED",
      details: `Revaluation request ${revaluationId} was ${newStatus}`,
    });

    return updated;
  }

  async completeRevaluation(data: {
    revaluationId: string;
    reviewerId: string;
    userRole: string;
    changedQuestionDecisions: Array<{
      questionAttemptId: string;
      newMarks: number;
      reason: string;
    }>;
  }) {
    const { revaluationId, reviewerId, userRole, changedQuestionDecisions } = data;

    if (!["HEAD_EXAMINER", "SUPER_ADMIN", "EXAMINER", "MODERATOR"].includes(userRole)) {
      throw new Error("Unauthorized to complete revaluation.");
    }

    const revalReq = await this.repository.findRevaluationRequestById(revaluationId);
    if (!revalReq) {
      throw new Error(`RevaluationRequest ${revaluationId} not found.`);
    }

    if (!["AUTHORIZED", "IN_PROGRESS", "REQUESTED"].includes(revalReq.status)) {
      throw new Error(`RevaluationRequest cannot be completed in current state: ${revalReq.status}`);
    }

    const oldResult = revalReq.result;

    // Execute atomic update of decisions and creation of Result v2
    return this.db.$transaction(async (tx) => {
      // 1. Create new ExaminerEvaluationDecision for each changed question
      for (const change of changedQuestionDecisions) {
        const attempt = await tx.questionAttempt.findUnique({
          where: { id: change.questionAttemptId },
          include: {
            question: true,
            evaluations: {
              include: {
                decisionHistory: { orderBy: { version: "desc" }, take: 1 },
              },
            },
          },
        });

        if (!attempt || !attempt.question) {
          throw new Error(`QuestionAttempt ${change.questionAttemptId} not found.`);
        }

        const evaluation = attempt.evaluations[0];
        const prevDecision = evaluation?.decisionHistory?.[0];
        const nextVersion = prevDecision ? prevDecision.version + 1 : 1;

        await tx.examinerEvaluationDecision.create({
          data: {
            evaluationId: evaluation.id,
            version: nextVersion,
            decisionType: "OVERRIDE_AI",
            status: "FINAL",
            totalMarks: change.newMarks,
            maxMarks: attempt.question.maximumMarks,
            notes: `Revaluation override: ${change.reason}`,
            overrideReason: change.reason,
            examinerUserId: reviewerId,
            previousDecisionId: prevDecision?.id,
          },
        });
      }

      // 2. Generate new Result version (v2)
      // Call service generate logic
      const validationOutput = await resultValidationService.validateScriptAttempts(oldResult.scriptId);
      const { totalAwardedMarks, totalMaxMarks, questionBreakdowns } = validationOutput.aggregatedMarks;
      const percentage = totalMaxMarks > 0 ? (totalAwardedMarks / totalMaxMarks) * 100 : 0;
      const resultCode = this.determineResultCode(percentage);
      const newVersion = oldResult.version + 1;

      const fingerprint = this.computeFingerprint({
        scriptId: oldResult.scriptId,
        version: newVersion,
        totalAwardedMarks,
        totalMaxMarks,
        questions: questionBreakdowns,
      });

      // Supersede old result
      await tx.examinationResult.update({
        where: { id: oldResult.id },
        data: { status: "SUPERSEDED" },
      });

      const newResult = await tx.examinationResult.create({
        data: {
          examId: oldResult.examId,
          subjectId: oldResult.subjectId,
          scriptId: oldResult.scriptId,
          version: newVersion,
          status: "REVALUATED",
          totalMarks: totalAwardedMarks,
          maximumMarks: totalMaxMarks,
          percentage: parseFloat(percentage.toFixed(2)),
          resultCode,
          validationStatus: validationOutput.status,
          fingerprint,
          supersedesResultId: oldResult.id,
          questionMarks: {
            create: questionBreakdowns.map((qm) => ({
              questionAttemptId: qm.questionAttemptId,
              questionNumber: qm.questionNumber,
              maximumMarks: qm.maximumMarks,
              awardedMarks: qm.awardedMarks,
              sourceDecisionId: qm.sourceDecisionId,
              sourceModerationDecisionId: qm.sourceModerationDecisionId,
              status: "FINAL",
            })),
          },
        },
      });

      const deltaMarks = totalAwardedMarks - oldResult.totalMarks;

      // 3. Update Revaluation Request with impact stats
      await tx.revaluationRequest.update({
        where: { id: revaluationId },
        data: {
          status: "COMPLETED",
          reviewedById: reviewerId,
          previousTotalMarks: oldResult.totalMarks,
          newTotalMarks: totalAwardedMarks,
          deltaMarks,
          revaluationResultId: newResult.id,
          completedAt: new Date(),
        },
      });

      await auditService.logEvent({
        userId: reviewerId,
        event: "REVALUATION_COMPLETED",
        details: `Revaluation ${revaluationId} completed. Result v${oldResult.version} (${oldResult.totalMarks}) -> Result v${newVersion} (${totalAwardedMarks}), delta: ${deltaMarks > 0 ? "+" : ""}${deltaMarks}`,
      });

      return {
        newResult,
        deltaMarks,
        previousTotalMarks: oldResult.totalMarks,
        newTotalMarks: totalAwardedMarks,
      };
    });
  }

  async generateExplainableReport(resultId: string, requestedVersion?: number) {
    const result = await this.repository.findResultById(resultId);
    if (!result) {
      throw new Error(`Result with ID ${resultId} not found.`);
    }

    const targetResult: any =
      requestedVersion && requestedVersion !== result.version
        ? await this.repository.findResultByScriptAndVersion(result.scriptId, requestedVersion)
        : result;

    if (!targetResult) {
      throw new Error(`Result version ${requestedVersion} not found for script ${result.scriptId}.`);
    }

    const reportPayload = {
      institution: targetResult.exam?.institution || "ANKLYZE Assessment Board",
      examination: targetResult.exam?.title || "Examination Assessment",
      examCode: targetResult.exam?.code || "EXAM-2026",
      academicTerm: targetResult.exam?.academicTerm || "Winter 2026",
      subject: targetResult.subject?.name || "Subject Assessment",
      subjectCode: targetResult.subject?.code || "SUBJ-01",
      candidateReference: targetResult.script?.scriptCode || "CAND-ANONYMOUS",
      resultVersion: `v${targetResult.version}`,
      status: targetResult.status,
      validationStatus: targetResult.validationStatus,
      totalMarksAwarded: targetResult.totalMarks,
      maximumMarks: targetResult.maximumMarks,
      percentage: targetResult.percentage,
      resultCode: targetResult.resultCode,
      fingerprint: targetResult.fingerprint,
      approvedBy: targetResult.approvedBy?.fullName || "Pending Approval",
      approvedAt: targetResult.approvedAt || null,
      generatedAt: new Date(),
      questionWiseBreakdown: (targetResult.questionMarks || []).map((qm: any) => ({
        questionNumber: qm.questionNumber,
        awardedMarks: qm.awardedMarks,
        maximumMarks: qm.maximumMarks,
        sourceDecisionId: qm.sourceDecisionId,
        sourceModerationDecisionId: qm.sourceModerationDecisionId,
      })),
      provenanceSummary: "All awarded marks are grounded in authoritative human examiner / moderation decisions.",
    };

    await auditService.logEvent({
      userId: targetResult.approvedById || "SYSTEM",
      event: "REPORT_GENERATED",
      details: `Generated explainable report for result ${resultId} (v${targetResult.version})`,
    });

    return reportPayload;
  }
}

export const resultService = new ResultService();
