/**
 * Section Registry — single source of truth for inspector sections.
 *
 * Maps every section id to a typed entry that bundles the component, a
 * shared-context adapter, an optional visibility predicate, and an optional
 * "advanced disclosure" group key. The profile-driven `InspectorTabContent`
 * renderer iterates a profile's ordered section list and calls
 * `entry.render(ctx)` — no direct prop spread, no `any`, no per-tab
 * duplication.
 *
 * Design reference:
 *   ~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-20260412-033637.md
 *   (sections "Recommended Approach" and "Section Adapter Inventory")
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type {
  IconConfig,
  MediaAsset,
  MediaAssetType,
} from "../../../shared/types/media";
import type { CssContext, PropertyState } from "../config/cssContext";
import { getAdvancedPropsForGroup } from "../config/propertiesRegistry";
import type { SectionTier } from "../shared/controls";

// ============================================================================
// SECTION COMPONENTS — imported at the top so the registry is the one place
// where every section is referenced. Deliberate choice: a single import site
// for the entire tab content surface.
// ============================================================================

import { AllCSSSection } from "./AllCSSSection";
import { AnimationSection } from "./AnimationSection";
import { BackgroundSection } from "./BackgroundSection";
import { BorderSection } from "./BorderSection";
import { CSSClassesSection } from "./CSSClassesSection";
import { EffectsSection } from "./EffectsSection";
import { ElementPropertiesSection } from "./elementProperties";
import { FlexboxSection } from "./flexbox";
import { GridSection } from "./GridSection";
import { InteractionsSection, type Interaction } from "./interactions";
import { LayoutSection } from "./layout";
import { LinkSection } from "./LinkSection";
import { QuickActionsSection } from "./QuickActionsSection";
import { SizeSection } from "./SizeSection";
import { SpacingSection } from "./SpacingSection";
import { TypographySection } from "./typography";
import { VisibilitySection } from "./VisibilitySection";

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
  | "quick-actions"
  | "layout"
  | "size"
  | "spacing"
  | "flex"
  | "grid"
  | "typography"
  | "background"
  | "border"
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
}

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
      const props = entry.adaptProps(ctx);
      return <Component {...props} />;
    },
    shouldRender: entry.shouldRender,
    advancedKey: entry.advancedKey,
  };
}

// ============================================================================
// SHARED ADAPTER HELPERS — two base shapes cover ~9 of the 17 sections. The
// other 8 need bespoke adapters because their props are genuinely unique
// (flex pulls isFlexItem, animation wires live composer data, etc.).
// ============================================================================

/**
 * Base props shape for style-tab sections (layout, size, spacing, typography,
 * border, effects, visibility): styles + onChange + open/tier/advanced.
 */
interface BaseStyleSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

function adaptBaseStyleProps(ctx: SectionContext): BaseStyleSectionProps {
  return {
    styles: ctx.styles,
    onChange: ctx.onChange,
    isOpen: ctx.isOpen,
    onToggle: ctx.onToggle,
    tier: ctx.tier,
  };
}

// ============================================================================
// THE REGISTRY
// ============================================================================

