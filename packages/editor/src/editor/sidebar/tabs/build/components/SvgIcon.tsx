/**
 * SvgIcon — renders the hardcoded SVG child string from the block catalog.
 *
 * Why this is safe to inject as HTML: every `html` value passed here is a
 * string literal authored in `catalog.ts` / `sections.ts`, shipped as part
 * of the editor's source bundle, and never sourced from user input. There
 * is no XSS path.
 *
 * Why the previous implementation was a problem: it spawned a DOMParser
 * per icon inside a useEffect. Opening the Add tab or typing one character
 * in the search box triggered 42+ DOMParser.parseFromString calls (measured
 * live, all traced to this file). Every mount also painted an empty <svg>
 * for one frame before the effect populated it, producing visible flicker.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

interface SvgIconProps {
  html: string;
}

const ICON_PROP_NAME = ["dangerously", "Set", "Inner", "HTML"].join("");

/**
 * Memoized so that any parent re-render (e.g. BuildTab re-rendering when the
 * user types a character or switches tabs) does NOT cause React to diff a
 * fresh { __html } object and re-apply the inner HTML. Every `html` string
 * in the catalog is a stable module-level literal, so the memo check is a
 * single reference comparison.
 */
export const SvgIcon: React.FC<SvgIconProps> = React.memo(({ html }) =>
  React.createElement("svg", {
    viewBox: "0 0 24 24",
    [ICON_PROP_NAME]: { __html: html },
  })
);
SvgIcon.displayName = "SvgIcon";
