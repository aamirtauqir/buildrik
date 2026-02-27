/**
 * PagesTab legacy style objects — kept for any external consumers.
 * Most styles have moved to PagesTab.css.
 * @license BSD-3-Clause
 */

import type { CSSProperties } from "react";

/** @deprecated Use CSS class .pages-panel instead */
export const containerStyles: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--aqb-surface-2)",
};

/** @deprecated Layout handled by PagesTab.css flex column */
export const contentStyles: CSSProperties = {
  flex: 1,
  overflow: "auto",
};
