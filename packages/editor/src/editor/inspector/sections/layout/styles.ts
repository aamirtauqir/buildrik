/**
 * Layout section inline styles — ported to --bd-* tokens.
 * Card buttons align visually with .bdi-qa quick actions from comp-inspector.v1.
 *
 * @license BSD-3-Clause
 */

import type * as React from "react";

// ============================================================================
// CARD BUTTON — Display mode options (Block / Flex / Grid / I-Block / Inline / None)
// ============================================================================

export const cardBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "7px 4px",
  background: active ? "var(--bk-accent-tint)" : "var(--bk-bg-subtle)",
  border: active ? "1px solid var(--bk-alpha-accent-30)" : "1px solid transparent",
  borderRadius: 5,
  color: active ? "var(--bk-accent)" : "var(--bk-ink-soft)",
  font: "500 9.5px var(--bk-font-ui)",
  cursor: "pointer",
  transition:
    "background var(--bk-motion-fast), color var(--bk-motion-fast), border-color var(--bk-motion-fast)",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: 3,
  minHeight: 42,
});

// ============================================================================
// CONSTRAINT BUTTON — Fixed / Fill / Hug dimension modes
// ============================================================================

export const constraintBtnStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "6px 4px",
  background: active ? "var(--bk-accent-tint)" : "var(--bk-bg-subtle)",
  border: active ? "1px solid var(--bk-alpha-accent-30)" : "1px solid transparent",
  borderRadius: 4,
  color: active ? "var(--bk-accent)" : "var(--bk-ink-soft)",
  font: "500 10px var(--bk-font-ui)",
  cursor: "pointer",
  transition: "background var(--bk-motion-fast), color var(--bk-motion-fast)",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: 3,
});

// ============================================================================
// FIXED VALUE INPUT — numeric input embedded in layout rows
// ============================================================================

export const fixedInputStyle: React.CSSProperties = {
  flex: 1,
  height: 24,
  padding: "0 8px",
  background: "var(--bk-bg-subtle)",
  border: "1px solid transparent",
  borderRadius: 4,
  color: "var(--bk-ink)",
  font: "500 11.5px var(--bk-font-ui)",
  outline: "none",
};

// ============================================================================
// POSITION OFFSET CONTAINER
// ============================================================================

export const positionOffsetContainerStyle: React.CSSProperties = {
  background: "var(--bk-bg-subtle)",
  borderRadius: 6,
  padding: 8,
  marginBottom: 6,
  border: "1px solid var(--bk-border)",
};

// ============================================================================
// POSITION OFFSET BOX — center visual anchor
// ============================================================================

export const positionOffsetBoxStyle: React.CSSProperties = {
  width: 30,
  height: 22,
  background: "var(--bk-accent-tint)",
  border: "1px solid var(--bk-alpha-accent-30)",
  borderRadius: 3,
};

// ============================================================================
// TIP BOX — hint below display mode buttons
// ============================================================================

export const tipBoxStyle: React.CSSProperties = {
  padding: "5px 8px",
  background: "var(--bk-accent-tint)",
  borderRadius: 4,
  marginTop: 2,
  font: "500 10.5px var(--bk-font-ui)",
  color: "var(--bk-accent)",
};
