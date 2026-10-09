/**
 * Canvas Keyboard Hook — WCAG 2.1 AA keyboard navigation for canvas elements.
 * Keys: Tab/Shift+Tab (cycle) | Arrows (navigate) | Alt+Arrows (reorder)
 * Ctrl+Arrow (move 1px) | Shift+Arrow (10px) | Del (delete) | Esc (clear)
 * Ctrl+D (duplicate) | Ctrl+A (select all) | Shift+F10 (context menu)
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ToastActionPayload, ToastTone } from "@/editor/chrome-ui";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import { devLogger } from "@/shared/utils/devLogger";
import {
  getNavigationTargets,
  getAllNavigableElements,
  moveElementPosition,
  reorderElement,
} from "./keyboard/keyboardHelpers";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UseCanvasKeyboardOptions {
  composer: Composer | null;
  selectedId: string | null;
  selectedIds?: string[]; // ADD: full multi-select set
  editingId: string | null;
  select: (elementOrId: Element | string | null) => void;
  clear: () => void;
  syncFromComposer: () => void;
  onOpenContextMenu?: (elementId: string, position: { x: number; y: number }) => void;
  /** Toast function for showing undo notifications */
  addToast?: (toast: {
    description: string;
    tone?: ToastTone;
    duration?: number;
    action?: ToastActionPayload;
  }) => void;
}

export interface UseCanvasKeyboardResult {
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook for handling keyboard navigation and shortcuts on the canvas.
 * Pure helper functions are in ./keyboard/keyboardHelpers.ts.
 */
/** A held arrow repeats every ~30 ms; a gap this long is a new press. */
const REFUSED_NUDGE_MS = 1500;

export function useCanvasKeyboard({
  composer,
  selectedId,
  selectedIds = [],
  editingId,
  select,
  clear,
  syncFromComposer,
  onOpenContextMenu,
  addToast,
}: UseCanvasKeyboardOptions): UseCanvasKeyboardResult {
  const refusedNudgeFor = React.useRef<{ id: string; at: number } | null>(null);
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!composer || editingId) return;
      if ((e.target as HTMLElement)?.closest("input, textarea, [contenteditable]")) return;

      /* The command registry listens capture-phase on window and calls
         preventDefault() on anything it owns, which means it has already RUN by
         the time this handler sees the event. Both firing is how ⌘D produced
         two copies and ⌘V pasted twice — measured live: one heading became
         three. Anything the registry claimed is done; this handler covers what
         it does not own (the ⌥ variants, arrows, Home/End). */
      if (e.defaultPrevented) return;

      // Ctrl+A: Select All elements
      if ((e.key === "a" || e.key === "A") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        devLogger.keyboard("select-all");
        composer.selection.selectAll();
        return;
      }

      // Tab: Cycle through ALL elements (root excluded — cannot be moved/edited)
      if (e.key === "Tab") {
        e.preventDefault();
        const tabRootId = composer.elements.getActivePage()?.root?.id ?? null;
        const allElements = getAllNavigableElements(composer, tabRootId);
        if (allElements.length === 0) return;

        const currentIndex = selectedId
          ? allElements.findIndex((el) => el.getId() === selectedId)
          : -1;

        let nextIndex: number;
        if (e.shiftKey) {
          nextIndex = currentIndex <= 0 ? allElements.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex >= allElements.length - 1 ? 0 : currentIndex + 1;
        }

        select(allElements[nextIndex]);
        return;
      }

      // Shift+F10: Open context menu (standard accessibility shortcut)
      if (e.key === "F10" && e.shiftKey && selectedId) {
        e.preventDefault();
        const element = document.querySelector(`[data-buildrick-id="${selectedId}"]`);
        if (element && onOpenContextMenu) {
          const rect = element.getBoundingClientRect();
          onOpenContextMenu(selectedId, {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          });
        }
        return;
      }

      /* Delete/Backspace run the ONE delete command, the same one the global
         keybinding and ⌘K run. This handler used to carry its own copy: a
         multi-delete that filtered locked ids but removed their unlocked
         ancestors whole — ⌘A + Delete took a locked image with its section
         (A-5, walked live: 11 → 3) — skipped the multi-delete confirm
         (decision #17), a single delete with no lock check at all, and two
         toasts whose Undo reverted whatever was newest. The command owns the
         lock/instance guard and the confirm; useHistoryFeedback owns the
         toast. What stays here is the focus hand-off after a single delete. */
      if (e.key === "Delete" || e.key === "Backspace") {
        const single = selectedIds.length <= 1 && selectedId ? composer.elements.getElement(selectedId) : null;
        if (selectedIds.length <= 1 && (!single || composer.elements.getActivePage()?.root?.id === selectedId)) return;
        e.preventDefault();
        e.stopPropagation();
        devLogger.keyboard("delete", { count: Math.max(selectedIds.length, 1) });

        const targets = single ? getNavigationTargets(single) : null;
        composer.commands.run("delete");
        if (single && targets && !composer.elements.getElement(single.getId())) {
          const nextFocus = targets.next || targets.prev || targets.parent;
          if (nextFocus) select(nextFocus);
          else clear();
        }
        syncFromComposer();
        return;
      }

