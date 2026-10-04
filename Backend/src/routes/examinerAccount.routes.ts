import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { createExaminerSchema } from "../schemas/user.schemas";
import { examinerAccountService } from "../services/examinerAccount.service";
import { ApiResponse } from "../utils/api-response";

export const examinerAccountRoutes = Router();

examinerAccountRoutes.use(requireAuth);

examinerAccountRoutes.get("/", requireRole("SUPER_ADMIN", "HEAD_EXAMINER"), async (_req, res, next) => {
  try {
    ApiResponse.success(res, await examinerAccountService.list());
  } catch (error) {
    next(error);
  }
});

examinerAccountRoutes.post("/", requireRole("SUPER_ADMIN"), validateRequest({ body: createExaminerSchema }), async (req, res, next) => {
  try {
    const examiner = await examinerAccountService.create(req.body, req.user!.id);
    ApiResponse.success(res, examiner, 201);
  } catch (error) {
    next(error);
  }
});
