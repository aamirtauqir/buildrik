/**
 * Cursor Intelligence Hook
 * Dynamic cursor based on context and modifier keys
 *
 * Provides visual feedback through cursor changes:
 * - Default: pointer (can select)
 * - Over text: text (can edit)
 * - Alt held: zoom-in (inspect mode)
 * - Shift+drag: pin icon (sibling mode)
 * - Ctrl+drag: copy (clone mode)
 * - Invalid drop: not-allowed
 *
 * @module components/Canvas/hooks/useCursorIntelligence
 * @license BSD-3-Clause
 */

import * as React from "react";

// =============================================================================
// TYPES
// =============================================================================

export type CursorContext =
  | "default" // Normal state
  | "element" // Over selectable element
  | "text" // Over editable text
  | "inspect" // Alt held - inspect mode
  | "sibling" // Shift held during drag
  | "clone" // Ctrl/Cmd held during drag
  | "invalid" // Invalid drop target
  | "dragging" // Currently dragging
  | "resizing"; // Resizing element

export interface CursorState {
  /** Current cursor CSS value */
  cursor: string;
  /** Current context */
  context: CursorContext;
  /** Whether Alt key is held */
  altHeld: boolean;
  /** Whether Shift key is held */
  shiftHeld: boolean;
  /** Whether Ctrl/Cmd key is held */
  ctrlHeld: boolean;
}

export interface UseCursorIntelligenceOptions {
  canvasRef: React.RefObject<HTMLDivElement>;
  /** Whether drag operation is active */
  isDragging?: boolean;
  /** Whether current drop is invalid */
  isInvalidDrop?: boolean;
  /** Whether inspector mode is enabled */
  inspectorEnabled?: boolean;
}

export interface UseCursorIntelligenceResult {
  /** Current cursor state */
  cursorState: CursorState;
  /** Set cursor context explicitly */
  setContext: (context: CursorContext) => void;
  /** Reset to default cursor */
  resetCursor: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CURSOR_MAP: Record<CursorContext, string> = {
  default: "default",
  element: "pointer",
  text: "text",
  inspect: "zoom-in",
  sibling: "crosshair", // Visual hint for sibling mode
  clone: "copy",
  invalid: "not-allowed",
  dragging: "grabbing",
  resizing: "nwse-resize",
};

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for intelligent cursor management
 * Changes cursor based on hover context and modifier keys
 */
export function useCursorIntelligence({
  canvasRef,
  isDragging = false,
  isInvalidDrop = false,
  inspectorEnabled = false,
}: UseCursorIntelligenceOptions): UseCursorIntelligenceResult {
  const [context, setContext] = React.useState<CursorContext>("default");
  const [modifiers, setModifiers] = React.useState({
    altHeld: false,
    shiftHeld: false,
    ctrlHeld: false,
  });

  // Track modifier keys
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setModifiers({
        altHeld: e.altKey,
        shiftHeld: e.shiftKey,
        ctrlHeld: e.ctrlKey || e.metaKey,
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setModifiers({
        altHeld: e.altKey,
        shiftHeld: e.shiftKey,
        ctrlHeld: e.ctrlKey || e.metaKey,
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Track element under cursor for context detection
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Don't change context while dragging
      if (isDragging) return;

      const target = e.target as HTMLElement;

      // Check if over text content (for text editing cursor)
      const isTextElement =
        target.tagName === "P" ||
        target.tagName === "SPAN" ||
        target.tagName === "H1" ||
        target.tagName === "H2" ||
        target.tagName === "H3" ||
        target.tagName === "H4" ||
        target.tagName === "H5" ||
        target.tagName === "H6" ||
        target.tagName === "A" ||
        target.tagName === "LABEL" ||
        target.isContentEditable;

      // Check if over selectable element
      const aqbElement = target.closest("[data-aqb-id]");

      if (isTextElement && aqbElement) {
        setContext("text");
      } else if (aqbElement) {
        setContext("element");
      } else {
        setContext("default");
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [canvasRef, isDragging]);

  // Calculate effective cursor based on all factors
  const effectiveCursor = React.useMemo((): string => {
    // Priority order for cursor determination

    // 1. Invalid drop state (highest priority during drag)
    if (isDragging && isInvalidDrop) {
      return CURSOR_MAP.invalid;
    }

    // 2. Clone mode (Ctrl/Cmd + drag)
    if (isDragging && modifiers.ctrlHeld) {
      return CURSOR_MAP.clone;
    }

    // 3. Sibling mode (Shift + drag)
    if (isDragging && modifiers.shiftHeld) {
      return CURSOR_MAP.sibling;
    }

    // 4. Dragging state
    if (isDragging) {
      return CURSOR_MAP.dragging;
    }

    // 5. Inspect mode (Alt held or inspector enabled)
    if (modifiers.altHeld || inspectorEnabled) {
      return CURSOR_MAP.inspect;
    }

    // 6. Default context-based cursor
    return CURSOR_MAP[context] || CURSOR_MAP.default;
  }, [context, modifiers, isDragging, isInvalidDrop, inspectorEnabled]);

  // Apply cursor to canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.style.cursor = effectiveCursor;

    return () => {
      canvas.style.cursor = "";
    };
  }, [canvasRef, effectiveCursor]);

  const resetCursor = React.useCallback(() => {
    setContext("default");
  }, []);

  const cursorState: CursorState = {
    cursor: effectiveCursor,
    context,
    ...modifiers,
  };

  return {
    cursorState,
    setContext,
    resetCursor,
  };
}

export default useCursorIntelligence;
