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
