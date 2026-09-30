/**
 * ANKLYZE Phase 15 - Mobile Scoring & Evaluation Controls
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Touch-friendly scoring buttons/steppers.
 * - Prominent AI advisory score indicator.
 * - Human override justification reason input.
 * - Clear Save Draft vs Finalize actions.
 */

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { MobileCriterion } from "../types";

interface ScoringControlsProps {
  criteria: MobileCriterion[];
  aiSuggestedMarks?: number;
  aiConfidence?: number;
  onSaveDraft: (marks: number, reason?: string, notes?: string) => void;
  onFinalize: (notes?: string) => void;
  isSaving: boolean;
}

export const ScoringControls: React.FC<ScoringControlsProps> = ({
  criteria,
  aiSuggestedMarks = 0,
  aiConfidence = 0.95,
  onSaveDraft,
  onFinalize,
  isSaving,
}) => {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    criteria.forEach((c) => {
      initial[c.id] = c.awardedMarks ?? c.suggestedMarks ?? 0;
    });
    return initial;
  });

  const [overrideReason, setOverrideReason] = useState("");
  const [notes, setNotes] = useState("");

  const totalCalculatedMarks = Object.values(scores).reduce((acc, v) => acc + (v || 0), 0);
  const maxMarksTotal = criteria.reduce((acc, c) => acc + c.maximumMarks, 0);
  const isOverridden = totalCalculatedMarks !== aiSuggestedMarks;

  const handleScoreChange = (criterionId: string, delta: number, max: number) => {
    setScores((prev) => {
      const current = prev[criterionId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [criterionId]: next };
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* AI Advisory Box */}
      <View style={styles.aiAdvisoryCard}>
        <View style={styles.aiAdvisoryHeader}>
          <Text style={styles.aiLabel}>🤖 AI Advisory Suggestion</Text>
          <Text style={styles.confidenceBadge}>
            {Math.round(aiConfidence * 100)}% Confidence
          </Text>
        </View>
        <Text style={styles.aiMarks}>
          Suggested: <Text style={styles.bold}>{aiSuggestedMarks}</Text> / {maxMarksTotal} Marks
        </Text>
        <Text style={styles.aiPrinciple}>"AI suggests, examiner decides."</Text>
      </View>

      {/* Criterion Scoring List */}
      <Text style={styles.sectionHeader}>Rubric Criteria Scoring</Text>
      {criteria.map((c) => {
        const currentScore = scores[c.id] ?? c.suggestedMarks ?? 0;
        return (
          <View key={c.id} style={styles.criterionRow}>
            <View style={styles.criterionInfo}>
              <Text style={styles.criterionName}>{c.name}</Text>
              <Text style={styles.criterionMax}>Max: {c.maximumMarks} Marks</Text>
            </View>

            <View style={styles.stepperGroup}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleScoreChange(c.id, -0.5, c.maximumMarks)}
              >
                <Text style={styles.stepBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.scoreValue}>{currentScore}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleScoreChange(c.id, 0.5, c.maximumMarks)}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Human Override Justification (required if delta exists) */}
      {isOverridden && (
        <View style={styles.overrideBox}>
          <Text style={styles.overrideLabel}>⚠️ Examiner Override Justification</Text>
          <TextInput
            style={styles.input}
            placeholder="State reason for overriding AI suggestion (e.g. step skipped)..."
            placeholderTextColor="#94A3B8"
            value={overrideReason}
            onChangeText={setOverrideReason}
            multiline
          />
        </View>
      )}

      {/* Examiner Notes */}
      <View style={styles.notesBox}>
        <Text style={styles.notesLabel}>Examiner Notes (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Add general evaluation observation..."
          placeholderTextColor="#94A3B8"
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {/* Total & Action Buttons */}
      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total Awarded:</Text>
        <Text style={styles.totalValue}>
          {totalCalculatedMarks} / {maxMarksTotal}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.draftBtn]}
          disabled={isSaving}
          onPress={() => onSaveDraft(totalCalculatedMarks, overrideReason, notes)}
        >
          <Text style={styles.draftBtnText}>{isSaving ? "Saving..." : "Save Draft"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.finalizeBtn]}
          disabled={isSaving || (isOverridden && !overrideReason.trim())}
          onPress={() => onFinalize(notes)}
        >
          <Text style={styles.finalizeBtnText}>Finalize Decision</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  aiAdvisoryCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  aiAdvisoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  confidenceBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#047857",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiMarks: {
    fontSize: 13,
    color: "#334155",
    marginTop: 2,
  },
  bold: {
    fontWeight: "700",
    color: "#0F172A",
  },
  aiPrinciple: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#64748B",
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  criterionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  criterionInfo: {
    flex: 1,
    paddingRight: 8,
  },
  criterionName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  criterionMax: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  stepperGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    minWidth: 28,
    textAlign: "center",
  },
  overrideBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FFFBEB",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  overrideLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
    marginBottom: 6,
  },
  notesBox: {
    marginTop: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0F172A",
  },
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  draftBtn: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  draftBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  finalizeBtn: {
    backgroundColor: "#0F172A",
  },
  finalizeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
