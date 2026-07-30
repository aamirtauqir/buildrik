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
  background: "var(--bk-bg-subtle)",
};

export const searchContainerStyles: React.CSSProperties = {
  padding: "6px 10px",
};

export const dialogInputStyles: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  fontSize: 13,
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border)",
  color: "var(--bk-ink)",
  outline: "none",
  width: "100%",
  appearance: "auto",
};

export const dialogCancelBtnStyles: React.CSSProperties = {
  padding: "6px 16px",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border)",
  color: "var(--bk-ink-soft)",
};

export const dialogPrimaryBtnStyles: React.CSSProperties = {
  padding: "6px 16px",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
  background: "var(--bk-accent)",
  border: "1px solid var(--bk-accent)",
  color: "var(--bk-accent-on)",
};
