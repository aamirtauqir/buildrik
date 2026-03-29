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

/** Filter category for quick filters */
export type LayerFilterCategory = "all" | "layout" | "text" | "media" | "ui";

/** Filter chip configuration */
export interface LayerFilterChip {
  id: LayerFilterCategory;
  label: string;
  icon: string;
  types: string[];
}

/** Predefined filter chips for layer filtering */
export const LAYER_FILTER_CHIPS: LayerFilterChip[] = [
  { id: "all", label: "All", icon: "📑", types: [] },
  {
    id: "layout",
    label: "Layout",
    icon: "📦",
    types: ["container", "section", "grid", "flex", "navbar", "hero", "footer", "features"],
  },
  { id: "text", label: "Text", icon: "🔤", types: ["text", "paragraph", "heading", "link"] },
  { id: "media", label: "Media", icon: "🖼️", types: ["image", "video", "icon"] },
  { id: "ui", label: "UI", icon: "🔘", types: ["button", "form", "input", "list"] },
];

/**
 * Type accent colors for layer icons
 *
 * NOTE: These colors are used for dynamic icon backgrounds in JavaScript.
 * They should remain in sync with the CSS variables defined in LeftSidebar.css
 * under the .aqb-layers-panel section.
 *
 * Color mapping (CSS var → hex):
 * - amber/orange: var(--aqb-accent-amber)  → #f59e0b / #fbbf77
 * - purple:       var(--aqb-accent-purple) → #a78bfa
 * - pink/mauve:   var(--aqb-accent-pink)   → #f38ba8 / #cba6f7
 * - cyan/teal:    var(--aqb-accent-cyan)   → #06b6d4 / #94e2d5
 * - blue:         var(--aqb-info)          → #3b82f6 / #89b4fa
 * - slate:        var(--aqb-text-tertiary) → #94a3b8
 */
export const typeAccents: Record<string, { soft: string; solid: string }> = {
  // Layout elements - amber/orange
  container: { soft: "rgba(245, 158, 11, 0.22)", solid: "#f59e0b" },
  // Structural - purple
  section: { soft: "rgba(167, 139, 250, 0.24)", solid: "#a78bfa" },
  // Text elements - pink/mauve
  text: { soft: "rgba(243, 139, 168, 0.18)", solid: "#f38ba8" },
  paragraph: { soft: "rgba(243, 139, 168, 0.18)", solid: "#f38ba8" },
  heading: { soft: "rgba(243, 139, 168, 0.18)", solid: "#f38ba8" },
  // Interactive - rose/red
  button: { soft: "rgba(243, 139, 168, 0.24)", solid: "#f38ba8" },
  // Media - cyan
  image: { soft: "rgba(6, 182, 212, 0.24)", solid: "#06b6d4" },
  video: { soft: "rgba(6, 182, 212, 0.24)", solid: "#06b6d4" },
  icon: { soft: "rgba(6, 182, 212, 0.18)", solid: "#06b6d4" },
  link: { soft: "rgba(6, 182, 212, 0.18)", solid: "#06b6d4" },
  // Forms - teal
  list: { soft: "rgba(20, 184, 166, 0.22)", solid: "#14b8a6" },
  form: { soft: "rgba(20, 184, 166, 0.2)", solid: "#14b8a6" },
  input: { soft: "rgba(20, 184, 166, 0.2)", solid: "#14b8a6" },
  // Layout components - blue
  grid: { soft: "rgba(59, 130, 246, 0.2)", solid: "#3b82f6" },
  flex: { soft: "rgba(59, 130, 246, 0.2)", solid: "#3b82f6" },
  navbar: { soft: "rgba(59, 130, 246, 0.2)", solid: "#3b82f6" },
  hero: { soft: "rgba(59, 130, 246, 0.2)", solid: "#3b82f6" },
  // Features - orange
  features: { soft: "rgba(251, 146, 60, 0.2)", solid: "#fb923c" },
  // Footer - slate
  footer: { soft: "rgba(148, 163, 184, 0.18)", solid: "#94a3b8" },
  // Default - blue
  default: { soft: "rgba(59, 130, 246, 0.16)", solid: "#3b82f6" },
};

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
