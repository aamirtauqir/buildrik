/**
 * useCanvasToolbarActions
 * Toolbar action callbacks for the unified selection toolbar.
 * Extracted from Canvas.tsx for maintainability.
 *
 * @module components/Canvas/hooks/useCanvasToolbarActions
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ToastInput } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";

interface UseCanvasToolbarActionsParams {
  composer: Composer | null;
  selectedId: string | null;
  addToast: (toast: ToastInput) => string;
}

export function useCanvasToolbarActions({
  composer,
  selectedId,
  addToast,
}: UseCanvasToolbarActionsParams) {
  const handleToolbarDuplicate = React.useCallback(() => {
    if (!composer || !selectedId) return;
    const created = composer.elements.duplicateElement?.(selectedId);
    if (created) {
      addToast({
        description: "Element duplicated",
        tone: "info",
        duration: 2000,
        action: { label: "Undo", onClick: () => composer.history.undo() },
      });
    }
  }, [composer, selectedId, addToast]);

  const handleToolbarDelete = React.useCallback(() => {
    if (!composer || !selectedId) return;
    const element = composer.elements.getElement(selectedId);
    const elType = element?.getType?.() || "element";
    const childCount = element?.getChildren?.()?.length || 0;
    const elName = elType.charAt(0).toUpperCase() + elType.slice(1);

    composer.beginTransaction("delete-element");
    composer.elements.removeElement(selectedId);
    composer.endTransaction();

    const message =
      childCount > 0
        ? `${elName} (${childCount} ${childCount === 1 ? "child" : "children"}) deleted`
        : `${elName} deleted`;
    addToast({
      description: message,
      tone: "info",
      duration: 5000,
      action: { label: "Undo", onClick: () => composer.history.undo() },
    });
  }, [composer, selectedId, addToast]);

  return {
    handleToolbarDuplicate,
    handleToolbarDelete,
  };
}
