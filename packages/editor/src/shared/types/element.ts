/**
 * Element Types
 * Types for elements, traits, and the GrapesJS element interface
 *
 * @module types/element
 * @license BSD-3-Clause
 */

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
  /**
   * How `content` should be treated on export. Absent or `"text"` means plain
   * text and it is HTML-escaped — the safe default every hand-authored element
   * relies on, so a user typing `<script>` cannot inject markup.
   *
   * `"html"` means `content` is already markup. AI site generation stores whole
   * generated sections that way (`ai-generate/[jobId]/route.ts`), which the
   * canvas mounts un-escaped. Without this flag the export path escaped them
   * too, and every AI-generated site published as visible angle brackets.
   * Export sanitizes `"html"` content before emitting it; it is never trusted.
   */
  contentFormat?: "text" | "html";
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
  | "checkbox"
  | "radio"
  | "switch"
  | "upload"
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

/**
 * The minimum an element is identified by outside the engine — what the
 * inspector, the layers tree, the header and the studio state each pass
 * around. Six separate declarations of this same three-field shape existed
 * (three `SelectedElement`, three `SelectedElementInfo`), which is the same
 * setup that let a picker offer an interaction trigger the runtime had never
 * heard of: two declarations of one value set can never fail to agree.
 */
export interface SelectedElementInfo {
  id: string;
  type: string;
  tagName?: string;
}
