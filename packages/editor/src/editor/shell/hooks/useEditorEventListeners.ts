/**
 * useEditorEventListeners — extracted from AquibraStudio (Phase D D2
 * split, stage 3). Owns the composer-driven side-effects that lived
 * as scattered useEffects in the orchestrator:
 *
 *   1. COMPONENT_CREATE_REQUESTED → open the Create-Component modal
 *      with the requested element id.
 *   2. SHOW_IN_LAYERS  → switch to Layers tab + open left drawer +
 *      emit LAYERS_SCROLL_TO_SELECTION (delayed 100ms so the tab
 *      switch lands first).
 *   3. Overlay defaults init → seed the overlay toggles from
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
import { GROUPED_TABS_CONFIG } from "../../rail/tabsConfig";
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
  modals: Pick<
    UseStudioModalsReturn,
    "openCreateComponent" | "openSaveAsComponent" | "openCMSRecords" | "openSaveTemplate"
  >;
  state: EditorEventListenerStateSetters;
  /** Tracks whether the user has manually toggled spacing indicators
   *  (so we don't clobber their choice when overlay defaults arrive). */
  hasManuallyToggledSpacingRef: React.MutableRefObject<boolean>;
}

export function useEditorEventListeners({
  composer,
  modals,
  state,
  hasManuallyToggledSpacingRef,
}: UseEditorEventListenersOptions): void {
  // 1) COMPONENT_CREATE_REQUESTED → open the create-component modal.
  const { openCreateComponent, openSaveAsComponent, openCMSRecords, openSaveTemplate } = modals;
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

  // 2c) CMS_MANAGE_RECORDS → open the records management modal.
  React.useEffect(() => {
    if (!composer) return;
    const handle = () => openCMSRecords();
    composer.on(EVENTS.CMS_MANAGE_RECORDS, handle);
    return () => {
      composer.off(EVENTS.CMS_MANAGE_RECORDS, handle);
    };
  }, [composer, openCMSRecords]);

  // 2d) TEMPLATE_SAVE_REQUESTED → open the "Save as Template" modal (the open
  // handler + modal existed but had no caller — users couldn't save templates).
  React.useEffect(() => {
    if (!composer) return;
    const handle = () => openSaveTemplate();
    composer.on(EVENTS.TEMPLATE_SAVE_REQUESTED, handle);
    return () => {
      composer.off(EVENTS.TEMPLATE_SAVE_REQUESTED, handle);
    };
  }, [composer, openSaveTemplate]);

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
  // Emitters: command palette navigation, canvas cmd palette (SmartSuggestions,
  // deleted 2026-09-02, never rendered). Allowlist on panel id — it historically emitted inspector
  // subpanel ids (layout/style/typography/size) here, which opened a blank
  // drawer because none are real left tabs. Unknown ids no-op.
  /* Was a hand-written list, and it had drifted: `publish`, `review`,
     `content`, `components` and `ai` are all real left tabs TabRouter renders
     and AquibraStudio opens by name — and every one of them was dropped here.
     The ⌘K palette builds a "Open <X> panel" command for each tab that has a
     shortcut and emits UI_PANEL_OPEN with its id, so four of those commands
     (Publish ⌘K·U, Review R, Content D, AI I) did nothing at all when chosen.
     tabsConfig's own comment claims Content is "reachable via ⌘K", which it
     was not. One source: the tab registry decides what is a tab.

     It also listed `home`, `build` and `media`, which are not tabs and are
     emitted by nothing. */
  const VALID_LEFT_TABS = React.useMemo(
    () => new Set<string>(GROUPED_TABS_CONFIG.map((t) => t.id)),
    [],
  );
  const { openLeftPanelToTab } = state;
  React.useEffect(() => {
    if (!composer) return;
    const handle = (event: { panel: string; screen?: string }) => {
      if (!event?.panel) return;
      if (!VALID_LEFT_TABS.has(event.panel)) return;
      openLeftPanelToTab(event.panel, event.screen);
    };
    composer.on(EVENTS.UI_PANEL_OPEN, handle);
    return () => {
      composer.off(EVENTS.UI_PANEL_OPEN, handle);
    };
  }, [composer, openLeftPanelToTab, VALID_LEFT_TABS]);

  // 3c) UI_TOGGLE_LAYERS → switch to layers tab + open drawer.
  React.useEffect(() => {
    if (!composer) return;
    const handle = () => {
      setLeftPanelTab("layers");
      setIsLeftPanelOpen(true);
    };
    composer.on(EVENTS.UI_TOGGLE_LAYERS, handle);
    return () => {
      composer.off(EVENTS.UI_TOGGLE_LAYERS, handle);
    };
  }, [composer, setLeftPanelTab, setIsLeftPanelOpen]);

  /* 3d) UI_TOGGLE_PREVIEW used to flip `composer.setPreviewMode` here, which
     starts the canvas interaction runtime, emits PREVIEW_MODE_CHANGED (no
     listener anywhere) and leaves the chrome exactly as it was — so ⌘K
     "Preview", the canvas palette's Preview and the onboarding step that asks
     for one all reported success and showed nothing. Board 65:211 says preview
     is the overlay, and `AquibraStudio` owns that state, so it handles the
     event now. The engine method is left alone: it drives InteractionManager's
     runtime, which the sandboxed-iframe overlay does not replace. */

  // 3e) ELEMENT_QUICK_ADD → create + insert an element via the engine API.
  // Emitters: canvas command palette (SmartSuggestions' empty-container actions are gone with it).
  React.useEffect(() => {
    if (!composer) return;
    const handle = (event: { parentId?: string; type?: string }) => {
      const type = (event?.type ?? "container") as Parameters<typeof composer.elements.createElement>[0];
      const created = composer.elements.createElement(type);
      const parentId =
        event?.parentId ??
        composer.selection.getSelectedIds()[0] ??
        composer.elements.getActivePage()?.root?.id;
      if (!parentId) return;
      const added = composer.elements.addElement(created, parentId);
      if (added) composer.selection.select(created);
    };
    composer.on(EVENTS.ELEMENT_QUICK_ADD, handle);
    return () => {
      composer.off(EVENTS.ELEMENT_QUICK_ADD, handle);
    };
  }, [composer]);

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
