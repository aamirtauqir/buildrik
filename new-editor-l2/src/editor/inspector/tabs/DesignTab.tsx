/**
 * Design Tab - Typography, Colors, Background, Border, Shadow, Effects, Motion
 *
 * KEY CHANGE: Base groups (Colors, Background, BorderRadius, Shadow, Effects, Motion)
 * render for ALL elements. Conditional groups (Typography, Icon) use showIf evaluation.
 *
 * @module components/Panels/ProInspector/tabs/DesignTab
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { AnimationConfig } from "../../../shared/types/animations";
import type { MediaAsset, MediaAssetType } from "../../../shared/types/media";
import { evaluateShowIf } from "../config/contextEvaluator";
import { AnimationSection } from "../sections/AnimationSection";
import { BackgroundSection } from "../sections/BackgroundSection";
import { BorderSection } from "../sections/BorderSection";
import { EffectsSection } from "../sections/EffectsSection";
import { InteractionsSection, type Interaction } from "../sections/interactions";
import { TypographySection } from "../sections/typography";
import { INSPECTOR_TOKENS } from "../shared/controls/controlStyles";
import type { CssContext } from "../shared/cssContext";
import { matchesSectionSearch } from "../shared/sectionConfig";
import type { BaseTabProps } from "../shared/types";

// ============================================================================
// TYPES
// ============================================================================

export interface DesignTabProps extends BaseTabProps {
  /** Opens media library for asset selection */
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  /** Section to auto-expand based on element type */
  autoExpandSection?: "typography" | null;
  /** Search query for filtering sections */
  searchQuery?: string;
  /** CSS context for conditional groups (optional for backwards compat) */
  cssContext?: CssContext;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DesignTab: React.FC<DesignTabProps> = ({
  composer,
  selectedElement,
  styles,
  onChange,
  onBatchChange,
  onOpenMediaLibrary,
  autoExpandSection,
  searchQuery = "",
  cssContext,
}) => {
  const q = searchQuery.toLowerCase().trim();

  // Get inspector context for showIf evaluation
  const ctx = cssContext?.inspectorContext;

  // Get animation from element
  const getAnimation = () => {
    if (!composer) return null;
    const el = composer.elements.getElement(selectedElement.id);
    return el?.getAnimation?.() || null;
  };

  // Handle animation change - wrapped in transaction for proper undo support
  const handleAnimationChange = (animation: AnimationConfig | null) => {
    if (!composer) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    // Wrap in transaction for history/undo support (L1 → L2 fix)
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

  // Handle animation preview
  const handleAnimationPreview = () => {
    const domEl = document.querySelector(`[data-aqb-id="${selectedElement.id}"]`) as HTMLElement;
    if (domEl) {
      const animation = domEl.style.animation;
      domEl.style.animation = "none";
      domEl.offsetHeight; // Trigger reflow
      domEl.style.animation = animation;
    }
  };

  // Interactions helpers - using composer.interactions manager
  const getInteractions = (): Interaction[] => {
    if (!selectedElement || !composer) return [];
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return [];
    return (el.getInteractions() as Interaction[]) || [];
  };

  // Handle interactions change - wrapped in transaction for proper undo support
  const handleInteractionsChange = (interactions: Interaction[]) => {
    if (!selectedElement || !composer) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    // Wrap in transaction for history/undo support (L1 → L2 fix)
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
    // Simple preview using animation config
    const anim = interaction.animation;
    if (anim) {
      domEl.style.animation = "";
      domEl.offsetHeight; // Trigger reflow
      domEl.style.animation = `aqb-${anim.type} ${anim.duration}ms ${anim.easing} ${anim.delay}ms 1 normal forwards`;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONDITIONAL GROUPS - Use showIf evaluation (Rule B)
  // ═══════════════════════════════════════════════════════════════════════════

  // Typography: only when isTextLike == true (text, heading, paragraph, button, link, etc.)
  const typographyVisible = ctx ? evaluateShowIf("ctx.isTextLike == true", ctx) : true; // Fallback to showing for backwards compat
  const showTypography = typographyVisible && matchesSectionSearch("typography", q);

  // ═══════════════════════════════════════════════════════════════════════════
  // BASE GROUPS - Always render for ALL elements (Rule A)
  // ═══════════════════════════════════════════════════════════════════════════

  const showBackground =
    matchesSectionSearch("background", q) || matchesSectionSearch("Background", q);
  const showBorder = matchesSectionSearch("border", q) || matchesSectionSearch("BorderRadius", q);
  const showEffects = matchesSectionSearch("effects", q) || matchesSectionSearch("Effects", q);
  const showShadow = matchesSectionSearch("Shadow", q);
  const showColors = matchesSectionSearch("Colors", q);
  const showMotion = matchesSectionSearch("Motion", q) || matchesSectionSearch("animation", q);
  const showInteractions =
    matchesSectionSearch("interactions", q) || matchesSectionSearch("trigger", q);

  const hasResults =
    showTypography ||
    showBackground ||
    showBorder ||
    showEffects ||
    showShadow ||
    showColors ||
    showMotion ||
    showInteractions;

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
        No design properties match "{searchQuery}"
      </div>
    );
  }

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          CONDITIONAL GROUP - Typography (only for text-like elements)
          ═══════════════════════════════════════════════════════════════════ */}

      {showTypography && (
        <TypographySection
          styles={styles}
          onChange={onChange}
          isOpen={autoExpandSection === "typography" || !!q ? true : undefined}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          BASE GROUPS - Always shown for all elements
          ═══════════════════════════════════════════════════════════════════ */}

      {showBackground && (
        <BackgroundSection
          styles={styles}
          onChange={onChange}
          onOpenMediaLibrary={onOpenMediaLibrary}
        />
      )}

      {showBorder && (
        <BorderSection styles={styles} onChange={onChange} onBatchChange={onBatchChange} />
      )}

      {showEffects && <EffectsSection styles={styles} onChange={onChange} />}

      {/* Animation/Motion Section */}
      {showMotion && (
        <AnimationSection
          animation={getAnimation()}
          onAnimationChange={handleAnimationChange}
          onPreview={handleAnimationPreview}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          INTERACTIONS SECTION - Webflow-style triggers (now L2)
          ═══════════════════════════════════════════════════════════════════ */}

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

export default DesignTab;
