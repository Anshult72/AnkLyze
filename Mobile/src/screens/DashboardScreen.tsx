/**
 * ANKLYZE Phase 15 - Mobile Examiner Dashboard
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Displays assigned scripts, pending evaluations, and risk flags.
 * - Restrained institutional typography and layout.
 * - Single-tap navigation into mobile evaluation workspace.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MobileApiClient } from "../services/api";
import { MobileUser, MobileScriptItem } from "../types";
import { OfflineBanner } from "../components/OfflineBanner";

interface DashboardScreenProps {
  user: MobileUser;
  onSelectScript: (script: MobileScriptItem) => void;
  onLogout: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  onSelectScript,
  onLogout,
}) => {
  const [scripts, setScripts] = useState<MobileScriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const loadScripts = async () => {
    try {
      setLoading(true);
      const items = await MobileApiClient.getAssignedScripts();
      setScripts(items);
      setIsOffline(false);
    } catch {
      setIsOffline(true);
      // Mock/Cached fallback data for examiner
      setScripts([
        {
          id: "script-demo-001",
          scriptCode: "SCR-2026-CS3-042",
          batchCode: "BATCH-2026-CS301-001",
          subjectCode: "CS-301",
          subjectName: "Engineering Mathematics III",
          status: "READY_FOR_EVALUATION",
          totalPages: 4,
          evaluatedQuestions: 3,
          totalQuestions: 4,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadScripts();
  }, []);

  const renderScriptCard = ({ item }: { item: MobileScriptItem }) => {
    const isCompleted = item.evaluatedQuestions === item.totalQuestions;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onSelectScript(item)}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.scriptCode}>{item.scriptCode}</Text>
            <Text style={styles.subjectText}>
              {item.subjectCode} — {item.subjectName}
            </Text>
          </View>
          <View style={[styles.badge, isCompleted ? styles.badgeSuccess : styles.badgePending]}>
            <Text style={[styles.badgeText, isCompleted ? styles.badgeTextSuccess : styles.badgeTextPending]}>
              {isCompleted ? "Completed" : "In Progress"}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.metaText}>
            📄 {item.totalPages} Pages • Q: {item.evaluatedQuestions}/{item.totalQuestions} evaluated
          </Text>
          <Text style={styles.openLink}>Evaluate ▶</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <OfflineBanner isOffline={isOffline} />

      {/* App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>ANKLYZE</Text>
          <Text style={styles.userName}>{user.fullName}</Text>
          <Text style={styles.userRole}>Examiner • {user.department || "Academic Department"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.body}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Assigned Answer Scripts</Text>
          <Text style={styles.countBadge}>{scripts.length}</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0F172A" />
            <Text style={styles.loadingText}>Loading assigned evaluation queue...</Text>
          </View>
        ) : (
          <FlatList
            data={scripts}
            keyExtractor={(item) => item.id}
            renderItem={renderScriptCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadScripts(); }} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No pending scripts assigned to your queue.</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFAF5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  appTitle: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#0F172A",
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 2,
  },
  userRole: {
    fontSize: 11,
    color: "#64748B",
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 4,
  },
  logoutText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  body: {
    flex: 1,
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    textTransform: "uppercase",
  },
  countBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  scriptCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  subjectText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgePending: {
    backgroundColor: "#FEF3C7",
  },
  badgeSuccess: {
    backgroundColor: "#D1FAE5",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  badgeTextPending: {
    color: "#B45309",
  },
  badgeTextSuccess: {
    color: "#047857",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
  },
  openLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
});
