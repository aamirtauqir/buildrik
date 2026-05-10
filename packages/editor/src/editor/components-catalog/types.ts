/**
 * components-catalog/types.ts — spec §5.5 / §5.6 catalog types.
 *
 * The Buildrik-shipped catalog (see catalog.ts in this folder) is pure data:
 * each ComponentType describes one canonical component (Button, Card, etc.)
 * with its variants, sizes, structural schema, and per-variant token bindings.
 * Drag-place from the Components panel creates a ComponentInstance whose
 * `source: "catalog"` references the ComponentType id.
 *
 * @license BSD-3-Clause
 */

/** Per-binding override map keyed by CSS property. Same shape as PresetBinding. */
export type PartialBindings = Record<string, { tokenId: string }>;

/** Default-bindings map: variant id → CSS-property → token reference. */
export type VariantBindings = Record<string, PartialBindings>;

/** One of three structural tiers per atomic-design conventions. */
export type ComponentTier = "atom" | "molecule" | "organism";

/**
 * Schema node — describes the element tree a component renders into.
 * `{variant}`, `{size}`, `{disabled}`, etc. are placeholder expressions
 * resolved at interpret time (out of S6 scope; only structure is stored).
 */
export type SchemaNode =
  | { type: "element"; tag: string; classes?: string[]; attrs?: Record<string, string>; children?: SchemaNode[] }
  | { type: "slot"; name: string; showIf?: string }
  | { type: "text"; source: string }
  | { type: "icon"; source: string; showIf?: string };

/** PropDefinition — describes a single user-tunable prop on a component. */
export interface PropDefinition {
  type: "string" | "number" | "boolean" | "enum";
  default?: string | number | boolean;
  options?: string[];
}

export interface ComponentSchema {
  props: Record<string, PropDefinition>;
  structure: SchemaNode;
  /** Names of behavior modules (interpreted at render time). v1 catalog ships none. */
  behaviors?: string[];
}

/**
 * ComponentType — one entry in the Buildrik catalog. Pure data (no React).
 * Persisted at compile time in catalog.ts; never edited at runtime.
 */
export interface ComponentType {
  id: string;
  category: ComponentTier;
  name: string;
  variants: string[];
  sizes?: string[];
  schema: ComponentSchema;
  defaultBindings: VariantBindings;
}

/**
 * ComponentInstance — the canvas-state record placed on a page when the user
 * drags a catalog component or a user-saved master. Discriminated by `source`
 * so the renderer routes correctly between the catalog interpreter (v1
 * deferred) and the existing user-saved master/instance flow.
 */
export type ComponentInstance =
  | {
      source: "catalog";
      componentTypeId: string;
      variant: string;
      size?: string;
      props: Record<string, unknown>;
      overrides?: PartialBindings;
    }
  | {
      source: "user";
      userComponentId: string;
      overrides?: PartialBindings;
      detached?: true;
    };
