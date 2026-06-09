/**
 * useOverlayState - Hook for managing canvas overlay toggle state
 *
 * Handles visibility of grid, badges, x-ray, spacing indicators, snap guides,
 * dev mode, component view, and suggestions overlays.
 *
 * @module Editor/hooks/useOverlayState
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { OverlayState } from "./useStudioState";

/** Hook return type for overlay state */
export interface UseOverlayStateReturn {
  overlays: OverlayState;
  setShowComponentView: React.Dispatch<React.SetStateAction<boolean>>;
  setShowXRay: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSpacingIndicators: React.Dispatch<React.SetStateAction<boolean>>;
  setShowBadges: React.Dispatch<React.SetStateAction<boolean>>;
  setShowGuides: React.Dispatch<React.SetStateAction<boolean>>;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  setDevMode: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOverlay: (overlay: keyof OverlayState) => void;
  toggleDevMode: () => void;
}

/**
 * Manages canvas overlay visibility toggles including dev mode master switch
 */
export function useOverlayState(): UseOverlayStateReturn {
  const [showComponentView, setShowComponentView] = React.useState(false);
  const [showXRay, setShowXRay] = React.useState(false);
  const [showSpacingIndicators, setShowSpacingIndicators] = React.useState(false);
  const [showBadges, setShowBadges] = React.useState(false);
  const [showGuides, setShowGuides] = React.useState(true);
  const [showGrid, setShowGrid] = React.useState(false);
  const [showRulers, setShowRulers] = React.useState(false);
  const [devMode, setDevMode] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(true);

  // Computed overlay state object
  const overlays: OverlayState = React.useMemo(
    () => ({
      showComponentView,
      showXRay,
      showSpacingIndicators,
      showBadges,
      showGuides,
      showGrid,
      showRulers,
      devMode,
      showSuggestions,
    }),
    [
      showComponentView,
      showXRay,
      showSpacingIndicators,
      showBadges,
      showGuides,
      showGrid,
      showRulers,
      devMode,
      showSuggestions,
    ]
  );

  // Generic overlay toggle
  const toggleOverlay = React.useCallback((overlay: keyof OverlayState) => {
    switch (overlay) {
      case "showComponentView":
        setShowComponentView((prev) => !prev);
        break;
      case "showXRay":
        setShowXRay((prev) => !prev);
        break;
      case "showSpacingIndicators":
        setShowSpacingIndicators((prev) => !prev);
        break;
      case "showBadges":
        setShowBadges((prev) => !prev);
        break;
      case "showGuides":
        setShowGuides((prev) => !prev);
        break;
      case "showGrid":
        setShowGrid((prev) => !prev);
        break;
      case "devMode":
        setDevMode((prev) => !prev);
        break;
      case "showSuggestions":
        setShowSuggestions((prev) => !prev);
        break;
    }
  }, []);

  // Dev Mode master toggle - enables/disables multiple features at once
  const toggleDevMode = React.useCallback(() => {
    setDevMode((prev) => {
      const newState = !prev;
      // When enabling dev mode, turn on all dev features
      // When disabling, turn them off
      setShowGrid(newState);
      setShowGuides(newState);
      setShowSpacingIndicators(newState);
      setShowBadges(newState);
      setShowComponentView(newState);
      return newState;
    });
  }, []);

  return {
    overlays,
    setShowComponentView,
    setShowXRay,
    setShowSpacingIndicators,
    setShowBadges,
    setShowGuides,
    setShowGrid,
    setDevMode,
    setShowSuggestions,
    toggleOverlay,
    toggleDevMode,
  };
}
