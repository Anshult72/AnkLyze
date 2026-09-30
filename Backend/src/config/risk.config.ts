/**
 * ANKLYZE Phase 12 - Risk Engine & Adaptive Double Evaluation Configuration
 * "Analyse the marks, not just the paper."
 * 
 * Central, explainable, and configurable operational parameters.
 * Note: Risk attaches strictly to the evaluation / question attempt, NOT the examiner.
 */

import { RiskBand, RiskFactorType } from '@prisma/client';

export interface RiskBandConfig {
  band: RiskBand;
  minScore: number;
  maxScore: number;
  description: string;
}

export interface FactorWeightConfig {
  maxContribution: number;
  lowSeverityThreshold: number;
  mediumSeverityThreshold: number;
  highSeverityThreshold: number;
}

export const RISK_CONFIG = {
  formulaVersion: 'risk-v1',

  // Configurable Risk Bands
  bands: [
    { band: RiskBand.LOW, minScore: 0, maxScore: 24, description: 'Single evaluation sufficient' },
    { band: RiskBand.MEDIUM, minScore: 25, maxScore: 49, description: 'Standard examiner review' },
    { band: RiskBand.HIGH, minScore: 50, maxScore: 74, description: 'Second independent evaluation required' },
    { band: RiskBand.CRITICAL, minScore: 75, maxScore: 100, description: 'Second evaluation and senior escalation required' },
  ] as RiskBandConfig[],

  // Disagreement Thresholds (as fraction of maxMarks)
  disagreement: {
    meaningfulThreshold: 0.20, // 20% mark delta
    strongThreshold: 0.40,     // 40% mark delta
    doubleEvaluationDisagreementThreshold: 0.20, // 20% mark delta between Round 1 and Round 2
  },

  // Second Evaluation Routing Triggers
  routing: {
    secondEvaluationMinScore: 50, // High or Critical triggers second evaluation
    seniorReviewMinScore: 75,     // Critical triggers senior escalation
    secondEvaluationDisagreementDelta: 0.25, // >= 25% AI-human delta triggers second evaluation
  },

  // Observable Factor Maximum Contributions (Total max raw score ~ 160, normalized to 0-100)
  factorWeights: {
    [RiskFactorType.AI_UNCERTAINTY]: {
      maxContribution: 25,
      // Confidence score thresholds (1.0 = perfect, 0.0 = total uncertainty)
      lowSeverityThreshold: 0.80,   // confidence < 0.80 -> Low severity (+8)
      mediumSeverityThreshold: 0.65,// confidence < 0.65 -> Medium severity (+16)
      highSeverityThreshold: 0.45,  // confidence < 0.45 -> High severity (+25)
    },
    [RiskFactorType.SCAN_PAGE_QUALITY]: {
      maxContribution: 15,
      lowSeverityThreshold: 0.80,
      mediumSeverityThreshold: 0.60,
      highSeverityThreshold: 0.40,
    },
    [RiskFactorType.RUBRIC_AMBIGUITY]: {
      maxContribution: 20,
      // Number of unresolved rubric issues or severity
      lowSeverityThreshold: 1,  // 1 issue -> +7
      mediumSeverityThreshold: 2,// 2 issues -> +14
      highSeverityThreshold: 3,  // 3+ issues -> +20
    },
    [RiskFactorType.AI_HUMAN_DISAGREEMENT]: {
      maxContribution: 30,
      // Normalized delta = abs(human - ai) / maxMarks
      lowSeverityThreshold: 0.15,  // 15% -> +10
      mediumSeverityThreshold: 0.25,// 25% -> +20
      highSeverityThreshold: 0.40, // 40% -> +30
    },
    [RiskFactorType.CRITERION_DISAGREEMENT]: {
      maxContribution: 15,
      // Fraction of criteria changed by examiner
      lowSeverityThreshold: 0.25,  // 25% of criteria changed -> +5
      mediumSeverityThreshold: 0.50,// 50% -> +10
      highSeverityThreshold: 0.75, // 75%+ -> +15
    },
    [RiskFactorType.RECONSTRUCTION_UNCERTAINTY]: {
      maxContribution: 25,
      // Base states
      requiresReviewScore: 20,
      unreadableScore: 25,
      duplicateAttemptScore: 15,
      lowConfidenceThreshold: 0.70,
    },
    [RiskFactorType.EVIDENCE_WEAKNESS]: {
      maxContribution: 15,
      // Missing evidence links or low evidence confidence
      perMissingCriterionScore: 5,
    },
    [RiskFactorType.SPECIAL_ANSWER_STATE]: {
      maxContribution: 15,
      continuationScore: 10,
      multipleAttemptsScore: 15,
    },
  },
};

/**
 * Resolves the RiskBand for a given 0-100 bounded risk score.
 */
export function resolveRiskBand(score: number): RiskBand {
  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  for (const b of RISK_CONFIG.bands) {
    if (boundedScore >= b.minScore && boundedScore <= b.maxScore) {
      return b.band;
    }
  }
  return RiskBand.LOW;
}
