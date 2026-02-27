/**
 * Design system styles
 * @license BSD-3-Clause
 */

import * as React from "react";

export const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--aqb-surface-2)",
};

export const tokenListStyles: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: 12,
};

export const tokenGridStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

export const sectionHeaderStyles: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "var(--aqb-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 8,
};

// Color styles
export const colorGridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
};

export const colorCardStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: 8,
  background: "rgba(255,255,255,0.04)",
  borderRadius: 8,
  border: "1px solid var(--aqb-border)",
};

export const swatchLargeStyles: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.1)",
};

export const colorCardInfoStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

export const tokenNameSmallStyles: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  color: "var(--aqb-text-primary)",
};

export const hexInputSmallStyles: React.CSSProperties = {
  width: "100%",
  padding: "2px 0",
  background: "transparent",
  border: "none",
  color: "var(--aqb-text-muted)",
  fontSize: 10,
  fontFamily: "monospace",
};

export const colorPickerSmallStyles: React.CSSProperties = {
  width: "100%",
  height: 24,
  padding: 0,
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

// Token row styles
export const tokenRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  background: "rgba(255,255,255,0.04)",
  borderRadius: 8,
  border: "1px solid var(--aqb-border)",
};

export const tokenInfoStyles: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

export const tokenNameStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--aqb-text-primary)",
  marginBottom: 2,
};

export const valueInputStyles: React.CSSProperties = {
  width: 100,
  padding: "6px 8px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 4,
  color: "var(--aqb-text-primary)",
  fontSize: 11,
  textAlign: "center",
};

export const copyBtnStyles: React.CSSProperties = {
  padding: 6,
  background: "transparent",
  border: "none",
  color: "var(--aqb-text-muted)",
  cursor: "pointer",
  borderRadius: 4,
};

export const addTokenBtnStyles: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  background: "transparent",
  border: "1px dashed var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-muted)",
  fontSize: 11,
  cursor: "pointer",
  marginTop: 8,
};

// Spacing styles
export const spacingGridStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

export const spacingItemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 12px",
  background: "rgba(255,255,255,0.04)",
  borderRadius: 6,
};

export const spacingBarStyles: React.CSSProperties = {
  width: 60,
  display: "flex",
  alignItems: "center",
};

export const spacingLabelStyles: React.CSSProperties = {
  flex: 1,
  display: "flex",
  justifyContent: "space-between",
  fontSize: 12,
  color: "var(--aqb-text-primary)",
};

export const spacingValueStyles: React.CSSProperties = {
  color: "var(--aqb-text-muted)",
  fontFamily: "monospace",
  fontSize: 11,
};

// Scale styles
export const scaleRowStyles: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

export const scaleItemStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "8px 12px",
  background: "rgba(255,255,255,0.04)",
  borderRadius: 6,
  minWidth: 50,
};

export const scaleLabelStyles: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "var(--aqb-text-muted)",
};

export const scaleValueStyles: React.CSSProperties = {
  fontSize: 11,
  color: "var(--aqb-text-primary)",
  fontFamily: "monospace",
};

// Radius styles
export const radiusGridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
};

export const radiusItemStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  padding: "12px 8px",
  background: "rgba(255,255,255,0.04)",
  borderRadius: 8,
  border: "1px solid var(--aqb-border)",
};

export const radiusPreviewStyles: React.CSSProperties = {
  width: 32,
  height: 32,
  background: "var(--aqb-primary)",
};

export const radiusLabelStyles: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  color: "var(--aqb-text-primary)",
};

export const radiusValueStyles: React.CSSProperties = {
  fontSize: 9,
  color: "var(--aqb-text-muted)",
  fontFamily: "monospace",
};

// Shadow styles
export const shadowRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px",
  background: "rgba(255,255,255,0.04)",
  borderRadius: 8,
  border: "1px solid var(--aqb-border)",
};

export const shadowPreviewStyles: React.CSSProperties = {
  width: 40,
  height: 40,
  background: "var(--aqb-surface-3)",
  borderRadius: 6,
};

export const shadowValueStyles: React.CSSProperties = {
  fontSize: 10,
  color: "var(--aqb-text-muted)",
  fontFamily: "monospace",
  marginTop: 2,
};

// Theme styles
export const themeModeRowStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
};

export const themeModeButtonStyles: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 8,
  color: "var(--aqb-text-secondary)",
  fontSize: 12,
  cursor: "pointer",
};

export const activeThemeModeStyles: React.CSSProperties = {
  background: "var(--aqb-primary)",
  borderColor: "var(--aqb-primary)",
  color: "#fff",
};

export const themePreviewRowStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 8,
};

export const previewButtonStyles: React.CSSProperties = {
  flex: 1,
  padding: "8px",
  background: "transparent",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-muted)",
  fontSize: 11,
  cursor: "pointer",
};

// AI section styles
export const aiSectionStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: 12,
  background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.1) 100%)",
  borderRadius: 8,
  borderLeft: "3px solid #8B5CF6",
};

export const uploadImageBtnStyles: React.CSSProperties = {
  padding: "12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px dashed var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-secondary)",
  fontSize: 12,
  cursor: "pointer",
};

export const orDividerStyles: React.CSSProperties = {
  fontSize: 10,
  color: "var(--aqb-text-muted)",
  textAlign: "center",
};

export const aiInputStyles: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-primary)",
  fontSize: 12,
  boxSizing: "border-box",
};

export const generateBtnStyles: React.CSSProperties = {
  padding: "10px 16px",
  background: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

// Export styles
export const exportRowStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
};

export const exportBtnStyles: React.CSSProperties = {
  flex: 1,
  padding: "10px 8px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-primary)",
  fontSize: 11,
  cursor: "pointer",
};

export const fontHintStyles: React.CSSProperties = {
  fontSize: 10,
  color: "var(--aqb-text-muted)",
  textAlign: "center",
  marginTop: 4,
};
