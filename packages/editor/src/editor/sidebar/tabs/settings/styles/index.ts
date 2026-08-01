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
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  color: "var(--bk-ink)",
  cursor: "pointer",
  fontSize: 18,
  transition: "background var(--bk-motion-fast), border-color var(--bk-motion-fast)",
};

/** Overlay applied to the selected option button. */
export const activeExportOptionStyles: React.CSSProperties = {
  background: "var(--bk-accent-subtle)",
  borderColor: "var(--bk-accent)",
  color: "var(--bk-accent)",
};

/** Footnote / hint shown below an option group. */
export const noteStyles: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  lineHeight: 1.5,
  color: "var(--bk-ink-muted)",
};
