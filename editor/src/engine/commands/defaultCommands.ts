/**
 * Default Commands
 * All built-in editor commands registered at startup
 *
 * @module engine/commands/defaultCommands
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../shared/constants";
import type { CommandData } from "../../shared/types";
import type { Composer } from "../Composer";
import { nudgeSelected, reorderElement } from "./commandOperations";

/**
 * Build the full list of default commands.
 * Each entry is a CommandData ready for registration.
 *
 * @param composer - reference to the Composer, needed by UI-toggle commands
 *                   that emit events directly on the composer instance.
 */
export function buildDefaultCommands(composer: Composer): CommandData[] {
  const nudgeAmount = 1; // pixels for normal nudge
  const nudgeAmountLarge = 10; // pixels for shift+arrow

  return [
    // ============================================
    // Clipboard & History
    // ============================================
    {
      id: "undo",
      label: "Undo",
      shortcut: "ctrl+z",
      run: (c) => c.history.undo(),
    },
    {
      id: "redo",
      label: "Redo",
      shortcut: "ctrl+shift+z",
      shortcuts: ["ctrl+shift+z", "ctrl+y"],
      run: (c) => c.history.redo(),
    },
    {
      id: "save",
      label: "Save",
      shortcut: "ctrl+s",
      run: (c) => c.saveProject(),
    },
    {
      id: "delete",
      label: "Delete",
      shortcut: "delete",
      shortcuts: ["delete", "backspace"],
      run: (c) => {
        const selected = c.selection.getSelected();
        if (selected) {
          c.elements.removeElement(selected.getId());
        }
      },
    },
    {
      id: "duplicate",
      label: "Duplicate",
      shortcut: "ctrl+d",
      run: (c) => {
        const selected = c.selection.getSelected();
        if (selected) {
          c.beginTransaction("duplicate");
          c.elements.duplicateElement(selected.getId());
          c.endTransaction();
        }
      },
    },
    {
      id: "copy",
      label: "Copy",
      shortcut: "ctrl+c",
      run: (c) => {
        const selected = c.selection.getSelected();
        if (selected) {
          c.clipboard = c.elements.serializeElement(selected.getId());
          c.emit(EVENTS.CLIPBOARD_COPY, { elementId: selected.getId() });
        }
      },
    },
    {
      id: "cut",
      label: "Cut",
      shortcut: "ctrl+x",
      run: (c) => {
        const selected = c.selection.getSelected();
        if (selected) {
          c.clipboard = c.elements.serializeElement(selected.getId());
          c.beginTransaction("cut");
          c.elements.removeElement(selected.getId());
          c.endTransaction();
          c.emit(EVENTS.CLIPBOARD_CUT, { elementId: selected.getId() });
        }
      },
    },
    {
      id: "paste",
      label: "Paste",
      shortcut: "ctrl+v",
      run: (c) => {
        if (!c.clipboard) return;
        const selected = c.selection.getSelected();
        const page = c.elements.getActivePage();
        const targetId = selected?.getId() || page?.root.id;
        if (!targetId) return;

        const target = c.elements.getElement(targetId);
        if (!target) return;

        c.beginTransaction("paste");
        c.elements.pasteElement(c.clipboard, target);
        c.endTransaction();
        c.emit("clipboard:paste", { targetId });
      },
    },

    // ============================================
    // Arrow Key Nudging
    // ============================================
    {
      id: "nudge-up",
      label: "Nudge Up",
      shortcut: "arrowup",
      run: (c) => nudgeSelected(c, 0, -nudgeAmount),
    },
    {
      id: "nudge-down",
      label: "Nudge Down",
      shortcut: "arrowdown",
      run: (c) => nudgeSelected(c, 0, nudgeAmount),
    },
    {
      id: "nudge-left",
      label: "Nudge Left",
      shortcut: "arrowleft",
      run: (c) => nudgeSelected(c, -nudgeAmount, 0),
    },
    {
      id: "nudge-right",
      label: "Nudge Right",
      shortcut: "arrowright",
      run: (c) => nudgeSelected(c, nudgeAmount, 0),
    },
    {
      id: "nudge-up-large",
      label: "Nudge Up (10px)",
      shortcut: "shift+arrowup",
      run: (c) => nudgeSelected(c, 0, -nudgeAmountLarge),
    },
    {
      id: "nudge-down-large",
      label: "Nudge Down (10px)",
      shortcut: "shift+arrowdown",
      run: (c) => nudgeSelected(c, 0, nudgeAmountLarge),
    },
    {
      id: "nudge-left-large",
      label: "Nudge Left (10px)",
      shortcut: "shift+arrowleft",
      run: (c) => nudgeSelected(c, -nudgeAmountLarge, 0),
    },
    {
      id: "nudge-right-large",
      label: "Nudge Right (10px)",
      shortcut: "shift+arrowright",
      run: (c) => nudgeSelected(c, nudgeAmountLarge, 0),
    },

    // ============================================
    // Z-Index Reordering
    // ============================================
    {
      id: "bring-forward",
      label: "Bring Forward",
      shortcut: "ctrl+]",
      run: (c) => reorderElement(c, "forward"),
    },
    {
      id: "send-backward",
      label: "Send Backward",
      shortcut: "ctrl+[",
      run: (c) => reorderElement(c, "backward"),
    },
    {
      id: "bring-to-front",
      label: "Bring to Front",
      shortcut: "ctrl+shift+]",
      run: (c) => reorderElement(c, "front"),
    },
    {
      id: "send-to-back",
      label: "Send to Back",
      shortcut: "ctrl+shift+[",
      run: (c) => reorderElement(c, "back"),
    },

    // ============================================
    // Snap to Grid
    // ============================================
    {
      id: "toggle-snap-to-grid",
      label: "Toggle Snap to Grid",
      shortcut: "ctrl+'",
      run: (c) => {
        const current = c.getState().snapToGrid;
        c.setSnapToGrid(!current);
      },
    },

    // ============================================
    // Selection
    // ============================================
    {
      id: "select-all",
      label: "Select All",
      shortcut: "ctrl+a",
      run: (c) => {
        const page = c.elements.getActivePage();
        if (page) {
          const root = c.elements.getElement(page.root.id);
          if (root) {
            c.selection.select(root);
          }
        }
      },
    },
    {
      id: "deselect",
      label: "Deselect",
      shortcut: "escape",
      run: (c) => c.selection.clear(),
    },

    // ============================================
    // Preview & Export
    // ============================================
    {
      id: "preview",
      label: "Preview",
      shortcut: "ctrl+p",
      run: (c) => {
        const html = c.exportHTML();
        const previewWindow = window.open("", "_blank");
        if (previewWindow) {
          previewWindow.document.open();
          previewWindow.document.write(html.combined);
          previewWindow.document.close();
        }
      },
    },
    {
      id: "export-html",
      label: "Export HTML",
      run: (c) => c.exportHTML(),
    },
    {
      id: "export-json",
      label: "Export JSON",
      run: (c) => c.exportJSON(),
    },

    // ============================================
    // UI Toggles (emit events, UI listens)
    // ============================================
    {
      id: "ui-open-templates",
      label: "Open Templates",
      shortcut: "ctrl+shift+t",
      run: () => composer.emit("ui:toggle:templates"),
    },
    {
      id: "ui-open-exporter",
      label: "Open Exporter",
      shortcut: "ctrl+shift+e",
      run: () => composer.emit("ui:toggle:exporter"),
    },
    {
      id: "ui-open-ai",
      label: "Open AI Assistant",
      shortcut: "ctrl+shift+a",
      run: () => composer.emit("ui:toggle:ai"),
    },
    {
      id: "ui-toggle-component-view",
      label: "Toggle Component View",
      shortcut: "ctrl+shift+c",
      run: () => composer.emit("ui:toggle:component-view"),
    },

    // ============================================
    // Zoom
    // ============================================
    {
      id: "zoom-in",
      label: "Zoom In",
      shortcut: "ctrl+=",
      run: (c) => {
        const current = c.getState().zoom;
        c.setZoom(current + 10);
      },
    },
    {
      id: "zoom-out",
      label: "Zoom Out",
      shortcut: "ctrl+-",
      run: (c) => {
        const current = c.getState().zoom;
        c.setZoom(current - 10);
      },
    },
    {
      id: "zoom-reset",
      label: "Reset Zoom",
      shortcut: "ctrl+0",
      run: (c) => c.setZoom(100),
    },

    // ============================================
    // Device Presets
    // ============================================
    {
      id: "device-desktop",
      label: "Desktop View",
      shortcut: "ctrl+1",
      run: (c) => c.setDevice("desktop"),
    },
    {
      id: "device-tablet",
      label: "Tablet View",
      shortcut: "ctrl+2",
      run: (c) => c.setDevice("tablet"),
    },
    {
      id: "device-mobile",
      label: "Mobile View",
      shortcut: "ctrl+3",
      run: (c) => c.setDevice("mobile"),
    },
    {
      id: "device-watch",
      label: "Watch View",
      shortcut: "ctrl+4",
      run: (c) => c.setDevice("watch"),
    },
  ];
}
