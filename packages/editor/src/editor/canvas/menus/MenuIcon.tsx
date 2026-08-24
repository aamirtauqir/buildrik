/**
 * Menu Icon Component
 * Lightweight icon component for context menu items
 * Uses simple SVG icons for common actions
 * @license BSD-3-Clause
 */

import * as React from "react";

interface MenuIconProps {
  name?: string;
  size?: number;
}

/**
 * Exported so the coverage test can read the REAL map instead of regexing this
 * file. A textual scan fails the moment the icons are extracted into a helper
 * and spread in, or a key changes quote style — a legitimate refactor breaking
 * a guard is how guards get deleted. (Codex review, 2026-08-24.)
 */
export const ICON_PATHS: Record<string, string> = {
  // Edit actions
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
  clipboard: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
  "clipboard-paste": "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
  scissors:
    "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12",
  copy: "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z",
  "trash-2":
    "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",

  // Insert actions
  plus: "M12 5v14M5 12h14",
  "arrow-up": "M12 19V5M5 12l7-7 7 7",
  "arrow-down": "M12 5v14M5 12l7 7 7-7",
  "arrow-right": "M5 12h14M12 5l7 7-7 7",
  "corner-down-right": "M15 10l5 5-5 5",
  "corner-down-left": "M9 10l-5 5 5 5",
  box: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  "minimize-2": "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7",

  /* Order, lock and stack actions. These eight names were REFERENCED by menu
     actions and missing from this map, so `Bring Forward`, `Send Backward`,
     `Bring to Front`, `Send to Back`, `Lock`, `Unlock`, `Save as component`
     and `Select from stack` each rendered the fallback below — a literal
     asterisk where an icon belongs. Found by walking the canvas right-click
     menu, 2026-08-24. */
  "chevron-up": "m18 15-6-6-6 6",
  "chevron-down": "m6 9 6 6 6-6",
  "chevrons-up": "m17 11-5-5-5 5M17 18l-5-5-5 5",
  "chevrons-down": "m7 6 5 5 5-5M7 13l5 5 5-5",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  unlock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 9.9-1",
  package:
    "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7l8.7 5 8.7-5M12 22V12",
  "box-select":
    "M5 3a2 2 0 0 0-2 2M19 3a2 2 0 0 1 2 2M21 19a2 2 0 0 1-2 2M5 21a2 2 0 0 1-2-2M9 3h1M9 21h1M14 3h1M14 21h1M3 9v1M21 9v1M3 14v1M21 14v1",

  // Layout actions
  layout: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM3 9h18M9 21V9",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  "align-center": "M18 10H6M21 6H3M21 14H3M18 18H6",
  "maximize-2": "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",

  // Style actions
  palette:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z",
  square: "M3 3h18v18H3z",
  move: "M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20",
  image: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  "refresh-cw":
    "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",

  // Navigation
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",

  // Default dot
  default: "",
};

export const MenuIcon: React.FC<MenuIconProps> = ({ name = "default", size = 14 }) => {
  const path = ICON_PATHS[name] || ICON_PATHS.default;

  if (!path) {
    /* Holds the slot, draws nothing. It used to draw a literal "*", which does
       not read as "icon missing" — it reads as a typo, or a footnote marker, or
       a required-field mark, next to a perfectly ordinary menu label. Eight
       actions were rendering it. The label carries the meaning; an unknown icon
       should cost alignment, not credibility. */
    return (
      <span aria-hidden="true" style={{ display: "inline-block", width: size, height: size }} />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d={path} />
      {/* Add extra paths for complex icons */}
      {name === "copy" && <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />}
      {name === "eye" && <circle cx="12" cy="12" r="3" />}
      {name === "clipboard" && <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />}
      {name === "clipboard-paste" && (
        <>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M8 18v-1a4 4 0 0 1 8 0v1" />
        </>
      )}
    </svg>
  );
};

export default MenuIcon;
