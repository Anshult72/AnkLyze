/**
 * ANKLYZE Phase 15 - Mobile Answer Viewer Component
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Readable high-resolution handwritten answer sheet view.
 * - Touch-friendly page switching.
 * - Zoom & pan controls.
 * - OCR text toggle fallback.
 */

import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

interface PageData {
  pageNumber: number;
  pageImageUrl: string;
  ocrText?: string;
}

interface MobileAnswerViewerProps {
  pages: PageData[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
}

export const MobileAnswerViewer: React.FC<MobileAnswerViewerProps> = ({
  pages,
  currentPageIndex,
  onPageChange,
}) => {
  const [showOcr, setShowOcr] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const currentPage = pages[currentPageIndex] || {
    pageNumber: 1,
    pageImageUrl: "https://via.placeholder.com/800x1100.png?text=Answer+Script+Page",
    ocrText: "Sample extracted OCR text...",
  };

  return (
    <View style={styles.container}>
      {/* Top Page & Mode Controls */}
      <View style={styles.toolbar}>
        <View style={styles.pageSelector}>
          <TouchableOpacity
            style={[styles.btnSmall, currentPageIndex === 0 && styles.btnDisabled]}
            disabled={currentPageIndex === 0}
            onPress={() => onPageChange(currentPageIndex - 1)}
          >
            <Text style={styles.btnText}>◀ Prev</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>
            Page {currentPage.pageNumber} of {pages.length || 1}
          </Text>
          <TouchableOpacity
            style={[styles.btnSmall, currentPageIndex >= pages.length - 1 && styles.btnDisabled]}
            disabled={currentPageIndex >= pages.length - 1}
            onPress={() => onPageChange(currentPageIndex + 1)}
          >
            <Text style={styles.btnText}>Next ▶</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={[styles.toggleBtn, showOcr && styles.toggleBtnActive]}
            onPress={() => setShowOcr(!showOcr)}
          >
            <Text style={[styles.toggleText, showOcr && styles.toggleTextActive]}>
              {showOcr ? "Show Scan" : "OCR Text"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSmall}
            onPress={() => setZoomLevel((z) => (z >= 1.5 ? 1.0 : z + 0.25))}
          >
            <Text style={styles.btnText}>🔍 {Math.round(zoomLevel * 100)}%</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.viewport}
        contentContainerStyle={styles.viewportContent}
        maximumZoomScale={2.5}
        minimumZoomScale={0.8}
      >
        {showOcr ? (
          <View style={styles.ocrContainer}>
            <Text style={styles.ocrHeading}>Extracted Script Text (OCR)</Text>
            <Text style={styles.ocrBody}>{currentPage.ocrText || "No OCR text extracted for this page."}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: currentPage.pageImageUrl }}
            style={[
              styles.sheetImage,
              { transform: [{ scale: zoomLevel }] },
            ]}
            resizeMode="contain"
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  pageSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 4,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  toggleBtnActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  toggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  viewport: {
    flex: 1,
  },
  viewportContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  sheetImage: {
    width: 340,
    height: 480,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ocrContainer: {
    width: "100%",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  ocrHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  ocrBody: {
    fontSize: 13,
    lineHeight: 20,
    color: "#1E293B",
    fontFamily: "monospace",
  },
});
