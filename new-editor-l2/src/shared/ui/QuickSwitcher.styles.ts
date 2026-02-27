/**
 * QuickSwitcher - Style constants and section definitions
 *
 * All CSS-in-JS style objects and structural constants for the Quick Switcher.
 *
 * @module components/ui/QuickSwitcher.styles
 * @license BSD-3-Clause
 */

import type * as React from "react";
import type { QuickSwitcherSection } from "./QuickSwitcher.types";

// ============================================
// Constants
// ============================================

export const STORAGE_KEY = "aqb-quick-switcher-recent";
export const MAX_RECENT = 8;

export const SECTIONS: QuickSwitcherSection[] = [
  { type: "recent", label: "Recent", icon: "\u{1F550}", emptyMessage: "No recent items" },
  { type: "page", label: "Pages", icon: "\u{1F4C4}", emptyMessage: "No pages found" },
  { type: "element", label: "Elements", icon: "\u{1F9E9}", emptyMessage: "No elements found" },
  { type: "template", label: "Templates", icon: "\u{1F4CB}", emptyMessage: "No templates found" },
  { type: "command", label: "Commands", icon: "\u26A1", emptyMessage: "No commands found" },
];

// ============================================
// Styles
// ============================================

export const backdropStyles: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(4px)",
  zIndex: 1999,
};

export const containerStyles: React.CSSProperties = {
  position: "fixed",
  top: "15%",
  left: "50%",
  transform: "translateX(-50%)",
  width: 600,
  maxWidth: "90vw",
  maxHeight: "70vh",
  background: "var(--aqb-bg-panel, #1c1e24)",
  border: "1px solid var(--aqb-border, rgba(255, 255, 255, 0.08))",
  borderRadius: "var(--aqb-radius-lg, 12px)",
  boxShadow: "0 16px 64px rgba(0, 0, 0, 0.5)",
  zIndex: 2000,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  animation: "aqb-slide-down 0.15s ease-out",
};

export const inputContainerStyles: React.CSSProperties = {
  padding: 16,
  borderBottom: "1px solid var(--aqb-border, rgba(255, 255, 255, 0.08))",
};

export const inputStyles: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  background: "var(--aqb-surface-1, rgba(255, 255, 255, 0.03))",
  border: "1px solid var(--aqb-border, rgba(255, 255, 255, 0.08))",
  borderRadius: "var(--aqb-radius-md, 8px)",
  color: "var(--aqb-text-primary, #ffffff)",
  fontSize: 15,
  outline: "none",
};

export const listStyles: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "8px 12px",
};

export const sectionHeaderStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 8px 6px",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--aqb-text-muted, #6b7280)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

export const itemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "10px 12px",
  background: "transparent",
  border: "none",
  borderRadius: 6,
  color: "var(--aqb-text-primary, #ffffff)",
  fontSize: 13,
  cursor: "pointer",
  textAlign: "left",
  transition: "background 0.1s ease",
};

export const itemSelectedStyles: React.CSSProperties = {
  background: "var(--aqb-bg-hover, rgba(255, 255, 255, 0.05))",
};

export const itemLeftStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flex: 1,
  minWidth: 0,
};

export const iconStyles: React.CSSProperties = {
  fontSize: 16,
  opacity: 0.8,
  flexShrink: 0,
};

export const textContainerStyles: React.CSSProperties = {
  minWidth: 0,
  flex: 1,
};

export const labelStyles: React.CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const subtitleStyles: React.CSSProperties = {
  fontSize: 11,
  color: "var(--aqb-text-muted, #6b7280)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  marginTop: 2,
};

export const shortcutStyles: React.CSSProperties = {
  fontSize: 11,
  color: "var(--aqb-text-muted, #6b7280)",
  fontFamily: "system-ui, -apple-system, sans-serif",
  background: "rgba(255, 255, 255, 0.06)",
  padding: "3px 8px",
  borderRadius: 4,
  flexShrink: 0,
};

export const footerStyles: React.CSSProperties = {
  padding: "10px 16px",
  borderTop: "1px solid var(--aqb-border, rgba(255, 255, 255, 0.08))",
  display: "flex",
  justifyContent: "space-between",
  fontSize: 11,
  color: "var(--aqb-text-muted, #6b7280)",
};

export const emptyStyles: React.CSSProperties = {
  padding: 32,
  textAlign: "center",
  color: "var(--aqb-text-muted, #6b7280)",
  fontSize: 13,
};

export const hintKeyStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 20,
  height: 18,
  padding: "0 5px",
  background: "rgba(255, 255, 255, 0.06)",
  borderRadius: 3,
  fontSize: 10,
  marginRight: 4,
};
