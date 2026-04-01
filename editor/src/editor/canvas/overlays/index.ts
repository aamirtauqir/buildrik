/**
 * Canvas Overlay Components
 * Selection and hover visualization overlays
 * @license BSD-3-Clause
 */

export { SelectionBoxOverlay } from "./SelectionBoxOverlay";
// export { SelectionBoxOverlayV2 as SelectionBoxOverlay } from "./SelectionBoxOverlayV2";
export { ElementHoverOverlay } from "./ElementHoverOverlay";
export type { ElementHoverOverlayProps } from "./ElementHoverOverlay";
export { DropFeedbackOverlay } from "./DropFeedbackOverlay";
// Note: DropSlotRect and BreadcrumbItem are exported from ../hooks/useDragSession (canonical source)
export type { DropFeedbackOverlayProps, InvalidDropReason } from "./DropFeedbackOverlay";
export { RulersOverlay } from "./RulersOverlay";
export type { RulersOverlayProps } from "./RulersOverlay";
export { GuidesOverlay } from "./GuidesOverlay";
export type { GuidesOverlayProps } from "./GuidesOverlay";
export { MultiSelectBadge } from "./MultiSelectBadge";
export { GridOverlay } from "./GridOverlay";
export { RemoteCursorsOverlay } from "./RemoteCursorsOverlay";
// Canvas UX enhancements
export { SelectionLabel } from "./SelectionLabel";
export type { SelectionLabelProps } from "./SelectionLabel";
export { ParentHighlight } from "./ParentHighlight";
export type { ParentHighlightProps } from "./ParentHighlight";
export { CanvasBreadcrumb } from "./CanvasBreadcrumb";
export type { CanvasBreadcrumbProps } from "./CanvasBreadcrumb";
export { SmartGuidesOverlay } from "./SmartGuidesOverlay";
export { CanvasOverlayGroup } from "./CanvasOverlayGroup";
export type { CanvasOverlayGroupProps } from "./CanvasOverlayGroup";
