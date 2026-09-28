/**
 * Section Registry — shared infrastructure (types, factory, helpers).
 *
 * The per-owner files (type, component, text, box, effects, behaviour — one
 * Inspector v4 lane each) import everything here; ./index aggregates them.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type {
  IconConfig,
  MediaAsset,
  MediaAssetType,
} from "../../../../shared/types/media";
import type { CssContext, PropertyState } from "../../config/cssContext";
import type { SectionDisplayMode } from "../../shared/controls/Section";
import type { ElementCapabilities } from "@/shared/constants/elementCapabilities";

// ============================================================================
// PICK KEYS HELPER — slices ctx.styles to only the keys a section reads,
// preventing unrelated sections from re-rendering on every style edit.
// ============================================================================

function pickKeys<T extends Record<string, unknown>>(
  obj: T,
  keys: readonly string[],
): Partial<T> {
  const out: Partial<T> = {};
  for (const k of keys) {
    if (k in obj) (out as Record<string, unknown>)[k] = obj[k];
  }
  return out;
}

// ============================================================================
// TAB & SECTION IDS
// ============================================================================

/** Inspector v4 tabs (DD-1, DD-4, Q1): Style · Behaviour · Effects. */
export type TabId = "style" | "behaviour" | "effects";

/** The strip's labels, in board order (boards 1, 2, 3). */
export const INSPECTOR_TABS: readonly { id: TabId; label: string }[] = [
  { id: "style", label: "Style" },
  { id: "behaviour", label: "Behaviour" },
  { id: "effects", label: "Effects" },
];

/**
 * Every section that can appear on a tab. Each has one registry entry; the
 * order they render in is `config/sectionOrder.ts` (one list per tab).
 */
export type SectionId =
  // Style — define → shape → paint (DD-15)
  | "component"
  | "type"
  | "layout"
  | "typography"
  | "text-inside"
  | "size"
  | "spacing"
  | "fill"
  | "border"
  // Behaviour
  | "form-fields"
  | "form-settings"
  | "slides"
  | "slider-settings"
  | "collection"
  | "link"
  | "cms-binding"
  | "visibility"
  | "interactions"
  | "css-classes"
  | "attributes"
  // Effects
  | "opacity"
  | "shadow"
  | "filters"
  | "transform-motion"
  | "effects-advanced";

/**
 * How a section arrives (DD-11), before the user opens or closes it:
 *   always — open (type block, Size, Spacing);
 *   open   — open (the Behaviour tab's primaries);
 *   valued — open when the element carries a value for it, else the one-row
 *            "+" header (Fill, Border, the Effects rows);
 *   closed — shut, with a one-line summary (Attributes, Text inside, Advanced).
 */
export type SectionOpen = "always" | "open" | "valued" | "closed";

// ============================================================================
// CONTEXT SHAPES
// ============================================================================

/**
 * Shared bundle of inputs every section adapter pulls from. Built once per
 * visible section by `InspectorTabContent` on each render. Callback identity
 * (onToggle, onAdvancedToggle) is stabilized by the renderer via useCallback
 * so downstream React.memo can work.
 */
