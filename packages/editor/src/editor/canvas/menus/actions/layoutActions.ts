/**
 * Layout Submenu Actions
 * Flex, Grid, Center, Space Between, Layer Ordering
 * @license BSD-3-Clause
 */

import { runTransaction } from "../../../../shared/utils/helpers";
import type { ContextAction } from "../contextMenuRegistry";

export const layoutSubmenu: ContextAction[] = [
  {
    id: "layout-flex-row",
    label: "Make Flex Row",
    icon: "arrow-right",
    group: "Layout",
    shortcut: "Alt+R",
    isVisible: (ctx) => ctx.element.isContainer(),
    handler: ({ composer, element }) =>
      runTransaction(composer, "layout-flex-row", () => {
        element.setStyle("display", "flex");
        element.setStyle("flexDirection", "row");
      }),
  },
  {
    id: "layout-flex-column",
    label: "Make Flex Column",
    icon: "arrow-down",
    group: "Layout",
    shortcut: "Alt+C",
    isVisible: (ctx) => ctx.element.isContainer(),
    handler: ({ composer, element }) =>
      runTransaction(composer, "layout-flex-column", () => {
        element.setStyle("display", "flex");
        element.setStyle("flexDirection", "column");
      }),
  },
  {
    id: "layout-grid",
    label: "Make Grid (2 cols)",
    icon: "grid",
    group: "Layout",
    shortcut: "Alt+G",
    isVisible: (ctx) => ctx.element.isContainer(),
    handler: ({ composer, element }) =>
      runTransaction(composer, "layout-grid", () => {
        element.setStyle("display", "grid");
        element.setStyle("gridTemplateColumns", "repeat(2, minmax(0, 1fr))");
        element.setStyle("gap", element.getStyle("gap") || "16px");
      }),
  },
  {
    id: "layout-center",
    label: "Center Content",
    icon: "align-center",
    group: "Layout",
    shortcut: "Alt+M",
    isVisible: (ctx) => ctx.element.isContainer(),
    handler: ({ composer, element }) =>
      runTransaction(composer, "layout-center", () => {
        element.setStyle("display", "flex");
        element.setStyle("alignItems", "center");
        element.setStyle("justifyContent", "center");
      }),
  },
  {
    id: "layout-space-between",
    label: "Space Between",
    icon: "maximize-2",
    group: "Layout",
    shortcut: "Alt+B",
    isVisible: (ctx) => ctx.element.isContainer(),
    handler: ({ composer, element }) =>
      runTransaction(composer, "layout-space-between", () => {
        element.setStyle("display", "flex");
        element.setStyle("justifyContent", "space-between");
      }),
  },
  // ── Layer ordering ───────────────────────────────────────────────────────────
  {
    id: "bring-to-front",
    label: "Bring to Front",
    icon: "chevrons-up",
    group: "Layout",
    shortcut: "Ctrl+Shift+]",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer }) => {
      composer.commands.run("bring-to-front");
    },
  },
  {
    id: "bring-forward",
    label: "Bring Forward",
    icon: "chevron-up",
    group: "Layout",
    shortcut: "Ctrl+]",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer }) => {
      composer.commands.run("bring-forward");
    },
  },
  {
    id: "send-backward",
    label: "Send Backward",
    icon: "chevron-down",
    group: "Layout",
    shortcut: "Ctrl+[",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer }) => {
      composer.commands.run("send-backward");
    },
  },
  {
    id: "send-to-back",
    label: "Send to Back",
    icon: "chevrons-down",
    group: "Layout",
    shortcut: "Ctrl+Shift+[",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer }) => {
      composer.commands.run("send-to-back");
    },
  },
];
