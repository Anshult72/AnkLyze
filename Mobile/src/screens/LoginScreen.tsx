/**
 * ANKLYZE Phase 15 - Mobile Examiner Login Screen
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Direct authentication against backend REST API.
 * - Secure credential storage.
 * - Restrained institutional aesthetic (Slate, Amber, Off-white).
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MobileApiClient } from "../services/api";
import { MobileUser } from "../types";

interface LoginScreenProps {
  onLoginSuccess: (user: MobileUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("examiner1@test.com");
  const [password, setPassword] = useState("Test@1234");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const result = await MobileApiClient.login(email.trim(), password);
      onLoginSuccess(result.user);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        {/* Header Branding */}
        <View style={styles.header}>
          <Text style={styles.logo}>ANKLYZE</Text>
          <Text style={styles.tagline}>"Analyse the marks, not just the paper."</Text>
          <Text style={styles.subtext}>Examiner Mobile Evaluation Portal</Text>
        </View>

        {/* Error Alert */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={styles.form}>
          <Text style={styles.label}>Institutional Email</Text>
          <TextInput
            style={styles.input}
            placeholder="examiner@institution.ac.in"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            disabled={loading}
            onPress={handleLogin}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In as Examiner</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Institutional Principle */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Core Principle: <Text style={styles.bold}>AI suggests, examiner decides.</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFAF5",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#0F172A",
  },
  tagline: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#B45309",
    marginTop: 4,
    textAlign: "center",
  },
  subtext: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 6,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: "#BE123C",
    fontWeight: "500",
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },
  loginBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "#64748B",
  },
  bold: {
    fontWeight: "700",
    color: "#0F172A",
  },
});
