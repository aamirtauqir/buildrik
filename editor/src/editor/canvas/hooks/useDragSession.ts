/**
 * Drag Session State Management Hook
 * Manages drag operation state (isDragOver, dropTargetId, dropPosition, etc.)
 *
 * @module components/Canvas/hooks/useDragSession
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { InvalidDropReason } from "../../../shared/utils/dragDrop/dropValidation";

// =============================================================================
// TYPES
// =============================================================================

export type DropPosition = "before" | "after" | "inside" | null;

/** Animated drop slot preview dimensions */
export interface DropSlotRect {
  x: number;
  y: number;
  width: number;
  height: number;
  isHorizontal: boolean;
}

/** Breadcrumb path item for drag feedback */
export interface BreadcrumbItem {
  id: string;
  type: string;
  label: string;
  isCurrent: boolean;
}

export interface DragSessionState {
  isDragOver: boolean;
  dropTargetId: string | null;
  dropPosition: DropPosition;
  draggingElementId: string | null;
  isValidDrop: boolean;
  invalidDropReason: InvalidDropReason;
  dropSlotRect: DropSlotRect | null;
  dropTargetPath: BreadcrumbItem[];
}

export interface DragSessionActions {
  setIsDragOver: (value: boolean) => void;
  setDropTargetId: (id: string | null) => void;
  setDropPosition: (position: DropPosition) => void;
  setDraggingElementId: (id: string | null) => void;
  setIsValidDrop: (valid: boolean) => void;
  setInvalidDropReason: (reason: InvalidDropReason) => void;
  setDropSlotRect: (rect: DropSlotRect | null) => void;
  setDropTargetPath: (path: BreadcrumbItem[]) => void;
  resetSession: () => void;
}

export interface UseDragSessionResult extends DragSessionState, DragSessionActions {}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: DragSessionState = {
  isDragOver: false,
  dropTargetId: null,
  dropPosition: null,
  draggingElementId: null,
  isValidDrop: true,
  invalidDropReason: null,
  dropSlotRect: null,
  dropTargetPath: [],
};

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to manage drag session state
 * Provides all state and setters for drag operations
 */
export function useDragSession(): UseDragSessionResult {
  const [isDragOver, setIsDragOver] = React.useState(initialState.isDragOver);
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(initialState.dropTargetId);
  const [dropPosition, setDropPosition] = React.useState<DropPosition>(initialState.dropPosition);
  const [draggingElementId, setDraggingElementId] = React.useState<string | null>(
    initialState.draggingElementId
  );
  const [isValidDrop, setIsValidDrop] = React.useState(initialState.isValidDrop);
  const [invalidDropReason, setInvalidDropReason] = React.useState<InvalidDropReason>(
    initialState.invalidDropReason
  );
  const [dropSlotRect, setDropSlotRect] = React.useState<DropSlotRect | null>(
    initialState.dropSlotRect
  );
  const [dropTargetPath, setDropTargetPath] = React.useState<BreadcrumbItem[]>(
    initialState.dropTargetPath
  );

  /**
   * Reset all session state to initial values
   */
  const resetSession = React.useCallback(() => {
    setIsDragOver(initialState.isDragOver);
    setDropTargetId(initialState.dropTargetId);
    setDropPosition(initialState.dropPosition);
    setDraggingElementId(initialState.draggingElementId);
    setIsValidDrop(initialState.isValidDrop);
    setInvalidDropReason(initialState.invalidDropReason);
    setDropSlotRect(initialState.dropSlotRect);
    setDropTargetPath(initialState.dropTargetPath);
  }, []);

  return {
    // State
    isDragOver,
    dropTargetId,
    dropPosition,
    draggingElementId,
    isValidDrop,
    invalidDropReason,
    dropSlotRect,
    dropTargetPath,
    // Actions
    setIsDragOver,
    setDropTargetId,
    setDropPosition,
    setDraggingElementId,
    setIsValidDrop,
    setInvalidDropReason,
    setDropSlotRect,
    setDropTargetPath,
    resetSession,
  };
}
