/**
 * Aquibra Type Definitions
 * Core types for the visual composer
 *
 * @module types
 * @license BSD-3-Clause
 */

// Forward declaration for Composer to avoid circular imports
// The actual Composer class is in src/engine/Composer.ts
import type { Composer } from "../../engine/Composer";
// ProjectData is defined in project.ts (canonical) — imported here for use in this file's interfaces
import type { ProjectData } from "./project";

// ============================================
// Configuration Types
// ============================================

export interface ComposerConfig {
  /** Container element or selector */
  container: HTMLElement | string;
  /** Editor width */
  width?: string | number;
  /** Editor height */
  height?: string | number;
  /** License key */
  licenseKey?: string;
  /** Storage configuration */
  storage?: StorageConfig;
  /** Project configuration */
  project?: ProjectConfig;
  /** Canvas configuration */
  canvas?: CanvasConfig;
  /** Theme configuration */
  theme?: ThemeConfig;
  /** Plugin configuration */
  plugins?: import("./plugins").PluginConfig[];
  /** Internationalization */
  i18n?: I18nConfig;
  /** Callback when editor is ready */
  onReady?: (composer: Composer) => void;
  /** Callback on project update */
  onUpdate?: (data: ProjectData) => void;
}

export interface StorageConfig {
  /** Storage type */
  type: "local" | "session" | "remote" | "indexeddb" | "none";
  /** Auto-save enabled */
  autoSave?: boolean;
  /** Auto-save interval in ms */
  autoSaveInterval?: number;
  /** Storage key prefix */
  keyPrefix?: string;
  /** Remote storage endpoint */
  endpoint?: string;
  /** Custom storage handlers */
  handlers?: {
    load?: (id?: string) => Promise<ProjectData | null>;
    save?: (data: ProjectData) => Promise<void>;
  };
}

export interface ProjectConfig {
  /** Auto-load project on init */
  autoLoad?: boolean;
  /** Default project ID */
  defaultId?: string;
  /** Default project data */
  defaultData?: Partial<ProjectData>;
}

export interface CanvasConfig {
  /** Background color */
  backgroundColor?: string;
  /** Show grid */
  showGrid?: boolean;
  /** Grid size */
  gridSize?: number;
  /** Snap to grid */
  snapToGrid?: boolean;
}

export interface ThemeConfig {
  /** Theme mode */
  mode?: "light" | "dark" | "auto";
  /** Primary color */
  primaryColor?: string;
  /** Accent color */
  accentColor?: string;
  /** Custom CSS variables */
  variables?: Record<string, string>;
}

export interface PluginConfig {
  /** Plugin ID */
  id: string;
  /** Plugin source (URL or function) */
  src?: string | PluginFunction;
  /** Plugin options */
  options?: Record<string, unknown>;
}

export type PluginFunction = (composer: Composer, options?: Record<string, unknown>) => void;

export interface I18nConfig {
  /** Default locale */
  locale?: string;
  /** Available locales */
  locales?: Record<string, Record<string, string>>;
}

// ============================================
// State Types
// ============================================

export interface ComposerState {
  /** Editor is ready */
  ready: boolean;
  /** Project has unsaved changes */
  dirty: boolean;
  /** Current device preview */
  device: DeviceType;
  /** Current zoom level */
  zoom: number;
  /** Active page ID */
  activePageId: string | null;
  /** Snap to grid enabled */
  snapToGrid: boolean;
  /** Grid size in pixels */
  gridSize: number;
  /** Is composer in preview mode */
  isPreviewMode: boolean;
}

export type DeviceType = "desktop" | "tablet" | "mobile" | "watch";

/**
 * Device configuration for viewport preview
 */
export interface DeviceConfig {
  /** Device display name */
  name: string;
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels (optional for desktop) */
  height?: number;
  /** Device icon */
  icon?: string;
}

// ============================================
// GrapesJS Element Interface
// ============================================

/**
 * Interface for GrapesJS element objects
 * Used in callbacks and element operations
 */
