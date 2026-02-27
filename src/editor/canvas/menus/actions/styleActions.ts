/**
 * Quick Style Submenu Actions
 * Padding, Margin, Border, Background, Shadow
 * @license BSD-3-Clause
 */

import { runTransaction } from "../../../../shared/utils/helpers";
import type { ContextAction } from "../contextMenuRegistry";

let styleClipboard: Record<string, string> | null = null;

export const quickStyleSubmenu: ContextAction[] = [
  {
    id: "style-padding",
    label: "Add Padding (16px)",
    icon: "square",
    group: "Quick Style",
    handler: ({ composer, element }) =>
      runTransaction(composer, "style-padding", () => {
        element.setStyle("padding", "16px");
      }),
  },
  {
    id: "style-margin",
    label: "Add Margin (16px)",
    icon: "move",
    group: "Quick Style",
    handler: ({ composer, element }) =>
      runTransaction(composer, "style-margin", () => {
        element.setStyle("margin", "16px");
      }),
  },
  {
    id: "style-border",
    label: "Add Border",
    icon: "square",
    group: "Quick Style",
    handler: ({ composer, element }) =>
      runTransaction(composer, "style-border", () => {
        element.setStyle("border", "1px solid #ccc");
      }),
  },
  {
    id: "style-background",
    label: "Add Background",
    icon: "image",
    group: "Quick Style",
    handler: ({ composer, element }) =>
      runTransaction(composer, "style-background", () => {
        element.setStyle("backgroundColor", "#f5f5f5");
      }),
  },
  {
    id: "style-shadow",
    label: "Add Shadow",
    icon: "layers",
    group: "Quick Style",
    handler: ({ composer, element }) =>
      runTransaction(composer, "style-shadow", () => {
        element.setStyle("boxShadow", "0 2px 8px rgba(0,0,0,0.15)");
      }),
  },
  {
    id: "copy-styles",
    label: "Copy Styles",
    icon: "clipboard",
    group: "Quick Style",
    shortcut: "Cmd+Shift+C",
    handler: ({ element }) => {
      styleClipboard = element.getStyles?.() || {};
    },
  },
  {
    id: "paste-styles",
    label: "Paste Styles",
    icon: "clipboard-paste",
    group: "Quick Style",
    shortcut: "Cmd+Shift+V",
    isEnabled: () => Boolean(styleClipboard && Object.keys(styleClipboard).length),
    handler: ({ composer, element }) => {
      if (!styleClipboard) return;
      runTransaction(composer, "context-paste-styles", () => {
        element.setStyles?.(styleClipboard as Record<string, string>);
      });
    },
  },
  {
    id: "style-reset",
    label: "Reset All Styles",
    icon: "refresh-cw",
    group: "Quick Style",
    handler: ({ composer, element }) =>
      runTransaction(composer, "style-reset", () => {
        element.setStyles({});
      }),
  },
];
