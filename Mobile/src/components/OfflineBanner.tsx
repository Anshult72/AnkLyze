/**
 * ANKLYZE Phase 15 - Mobile Offline Banner
 * "Analyse the marks, not just the paper."
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface OfflineBannerProps {
  isOffline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        ⚠️ Offline Mode — Displaying cached evaluation data. Reconnect to finalize.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  text: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
    textAlign: "center",
  },
});
