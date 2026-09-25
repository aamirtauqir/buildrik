/**
 * LayersPanel Types
 * @license BSD-3-Clause
 */

/** Selected element info passed from parent */
import type { SelectedElementInfo } from "@/shared/types";
export type { SelectedElementInfo };

/** LayersPanel component props */
export interface LayersPanelProps {
  composer: import("../../../engine").Composer | null;
  selectedElement: SelectedElementInfo | null;
  /** Callback when hovering over a layer (for bidirectional highlighting) */
  onLayerHover?: (elementId: string | null) => void;
  /** Currently hovered element ID from canvas (for bidirectional highlighting) */
  canvasHoveredId?: string | null;
  /** Controlled search value lifted to LayersTab (prototype panel-h shape). */
  search?: string;
  /** Lifted display-settings popover open state. */
  displaySettingsOpen?: boolean;
  /** Lifted display-settings popover toggle callback. */
  onDisplaySettingsToggle?: () => void;
}

/** Layer tree item data */
export interface LayerItem {
  id: string;
  type: string;
  tagName: string;
  depth: number;
  children: LayerItem[];
  isHidden?: boolean;
  isLocked?: boolean;
  customName?: string;
  /** First words of the element's own text, for TEXT-ish layers only. A tree
   *  of twelve rows reading "Heading" tells a designer nothing about which
   *  heading is which (designer walk 2026-08-28); the copy is the identity.
   *  Never overrides a custom name. */
  preview?: string;
  /** Whether this layer is a component instance */
  /** Breakpoint-specific visibility overrides */
  breakpointOverrides?: Record<string, { hidden?: boolean }>;
}

/** Drag state for layer reordering */
export interface DragState {
  draggedId: string | null;
  targetId: string | null;
  position: "before" | "after" | "inside" | null;
}

/**
 * Display preferences for the Layers panel (persisted to localStorage).
 * The set is Figma's (board 4418:84113: Show dimmed layers · Show lock badges
 * · Compact rows · Highlight CMS-bound) plus HTML tags — owner decision 18,
 * 2026-09-21. "Show element IDs" went with it.
 */
export interface LayerDisplayPrefs {
  /** Keep editor-dimmed rows (the eye) in the tree. Off → they are hidden from the list. Default: true */
  showDimmed: boolean;
  /** Show the lock control on every row. Off → only rows that ARE locked show it (so they can be unlocked). Default: true */
  showLockBadges: boolean;
  /** Compact row density. Default: "compact" (founder call 2026-08-28; DESIGN.md compact density + board 1082:4527). */
  treeDensity: "comfortable" | "compact";
  /** Tint rows whose element carries a CMS field or collection binding. Default: false */
  highlightCmsBound: boolean;
  /** Show raw HTML tag badges (div, section, h1). Default: false */
  showHtmlBadges: boolean;
}

/** State for the right-click context menu */
export interface LayerContextMenuState {
  x: number;
  y: number;
  nodeId: string;
  nodeName: string;
  isHidden: boolean;
  isLocked: boolean;
  childCount: number;
}

/** Actions available in the right-click context menu */
export type LayerAction =
  | "cut"
  | "copy"
  | "copyLink"
  | "paste"
  | "rename"
  | "duplicate"
  | "hide"
  | "show"
  | "lock"
  | "unlock"
  | "delete"
  | "group"
  | "selectChildren"
  | "moveToTop"
  | "moveToBottom"
  | "moveToPage";
