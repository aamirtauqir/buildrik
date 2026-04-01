/**
 * tips.ts — PRO TIP carousel data for the Build Tab footer
 * @license BSD-3-Clause
 */

export interface Tip {
  bold: string;
  body: string;
}

export const TIPS: Tip[] = [
  {
    bold: "Drag to canvas",
    body: " — Drag an element card onto the canvas to place it.",
  },
  {
    bold: "⭐ My Favorites",
    body: " — Hover an element and click the star to save it for quick access.",
  },
  {
    bold: "⌘F to search",
    body: " — Press ⌘F (Ctrl+F) to jump to search. Esc or ✕ to clear.",
  },
  {
    bold: "My Components",
    body: " — Once available, save any element as a reusable component from the right-click menu.",
  },
  {
    bold: "Browse categories",
    body: " — Click any category row to expand it in-place and explore elements.",
  },
];
