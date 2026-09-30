import { prisma } from "../config/database";
import { ANALYTICS_CONFIG, determineDriftSeverity } from "../config/analytics.config";
import { AuditService } from "./audit.service";
import { DriftSignalType } from "@prisma/client";

export class AnalyticsService {
  /**
   * Retrieves descriptive consistency metrics for an individual evaluator
   * Strictly operational & descriptive — NO RANKINGS, NO COMPETENCE LABELS
   */
  public static async getEvaluatorConsistency(evaluatorUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: evaluatorUserId },
      select: { id: true, fullName: true, email: true, role: true },
    });

    if (!user) {
      throw new Error(`Evaluator ${evaluatorUserId} not found`);
    }

    // 1. Fetch human decisions made by this evaluator
    const decisions = await prisma.examinerEvaluationDecision.findMany({
      where: { examinerUserId: evaluatorUserId },
      orderBy: { createdAt: "asc" },
      include: { criteriaDecisions: true },
    });

    const totalDecisions = decisions.length;
    if (totalDecisions === 0) {
      return {
        evaluator: { id: user.id, fullName: user.fullName, email: user.email },
        totalEvaluations: 0,
        meanAwardedMarks: 0,
        medianAwardedMarks: 0,
        aiAcceptanceRate: 0,
        overrideRate: 0,
        criterionOverrideRate: 0,
        calibrationSessionsCompleted: 0,
        meanCalibrationDeviation: 0,
        distribution: {},
      };
    }

    // 2. Marks summary
    const marksList = decisions.map((d) => d.totalMarks).sort((a, b) => a - b);
    const sumMarks = marksList.reduce((acc, m) => acc + m, 0);
    const meanAwardedMarks = sumMarks / totalDecisions;
    const mid = Math.floor(marksList.length / 2);
    const medianAwardedMarks =
      marksList.length % 2 !== 0 ? marksList[mid] : (marksList[mid - 1] + marksList[mid]) / 2;

    // 3. Override vs Accept counts
    const acceptedCount = decisions.filter((d) => d.decisionType === "ACCEPT_AI_SUGGESTION").length;
    const overrideCount = decisions.filter((d) => d.decisionType === "OVERRIDE_AI").length;
    const aiAcceptanceRate = totalDecisions > 0 ? (acceptedCount / totalDecisions) * 100 : 0;
    const overrideRate = totalDecisions > 0 ? (overrideCount / totalDecisions) * 100 : 0;

    // 4. Criterion-level overrides
    let totalCriteria = 0;
    let overriddenCriteria = 0;
    decisions.forEach((d) => {
      d.criteriaDecisions.forEach((cd) => {
        totalCriteria++;
        if (cd.isOverridden) overriddenCriteria++;
      });
    });
    const criterionOverrideRate =
      totalCriteria > 0 ? (overriddenCriteria / totalCriteria) * 100 : 0;

    // 5. Calibration performance
    const calibrationSessions = await prisma.calibrationSession.findMany({
      where: { evaluatorUserId, status: "COMPLETED" },
    });
    const calibrationCount = calibrationSessions.length;
    const totalCalDeviation = calibrationSessions.reduce(
      (acc, s) => acc + (s.totalDeviation || 0),
      0
    );
    const meanCalibrationDeviation =
      calibrationCount > 0 ? totalCalDeviation / calibrationCount : 0;

    // 6. Descriptive histogram bins
    const distribution: Record<string, number> = {
      "0-25%": 0,
      "26-50%": 0,
      "51-75%": 0,
      "76-100%": 0,
    };
    decisions.forEach((d) => {
      const pct = d.maxMarks > 0 ? (d.totalMarks / d.maxMarks) * 100 : 0;
      if (pct <= 25) distribution["0-25%"]++;
      else if (pct <= 50) distribution["26-50%"]++;
      else if (pct <= 75) distribution["51-75%"]++;
      else distribution["76-100%"]++;
    });

    return {
      evaluator: { id: user.id, fullName: user.fullName, email: user.email },
      totalEvaluations: totalDecisions,
      meanAwardedMarks: Number(meanAwardedMarks.toFixed(2)),
      medianAwardedMarks: Number(medianAwardedMarks.toFixed(2)),
      aiAcceptanceRate: Number(aiAcceptanceRate.toFixed(1)),
      overrideRate: Number(overrideRate.toFixed(1)),
      criterionOverrideRate: Number(criterionOverrideRate.toFixed(1)),
      calibrationSessionsCompleted: calibrationCount,
      meanCalibrationDeviation: Number(meanCalibrationDeviation.toFixed(2)),
      distribution,
    };
  }

  /**
   * Detects Evaluator Drift over time with a strict MIN_SAMPLE_SIZE guard
   */
  public static async getEvaluatorDrift(evaluatorUserId: string) {
    const decisions = await prisma.examinerEvaluationDecision.findMany({
      where: { examinerUserId: evaluatorUserId },
      orderBy: { createdAt: "asc" },
    });

    const totalDecisions = decisions.length;

    // SAMPLE SIZE GUARD: Require at least MIN_SAMPLE_SIZE (20) observations
    if (totalDecisions < ANALYTICS_CONFIG.minSampleSize) {
      return {
        status: "INSUFFICIENT_DATA",
        sampleSize: totalDecisions,
        minRequired: ANALYTICS_CONFIG.minSampleSize,
        message: `Drift detection requires at least ${ANALYTICS_CONFIG.minSampleSize} evaluated answers to compute meaningful temporal baseline.`,
        signals: [],
      };
    }

    // Split chronological sample into baseline window (first half) and current window (second half)
    const splitIndex = Math.floor(totalDecisions / 2);
    const baselineDecisions = decisions.slice(0, splitIndex);
    const currentDecisions = decisions.slice(splitIndex);

    // 1. Mark distribution shift
    const baselineMeanMarks =
      baselineDecisions.reduce((acc, d) => acc + d.totalMarks, 0) / baselineDecisions.length;
    const currentMeanMarks =
      currentDecisions.reduce((acc, d) => acc + d.totalMarks, 0) / currentDecisions.length;
    const markDelta = currentMeanMarks - baselineMeanMarks;

    // 2. Override rate shift
    const baselineOverrideCount = baselineDecisions.filter(
      (d) => d.decisionType === "OVERRIDE_AI"
    ).length;
    const currentOverrideCount = currentDecisions.filter(
      (d) => d.decisionType === "OVERRIDE_AI"
    ).length;

    const baselineOverrideRate = baselineOverrideCount / baselineDecisions.length;
    const currentOverrideRate = currentOverrideCount / currentDecisions.length;
    const overrideDelta = currentOverrideRate - baselineOverrideRate;

    const signals: Array<{
      signalType: DriftSignalType;
      severity: string;
      baselineMetric: number;
      currentMetric: number;
      delta: number;
      explanation: string;
    }> = [];

    // Check Mark Distribution Shift
    if (Math.abs(markDelta) >= ANALYTICS_CONFIG.driftThresholds.markDistributionShift.medium) {
      const severity = determineDriftSeverity("MARK_DISTRIBUTION_SHIFT", markDelta);
      signals.push({
        signalType: "MARK_DISTRIBUTION_SHIFT",
        severity,
        baselineMetric: Number(baselineMeanMarks.toFixed(2)),
        currentMetric: Number(currentMeanMarks.toFixed(2)),
        delta: Number(markDelta.toFixed(2)),
        explanation: `Observed temporal shift in mean awarded marks (${markDelta > 0 ? "+" : ""}${markDelta.toFixed(
          2
        )} marks) between baseline and current evaluation window.`,
      });
    }

    // Check Override Rate Shift
    if (Math.abs(overrideDelta) >= ANALYTICS_CONFIG.driftThresholds.overrideRateShift.medium) {
      const severity = determineDriftSeverity("OVERRIDE_RATE_SHIFT", overrideDelta);
      signals.push({
        signalType: "OVERRIDE_RATE_SHIFT",
        severity,
        baselineMetric: Number((baselineOverrideRate * 100).toFixed(1)),
        currentMetric: Number((currentOverrideRate * 100).toFixed(1)),
        delta: Number((overrideDelta * 100).toFixed(1)),
        explanation: `AI override frequency shifted by ${overrideDelta > 0 ? "+" : ""}${(
          overrideDelta * 100
        ).toFixed(1)}% between baseline and current evaluation window.`,
      });
    }

    // Persist drift observations if detected
    for (const sig of signals) {
      await prisma.evaluatorDriftObservation.create({
        data: {
          evaluatorUserId,
          windowStart: baselineDecisions[0].createdAt,
          windowEnd: currentDecisions[currentDecisions.length - 1].createdAt,
          sampleSize: totalDecisions,
          baselineMetric: sig.baselineMetric,
          currentMetric: sig.currentMetric,
          delta: sig.delta,
          signalType: sig.signalType,
          severity: sig.severity as any,
          status: "OBSERVED",
          explanation: sig.explanation,
        },
      });

      await AuditService.recordEvent({
        event: "DRIFT_SIGNAL_CREATED",
        userId: evaluatorUserId,
        details: {
          evaluatorUserId,
          signalType: sig.signalType,
          severity: sig.severity,
          delta: sig.delta,
        },
      });
    }

    return {
      status: signals.length > 0 ? "DRIFT_OBSERVED" : "STABLE",
      sampleSize: totalDecisions,
      baselineWindow: {
        count: baselineDecisions.length,
        meanMarks: Number(baselineMeanMarks.toFixed(2)),
        overrideRate: Number((baselineOverrideRate * 100).toFixed(1)),
      },
      currentWindow: {
        count: currentDecisions.length,
        meanMarks: Number(currentMeanMarks.toFixed(2)),
        overrideRate: Number((currentOverrideRate * 100).toFixed(1)),
      },
      signals,
    };
  }

  /**
   * Retrieves operational coverage analytics for an Examination
   */
  public static async getExamCoverage(examId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subjects: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!exam) {
      throw new Error(`Exam ${examId} not found`);
    }

    const [
      totalScripts,
      totalAttempts,
      evaluatedAttempts,
      highRiskAttempts,
      doubleEvalRequired,
      doubleEvalCompleted,
      openModerationCases,
      resolvedModerationCases,
    ] = await Promise.all([
      prisma.answerScript.count({ where: { examId } }),
      prisma.questionAttempt.count({ where: { script: { examId } } }),
      prisma.questionAttempt.count({
        where: { script: { examId }, evaluations: { some: { status: "COMPLETED" } } },
      }),
      prisma.riskAssessment.count({
        where: {
          questionAttempt: { script: { examId } },
          riskBand: { in: ["HIGH", "CRITICAL"] },
        },
      }),
      prisma.doubleEvaluationResult.count({
        where: { questionAttempt: { script: { examId } } },
      }),
      prisma.doubleEvaluationResult.count({
        where: {
          questionAttempt: { script: { examId } },
          status: { in: ["DOUBLE_EVALUATION_AGREED", "DOUBLE_EVALUATION_DISAGREEMENT"] },
        },
      }),
      prisma.moderationCase.count({
        where: {
          questionAttempt: { script: { examId } },
          status: { in: ["OPEN", "ASSIGNED", "IN_REVIEW"] },
        },
      }),
      prisma.moderationCase.count({
        where: {
          questionAttempt: { script: { examId } },
          status: "RESOLVED",
        },
      }),
    ]);

    const coveragePercentage =
      totalAttempts > 0 ? (evaluatedAttempts / totalAttempts) * 100 : 0;

    return {
      exam: { id: exam.id, title: exam.title, code: exam.code, academicTerm: exam.academicTerm },
      operationalCoverage: {
        totalScripts,
        totalAttempts,
        evaluatedAttempts,
        pendingAttempts: totalAttempts - evaluatedAttempts,
        coveragePercentage: Number(coveragePercentage.toFixed(1)),
      },
      qualityControl: {
        highRiskAttempts,
        doubleEvalRequired,
        doubleEvalCompleted,
        openModerationCases,
        resolvedModerationCases,
      },
    };
  }

  /**
   * Retrieves operational coverage analytics for a Subject
   */
  public static async getSubjectCoverage(subjectId: string) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { exam: true },
    });

    if (!subject) {
      throw new Error(`Subject ${subjectId} not found`);
    }

    const [
      totalScripts,
      totalAttempts,
      evaluatedAttempts,
      highRiskAttempts,
      openModerationCases,
      resolvedModerationCases,
    ] = await Promise.all([
      prisma.answerScript.count({ where: { subjectId } }),
      prisma.questionAttempt.count({ where: { script: { subjectId } } }),
      prisma.questionAttempt.count({
        where: { script: { subjectId }, evaluations: { some: { status: "COMPLETED" } } },
      }),
      prisma.riskAssessment.count({
        where: {
          questionAttempt: { script: { subjectId } },
          riskBand: { in: ["HIGH", "CRITICAL"] },
        },
      }),
      prisma.moderationCase.count({
        where: {
          questionAttempt: { script: { subjectId } },
          status: { in: ["OPEN", "ASSIGNED", "IN_REVIEW"] },
        },
      }),
      prisma.moderationCase.count({
        where: {
          questionAttempt: { script: { subjectId } },
          status: "RESOLVED",
        },
      }),
    ]);

    const coveragePercentage =
      totalAttempts > 0 ? (evaluatedAttempts / totalAttempts) * 100 : 0;

    return {
      subject: { id: subject.id, name: subject.name, code: subject.code },
      exam: { id: subject.exam.id, title: subject.exam.title, code: subject.exam.code },
      operationalCoverage: {
        totalScripts,
        totalAttempts,
        evaluatedAttempts,
        pendingAttempts: totalAttempts - evaluatedAttempts,
        coveragePercentage: Number(coveragePercentage.toFixed(1)),
      },
      qualityControl: {
        highRiskAttempts,
        openModerationCases,
        resolvedModerationCases,
      },
    };
  }
}
