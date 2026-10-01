import { prisma } from "../config/database";
import { userRepository } from "../repositories/user.repository";
import { CreateExaminerInput } from "../schemas/user.schemas";
import { PasswordService } from "../utils/password.service";
import { AuditService } from "./audit.service";
import { AppError } from "../utils/app-error";

const safeUser = {
  id: true,
  email: true,
  fullName: true,
  status: true,
  department: true,
  institution: true,
  createdAt: true,
} as const;

export class ExaminerAccountService {
  async list() {
    return prisma.user.findMany({
      where: { role: { name: "EXAMINER" } },
      select: safeUser,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CreateExaminerInput, adminId: string) {
    const email = input.email.toLowerCase().trim();
    if (await userRepository.findByEmail(email)) {
      throw AppError.conflict("An account with this email already exists", "EMAIL_ALREADY_EXISTS");
    }

    const examinerRole = await prisma.role.findUnique({ where: { name: "EXAMINER" } });
    if (!examinerRole) {
      throw AppError.internal("Examiner role is not configured. Seed the database first.");
    }

    const passwordHash = await PasswordService.hashPassword(input.password);
    const examiner = await prisma.user.create({
      data: {
        email,
        fullName: input.fullName.trim(),
        passwordHash,
        roleId: examinerRole.id,
        department: input.department?.trim() || null,
        institution: input.institution?.trim() || null,
      },
      select: safeUser,
    });

    await AuditService.recordEvent({
      event: "EXAMINER_ACCOUNT_CREATED",
      userId: adminId,
      details: { examinerId: examiner.id, email: examiner.email },
    });

    return examiner;
  }
}

export const examinerAccountService = new ExaminerAccountService();
