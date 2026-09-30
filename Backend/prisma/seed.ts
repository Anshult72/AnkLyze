import { PrismaClient, ExamStatus, UserStatus } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function hashDemoPassword(plain: string): Promise<string> {
  return argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
}

async function main() {
  console.log("🌱 [ANKLYZE] Seeding development database foundation & authentication...");

  // 1. Seed Roles (SUPER_ADMIN, HEAD_EXAMINER, EXAMINER, MODERATOR)
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: {
      name: "SUPER_ADMIN",
      description: "Platform and system administrator with full configuration and governance privileges.",
    },
  });

  const headExaminerRole = await prisma.role.upsert({
    where: { name: "HEAD_EXAMINER" },
    update: {},
    create: {
      name: "HEAD_EXAMINER",
      description: "Chief academic officer supervising question grading standards and final evaluations.",
    },
  });

  const examinerRole = await prisma.role.upsert({
    where: { name: "EXAMINER" },
    update: {},
    create: {
      name: "EXAMINER",
      description: "Academic faculty authorized to evaluate scanned student answer booklets.",
    },
  });

  const moderatorRole = await prisma.role.upsert({
    where: { name: "MODERATOR" },
    update: {},
    create: {
      name: "MODERATOR",
      description: "Senior reviewer authorized to audit flagged responses and resolve marks discrepancies.",
    },
  });

  console.log("✓ Roles seeded: SUPER_ADMIN, HEAD_EXAMINER, EXAMINER, MODERATOR");

  // Hash standard fictional demo password
  const demoPasswordHash = await hashDemoPassword("AnklyzeDemo#2026");

  // 2. Seed Fictional Development Demo Users (Only Argon2id hashes stored)
  const usersToSeed = [
    {
      email: "superadmin@anklyze.demo",
      fullName: "ANKLYZE Platform Administrator",
      roleId: superAdminRole.id,
      status: UserStatus.ACTIVE,
      department: "Information Technology & Governance",
      institution: "State Examination Authority, MP",
    },
    {
      email: "head.examiner@anklyze.demo",
      fullName: "Prof. M. Joshi (Head Examiner)",
      roleId: headExaminerRole.id,
      status: UserStatus.ACTIVE,
      department: "Board of Technical Studies",
      institution: "State Examination Authority, MP",
    },
    {
      email: "examiner@anklyze.demo",
      fullName: "Prof. R. K. Sharma",
      roleId: examinerRole.id,
      status: UserStatus.ACTIVE,
      department: "Department of Computer Science & Engineering",
      institution: "MPOnline Examination Center #04",
    },
    {
      email: "moderator@anklyze.demo",
      fullName: "Dr. Anita Verma",
      roleId: moderatorRole.id,
      status: UserStatus.ACTIVE,
      department: "Department of Applied Mathematics",
      institution: "MPOnline Examination Center #04",
    },
    {
      email: "inactive.examiner@anklyze.demo",
      fullName: "Inactive Evaluation Staff (Test)",
      roleId: examinerRole.id,
      status: UserStatus.INACTIVE,
      department: "Department of Civil Engineering",
      institution: "Center #12",
    },
    {
      email: "suspended.examiner@anklyze.demo",
      fullName: "Suspended Account (Test)",
      roleId: examinerRole.id,
      status: UserStatus.SUSPENDED,
      department: "Department of Electrical Engineering",
      institution: "Center #09",
    },
  ];

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: demoPasswordHash,
        status: u.status,
        roleId: u.roleId,
        fullName: u.fullName,
      },
      create: {
        email: u.email,
        passwordHash: demoPasswordHash,
        fullName: u.fullName,
        status: u.status,
        roleId: u.roleId,
        department: u.department,
        institution: u.institution,
      },
    });
  }

  console.log("✓ Fictional demo users seeded with Argon2id password hashes");

  // 3. Seed Fictional Demo Exam & Subjects
  const demoExam = await prisma.exam.upsert({
    where: { code: "EXAM-2026-W-CS3" },
    update: {
      status: ExamStatus.ACTIVE,
      semester: "Semester III",
      academicYear: "2025-2026",
      totalMarks: 70,
    },
    create: {
      title: "ANKLYZE Demo Exam - B.Tech CSE Semester III",
      code: "EXAM-2026-W-CS3",
      academicTerm: "Winter Session 2025-26",
      academicYear: "2025-2026",
      semester: "Semester III",
      institution: "MP State Board of Technical Examinations, Bhopal",
      status: ExamStatus.ACTIVE,
      totalMarks: 70,
      startDate: new Date("2026-01-10T09:00:00Z"),
      endDate: new Date("2026-02-15T17:00:00Z"),
      partialMarking: true,
      negativeMarking: false,
      anonymityEnabled: true,
    },
  });

  const subjectMath = await prisma.subject.upsert({
    where: {
      examId_code: {
        examId: demoExam.id,
        code: "CS-301",
      },
    },
    update: { maxMarks: 70 },
    create: {
      name: "Engineering Mathematics III",
      code: "CS-301",
      description: "Advanced differential equations, residue calculus, Fourier series, and matrix decomposition.",
      examId: demoExam.id,
      maxMarks: 70,
    },
  });

  const subjectDSA = await prisma.subject.upsert({
    where: {
      examId_code: {
        examId: demoExam.id,
        code: "CS-302",
      },
    },
    update: { maxMarks: 70 },
    create: {
      name: "Data Structures & Algorithms",
      code: "CS-302",
      description: "Algorithm analysis, balanced trees, graph traversal, and dynamic programming paradigms.",
      examId: demoExam.id,
      maxMarks: 70,
    },
  });

  // 4. Seed Fictional Structured Question Paper for CS-301
  const q01 = await prisma.question.upsert({
    where: {
      subjectId_questionNumber: {
        subjectId: subjectMath.id,
        questionNumber: "Q01",
      },
    },
    update: {},
    create: {
      subjectId: subjectMath.id,
      questionNumber: "Q01",
      questionText: "Define eigenvalues and eigenvectors of an n x n square matrix. State the Cayley-Hamilton theorem and demonstrate how it is used to compute matrix inverse.",
      maximumMarks: 14,
      orderIndex: 1,
      section: "Section A",
    },
  });

  const q04 = await prisma.question.upsert({
    where: {
      subjectId_questionNumber: {
        subjectId: subjectMath.id,
        questionNumber: "Q04",
      },
    },
    update: {},
    create: {
      subjectId: subjectMath.id,
      questionNumber: "Q04",
      questionText: "Derive the one-dimensional wave equation for a vibrating string under uniform tension. Obtain D'Alembert's closed-form solution with initial displacement f(x) and velocity g(x).",
      maximumMarks: 7,
      orderIndex: 4,
      section: "Section B",
    },
  });

  // 5. Seed Marking Criteria for Q04
  await prisma.markingCriterion.deleteMany({ where: { questionId: q04.id } });
  await prisma.markingCriterion.createMany({
    data: [
      {
        questionId: q04.id,
        name: "Wave PDE Formulation & Assumptions",
        description: "Clear statement of Newton's second law on string element, small deflection assumption, and horizontal tension equilibrium.",
        maximumMarks: 2.0,
        orderIndex: 1,
        partialCreditAllowed: true,
        alternateMethodAccepted: false,
      },
      {
        questionId: q04.id,
        name: "Wave Equation Derivation (∂²u/∂t² = c² ∂²u/∂x²)",
        description: "Step-by-step differential derivation establishing wave speed c = sqrt(T/rho).",
        maximumMarks: 2.0,
        orderIndex: 2,
        partialCreditAllowed: true,
        alternateMethodAccepted: true,
      },
      {
        questionId: q04.id,
        name: "D'Alembert Canonical Transformation",
        description: "Introduction of characteristic coordinates xi = x - ct and eta = x + ct, integration of ∂²u/∂xi∂eta = 0.",
        maximumMarks: 2.0,
        orderIndex: 3,
        partialCreditAllowed: true,
        alternateMethodAccepted: true,
      },
      {
        questionId: q04.id,
        name: "Initial & Boundary Condition Evaluation",
        description: "Substitution of u(x,0) = f(x) and u_t(x,0) = g(x) to yield complete D'Alembert solution formula.",
        maximumMarks: 1.0,
        orderIndex: 4,
        partialCreditAllowed: true,
        alternateMethodAccepted: false,
      },
    ],
  });

  // 6. Seed Marking Scheme for CS-301
  const existingSchemes = await prisma.markingScheme.findMany({ where: { subjectId: subjectMath.id } });
  if (existingSchemes.length === 0) {
    await prisma.markingScheme.create({
      data: {
        subjectId: subjectMath.id,
        title: "Official Evaluation Scheme - Winter 2025-26",
        instructions: "Step-marking applies to all derivation steps. Alternate valid mathematical approaches should be awarded equivalent marks.",
        status: "APPROVED",
        version: 1,
      },
    });
  }

  // 7. Seed Examiner Assignment for demo examiner
  const examinerUser = await prisma.user.findUnique({ where: { email: "examiner@anklyze.demo" } });
  const headExaminerUser = await prisma.user.findUnique({ where: { email: "head.examiner@anklyze.demo" } });

  if (examinerUser) {
    await prisma.examinerAssignment.upsert({
      where: {
        subjectId_examinerId: {
          subjectId: subjectMath.id,
          examinerId: examinerUser.id,
        },
      },
      update: { status: "ACTIVE" },
      create: {
        subjectId: subjectMath.id,
        examId: demoExam.id,
        examinerId: examinerUser.id,
        assignedById: headExaminerUser?.id,
        status: "ACTIVE",
      },
    });

    await prisma.examinerAssignment.upsert({
      where: {
        subjectId_examinerId: {
          subjectId: subjectDSA.id,
          examinerId: examinerUser.id,
        },
      },
      update: { status: "ACTIVE" },
      create: {
        subjectId: subjectDSA.id,
        examId: demoExam.id,
        examinerId: examinerUser.id,
        assignedById: headExaminerUser?.id,
        status: "ACTIVE",
      },
    });
  }

  console.log("✓ Demo exam, subjects, structured questions, criteria, and examiner assignments seeded successfully");
  console.log("🌱 [ANKLYZE] Database seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
