/**
 * ANKLYZE Phase 15 - Mobile Application Root
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Direct examiner MVP navigation between Login, Dashboard, and Evaluation Workspace.
 * - Secure credential state management.
 * - Restrained institutional theme (#FCFAF5, #0F172A, #B45309).
 */

import React, { useState, useEffect } from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import { LoginScreen } from "./src/screens/LoginScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { EvaluationWorkspaceScreen } from "./src/screens/EvaluationWorkspaceScreen";
import { SecureStorageService } from "./src/services/storage";
import { MobileUser, MobileScriptItem } from "./src/types";

export default function App() {
  const [currentUser, setCurrentUser] = useState<MobileUser | null>(null);
  const [selectedScript, setSelectedScript] = useState<MobileScriptItem | null>(null);

  useEffect(() => {
    checkSavedSession();
  }, []);

  const checkSavedSession = async () => {
    const savedUserJson = await SecureStorageService.getItem("user_profile");
    if (savedUserJson) {
      try {
        const user = JSON.parse(savedUserJson);
        setCurrentUser(user);
      } catch {
        // Stale session
      }
    }
  };

  const handleLogout = async () => {
    await SecureStorageService.removeItem("access_token");
    await SecureStorageService.removeItem("user_profile");
    setCurrentUser(null);
    setSelectedScript(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFAF5" />

      {!currentUser ? (
        <LoginScreen onLoginSuccess={setCurrentUser} />
      ) : selectedScript ? (
        <EvaluationWorkspaceScreen
          script={selectedScript}
          onBack={() => setSelectedScript(null)}
        />
      ) : (
        <DashboardScreen
          user={currentUser}
          onSelectScript={setSelectedScript}
          onLogout={handleLogout}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFAF5",
  },
});