      if (!selectedId) return;

      const element = composer.elements.getElement(selectedId);
      if (!element) return;

      const page = composer.elements.getActivePage();
      const isRoot = page?.root?.id === selectedId;
      const { prev, next, parent, firstChild } = getNavigationTargets(element);
      /* G2-047: only a positioned element nudges. An in-flow one says so, once
         per element — holding the key would otherwise stack a toast per repeat. */
      const nudge = (dx: number, dy: number) => {
        if (moveElementPosition(composer, selectedId, dx, dy)) return;
        /* Once per burst of key repeats, not once per element forever — ⇧→
           then ⌘→ on the same element left the second silent (L1-038). */
        const now = Date.now();
        const last = refusedNudgeFor.current;
        refusedNudgeFor.current = { id: selectedId, at: now };
        if (last?.id === selectedId && now - last.at < REFUSED_NUDGE_MS) return;
        addToast?.({
          description: "This element sits in the page flow. Set Position to move it with the arrow keys.",
          tone: "info",
        });
      };

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          devLogger.keyboard("escape");
          clear();
          break;

        case "ArrowUp":
          e.preventDefault();
          if ((e.metaKey || e.ctrlKey) && !e.altKey && !isRoot) {
            nudge(0, -1);
          } else if (e.shiftKey && !e.altKey && !isRoot) {
            nudge(0, -10);
          } else if (e.altKey && !isRoot) {
            reorderElement(element, composer, selectedId, "up");
          } else if (prev) {
            select(prev);
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          if ((e.metaKey || e.ctrlKey) && !e.altKey && !isRoot) {
            nudge(0, 1);
          } else if (e.shiftKey && !e.altKey && !isRoot) {
            nudge(0, 10);
          } else if (e.altKey && !isRoot) {
            reorderElement(element, composer, selectedId, "down");
          } else if (next) {
            select(next);
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if ((e.metaKey || e.ctrlKey) && !e.altKey && !isRoot) {
            nudge(-1, 0);
          } else if (e.shiftKey && !e.altKey && !isRoot) {
            nudge(-10, 0);
          } else if (parent) {
            select(parent);
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if ((e.metaKey || e.ctrlKey) && !e.altKey && !isRoot) {
            nudge(1, 0);
          } else if (e.shiftKey && !e.altKey && !isRoot) {
            nudge(10, 0);
          } else if (firstChild) {
            select(firstChild);
          }
          break;

        case "Home":
          e.preventDefault();
          if (e.altKey && !isRoot) {
            reorderElement(element, composer, selectedId, "first");
          } else if (parent) {
            const siblings = parent.getChildren?.() || [];
            if (siblings.length > 0) {
              select(siblings[0]);
            }
          }
          break;

        case "End":
          e.preventDefault();
          if (e.altKey && !isRoot) {
            reorderElement(element, composer, selectedId, "last");
          } else if (parent) {
            const siblings = parent.getChildren?.() || [];
            if (siblings.length > 0) {
              select(siblings[siblings.length - 1]);
            }
          }
          break;

        /* ⌘D, ⌘C, ⌘V and ⌘X belong to the command registry, which owns them
           window-wide with its own carve-outs for text entry and modals — see
           CommandCenter.shouldHandleShortcut. This hook used to implement them
           a second time; the toasts they carried now come from
           `useClipboardToasts`, which listens to the events those commands
           emit, so they fire wherever the shortcut is pressed rather than only
           over the canvas. */

        /* ⌥⌘C / ⌥⌘V are the `copy-style` / `paste-style` commands now — the
           same handlers the Inspector ⋯ and the canvas menu run
           (editor/shared/elementActions.ts); their toasts come from
           useClipboardToasts. */

      }
    },
    [
      composer,
      selectedId,
      selectedIds,
      editingId,
      select,
      clear,
      syncFromComposer,
      onOpenContextMenu,
      addToast,
    ]
  );

  return { handleKeyDown };
}

export default useCanvasKeyboard;
