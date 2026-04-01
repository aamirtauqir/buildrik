/**
 * Canvas Indicators Hook
 * Manages spacing indicators, badges, and guides for canvas overlays
 *
 * @module components/Canvas/hooks/useCanvasIndicators
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import type { SpacingIndicator, ElementBadge, CanvasGuide } from "../../../shared/types/canvas";

export interface UseCanvasIndicatorsOptions {
  composer: Composer | null;
  selectedId: string | null;
  showSpacing: boolean;
  showBadges: boolean;
  showGuides: boolean;
  showGrid: boolean;
}

export interface UseCanvasIndicatorsResult {
  spacingIndicators: SpacingIndicator[];
  badges: ElementBadge[];
  guides: CanvasGuide[];
}

/**
 * Hook to manage canvas visual indicators (spacing, badges, guides)
 */
export function useCanvasIndicators({
  composer,
  selectedId,
  showSpacing,
  showBadges,
  showGuides,
  showGrid,
}: UseCanvasIndicatorsOptions): UseCanvasIndicatorsResult {
  const [spacingIndicators, setSpacingIndicators] = React.useState<SpacingIndicator[]>([]);
  const [badges, setBadges] = React.useState<ElementBadge[]>([]);
  const [guides, setGuides] = React.useState<CanvasGuide[]>([]);

  // Unified canvas indicators effect - handles spacing & badges
  React.useEffect(() => {
    if (!composer || !composer.canvasIndicators) {
      setSpacingIndicators([]);
      setBadges([]);
      setGuides([]);
      return;
    }

    const indicators = composer.canvasIndicators;
    indicators.toggleSpacing(showSpacing);
    indicators.toggleGuides(showGuides);
    indicators.toggleGrid(showGrid);

    const updateIndicators = () => {
      // Update spacing indicators
      if (!showSpacing || !selectedId) {
        setSpacingIndicators([]);
      } else {
        const spacing = indicators.getSpacingIndicators(selectedId);
        setSpacingIndicators(spacing || []);
      }

      // Update badges
      if (!showBadges || !selectedId) {
        setBadges([]);
      } else {
        const element = composer.elements.getElement(selectedId);
        if (element && !indicators.getBadge(selectedId)) {
          indicators.setBadge({
            elementId: selectedId,
            type: "tag",
            content: element.getTagName?.() || element.getType?.() || "element",
            position: "top-left",
            visible: true,
          });
        }
        const badge = indicators.getBadge(selectedId);
        setBadges(badge ? [badge] : []);
      }

      // Update guides
      if (showGuides) {
        setGuides(indicators.getGuides());
      } else {
        setGuides([]);
      }
    };

    // Subscribe to indicator events
    indicators.on("spacing:updated", updateIndicators);
    indicators.on("badge:set", updateIndicators);
    indicators.on("badge:removed", updateIndicators);
    indicators.on("guide:added", updateIndicators);
    indicators.on("guide:removed", updateIndicators);
    indicators.on("guides:cleared", updateIndicators);
    composer.on(EVENTS.ELEMENT_SELECTED, updateIndicators);

    // Initial update
    if (showSpacing) indicators.updateSpacingIndicators();
    updateIndicators();

    // BUG-015 FIX: Capture references for cleanup and guard against null
    const capturedIndicators = indicators;
    const capturedComposer = composer;

    return () => {
      // Guard against destroyed/null references
      try {
        capturedIndicators.off("spacing:updated", updateIndicators);
        capturedIndicators.off("badge:set", updateIndicators);
        capturedIndicators.off("badge:removed", updateIndicators);
        capturedIndicators.off("guide:added", updateIndicators);
        capturedIndicators.off("guide:removed", updateIndicators);
        capturedIndicators.off("guides:cleared", updateIndicators);
      } catch {
        // Indicators may have been destroyed
      }
      try {
        capturedComposer.off(EVENTS.ELEMENT_SELECTED, updateIndicators);
      } catch {
        // Composer may have been destroyed
      }
    };
  }, [composer, selectedId, showSpacing, showBadges, showGuides, showGrid]);

  return {
    spacingIndicators,
    badges,
    guides,
  };
}
