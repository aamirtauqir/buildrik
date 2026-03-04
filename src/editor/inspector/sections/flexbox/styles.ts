/**
 * Flexbox Section Styles
 * Visual button styles unique to Flexbox controls
 * @license BSD-3-Clause
 */

import type * as React from "react";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";

// Visual button style (unique to Flexbox - direction/alignment cards)
export const visualBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "10px 6px",
  background: active ? INSPECTOR_TOKENS.accentAlpha20 : INSPECTOR_TOKENS.surfaceSubtle,
  border: active
    ? `1px solid ${INSPECTOR_TOKENS.accentAlpha30}`
    : `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
  borderRadius: 6,
  color: active ? INSPECTOR_TOKENS.accent : INSPECTOR_TOKENS.textMuted,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: 4,
});
