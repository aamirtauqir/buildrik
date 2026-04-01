/**
 * Edit Submenu Actions
 * Copy, Cut, Paste, Duplicate, Delete
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../../../shared/constants/events";
import { runTransaction } from "../../../../shared/utils/helpers";
import { getElementNameFromType } from "../../utils/elementInfo";
import type { ContextAction } from "../contextMenuRegistry";

export const editSubmenu: ContextAction[] = [
  {
    id: "copy",
    label: "Copy",
    icon: "clipboard",
    group: "Edit",
    shortcut: "Cmd+C",
    handler: ({ element, addToast }) => {
      const data = element.getData?.();
      const text = JSON.stringify(data, null, 2);
      navigator?.clipboard
        ?.writeText(text)
        .then(() => {
          addToast?.({
            message: "Copied to clipboard",
            variant: "success",
            duration: 2000,
          });
        })
        .catch(() => {
          addToast?.({
            message: "Failed to copy to clipboard",
            variant: "error",
            duration: 3000,
          });
        });
    },
  },
  {
    id: "cut",
    label: "Cut",
    icon: "scissors",
    group: "Edit",
    shortcut: "Cmd+X",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer, element, addToast }) => {
      // Get element info for toast before cutting
      const elementType = element.getType?.() || "element";
      const elementName = getElementNameFromType(elementType);
      const childCount = element.getChildren?.()?.length || 0;

      const data = element.getData?.();
      const text = JSON.stringify(data, null, 2);
      navigator?.clipboard?.writeText(text).catch(() => {
        addToast?.({
          message: "Failed to copy to clipboard",
          variant: "warning",
          duration: 3000,
        });
      });
      runTransaction(composer, "context-cut", () => {
        composer.elements.removeElement(element.getId());
        composer.selection.select(null as never);
      });

      // Show undo toast
      if (addToast) {
        const message =
          childCount > 0
            ? `${elementName} (${childCount} ${childCount === 1 ? "child" : "children"}) cut`
            : `${elementName} cut`;
        addToast({
          message,
          variant: "info",
          duration: 5000,
          action: {
            label: "Undo",
            onClick: () => composer.history.undo(),
          },
        });
      }
    },
  },
  {
    id: "paste",
    label: "Paste",
    icon: "clipboard-paste",
    group: "Edit",
    shortcut: "Cmd+V",
    handler: ({ composer }) => {
      composer.emit?.("clipboard:paste");
    },
  },
  {
    id: "duplicate",
    label: "Duplicate",
    icon: "copy",
    group: "Edit",
    shortcut: "Cmd+D",
    handler: ({ composer, element }) => {
      runTransaction(composer, "context-duplicate", () => {
        composer.elements.duplicateElement(element.getId());
      });
    },
  },
  {
    id: "create-component",
    label: "Create Component",
    icon: "package",
    group: "Edit",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer, element }) => {
      composer.emit(EVENTS.COMPONENT_CREATE_REQUESTED, {
        elementId: element.getId(),
      });
    },
  },
  {
    id: "delete",
    label: "Delete",
    icon: "trash-2",
    group: "Edit",
    shortcut: "Del",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer, element, addToast }) => {
      // Get element info for toast before deleting
      const elementType = element.getType?.() || "element";
      const elementName = getElementNameFromType(elementType);
      const childCount = element.getChildren?.()?.length || 0;

      runTransaction(composer, "context-delete", () => {
        composer.elements.removeElement(element.getId());
        composer.selection.select(null as never);
      });

      // Show undo toast
      if (addToast) {
        const message =
          childCount > 0
            ? `${elementName} (${childCount} ${childCount === 1 ? "child" : "children"}) deleted`
            : `${elementName} deleted`;
        addToast({
          message,
          variant: "info",
          duration: 5000,
          action: {
            label: "Undo",
            onClick: () => composer.history.undo(),
          },
        });
      }
    },
  },
];
