/**
 * Keyboard Move Hook
 * Handles keyboard-based element movement and reordering
 *
 * Features:
 * - Arrow key movement for selected elements
 * - Up/Down: Reorder within siblings (vertical position in tree)
 * - Left/Right: Change nesting level (move to parent/into sibling)
 * - Modifier keys for different step sizes (Shift=10px, Ctrl=50px)
 *
 * @module components/Canvas/hooks/drag/useKeyboardMove
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type { ElementType, GrapesElement } from "../../../../shared/types";
import { canNestElement } from "../../../../shared/utils/nesting";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Keyboard movement step sizes */
const KEYBOARD_MOVE_CONFIG = {
  NORMAL_STEP: 1, // Pixels to move normally
  SHIFT_STEP: 10, // Pixels to move with Shift held
  CTRL_STEP: 50, // Pixels to move with Ctrl held
};

// =============================================================================
// TYPES
// =============================================================================

export interface UseKeyboardMoveOptions {
  composer: Composer | null;
  /** Ref to current root element ID (to prevent moving root) */
  rootIdRef: React.MutableRefObject<string | null>;
}

export interface UseKeyboardMoveResult {
  /** Current step configuration (for UI display) */
  stepConfig: typeof KEYBOARD_MOVE_CONFIG;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for keyboard-based element movement
 * Allows arrow keys to reorder and re-parent elements
 */
export function useKeyboardMove({
  composer,
  rootIdRef,
}: UseKeyboardMoveOptions): UseKeyboardMoveResult {
  React.useEffect(() => {
    if (!composer) return;

    const handleArrowKeyMove = (e: KeyboardEvent) => {
      // Only handle arrow keys
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;

      // Get selected element
      const selectedEl = composer.selection.getSelected();
      if (!selectedEl) return;

      // Don't move if editing text
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      e.preventDefault();

      // Determine step size based on modifiers
      let step = KEYBOARD_MOVE_CONFIG.NORMAL_STEP;
      if (e.ctrlKey || e.metaKey) {
        step = KEYBOARD_MOVE_CONFIG.CTRL_STEP;
      } else if (e.shiftKey) {
        step = KEYBOARD_MOVE_CONFIG.SHIFT_STEP;
      }

      // Calculate direction
      let deltaX = 0;
      let deltaY = 0;
      switch (e.key) {
        case "ArrowUp":
          deltaY = -step;
          break;
        case "ArrowDown":
          deltaY = step;
          break;
        case "ArrowLeft":
          deltaX = -step;
          break;
        case "ArrowRight":
          deltaX = step;
          break;
      }

      // Move element using reorder (up/down = sibling order, left/right = parent/child)
      const elementId = selectedEl.getId();
      const parent = selectedEl.getParent?.();

      if (!parent) return;

      composer.beginTransaction("keyboard-move");
      let didMove = false;
      try {
        if (deltaY !== 0) {
          // Vertical: reorder within siblings
          const siblings = parent.getChildren?.() || [];
          const currentIndex = siblings.findIndex((s: GrapesElement) => s.getId() === elementId);

          if (currentIndex >= 0) {
            const newIndex =
              deltaY < 0
                ? Math.max(0, currentIndex - 1)
                : Math.min(siblings.length - 1, currentIndex + 1);

            if (newIndex !== currentIndex) {
              composer.elements.moveElement(elementId, parent.getId(), newIndex);
              didMove = true;
            }
          }
        } else if (deltaX !== 0) {
          // Horizontal: move to parent/child
          if (deltaX < 0) {
            // Move up to parent's level (become sibling of parent)
            const grandParent = parent.getParent?.();
            if (grandParent && grandParent.getId() !== rootIdRef.current) {
              const parentIndex =
                grandParent
                  .getChildren?.()
                  .findIndex((s: GrapesElement) => s.getId() === parent.getId()) ?? -1;
              if (parentIndex >= 0) {
                composer.elements.moveElement(elementId, grandParent.getId(), parentIndex + 1);
                didMove = true;
              }
            }
          } else {
            // Move into previous sibling (become child of prev sibling)
            const siblings = parent.getChildren?.() || [];
            const currentIndex = siblings.findIndex((s: GrapesElement) => s.getId() === elementId);
            if (currentIndex > 0) {
              const prevSibling = siblings[currentIndex - 1];
              const prevSiblingType = prevSibling.getType?.() as ElementType;
              const currentType = selectedEl.getType?.() as ElementType;

              // Check if can nest
              if (canNestElement(currentType, prevSiblingType)) {
                composer.elements.moveElement(elementId, prevSibling.getId());
                didMove = true;
              }
            }
          }
        }
        composer.endTransaction();

        // Post-move selection reconciliation: force re-emit selection event
        if (didMove) {
          composer.selection.reselect();
        }
      } catch {
        composer.rollbackTransaction();
      }
    };

    window.addEventListener("keydown", handleArrowKeyMove);
    return () => window.removeEventListener("keydown", handleArrowKeyMove);
  }, [composer, rootIdRef]);

  return {
    stepConfig: KEYBOARD_MOVE_CONFIG,
  };
}

export default useKeyboardMove;
