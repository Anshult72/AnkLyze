import { Request, Response, NextFunction } from "express";
import { examService } from "../services/exam.service";
import { ApiResponse } from "../utils/api-response";

function getParam(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : (val as string);
}

export class ExamController {
  // ============================================================================
  // Exam Controllers
  // ============================================================================

  public async listExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeArchived = req.query.includeArchived === "true";
      const exams = await examService.getAllExams(includeArchived);
      ApiResponse.success(res, exams);
    } catch (error) {
      next(error);
    }
  }

  public async getExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = getParam(req, "examId");
      const exam = await examService.getExamById(examId);
      ApiResponse.success(res, exam);
    } catch (error) {
      next(error);
    }
  }

  public async createExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const exam = await examService.createExam({ ...req.body, createdById: userId });
      ApiResponse.success(res, exam, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = getParam(req, "examId");
      const userId = req.user?.id;
      const updated = await examService.updateExam(examId, req.body, userId);
      ApiResponse.success(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async archiveExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = getParam(req, "examId");
      const userId = req.user?.id;
      const archived = await examService.archiveExam(examId, userId);
      ApiResponse.success(res, { message: "Examination archived successfully", exam: archived });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // Subject Controllers
  // ============================================================================

  public async listAllSubjects(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjects = await examService.getAllSubjects();
      ApiResponse.success(res, subjects);
    } catch (error) {
      next(error);
    }
  }

  public async listSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = getParam(req, "examId");
      const subjects = await examService.getSubjectsByExamId(examId);
      ApiResponse.success(res, subjects);
    } catch (error) {
      next(error);
    }
  }

  public async getSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjectId = getParam(req, "subjectId");
      const subject = await examService.getSubjectById(subjectId);
      ApiResponse.success(res, subject);
    } catch (error) {
      next(error);
    }
  }

  public async createSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = getParam(req, "examId");
      const userId = req.user?.id;
      const subject = await examService.createSubject(examId, req.body, userId);
      ApiResponse.success(res, subject, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjectId = getParam(req, "subjectId");
      const userId = req.user?.id;
      const updated = await examService.updateSubject(subjectId, req.body, userId);
      ApiResponse.success(res, updated);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // Question Controllers
  // ============================================================================

  public async listQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjectId = getParam(req, "subjectId");
      const questions = await examService.getQuestionsBySubjectId(subjectId);
      ApiResponse.success(res, questions);
    } catch (error) {
      next(error);
    }
  }

  public async getQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questionId = getParam(req, "questionId");
      const question = await examService.getQuestionById(questionId);
      ApiResponse.success(res, question);
    } catch (error) {
      next(error);
    }
  }

  public async createQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjectId = getParam(req, "subjectId");
      const userId = req.user?.id;
      const question = await examService.createQuestion(subjectId, req.body, userId);
      ApiResponse.success(res, question, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questionId = getParam(req, "questionId");
      const userId = req.user?.id;
      const updated = await examService.updateQuestion(questionId, req.body, userId);
      ApiResponse.success(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async reorderQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjectId = getParam(req, "subjectId");
      const userId = req.user?.id;
      const updatedList = await examService.reorderQuestions(subjectId, req.body.questionOrders, userId);
      ApiResponse.success(res, updatedList);
    } catch (error) {
      next(error);
    }
  }

  public async archiveQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questionId = getParam(req, "questionId");
      const userId = req.user?.id;
      const archived = await examService.archiveQuestion(questionId, userId);
      ApiResponse.success(res, { message: "Question archived successfully", question: archived });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // Marking Scheme Controllers
  // ============================================================================

  public async listSchemes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjectId = getParam(req, "subjectId");
      const schemes = await examService.getSchemesBySubjectId(subjectId);
      ApiResponse.success(res, schemes);
    } catch (error) {
      next(error);
    }
  }

  public async getScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, "id");
      const scheme = await examService.getSchemeById(id);
      ApiResponse.success(res, scheme);
    } catch (error) {
      next(error);
    }
  }

  public async createScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjectId = getParam(req, "subjectId");
      const userId = req.user?.id;
      const scheme = await examService.createMarkingScheme(subjectId, req.body, userId);
      ApiResponse.success(res, scheme, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, "id");
      const userId = req.user?.id;
      const updated = await examService.updateMarkingScheme(id, req.body, userId);
      ApiResponse.success(res, updated);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // Criteria Controllers
  // ============================================================================

  public async listCriteria(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questionId = getParam(req, "questionId");
      const criteria = await examService.getCriteriaByQuestionId(questionId);
      ApiResponse.success(res, criteria);
    } catch (error) {
      next(error);
    }
  }

  public async createCriterion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questionId = getParam(req, "questionId");
      const userId = req.user?.id;
      const criterion = await examService.createCriterion(questionId, req.body, userId);
      ApiResponse.success(res, criterion, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateCriterion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const criterionId = getParam(req, "criterionId");
      const userId = req.user?.id;
      const updated = await examService.updateCriterion(criterionId, req.body, userId);
      ApiResponse.success(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async deleteCriterion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const criterionId = getParam(req, "criterionId");
      const userId = req.user?.id;
      await examService.deleteCriterion(criterionId, userId);
      ApiResponse.success(res, { message: "Criterion deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // Examiner Assignment Controllers
  // ============================================================================

  public async listAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjectId = getParam(req, "subjectId");
      const assignments = await examService.getAssignmentsBySubjectId(subjectId);
      ApiResponse.success(res, assignments);
    } catch (error) {
      next(error);
    }
  }

  public async assignExaminer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjectId = getParam(req, "subjectId");
      const assignedById = req.user?.id;
      const assignment = await examService.assignExaminer(subjectId, req.body, assignedById);
      ApiResponse.success(res, assignment, 201);
    } catch (error) {
      next(error);
    }
  }

  public async removeAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjectId = getParam(req, "subjectId");
      const examinerId = getParam(req, "examinerId");
      const userId = req.user?.id;
      await examService.removeExaminerAssignment(subjectId, examinerId, userId);
      ApiResponse.success(res, { message: "Examiner assignment removed successfully" });
    } catch (error) {
      next(error);
    }
  }
}

export const examController = new ExamController();