export interface SectionContext {
  composer: Composer | null | undefined;
  selectedElement: { id: string; type: string; tagName?: string };
  /** Every selected id, primary first (DD-12). One entry when single. */
  selectedIds: readonly string[];
  /** "page" when the Page panel renders the section (DD-13). */
  variant: "element" | "page";
  styles: Record<string, string>;
  /** The element's OWN values at this breakpoint + state — no type defaults,
   *  no computed fallback. What "has a value" is measured against. */
  authoredStyles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
  cssContext: CssContext;
  propertyStates: Record<string, PropertyState>;
  /** What the type is (shared/constants/elementCapabilities). */
  caps: ElementCapabilities;
  /** Open when the frame shows the body (displayMode "open"). */
  isOpen: boolean;
  /** Toggle this section's open state for this element type. */
  onToggle: () => void;
  displayMode: SectionDisplayMode;
  /** Advanced-disclosure substate lifted from useAdvancedSettings. */
  advancedExpanded: boolean;
  /** Toggle this section's advanced-disclosure state. */
  onAdvancedToggle: () => void;
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  onOpenIconPicker?: (
    current: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  /** CMS binding's "Create collection" door (no collections yet). */
  onOpenCreateCollection?: () => void;
  tabId: TabId;
  /** Style keys whose values differ across the selection (DD-12). */
  mixedKeys?: ReadonlySet<string>;
  /** True when 2+ elements are selected. */
  isMultiSelect?: boolean;
}

/**
 * Defaults applied when context is built without multi-select plumbing (e.g.,
 * test fixtures that construct SectionContext literals).
 */
export const EMPTY_MIXED_KEYS: ReadonlySet<string> = new Set<string>();

/**
 * Reduced context for presence / value / summary predicates — excludes the
 * fields that depend on the section's own open state.
 */
export type ShouldRenderContext = Omit<
  SectionContext,
  "isOpen" | "onToggle" | "advancedExpanded" | "onAdvancedToggle" | "displayMode"
>;

// ============================================================================
// ENTRY TYPES
// ============================================================================

/**
 * Typed section entry — the generic `P` is the component's props shape.
 * `adaptProps` must return exactly `P`. Used at the call site of
 * `defineSection` so the compiler catches prop-shape drift between the
 * component and the adapter.
 */
export interface SectionEntry<P extends object = object> {
  Component: React.ComponentType<P>;
  adaptProps: (ctx: SectionContext) => P;
  /** Which tab renders this section. */
  tab: TabId;
  /** The section's header — the frame draws it, ⌘K "Jump to property" prints it. */
  title: string;
  /** A header that depends on the element (the type block reads "Heading"). */
  frameTitle?: (ctx: ShouldRenderContext) => string;
  /** How it arrives (DD-11). */
  open: SectionOpen;
  /** Presence by what the type IS. Default: always present. */
  capability?: (caps: ElementCapabilities) => boolean;
  /** Presence by runtime state (an instance, a flex container). Runs after `capability`. */
  shouldRender?: (ctx: ShouldRenderContext) => boolean;
  /** Does the element carry a value here? Default: any own value in `styleKeys`. */
  hasValue?: (ctx: ShouldRenderContext) => boolean;
  /** One-line summary while closed ("Cursor: auto · Blend: normal"). */
  summary?: (ctx: ShouldRenderContext) => string | null;
  /** What the "+" of an empty section adds, beyond opening it. */
  onAdd?: (ctx: SectionContext) => void;
  /** Also renders in the Page panel (DD-13), with `ctx.variant === "page"`. */
  page?: boolean;
  /**
   * Opaque key into the advanced-disclosure state map. When set, the renderer
   * threads `advancedState.isExpanded(key) / .toggle(key)` into the adapter
   * context. When omitted, the section's `advancedExpanded`/`onAdvancedToggle`
   * context fields are no-ops.
   */
  advancedKey?: string;
  /**
   * The CSS properties this section's ADVANCED block actually renders —
   * declared by the section, not derived from a registry prefix (groups stayed
   * shut on values the user had just set when the two drifted). Raw kebab CSS
   * names, the same spelling the style map uses.
   */
  advancedProps?: readonly string[];
  /**
   * CSS property keys this section reads from ctx.styles. The adapter will
   * receive only these keys (via pickKeys), so a single-property edit only
   * triggers re-render of sections that actually care about that property.
   * Sections that don't read ctx.styles (interactions, link, etc.) declare
   * an empty array.
   *
   * MUST be exhaustive — every `styles["foo"]` / `styles.foo` read in the
   * section's source files must appear here. The invariant is enforced by
   * `sections/__tests__/registry.styleKeys.test.ts`. Under-declaring slices
   * away real values and silently blanks controls.
   */
  styleKeys: readonly string[];
}

/**
 * Existential wrapper stored in the registry map. Closes over the original
 * typed entry so the map itself can be `Record<SectionId, AnySectionEntry>`
 * without leaking `any`. Consumers call `entry.render(ctx)` to produce a
 * React element — the spread across the typed component happens inside the
 * closure where `P` is still visible.
 */
export interface AnySectionEntry {
  render: (ctx: SectionContext) => React.ReactElement | null;
  tab: TabId;
  title: string;
  frameTitle?: (ctx: ShouldRenderContext) => string;
  open: SectionOpen;
  capability?: (caps: ElementCapabilities) => boolean;
  shouldRender?: (ctx: ShouldRenderContext) => boolean;
  hasValue?: (ctx: ShouldRenderContext) => boolean;
  summary?: (ctx: ShouldRenderContext) => string | null;
  onAdd?: (ctx: SectionContext) => void;
  page?: boolean;
  advancedKey?: string;
  advancedProps?: readonly string[];
  styleKeys: readonly string[];
  /** Section id — set by the registry loop for test / introspection helpers. */
  id?: string;
}

/**
 * The only way to create a registry entry. `P` is inferred from the Component
 * at the call site, and `adaptProps` is type-checked against it. The returned
 * `AnySectionEntry` erases `P` at the map level but preserves it inside the
 * `render` closure — no type hole.
 */
export function defineSection<P extends object>(
  entry: SectionEntry<P>
): AnySectionEntry {
  const { Component, adaptProps, ...meta } = entry;
  return {
    ...meta,
    render: (ctx) => {
      // Slice ctx.styles to only the keys this section cares about so that
      // an edit to an unrelated property doesn't force a re-render here.
      const slicedCtx: SectionContext =
        entry.styleKeys.length > 0
          ? { ...ctx, styles: pickKeys(ctx.styles, entry.styleKeys) as Record<string, string> }
          : ctx;
      const props = adaptProps(slicedCtx);
      return <Component {...props} />;
    },
  };
}

// ============================================================================
// SHARED ADAPTER HELPERS
// ============================================================================

/**
 * Base props shape for style sections: styles + onChange + open state +
 * multi-select awareness.
 */
export interface BaseStyleSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  /** Style keys with differing values across selected elements. */
  mixedKeys?: ReadonlySet<string>;
  /** True when 2+ elements selected. */
  isMultiSelect?: boolean;
  /** Lets a section's binding chips jump to the Design panel. */
  composer?: Composer | null;
}

export function adaptBaseStyleProps(ctx: SectionContext): BaseStyleSectionProps {
  return {
    styles: ctx.styles,
    onChange: ctx.onChange,
    isOpen: ctx.isOpen,
    onToggle: ctx.onToggle,
    mixedKeys: ctx.mixedKeys ?? EMPTY_MIXED_KEYS,
    composer: ctx.composer,
    isMultiSelect: ctx.isMultiSelect ?? false,
  };
}

/** Props every non-style section (Behaviour) takes from the frame. */
export function adaptElementProps(ctx: SectionContext): {
  elementId: string;
  composer: Composer | null;
  isOpen: boolean;
  onToggle: () => void;
} {
  return {
    elementId: ctx.selectedElement.id,
    composer: ctx.composer ?? null,
    isOpen: ctx.isOpen,
    onToggle: ctx.onToggle,
  };
}
