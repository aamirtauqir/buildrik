/**
 * Insert Submenu Actions
 * Insert Before, After, Inside, Wrap, Unwrap
 * @license BSD-3-Clause
 */

import type { Composer } from "../../../../engine";
import type { ElementType } from "../../../../shared/types";
import { runTransaction } from "../../../../shared/utils/helpers";
import { canNestElement } from "../../../../shared/utils/nesting";
import type { ContextAction } from "../contextMenuRegistry";

const createPlaceholderElement = (composer: Composer, parentType: ElementType) => {
  if (!canNestElement("container", parentType)) return null;
  return composer.elements.createElement("container", {
    tagName: "div",
    content: "New element",
  });
};

export const insertSubmenu: ContextAction[] = [
  {
    id: "insert-before",
    label: "Insert Before",
    icon: "arrow-up",
    group: "Insert",
    shortcut: "Cmd+Shift+Up",
    isVisible: ({ element }) => Boolean(element.getParent()),
    handler: ({ composer, element }) => {
      const parent = element.getParent();
      if (!parent) return;
      const parentType = parent.getType() as ElementType;
      const newEl = createPlaceholderElement(composer, parentType);
      if (!newEl) return;

      runTransaction(composer, "context-insert-before", () => {
        composer.elements.addElement(newEl, parent.getId(), parent.getChildIndex(element));
        composer.selection.select(newEl as never);
      });
    },
  },
  {
    id: "insert-after",
    label: "Insert After",
    icon: "arrow-down",
    group: "Insert",
    shortcut: "Cmd+Shift+Down",
    isVisible: ({ element }) => Boolean(element.getParent()),
    handler: ({ composer, element }) => {
      const parent = element.getParent();
      if (!parent) return;
      const parentType = parent.getType() as ElementType;
      const newEl = createPlaceholderElement(composer, parentType);
      if (!newEl) return;

      runTransaction(composer, "context-insert-after", () => {
        composer.elements.addElement(newEl, parent.getId(), parent.getChildIndex(element) + 1);
        composer.selection.select(newEl as never);
      });
    },
  },
  {
    id: "insert-inside-first",
    label: "Insert Inside (First)",
    icon: "corner-down-right",
    group: "Insert",
    isVisible: (ctx) => ctx.element.canHaveChildren() && !ctx.element.isLocked(),
    handler: ({ composer, element }) => {
      const elementType = element.getType() as ElementType;
      const newEl = createPlaceholderElement(composer, elementType);
      if (!newEl) return;

      runTransaction(composer, "context-insert-first", () => {
        composer.elements.addElement(newEl, element.getId(), 0);
        composer.selection.select(newEl as never);
      });
    },
  },
  {
    id: "insert-inside-last",
    label: "Insert Inside (Last)",
    icon: "corner-down-left",
    group: "Insert",
    isVisible: (ctx) => ctx.element.canHaveChildren() && !ctx.element.isLocked(),
    handler: ({ composer, element }) => {
      const elementType = element.getType() as ElementType;
      const newEl = createPlaceholderElement(composer, elementType);
      if (!newEl) return;

      runTransaction(composer, "context-insert-last", () => {
        const childCount = element.getChildren?.()?.length || 0;
        composer.elements.addElement(newEl, element.getId(), childCount);
        composer.selection.select(newEl as never);
      });
    },
  },
  {
    id: "wrap-section",
    label: "Wrap in Section",
    icon: "box",
    group: "Insert",
    shortcut: "Cmd+Shift+W",
    isVisible: (ctx) => ctx.element.canBeWrapped(),
    handler: ({ element }) => {
      element.wrap("section");
    },
  },
  {
    id: "unwrap",
    label: "Unwrap Element",
    icon: "minimize-2",
    group: "Insert",
    shortcut: "Cmd+Shift+U",
    isVisible: (ctx) => ctx.element.canBeUnwrapped(),
    isEnabled: (ctx) => (ctx.element.getChildren?.()?.length ?? 0) > 0,
    handler: ({ element }) => {
      element.unwrap();
    },
  },
];
