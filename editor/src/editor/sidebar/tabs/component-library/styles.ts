/**
 * ComponentsTab style constants
 * Extracted from ComponentsTab.tsx to keep the main file under 500 lines.
 * @license BSD-3-Clause
 */

import * as React from "react";

export const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--aqb-surface-2)",
};

export const searchContainerStyles: React.CSSProperties = {
  padding: "6px 10px",
};

export const dialogInputStyles: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  fontSize: 13,
  background: "var(--aqb-surface-3)",
  border: "1px solid var(--aqb-border)",
  color: "var(--aqb-text-primary)",
  outline: "none",
  width: "100%",
};

export const dialogCancelBtnStyles: React.CSSProperties = {
  padding: "6px 16px",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
  background: "var(--aqb-surface-3)",
  border: "1px solid var(--aqb-border)",
  color: "var(--aqb-text-secondary)",
};

export const dialogPrimaryBtnStyles: React.CSSProperties = {
  padding: "6px 16px",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
  background: "var(--aqb-primary)",
  border: "1px solid var(--aqb-primary)",
  color: "#fff",
};
