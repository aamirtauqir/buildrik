/**
 * useEditorShortcuts — extracted from AquibraStudio (Phase D D2 split,
 * stage 1). Owns the global window keydown handler that drives the
 * editor's keyboard shortcuts:
 *
 *   Cmd/Ctrl+S            → saveProject()
 *   Cmd/Ctrl+Z            → composer.history.undo()
 *   Cmd/Ctrl+Shift+Z      → composer.history.redo()
 *   Cmd/Ctrl+Y            → composer.history.redo()
 *   Cmd/Ctrl+/            → modals.setShowShortcuts(true)
 *   Cmd/Ctrl+J            → open the AI tab (composer ui:switch-tab → AITab)
 *   Escape                → close shortcuts modal
 *   ?                     → modals.setShowShortcuts(true)
 *   F6 / Shift+F6         → cycle focus between shell regions (board 58:2)
 *   C                     → toggle canvas comment mode (board 58:215 legend)
 *   Ctrl/Cmd+,            → openSiteSettings() — the site menu's own row
 *   Ctrl/Cmd+H            → left panel · version history
 *   Shift+A               → left panel · components
 *
 * The last three are printed on site-menu rows (Figma 642:3664), so the hints
 * and these handlers are one contract. On macOS the browser eats ⌘, and ⌘H
 * before the page sees them, which is why `SiteMenu` advertises the control
 * chords there — the handler accepts either modifier so both platforms work.
 *
 * The handler short-circuits when the keydown originates inside an
 * editable surface (input/textarea/select/contenteditable) so users
 * typing don't trigger global shortcuts.
 *
 * Cmd/Ctrl+K is intentionally NOT handled here — Topbar owns it and opens
 * the shell CommandPalette. (Binding it here too opened a second, canvas-level
 * palette on the same keypress.) The canvas palette is Cmd/Ctrl+Shift+P,
 * registered inside useCanvasCommandPalette.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { isModalOpen } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import { cycleRegion } from "../regionCycle";

// Modals subset the shortcut handler reads. Match the public surface of
// useStudioModals; passing the full modals object keeps mocking simple.
export interface ShortcutModals {
  setShowShortcuts: (v: boolean) => void;
}

export interface UseEditorShortcutsOptions {
  composer: Composer | null;
  modals: ShortcutModals;
  saveProject: () => void;
  /** Opens a left-panel destination; the site menu prints these shortcuts. */
  openLeftPanelToTab?: (primaryTab: string, subTab?: string) => void;
  /**
   * Site settings (⌃,). Its own callback rather than a panel tab, because the
   * menu row of the same name opens the project-settings modal — the chord and
   * the row have to land in the same place.
   */
  openSiteSettings?: () => void;
}

export function useEditorShortcuts({
  composer,
  modals,
  saveProject,
  openLeftPanelToTab,
  openSiteSettings,
}: UseEditorShortcutsOptions): void {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F9 rule, applied to the CLASS this time: an open modal owns the
      // keyboard. Every global shortcut below — including F6, ⌘S and undo —
      // stands down (live-reproduced: C mounted the comment layer behind the
      // shortcuts modal). The dialog's own focus trap handles navigation.
      if (isModalOpen()) return;

      const target = e.target instanceof HTMLElement ? e.target : null;

      // F6 region cycle runs even from editable surfaces — that's the point
      // of a region-escape key (board 58:2).
      if (e.key === "F6") {
        e.preventDefault();
        cycleRegion(e.shiftKey ? -1 : 1);
        return;
      }

      if (
        target?.closest("input, textarea, select, [contenteditable='true']") ||
        target?.isContentEditable
      ) {
        return;
      }

      // C — comment mode toggle (keyboard legend 58:215). Plain key, no
      // modifiers, guarded above against editable surfaces.
      if ((e.key === "c" || e.key === "C") && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        composer?.emit("ui:comment-mode", {});
        return;
      }

      // Site-menu destinations (Figma 642:3664 prints these on the rows, so
      // they have to actually work — a shortcut shown and not honoured is worse
      // than one not shown).
      // T9: the same door as the menu row that advertises this chord. It used to
      // open the left panel's settings tab while "Site settings" opened the
      // project-settings modal — one printed shortcut, two destinations, and no
      // way for the user to know which they would get.
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        openSiteSettings?.();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        openLeftPanelToTab?.("history");
        return;
      }
      if (e.shiftKey && (e.key === "A" || e.key === "a") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        openLeftPanelToTab?.("components");
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveProject();
      }

      if (!composer) return;

      const isRedo =
        (e.ctrlKey || e.metaKey) &&
        ((e.shiftKey && e.key.toLowerCase() === "z") || e.key.toLowerCase() === "y");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        composer.history.undo();
      } else if (isRedo) {
        e.preventDefault();
        composer.history.redo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        modals.setShowShortcuts(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        // AI is one surface now — open the AITab rail panel.
        composer.emit("ui:switch-tab", { tab: "ai" });
      }
      if (e.key === "Escape") {
        modals.setShowShortcuts(false);
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        modals.setShowShortcuts(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveProject, composer, modals, openLeftPanelToTab, openSiteSettings]);
}
