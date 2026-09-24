/**
 * InspectorTabContent — profile-driven tab renderer.
 *
 * Replaces the three per-tab components (LayoutTab / AppearanceTab /
 * EffectsTab) with a single declarative renderer. Reads the active element
 * profile, keeps the sections the registry places on the active tab, filters
 * them via `shouldRender`, hides the ADVANCED-tagged ones on the Beginner
 * tier (decision #29), computes visible tier by position, builds stable
 * `SectionContext` per section, and delegates rendering to each registry
 * entry's `render(ctx)` closure.
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
  type SectionContext,
  type SectionId,
  type ShouldRenderContext,
  type TabId,
} from "../sections/registry";
import type { SectionTier } from "../shared/controls";
import type { InspectorTier } from "../hooks/useInspectorTier";
import { Button } from "@/editor/chrome-ui";
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
    s: (x: MediaAsset) => void,
    /** Board 1164:4713 — what the picker is being opened for, e.g. "Hero · Image". */
    forLabel?: string
  ) => void;
  onOpenIconPicker?: (
    c: IconConfig | undefined,
    s: (i: IconConfig) => void
  ) => void;
  onOpenCreateCollection?: () => void;
  devMode: boolean;
  /** Beginner hides the registry's ADVANCED-tagged sections behind "Show all
   *  (N more)" (board 4428:141170); Pro shows everything (4428:141406). */
  tier: InspectorTier;
  /** Beginner's "Show all" — a temporary reveal, owned by the panel so it
   *  resets with the selection (board 6887:74333 "8 of 8 groups · Show less"). */
  showAll: boolean;
  onShowAllChange: (next: boolean) => void;
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
    onOpenCreateCollection,
    devMode,
    tier,
    showAll,
    onShowAllChange,
  } = props;

  // One order — the profile's, read off its board — narrowed to the sections
  // the registry places on THIS tab (boards 4428:141170 / 141642 / 142686).
  const orderedIds = React.useMemo<SectionId[]>(
    () => getProfileFor(selectedElement.type).order.filter((id) => SECTION_REGISTRY[id]?.tab === tabId),
    [selectedElement.type, tabId]
  );

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

  // Beginner hides the ADVANCED-tagged sections until "Show all" — by tag,
  // not by position: a section is advanced because the registry says so, not
  // because it happens to sit fourth in this profile.
  const hidden = tier === "beginner" && !showAll;
  const renderIds = hidden ? visibleIds.filter((id) => SECTION_REGISTRY[id].tier !== "advanced") : visibleIds;
  const hiddenCount = visibleIds.length - renderIds.length;

  // ── Phase 2: render visible sections with tier derived from visible index ──
  return (
    <>
      {renderIds.map((id, visibleIdx) => {
        const entry = SECTION_REGISTRY[id];
        const stateKey = `${selectedElement.type}:${id}`;
        const sectionTier: SectionTier =
          entry.tier ?? (visibleIdx === 0 ? "primary" : visibleIdx <= 2 ? "secondary" : "tertiary");
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
          onOpenCreateCollection,
          devMode,
          tabId,
          tier: sectionTier,
          // Wave 2: multi-select — optional, default to empty/false so test
          // fixtures that don't wire cssContext.selectedElements still work.
          mixedKeys: cssContext.mixedKeys,
          isMultiSelect: (cssContext.selectedElements?.length ?? 0) > 1,
        };
        return <React.Fragment key={id}>{entry.render(ctx)}</React.Fragment>;
      })}

      {/* Board 4428:141170's `row/show-all` — "Show all (3 more)" — and its
          expanded twin 6887:74333, "8 of 8 groups · Show less ▴". A preference,
          never a permission: the hidden sections are one click away, and the
          Beginner / Pro footer switch makes the reveal permanent. */}
      {tier === "beginner" && hiddenCount > 0 && (
        <Button
          color="light"
          size="xs"
          data-testid="inspector-show-all"
          onClick={() => onShowAllChange(true)}
          className="tw:mx-4 tw:my-2 tw:h-7 tw:border-transparent tw:bg-transparent tw:px-0 tw:text-[12px] tw:font-medium tw:text-[var(--bk-accent-text)] tw:hover:text-[var(--bk-accent-hover)]"
        >
          Show all ({hiddenCount} more)
        </Button>
      )}
      {tier === "beginner" && showAll && visibleIds.some((id) => SECTION_REGISTRY[id].tier === "advanced") && (
        <Button
          color="light"
          size="xs"
          data-testid="inspector-show-less"
          onClick={() => onShowAllChange(false)}
          className="tw:mx-4 tw:my-2 tw:h-7 tw:border-transparent tw:bg-transparent tw:px-0 tw:text-[12px] tw:font-medium tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
        >
          {renderIds.length} of {renderIds.length} groups · Show less ▴
        </Button>
      )}
    </>
  );
};

export default InspectorTabContent;