export interface GrapesElement {
  getId(): string;
  getType(): string;
  getChildren(): GrapesElement[];
  getParent(): GrapesElement | null;
  getDescendants?(): GrapesElement[];
  getEl?(): HTMLElement;
  getAttributes?(): Record<string, string>;
  getClasses?(): string[];
  set?(key: string, value: unknown): void;
  get?(key: string): unknown;
}

// ============================================
// Element Types
// ============================================

export interface ElementData {
  /** Element ID */
  id: string;
  /** Element type */
  type: ElementType;
  /** Tag name */
  tagName?: string;
  /** Element attributes */
  attributes?: Record<string, string>;
  /** CSS classes */
  classes?: string[];
  /** Inline styles (desktop/base styles) */
  styles?: Record<string, string>;
  /** Responsive styles per breakpoint */
  breakpointStyles?: import("./breakpoints").BreakpointStyles;
  /** Text content */
  content?: string;
  /** Child elements */
  children?: ElementData[];
  /** Element traits/properties */
  traits?: TraitData[];
  /** Is element draggable */
  draggable?: boolean;
  /** Is element droppable */
  droppable?: boolean;
  /** Is element resizable */
  resizable?: boolean;
  /** Is element locked (cannot be edited structurally) */
  locked?: boolean;
  /** Custom data */
  data?: Record<string, unknown>;
  /** Data bindings for dynamic content */
  dataBindings?: Record<string, import("./data").DataBinding>;
}

export type ElementType =
  | "container"
  | "text"
  | "heading"
  | "paragraph"
  | "link"
  | "image"
  | "video"
  | "audio"
  | "svg"
  | "lottie"
  | "button"
  | "form"
  | "input"
  | "textarea"
  | "select"
  | "list"
  | "table"
  | "section"
  | "columns"
  | "grid"
  | "flex"
  | "hero"
  | "features"
  | "header"
  | "footer"
  | "nav"
  | "navbar"
  | "cta"
  | "card"
  | "pricing"
  | "spacer"
  | "divider"
  | "social"
  | "icon"
  | "slider"
  | "testimonials"
  | "progress"
  | "countdown"
  | "gallery"
  | "accordion"
  | "product-card"
  | "product-grid"
  | "product-detail"
  | "video-embed"
  | "map-embed"
  | "custom";

/** Allowed trait value types */
export type TraitValue = string | number | boolean | null | undefined;

export interface TraitData {
  /** Trait name */
  name: string;
  /** Trait type */
  type: TraitType;
  /** Trait label */
  label?: string;
  /** Current value */
  value?: TraitValue;
  /** Default value */
  default?: TraitValue;
  /** Options for select/radio */
  options?: TraitOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Is required */
  required?: boolean;
}

export type TraitType =
  | "text"
  | "number"
  | "checkbox"
  | "select"
  | "color"
  | "slider"
  | "button"
  | "custom";

export interface TraitOption {
  /** Option value */
  value: string | number;
  /** Option label */
  label: string;
}

// ============================================
// Style Types
// ============================================

export interface StyleData {
  /** Style ID */
  id: string;
  /** CSS selector */
  selector: string;
  /** Style properties */
  properties: Record<string, string>;
  /** Media query */
  mediaQuery?: string;
  /** Pseudo selector */
  pseudo?: string;
}

/**
 * Pseudo-state identifiers for element styling
 * Used for hover, focus, active, and disabled state styling
 */
export type PseudoStateId = "normal" | "hover" | "focus" | "active" | "disabled";

/**
 * Pseudo-state style configuration
 * Maps pseudo-states to their style overrides
 */
export type PseudoStateStyles = Partial<Record<PseudoStateId, Record<string, string>>>;

export interface StyleRule {
  /** Property name */
  property: string;
  /** Property value */
  value: string;
  /** Is important */
  important?: boolean;
}

// ============================================
// Asset Types
// ============================================

export interface AssetData {
  /** Asset ID */
  id: string;
  /** Asset type */
  type: AssetType;
  /** Asset URL */
  src: string;
  /** Asset name */
  name?: string;
  /** File size */
  size?: number;
  /** Dimensions for images */
  width?: number;
  height?: number;
}

