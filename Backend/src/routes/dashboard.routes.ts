import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { dashboardService } from "../services/dashboard.service";
import { ApiResponse } from "../utils/api-response";

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

// GET /api/v1/dashboards/examiner
dashboardRoutes.get("/examiner", requireRole("EXAMINER", "HEAD_EXAMINER", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const data = await dashboardService.getExaminerDashboard(userId);
    ApiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/dashboards/examiner/reports
dashboardRoutes.get("/examiner/reports", requireRole("EXAMINER", "HEAD_EXAMINER", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const data = await dashboardService.getExaminerReports(userId);
    ApiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
});


// GET /api/v1/dashboards/head-examiner
dashboardRoutes.get("/head-examiner", requireRole("HEAD_EXAMINER", "SUPER_ADMIN"), async (_req, res, next) => {
  try {
    const data = await dashboardService.getHeadExaminerDashboard();
    ApiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/dashboards/super-admin
dashboardRoutes.get("/super-admin", requireRole("SUPER_ADMIN"), async (_req, res, next) => {
  try {
    const data = await dashboardService.getSuperAdminDashboard();
    ApiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
});
