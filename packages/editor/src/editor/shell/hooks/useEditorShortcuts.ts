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
 *   Cmd/Ctrl+K            → canvasRef.current.openCommandPalette()
 *   Cmd/Ctrl+J            → modals.setShowAI(toggle)
 *   Escape                → close shortcuts + AI modals
 *   ?                     → modals.setShowShortcuts(true)
 *
 * The handler short-circuits when the keydown originates inside an
 * editable surface (input/textarea/select/contenteditable) so users
 * typing don't trigger global shortcuts.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { CanvasRef } from "../../canvas/Canvas";

// Modals subset the shortcut handler reads. Match the public surface of
// useStudioModals; passing the full modals object keeps mocking simple.
export interface ShortcutModals {
  setShowShortcuts: (v: boolean) => void;
  setShowAI: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface UseEditorShortcutsOptions {
  composer: Composer | null;
  canvasRef: React.RefObject<CanvasRef | null>;
  modals: ShortcutModals;
  saveProject: () => void;
}

export function useEditorShortcuts({
  composer,
  canvasRef,
  modals,
  saveProject,
}: UseEditorShortcutsOptions): void {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (
        target?.closest("input, textarea, select, [contenteditable='true']") ||
        target?.isContentEditable
      ) {
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
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        canvasRef.current?.openCommandPalette();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        modals.setShowAI((prev) => !prev);
      }
      if (e.key === "Escape") {
        modals.setShowShortcuts(false);
        modals.setShowAI(false);
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        modals.setShowShortcuts(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveProject, composer, modals, canvasRef]);
}
