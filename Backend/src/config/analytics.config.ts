import { DriftSignalType, DriftSeverity } from "@prisma/client";

export interface AnalyticsConfig {
  minSampleSize: number;
  driftThresholds: {
    markDistributionShift: {
      medium: number; // e.g. 0.75 marks delta
      high: number;   // e.g. 1.5 marks delta
    };
    overrideRateShift: {
      medium: number; // e.g. 0.20 (20%)
      high: number;   // e.g. 0.40 (40%)
    };
    disagreementRateShift: {
      medium: number; // e.g. 0.15 (15%)
      high: number;   // e.g. 0.30 (30%)
    };
  };
}

export const ANALYTICS_CONFIG: AnalyticsConfig = {
  minSampleSize: 20, // Strict statistical guard: requires at least 20 observations
  driftThresholds: {
    markDistributionShift: {
      medium: 0.75,
      high: 1.5,
    },
    overrideRateShift: {
      medium: 0.20,
      high: 0.40,
    },
    disagreementRateShift: {
      medium: 0.15,
      high: 0.30,
    },
  },
};

export function determineDriftSeverity(
  signalType: DriftSignalType,
  delta: number
): DriftSeverity {
  const absDelta = Math.abs(delta);
  switch (signalType) {
    case "MARK_DISTRIBUTION_SHIFT":
      if (absDelta >= ANALYTICS_CONFIG.driftThresholds.markDistributionShift.high) return "HIGH";
      if (absDelta >= ANALYTICS_CONFIG.driftThresholds.markDistributionShift.medium) return "MEDIUM";
      return "LOW";
    case "OVERRIDE_RATE_SHIFT":
      if (absDelta >= ANALYTICS_CONFIG.driftThresholds.overrideRateShift.high) return "HIGH";
      if (absDelta >= ANALYTICS_CONFIG.driftThresholds.overrideRateShift.medium) return "MEDIUM";
      return "LOW";
    case "DISAGREEMENT_RATE_SHIFT":
      if (absDelta >= ANALYTICS_CONFIG.driftThresholds.disagreementRateShift.high) return "HIGH";
      if (absDelta >= ANALYTICS_CONFIG.driftThresholds.disagreementRateShift.medium) return "MEDIUM";
      return "LOW";
    default:
      return "LOW";
  }
}
