/**
 * Standalone Actions
 * Actions that appear at the bottom of the context menu
 * @license BSD-3-Clause
 */

import type { ContextAction } from "../contextMenuRegistry";

export const standaloneActions: ContextAction[] = [
  {
    id: "reveal-in-layers",
    label: "Reveal in Layers",
    icon: "eye",
    group: "standalone",
    handler: ({ composer, element }) => {
      composer.selection.select(element as never);
      composer.emit?.("layers:reveal", element);
    },
  },
  {
    id: "select-parent",
    label: "Select Parent",
    icon: "arrow-up",
    group: "standalone",
    shortcut: "Alt+Up",
    isVisible: ({ element }) => Boolean(element.getParent()),
    handler: ({ composer, element }) => {
      const parent = element.getParent();
      if (parent) {
        composer.selection.select(parent as never);
      }
    },
  },
];
