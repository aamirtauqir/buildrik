/**
 * Edit Submenu Actions
 * Copy, Cut, Paste, Duplicate, Delete
 * @license BSD-3-Clause
 */

import { runTransaction } from "../../../../shared/utils/helpers";
import type { ContextAction } from "../contextMenuRegistry";
import { writeClipboardText } from "@buildrik/shared/browser/clipboard";

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
      if (composer) composer.clipboard = data ? [data] : null;
      const text = JSON.stringify(data, null, 2);
      writeClipboardText(text)
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
    /* Follow-up to A-5: this used to call
       composer.elements.removeElement directly, bypassing the lock/instance
       filter the engine `cut` command applies — a right-click Cut on a
       locked element removed it anyway. Routed through commands.run("cut")
       like the Delete row below: it applies the same filter, sets
       composer.clipboard from the WHOLE selection (not just the
       right-clicked element), and emits CLIPBOARD_CUT — which
       useClipboardToasts already turns into the "N cut" + Undo toast, so
       the manual toast/removeElement/local clipboard write here would only
       double it (same reasoning as Paste's comment above). The OS-clipboard
       write (for pasting outside the app) stays, off the still-useful
       `element` context. */
    handler: ({ composer, element, addToast }) => {
      const data = element.getData?.();
      const text = JSON.stringify(data, null, 2);
      writeClipboardText(text).catch(() => {
        addToast?.({
          description: "Failed to copy to clipboard",
          tone: "warning",
          duration: 3000,
        });
      });
      composer.commands.run("cut");
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
      if (!composer.clipboard?.length) {
        addToast?.({
          description: "Nothing to paste — copy an element first",
          tone: "info",
          duration: 3000,
        });
        return;
      }
      /* No toast here. useClipboardToasts already speaks for CLIPBOARD_PASTE,
         and a paste can now place N elements — so this entry point was showing
         a collapsed "3 elements pasted" AND a plain "Pasted" on top of it. The
         hook's own header records that two toasts for one paste was the
         original bug. */
      composer.commands.run("paste");
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
    /* G2-051 (CI-13): the engine's delete — the WHOLE selection when the
       clicked element is part of it, one transaction, and decision #17's
       confirm for N > 1. It removed only the clicked element and raised its
       own toast; useHistoryFeedback now raises the one "… deleted" + Undo for
       every delete door, in one tone. */
    handler: ({ composer }) => {
      composer.commands.run("delete");
    },
  },
];
