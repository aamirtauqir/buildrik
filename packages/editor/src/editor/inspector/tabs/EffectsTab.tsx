/**
 * Effects Tab - Effects, Animation, Interactions (advanced)
 * Split from DesignTab as part of C-01 fix (reduce 6-section mega-tab).
 *
 * @module components/Panels/ProInspector/tabs/EffectsTab
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { AnimationConfig } from "../../../shared/types/animations";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../../shared/types/media";
import { getAdvancedPropsForGroup } from "../config";
import { AISuggestionSection } from "../sections/AISuggestionSection";
import { AnimationSection } from "../sections/AnimationSection";
import { EffectsSection } from "../sections/EffectsSection";
import { InteractionsSection, type Interaction } from "../sections/interactions";
import { VisibilitySection } from "../sections/VisibilitySection";
import { INSPECTOR_TOKENS } from "../shared/controls/controlStyles";
import { matchesSectionSearch } from "../config/sectionConfig";
import { useAdvancedSettings } from "../hooks/useAdvancedSettings";
import type { BaseTabProps } from "../shared/types";
import { ElementSettingsFooter } from "../components/ElementSettingsFooter";

// ============================================================================
// TYPES
// ============================================================================

export interface EffectsTabProps extends BaseTabProps {
  searchQuery?: string;
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  devMode?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

// Build the advanced props map once (stable reference, outside render)
const EFFECTS_TAB_ADVANCED_PROPS: Record<string, string[]> = {
  effects: getAdvancedPropsForGroup("effects"),
  motion: getAdvancedPropsForGroup("motion"),
};

export const EffectsTab: React.FC<EffectsTabProps> = ({
  composer,
  selectedElement,
  currentPseudoState,
  styles,
  onChange,
  searchQuery = "",
  onOpenMediaLibrary,
  onOpenIconPicker,
  devMode,
}) => {
  const q = searchQuery.toLowerCase().trim();

  // Advanced settings state — tracks which section "More settings" is expanded
  const { isExpanded: isAdvancedExpanded, toggle: toggleAdvanced } = useAdvancedSettings({
    advancedPropsMap: EFFECTS_TAB_ADVANCED_PROPS,
    searchQuery: q,
  });

  // Animation helpers
  const getAnimation = () => {
    if (!composer) return null;
    const el = composer.elements.getElement(selectedElement.id);
    return el?.getAnimation?.() || null;
  };

  const handleAnimationChange = (animation: AnimationConfig | null) => {
    if (!composer) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    composer.beginTransaction?.("animation-change");
    try {
      if (animation) {
        el.setAnimation?.(animation);
      } else {
        el.clearAnimation?.();
      }
    } finally {
      composer.endTransaction?.();
    }
  };

  const handleAnimationPreview = () => {
    const domEl = document.querySelector(`[data-aqb-id="${selectedElement.id}"]`) as HTMLElement;
    if (domEl) {
      const animation = domEl.style.animation;
      domEl.style.animation = "none";
      domEl.offsetHeight; // Trigger reflow
      domEl.style.animation = animation;
    }
  };

  // Interactions helpers
  const getInteractions = (): Interaction[] => {
    if (!selectedElement || !composer) return [];
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return [];
    return (el.getInteractions() as Interaction[]) || [];
  };

  const handleInteractionsChange = (interactions: Interaction[]) => {
    if (!selectedElement || !composer) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    composer.beginTransaction?.("interactions-change");
    try {
      el.setInteractions(interactions);
    } finally {
      composer.endTransaction?.();
    }
  };

  const handleInteractionPreview = (interaction: Interaction) => {
    if (!selectedElement) return;
    const domEl = document.querySelector(
      `[data-aqb-id="${selectedElement.id}"]`
    ) as HTMLElement | null;
    if (!domEl) return;
    const anim = interaction.animation;
    if (anim) {
      domEl.style.animation = "";
      domEl.offsetHeight; // Trigger reflow
      domEl.style.animation = `aqb-${anim.type} ${anim.duration}ms ${anim.easing} ${anim.delay}ms 1 normal forwards`;
    }
  };

  // Section visibility
  const showEffects = matchesSectionSearch("effects", q) || matchesSectionSearch("Effects", q);
  const showMotion = matchesSectionSearch("Motion", q) || matchesSectionSearch("animation", q);
  const showInteractions =
    matchesSectionSearch("interactions", q) || matchesSectionSearch("trigger", q);
  const showVisibility = matchesSectionSearch("visibility", q);

  const hasResults = showEffects || showMotion || showInteractions || showVisibility;

  if (q && !hasResults) {
    return (
      <div
        style={{
          padding: 20,
          textAlign: "center",
          color: INSPECTOR_TOKENS.textTertiary,
          fontSize: 13,
        }}
      >
        No effects properties match &ldquo;{searchQuery}&rdquo;
      </div>
    );
  }

  return (
    <>
      {showEffects && <EffectsSection styles={styles} onChange={onChange} />}

      {showMotion && (
        <AnimationSection
          animation={getAnimation()}
          onAnimationChange={handleAnimationChange}
          onPreview={handleAnimationPreview}
        />
      )}

      {showInteractions && (
        <InteractionsSection
          interactions={getInteractions()}
          onInteractionsChange={handleInteractionsChange}
          onPreview={handleInteractionPreview}
        />
      )}

      {showVisibility && <VisibilitySection styles={styles} onChange={onChange} />}

      <AISuggestionSection composer={composer ?? null} selectedElement={selectedElement} />

      <ElementSettingsFooter
        composer={composer}
        selectedElement={selectedElement}
        currentPseudoState={currentPseudoState}
        onOpenMediaLibrary={onOpenMediaLibrary}
        onOpenIconPicker={onOpenIconPicker}
        devMode={devMode}
      />
    </>
  );
};

export default EffectsTab;
