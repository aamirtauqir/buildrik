/**
 * Canvas Hooks
 * @license BSD-3-Clause
 */

// Core interaction hooks
// Note: DropPosition, DropSlotRect, BreadcrumbItem are re-exported from useCanvasDragDrop for backward compatibility
export {
  useCanvasDragDrop,
  type UseCanvasDragDropOptions,
  type UseCanvasDragDropResult,
  type DropError,
  type DropErrorType,
  type DropPosition,
  type DropSlotRect,
  type BreadcrumbItem,
} from "./useCanvasDragDrop";

// Drag subsystem hooks (used by useCanvasDragDrop)
export { useDragSession, type DragSessionState, type DragSessionActions } from "./useDragSession";
export {
  useDragVisuals,
  type UseDragVisualsOptions,
  type UseDragVisualsResult,
} from "./useDragVisuals";
export {
  useDragAutoScroll,
  type UseDragAutoScrollOptions,
  type UseDragAutoScrollResult,
} from "./useDragAutoScroll";

// Element drag sub-hooks
export {
  useTouchDrag,
  useKeyboardMove,
  type UseTouchDragOptions,
  type UseTouchDragResult,
  type UseKeyboardMoveOptions,
  type UseKeyboardMoveResult,
} from "./drag";
export {
  useCanvasInlineEdit,
  type UseCanvasInlineEditOptions,
  type UseCanvasInlineEditResult,
  type EditingState,
} from "./useCanvasInlineEdit";
export { useCanvasElementDrag, type UseCanvasElementDragOptions } from "./useCanvasElementDrag";
export {
  useCanvasResize,
  type UseCanvasResizeOptions,
  type UseCanvasResizeReturn,
} from "./useCanvasResize";
export {
  useComposerSelection,
  type UseComposerSelectionOptions,
  type UseComposerSelectionResult,
} from "./useComposerSelection";
export {
  useCanvasSelectionBox,
  type UseCanvasSelectionBoxOptions,
  type UseCanvasSelectionBoxReturn,
  type SelectionRect,
} from "./useCanvasSelectionBox";
export {
  useSelectionRect,
  type UseSelectionRectOptions,
  type SelectionRect as SelectionRectType,
} from "./useSelectionRect";
export { useSelectionBehavior } from "./useSelectionBehavior";
export { useCanvasSnapping, type SnapLine, type SnapResult } from "./useCanvasSnapping";

// Canvas state hooks
export {
  useCanvasSync,
  type UseCanvasSyncOptions,
  type UseCanvasSyncResult,
} from "./useCanvasSync";
export {
  useCanvasIndicators,
  type UseCanvasIndicatorsOptions,
  type UseCanvasIndicatorsResult,
} from "./useCanvasIndicators";
export {
  useCanvasMarquee,
  type UseCanvasMarqueeOptions,
  type UseCanvasMarqueeResult,
  type MarqueeState,
} from "./useCanvasMarquee";
export {
  useCanvasKeyboard,
  type UseCanvasKeyboardOptions,
  type UseCanvasKeyboardResult,
} from "./useCanvasKeyboard";
export {
  useCanvasHover,
  type UseCanvasHoverOptions,
  type UseCanvasHoverResult,
} from "./useCanvasHover";
export {
  useCanvasGuides,
  type UseCanvasGuidesOptions,
  type UseCanvasGuidesReturn,
} from "./useCanvasGuides";

// Content and UI state hooks
export { useCanvasContent } from "./useCanvasContent";
export {
  useCanvasContextMenu,
  type ContextMenuState,
  type ContextMenuData,
  type ContextMenuContext,
} from "./useCanvasContextMenu";
export { useCanvasFloatingPanel, type FloatingPanelState } from "./useCanvasFloatingPanel";

// Collaboration hooks
export {
  useCursorSync,
  type UseCursorSyncOptions,
  type UseCursorSyncResult,
} from "./useCursorSync";

// UX Intelligence hooks
export {
  useCursorIntelligence,
  type UseCursorIntelligenceOptions,
  type UseCursorIntelligenceResult,
  type CursorState,
  type CursorContext,
} from "./useCursorIntelligence";

// Performance hooks
export {
  useElementRect,
  useMultipleElementRects,
  type ElementRect,
  type UseElementRectOptions,
} from "./useElementRect";
export {
  useToolbarPosition,
  useToolbarPositionAbove,
  useToolbarPositionBelow,
  type ToolbarPosition,
  type ToolbarPlacement,
  type UseToolbarPositionOptions,
} from "./useToolbarPosition";

// Utility hooks
export {
  useEventListener,
  useWindowEventListener,
  useDocumentEventListener,
  useEventListeners,
  type UseEventListenerOptions,
} from "./useEventListener";

// Animation hooks
export { useSelectionAnimation } from "./useSelectionAnimation";

// Extracted toolbar / palette / inline command hooks
export { useCanvasCommandPalette } from "./useCanvasCommandPalette";
export { useCanvasToolbarActions } from "./useCanvasToolbarActions";
export { useCanvasInlineCommands } from "./useCanvasInlineCommands";

// Canvas size tracking
export { useCanvasSize } from "./useCanvasSize";

// Accessibility — aria-live selection announcements (WCAG 4.1.3)
export { useSelectionAnnouncement } from "./useSelectionAnnouncement";
