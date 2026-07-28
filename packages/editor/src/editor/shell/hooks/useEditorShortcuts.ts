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
}

export function useEditorShortcuts({
  composer,
  modals,
  saveProject,
  openLeftPanelToTab,
}: UseEditorShortcutsOptions): void {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        openLeftPanelToTab?.("settings");
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
  }, [saveProject, composer, modals, openLeftPanelToTab]);
}