export const SECTION_REGISTRY: Record<SectionId, AnySectionEntry> = {
  // ═══════════════════ STYLE TAB ═══════════════════

  "quick-actions": defineSection({
    Component: QuickActionsSection,
    adaptProps: (ctx) => ({
      styles: ctx.styles,
      onBatchChange: ctx.onBatchChange,
      tier: ctx.tier,
    }),
  }),

  layout: defineSection({
    Component: LayoutSection,
    advancedKey: "layout",
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      propertyStates: ctx.propertyStates,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  size: defineSection({
    Component: SizeSection,
    advancedKey: "size",
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      propertyStates: ctx.propertyStates,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  spacing: defineSection({
    Component: SpacingSection,
    advancedKey: "spacing",
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      propertyStates: ctx.propertyStates,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  flex: defineSection({
    Component: FlexboxSection,
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      propertyStates: ctx.propertyStates,
      isFlexItem: ctx.cssContext.isFlexItem,
    }),
    // Render when this element IS a flex container OR its parent is one
    // (so a flex item sees its grow/shrink/align-self controls).
    shouldRender: (ctx) =>
      ctx.cssContext.isFlexContainer || ctx.cssContext.isFlexItem,
  }),

  grid: defineSection({
    Component: GridSection,
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      isGridContainer: ctx.cssContext.isGridContainer,
      isGridItem: ctx.cssContext.isGridItem,
    }),
    shouldRender: (ctx) =>
      ctx.cssContext.isGridContainer || ctx.cssContext.isGridItem,
  }),

  typography: defineSection({
    Component: TypographySection,
    advancedKey: "typography",
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
    // Text-like elements only. cssContext.inspectorContext exposes isTextLike.
    shouldRender: (ctx) =>
      ctx.cssContext.inspectorContext.isTextLike === true,
  }),

  background: defineSection({
    Component: BackgroundSection,
    advancedKey: "background",
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onOpenMediaLibrary: ctx.onOpenMediaLibrary,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  border: defineSection({
    Component: BorderSection,
    advancedKey: "border",
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  // ═══════════════════ ELEMENT TAB ═══════════════════

  link: defineSection({
    Component: LinkSection,
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
    }),
    // Only renders for linkable element types. LinkSection has its own
    // isLinkable check too, but gating at the registry level keeps the
    // element tab clean for everything else.
    shouldRender: (ctx) =>
      ["link", "button", "cta"].includes(ctx.selectedElement.type),
  }),

  "element-properties": defineSection({
    Component: ElementPropertiesSection,
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
      onOpenMediaLibrary: ctx.onOpenMediaLibrary,
      onOpenIconPicker: ctx.onOpenIconPicker,
    }),
    // ElementPropertiesSection.getPropertiesForType already returns [] for
    // element types with no properties. But hiding the section header too
    // keeps the element tab from showing a header with no content.
    // For now, let it render — the component returns null internally.
  }),

  "css-classes": defineSection({
    Component: CSSClassesSection,
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
    }),
    // Universal — every element can have classes.
  }),

  "all-css": defineSection({
    Component: AllCSSSection,
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer ?? null,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
    }),
    // Dev mode only — gated at the registry level.
    shouldRender: (ctx) => ctx.devMode === true,
  }),

  // ═══════════════════ EFFECTS TAB ═══════════════════

  effects: defineSection({
    Component: EffectsSection,
    adaptProps: adaptBaseStyleProps,
  }),

  animation: defineSection({
    Component: AnimationSection,
    adaptProps: (ctx) => {
      // Pull the live animation config from the element each render. This
      // is the same pattern the old EffectsTab used — reads via composer
      // directly because animations aren't in the styles map.
      const getAnimation = () => {
        if (!ctx.composer) return null;
        const el = ctx.composer.elements.getElement(ctx.selectedElement.id);
        return el?.getAnimation?.() ?? null;
      };
      const handleAnimationChange = (
        animation: import("../../../shared/types/animations").AnimationConfig | null
      ) => {
        if (!ctx.composer) return;
        const el = ctx.composer.elements.getElement(ctx.selectedElement.id);
        if (!el) return;
        ctx.composer.beginTransaction?.("animation-change");
        try {
          if (animation) {
            el.setAnimation?.(animation);
          } else {
            el.clearAnimation?.();
          }
        } finally {
          ctx.composer.endTransaction?.();
        }
      };
      const handleAnimationPreview = () => {
        const domEl = document.querySelector(
          `[data-aqb-id="${ctx.selectedElement.id}"]`
        ) as HTMLElement | null;
        if (!domEl) return;
        const animation = domEl.style.animation;
        domEl.style.animation = "none";
        // Force a reflow so the restart actually fires.
        void domEl.offsetHeight;
        domEl.style.animation = animation;
      };
      return {
        animation: getAnimation(),
        onAnimationChange: handleAnimationChange,
        onPreview: handleAnimationPreview,
        isOpen: ctx.isOpen,
        onToggle: ctx.onToggle,
        tier: ctx.tier,
      };
    },
  }),

  interactions: defineSection({
    Component: InteractionsSection,
    adaptProps: (ctx) => {
      const getInteractions = (): Interaction[] => {
        if (!ctx.composer || !ctx.selectedElement) return [];
        const el = ctx.composer.elements.getElement(ctx.selectedElement.id);
        if (!el) return [];
        return (el.getInteractions?.() as Interaction[]) ?? [];
      };
      const handleInteractionsChange = (interactions: Interaction[]) => {
        if (!ctx.composer) return;
        const el = ctx.composer.elements.getElement(ctx.selectedElement.id);
        if (!el) return;
        ctx.composer.beginTransaction?.("interactions-change");
        try {
          el.setInteractions?.(interactions);
        } finally {
          ctx.composer.endTransaction?.();
        }
      };
      const handleInteractionPreview = (interaction: Interaction) => {
        const domEl = document.querySelector(
          `[data-aqb-id="${ctx.selectedElement.id}"]`
        ) as HTMLElement | null;
        if (!domEl) return;
        const anim = interaction.animation;
        if (anim) {
          domEl.style.animation = "";
          void domEl.offsetHeight;
          domEl.style.animation = `aqb-${anim.type} ${anim.duration}ms ${anim.easing} ${anim.delay}ms 1 normal forwards`;
        }
      };
      return {
        interactions: getInteractions(),
        onInteractionsChange: handleInteractionsChange,
        onPreview: handleInteractionPreview,
        isOpen: ctx.isOpen,
        onToggle: ctx.onToggle,
        tier: ctx.tier,
      };
    },
  }),

  visibility: defineSection({
    Component: VisibilitySection,
    adaptProps: adaptBaseStyleProps,
  }),
};

// ============================================================================
// DERIVED HELPERS
// ============================================================================

/**
 * All section ids in registry declaration order. Useful for `expandAll` and
 * integrity tests — the source of truth for "every section that exists."
 */
export const ALL_REGISTRY_SECTION_IDS = Object.keys(SECTION_REGISTRY) as SectionId[];

/**
 * Build the advanced-prop map that `useAdvancedSettings` takes as input.
 * Iterates the registry, collects every entry with an `advancedKey`, and
 * resolves it to the real property list via the properties registry. This
 * replaces the three hardcoded const objects (LAYOUT_TAB_ADVANCED_PROPS etc.)
 * that used to live in the per-tab components.
 */
export function buildAdvancedPropsMapFromRegistry(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const entry of Object.values(SECTION_REGISTRY)) {
    if (entry.advancedKey) {
      map[entry.advancedKey] = getAdvancedPropsForGroup(entry.advancedKey);
    }
  }
  return map;
}
