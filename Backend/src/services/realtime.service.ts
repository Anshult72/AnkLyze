/**
 * ANKLYZE Phase 15 - Realtime Event Service
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Emits targeted events to specific authorization rooms.
 * - Non-blocking: REST APIs will never fail if Socket.IO server is inactive or errors.
 * - Adheres strictly to the standard ANKLYZE event taxonomy.
 */

import { getSocketServer } from "../socket/socket.server";
import { logger } from "../utils/logger";

export class RealtimeService {
  /**
   * Helper to safely broadcast an event to a room.
   */
  private static emitToRoom(room: string, event: string, payload: any): void {
    try {
      const io = getSocketServer();
      if (!io) {
        logger.debug({ room, event }, "Realtime event skipped (Socket server not active)");
        return;
      }

      io.to(room).emit(event, {
        event,
        room,
        timestamp: new Date().toISOString(),
        data: payload,
      });

      logger.debug({ room, event }, "✓ Realtime event broadcast to room");
    } catch (err: any) {
      logger.warn({ err: err.message, room, event }, "Failed to emit realtime event");
    }
  }

  // ---------------------------------------------------------------------------
  // Script & OCR Processing Lifecycle Events
  // ---------------------------------------------------------------------------

  public static emitScriptProcessingUpdated(scriptId: string, payload: any): void {
    this.emitToRoom(`script:${scriptId}`, "SCRIPT_PROCESSING_UPDATED", {
      scriptId,
      ...payload,
    });
  }

  public static emitOcrProcessingUpdated(scriptId: string, payload: any): void {
    this.emitToRoom(`script:${scriptId}`, "OCR_PROCESSING_UPDATED", {
      scriptId,
      ...payload,
    });
  }

  // ---------------------------------------------------------------------------
  // Evaluation Lifecycle Events
  // ---------------------------------------------------------------------------

  public static emitEvaluationStatusUpdated(
    evaluationId: string,
    scriptId: string,
    payload: any
  ): void {
    this.emitToRoom(`evaluation:${evaluationId}`, "EVALUATION_STATUS_UPDATED", {
      evaluationId,
      scriptId,
      ...payload,
    });
    this.emitToRoom(`script:${scriptId}`, "EVALUATION_STATUS_UPDATED", {
      evaluationId,
      scriptId,
      ...payload,
    });
  }

  // ---------------------------------------------------------------------------
  // Risk & Double Evaluation Events
  // ---------------------------------------------------------------------------

  public static emitRiskAssessmentUpdated(
    evaluationId: string,
    scriptId: string,
    payload: any
  ): void {
    this.emitToRoom(`evaluation:${evaluationId}`, "RISK_ASSESSMENT_UPDATED", {
      evaluationId,
      scriptId,
      ...payload,
    });
    this.emitToRoom(`script:${scriptId}`, "RISK_ASSESSMENT_UPDATED", {
      evaluationId,
      scriptId,
      ...payload,
    });
  }

  public static emitSecondEvaluationRequested(scriptId: string, payload: any): void {
    this.emitToRoom(`script:${scriptId}`, "SECOND_EVALUATION_REQUESTED", {
      scriptId,
      ...payload,
    });
  }

  public static emitSecondEvaluationCompleted(scriptId: string, payload: any): void {
    this.emitToRoom(`script:${scriptId}`, "SECOND_EVALUATION_COMPLETED", {
      scriptId,
      ...payload,
    });
  }

  // ---------------------------------------------------------------------------
  // Moderation Events
  // ---------------------------------------------------------------------------

  public static emitModerationCaseCreated(caseId: string, examId: string, payload: any): void {
    this.emitToRoom(`moderation:${caseId}`, "MODERATION_CASE_CREATED", {
      caseId,
      examId,
      ...payload,
    });
    this.emitToRoom(`exam:${examId}`, "MODERATION_CASE_CREATED", {
      caseId,
      examId,
      ...payload,
    });
  }

  public static emitModerationCaseUpdated(caseId: string, payload: any): void {
    this.emitToRoom(`moderation:${caseId}`, "MODERATION_CASE_UPDATED", {
      caseId,
      ...payload,
    });
  }

  // ---------------------------------------------------------------------------
  // Result & Revaluation Events
  // ---------------------------------------------------------------------------

  public static emitResultValidationUpdated(
    resultId: string,
    scriptId: string,
    payload: any
  ): void {
    this.emitToRoom(`result:${resultId}`, "RESULT_VALIDATION_UPDATED", {
      resultId,
      scriptId,
      ...payload,
    });
    this.emitToRoom(`script:${scriptId}`, "RESULT_VALIDATION_UPDATED", {
      resultId,
      scriptId,
      ...payload,
    });
  }

  public static emitResultApproved(resultId: string, scriptId: string, payload: any): void {
    this.emitToRoom(`result:${resultId}`, "RESULT_APPROVED", {
      resultId,
      scriptId,
      ...payload,
    });
    this.emitToRoom(`script:${scriptId}`, "RESULT_APPROVED", {
      resultId,
      scriptId,
      ...payload,
    });
  }

  public static emitRevaluationUpdated(resultId: string, scriptId: string, payload: any): void {
    this.emitToRoom(`result:${resultId}`, "REVALUATION_UPDATED", {
      resultId,
      scriptId,
      ...payload,
    });
    this.emitToRoom(`script:${scriptId}`, "REVALUATION_UPDATED", {
      resultId,
      scriptId,
      ...payload,
    });
  }
}

export const realtimeService = RealtimeService;
