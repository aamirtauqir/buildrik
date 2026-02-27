/**
 * Header Styles - Shared CSS-in-JS styles for panel headers
 * Used by PanelHeader, DrillInHeader, and other header components
 * @license BSD-3-Clause
 */

import type React from "react";

/**
 * Container for action buttons (right side of headers)
 * Reduced gap for tighter grouping
 */
export const actionsContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  marginRight: 2,
};

/**
 * Standard header title text
 */
export const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--aqb-text-md)",
  fontWeight: 600,
  lineHeight: "20px",
  color: "var(--aqb-text-primary)",
  letterSpacing: "-0.01em",
};

/**
 * Base header container (48px height - compact)
 */
export const headerContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: 48,
  minHeight: 48,
  padding: "0 10px 0 12px",
  borderBottom: "1px solid var(--aqb-border)",
  background: "var(--aqb-surface-2)",
};

/**
 * Header container for drill-in screens (flexible height)
 */
export const drillInHeaderContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  minHeight: 48,
  padding: "8px 10px 8px 12px",
  borderBottom: "1px solid var(--aqb-border)",
  background: "var(--aqb-surface-2)",
};
