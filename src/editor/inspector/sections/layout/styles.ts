/**
 * Layout Section Styles
 * Visual card buttons and layout-specific styling using INSPECTOR_TOKENS
 * @license BSD-3-Clause
 */

import type * as React from "react";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";

// ============================================================================
// CARD BUTTON STYLE (unique to Layout - visual option cards)
// ============================================================================

export const cardBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "8px 6px",
  background: active ? INSPECTOR_TOKENS.accentAlpha20 : INSPECTOR_TOKENS.surfaceSubtle,
  border: active
    ? `1px solid ${INSPECTOR_TOKENS.accentAlpha30}`
    : `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
  borderRadius: 6,
  color: active ? INSPECTOR_TOKENS.accent : INSPECTOR_TOKENS.textTertiary,
  fontSize: 9,
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
  background: active ? INSPECTOR_TOKENS.accentAlpha20 : INSPECTOR_TOKENS.surfaceSubtle,
  border: active
    ? `1px solid ${INSPECTOR_TOKENS.accentAlpha30}`
    : `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
  borderRadius: 6,
  color: active ? INSPECTOR_TOKENS.accent : INSPECTOR_TOKENS.textTertiary,
  fontSize: 9,
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
  background: INSPECTOR_TOKENS.surfaceInput,
  border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
  borderRadius: 4,
  color: INSPECTOR_TOKENS.textPrimary,
  fontSize: 10,
  outline: "none",
};

// ============================================================================
// POSITION OFFSET CONTAINER STYLE
// ============================================================================

export const positionOffsetContainerStyle: React.CSSProperties = {
  background: INSPECTOR_TOKENS.surfaceSubtle,
  borderRadius: 6,
  padding: 8,
  marginBottom: 10,
  border: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
};

// ============================================================================
// POSITION OFFSET BOX (center visual element)
// ============================================================================

export const positionOffsetBoxStyle: React.CSSProperties = {
  width: 32,
  height: 24,
  background: INSPECTOR_TOKENS.accentAlpha20,
  border: `1px solid ${INSPECTOR_TOKENS.accentAlpha30}`,
  borderRadius: 4,
};

// ============================================================================
// TIP BOX STYLE
// ============================================================================

export const tipBoxStyle: React.CSSProperties = {
  padding: "6px 8px",
  background: INSPECTOR_TOKENS.accentAlpha08,
  borderRadius: 4,
  marginBottom: 10,
  fontSize: 9,
  color: INSPECTOR_TOKENS.accent,
};
