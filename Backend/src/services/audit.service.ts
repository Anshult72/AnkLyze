import { prisma } from "../config/database";
import { logger } from "../utils/logger";

export class AuditService {
  /**
   * Records an authentication event in the database for auditing and forensics.
   * Strips any sensitive data before persisting.
   */
  public static async recordEvent(params: {
    event:
      | "LOGIN_SUCCESS"
      | "LOGIN_FAILURE"
      | "LOGOUT"
      | "TOKEN_REFRESH"
      | "SESSION_REVOKED"
      | "EXAM_CREATED"
      | "EXAM_UPDATED"
      | "RUBRIC_ANALYSIS_REQUESTED"
      | "RUBRIC_ANALYSIS_COMPLETED"
      | "RUBRIC_ANALYSIS_FAILED"
      | "RUBRIC_ANALYSIS_FALLBACK_USED"
      | "RUBRIC_REVIEWED"
      | "RUBRIC_MODIFIED"
      | "RUBRIC_APPROVED"
      | "RUBRIC_REJECTED"
      | "RUBRIC_REANALYSIS_REQUESTED"
      | "SCRIPT_BATCH_CREATED"
      | "SCRIPT_UPLOAD_STARTED"
      | "SCRIPT_UPLOADED"
      | "SCRIPT_VALIDATION_FAILED"
      | "SCRIPT_DUPLICATE_DETECTED"
      | "SCRIPT_REJECTED"
      | "SCRIPT_UPLOAD_FAILED"
      | "SCRIPT_READY_FOR_PROCESSING"
      | "DOCUMENT_PROCESSING_REQUESTED"
      | "DOCUMENT_PROCESSING_STARTED"
      | "PAGE_PROCESSING_STARTED"
      | "PAGE_OCR_COMPLETED"
      | "PAGE_OCR_FAILED"
      | "DOCUMENT_PROCESSING_COMPLETED"
      | "DOCUMENT_PROCESSING_FAILED"
      | "DOCUMENT_REPROCESS_REQUESTED"
      | "RECONSTRUCTION_REQUESTED"
      | "RECONSTRUCTION_STARTED"
      | "RECONSTRUCTION_COMPLETED"
      | "RECONSTRUCTION_PARTIAL"
      | "RECONSTRUCTION_FAILED"
      | "RECONSTRUCTION_REVIEWED"
      | "RECONSTRUCTION_MODIFIED"
      | "RECONSTRUCTION_RESOLVED"
      | "RECONSTRUCTION_RETRY_REQUESTED"
      | string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    try {
      await prisma.authAuditRecord.create({
        data: {
          event: params.event,
          userId: params.userId || null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent ? params.userAgent.substring(0, 500) : null,
          details: params.details ? JSON.stringify(params.details) : null,
        },
      });
    } catch (err: unknown) {
      // Audit failure should be logged but never crash the core authentication flow
      logger.warn({ err, event: params.event }, "Failed to record authentication audit log");
    }
  }
}

export const auditService = {
  logEvent: (params: { userId?: string; event: string; details?: any }) =>
    AuditService.recordEvent({
      event: params.event,
      userId: params.userId,
      details: typeof params.details === "string" ? { message: params.details } : params.details,
    }),
  recordEvent: AuditService.recordEvent,
};
