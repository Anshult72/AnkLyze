import { examRepository } from "../repositories/exam.repository";
import { userRepository } from "../repositories/user.repository";
import { AuditService } from "./audit.service";
import { AppError } from "../utils/app-error";
import { ExamStatus, Prisma } from "@prisma/client";

export class ExamService {
  // ============================================================================
  // Exam Services
  // ============================================================================

  public async getAllExams(includeArchived = false) {
    return examRepository.findAllExams(includeArchived);
  }

  public async getExamById(id: string) {
    const exam = await examRepository.findExamById(id);
    if (!exam || exam.isArchived) {
      throw AppError.notFound("Examination not found", "EXAM_NOT_FOUND");
    }
    return exam;
  }

  public async createExam(data: {
    title: string;
    code: string;
    academicTerm?: string;
    academicYear?: string;
    semester?: string;
    description?: string;
    institution?: string;
    status?: ExamStatus;
    startDate?: string | null;
    endDate?: string | null;
    totalMarks?: number;
    partialMarking?: boolean;
    negativeMarking?: boolean;
    anonymityEnabled?: boolean;
    createdById?: string;
  }) {
    const existing = await examRepository.findExamByCode(data.code);
    if (existing && !existing.isArchived) {
      throw AppError.conflict(
        `Examination code '${data.code}' is already registered`,
        "DUPLICATE_EXAM_CODE"
      );
    }

    const exam = await examRepository.createExam({
      title: data.title.trim(),
      code: data.code.toUpperCase().trim(),
      academicTerm: data.academicTerm || "Academic Session 2025-26",
      academicYear: data.academicYear,
      semester: data.semester,
      description: data.description,
      institution: data.institution || "MP State Board of Technical Examinations",
      status: data.status || ExamStatus.DRAFT,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      totalMarks: data.totalMarks ?? 100,
      partialMarking: data.partialMarking ?? true,
      negativeMarking: data.negativeMarking ?? false,
      anonymityEnabled: data.anonymityEnabled ?? true,
      createdBy: data.createdById ? { connect: { id: data.createdById } } : undefined,
    });

    await AuditService.recordEvent({
      event: "EXAM_CREATED" as any,
      userId: data.createdById,
      details: { examId: exam.id, examCode: exam.code, title: exam.title },
    });

    return exam;
  }

  public async updateExam(
    id: string,
    data: Prisma.ExamUpdateInput & { code?: string; startDate?: string | null; endDate?: string | null },
    userId?: string
  ) {
    const exam = await this.getExamById(id);

    if (data.code && data.code !== exam.code) {
      const existing = await examRepository.findExamByCode(data.code);
      if (existing && existing.id !== id && !existing.isArchived) {
        throw AppError.conflict(
          `Examination code '${data.code}' is already registered`,
          "DUPLICATE_EXAM_CODE"
        );
      }
    }

    const updated = await examRepository.updateExam(id, {
      ...data,
      code: data.code ? data.code.toUpperCase().trim() : undefined,
      startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
      endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
    });

    await AuditService.recordEvent({
      event: "EXAM_UPDATED" as any,
      userId,
      details: { examId: id, changes: Object.keys(data) },
    });

    return updated;
  }

  public async archiveExam(id: string, userId?: string) {
    await this.getExamById(id);
    const archived = await examRepository.archiveExam(id);

    await AuditService.recordEvent({
      event: "EXAM_ARCHIVED" as any,
      userId,
      details: { examId: id, examCode: archived.code },
    });

    return archived;
  }

  // ============================================================================
  // Subject Services
  // ============================================================================

  public async getSubjectsByExamId(examId: string) {
    await this.getExamById(examId);
    return examRepository.findSubjectsByExamId(examId);
  }

  public async getSubjectById(subjectId: string) {
    const subject = await examRepository.findSubjectById(subjectId);
    if (!subject || subject.isArchived) {
      throw AppError.notFound("Subject not found", "SUBJECT_NOT_FOUND");
    }
    return subject;
  }

