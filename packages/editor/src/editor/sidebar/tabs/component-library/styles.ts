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
  background: "var(--buildrick-surface-2)",
};

export const searchContainerStyles: React.CSSProperties = {
  padding: "6px 10px",
};

export const dialogInputStyles: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  fontSize: 13,
  background: "var(--buildrick-surface-3)",
  border: "1px solid var(--buildrick-border)",
  color: "var(--buildrick-text-primary)",
  outline: "none",
  width: "100%",
};

export const dialogCancelBtnStyles: React.CSSProperties = {
  padding: "6px 16px",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
  background: "var(--buildrick-surface-3)",
  border: "1px solid var(--buildrick-border)",
  color: "var(--buildrick-text-secondary)",
};

export const dialogPrimaryBtnStyles: React.CSSProperties = {
  padding: "6px 16px",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
  background: "var(--buildrick-accent)",
  border: "1px solid var(--buildrick-accent)",
  color: "var(--buildrick-text-on-accent)",
};
