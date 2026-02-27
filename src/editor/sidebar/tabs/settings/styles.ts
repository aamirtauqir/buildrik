/**
 * Settings tab styles
 * @license BSD-3-Clause
 */

import * as React from "react";

// Container styles
export const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--aqb-surface-2)",
};

export const homeStyles: React.CSSProperties = { flex: 1, overflow: "auto" };
export const contentStyles: React.CSSProperties = { flex: 1, overflow: "auto" };
export const screenStyles: React.CSSProperties = {
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

// Section styles
export const sectionStyles: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  borderRadius: 8,
  padding: 12,
};
export const sectionTitleStyles: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--aqb-text-muted)",
  textTransform: "uppercase",
};

// Field styles
export const fieldStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 12,
};
export const labelStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--aqb-text-primary)",
};
export const hintStyles: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 400,
  color: "var(--aqb-text-muted)",
};
export const inputStyles: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "var(--aqb-surface-2)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-primary)",
  fontSize: 12,
  outline: "none",
  boxSizing: "border-box",
};

// Toggle styles
export const toggleRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 0",
  cursor: "pointer",
  fontSize: 12,
};
export const toggleStyles: React.CSSProperties = {
  position: "relative",
  width: 32,
  height: 18,
  border: "1px solid var(--aqb-border)",
  borderRadius: 9,
  cursor: "pointer",
  transition: "background 0.15s",
};
export const toggleKnobStyles: React.CSSProperties = {
  position: "absolute",
  top: 2,
  left: 2,
  width: 12,
  height: 12,
  background: "#fff",
  borderRadius: "50%",
  transition: "transform 0.15s",
};

// Status styles
export const statusRowStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  fontSize: 12,
};
export const successBadgeStyles: React.CSSProperties = {
  padding: "2px 8px",
  background: "var(--aqb-success)",
  color: "#fff",
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 600,
};
export const mutedStyles: React.CSSProperties = { color: "var(--aqb-text-muted)" };

// URL/Copy styles
export const urlRowStyles: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center" };
export const copyBtnStyles: React.CSSProperties = {
  padding: "8px 12px",
  background: "var(--aqb-surface-4)",
  border: "none",
  borderRadius: 6,
  color: "var(--aqb-text-primary)",
  fontSize: 11,
  cursor: "pointer",
  transition: "color 0.15s",
};

// Note/Warning styles
export const noteStyles: React.CSSProperties = {
  padding: 12,
  background: "rgba(124,125,255,0.1)",
  borderRadius: 8,
  fontSize: 11,
  color: "var(--aqb-text-secondary)",
  marginTop: 8,
};
export const warningStyles: React.CSSProperties = {
  padding: 12,
  background: "rgba(245,158,11,0.15)",
  borderRadius: 8,
  fontSize: 11,
  color: "var(--aqb-warning)",
};
export const errorHintStyles: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  color: "var(--aqb-error, #ef4444)",
  marginTop: 4,
};
export const successNoteStyles: React.CSSProperties = {
  padding: 8,
  background: "rgba(34,197,94,0.1)",
  borderRadius: 6,
  fontSize: 11,
  color: "var(--aqb-success, #22c55e)",
  marginTop: 8,
};

// DNS Help styles
export const dnsHelpStyles: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  background: "var(--aqb-surface-3)",
  borderRadius: 6,
  fontSize: 11,
};
export const codeStyles: React.CSSProperties = {
  display: "block",
  marginTop: 8,
  padding: "6px 10px",
  background: "var(--aqb-surface-2)",
  borderRadius: 4,
  fontFamily: "monospace",
  fontSize: 11,
};

// Export screen styles
export const exportOptionsStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 8,
};
export const exportOptionStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "16px 8px",
  background: "rgba(255,255,255,0.04)",
  border: "2px solid var(--aqb-border)",
  borderRadius: 8,
  fontSize: 20,
  cursor: "pointer",
  transition: "all 0.15s",
};
export const activeExportOptionStyles: React.CSSProperties = {
  borderColor: "var(--aqb-primary)",
  background: "rgba(59,130,246,0.1)",
};
export const exportActionsStyles: React.CSSProperties = { marginTop: 8 };
export const deployOptionsStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

// Integration styles
export const integrationCardStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px",
  background: "var(--aqb-surface-3)",
  borderRadius: 6,
  marginBottom: 8,
};
export const integrationNameStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--aqb-text-primary)",
};
export const integrationDescStyles: React.CSSProperties = {
  fontSize: 10,
  color: "var(--aqb-text-muted)",
};

// Version history styles
export const versionActionsStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 8,
};
export const versionRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "12px",
  background: "var(--aqb-surface-3)",
  borderRadius: 6,
  marginBottom: 8,
};
export const versionDateStyles: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--aqb-text-primary)",
};
export const versionDescStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--aqb-text-secondary)",
  marginTop: 2,
};
export const versionAuthorStyles: React.CSSProperties = {
  fontSize: 10,
  color: "var(--aqb-text-muted)",
  marginTop: 2,
};
export const iconBtnStyles: React.CSSProperties = {
  padding: "4px 8px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
};

// Locked screen styles
export const lockedStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 32,
  textAlign: "center",
  height: "100%",
};
export const lockedIconStyles: React.CSSProperties = { fontSize: 48, marginBottom: 16 };
export const lockedTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
};
export const lockedDescStyles: React.CSSProperties = {
  margin: "8px 0 24px",
  fontSize: 13,
  color: "var(--aqb-text-muted)",
};
export const upgradeBtnStyles: React.CSSProperties = {
  padding: "12px 24px",
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
