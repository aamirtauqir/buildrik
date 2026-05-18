/**
 * useEditorEventListeners — extracted from AquibraStudio (Phase D D2
 * split, stage 3). Owns the 4 composer-driven side-effects that lived
 * as scattered useEffects in the orchestrator:
 *
 *   1. PROJECT_LOADED  → hide wizard if canvas already has content
 *      (returning users on reload).
 *   2. COMPONENT_CREATE_REQUESTED → open the Create-Component modal
 *      with the requested element id.
 *   3. SHOW_IN_LAYERS  → switch to Layers tab + open left drawer +
 *      emit LAYERS_SCROLL_TO_SELECTION (delayed 100ms so the tab
 *      switch lands first).
 *   4. Overlay defaults init → seed the overlay toggles from
 *      composer.canvasIndicators.getOverlay() once the composer is
 *      ready.
 *
 * Each effect is independent — the hook just centralizes the cleanup
 * + composer-null guards in one place. The 5th AquibraStudio effect
 * (auto-enable spacing on first selection) is intentionally NOT here:
 * it's selection-derived state, not composer-driven, and belongs near
 * the selection bookkeeping.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import type { UseStudioModalsReturn } from "./useStudioModals";

// Subset of useStudioState setters we touch — keeps the dep list tight.
export interface EditorEventListenerStateSetters {
  setLeftPanelTab: (tab: string) => void;
  setIsLeftPanelOpen: (open: boolean) => void;
  openLeftPanelToTab: (primaryTab: string, subTab?: string) => void;
  setShowSpacingIndicators: (v: boolean) => void;
  setShowBadges: (v: boolean) => void;
  setShowGuides: (v: boolean) => void;
  setShowGrid: (v: boolean) => void;
}

export interface UseEditorEventListenersOptions {
  composer: Composer | null;
  modals: Pick<UseStudioModalsReturn, "openCreateComponent" | "openSaveAsComponent">;
  state: EditorEventListenerStateSetters;
  /** Hide the first-run wizard once the project has any content. */
  setShowWizard: (v: boolean) => void;
  /** Tracks whether the user has manually toggled spacing indicators
   *  (so we don't clobber their choice when overlay defaults arrive). */
  hasManuallyToggledSpacingRef: React.MutableRefObject<boolean>;
}

export function useEditorEventListeners({
  composer,
  modals,
  state,
  setShowWizard,
  hasManuallyToggledSpacingRef,
}: UseEditorEventListenersOptions): void {
  // 1) Hide wizard when canvas already has content.
  React.useEffect(() => {
    if (!composer) return;
    const checkContent = () => {
      const existing = composer.elements?.getAllElements?.() ?? [];
      if (existing.length > 0) setShowWizard(false);
    };
    checkContent();
    composer.on(EVENTS.PROJECT_LOADED, checkContent);
    return () => {
      composer.off?.(EVENTS.PROJECT_LOADED, checkContent);
    };
  }, [composer, setShowWizard]);

  // 2) COMPONENT_CREATE_REQUESTED → open the create-component modal.
  const { openCreateComponent, openSaveAsComponent } = modals;
  React.useEffect(() => {
    if (!composer) return;
    const handle = (event: { elementId: string }) => {
      openCreateComponent(event.elementId);
    };
    composer.on(EVENTS.COMPONENT_CREATE_REQUESTED, handle);
    return () => {
      composer.off(EVENTS.COMPONENT_CREATE_REQUESTED, handle);
    };
  }, [composer, openCreateComponent]);

  // 2b) COMPONENT_SAVE_AS_REQUESTED (T12) → open the binding-aware save-as modal.
  React.useEffect(() => {
    if (!composer) return;
    const handle = (event: {
      selectionIds: readonly string[];
      extractedBindings: Map<string, string>;
    }) => {
      openSaveAsComponent({
        selectionIds: event.selectionIds,
        extractedBindings: event.extractedBindings,
      });
    };
    composer.on(EVENTS.COMPONENT_SAVE_AS_REQUESTED, handle);
    return () => {
      composer.off(EVENTS.COMPONENT_SAVE_AS_REQUESTED, handle);
    };
  }, [composer, openSaveAsComponent]);

  // 3) SHOW_IN_LAYERS → switch tab + open drawer + scroll-to-selection.
  const { setLeftPanelTab, setIsLeftPanelOpen } = state;
  React.useEffect(() => {
    if (!composer) return;
    const handle = () => {
      setLeftPanelTab("layers");
      setIsLeftPanelOpen(true);
      // Small delay so the tab switch lands before LayersPanel scrolls.
      setTimeout(() => {
        composer.emit(EVENTS.LAYERS_SCROLL_TO_SELECTION, {});
      }, 100);
    };
    composer.on(EVENTS.SHOW_IN_LAYERS, handle);
    return () => {
      composer.off(EVENTS.SHOW_IN_LAYERS, handle);
    };
  }, [composer, setLeftPanelTab, setIsLeftPanelOpen]);

  // 3b) UI_PANEL_OPEN → open the requested left-panel tab (and optional sub-screen).
  // Emitters: command palette navigation, SmartSuggestions, canvas cmd palette.
  // Before this listener, all those emits routed to nowhere.
  const { openLeftPanelToTab } = state;
  React.useEffect(() => {
    if (!composer) return;
    const handle = (event: { panel: string; screen?: string }) => {
      if (!event?.panel) return;
      openLeftPanelToTab(event.panel, event.screen);
    };
    composer.on(EVENTS.UI_PANEL_OPEN, handle);
    return () => {
      composer.off(EVENTS.UI_PANEL_OPEN, handle);
    };
  }, [composer, openLeftPanelToTab]);

  // 4) Overlay defaults init.
  const { setShowSpacingIndicators, setShowBadges, setShowGuides, setShowGrid } = state;
  React.useEffect(() => {
    if (!composer?.canvas.indicators) return;
    const overlay = composer.canvas.indicators.getOverlay();
    setShowSpacingIndicators(
      overlay.showSpacing ?? !hasManuallyToggledSpacingRef.current,
    );
    setShowBadges(overlay.showBadges ?? false);
    setShowGuides(overlay.showGuides ?? true);
    setShowGrid(overlay.showGrid ?? false);
  }, [
    composer,
    setShowSpacingIndicators,
    setShowBadges,
    setShowGuides,
    setShowGrid,
    hasManuallyToggledSpacingRef,
  ]);
}
