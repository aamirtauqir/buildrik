/**
 * Toolbar styles — extracted from UnifiedSelectionToolbar for size compliance
 * All CSSProperties objects and CSS injection for the unified selection toolbar.
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
  background: colors.surface.background,
  border: `1px solid ${colors.surface.border}`,
  borderRadius: radius.md,
  boxShadow: shadows.md,
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
  fontSize: 11,
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
  fontSize: 11,
  textAlign: "left",
  cursor: "pointer",
  transition: `all ${animation.duration.fast}`,
};

export const menuDividerStyles: React.CSSProperties = {
  height: 1,
  background: colors.surface.border,
  margin: "4px 8px",
};

// Inject global hover/focus styles via CSS using design tokens
const styleSheet = `
.aqb-unified-toolbar button:hover {
  background: ${colors.surface.border} !important;
  color: ${colors.text.primary} !important;
}
.aqb-unified-toolbar button:active {
  transform: scale(0.95);
}
.aqb-unified-toolbar button:focus-visible {
  outline: 2px solid ${colors.primary.default} !important;
  outline-offset: 1px;
  background: ${colors.primary.alpha10} !important;
}
.aqb-unified-toolbar button[aria-label="Delete element"] {
  color: ${colors.text.muted};
}
.aqb-unified-toolbar button[aria-label="Delete element"]:hover {
  background: ${colors.status.errorBg} !important;
  color: ${colors.status.error} !important;
}
.aqb-unified-toolbar button[aria-label="Delete element"]:focus-visible {
  outline-color: ${colors.status.error} !important;
}
/* Dropdown menu keyboard navigation */
.aqb-unified-toolbar [role="menu"] button:focus-visible {
  background: ${colors.surface.border} !important;
  outline: none;
}
/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .aqb-unified-toolbar button:active {
    transform: none;
  }
}
`;

if (typeof document !== "undefined") {
  const existingStyle = document.getElementById("aqb-unified-toolbar-styles");
  if (!existingStyle) {
    const style = document.createElement("style");
    style.id = "aqb-unified-toolbar-styles";
    style.textContent = styleSheet;
    document.head.appendChild(style);
  }
}

/** Format an element type string into a display name */
export function formatElementName(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ");
}
