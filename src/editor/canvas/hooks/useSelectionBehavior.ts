/**
 * useSelectionBehavior Hook
 * Consolidated selection behavior for Canvas
 *
 * Features:
 * - Single selection (click)
 * - Additive selection (Shift+click)
 * - Click-through cycling (Cmd/Ctrl+click)
 * - Double-click: Select first child of container
 * - Triple-click: Deep select (innermost element)
 * - Hitbox expansion for small elements
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer, Element } from "../../../engine";
import { useToast } from "../../../shared/ui/Toast";
import { getElementId } from "../../../shared/utils/dragDrop";
import { buildElementStack, findElementWithHitExpansion } from "../shared/hitTesting";

/** Distance threshold for "same click position" detection */
const SAME_POSITION_THRESHOLD = 5;

/** Maximum time between clicks to count as double/triple click (ms) */
const MULTI_CLICK_THRESHOLD = 400;

interface UseSelectionBehaviorOptions {
  composer: Composer | null;
  isEditing: boolean;
  onContextMenuClose: () => void;
}

interface SelectionBehaviorResult {
  handleClick: (e: React.MouseEvent) => void;
  clickThroughStack: string[];
  clickThroughIndex: number;
  resetClickThrough: () => void;
}

/**
 * Custom hook for selection behavior
 */
export function useSelectionBehavior({
  composer,
  isEditing,
  onContextMenuClose,
}: UseSelectionBehaviorOptions): SelectionBehaviorResult {
  const { addToast } = useToast();

  // Click-through selection state
  const [clickThroughStack, setClickThroughStack] = React.useState<string[]>([]);
  const [clickThroughIndex, setClickThroughIndex] = React.useState(0);
  const lastClickPosition = React.useRef<{ x: number; y: number } | null>(null);

  // Multi-click tracking
  const lastClickTime = React.useRef<number>(0);
  const clickCount = React.useRef<number>(0);

  const resetClickThrough = React.useCallback(() => {
    setClickThroughStack([]);
    setClickThroughIndex(0);
    lastClickPosition.current = null;
  }, []);

  const isSamePosition = React.useCallback((x: number, y: number): boolean => {
    if (!lastClickPosition.current) return false;
    return (
      Math.abs(lastClickPosition.current.x - x) < SAME_POSITION_THRESHOLD &&
      Math.abs(lastClickPosition.current.y - y) < SAME_POSITION_THRESHOLD
    );
  }, []);

  /** Handle click-through selection (Cmd/Ctrl + Click) */
  const handleClickThrough = React.useCallback(
    (x: number, y: number) => {
      if (!composer) return;

      if (!isSamePosition(x, y)) {
        const stack = buildElementStack(x, y);
        setClickThroughStack(stack);
        setClickThroughIndex(0);
        lastClickPosition.current = { x, y };

        if (stack.length > 0) {
          const element = composer.elements.getElement(stack[0]);
          if (element) {
            if (element.isLocked()) {
              addToast({
                message: "This element is locked. Unlock it in the Layers panel.",
                variant: "info",
                duration: 2500,
              });
              return;
            }
            composer.selection.select(element);
          }
        }
      } else {
        const nextIndex = (clickThroughIndex + 1) % clickThroughStack.length;
        setClickThroughIndex(nextIndex);
        const nextId = clickThroughStack[nextIndex];
        if (nextId) {
          const element = composer.elements.getElement(nextId);
          if (element) {
            if (element.isLocked()) {
              addToast({
                message: "This element is locked. Unlock it in the Layers panel.",
                variant: "info",
                duration: 2500,
              });
            } else {
              composer.selection.select(element);
            }
          }
        }
      }
    },
    [composer, isSamePosition, clickThroughIndex, clickThroughStack, addToast]
  );

  /** Handle normal selection (single or additive) */
  const handleNormalSelection = React.useCallback(
    (target: HTMLElement, x: number, y: number, isAdditive: boolean) => {
      if (!composer) return;

      const editableEl = findElementWithHitExpansion(target, x, y);

      if (editableEl) {
        const id = getElementId(editableEl);
        if (id) {
          const element = composer.elements.getElement(id);
          if (element) {
            if (element.isLocked()) {
              addToast({
                message: "This element is locked. Unlock it in the Layers panel.",
                variant: "info",
                duration: 2500,
              });
              return;
            }
            if (isAdditive) {
              composer.selection.addToSelection(element);
            } else {
              composer.selection.select(element);
            }
            return;
          }
        }
      }

      composer.selection.clear();
      resetClickThrough();
    },
    [composer, resetClickThrough, addToast]
  );

  /** Handle double-click: Select first child of container */
  const handleDoubleClick = React.useCallback(
    (x: number, y: number) => {
      if (!composer) return;

      const selected = composer.selection.getAllSelected();
      if (selected.length !== 1) return;

      const currentElement = selected[0];
      const children = currentElement.getChildren();

      if (children.length > 0) {
        const stack = buildElementStack(x, y);
        const childAtPosition = children.find((child: Element) => stack.includes(child.getId()));

        if (childAtPosition) {
          composer.selection.select(childAtPosition);
        } else {
          composer.selection.select(children[0]);
        }
      }
    },
    [composer]
  );

  /** Handle triple-click: Deep select innermost element */
  const handleTripleClick = React.useCallback(
    (x: number, y: number) => {
      if (!composer) return;

      const stack = buildElementStack(x, y);
      if (stack.length === 0) return;

      const innermostId = stack[0];
      const innermost = composer.elements.getElement(innermostId);
      if (innermost) composer.selection.select(innermost);
    },
    [composer]
  );

  /** Calculate click count for multi-click detection */
  const calculateClickCount = React.useCallback(
    (x: number, y: number): number => {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTime.current;
      const samePosition = isSamePosition(x, y);

      if (timeSinceLastClick < MULTI_CLICK_THRESHOLD && samePosition) {
        clickCount.current = Math.min(clickCount.current + 1, 3);
      } else {
        clickCount.current = 1;
      }

      lastClickTime.current = now;
      lastClickPosition.current = { x, y };

      return clickCount.current;
    },
    [isSamePosition]
  );

  /** Main click handler */
  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (isEditing) return;

      const target = e.target as HTMLElement;

      // Ignore clicks on toolbar/control elements
      if (
        target.closest(
          ".aqb-quick-actions, .aqb-unified-toolbar, .aqb-selection-label, " +
            ".aqb-canvas-breadcrumb, .aqb-alignment-toolbar, .aqb-floating-helper, " +
            ".aqb-inspector-toggle, .aqb-command-palette"
        )
      ) {
        return;
      }

      onContextMenuClose();

      const clickX = e.clientX;
      const clickY = e.clientY;
      const isClickThrough = e.metaKey || e.ctrlKey;
      const isAdditive = e.shiftKey;
      const clicks = calculateClickCount(clickX, clickY);

      if (isClickThrough) {
        handleClickThrough(clickX, clickY);
      } else if (clicks === 3) {
        handleTripleClick(clickX, clickY);
      } else if (clicks === 2) {
        handleDoubleClick(clickX, clickY);
      } else {
        handleNormalSelection(target, clickX, clickY, isAdditive);
      }
    },
    [
      isEditing,
      onContextMenuClose,
      calculateClickCount,
      handleClickThrough,
      handleDoubleClick,
      handleTripleClick,
      handleNormalSelection,
    ]
  );

  return { handleClick, clickThroughStack, clickThroughIndex, resetClickThrough };
}

export default useSelectionBehavior;
