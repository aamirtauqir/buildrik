/**
 * Quick Style Submenu Actions — copy / paste styles.
 * The padding/margin/border/background/shadow presets and "Reset all styles"
 * were deleted (G2-054): hard-coded values outside the Brand tokens.
 * @license BSD-3-Clause
 */

import { pasteStyles } from "@/engine/commands/commandOperations";
import type { ContextAction } from "../contextMenuRegistry";

export const quickStyleSubmenu: ContextAction[] = [
  {
    id: "copy-styles",
    label: "Copy styles",
    icon: "clipboard",
    group: "Quick Style",
    shortcut: "Cmd+Alt+C",
    handler: ({ composer, element }) => {
      composer.styleClipboard = element.getStyles?.() || {};
    },
  },
  {
    id: "paste-styles",
    label: "Paste styles",
    icon: "clipboard-paste",
    group: "Quick Style",
    shortcut: "Cmd+Alt+V",
    isEnabled: ({ composer }) =>
      Boolean(composer.styleClipboard && Object.keys(composer.styleClipboard).length),
    /* P-10: the shared merge — this replaced the whole style map. */
    handler: ({ composer, element }) => {
      pasteStyles(composer, element);
    },
  },
];
