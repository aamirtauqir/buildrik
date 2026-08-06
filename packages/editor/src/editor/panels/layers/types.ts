/**
 * LayersPanel Types
 * @license BSD-3-Clause
 */

/** Selected element info passed from parent */
export interface SelectedElementInfo {
  id: string;
  type: string;
  tagName?: string;
}

/** LayersPanel component props */
export interface LayersPanelProps {
  composer: import("../../../engine").Composer | null;
  selectedElement: SelectedElementInfo | null;
  /** Callback when hovering over a layer (for bidirectional highlighting) */
  onLayerHover?: (elementId: string | null) => void;
  /** Currently hovered element ID from canvas (for bidirectional highlighting) */
  canvasHoveredId?: string | null;
  /** Callback to add a block (when tree is empty) */
  onAddBlockClick?: () => void;
  /** Controlled search value lifted to LayersTab (prototype panel-h shape). */
  search?: string;
  /** Lifted display-settings popover open state. */
  displaySettingsOpen?: boolean;
  /** Lifted display-settings popover toggle callback. */
  onDisplaySettingsToggle?: () => void;
  /** Lifted search setter. When provided, internal clear-search controls
   *  route through this instead of calling state.setSearch directly, so
   *  LayersTab's controlled search input stays in sync. */
  onSearchChange?: (value: string) => void;
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
  /** Whether this layer is a component instance */
  isComponent?: boolean;
  /** Breakpoint-specific visibility overrides */
  breakpointOverrides?: Record<string, { hidden?: boolean }>;
}

/** Drag state for layer reordering */
export interface DragState {
  draggedId: string | null;
  targetId: string | null;
  position: "before" | "after" | "inside" | null;
}

/** Display preferences for the Layers panel (persisted to localStorage) */
export interface LayerDisplayPrefs {
  /** Show raw HTML tag badges (div, section, h1). Default: false */
  showHtmlBadges: boolean;
  /** Show element IDs (#w83sqctx format). Default: false */
  showElementIds: boolean;
  /** Compact row density. Default: "comfortable" */
  treeDensity: "comfortable" | "compact";
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
  | "moveToBottom";

/** Default display preferences — HTML badges OFF by default */
export const DEFAULT_DISPLAY_PREFS: LayerDisplayPrefs = {
  showHtmlBadges: false,
  showElementIds: false,
  treeDensity: "comfortable",
};
