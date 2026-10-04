import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { questionPaperService } from "../services/questionPaper.service";
import { ApiResponse } from "../utils/api-response";
import { AppError } from "../utils/app-error";

export const questionPaperRoutes = Router();
const manage = [requireAuth, requireRole("SUPER_ADMIN", "HEAD_EXAMINER")];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, file.originalname.toLowerCase().endsWith(".pdf") &&
    ["application/pdf", "application/x-pdf"].includes(file.mimetype)) });
const uuid = z.string().uuid();
const itemFields = {
  questionNumber: z.string().trim().min(1).max(40),
  questionText: z.string().trim().min(3).max(20000),
  maximumMarks: z.number().positive().max(1000),
  section: z.string().trim().max(120).nullable().optional(),
  pageNumber: z.number().int().min(1),
};
const reviewSchema = z.object({
  questionNumber: itemFields.questionNumber.optional(),
  questionText: itemFields.questionText.optional(),
  maximumMarks: itemFields.maximumMarks.optional(),
  section: itemFields.section,
  pageNumber: itemFields.pageNumber.optional(),
  reviewStatus: z.enum(["VERIFIED", "REJECTED"]),
});

questionPaperRoutes.get("/subjects/:subjectId", ...manage, async (req, res, next) => {
  try { const subjectId = uuid.parse(req.params.subjectId); ApiResponse.success(res, await questionPaperService.list(subjectId)); }
  catch (error) { next(error); }
});
questionPaperRoutes.post("/subjects/:subjectId", ...manage, upload.single("file"), async (req, res, next) => {
  try {
    const subjectId = uuid.parse(req.params.subjectId);
    if (!req.file) throw AppError.badRequest("PDF file is required", "PAPER_REQUIRED");
    ApiResponse.success(res, await questionPaperService.upload(subjectId, req.file, req.user!.id), 201);
  } catch (error) { next(error); }
});
questionPaperRoutes.get("/:paperId", ...manage, async (req, res, next) => {
  try { const paperId = uuid.parse(req.params.paperId); ApiResponse.success(res, await questionPaperService.get(paperId)); }
  catch (error) { next(error); }
});
questionPaperRoutes.post("/:paperId/process", ...manage, async (req, res, next) => {
  try { const paperId = uuid.parse(req.params.paperId); ApiResponse.success(res, await questionPaperService.process(paperId, req.user!.id)); }
  catch (error) { next(error); }
});
questionPaperRoutes.post("/:paperId/items", ...manage,
  validateRequest({ body: z.object(itemFields) }), async (req, res, next) => {
    try { const paperId = uuid.parse(req.params.paperId); ApiResponse.success(res, await questionPaperService.addItem(paperId, req.body, req.user!.id), 201); }
    catch (error) { next(error); }
  });
questionPaperRoutes.patch("/:paperId/items/:itemId", ...manage,
  validateRequest({ body: reviewSchema }), async (req, res, next) => {
    try { const paperId = uuid.parse(req.params.paperId); const itemId = uuid.parse(req.params.itemId);
      ApiResponse.success(res, await questionPaperService.reviewItem(paperId, itemId, req.body, req.user!.id)); }
    catch (error) { next(error); }
  });
questionPaperRoutes.post("/:paperId/approve", ...manage, async (req, res, next) => {
  try { const paperId = uuid.parse(req.params.paperId); ApiResponse.success(res, await questionPaperService.approve(paperId, req.user!.id)); }
  catch (error) { next(error); }
});
