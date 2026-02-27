/**
 * Element Properties Section Styles
 * Using INSPECTOR_TOKENS for consistent theming
 * @license BSD-3-Clause
 */

import type * as React from "react";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";

// ============================================================================
// STYLES
// ============================================================================

export const styles = {
  dataAttributesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: 11,
    color: INSPECTOR_TOKENS.textTertiary,
    fontWeight: 500,
    marginBottom: 12,
  } as React.CSSProperties,

  iconPickerButton: {
    width: "100%",
    padding: "12px 16px",
    background: INSPECTOR_TOKENS.accentAlpha20,
    border: `1px solid ${INSPECTOR_TOKENS.accentAlpha30}`,
    borderRadius: 8,
    color: INSPECTOR_TOKENS.accent,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  } as React.CSSProperties,

  iconHint: {
    fontSize: 10,
    color: INSPECTOR_TOKENS.textMuted,
    marginTop: 6,
    textAlign: "center" as const,
  } as React.CSSProperties,

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  } as React.CSSProperties,

  checkboxLabel: {
    fontSize: 11,
    color: INSPECTOR_TOKENS.textTertiary,
    fontWeight: 500,
    minWidth: 70,
  } as React.CSSProperties,

  checkboxWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  } as React.CSSProperties,

  checkboxText: {
    fontSize: 11,
    color: INSPECTOR_TOKENS.textPrimary,
  } as React.CSSProperties,

  srcRow: {
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
    marginBottom: 12,
  } as React.CSSProperties,

  browseButton: {
    padding: "8px 12px",
    background: INSPECTOR_TOKENS.accentAlpha20,
    border: `1px solid ${INSPECTOR_TOKENS.accentAlpha30}`,
    borderRadius: 6,
    color: INSPECTOR_TOKENS.accent,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    marginBottom: 12,
  } as React.CSSProperties,

  iconPickerContainer: {
    marginBottom: 16,
  } as React.CSSProperties,
};