export type AssetType = "image" | "video" | "audio" | "document" | "other";

// ============================================
// Block Types
// ============================================

export interface BlockData {
  /** Block ID */
  id: string;
  /** Block label */
  label: string;
  /** Block category */
  category?: string;
  /** Block icon */
  icon?: string;
  /** Block content (HTML or ElementData). Optional when build function is provided. */
  content?: string | ElementData;
  /** Block preview image */
  preview?: string;
  /** Block description */
  description?: string;
  /** Block tags for search */
  tags?: string[];
}

export interface BlockCategory {
  /** Category ID */
  id: string;
  /** Category label */
  label: string;
  /** Category icon */
  icon?: string;
  /** Sort order */
  order?: number;
  /** Is open by default */
  open?: boolean;
}

// ============================================
// Command Types
// ============================================

/** Command execution result */
export type CommandResult = void | boolean | unknown;

/** Command options record */
export type CommandOptions = Record<string, unknown>;

export interface CommandData {
  /** Command ID */
  id: string;
  /** Command label */
  label?: string;
  /** Command icon */
  icon?: string;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Alternate keyboard shortcuts */
  shortcuts?: string[];
  /** Run command */
  run: (composer: Composer, options?: CommandOptions) => CommandResult;
  /** Stop command */
  stop?: (composer: Composer, options?: CommandOptions) => void;
}

// ============================================
// Event Types
// ============================================

export type ComposerEventMap = {
  "composer:ready": Composer;
  "composer:destroyed": void;
  "project:loaded": ProjectData;
  "project:saved": ProjectData;
  "project:changed": void;
  "element:created": ElementData;
  "element:deleted": ElementData;
  "element:updated": ElementData;
  "element:selected": ElementData | null;
  "style:changed": StyleData;
  "device:changed": DeviceType;
  "zoom:changed": number;
  undo: void;
  redo: void;
};

// ============================================
// Export Types
// ============================================

export interface ExportOptions {
  /** Include inline styles */
  inlineStyles?: boolean;
  /** Minify output */
  minify?: boolean;
  /** Include only selected elements */
  selectedOnly?: boolean;
  /** Clean unused styles */
  cleanStyles?: boolean;
}

export interface ExportResult {
  /** HTML content */
  html: string;
  /** CSS content */
  css: string;
  /** Combined HTML document */
  combined: string;
}

// ============================================
// UI Types
// ============================================

export interface PanelConfig {
  /** Panel ID */
  id: string;
  /** Panel title */
  title: string;
  /** Panel icon */
  icon?: string;
  /** Panel position */
  position: "left" | "right" | "top" | "bottom";
  /** Panel width/height */
  size?: number;
  /** Is resizable */
  resizable?: boolean;
  /** Is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  collapsed?: boolean;
}

export interface ToolbarItem {
  /** Item ID */
  id: string;
  /** Item label */
  label?: string;
  /** Item icon */
  icon?: string;
  /** Item type */
  type: "button" | "toggle" | "dropdown" | "separator";
  /** Command to run */
  command?: string;
  /** Is active */
  active?: boolean;
  /** Is disabled */
  disabled?: boolean;
  /** Dropdown items */
  items?: ToolbarItem[];
}

// ============================================
// Geometry Types
// ============================================

export * from "./geometry";

// ============================================
// Breakpoint Types
// ============================================

export * from "./breakpoints";

// ============================================
// Media System Types
// ============================================

export * from "./media";

// ============================================
// Animation Types
// ============================================

export * from "./animations";

// ============================================
// Version History Types
// ============================================

export * from "./versions";

// ============================================
// Component Types
// ============================================

export * from "./components";

// ============================================
// CMS Types
// ============================================

export * from "./cms";

// ============================================
// E-commerce Types
// ============================================

export * from "./ecommerce";

// ============================================
// Publishing Types
// ============================================

export * from "./publish";

// ============================================
// SEO & Form Types
// ============================================

export * from "./seo";

// ============================================
// Project Types
// ============================================

export * from "./project";
