/**
 * Design system types and constants
 * @license BSD-3-Clause
 */

export type TokenCategory =
  | "colors"
  | "typography"
  | "spacing"
  | "effects"
  | "layout"
  | "icons"
  | "buttons"
  | "forms"
  | "theme";

/** WCAG 2.1 contrast level */
export type WcagLevel = "aaa" | "aa" | "aa-large" | "fail" | "na";

/** Color in HSB + alpha space */
export interface ColorHSB {
  h: number; // 0–360
  s: number; // 0–1
  b: number; // 0–1
  a: number; // 0–1
}

/** A single staged change not yet applied */
export interface TokenDiff {
  tokenId: string;
  previousValue: string;
  currentValue: string;
}

/** One undo entry for a single token (stores snapshot of that token's value history) */
export interface UndoEntry {
  tokenId: string;
  snapshot: string; // previous value to restore
}

export type TokenType =
  | "color"
  | "font-family"
  | "font-size"
  | "length"
  | "shadow"
  | "number"
  | "string"
  | "select";

export interface DesignToken {
  id: string;
  name: string;
  value: string;
  category: TokenCategory;
  cssVar: string;
  type: TokenType;
  group?: string;
  options?: string[];
  description?: string;
}

export type ThemeMode = "light" | "dark" | "system";

export interface TokenListProps {
  tokens: DesignToken[];
  onChange: (id: string, value: string) => void;
  onCopy: (id: string) => void;
}

/** Canonical CSS variable name from token id. Use everywhere — never derive from token.name. */
export function tokenToCssVar(id: string): string {
  return `--aqb-${id}`;
}

export const CATEGORY_CHIPS = [
  { id: "colors",     label: "Colors",   icon: "⬤" },
  { id: "typography", label: "Type",     icon: "Aa" },
  { id: "spacing",    label: "Space",    icon: "↔" },
  { id: "effects",    label: "Effects",  icon: "◻" },
  { id: "layout",     label: "Layout",   icon: "▦" },
  { id: "buttons",    label: "Buttons",  icon: "⬜" },
  { id: "forms",      label: "Forms",    icon: "▭" },
  { id: "icons",      label: "Icons",    icon: "◈" },
  { id: "theme",      label: "Theme",    icon: "◑" },
];

