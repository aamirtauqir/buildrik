/**
 * Canvas Inline Edit Hook
 * Handles double-click text editing on elements
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { getElementId } from "../../../shared/utils/dragDrop";

export interface EditingState {
  id: string | null;
  original: string;
  rect: { top: number; left: number; width: number; height: number } | null;
}

export interface UseCanvasInlineEditOptions {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement>;
}

export interface UseCanvasInlineEditResult {
  editing: EditingState;
  handleDoubleClick: (e: React.MouseEvent) => void;
  isEditing: boolean;
}

// Inline editable tags - expanded to include table cells, quotes, and inline text
const INLINE_EDITABLE_TAGS = [
  "p",
  "span",
  "a",
  "button",
  "label",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "td",
  "th",
  "figcaption",
  "blockquote",
  "cite",
  "strong",
  "em",
  "small",
  "mark",
];

export function useCanvasInlineEdit({
  composer,
  canvasRef,
}: UseCanvasInlineEditOptions): UseCanvasInlineEditResult {
  const [editing, setEditing] = React.useState<EditingState>({
    id: null,
    original: "",
    rect: null,
  });

  // Handle double-click to start inline editing
  const handleDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (!composer) return;

      const target = e.target as HTMLElement;
      const editableEl = target.closest("[data-aqb-id]") as HTMLElement | null;
      if (!editableEl) return;

      const id = getElementId(editableEl);
      if (!id) return;

      const tagName = editableEl.tagName.toLowerCase();
      if (!INLINE_EDITABLE_TAGS.includes(tagName)) return;

      // Check if element has nested aqb elements - can't edit containers
      const hasNestedElements = editableEl.querySelector("[data-aqb-id]");
      if (hasNestedElements) {
        // Element contains children - don't enable editing on the parent
        // User should double-click directly on the text element
        return;
      }

      e.stopPropagation();
      const original = editableEl.innerHTML;
      const domRect = editableEl.getBoundingClientRect();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      // Get position relative to canvas wrapper
      const rect = canvasRect
        ? {
            top: domRect.top - canvasRect.top,
            left: domRect.left - canvasRect.left,
            width: domRect.width,
            height: domRect.height,
          }
        : null;
      setEditing({ id, original, rect });
    },
    [composer, canvasRef]
  );

  // Attach inline editing listeners when editing.id changes
  React.useEffect(() => {
    if (!editing.id || !composer) return;

    const el = canvasRef.current?.querySelector(
      `[data-aqb-id="${editing.id}"]`
    ) as HTMLElement | null;
    if (!el) return;

    el.contentEditable = "true";
    el.draggable = false;
    el.focus();

    // Select all text content on edit start for easy replacement
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch {
      // Selection API may fail in some edge cases, continue without selection
    }

    let active = true;

    const finishEdit = (commit: boolean) => {
      if (!active) return;
      active = false;

      try {
        if (commit) {
          const newHtml = el.innerHTML;
          if (newHtml !== editing.original) {
            composer.beginTransaction("inline-edit");
            try {
              const element = composer.elements.getElement(editing.id!);
              element?.setContent?.(newHtml);
            } finally {
              composer.endTransaction();
            }
            composer.saveProject?.().catch(() => {
              // Autosave failure handled silently
            });
          }
        } else {
          el.innerHTML = editing.original;
        }
      } finally {
        el.contentEditable = "false";
        el.draggable = true;
        setEditing({ id: null, original: "", rect: null });
      }
    };

    const handleBlur = (evt: FocusEvent) => {
      // Don't finish editing if focus is moving to the inline toolbar
      const relatedTarget = evt.relatedTarget as HTMLElement | null;
      if (relatedTarget?.closest(".aqb-inline-toolbar")) {
        // Re-focus the contentEditable element after toolbar interaction
        setTimeout(() => el.focus(), 0);
        return;
      }
      finishEdit(true);
    };

    const handleKey = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        evt.preventDefault();
        finishEdit(false);
      } else if (evt.key === "Enter" && el.tagName.toLowerCase() !== "textarea") {
        evt.preventDefault();
        finishEdit(true);
      }
    };

    const handleDocMouseDown = (evt: MouseEvent) => {
      if (evt.button !== 0) return; // only left-click commits; right/middle/aux buttons do not
      const target = evt.target as HTMLElement | null;
      if (!target) return;

      // Don't finish editing if clicking on the inline toolbar
      if (target.closest(".aqb-inline-toolbar")) {
        return;
      }

      if (!el.contains(target)) {
        finishEdit(true);
        return;
      }
    };

    el.addEventListener("blur", handleBlur);
    el.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleDocMouseDown, true);

    return () => {
      el.removeEventListener("blur", handleBlur);
      el.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleDocMouseDown, true);
      el.contentEditable = "false";
      el.draggable = true;
    };
  }, [editing, composer, canvasRef]);

  return {
    editing,
    handleDoubleClick,
    isEditing: editing.id !== null,
  };
}
