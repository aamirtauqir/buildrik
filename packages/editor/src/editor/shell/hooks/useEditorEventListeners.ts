/**
 * useEditorEventListeners — extracted from AquibraStudio (Phase D D2
 * split, stage 3). Owns the composer-driven side-effects that lived
 * as scattered useEffects in the orchestrator:
 *
 *   1. COMPONENT_CREATE_REQUESTED → open the Create-Component modal
 *      with the requested element id.
 *   2. Engine failure events (ERROR / STORAGE_ERROR / COMMAND_ERROR) →
 *      one keyed toast each (DQ-005).
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
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { GROUPED_TABS_CONFIG } from "@/editor/rail/tabsConfig";
import type { UseStudioModalsReturn } from "./useStudioModals";
import { requestPasteHtml } from "@/editor/sidebar/tabs/build/insertGroupRequest";
import type { ToastInput } from "@/editor/chrome-ui";

// Subset of useStudioState setters we touch — keeps the dep list tight.
export interface EditorEventListenerStateSetters {
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
    "openCreateComponent" | "openSaveAsComponent" | "openSaveTemplate" | "toggleShortcuts"
  >;
  state: EditorEventListenerStateSetters;
  /** Engine failure events surface here (DQ-005). */
  addToast: (input: ToastInput) => string;
}

/* What the engine's failure events say, as one toast each. ERROR carries
   `{ error, operation }`, except the page-root delete refusal, which sends
   `{ type, message }` (ElementCRUD.removeElement). */
const ERROR_TITLES: Record<string, string> = {
  save: "Couldn't save",
  load: "Couldn't load the project",
  init: "The editor didn't start properly",
};
const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error ?? "Unknown error"));

export function useEditorEventListeners({
  composer,
  modals,
  state,
  addToast,
}: UseEditorEventListenersOptions): void {
  /* 0) Engine failures → toast (DQ-005). ERROR, STORAGE_ERROR and
     COMMAND_ERROR were emitted with no listener in src: a command refused in
     view mode, a failed local autosave and a failed load all said nothing.
     Keyed, so a held key or a retry loop replaces one card instead of
     stacking them. */
  React.useEffect(() => {
    if (!composer) return;
    const onError = (event: { error?: unknown; operation?: string; type?: string; message?: string }) => {
      if (event?.type === "invalid_operation") {
        addToast({
          tone: "error",
          key: "engine-invalid-operation",
          description: "The page itself can't be deleted — select an element inside it.",
        });
        return;
      }
      const op = event?.operation ?? "unknown";
      addToast({
        tone: "error",
        key: `engine-error-${op}`,
        title: ERROR_TITLES[op] ?? "Something went wrong",
        description: messageOf(event?.error),
      });
    };
    const onStorageError = (event: { error?: unknown }) =>
      addToast({
        tone: "error",
        key: "engine-storage-error",
        title: "Couldn't save a local copy",
        description: messageOf(event?.error),
      });
    const onCommandError = (event: { id?: string; error?: unknown }) => {
      const message = messageOf(event?.error);
      if (message.startsWith("read-only:")) {
        addToast({
          key: "engine-command-readonly",
          title: "View only",
          description: "This editor is read-only, so nothing was changed.",
        });
        return;
      }
      addToast({
        tone: "error",
        key: `engine-command-${event?.id ?? "unknown"}`,
        title: "Couldn't complete that action",
        description: message,
      });
    };
    composer.on(EVENTS.ERROR, onError);
    composer.on(EVENTS.STORAGE_ERROR, onStorageError);
    composer.on(EVENTS.COMMAND_ERROR, onCommandError);
    return () => {
      composer.off(EVENTS.ERROR, onError);
      composer.off(EVENTS.STORAGE_ERROR, onStorageError);
      composer.off(EVENTS.COMMAND_ERROR, onCommandError);
    };
  }, [composer, addToast]);

  // 1) COMPONENT_CREATE_REQUESTED → open the create-component modal.
  const { openCreateComponent, openSaveAsComponent, openSaveTemplate, toggleShortcuts } = modals;
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

  // 2a) ⌘⇧V (board 7063:78846) → Add's Paste HTML dialog, held until the
  // panel mounts if Add is not the open tab.
  React.useEffect(() => {
    if (!composer) return;
    const handle = () => requestPasteHtml(composer);
    composer.on(EVENTS.UI_PASTE_HTML_REQUESTED, handle);
    return () => {
      composer.off(EVENTS.UI_PASTE_HTML_REQUESTED, handle);
    };
  }, [composer]);

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

  // 2c) CMS_MANAGE_RECORDS (⌘K "Manage CMS records") → the CMS workspace,
  // which replaced the Records modal (4428:143182).
  React.useEffect(() => {
    if (!composer) return;
    const handle = () => composer.emit("ui:switch-tab", { tab: "content" });
    composer.on(EVENTS.CMS_MANAGE_RECORDS, handle);
    return () => {
      composer.off(EVENTS.CMS_MANAGE_RECORDS, handle);
    };
  }, [composer]);

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

  // 2e) UI_TOGGLE_CHEAT_SHEET → the one keyboard sheet (StudioModals). The
  // ⌘K "Keyboard shortcuts" row, the site-menu row and the footer help button
  // emit it; `?` and ⌘/ flip the same state from useEditorShortcuts.
  React.useEffect(() => {
    if (!composer) return;
    const handle = () => toggleShortcuts();
    composer.on(EVENTS.UI_TOGGLE_CHEAT_SHEET, handle);
    return () => {
      composer.off(EVENTS.UI_TOGGLE_CHEAT_SHEET, handle);
    };
  }, [composer, toggleShortcuts]);

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
      /* Off unless asked for: board 5936:44788 draws a selection with no
         padding overlay. View › Spacing still turns it on. */
      overlay.showSpacing ?? false,
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
  ]);
}
