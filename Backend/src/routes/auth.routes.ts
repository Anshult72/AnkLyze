import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validation.middleware";
import { requireAuth } from "../middleware/auth.middleware";
import { loginBodySchema, refreshBodySchema } from "../schemas/auth.schemas";
import { authRateLimiter } from "../middleware/security.middleware";

const router = Router();

// Public Authentication Endpoints
router.post("/login", authRateLimiter, validateRequest({ body: loginBodySchema }), (req, res, next) => {
  authController.login(req, res, next);
});

router.post("/refresh", authRateLimiter, validateRequest({ body: refreshBodySchema }), (req, res, next) => {
  authController.refresh(req, res, next);
});

router.post("/logout", (req, res, next) => {
  authController.logout(req, res, next);
});

// Authenticated User Profile
router.get("/me", requireAuth, (req, res, next) => {
  authController.me(req, res, next);
});

export const authRoutes = router;