export const DEFAULT_TOKENS: DesignToken[] = [
  // Colors (9 core tokens) — groups: brand / surface / state
  { id: "color-primary",    name: "Primary",    value: "#3B82F6", category: "colors", cssVar: "--aqb-color-primary",    type: "color", group: "brand",   description: "Primary brand color" },
  { id: "color-secondary",  name: "Secondary",  value: "#8B5CF6", category: "colors", cssVar: "--aqb-color-secondary",  type: "color", group: "brand",   description: "Secondary brand color" },
  { id: "color-accent",     name: "Accent",     value: "#22C55E", category: "colors", cssVar: "--aqb-color-accent",     type: "color", group: "brand",   description: "Accent / highlight color" },
  { id: "color-background", name: "Background", value: "#0A0A0A", category: "colors", cssVar: "--aqb-color-background", type: "color", group: "surface", description: "Page background" },
  { id: "color-text",       name: "Text",       value: "#FFFFFF", category: "colors", cssVar: "--aqb-color-text",       type: "color", group: "surface", description: "Default text color" },
  { id: "color-muted",      name: "Muted",      value: "#71717A", category: "colors", cssVar: "--aqb-color-muted",      type: "color", group: "surface", description: "Secondary / muted text" },
  { id: "color-border",     name: "Border",     value: "#27272A", category: "colors", cssVar: "--aqb-color-border",     type: "color", group: "surface", description: "Default border color" },
  { id: "color-success",    name: "Success",    value: "#22C55E", category: "colors", cssVar: "--aqb-color-success",    type: "color", group: "state",   description: "Positive / success state" },
  { id: "color-error",      name: "Error",      value: "#EF4444", category: "colors", cssVar: "--aqb-color-error",      type: "color", group: "state",   description: "Negative / error state" },
  // Typography
  { id: "font-heading",   name: "Heading Font", value: "Inter",          category: "typography", cssVar: "--aqb-font-heading",   type: "font-family" },
  { id: "font-body",      name: "Body Font",    value: "Inter",          category: "typography", cssVar: "--aqb-font-body",      type: "font-family" },
  { id: "font-mono",      name: "Mono Font",    value: "JetBrains Mono", category: "typography", cssVar: "--aqb-font-mono",      type: "font-family" },
  { id: "font-size-xs",   name: "Font XS",      value: "12px",           category: "typography", cssVar: "--aqb-font-size-xs",   type: "font-size" },
  { id: "font-size-sm",   name: "Font SM",      value: "14px",           category: "typography", cssVar: "--aqb-font-size-sm",   type: "font-size" },
  { id: "font-size-base", name: "Font Base",    value: "16px",           category: "typography", cssVar: "--aqb-font-size-base", type: "font-size" },
  { id: "font-size-lg",   name: "Font LG",      value: "18px",           category: "typography", cssVar: "--aqb-font-size-lg",   type: "font-size" },
  { id: "font-size-xl",   name: "Font XL",      value: "20px",           category: "typography", cssVar: "--aqb-font-size-xl",   type: "font-size" },
  { id: "font-size-2xl",  name: "Font 2XL",     value: "24px",           category: "typography", cssVar: "--aqb-font-size-2xl",  type: "font-size" },
  { id: "font-size-3xl",  name: "Font 3XL",     value: "30px",           category: "typography", cssVar: "--aqb-font-size-3xl",  type: "font-size" },
  { id: "font-size-4xl",  name: "Font 4XL",     value: "36px",           category: "typography", cssVar: "--aqb-font-size-4xl",  type: "font-size" },
  // Spacing (4px base)
  { id: "space-1",  name: "Space 1",  value: "4px",  category: "spacing", cssVar: "--aqb-space-1",  type: "length" },
  { id: "space-2",  name: "Space 2",  value: "8px",  category: "spacing", cssVar: "--aqb-space-2",  type: "length" },
  { id: "space-3",  name: "Space 3",  value: "12px", category: "spacing", cssVar: "--aqb-space-3",  type: "length" },
  { id: "space-4",  name: "Space 4",  value: "16px", category: "spacing", cssVar: "--aqb-space-4",  type: "length" },
  { id: "space-5",  name: "Space 5",  value: "20px", category: "spacing", cssVar: "--aqb-space-5",  type: "length" },
  { id: "space-6",  name: "Space 6",  value: "24px", category: "spacing", cssVar: "--aqb-space-6",  type: "length" },
  { id: "space-8",  name: "Space 8",  value: "32px", category: "spacing", cssVar: "--aqb-space-8",  type: "length" },
  { id: "space-10", name: "Space 10", value: "40px", category: "spacing", cssVar: "--aqb-space-10", type: "length" },
  { id: "space-12", name: "Space 12", value: "48px", category: "spacing", cssVar: "--aqb-space-12", type: "length" },
  // Effects (Radius + Shadows)
  { id: "radius-none", name: "Radius None", value: "0",       category: "effects", cssVar: "--aqb-radius-none", type: "length" },
  { id: "radius-sm",   name: "Radius SM",   value: "4px",     category: "effects", cssVar: "--aqb-radius-sm",   type: "length" },
  { id: "radius-md",   name: "Radius MD",   value: "8px",     category: "effects", cssVar: "--aqb-radius-md",   type: "length" },
  { id: "radius-lg",   name: "Radius LG",   value: "12px",    category: "effects", cssVar: "--aqb-radius-lg",   type: "length" },
  { id: "radius-xl",   name: "Radius XL",   value: "16px",    category: "effects", cssVar: "--aqb-radius-xl",   type: "length" },
  { id: "radius-full", name: "Radius Full", value: "9999px",  category: "effects", cssVar: "--aqb-radius-full", type: "length" },
  { id: "shadow-sm",   name: "Shadow SM",   value: "0 1px 2px rgba(0,0,0,0.05)",   category: "effects", cssVar: "--aqb-shadow-sm",   type: "shadow" },
  { id: "shadow-md",   name: "Shadow MD",   value: "0 4px 6px rgba(0,0,0,0.1)",    category: "effects", cssVar: "--aqb-shadow-md",   type: "shadow" },
  { id: "shadow-lg",   name: "Shadow LG",   value: "0 10px 15px rgba(0,0,0,0.15)", category: "effects", cssVar: "--aqb-shadow-lg",   type: "shadow" },
  { id: "shadow-xl",   name: "Shadow XL",   value: "0 20px 25px rgba(0,0,0,0.25)", category: "effects", cssVar: "--aqb-shadow-xl",   type: "shadow" },
  // Layout / Grid
  { id: "layout-max-width",  name: "Container Max Width", value: "1280px", category: "layout", cssVar: "--aqb-layout-max-width",  type: "length", group: "container", description: "Max width of page container" },
  { id: "layout-padding-x",  name: "Container Padding",   value: "24px",   category: "layout", cssVar: "--aqb-layout-padding-x",  type: "length", group: "container", description: "Horizontal padding on page edges" },
  { id: "layout-columns",    name: "Grid Columns",         value: "12",     category: "layout", cssVar: "--aqb-layout-columns",    type: "number", group: "grid" },
  { id: "layout-gutter",     name: "Column Gutter",        value: "24px",   category: "layout", cssVar: "--aqb-layout-gutter",     type: "length", group: "grid" },
  { id: "section-padding-y", name: "Section Padding Y",    value: "80px",   category: "layout", cssVar: "--aqb-section-padding-y", type: "length", group: "sections" },
  { id: "content-max-width", name: "Content Max Width",    value: "720px",  category: "layout", cssVar: "--aqb-content-max-width", type: "length", group: "sections" },
  { id: "base-unit",         name: "Base Unit",            value: "4px",    category: "layout", cssVar: "--aqb-base-unit",         type: "length", group: "grid", description: "Spacing multiplier (all space tokens = N × base unit)" },
  { id: "breakpoint-mobile", name: "Mobile Breakpoint",    value: "768px",  category: "layout", cssVar: "--aqb-breakpoint-mobile", type: "length", group: "breakpoints" },
  // Icons Style
  { id: "icon-style",   name: "Icon Style",   value: "outline", category: "icons", cssVar: "--aqb-icon-style",  type: "select", options: ["outline", "filled", "duotone"] },
  { id: "icon-stroke",  name: "Stroke Width", value: "1.5",     category: "icons", cssVar: "--aqb-icon-stroke", type: "number", description: "SVG stroke-width for outline icons" },
  { id: "icon-size-sm", name: "Icon SM",      value: "16px",    category: "icons", cssVar: "--aqb-icon-sm",     type: "length" },
  { id: "icon-size-md", name: "Icon MD",      value: "20px",    category: "icons", cssVar: "--aqb-icon-md",     type: "length" },
  { id: "icon-size-lg", name: "Icon LG",      value: "24px",    category: "icons", cssVar: "--aqb-icon-lg",     type: "length" },
  // Buttons & CTA
  { id: "btn-height-sm",   name: "Button SM Height",   value: "32px",   category: "buttons", cssVar: "--aqb-btn-height-sm",   type: "length",    group: "size" },
  { id: "btn-height-md",   name: "Button MD Height",   value: "40px",   category: "buttons", cssVar: "--aqb-btn-height-md",   type: "length",    group: "size" },
  { id: "btn-height-lg",   name: "Button LG Height",   value: "48px",   category: "buttons", cssVar: "--aqb-btn-height-lg",   type: "length",    group: "size" },
  { id: "btn-padding-x",   name: "Button Padding X",   value: "16px",   category: "buttons", cssVar: "--aqb-btn-padding-x",   type: "length",    group: "style" },
  { id: "btn-font-weight", name: "Button Font Weight", value: "600",    category: "buttons", cssVar: "--aqb-btn-font-weight", type: "number",    group: "style" },
  { id: "btn-font-size",   name: "Button Font Size",   value: "14px",   category: "buttons", cssVar: "--aqb-btn-font-size",   type: "font-size", group: "style" },
  { id: "btn-radius",      name: "Button Radius",      value: "8px",    category: "buttons", cssVar: "--aqb-btn-radius",      type: "length",    group: "style", description: "Inherits Radius MD by default" },
  { id: "cta-radius",      name: "CTA Radius",         value: "9999px", category: "buttons", cssVar: "--aqb-cta-radius",      type: "length",    group: "style", description: "Full-pill radius for primary CTAs" },
  // Forms
  { id: "input-height",      name: "Input Height",       value: "40px",    category: "forms", cssVar: "--aqb-input-height",       type: "length",    group: "size" },
  { id: "input-radius",      name: "Input Radius",       value: "8px",     category: "forms", cssVar: "--aqb-input-radius",       type: "length",    group: "style" },
  { id: "input-border",      name: "Input Border Color", value: "#27272A", category: "forms", cssVar: "--aqb-input-border",       type: "color",     group: "style", description: "References Border token by default" },
  { id: "input-focus",       name: "Input Focus Color",  value: "#3B82F6", category: "forms", cssVar: "--aqb-input-focus",        type: "color",     group: "style", description: "References Primary token by default" },
  { id: "input-padding-x",   name: "Input Padding X",    value: "12px",    category: "forms", cssVar: "--aqb-input-padding-x",    type: "length",    group: "size" },
  { id: "label-font-size",   name: "Label Font Size",    value: "13px",    category: "forms", cssVar: "--aqb-label-font-size",    type: "font-size", group: "typography" },
  { id: "label-weight",      name: "Label Weight",       value: "500",     category: "forms", cssVar: "--aqb-label-weight",       type: "number",    group: "typography" },
  { id: "placeholder-color", name: "Placeholder Color",  value: "#71717A", category: "forms", cssVar: "--aqb-placeholder-color",  type: "color",     group: "style" },
];
