/**
 * InspectorTabContent — profile-driven tab renderer.
 *
 * Replaces the three per-tab components (LayoutTab / AppearanceTab /
 * EffectsTab) with a single declarative renderer. Reads the active element
 * profile, filters sections via `shouldRender`, computes visible tier by
 * position, builds stable `SectionContext` per section, and delegates
 * rendering to each registry entry's `render(ctx)` closure.
 *
 * Two phases per render:
 *   1. Filter by shouldRender — before position/tier are known.
 *   2. Render each visible section with its computed tier and stable
 *      per-section toggle callbacks.
 *
 * Memoization story:
 *   - `visibleIds` is `useMemo`-ed over the reduced context so filtering
 *     only re-runs when actual inputs change.
 *   - Per-section toggle callbacks (`onToggle`, `onAdvancedToggle`) are
 *     wrapped in stable factory functions via `useCallback` so downstream
 *     `React.memo` on section components won't be defeated by changing
 *     closure identity on every render.
 *
 * Design reference:
 *   ~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-20260412-033637.md
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
import { getProfileFor } from "../config/elementProfiles";
import type { UseAdvancedSettingsReturn } from "../hooks/useAdvancedSettings";
import {
  SECTION_REGISTRY,
  sectionApplies,
  type SectionContext,
  type SectionId,
  type ShouldRenderContext,
  type TabId,
} from "../sections/registry";
import type { SectionTier } from "../shared/controls";
import { BK_HELPER_CLASS, Button, HelperText } from "@/editor/chrome-ui";
import { IS_DEV_BUILD } from "@/shared/utils/runtimeEnv";
// ============================================================================
// TYPES
// ============================================================================

export interface InspectorTabContentProps {
  tabId: TabId;
  composer: Composer | null | undefined;
  selectedElement: { id: string; type: string; tagName?: string };
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
  cssContext: CssContext;
  propertyStates: Record<string, PropertyState>;
  /** Required — always supplied by useInspectorSections. */
  expandedSections: Set<string>;
  /** Required — always supplied by useInspectorSections. */
  onToggleSection: (elementType: string, sectionId: SectionId) => void;
  /** Required — supplied by useAdvancedSettings lifted to ProInspector. */
  advancedState: UseAdvancedSettingsReturn;
  onOpenMediaLibrary?: (
    a: MediaAssetType[],
    s: (x: MediaAsset) => void
  ) => void;
  onOpenIconPicker?: (
    c: IconConfig | undefined,
    s: (i: IconConfig) => void
  ) => void;
  devMode: boolean;
  /** E3 per-user density. "fewer" (?view=readonly) trims the
   *  inspector to its primary + secondary sections, hiding tertiary (advanced)
   *  ones; "full" shows everything. Row heights are unaffected (density learning). */
  density?: "full" | "fewer";
}

// ============================================================================
// COMPONENT
// ============================================================================

