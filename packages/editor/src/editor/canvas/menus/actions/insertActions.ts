/**
 * Insert Submenu Actions — Wrap, Unwrap.
 * Insert before/after/inside were deleted (G2-052): each dropped a
 * "New element" placeholder container, and one of the four was a silent no-op;
 * inserting is the Add panel's job.
 * @license BSD-3-Clause
 */

import type { ContextAction } from "../contextMenuRegistry";

export const insertSubmenu: ContextAction[] = [
  {
    id: "wrap-section",
    label: "Wrap in section",
    icon: "box",
    group: "Insert",
    isVisible: (ctx) => ctx.element.canBeWrapped(),
    handler: ({ element }) => {
      element.wrap("section");
    },
  },
  {
    id: "unwrap",
    label: "Unwrap element",
    icon: "minimize-2",
    group: "Insert",
    /* Board 1176:4866 draws this row greyed rather than absent. Hiding it made
       the menu change shape between elements, and left no way to learn the
       command exists — which is what a disabled row with its chord is for. */
    isEnabled: (ctx) =>
      ctx.element.canBeUnwrapped() && (ctx.element.getChildren?.()?.length ?? 0) > 0,
    handler: ({ element }) => {
      element.unwrap();
    },
  },
];
