/**
 * Layout Section Styles
 * Visual card buttons and layout-specific styling with canonical --buildrick-* tokens
 * @license BSD-3-Clause
 */

import type * as React from "react";

// ============================================================================
// CARD BUTTON STYLE (unique to Layout - visual option cards)
// ============================================================================

export const cardBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "8px 6px",
  background: active ? "rgba(45, 109, 255, 0.20)" : "var(--buildrick-bg-subtle)",
  border: active
    ? `1px solid ${"rgba(45, 109, 255, 0.30)"}`
    : `1px solid ${"var(--buildrick-border)"}`,
  borderRadius: 6,
  color: active ? "var(--buildrick-accent)" : "var(--buildrick-text-tertiary)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: 4,
  minHeight: 50,
});

// ============================================================================
// CONSTRAINT BUTTON STYLE
// ============================================================================

export const constraintBtnStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "8px 4px",
  background: active ? "rgba(45, 109, 255, 0.20)" : "var(--buildrick-bg-subtle)",
  border: active
    ? `1px solid ${"rgba(45, 109, 255, 0.30)"}`
    : `1px solid ${"var(--buildrick-border)"}`,
  borderRadius: 6,
  color: active ? "var(--buildrick-accent)" : "var(--buildrick-text-tertiary)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: 3,
});

// ============================================================================
// FIXED VALUE INPUT STYLE
// ============================================================================

export const fixedInputStyle: React.CSSProperties = {
  flex: 1,
  padding: "5px 6px",
  background: "var(--buildrick-bg-input)",
  border: `1px solid ${"var(--buildrick-border-medium)"}`,
  borderRadius: 4,
  color: "var(--buildrick-text-primary)",
  fontSize: 12,
  outline: "none",
};

// ============================================================================
// POSITION OFFSET CONTAINER STYLE
// ============================================================================

export const positionOffsetContainerStyle: React.CSSProperties = {
  background: "var(--buildrick-bg-subtle)",
  borderRadius: 6,
  padding: 8,
  marginBottom: 10,
  border: `1px solid ${"var(--buildrick-border)"}`,
};

// ============================================================================
// POSITION OFFSET BOX (center visual element)
// ============================================================================

export const positionOffsetBoxStyle: React.CSSProperties = {
  width: 32,
  height: 24,
  background: "rgba(45, 109, 255, 0.20)",
  border: `1px solid ${"rgba(45, 109, 255, 0.30)"}`,
  borderRadius: 4,
};

// ============================================================================
// TIP BOX STYLE
// ============================================================================

export const tipBoxStyle: React.CSSProperties = {
  padding: "6px 8px",
  background: "rgba(45, 109, 255, 0.08)",
  borderRadius: 4,
  marginBottom: 10,
  fontSize: 12,
  color: "var(--buildrick-accent)",
};