  public async createSubject(
    examId: string,
    data: { name: string; code: string; maxMarks?: number; description?: string },
    userId?: string
  ) {
    await this.getExamById(examId);

    const existing = await examRepository.findSubjectByCode(examId, data.code);
    if (existing && !existing.isArchived) {
      throw AppError.conflict(
        `Subject code '${data.code}' already exists within this examination`,
        "DUPLICATE_SUBJECT_CODE"
      );
    }

    const subject = await examRepository.createSubject({
      name: data.name.trim(),
      code: data.code.toUpperCase().trim(),
      description: data.description,
      maxMarks: data.maxMarks ?? 100,
      exam: { connect: { id: examId } },
    });

    await AuditService.recordEvent({
      event: "SUBJECT_CREATED" as any,
      userId,
      details: { examId, subjectId: subject.id, code: subject.code },
    });

    return subject;
  }

  public async updateSubject(
    subjectId: string,
    data: { name?: string; code?: string; maxMarks?: number; description?: string },
    userId?: string
  ) {
    const subject = await this.getSubjectById(subjectId);

    if (data.code && data.code !== subject.code) {
      const existing = await examRepository.findSubjectByCode(subject.examId, data.code);
      if (existing && existing.id !== subjectId && !existing.isArchived) {
        throw AppError.conflict(
          `Subject code '${data.code}' already exists within this examination`,
          "DUPLICATE_SUBJECT_CODE"
        );
      }
    }

    const updated = await examRepository.updateSubject(subjectId, {
      name: data.name?.trim(),
      code: data.code?.toUpperCase().trim(),
      description: data.description,
      maxMarks: data.maxMarks,
    });

    await AuditService.recordEvent({
      event: "SUBJECT_UPDATED" as any,
      userId,
      details: { subjectId, examId: subject.examId },
    });

    return updated;
  }

  // ============================================================================
  // Question Services
  // ============================================================================

  public async getQuestionsBySubjectId(subjectId: string) {
    await this.getSubjectById(subjectId);
    return examRepository.findQuestionsBySubjectId(subjectId);
  }

  public async getQuestionById(questionId: string) {
    const q = await examRepository.findQuestionById(questionId);
    if (!q || q.isArchived) {
      throw AppError.notFound("Question not found", "QUESTION_NOT_FOUND");
    }
    return q;
  }

  public async createQuestion(
    subjectId: string,
    data: {
      questionNumber: string;
      questionText: string;
      maximumMarks: number;
      orderIndex?: number;
      section?: string;
    },
    userId?: string
  ) {
    await this.getSubjectById(subjectId);

    // Validate marks
    if (data.maximumMarks <= 0) {
      throw AppError.badRequest("Question maximum marks must be greater than 0", "INVALID_MARKS");
    }

    // Check duplicate question number
    const existing = await examRepository.findQuestionByNumber(subjectId, data.questionNumber);
    if (existing && !existing.isArchived) {
      throw AppError.conflict(
        `Question number '${data.questionNumber}' already exists in this subject`,
        "DUPLICATE_QUESTION_NUMBER"
      );
    }

    // Determine auto-order if not provided
    let order = data.orderIndex;
    if (!order) {
      const existingQuestions = await examRepository.findQuestionsBySubjectId(subjectId);
      order = existingQuestions.length + 1;
    }

    const question = await examRepository.createQuestion({
      questionNumber: data.questionNumber.trim(),
      questionText: data.questionText.trim(),
      maximumMarks: data.maximumMarks,
      orderIndex: order,
      section: data.section?.trim(),
      subject: { connect: { id: subjectId } },
    });

    await AuditService.recordEvent({
      event: "QUESTION_CREATED" as any,
      userId,
      details: { subjectId, questionId: question.id, questionNumber: question.questionNumber },
    });

    return question;
  }

  public async updateQuestion(
    questionId: string,
    data: {
      questionNumber?: string;
      questionText?: string;
      maximumMarks?: number;
      orderIndex?: number;
      section?: string;
    },
    userId?: string
  ) {
    const question = await this.getQuestionById(questionId);

    if (data.maximumMarks !== undefined && data.maximumMarks <= 0) {
      throw AppError.badRequest("Question maximum marks must be greater than 0", "INVALID_MARKS");
    }

    if (data.questionNumber && data.questionNumber !== question.questionNumber) {
      const existing = await examRepository.findQuestionByNumber(question.subjectId, data.questionNumber);
      if (existing && existing.id !== questionId && !existing.isArchived) {
        throw AppError.conflict(
          `Question number '${data.questionNumber}' already exists in this subject`,
          "DUPLICATE_QUESTION_NUMBER"
        );
      }
    }

    const updated = await examRepository.updateQuestion(questionId, {
      questionNumber: data.questionNumber?.trim(),
      questionText: data.questionText?.trim(),
      maximumMarks: data.maximumMarks,
      orderIndex: data.orderIndex,
      section: data.section?.trim(),
    });

    await AuditService.recordEvent({
      event: "QUESTION_UPDATED" as any,
      userId,
      details: { questionId, subjectId: question.subjectId },
    });

    return updated;
  }

