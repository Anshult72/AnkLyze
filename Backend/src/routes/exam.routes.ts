import { Router } from "express";
import { examController } from "../controllers/exam.controller";
import { scriptController } from "../controllers/script.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import {
  createExamBodySchema,
  updateExamBodySchema,
  createSubjectBodySchema,
  updateSubjectBodySchema,
  createQuestionBodySchema,
  updateQuestionBodySchema,
  reorderQuestionsBodySchema,
  createMarkingSchemeBodySchema,
  updateMarkingSchemeBodySchema,
  createCriterionBodySchema,
  updateCriterionBodySchema,
  assignExaminerBodySchema,
} from "../schemas/exam.schemas";

const router = Router();

// ==============================================================================
// Exam Routes
// ==============================================================================

// Read exams: SUPER_ADMIN, HEAD_EXAMINER, EXAMINER
router.get("/", requireAuth, (req, res, next) => {
  examController.listExams(req, res, next);
});

router.get("/:examId", requireAuth, (req, res, next) => {
  examController.getExam(req, res, next);
});

// Manage exams: SUPER_ADMIN, HEAD_EXAMINER
router.post(
  "/",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  validateRequest({ body: createExamBodySchema }),
  (req, res, next) => {
    examController.createExam(req, res, next);
  }
);

router.patch(
  "/:examId",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  validateRequest({ body: updateExamBodySchema }),
  (req, res, next) => {
    examController.updateExam(req, res, next);
  }
);

router.delete(
  "/:examId",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  (req, res, next) => {
    examController.archiveExam(req, res, next);
  }
);

// ==============================================================================
// Subject Routes (nested under /exams/:examId/subjects)
// ==============================================================================

router.get("/:examId/subjects", requireAuth, (req, res, next) => {
  examController.listSubjects(req, res, next);
});

router.post(
  "/:examId/subjects",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  validateRequest({ body: createSubjectBodySchema }),
  (req, res, next) => {
    examController.createSubject(req, res, next);
  }
);

router.get("/:examId/scripts", requireAuth, requireRole("SUPER_ADMIN", "HEAD_EXAMINER"), (req, res, next) => {
  scriptController.getScriptsByExam(req, res, next);
});

export const examRoutes = router;

// ==============================================================================
// Dedicated Subject & Question Routes (mounted under /subjects, /questions, /criteria)
// ==============================================================================

export const subjectRoutes = Router();

subjectRoutes.get("/:subjectId", requireAuth, (req, res, next) => {
  examController.getSubject(req, res, next);
});

subjectRoutes.get("/:subjectId/scripts", requireAuth, requireRole("SUPER_ADMIN", "HEAD_EXAMINER"), (req, res, next) => {
  scriptController.getScriptsBySubject(req, res, next);
});

subjectRoutes.patch(
  "/:subjectId",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  validateRequest({ body: updateSubjectBodySchema }),
  (req, res, next) => {
    examController.updateSubject(req, res, next);
  }
);

// Questions under Subject
subjectRoutes.get("/:subjectId/questions", requireAuth, (req, res, next) => {
  examController.listQuestions(req, res, next);
});

subjectRoutes.post(
  "/:subjectId/questions",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  validateRequest({ body: createQuestionBodySchema }),
  (req, res, next) => {
    examController.createQuestion(req, res, next);
  }
);

subjectRoutes.post(
  "/:subjectId/questions/reorder",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  validateRequest({ body: reorderQuestionsBodySchema }),
  (req, res, next) => {
    examController.reorderQuestions(req, res, next);
  }
);

// Marking Schemes under Subject
subjectRoutes.get("/:subjectId/marking-schemes", requireAuth, (req, res, next) => {
  examController.listSchemes(req, res, next);
});

subjectRoutes.post(
  "/:subjectId/marking-schemes",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  validateRequest({ body: createMarkingSchemeBodySchema }),
  (req, res, next) => {
    examController.createScheme(req, res, next);
  }
);

// Examiner Assignments under Subject
subjectRoutes.get("/:subjectId/examiners", requireAuth, (req, res, next) => {
  examController.listAssignments(req, res, next);
});

subjectRoutes.post(
  "/:subjectId/examiners",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  validateRequest({ body: assignExaminerBodySchema }),
  (req, res, next) => {
    examController.assignExaminer(req, res, next);
  }
);

subjectRoutes.delete(
  "/:subjectId/examiners/:examinerId",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  (req, res, next) => {
    examController.removeAssignment(req, res, next);
  }
);

// ==============================================================================
// Question Routes
// ==============================================================================

export const questionRoutes = Router();

questionRoutes.get("/:questionId", requireAuth, (req, res, next) => {
  examController.getQuestion(req, res, next);
});

questionRoutes.patch(
  "/:questionId",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  validateRequest({ body: updateQuestionBodySchema }),
  (req, res, next) => {
    examController.updateQuestion(req, res, next);
  }
);

questionRoutes.delete(
  "/:questionId",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  (req, res, next) => {
    examController.archiveQuestion(req, res, next);
  }
);

// Criteria under Question
questionRoutes.get("/:questionId/criteria", requireAuth, (req, res, next) => {
  examController.listCriteria(req, res, next);
});

questionRoutes.post(
  "/:questionId/criteria",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  validateRequest({ body: createCriterionBodySchema }),
  (req, res, next) => {
    examController.createCriterion(req, res, next);
  }
);

// ==============================================================================
// Marking Scheme & Criteria Direct Routes
// ==============================================================================

export const markingSchemeRoutes = Router();

markingSchemeRoutes.get("/:id", requireAuth, (req, res, next) => {
  examController.getScheme(req, res, next);
});

markingSchemeRoutes.patch(
  "/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  validateRequest({ body: updateMarkingSchemeBodySchema }),
  (req, res, next) => {
    examController.updateScheme(req, res, next);
  }
);

export const criterionRoutes = Router();

criterionRoutes.patch(
  "/:criterionId",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  validateRequest({ body: updateCriterionBodySchema }),
  (req, res, next) => {
    examController.updateCriterion(req, res, next);
  }
);

criterionRoutes.delete(
  "/:criterionId",
  requireAuth,
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  (req, res, next) => {
    examController.deleteCriterion(req, res, next);
  }
);
