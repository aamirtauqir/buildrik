/**
 * Settings — shared screen styles.
 *
 * Inline-style objects shared across Settings screens. Kept as TypeScript
 * objects (not CSS modules) to match the existing per-screen style pattern
 * and to use CSS custom properties from the editor theme.
 *
 * @license BSD-3-Clause
 */

import type * as React from "react";

/** Top-level wrapper for a Settings screen. */
export const screenStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: 16,
};

/** Container for a row of mutually-exclusive option buttons (e.g. export formats). */
export const exportOptionsStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
  gap: 8,
};

/** Base style for one option button. Used with `...exportOptionStyles` spread. */
export const exportOptionStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  padding: "12px 8px",
  background: "var(--aqb-surface-2, #f8fafc)",
  border: "1px solid var(--aqb-border, #e2e8f0)",
  borderRadius: "var(--aqb-radius-md, 8px)",
  color: "var(--aqb-text-primary, #0f172a)",
  cursor: "pointer",
  fontSize: 18,
  transition: "background 120ms, border-color 120ms",
};

/** Overlay applied to the selected option button. */
export const activeExportOptionStyles: React.CSSProperties = {
  background: "rgba(45,109,255,0.08)",
  borderColor: "var(--aqb-primary, #6366f1)",
  color: "var(--aqb-primary, #6366f1)",
};

/** Footnote / hint shown below an option group. */
export const noteStyles: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  lineHeight: 1.5,
  color: "var(--aqb-text-muted, #64748b)",
};
