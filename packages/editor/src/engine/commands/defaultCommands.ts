/**
 * Default Commands
 * All built-in editor commands registered at startup
 *
 * @module engine/commands/defaultCommands
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../shared/constants";
import type { CommandData, ElementType } from "../../shared/types";
/* Explicit: without it `Element` in this file resolves to the DOM one. */
import type { Element } from "../elements/Element";
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
/**
 * Drop any element whose ancestor is also selected.
 *
 * A multi-selection can hold a parent AND something inside it — SelectionManager
 * does not prune — and `serializeElement` snapshots a whole subtree. Copying
 * both put that child on the clipboard twice, once nested inside its parent's
 * snapshot and once standalone, so pasting produced a duplicate nobody asked
 * for. Found by codex reviewing the multi-selection fix.
 */
function topMost(elements: Element[]): Element[] {
  const set = new Set(elements);
  return elements.filter((el) => {
    for (let p = el.getParent?.(); p; p = p.getParent?.()) {
      if (set.has(p)) return false;
    }
    return true;
  });
}

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
      /* "Delete element", not "Delete" — the keyboard cheat sheet already calls
         the Del key that (KeyboardCheatSheet.tsx:74), and the palette's own
         hardcoded row used the same phrase before it was removed as a
         duplicate. A bare "Delete" beside page and site actions says nothing
         about what it deletes. */
      label: "Delete element",
      shortcut: "delete",
      shortcuts: ["delete", "backspace"],
      run: (c) => {
        /* Was `getSelected()` — one element out of a multi-selection, and no
           transaction, so undoing a three-element delete took three presses.
           Same defect cut carried; measured live at 49 -> 48 on a
           three-selection. */
        /* Pruned like cut: removing a parent already removes its children and
           the descendant's own removeElement then no-ops, but the history
           label would still count it. */
        const selected = topMost(c.selection.getAllSelected());
        if (selected.length === 0) return;
        c.beginTransaction("delete");
        for (const el of selected) c.elements.removeElement(el.getId());
        c.endTransaction();
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
        const selected = topMost(c.selection.getAllSelected());
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
        const selected = topMost(c.selection.getAllSelected());
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
        /* Resolve every landing place BEFORE opening a transaction, for two
           reasons codex found in review:

           · the sibling offset is per PARENT, not global. It used to increment
             on every paste including ones appended INSIDE the selected
             container, which consume no slot in the parent — so a clipboard of
             [heading, section] pasted onto a selected container put the heading
             inside it and then inserted the section one sibling too far down.
           · nothing should open a transaction it cannot fill. An item with no
             legal target is skipped; if none can land, no transaction is opened
             at all, which is what the single-item version always did.

           A mixed clipboard still pastes the part that fits rather than
           refusing wholesale, and the toast counts what actually landed. */
        const usedSlots = new Map<Element, number>();
        const plan: { data: (typeof items)[number]; target: Element; index?: number }[] = [];
        for (const data of items) {
          const pastedType = data.type as ElementType;
          let target: Element | null = root ?? null;
          let index: number | undefined;
          if (selected) {
            if (canNestElement(pastedType, selected.getType() as ElementType)) {
              target = selected;
            } else {
              const parent = selected.getParent();
              if (parent && canNestElement(pastedType, parent.getType() as ElementType)) {
                target = parent;
                const used = usedSlots.get(parent) ?? 0;
                index = parent.getChildren().indexOf(selected) + 1 + used;
                usedSlots.set(parent, used + 1);
              }
              /* No else. When neither the selection nor its parent can hold the
                 item, `target` stays the page root — that fallback is the
                 contract ("falls back to the page root when the parent cannot
                 hold it either") and rewriting this loop briefly dropped it.
                 An item is unplaceable only when there is no page at all. */
            }
          }
          if (!target) continue;
          plan.push({ data, target, index });
        }
        if (plan.length === 0) return;

        c.beginTransaction("paste");
        for (const step of plan) {
          /* `pasteElement` announces CLIPBOARD_PASTE itself, with the element,
             target and index. Emitting a second, thinner one here gave every
             paste two "Element pasted" toasts — and one paste can place N
             elements, which useClipboardToasts coalesces. */
          c.elements.pasteElement(step.data, step.target, step.index);
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
      /* Selected the page ROOT — one container — which is not what Select All
         means in any editor, and is not what the OTHER Select All in this app
         did: the canvas palette's row calls selection.selectAll(), which takes
         every element (measured live: 1 against 47, on the same page). Two rows
         with the same name and the same ⌘A badge, doing different things.

         The consequences of the root version were quiet rather than loud:
         ⌘A then Delete did NOTHING (removeElement refuses the page root by
         design), and ⌘A then Copy put the entire page on the clipboard.

         selection.selectAll() is the honest one and is what this uses now.
         copy/cut/delete prune to top-most elements, so acting on it behaves the
         way it reads. */
      run: (c) => c.selection.selectAll(),
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
