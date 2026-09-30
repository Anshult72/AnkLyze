import { Request, Response } from "express";
import { resultService } from "../services/result.service";
import { ResultRepository } from "../repositories/result.repository";
import { realtimeService } from "../services/realtime.service";
import {
  generateResultSchema,
  listResultsQuerySchema,
  requestRevaluationSchema,
  authorizeRevaluationSchema,
  completeRevaluationSchema,
} from "../schemas/result.schema";

export class ResultController {
  private repository: ResultRepository;

  constructor(repository: ResultRepository = new ResultRepository()) {
    this.repository = repository;
  }

  generateResult = async (req: Request, res: Response) => {
    try {
      const parsed = generateResultSchema.parse(req.body);
      const userId = (req as any).user?.id || "SYSTEM";
      const result = await resultService.generateResult(parsed.scriptId, userId, parsed.forceNewVersion);
      if (result) {
        realtimeService.emitResultValidationUpdated(result.id, result.scriptId, {
          version: result.version,
          validationStatus: result.validationStatus,
        });
      }
      return res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  listResults = async (req: Request, res: Response) => {
    try {
      const filters = listResultsQuerySchema.parse(req.query);
      const data = await this.repository.listResults(filters);
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  getResultById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await this.repository.findResultById(id);
      if (!result) {
        return res.status(404).json({ success: false, error: "Result not found" });
      }
      return res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  validateResult = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.id || "SYSTEM";
      const validation = await resultService.validateExistingResult(id, userId);
      realtimeService.emitResultValidationUpdated(id, (validation as any).result?.scriptId || id, {
        status: (validation as any).validation?.status || "VALIDATED",
      });
      return res.status(200).json({ success: true, data: validation });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  getResultValidation = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await this.repository.findResultById(id);
      if (!result) {
        return res.status(404).json({ success: false, error: "Result not found" });
      }
      return res.status(200).json({
        success: true,
        data: {
          validationStatus: result.validationStatus,
          passed: result.validationStatus === "PASSED",
          validations: result.validations,
        },
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  getResultQuestions = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await this.repository.findResultById(id);
      if (!result) {
        return res.status(404).json({ success: false, error: "Result not found" });
      }
      return res.status(200).json({ success: true, data: result.questionMarks });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  getResultProvenance = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await this.repository.findResultById(id);
      if (!result) {
        return res.status(404).json({ success: false, error: "Result not found" });
      }

      const provenanceTree = {
        resultId: result.id,
        version: result.version,
        fingerprint: result.fingerprint,
        validationStatus: result.validationStatus,
        approvedBy: result.approvedBy,
        approvedAt: result.approvedAt,
        questions: result.questionMarks.map((qm) => ({
          questionNumber: qm.questionNumber,
          awardedMarks: qm.awardedMarks,
          maximumMarks: qm.maximumMarks,
          sourceDecisionId: qm.sourceDecisionId,
          sourceModerationDecisionId: qm.sourceModerationDecisionId,
        })),
        supersedesResultId: result.supersedesResultId,
      };

      return res.status(200).json({ success: true, data: provenanceTree });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  approveResult = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const user = (req as any).user;
      const approved = await resultService.approveResult(id, user.id, user.role);
      realtimeService.emitResultApproved(approved.id, approved.scriptId, {
        approvedBy: user.id,
        approvedAt: approved.approvedAt,
        version: approved.version,
      });
      return res.status(200).json({ success: true, data: approved });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  getExplainableReport = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
      const report = await resultService.generateExplainableReport(id, version);
      return res.status(200).json({ success: true, data: report });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  getResultHistory = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await this.repository.findResultById(id);
      if (!result) {
        return res.status(404).json({ success: false, error: "Result not found" });
      }

      // Fetch all versions for this script
      const allVersions = await this.repository.listResults({
        scriptId: result.scriptId,
        limit: 50,
      });

      return res.status(200).json({ success: true, data: allVersions.items });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  requestRevaluation = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const user = (req as any).user;
      const parsed = requestRevaluationSchema.parse({ ...req.body, resultId: id });
      const reval = await resultService.requestRevaluation({
        ...parsed,
        requestedById: user.id,
      });
      realtimeService.emitRevaluationUpdated(id, "", {
        revaluationId: reval.id,
        status: reval.status,
      });
      return res.status(201).json({ success: true, data: reval });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  listRevaluations = async (req: Request, res: Response) => {
    try {
      const filters = req.query as any;
      const data = await this.repository.listRevaluationRequests(filters);
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  getRevaluationById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const data = await this.repository.findRevaluationRequestById(id);
      if (!data) {
        return res.status(404).json({ success: false, error: "RevaluationRequest not found" });
      }
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  authorizeRevaluation = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const user = (req as any).user;
      const parsed = authorizeRevaluationSchema.parse(req.body);
      const data = await resultService.authorizeRevaluation(id, user.id, user.role, parsed.authorize);
      realtimeService.emitRevaluationUpdated(data.resultId, "", {
        revaluationId: data.id,
        status: data.status,
      });
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  completeRevaluation = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const user = (req as any).user;
      const parsed = completeRevaluationSchema.parse(req.body);
      const data = await resultService.completeRevaluation({
        revaluationId: id,
        reviewerId: user.id,
        userRole: user.role,
        changedQuestionDecisions: parsed.changedQuestionDecisions,
      });
      if (data && (data as any).newResult) {
        realtimeService.emitRevaluationUpdated((data as any).newResult.id, (data as any).newResult.scriptId, {
          revaluationId: id,
          newResultVersion: (data as any).newResult.version,
          status: "COMPLETED",
        });
      }
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };
}

export const resultController = new ResultController();
