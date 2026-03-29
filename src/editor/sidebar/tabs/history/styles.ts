/**
 * History Tab Styles
 * CSS-in-JS style objects for History Tab components
 * @license BSD-3-Clause
 */

import type * as React from "react";

// ============================================
// Container Styles
// ============================================

export const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--aqb-surface-2)",
};

export const controlsStyles: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid var(--aqb-border)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

export const contentStyles: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
};

// ============================================
// Undo/Redo Button Styles
// ============================================

export const undoRedoRowStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
};

export const undoRedoButtonStyles: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "8px 12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-primary)",
  fontSize: 12,
  fontWeight: 500,
};

export const clearButtonStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 10px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-secondary)",
};

// ============================================
// Confirmation Dialog Styles
// ============================================

export const confirmDialogStyles: React.CSSProperties = {
  padding: "12px",
  background: "var(--aqb-surface-3)",
  borderRadius: 8,
  border: "1px solid var(--aqb-border)",
};

export const confirmTextStyles: React.CSSProperties = {
  margin: 0,
  marginBottom: 12,
  fontSize: 12,
  color: "var(--aqb-text-primary)",
};

export const confirmButtonsStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
};

export const confirmCancelStyles: React.CSSProperties = {
  padding: "6px 12px",
  background: "transparent",
  border: "1px solid var(--aqb-border)",
  borderRadius: 4,
  color: "var(--aqb-text-secondary)",
  fontSize: 12,
  cursor: "pointer",
};

export const confirmDeleteStyles: React.CSSProperties = {
  padding: "6px 12px",
  background: "var(--aqb-error)",
  border: "none",
  borderRadius: 4,
  color: "#fff",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
};

// ============================================
// Empty State Styles
// ============================================

export const emptyStateStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 32,
  color: "var(--aqb-text-muted)",
};

export const emptyStateTitleStyles: React.CSSProperties = {
  marginTop: 12,
  fontSize: 13,
  fontWeight: 500,
  color: "var(--aqb-text-secondary)",
};

export const emptyStateDescStyles: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: "var(--aqb-text-muted)",
  textAlign: "center",
};

// ============================================
// Activity List Styles
// ============================================

export const activityListStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

// ============================================
// History Entry Styles
// ============================================

export const historyEntryContainerStyles: React.CSSProperties = {
  borderBottom: "1px solid var(--aqb-border)",
};

export const historyEntryRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "10px 12px",
  transition: "background 0.15s ease",
};

export const expandIconContainerStyles: React.CSSProperties = {
  width: 16,
  height: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--aqb-text-muted)",
  flexShrink: 0,
  marginTop: 2,
};

export const checkpointDotStyles: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "var(--aqb-text-muted)",
};

export const historyEntryInfoStyles: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

export const historyEntryLabelStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--aqb-text-primary)",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

export const checkpointBadgeStyles: React.CSSProperties = {
  fontSize: 12,
  padding: "1px 4px",
  background: "rgba(124, 125, 255, 0.15)",
  color: "var(--aqb-primary)",
  borderRadius: 4,
  textTransform: "uppercase",
  fontWeight: 600,
};

export const historyEntryMetaStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--aqb-text-muted)",
  marginTop: 2,
};

export const changeCountStyles: React.CSSProperties = {
  marginLeft: 4,
};

export const currentIndicatorStyles: React.CSSProperties = {
  fontSize: 12,
  padding: "2px 6px",
  background: "var(--aqb-success, #10b981)",
  color: "#fff",
  borderRadius: 4,
  textTransform: "uppercase",
  fontWeight: 600,
  flexShrink: 0,
};

// ============================================
// Diff Container Styles
// ============================================

export const diffContainerStyles: React.CSSProperties = {
  padding: "0 12px 10px 36px",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

export const diffRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 6,
  fontSize: 12,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  padding: "3px 6px",
  background: "rgba(255, 255, 255, 0.02)",
  borderRadius: 4,
};

export const diffOpStyles: React.CSSProperties = {
  fontWeight: 700,
  width: 12,
  textAlign: "center",
  flexShrink: 0,
};

export const diffPropertyStyles: React.CSSProperties = {
  color: "var(--aqb-text-secondary)",
  flexShrink: 0,
};

export const diffDescStyles: React.CSSProperties = {
  color: "var(--aqb-text-muted)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
