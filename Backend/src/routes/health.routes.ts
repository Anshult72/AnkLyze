import { Router } from "express";
import { z } from "zod";
import { healthController } from "../controllers/health.controller";
import { validateRequest } from "../middleware/validation.middleware";
import { ApiResponse } from "../utils/api-response";

const router = Router();

// GET /api/v1/health - Service Liveness Check
router.get("/", healthController.getHealth);

// GET /api/v1/health/ready - Database Connectivity Readiness Check
router.get("/ready", healthController.getReadiness);

// POST /api/v1/health/validate-test - Request Validation Demo Check
router.post(
  "/validate-test",
  validateRequest({
    body: z.object({
      examCode: z.string().min(3, "examCode must have at least 3 characters"),
      maxMarks: z.number().positive("maxMarks must be a positive number"),
    }),
  }),
  (req, res) => {
    ApiResponse.success(res, { validated: true, data: req.body }, 200);
  }
);

export const healthRoutes = router;
