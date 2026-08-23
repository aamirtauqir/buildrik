/**
 * Default Commands
 * All built-in editor commands registered at startup
 *
 * @module engine/commands/defaultCommands
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../shared/constants";
import type { CommandData, ElementType } from "../../shared/types";
import { canNestElement } from "../../shared/utils/nesting";
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
    /* No key bindings on undo/redo/preview. `useEditorShortcuts` binds the
       same three chords in the shell, and BOTH ran: measured in the editor,
       one ⌘Z fired two `history:undo` events and threw away two steps (the
       text edit AND the element that was edited), ⇧⌘Z redid two, and ⌘P both
       opened a popup window of the export AND toggled the in-editor preview.
       The chords the product prints — the ⌘K palette and the shortcuts panel
       both carry them — belong to one owner; these stay in the registry so the
       palette can still run them by name. */
    {
      id: "undo",
      label: "Undo",
      run: (c) => c.history.undo(),
    },
    {
      id: "redo",
      label: "Redo",
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
      id: "group",
      label: "Group",
      shortcut: "ctrl+g",
      run: (c) => {
        const ids = c.selection.getSelectedIds();
        if (ids.length < 2) return;
        c.beginTransaction("group-elements");
        const group = c.elements.groupElements(ids);
        c.endTransaction();
        if (group) c.selection.select(group);
      },
    },
    {
      id: "ungroup",
      label: "Ungroup",
      shortcut: "ctrl+shift+g",
      run: (c) => {
        const selected = c.selection.getSelected();
        if (!selected || selected.getType() !== "container") return;
        c.beginTransaction("ungroup-elements");
        c.elements.ungroupElement(selected.getId());
        c.endTransaction();
        c.selection.clear();
      },
    },
    {
      id: "duplicate",
      label: "Duplicate",
      shortcut: "ctrl+d",
      run: (c) => {
        const ids = c.selection.getSelectedIds();
        if (ids.length === 0) return;
        c.beginTransaction("duplicate");
        const clones = ids
          .map((id) => c.elements.duplicateElement(id))
          .filter((el): el is NonNullable<typeof el> => Boolean(el));
        c.endTransaction();
        // Re-select the duplicates so the next action targets them.
        if (clones.length === 1) c.selection.select(clones[0]);
        else if (clones.length > 1) c.selection.selectMultiple(clones);
      },
    },
    /* `getAllSelected()`, not `getSelected()`. Both of these read the PRIMARY
       element until 2026-08-23, so with three elements selected Copy put one on
       the clipboard and Cut removed one and left two standing — measured live,
       49 -> 48 on a three-selection, with nothing on screen saying so. Cut is
       the bad one: it is a destructive command that silently did a third of
       what it was asked.

       `select()` clears multiSelected and re-adds the single element
       (SelectionManager.ts:35-38), so getAllSelected() covers the one-element
       case too and there is no branch here. */
    {
      id: "copy",
      label: "Copy",
      shortcut: "ctrl+c",
      run: (c) => {
        const selected = c.selection.getAllSelected();
        if (selected.length === 0) return;
        /* serializeElement returns null for an element it cannot serialise;
           a clipboard slot holding null would paste nothing and count as one. */
        c.clipboard = selected
          .map((el) => c.elements.serializeElement(el.getId()))
          .filter((d): d is NonNullable<typeof d> => d !== null);
        c.emit(EVENTS.CLIPBOARD_COPY, { elementIds: selected.map((el) => el.getId()) });
      },
    },
    {
      id: "cut",
      label: "Cut",
      shortcut: "ctrl+x",
      run: (c) => {
        const selected = c.selection.getAllSelected();
        if (selected.length === 0) return;
        const ids = selected.map((el) => el.getId());
        c.clipboard = ids
          .map((id) => c.elements.serializeElement(id))
          .filter((d): d is NonNullable<typeof d> => d !== null);
        /* One transaction for the whole cut: undo has to put all of them back
           together, not one press per element. */
        c.beginTransaction("cut");
        for (const id of ids) c.elements.removeElement(id);
        c.endTransaction();
        c.emit(EVENTS.CLIPBOARD_CUT, { elementIds: ids });
      },
    },
    {
      id: "paste",
      label: "Paste",
      shortcut: "ctrl+v",
      run: (c) => {
        const items = c.clipboard;
        if (!items || items.length === 0) return;
        const selected = c.selection.getSelected();
        const page = c.elements.getActivePage();
        const root = page ? c.elements.getElement(page.root.id) : null;

        /* Paste where the copy can actually live. The target used to be
           whatever was selected, with no nesting check — so copying a heading
           and pasting with that heading still selected put the copy INSIDE the
           heading, which the rules forbid outright ("heading" is in a
           heading's forbiddenChildren). Measured live: the heading went from 0
           children to 1 and the copy was swallowed. Selecting a container
           still means "paste in here".

           The loop is per item because the target depends on the item's TYPE —
           a clipboard holding a heading and a container can legally land in
           different places. `placed` shifts each insert one slot further along,
           or every item resolves to the same index and they arrive reversed. */
        c.beginTransaction("paste");
        let placed = 0;
        for (const data of items) {
          const pastedType = data.type as ElementType;
          let target = root;
          let index: number | undefined;
          if (selected) {
            if (canNestElement(pastedType, selected.getType() as ElementType)) {
              target = selected;
            } else {
              const parent = selected.getParent();
              if (parent && canNestElement(pastedType, parent.getType() as ElementType)) {
                target = parent;
                index = parent.getChildren().indexOf(selected) + 1 + placed;
              }
            }
          }
          if (!target) continue;
          /* `pasteElement` announces CLIPBOARD_PASTE itself, with the element,
             target and index. Emitting a second, thinner one here gave every
             paste two "Element pasted" toasts — and now that one paste can
             place N elements it fires N times, which useClipboardToasts
             coalesces rather than stacking N toasts. */
          c.elements.pasteElement(data, target, index);
          placed += 1;
        }
        c.endTransaction();
      },
    },

    // ============================================
    // Arrow Key Nudging
    // ============================================
    /* The arrow keys are the CANVAS's, per the cheat sheet: bare arrows select
       (previous sibling / next sibling / parent / first child), ⇧ moves 10px,
       ⌘ moves 1px, ⌥ reorders. `useCanvasKeyboard` implements all four. These
       commands kept their own bare-arrow and ⇧-arrow bindings, and this
       listener is capture-phase on window, so both ran: ⇧-arrow moved 20px,
       and a bare arrow nudged the element 1px instead of moving the selection
       — measured live. The commands stay for the palette; the keys do not. */
    {
      id: "nudge-up",
      label: "Nudge Up",
      run: (c) => nudgeSelected(c, 0, -nudgeAmount),
    },
    {
      id: "nudge-down",
      label: "Nudge Down",
      run: (c) => nudgeSelected(c, 0, nudgeAmount),
    },
    {
      id: "nudge-left",
      label: "Nudge Left",
      run: (c) => nudgeSelected(c, -nudgeAmount, 0),
    },
    {
      id: "nudge-right",
      label: "Nudge Right",
      run: (c) => nudgeSelected(c, nudgeAmount, 0),
    },
    {
      id: "nudge-up-large",
      label: "Nudge Up (10px)",
      run: (c) => nudgeSelected(c, 0, -nudgeAmountLarge),
    },
    {
      id: "nudge-down-large",
      label: "Nudge Down (10px)",
      run: (c) => nudgeSelected(c, 0, nudgeAmountLarge),
    },
    {
      id: "nudge-left-large",
      label: "Nudge Left (10px)",
      run: (c) => nudgeSelected(c, -nudgeAmountLarge, 0),
    },
    {
      id: "nudge-right-large",
      label: "Nudge Right (10px)",
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
    /* No chord. ⌘' is printed on the canvas overlay bar for the Grid overlay
       and bound there; both listeners sit on window and both used to run, so
       one press toggled the overlay AND flipped this setting — which resize
       reads, and which nothing on screen shows changing. Same tie-break as
       ⌘1–⌘4 below: the printed chord wins, the command keeps its palette row. */
    {
      id: "toggle-snap-to-grid",
      label: "Toggle Snap to Grid",
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
      run: () => composer.emit(EVENTS.UI_TOGGLE_TEMPLATES),
    },
    {
      id: "ui-open-exporter",
      label: "Open Exporter",
      shortcut: "ctrl+shift+e",
      run: () => composer.emit(EVENTS.UI_TOGGLE_EXPORTER),
    },
    {
      id: "ui-open-ai",
      label: "Open AI Assistant",
      shortcut: "ctrl+shift+a",
      run: () => composer.emit(EVENTS.UI_TOGGLE_AI),
    },
    {
      id: "ui-toggle-component-view",
      label: "Toggle Component View",
      shortcut: "ctrl+shift+c",
      run: () => composer.emit(EVENTS.UI_TOGGLE_COMPONENT_VIEW),
    },

    // ============================================
    // Zoom
    // ============================================
    /* Also chordless, for the same reason and with a visible symptom: ⌘= and
       ⌘- are printed beside the zoom flyout's + and − buttons, which step
       through ZOOM_PRESETS, while these step by 10. Measured at 100%: the
       button gave 150, the chord gave 110. CanvasFooterToolbar owns all five
       of the flyout's printed rows (fit, selection, 100%, in, out). */
    {
      id: "zoom-in",
      label: "Zoom In",
      run: (c) => {
        const current = c.getState().zoom;
        c.setZoom(current + 10);
      },
    },
    {
      id: "zoom-out",
      label: "Zoom Out",
      run: (c) => {
        const current = c.getState().zoom;
        c.setZoom(current - 10);
      },
    },
    {
      id: "zoom-reset",
      label: "Reset Zoom",
      run: (c) => c.setZoom(100),
    },

    // ============================================
    // Device Presets
    // ============================================
    /* No shortcuts on these four. ⌘1–⌘4 collided with the canvas zoom
       flyout, which board 817:4723 PRINTS as fit / zoom-to-selection / 100% /
       in / out — and both handlers ran: measured in the editor, ⌘2 zoomed to
       the selection AND switched the canvas to tablet, so the next style edit
       would have landed on the tablet breakpoint instead of desktop. The
       printed chord wins; the device commands stay reachable by name in the
       palette, which is where they are actually discovered. */
    {
      id: "device-desktop",
      label: "Desktop View",
      run: (c) => c.setDevice("desktop"),
    },
    {
      id: "device-tablet",
      label: "Tablet View",
      run: (c) => c.setDevice("tablet"),
    },
    {
      id: "device-mobile",
      label: "Mobile View",
      run: (c) => c.setDevice("mobile"),
    },
    {
      id: "device-watch",
      label: "Watch View",
      run: (c) => c.setDevice("watch"),
    },
  ];
}