  public async reorderQuestions(
    subjectId: string,
    questionOrders: Array<{ id: string; orderIndex: number }>,
    userId?: string
  ) {
    await this.getSubjectById(subjectId);
    await examRepository.reorderQuestions(questionOrders);

    await AuditService.recordEvent({
      event: "QUESTIONS_REORDERED" as any,
      userId,
      details: { subjectId, count: questionOrders.length },
    });

    return examRepository.findQuestionsBySubjectId(subjectId);
  }

  public async archiveQuestion(questionId: string, userId?: string) {
    await this.getQuestionById(questionId);
    const archived = await examRepository.archiveQuestion(questionId);

    await AuditService.recordEvent({
      event: "QUESTION_ARCHIVED" as any,
      userId,
      details: { questionId },
    });

    return archived;
  }

  // ============================================================================
  // Marking Scheme Services
  // ============================================================================

  public async getSchemesBySubjectId(subjectId: string) {
    await this.getSubjectById(subjectId);
    return examRepository.findSchemesBySubjectId(subjectId);
  }

  public async getSchemeById(id: string) {
    const scheme = await examRepository.findSchemeById(id);
    if (!scheme || scheme.isArchived) {
      throw AppError.notFound("Marking scheme not found", "SCHEME_NOT_FOUND");
    }
    return scheme;
  }

  public async createMarkingScheme(
    subjectId: string,
    data: { title: string; instructions?: string; version?: number; status?: string },
    userId?: string
  ) {
    await this.getSubjectById(subjectId);

    // Auto versioning if not specified
    let version = data.version;
    if (!version) {
      const existing = await examRepository.findSchemesBySubjectId(subjectId);
      version = existing.length + 1;
    }

    const scheme = await examRepository.createScheme({
      title: data.title.trim(),
      instructions: data.instructions?.trim(),
      version,
      status: data.status || "DRAFT",
      subject: { connect: { id: subjectId } },
      createdBy: userId ? { connect: { id: userId } } : undefined,
    });

    await AuditService.recordEvent({
      event: "MARKING_SCHEME_CREATED" as any,
      userId,
      details: { subjectId, schemeId: scheme.id, version: scheme.version },
    });

    return scheme;
  }

  public async updateMarkingScheme(
    id: string,
    data: { title?: string; instructions?: string; status?: string },
    userId?: string
  ) {
    await this.getSchemeById(id);
    const updated = await examRepository.updateScheme(id, data);

    await AuditService.recordEvent({
      event: "MARKING_SCHEME_UPDATED" as any,
      userId,
      details: { schemeId: id },
    });

    return updated;
  }

  // ============================================================================
  // Marking Criteria Services
  // ============================================================================

  public async getCriteriaByQuestionId(questionId: string) {
    await this.getQuestionById(questionId);
    return examRepository.findCriteriaByQuestionId(questionId);
  }

  public async createCriterion(
    questionId: string,
    data: {
      name: string;
      description?: string;
      maximumMarks: number;
      orderIndex?: number;
      partialCreditAllowed?: boolean;
      alternateMethodAccepted?: boolean;
    },
    userId?: string
  ) {
    const question = await this.getQuestionById(questionId);

    if (data.maximumMarks <= 0) {
      throw AppError.badRequest("Criterion marks must be greater than 0", "INVALID_MARKS");
    }

    // Validate that criterion does not exceed question maximum marks individually
    if (data.maximumMarks > question.maximumMarks) {
      throw AppError.badRequest(
        `Criterion marks (${data.maximumMarks}) cannot exceed question maximum marks (${question.maximumMarks})`,
        "EXCEEDS_QUESTION_MARKS"
      );
    }

    const criterion = await examRepository.createCriterion({
      name: data.name.trim(),
      description: data.description?.trim(),
      maximumMarks: data.maximumMarks,
      orderIndex: data.orderIndex || 1,
      partialCreditAllowed: data.partialCreditAllowed ?? true,
      alternateMethodAccepted: data.alternateMethodAccepted ?? false,
      question: { connect: { id: questionId } },
    });

    await AuditService.recordEvent({
      event: "CRITERION_CREATED" as any,
      userId,
      details: { questionId, criterionId: criterion.id },
    });

    return criterion;
  }

