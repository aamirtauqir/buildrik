/**
 * useCanvasToolbarActions
 * Toolbar action callbacks for the unified selection toolbar.
 * Extracted from Canvas.tsx for maintainability.
 *
 * @module components/Canvas/hooks/useCanvasToolbarActions
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";

interface UseCanvasToolbarActionsParams {
  composer: Composer | null;
}

export function useCanvasToolbarActions({ composer }: UseCanvasToolbarActionsParams) {
  /* The toolbar's Duplicate and Delete ARE ⌘D and Delete: they run the same
     commands, so the copy is selected (board 5940:147595 selects "Hero 2"),
     decision #17's multi-delete confirm applies, and the toast is the one the
     keyboard path already speaks (useClipboardToasts / useHistoryFeedback) —
     the toolbar used to build its own, with different words. */
  const handleToolbarDuplicate = React.useCallback(() => {
    composer?.commands.run("duplicate");
  }, [composer]);

  const handleToolbarDelete = React.useCallback(() => {
    composer?.commands.run("delete");
  }, [composer]);

  return {
    handleToolbarDuplicate,
    handleToolbarDelete,
  };
}
