import { Request, Response, NextFunction } from 'express';
import { rubricService } from '../services/rubric.service';
import { ApiResponse } from '../utils/api-response';

function getParam(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : (val as string);
}

export class RubricController {
  public async analyzeMarkingScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const markingSchemeId = getParam(req, 'id');
      const userId = req.user!.id;
      const auditContext = {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      const analysis = await rubricService.analyzeMarkingScheme(markingSchemeId, userId, auditContext);
      ApiResponse.success(res, analysis, 201);
    } catch (error) {
      next(error);
    }
  }

  public async listAnalyses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const markingSchemeId = getParam(req, 'id');
      const analyses = await rubricService.getAnalysesBySchemeId(markingSchemeId);
      ApiResponse.success(res, analyses);
    } catch (error) {
      next(error);
    }
  }

  public async getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analysisId = getParam(req, 'analysisId');
      const userId = req.user?.id;
      const auditContext = {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      const analysis = await rubricService.getAnalysisById(analysisId, userId, auditContext);
      ApiResponse.success(res, analysis);
    } catch (error) {
      next(error);
    }
  }

  public async modifyCriterion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { criterionId, ...data } = req.body;
      const auditContext = {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      const updated = await rubricService.modifyCriterion(criterionId, data, userId, auditContext);
      ApiResponse.success(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async approveAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analysisId = getParam(req, 'analysisId');
      const userId = req.user!.id;
      const auditContext = {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      const approved = await rubricService.approveAnalysis(analysisId, userId, auditContext);
      ApiResponse.success(res, approved);
    } catch (error) {
      next(error);
    }
  }

  public async rejectAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analysisId = getParam(req, 'analysisId');
      const userId = req.user!.id;
      const { reason } = req.body;
      const auditContext = {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      const rejected = await rubricService.rejectAnalysis(analysisId, reason, userId, auditContext);
      ApiResponse.success(res, rejected);
    } catch (error) {
      next(error);
    }
  }

  public async reanalyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analysisId = getParam(req, 'analysisId');
      const userId = req.user!.id;
      const auditContext = {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      // Lookup analysis to get the markingSchemeId
      const current = await rubricService.getAnalysisById(analysisId);
      const reanalyzed = await rubricService.reanalyzeMarkingScheme(
        current.markingSchemeId,
        userId,
        auditContext
      );
      ApiResponse.success(res, reanalyzed, 201);
    } catch (error) {
      next(error);
    }
  }

  public async resolveIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const issueId = getParam(req, 'issueId');
      const userId = req.user!.id;
      const { notes } = req.body;

      const resolved = await rubricService.resolveIssue(issueId, userId, notes);
      ApiResponse.success(res, resolved);
    } catch (error) {
      next(error);
    }
  }
}

export const rubricController = new RubricController();
