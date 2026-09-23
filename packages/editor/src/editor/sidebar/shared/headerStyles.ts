/**
 * Header Styles - Shared CSS-in-JS styles for panel headers
 * Used by DrillInHeader
 * @license BSD-3-Clause
 */

import type React from "react";

/**
 * Header container for drill-in screens (flexible height)
 */
export const drillInHeaderContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  minHeight: 48,
  padding: "8px 10px 8px 12px",
  borderBottom: "1px solid var(--bk-border)",
  background: "var(--bk-bg-subtle)",
};
