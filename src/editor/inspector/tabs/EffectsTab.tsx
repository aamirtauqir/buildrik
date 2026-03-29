/**
 * Effects Tab - Effects, Animation, Interactions (advanced)
 * Split from DesignTab as part of C-01 fix (reduce 6-section mega-tab).
 *
 * @module components/Panels/ProInspector/tabs/EffectsTab
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { AnimationConfig } from "../../../shared/types/animations";
import { AnimationSection } from "../sections/AnimationSection";
import { EffectsSection } from "../sections/EffectsSection";
import { InteractionsSection, type Interaction } from "../sections/interactions";
import { INSPECTOR_TOKENS } from "../shared/controls/controlStyles";
import { matchesSectionSearch } from "../shared/sectionConfig";
import type { BaseTabProps } from "../shared/types";

// ============================================================================
// TYPES
// ============================================================================

export interface EffectsTabProps extends BaseTabProps {
  searchQuery?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const EffectsTab: React.FC<EffectsTabProps> = ({
  composer,
  selectedElement,
  styles,
  onChange,
  searchQuery = "",
}) => {
  const q = searchQuery.toLowerCase().trim();

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

  const hasResults = showEffects || showMotion || showInteractions;

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
    </>
  );
};

export default EffectsTab;
