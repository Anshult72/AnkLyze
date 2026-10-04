import { Router } from "express";
import { healthRoutes } from "./health.routes";
import { authRoutes } from "./auth.routes";
import { examinerAccountRoutes } from "./examinerAccount.routes";
import {
  examRoutes,
  subjectRoutes,
  questionRoutes,
  markingSchemeRoutes,
  criterionRoutes,
} from "./exam.routes";
import { rubricSchemeRoutes, rubricAnalysisRoutes } from "./rubric.routes";
import { scriptBatchRoutes, scriptRoutes } from "./script.routes";
import {
  reconstructionScriptRoutes,
  questionAttemptRoutes,
} from "./reconstruction.routes";
import {
  evaluationAttemptRoutes,
  evaluationRoutes,
} from "./evaluation.routes";
import riskRoutes from "./risk.routes";
import moderationRoutes from "./moderation.routes";
import calibrationRoutes from "./calibration.routes";
import analyticsRoutes from "./analytics.routes";
import { resultRoutes } from "./result.routes";
import { revaluationRoutes } from "./revaluation.routes";
import { openApiSpec } from "../docs/openapi";
import { questionPaperRoutes } from "./questionPaper.routes";

const router = Router();

// Health & Readiness Endpoints
router.use("/health", healthRoutes);

// Authentication & Authorization Endpoints
router.use("/auth", authRoutes);
router.use("/examiner-accounts", examinerAccountRoutes);

// Examination Management Endpoints (Phase 5)
router.use("/exams", examRoutes);
router.use("/subjects", subjectRoutes);
router.use("/question-papers", questionPaperRoutes);
router.use("/questions", questionRoutes);
router.use("/marking-schemes", markingSchemeRoutes);
router.use("/marking-schemes", rubricSchemeRoutes);
router.use("/marking-scheme-analyses", rubricAnalysisRoutes);
router.use("/criteria", criterionRoutes);

// Answer Script Intake & Processing Endpoints (Phase 7 & 8)
router.use("/script-batches", scriptBatchRoutes);
router.use("/scripts", scriptRoutes);

// Answer Reconstruction & Question Mapping Endpoints (Phase 9)
router.use("/scripts", reconstructionScriptRoutes);
router.use("/question-attempts", questionAttemptRoutes);

// AI-Assisted Evaluation Endpoints (Phase 10 & 11)
router.use("/question-attempts", evaluationAttemptRoutes);
router.use("/evaluations", evaluationRoutes);

// Risk Engine & Adaptive Double Evaluation Endpoints (Phase 12)
router.use("/", riskRoutes);

// Phase 13: Moderation, Calibration & Quality Analytics Endpoints
router.use("/moderation", moderationRoutes);
router.use("/calibration", calibrationRoutes);
router.use("/analytics", analyticsRoutes);

// Phase 14: Result Validation, Reports & Revaluation Endpoints
router.use("/results", resultRoutes);
router.use("/revaluations", revaluationRoutes);

// OpenAPI Specification JSON Endpoint
router.get("/docs", (_req, res) => {
  res.status(200).json(openApiSpec);
});

export const apiRoutes = router;
