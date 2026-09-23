/**
 * Layout Submenu Actions — layer ordering.
 * The flex/grid/center/space-between presets were deleted (G2-053): layout
 * is set in the inspector, where it can be seen and undone field by field.
 * @license BSD-3-Clause
 */

import type { ContextAction } from "../contextMenuRegistry";

export const layoutSubmenu: ContextAction[] = [
  // ── Layer ordering ───────────────────────────────────────────────────────────
  {
    id: "bring-to-front",
    label: "Bring to front",
    icon: "chevrons-up",
    group: "Layout",
    shortcut: "Cmd+Shift+]",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer }) => {
      composer.commands.run("bring-to-front");
    },
  },
  {
    id: "bring-forward",
    label: "Bring forward",
    icon: "chevron-up",
    group: "Layout",
    shortcut: "Cmd+]",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer }) => {
      composer.commands.run("bring-forward");
    },
  },
  {
    id: "send-backward",
    label: "Send backward",
    icon: "chevron-down",
    group: "Layout",
    shortcut: "Cmd+[",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer }) => {
      composer.commands.run("send-backward");
    },
  },
  {
    id: "send-to-back",
    label: "Send to back",
    icon: "chevrons-down",
    group: "Layout",
    shortcut: "Cmd+Shift+[",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer }) => {
      composer.commands.run("send-to-back");
    },
  },
];
