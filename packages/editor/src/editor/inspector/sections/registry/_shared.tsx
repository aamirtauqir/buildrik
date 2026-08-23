/**
 * Section Registry — shared infrastructure (types, factory, helpers).
 *
 * Per-family files (layout/typography/visual/element/effects) import everything
 * here. The aggregator at ./index re-exports these symbols so external
 * consumers (`from "../sections/registry"`) see no API change.
 *
 * Splitting note (E-009 / Phase B1): the original 666-line registry.tsx was
 * split into per-property-family files for navigability. The plan called this
 * "per element family" but the actual axis was always property-family
 * (layout vs typography vs visual etc.) — sections are organized around the
 * CSS concern they edit, not the element type they apply to.
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
import type { SectionTier } from "../../shared/controls";

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

/** Three tabs — concept axis, not CSS-category axis. */
export type TabId = "style" | "element" | "effects";

/**
 * The complete set of section ids that can appear in any inspector tab.
 * Every id must have a matching entry in SECTION_REGISTRY. Profile configs
 * in `elementProfiles.ts` use this union to declare per-tab section order.
 */
export type SectionId =
  // Style tab
  | "layout"
  | "size"
  | "spacing"
  | "flex"
  | "grid"
  | "typography"
  | "background"
  | "border"
  | "corner-radius"
  // Element tab
  | "link"
  | "element-properties"
  | "css-classes"
  | "all-css"
  // Effects tab
  | "effects"
  | "animation"
  | "interactions"
  | "visibility";

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
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
  cssContext: CssContext;
  propertyStates: Record<string, PropertyState>;
  // `currentPseudoState` was specced into the context during the design phase
  // as "plumbed for future consumers" but the CEO review (A2) found nothing
  // reads it — pseudo-state is already baked into `styles` by the style
  // handler hook upstream, so no section adapter needs it. Removed to keep
  // the context honest.
  /** Current controlled open state for this section — always a concrete boolean. */
  isOpen: boolean;
  /** Toggle this section's open state in the parent's expanded-sections map. */
  onToggle: () => void;
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
  devMode: boolean;
  tabId: TabId;
  /**
   * Visual weight tier computed over VISIBLE sections (post shouldRender
   * filter). Renderer sets this to "primary" for the first visible section,
   * "secondary" for indices 1-2, "tertiary" for 3+.
   */
  tier: SectionTier;
  /**
   * Sprint 2 / Wave 2 — section-level multi-select support.
   * Sections render a MixedValueBadge for any style key in this set.
   * Defaults to empty set when single-select (see `defineSection` —
   * existing test fixtures don't need to pass these).
   */
  mixedKeys?: ReadonlySet<string>;
  /** True when 2+ elements are selected. Sections use this to gate badge rendering. */
  isMultiSelect?: boolean;
}

/**
 * Defaults applied when context is built without multi-select plumbing (e.g.,
 * existing tests constructed SectionContext literals before Wave 2). Keeps
 * `mixedKeys` and `isMultiSelect` backwards-compatible.
 */
export const EMPTY_MIXED_KEYS: ReadonlySet<string> = new Set<string>();

/**
 * Reduced context for `shouldRender` — excludes position/state-derived fields
 * because filtering runs BEFORE position, open-state, and tier are known.
 */
export type ShouldRenderContext = Omit<
  SectionContext,
  "isOpen" | "onToggle" | "advancedExpanded" | "onAdvancedToggle" | "tier"
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
  /** Pre-render predicate. Runs BEFORE position/tier computation. */
  shouldRender?: (ctx: ShouldRenderContext) => boolean;
  /**
   * Opaque key into the advanced-disclosure state map. When set, the renderer
   * threads `advancedState.isExpanded(key) / .toggle(key)` into the adapter
   * context. When omitted, the section's `advancedExpanded`/`onAdvancedToggle`
   * context fields are no-ops.
   */
  advancedKey?: string;
  /**
   * The CSS properties this section's ADVANCED block actually renders.
   *
   * This used to be derived from the registry by prefix — `advancedKey: "layout"`
   * meant "every propertiesRegistry id starting layout. and tiered advanced".
   * The two drifted, because a section's advanced block is not organised by
   * registry prefix: Layout's renders Position, Overflow and Visibility, and
   * Typography's renders font-style / text-indent / vertical-align, which the
   * registry does not list at all. So the auto-expand asked one source of truth
   * about a set owned by another, and groups stayed shut on values the user had
   * just set. Measured live: a heading with font-style italic showed
   * "More settings 5", collapsed.
   *
   * Raw kebab CSS names, the same spelling the style map uses — no dotted ids,
   * no camelCase, nothing to convert.
   */
  advancedProps?: readonly string[];
  /**
   * CSS property keys this section reads from ctx.styles. The adapter will
   * receive only these keys (via pickKeys), so a single-property edit only
   * triggers re-render of sections that actually care about that property.
   * Sections that don't read ctx.styles (animation, interactions, link, etc.)
   * should declare an empty array.
   *
   * MUST be exhaustive — every `styles["foo"]` / `styles.foo` read in the
   * section's source files must appear here. The invariant is enforced by
   * `sections/__tests__/registry.styleKeys.test.ts`, which greps section
   * files and asserts every read key is declared. Under-declaring slices
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
  shouldRender?: (ctx: ShouldRenderContext) => boolean;
  advancedKey?: string;
  /** CSS properties this section's advanced block renders. See SectionEntry. */
  advancedProps?: readonly string[];
  /** CSS property keys this section reads — mirrors SectionEntry.styleKeys. */
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
  return {
    render: (ctx) => {
      const Component = entry.Component;
      // Slice ctx.styles to only the keys this section cares about so that
      // an edit to an unrelated property doesn't force a re-render here.
      const slicedCtx: SectionContext =
        entry.styleKeys.length > 0
          ? { ...ctx, styles: pickKeys(ctx.styles, entry.styleKeys) as Record<string, string> }
          : ctx;
      const props = entry.adaptProps(slicedCtx);
      return <Component {...props} />;
    },
    shouldRender: entry.shouldRender,
    advancedKey: entry.advancedKey,
    advancedProps: entry.advancedProps,
    styleKeys: entry.styleKeys,
  };
}

// ============================================================================
// SHARED ADAPTER HELPERS — two base shapes cover ~9 of the 17 sections. The
// other 8 need bespoke adapters because their props are genuinely unique
// (flex pulls isFlexItem, animation wires live composer data, etc.).
// ============================================================================

/**
 * Base props shape for style-tab sections (layout, size, spacing, typography,
 * border, effects, visibility): styles + onChange + open/tier/advanced +
 * Wave 2 multi-select awareness.
 */
export interface BaseStyleSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
  /** Style keys with differing values across selected elements (Wave 2). */
  mixedKeys?: ReadonlySet<string>;
  /** True when 2+ elements selected (Wave 2). */
  isMultiSelect?: boolean;
  /** Lets a section's binding chips jump to the Design panel — see ColorInput
   *  and SpacingControls, whose chips were static everywhere because no call
   *  site ever passed this down. */
  composer?: Composer | null;
}

export function adaptBaseStyleProps(ctx: SectionContext): BaseStyleSectionProps {
  return {
    styles: ctx.styles,
    onChange: ctx.onChange,
    isOpen: ctx.isOpen,
    onToggle: ctx.onToggle,
    tier: ctx.tier,
    mixedKeys: ctx.mixedKeys ?? EMPTY_MIXED_KEYS,
    composer: ctx.composer,
    isMultiSelect: ctx.isMultiSelect ?? false,
  };
}
