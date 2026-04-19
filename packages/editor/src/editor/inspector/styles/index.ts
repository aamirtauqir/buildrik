/**
 * ProInspector Styles and Constants
 * Extracted from main component for better organization
 *
 * @license BSD-3-Clause
 */

import type { PseudoStateId } from "../../../shared/types";

// ============================================================================
// SPACING CONSTANTS (4px base grid)
// ============================================================================

export const INSPECTOR_SPACING = {
  // Section container
  sectionPadding: "var(--buildrick-design-space-4)", // 16px
  sectionGap: "var(--buildrick-design-space-3)", // 12px between sections

  // Section header
  headerPaddingY: "var(--buildrick-design-space-2)", // 8px
  headerPaddingX: "var(--buildrick-design-space-4)", // 16px

  // Content area
  contentPadding: "var(--buildrick-design-space-4)", // 16px
  contentGap: "var(--buildrick-design-space-3)", // 12px between control groups

  // Control groups (label + input)
  controlGap: "var(--buildrick-design-space-2)", // 8px between label and input
  inputGap: "var(--buildrick-design-space-2)", // 8px between inputs in a row

  // Labels
  labelMarginBottom: "var(--buildrick-design-space-1)", // 4px
} as const;

// ============================================================================
// TYPOGRAPHY CONSTANTS
// ============================================================================

export const INSPECTOR_TYPOGRAPHY = {
  sectionTitle: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.02em",
  },
  label: {
    fontSize: "11px",
    fontWeight: 500,
    color: "var(--buildrick-text-secondary)",
  },
  input: {
    fontSize: "13px",
    fontWeight: 400,
  },
  hint: {
    fontSize: "10px",
    color: "var(--buildrick-text-muted)",
  },
} as const;

// ============================================================================
// PANEL STYLES
// ============================================================================

export const panelStyles = {
  panel: {
    height: "100%",
    overflowY: "auto" as const,
    background: "var(--buildrick-surface-2)",
    fontFamily: "var(--buildrick-font-family)",
  },
  noSelection: {
    height: "100%",
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    textAlign: "center" as const,
    padding: 40,
    color: "var(--buildrick-text-tertiary)",
  },
  header: {
    padding: "10px 14px",
    background: "var(--buildrick-surface-2)",
    borderBottom: "1px solid var(--buildrick-border)",
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
  },
  elementInfo: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  // Compact icon — 36 was visually dominant in a 320px panel and forced the
  // name/id badges into a cramped column. 28 keeps the element identifiable
  // without stealing header real estate.
  elementIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: "var(--buildrick-surface-3)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontSize: 14,
    flexShrink: 0,
  },
  elementName: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--buildrick-text-primary)",
    marginBottom: 2,
  },
  tabs: {
    display: "flex" as const,
    padding: "8px 12px",
    background: "var(--buildrick-surface-2)",
    borderBottom: "1px solid var(--buildrick-border)",
  },
  tabGroup: {
    display: "flex" as const,
    flex: 1,
    background: "var(--buildrick-surface-3)",
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  tab: (active: boolean) => ({
    flex: 1,
    padding: "6px 12px",
    background: active ? "var(--buildrick-accent)" : "transparent",
    border: "none",
    borderRadius: 18,
    color: active ? "#fff" : "var(--buildrick-text-tertiary)",
    fontSize: "var(--buildrick-text-sm)",
    fontWeight: 600,
    cursor: "pointer" as const,
    transition: "var(--buildrick-transition-fast)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
  }),
  content: {
    padding: "var(--buildrick-design-space-2) 0",
  },
  breakpointIndicator: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 6,
    padding: "6px 12px",
    marginTop: 12,
    borderRadius: 6,
    fontSize: "var(--buildrick-text-sm)",
    fontWeight: 600,
    transition: "var(--buildrick-transition-fast)",
  },
  stateSelector: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 4,
    padding: "var(--buildrick-design-space-2) var(--buildrick-design-space-3)",
    marginTop: 8,
    background: "rgba(0,0,0,0.2)",
    borderRadius: 6,
  },
  stateBtn: (active: boolean, state: PseudoStateId) => {
    // BUG-010 FIX: Changed active state to green for better visual contrast
    const colors: Record<PseudoStateId, string> = {
      normal: "var(--buildrick-text-tertiary)",
      hover: "var(--buildrick-accent)",
      focus: "var(--buildrick-info)",
      active: "var(--buildrick-success)",
      disabled: "var(--buildrick-text-muted)",
    };
    const rawColors: Record<PseudoStateId, string> = {
      normal: "#6c7086",
      hover: "#2d6dff",
      focus: "#3b82f6",
      active: "#22c55e",
      disabled: "#6b7280",
    };
    return {
      flex: 1,
      padding: "6px 8px",
      background: active ? `${rawColors[state]}20` : "transparent",
      border: active ? `1px solid ${rawColors[state]}50` : "1px solid transparent",
      borderRadius: 6,
      color: active ? colors[state] : "var(--buildrick-text-tertiary)",
      fontSize: "var(--buildrick-text-xs)",
      fontWeight: 600,
      cursor: "pointer" as const,
      transition: "var(--buildrick-transition-fast)",
      textAlign: "center" as const,
    };
  },
};

