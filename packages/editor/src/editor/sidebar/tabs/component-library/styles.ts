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
  background: "var(--bd-bg-subtle)",
};

export const searchContainerStyles: React.CSSProperties = {
  padding: "6px 10px",
};

export const dialogInputStyles: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  fontSize: 13,
  background: "var(--bd-bg-subtle)",
  border: "1px solid var(--bd-border)",
  color: "var(--bd-fg-primary)",
  outline: "none",
  width: "100%",
};

export const dialogCancelBtnStyles: React.CSSProperties = {
  padding: "6px 16px",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
  background: "var(--bd-bg-subtle)",
  border: "1px solid var(--bd-border)",
  color: "var(--bd-fg-secondary)",
};

export const dialogPrimaryBtnStyles: React.CSSProperties = {
  padding: "6px 16px",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
  background: "var(--bd-accent)",
  border: "1px solid var(--bd-accent)",
  color: "var(--bd-fg-on-accent)",
};
