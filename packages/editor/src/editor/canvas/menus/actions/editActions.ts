/**
 * Edit Submenu Actions
 * Copy, Cut, Paste, Duplicate, Delete
 * @license BSD-3-Clause
 */

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
    handler: ({ composer, element, addToast }) => {
      const data = element.getData?.();
      // Populate the in-app clipboard (not only the OS clipboard) so the
      // context-menu Paste below — which runs the engine `paste` command —
      // has something to paste. Without this, copy→paste from the right-click
      // menu silently did nothing (the two used separate clipboards).
      if (composer) composer.clipboard = data ?? null;
      const text = JSON.stringify(data, null, 2);
      navigator?.clipboard
        ?.writeText(text)
        .then(() => {
          addToast?.({
            description: "Copied to clipboard",
            tone: "success",
            duration: 2000,
          });
        })
        .catch(() => {
          addToast?.({
            description: "Failed to copy to clipboard",
            tone: "error",
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
          description: "Failed to copy to clipboard",
          tone: "warning",
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
          description: message,
          tone: "info",
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
    handler: ({ composer, addToast }) => {
      // Was emitting a "clipboard:paste" event that nothing listened to, so the
      // right-click Paste silently did nothing. Run the real engine `paste`
      // command (the same path Cmd+V uses) and report the outcome.
      if (!composer.clipboard) {
        addToast?.({
          description: "Nothing to paste — copy an element first",
          tone: "info",
          duration: 3000,
        });
        return;
      }
      composer.commands.run("paste");
      addToast?.({ description: "Pasted", tone: "success", duration: 2000 });
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
          description: message,
          tone: "info",
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
