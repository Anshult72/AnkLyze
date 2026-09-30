import { prisma } from '../config/database';
import {
  RubricStatus,
  ConfidenceBand,
  IssueSeverity,
  RubricIssueType,
} from '@prisma/client';
import { NormalizedRubricAnalysisResult } from '../ai/types';

export class RubricRepository {
  /**
   * Retrieves marking scheme along with subject, exam, and questions + existing criteria
   */
  async findSchemeWithFullContext(markingSchemeId: string) {
    return prisma.markingScheme.findUnique({
      where: { id: markingSchemeId },
      include: {
        subject: {
          include: {
            exam: true,
            questions: {
              where: { isArchived: false },
              orderBy: { orderIndex: 'asc' },
              include: {
                criteria: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  /**
   * Retrieves the current highest analysis version for a given marking scheme
   */
  async getLatestAnalysisVersion(markingSchemeId: string): Promise<number> {
    const latest = await prisma.rubricAnalysis.findFirst({
      where: { markingSchemeId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return latest?.version || 0;
  }

  /**
   * Persists a complete normalized AI rubric analysis with questions, criteria, and detected issues
   */
  async createAnalysisRecord(
    markingSchemeId: string,
    version: number,
    normalized: NormalizedRubricAnalysisResult
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Mark previous active analyses as superseded
      await tx.rubricAnalysis.updateMany({
        where: {
          markingSchemeId,
          overallStatus: { in: [RubricStatus.ANALYSIS_COMPLETE, RubricStatus.REVIEW_REQUIRED] },
        },
        data: {
          overallStatus: RubricStatus.SUPERSEDED,
        },
      });

      // 2. Create RubricAnalysis header
      const analysis = await tx.rubricAnalysis.create({
        data: {
          markingSchemeId,
          version,
          overallStatus:
            normalized.overallStatus === 'REVIEW_REQUIRED'
              ? RubricStatus.REVIEW_REQUIRED
              : RubricStatus.ANALYSIS_COMPLETE,
          provider: normalized.provider,
          model: normalized.model,
          promptVersion: normalized.promptVersion,
          confidence: normalized.confidence,
          confidenceBand: normalized.confidenceBand as ConfidenceBand,
          fallbackUsed: normalized.fallbackUsed,
          summary: normalized.rawResponseSummary,
          metadata: JSON.stringify({
            processingDurationMs: normalized.processingDurationMs,
            questionCount: normalized.questions.length,
          }),
        },
      });

      // 3. Create questions and nested criteria & issues
      for (const qItem of normalized.questions) {
        // Find questionNumber from context if possible
        const createdQ = await tx.rubricAnalysisQuestion.create({
          data: {
            analysisId: analysis.id,
            questionId: qItem.questionId,
            questionNumber: qItem.questionId, // Will be enriched or display question ID
            specialInstructions: qItem.specialInstructions.length > 0 ? qItem.specialInstructions.join('\n') : null,
            isBalanced: !qItem.isReviewRequired,
          },
        });

        // Criteria
        for (const crit of qItem.criteria) {
          await tx.rubricAnalysisCriterion.create({
            data: {
              analysisQuestionId: createdQ.id,
              name: crit.name,
              description: crit.description,
              maximumMarks: crit.maxMarks,
              partialCreditAllowed: crit.partialCreditAllowed,
              alternateMethodAccepted: crit.alternateMethodAccepted,
              orderIndex: crit.orderIndex,
              isHumanModified: false,
            },
          });
        }

        // Question-level issues
        for (const issue of qItem.issues) {
          await tx.rubricAnalysisIssue.create({
            data: {
              analysisId: analysis.id,
              questionNumber: issue.affectedQuestionId || createdQ.questionNumber,
              type: issue.type as RubricIssueType,
              severity: issue.severity as IssueSeverity,
              issue: issue.issue,
              explanation: issue.explanation,
              suggestedClarification: issue.suggestedClarification,
            },
          });
        }
      }

      // 4. Create global issues if any
      for (const gIssue of normalized.globalIssues) {
        await tx.rubricAnalysisIssue.create({
          data: {
            analysisId: analysis.id,
            questionNumber: null,
            type: gIssue.type as RubricIssueType,
            severity: gIssue.severity as IssueSeverity,
            issue: gIssue.issue,
            explanation: gIssue.explanation,
            suggestedClarification: gIssue.suggestedClarification,
          },
        });
      }

      return analysis;
    });
  }

  /**
   * Records a failed analysis attempt safely preserving failure metadata
   */
  async createFailedAnalysisRecord(
    markingSchemeId: string,
    version: number,
    provider: string,
    model: string,
    promptVersion: string,
    failureReason: string,
    fallbackUsed: boolean
  ) {
    return prisma.rubricAnalysis.create({
      data: {
        markingSchemeId,
        version,
        overallStatus: RubricStatus.FAILED,
        provider,
        model,
        promptVersion,
        confidence: 0,
        confidenceBand: ConfidenceBand.LOW,
        fallbackUsed,
        rejectionReason: failureReason,
        metadata: JSON.stringify({ failureReason }),
      },
    });
  }

  /**
   * Retrieves an analysis by ID with full nested questions, criteria, issues, and metadata
   */
  async findAnalysisById(analysisId: string) {
    return prisma.rubricAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        markingScheme: {
          include: {
            subject: {
              include: {
                exam: true,
                questions: {
                  where: { isArchived: false },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
            createdBy: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        questions: {
          include: {
            criteria: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        issues: true,
        approvedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  /**
   * Retrieves all analysis history for a given marking scheme
   */
  async findAnalysesBySchemeId(markingSchemeId: string) {
    return prisma.rubricAnalysis.findMany({
      where: { markingSchemeId },
      orderBy: { version: 'desc' },
      include: {
        approvedBy: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { questions: true, issues: true },
        },
      },
    });
  }

  /**
   * Updates an existing criterion while preserving original AI value provenance
   */
  async updateCriterionWithProvenance(
    criterionId: string,
    data: {
      name?: string;
      description?: string;
      maxMarks?: number;
      partialCreditAllowed?: boolean;
      alternateMethodAccepted?: boolean;
      orderIndex?: number;
      userId: string;
      reason?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.rubricAnalysisCriterion.findUnique({
        where: { id: criterionId },
      });

      if (!existing) {
        throw new Error(`Criterion not found: ${criterionId}`);
      }

      // If this is the first human modification, capture original AI value as JSON string
      const originalValue = existing.originalAiValue || JSON.stringify({
        name: existing.name,
        description: existing.description,
        maximumMarks: existing.maximumMarks,
        partialCreditAllowed: existing.partialCreditAllowed,
        alternateMethodAccepted: existing.alternateMethodAccepted,
        orderIndex: existing.orderIndex,
      });

      return tx.rubricAnalysisCriterion.update({
        where: { id: criterionId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.maxMarks !== undefined && { maximumMarks: data.maxMarks }),
          ...(data.partialCreditAllowed !== undefined && { partialCreditAllowed: data.partialCreditAllowed }),
          ...(data.alternateMethodAccepted !== undefined && { alternateMethodAccepted: data.alternateMethodAccepted }),
          ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
          isHumanModified: true,
          originalAiValue: originalValue,
          modifiedById: data.userId,
          modifiedAt: new Date(),
          modificationReason: data.reason,
        },
      });
    });
  }

  /**
   * Approves a rubric analysis
   */
  async approveAnalysis(analysisId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const analysis = await tx.rubricAnalysis.update({
        where: { id: analysisId },
        data: {
          overallStatus: RubricStatus.APPROVED,
          approvedById: userId,
          approvedAt: new Date(),
        },
        include: {
          markingScheme: true,
        },
      });

      // Mark any other previously approved rubric for this scheme as SUPERSEDED
      await tx.rubricAnalysis.updateMany({
        where: {
          markingSchemeId: analysis.markingSchemeId,
          id: { not: analysisId },
          overallStatus: RubricStatus.APPROVED,
        },
        data: {
          overallStatus: RubricStatus.SUPERSEDED,
        },
      });

      // Update parent marking scheme status to PUBLISHED if it was in DRAFT
      await tx.markingScheme.update({
        where: { id: analysis.markingSchemeId },
        data: {
          status: 'PUBLISHED',
        },
      });

      return analysis;
    });
  }

  /**
   * Rejects a rubric analysis
   */
  async rejectAnalysis(analysisId: string, reason: string) {
    return prisma.rubricAnalysis.update({
      where: { id: analysisId },
      data: {
        overallStatus: RubricStatus.REJECTED,
        rejectionReason: reason,
      },
    });
  }

  /**
   * Resolves a flagged ambiguity or incomplete rule
   */
  async resolveIssue(issueId: string, userId: string, notes?: string) {
    return prisma.rubricAnalysisIssue.update({
      where: { id: issueId },
      data: {
        isResolved: true,
        resolvedById: userId,
        resolvedAt: new Date(),
        explanation: notes ? `${notes}` : undefined,
      },
    });
  }
}

export const rubricRepository = new RubricRepository();
