import { prisma } from "../config/database";
import { Exam, Subject, Question, MarkingScheme, MarkingCriterion, ExaminerAssignment, Prisma } from "@prisma/client";

export class ExamRepository {
  // ============================================================================
  // Exam Operations
  // ============================================================================

  public async findAllExams(includeArchived = false) {
    return prisma.exam.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { subjects: true, assignments: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  public async findExamById(id: string) {
    return prisma.exam.findUnique({
      where: { id },
      include: {
        subjects: {
          where: { isArchived: false },
          orderBy: { code: "asc" },
          include: {
            _count: { select: { questions: true, markingSchemes: true, assignments: true } },
          },
        },
        assignments: {
          include: {
            examiner: {
              select: { id: true, fullName: true, email: true, department: true, institution: true },
            },
          },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  public async findExamByCode(code: string) {
    return prisma.exam.findUnique({
      where: { code: code.toUpperCase().trim() },
    });
  }

  public async createExam(data: Prisma.ExamCreateInput): Promise<Exam> {
    return prisma.exam.create({ data });
  }

  public async updateExam(id: string, data: Prisma.ExamUpdateInput): Promise<Exam> {
    return prisma.exam.update({
      where: { id },
      data,
    });
  }

  public async archiveExam(id: string): Promise<Exam> {
    return prisma.exam.update({
      where: { id },
      data: { isArchived: true, status: "ARCHIVED" },
    });
  }

  // ============================================================================
  // Subject Operations
  // ============================================================================

  public async findSubjectsByExamId(examId: string) {
    return prisma.subject.findMany({
      where: { examId, isArchived: false },
      orderBy: { code: "asc" },
      include: {
        _count: { select: { questions: true, markingSchemes: true, assignments: true } },
      },
    });
  }

  public async findSubjectById(id: string) {
    return prisma.subject.findUnique({
      where: { id },
      include: {
        exam: true,
        questions: {
          where: { isArchived: false },
          orderBy: { orderIndex: "asc" },
          include: {
            criteria: { orderBy: { orderIndex: "asc" } },
          },
        },
        markingSchemes: {
          where: { isArchived: false },
          orderBy: { version: "desc" },
        },
        assignments: {
          include: {
            examiner: {
              select: { id: true, fullName: true, email: true, department: true, institution: true },
            },
          },
        },
      },
    });
  }

  public async findSubjectByCode(examId: string, code: string) {
    return prisma.subject.findUnique({
      where: {
        examId_code: {
          examId,
          code: code.toUpperCase().trim(),
        },
      },
    });
  }

  public async createSubject(data: Prisma.SubjectCreateInput): Promise<Subject> {
    return prisma.subject.create({ data });
  }

  public async updateSubject(id: string, data: Prisma.SubjectUpdateInput): Promise<Subject> {
    return prisma.subject.update({
      where: { id },
      data,
    });
  }

  public async archiveSubject(id: string): Promise<Subject> {
    return prisma.subject.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  // ============================================================================
  // Question Operations
  // ============================================================================

  public async findQuestionsBySubjectId(subjectId: string) {
    return prisma.question.findMany({
      where: { subjectId, isArchived: false },
      orderBy: { orderIndex: "asc" },
      include: {
        criteria: { orderBy: { orderIndex: "asc" } },
      },
    });
  }

  public async findQuestionById(id: string) {
    return prisma.question.findUnique({
      where: { id },
      include: {
        criteria: { orderBy: { orderIndex: "asc" } },
        subject: {
          include: { exam: true },
        },
      },
    });
  }

  public async findQuestionByNumber(subjectId: string, questionNumber: string) {
    return prisma.question.findUnique({
      where: {
        subjectId_questionNumber: {
          subjectId,
          questionNumber: questionNumber.trim(),
        },
      },
    });
  }

  public async createQuestion(data: Prisma.QuestionCreateInput): Promise<Question> {
    return prisma.question.create({
      data,
      include: { criteria: true },
    });
  }

  public async updateQuestion(id: string, data: Prisma.QuestionUpdateInput): Promise<Question> {
    return prisma.question.update({
      where: { id },
      data,
      include: { criteria: true },
    });
  }

  public async reorderQuestions(orders: Array<{ id: string; orderIndex: number }>) {
    return prisma.$transaction(
      orders.map((item) =>
        prisma.question.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );
  }

  public async archiveQuestion(id: string): Promise<Question> {
    return prisma.question.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  // ============================================================================
  // Marking Scheme Operations
  // ============================================================================

  public async findSchemesBySubjectId(subjectId: string) {
    return prisma.markingScheme.findMany({
      where: { subjectId, isArchived: false },
      orderBy: { version: "desc" },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  public async findSchemeById(id: string) {
    return prisma.markingScheme.findUnique({
      where: { id },
      include: {
        subject: {
          include: {
            questions: {
              where: { isArchived: false },
              orderBy: { orderIndex: "asc" },
              include: { criteria: { orderBy: { orderIndex: "asc" } } },
            },
          },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  public async createScheme(data: Prisma.MarkingSchemeCreateInput): Promise<MarkingScheme> {
    return prisma.markingScheme.create({ data });
  }

  public async updateScheme(id: string, data: Prisma.MarkingSchemeUpdateInput): Promise<MarkingScheme> {
    return prisma.markingScheme.update({
      where: { id },
      data,
    });
  }

  // ============================================================================
  // Marking Criterion Operations
  // ============================================================================

  public async findCriteriaByQuestionId(questionId: string) {
    return prisma.markingCriterion.findMany({
      where: { questionId },
      orderBy: { orderIndex: "asc" },
    });
  }

  public async findCriterionById(id: string) {
    return prisma.markingCriterion.findUnique({
      where: { id },
      include: { question: true },
    });
  }

  public async createCriterion(data: Prisma.MarkingCriterionCreateInput): Promise<MarkingCriterion> {
    return prisma.markingCriterion.create({ data });
  }

  public async updateCriterion(id: string, data: Prisma.MarkingCriterionUpdateInput): Promise<MarkingCriterion> {
    return prisma.markingCriterion.update({
      where: { id },
      data,
    });
  }

  public async deleteCriterion(id: string): Promise<MarkingCriterion> {
    return prisma.markingCriterion.delete({
      where: { id },
    });
  }

  // ============================================================================
  // Examiner Assignment Operations
  // ============================================================================

  public async findAssignmentsBySubjectId(subjectId: string) {
    return prisma.examinerAssignment.findMany({
      where: { subjectId },
      include: {
        examiner: {
          select: { id: true, fullName: true, email: true, department: true, institution: true, status: true },
        },
        assignedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  public async createAssignment(data: Prisma.ExaminerAssignmentCreateInput): Promise<ExaminerAssignment> {
    return prisma.examinerAssignment.create({
      data,
      include: {
        examiner: {
          select: { id: true, fullName: true, email: true, department: true, institution: true },
        },
      },
    });
  }

  public async deleteAssignment(subjectId: string, examinerId: string) {
    return prisma.examinerAssignment.delete({
      where: {
        subjectId_examinerId: {
          subjectId,
          examinerId,
        },
      },
    });
  }
}

export const examRepository = new ExamRepository();
