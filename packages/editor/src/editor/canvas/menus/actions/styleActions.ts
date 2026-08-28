/**
 * Quick Style Submenu Actions
 * Padding, Margin, Border, Background, Shadow
 * @license BSD-3-Clause
 */

import { runTransaction } from "../../../../shared/utils/helpers";
import type { ContextAction } from "../contextMenuRegistry";

export const quickStyleSubmenu: ContextAction[] = [
  {
    id: "style-padding",
    label: "Add padding (16px)",
    icon: "square",
    group: "Quick Style",
    handler: ({ composer, element }) =>
      runTransaction(composer, "style-padding", () => {
        element.setStyle("padding", "16px");
      }),
  },
  {
    id: "style-margin",
    label: "Add margin (16px)",
    icon: "move",
    group: "Quick Style",
    handler: ({ composer, element }) =>
      runTransaction(composer, "style-margin", () => {
        element.setStyle("margin", "16px");
      }),
  },
  {
    id: "style-border",
    label: "Add border",
    icon: "square",
    group: "Quick Style",
    handler: ({ composer, element }) =>
      runTransaction(composer, "style-border", () => {
        element.setStyle("border", "1px solid #ccc");
      }),
  },
  {
    id: "style-background",
    label: "Add background",
    icon: "image",
    group: "Quick Style",
    handler: ({ composer, element }) =>
      runTransaction(composer, "style-background", () => {
        element.setStyle("backgroundColor", "#f5f5f5");
      }),
  },
  {
    id: "style-shadow",
    label: "Add shadow",
    icon: "layers",
    group: "Quick Style",
    handler: ({ composer, element }) =>
      runTransaction(composer, "style-shadow", () => {
        element.setStyle("boxShadow", "0 2px 8px rgba(0,0,0,0.15)");
      }),
  },
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
    handler: ({ composer, element }) => {
      if (!composer.styleClipboard) return;
      const styles = composer.styleClipboard;
      runTransaction(composer, "context-paste-styles", () => {
        element.setStyles?.(styles);
      });
    },
  },
  {
    id: "style-reset",
    label: "Reset all styles",
    icon: "refresh-cw",
    group: "Quick Style",
    handler: ({ composer, element }) =>
      runTransaction(composer, "style-reset", () => {
        element.setStyles({});
      }),
  },
];