  public async updateCriterion(
    criterionId: string,
    data: {
      name?: string;
      description?: string;
      maximumMarks?: number;
      orderIndex?: number;
      partialCreditAllowed?: boolean;
      alternateMethodAccepted?: boolean;
    },
    userId?: string
  ) {
    const criterion = await examRepository.findCriterionById(criterionId);
    if (!criterion) {
      throw AppError.notFound("Marking criterion not found", "CRITERION_NOT_FOUND");
    }

    if (data.maximumMarks !== undefined && data.maximumMarks <= 0) {
      throw AppError.badRequest("Criterion marks must be greater than 0", "INVALID_MARKS");
    }

    const updated = await examRepository.updateCriterion(criterionId, data);

    await AuditService.recordEvent({
      event: "CRITERION_UPDATED" as any,
      userId,
      details: { criterionId },
    });

    return updated;
  }

  public async deleteCriterion(criterionId: string, userId?: string) {
    const criterion = await examRepository.findCriterionById(criterionId);
    if (!criterion) {
      throw AppError.notFound("Marking criterion not found", "CRITERION_NOT_FOUND");
    }

    const deleted = await examRepository.deleteCriterion(criterionId);

    await AuditService.recordEvent({
      event: "CRITERION_DELETED" as any,
      userId,
      details: { criterionId },
    });

    return deleted;
  }

  // ============================================================================
  // Examiner Assignment Services
  // ============================================================================

  public async getAssignmentsBySubjectId(subjectId: string) {
    await this.getSubjectById(subjectId);
    return examRepository.findAssignmentsBySubjectId(subjectId);
  }

  public async assignExaminer(
    subjectId: string,
    data: { examinerId: string; examId?: string; status?: string },
    assignedById?: string
  ) {
    const subject = await this.getSubjectById(subjectId);

    // Verify user exists and has role 'EXAMINER'
    const examinerUser = await userRepository.findById(data.examinerId);
    if (!examinerUser) {
      throw AppError.notFound("Examiner user not found", "USER_NOT_FOUND");
    }

    if (examinerUser.role.name !== "EXAMINER") {
      throw AppError.badRequest(
        `User '${examinerUser.fullName}' has role '${examinerUser.role.name}'. Only users with role 'EXAMINER' can be assigned.`,
        "INVALID_EXAMINER_ROLE"
      );
    }

    // Check if assignment already exists
    const existing = await examRepository.findAssignmentsBySubjectId(subjectId);
    const alreadyAssigned = existing.find((a) => a.examinerId === data.examinerId);

    if (alreadyAssigned) {
      throw AppError.conflict(
        `Examiner '${examinerUser.fullName}' is already assigned to this subject`,
        "ALREADY_ASSIGNED"
      );
    }

    const assignment = await examRepository.createAssignment({
      subject: { connect: { id: subjectId } },
      exam: { connect: { id: subject.examId } },
      examiner: { connect: { id: data.examinerId } },
      assignedBy: assignedById ? { connect: { id: assignedById } } : undefined,
      status: data.status || "ACTIVE",
    });

    await AuditService.recordEvent({
      event: "EXAMINER_ASSIGNED" as any,
      userId: assignedById,
      details: { subjectId, examinerId: data.examinerId, examId: subject.examId },
    });

    return assignment;
  }

  public async removeExaminerAssignment(subjectId: string, examinerId: string, userId?: string) {
    await this.getSubjectById(subjectId);

    try {
      const removed = await examRepository.deleteAssignment(subjectId, examinerId);

      await AuditService.recordEvent({
        event: "EXAMINER_REMOVED" as any,
        userId,
        details: { subjectId, examinerId },
      });

      return removed;
    } catch {
      throw AppError.notFound("Assignment record not found", "ASSIGNMENT_NOT_FOUND");
    }
  }
}

export const examService = new ExamService();