export const InspectorTabContent: React.FC<InspectorTabContentProps> = (props) => {
  const {
    tabId,
    composer,
    selectedElement,
    styles,
    onChange,
    onBatchChange,
    cssContext,
    propertyStates,
    expandedSections,
    onToggleSection,
    advancedState,
    onOpenMediaLibrary,
    onOpenIconPicker,
    devMode,
    density = "full",
  } = props;

  // One scroll, one order — the profile's, read off its board.
  const orderedIds: SectionId[] = getProfileFor(selectedElement.type).order;

  // Stable per-section toggle factories. Without `useCallback`, each render
  // produces new closures, which defeats downstream React.memo on section
  // components. Closing over `selectedElement.type` is intentional — the
  // identity changes only when a new element type is selected, not when
  // its styles mutate.
  const makeSectionToggle = React.useCallback(
    (id: SectionId) => () => onToggleSection(selectedElement.type, id),
    [onToggleSection, selectedElement.type]
  );
  const makeAdvancedToggle = React.useCallback(
    (key: string) => () => advancedState.toggle(key),
    [advancedState]
  );

  // ── Phase 1: filter by shouldRender BEFORE position/tier computation ──
  // Tier and position are derived from visible sections only. A Typography
  // section at profile index 0 that hides (because the element isn't text)
  // does NOT count toward tier — the next visible section becomes primary.
  const visibleIds = React.useMemo<SectionId[]>(() => {
    const shouldRenderCtx: ShouldRenderContext = {
      composer,
      selectedElement,
      styles,
      onChange,
      onBatchChange,
      cssContext,
      propertyStates,
      onOpenMediaLibrary,
      onOpenIconPicker,
      devMode,
      tabId,
    };
    return orderedIds.filter((id) => {
      const entry = SECTION_REGISTRY[id];
      if (!entry) {
        if (IS_DEV_BUILD) {
          // eslint-disable-next-line no-console
          console.warn(
            `[InspectorTabContent] Unknown section id "${id}" in profile "${selectedElement.type}.${tabId}" — skipping.`
          );
        }
        return false;
      }
      if (!entry.shouldRender) return true;
      return entry.shouldRender(shouldRenderCtx);
    });
  }, [
    orderedIds,
    composer,
    selectedElement,
    styles,
    onChange,
    onBatchChange,
    cssContext,
    propertyStates,
    onOpenMediaLibrary,
    onOpenIconPicker,
    devMode,
    tabId,
  ]);

  // E3 density: "fewer" keeps only primary + secondary sections (visible index
  // < 3 = the two non-tertiary tiers below), hiding the advanced/tertiary ones.
  const renderIds = density === "fewer" ? visibleIds.slice(0, 3) : visibleIds;

  // ── Phase 2: render visible sections with tier derived from visible index ──
  return (
    <>
      {renderIds.map((id, visibleIdx) => {
        const entry = SECTION_REGISTRY[id];
        const stateKey = `${selectedElement.type}:${id}`;
        const tier: SectionTier =
          visibleIdx === 0 ? "primary" : visibleIdx <= 2 ? "secondary" : "tertiary";
        const advancedKey = entry.advancedKey ?? id;
        const ctx: SectionContext = {
          composer,
          selectedElement,
          styles,
          onChange,
          onBatchChange,
          cssContext,
          propertyStates,
              isOpen: expandedSections.has(stateKey),
          onToggle: makeSectionToggle(id),
          advancedExpanded: entry.advancedKey
            ? advancedState.isExpanded(advancedKey)
            : false,
          onAdvancedToggle: entry.advancedKey
            ? makeAdvancedToggle(advancedKey)
            : () => {
                /* no-op for sections without advanced disclosure */
              },
          onOpenMediaLibrary,
          onOpenIconPicker,
          devMode,
          tabId,
          tier,
          // Wave 2: multi-select — optional, default to empty/false so test
          // fixtures that don't wire cssContext.selectedElements still work.
          mixedKeys: cssContext.mixedKeys,
          isMultiSelect: (cssContext.selectedElements?.length ?? 0) > 1,
        };
        return <React.Fragment key={id}>{entry.render(ctx)}</React.Fragment>;
      })}

      {/* Every profile board closes with this line — "2 of 12 sections apply",
          "4 of 13" on the flex board. It says why most of the column is shut:
          the sections below carry nothing for this element yet. */}
      {renderIds.length > 0 && (
        <p className="tw:m-0 tw:px-4 tw:py-3 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
          {renderIds.filter((id) => sectionApplies(id, styles)).length} of{" "}
          {renderIds.length} sections apply
        </p>
      )}

      {/* E3 density: when "fewer" hides advanced sections, say so and offer a
          reversible way back to full controls — density is a preference, never
          a permission (so this is a "hidden", not a "locked", affordance). */}
      {density === "fewer" && visibleIds.length > renderIds.length && (
        <div className="tw:flex tw:flex-col tw:gap-2 tw:divide-y tw:divide-[var(--bk-gray-200)] tw:[&>*+*]:pt-3">
          <HelperText className={BK_HELPER_CLASS}>
            Simplified view — {visibleIds.length - renderIds.length} more control
            {visibleIds.length - renderIds.length === 1 ? "" : "s"} hidden. It&apos;s a preference, not a limit.
          </HelperText>
          <Button
            color="light"
            size="xs"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("density", "full");
              window.location.assign(url.toString());
            }} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
          >
            Show all controls
          </Button>
        </div>
      )}
    </>
  );
};

export default InspectorTabContent;
