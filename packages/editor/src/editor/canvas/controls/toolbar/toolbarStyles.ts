/**
 * Toolbar styles — extracted from UnifiedSelectionToolbar for size compliance
 * All CSSProperties objects for the unified selection toolbar.
 *
 * State styles (hover/focus/active/delete) live as plain CSS at
 * `themes/components/molecules/canvas-toolbar.css`, scoped under the
 * `.bd-canvas-toolbar` class (applied to the toolbar root in
 * `UnifiedSelectionToolbar.tsx`). The runtime <style> injection that used to
 * live here was removed once the rules became authored CSS.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { canvasTokens } from "../../../../styles/tokens";

const { colors, radius, shadows, animation } = canvasTokens;

export const toolbarStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: 28,
  padding: "0 4px",
  background: "var(--buildrick-surface-4)",
  border: "1px solid var(--buildrick-border-light, rgba(255,255,255,0.12))",
  borderRadius: "var(--buildrick-radius-md)",
  boxShadow: "var(--buildrick-shadow-md)",
  backdropFilter: "blur(8px)",
  gap: 2,
};

export const parentBtnStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  background: "transparent",
  border: "none",
  borderRadius: radius.sm,
  color: colors.text.secondary,
  cursor: "pointer",
  transition: `all ${animation.duration.fast}`,
};

export const nameBtnStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: 24,
  padding: "0 8px",
  background: "transparent",
  border: "none",
  borderRadius: radius.sm,
  color: colors.text.primary,
  cursor: "pointer",
  transition: `all ${animation.duration.fast}`,
};

export const nameTextStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.2px",
  maxWidth: 100,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const actionBtnStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  background: "transparent",
  border: "none",
  borderRadius: radius.sm,
  color: colors.text.secondary,
  cursor: "pointer",
  transition: `all ${animation.duration.fast}`,
};

export const deleteContainerStyles: React.CSSProperties = {
  marginLeft: 12,
  paddingLeft: 8,
  borderLeft: `1px solid ${colors.surface.border}`,
};

export const isolatedDeleteStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  background: "transparent",
  border: "none",
  borderRadius: radius.sm,
  color: colors.text.muted,
  cursor: "pointer",
  transition: `all ${animation.duration.fast}`,
};

export const dividerStyles: React.CSSProperties = {
  width: 1,
  height: 16,
  background: colors.surface.border,
  margin: "0 2px",
};

export const dropdownStyles: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  marginTop: 4,
  minWidth: 140,
  background: colors.surface.background,
  border: `1px solid ${colors.surface.border}`,
  borderRadius: radius.lg,
  boxShadow: shadows.lg,
  overflow: "hidden",
  zIndex: 10,
};

export const menuItemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  height: 28,
  padding: "0 10px",
  background: "transparent",
  border: "none",
  color: colors.text.secondary,
  fontSize: 12,
  textAlign: "left",
  cursor: "pointer",
  transition: `all ${animation.duration.fast}`,
};

export const menuDividerStyles: React.CSSProperties = {
  height: 1,
  background: colors.surface.border,
  margin: "4px 8px",
};

/** Format an element type string into a display name */
export function formatElementName(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ");
}
