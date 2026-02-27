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
import type { Element } from "../../../engine/elements/Element";
import type { ToastProps } from "../../../shared/ui/Toast";

interface UseCanvasToolbarActionsParams {
  composer: Composer | null;
  selectedId: string | null;
  addToast: (toast: Omit<ToastProps, "id">) => string;
  select: (elementOrId: Element | string | null) => void;
}

export function useCanvasToolbarActions({
  composer,
  selectedId,
  addToast,
  select,
}: UseCanvasToolbarActionsParams) {
  const handleSelectParent = React.useCallback(() => {
    if (!composer || !selectedId) return;
    const element = composer.elements.getElement(selectedId);
    const parent = element?.getParent();
    if (parent) {
      select(parent);
    }
  }, [composer, selectedId, select]);

  const handleSelectAncestor = React.useCallback(
    (ancestorId: string) => {
      if (!composer) return;
      const element = composer.elements.getElement(ancestorId);
      if (element) {
        select(element);
      }
    },
    [composer, select]
  );

  const handleToolbarDuplicate = React.useCallback(() => {
    if (!composer || !selectedId) return;
    composer.elements.duplicateElement?.(selectedId);
  }, [composer, selectedId]);

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
      message,
      variant: "info",
      duration: 5000,
      action: { label: "Undo", onClick: () => composer.history.undo() },
    });
  }, [composer, selectedId, addToast]);

  const handleToolbarCopy = React.useCallback(() => {
    if (!composer || !selectedId) return;
    const element = composer.elements.getElement(selectedId);
    if (element) {
      composer.clipboard = element.toJSON?.() || null;
      const elType = element.getType?.() || "element";
      const elName = elType.charAt(0).toUpperCase() + elType.slice(1);
      addToast({
        message: `${elName} copied to clipboard`,
        variant: "info",
        duration: 2000,
      });
    }
  }, [composer, selectedId, addToast]);

  const handleToolbarWrap = React.useCallback(() => {
    if (!composer || !selectedId) return;
    const element = composer.elements.getElement(selectedId);
    element?.wrap?.("container");
  }, [composer, selectedId]);

  const handleToolbarMoveUp = React.useCallback(() => {
    if (!composer) return;
    composer.commands.run("bring-forward");
  }, [composer]);

  const handleToolbarMoveDown = React.useCallback(() => {
    if (!composer) return;
    composer.commands.run("send-backward");
  }, [composer]);

  const handleToolbarUndo = React.useCallback(() => {
    composer?.history.undo();
  }, [composer]);

  return {
    handleSelectParent,
    handleSelectAncestor,
    handleToolbarDuplicate,
    handleToolbarDelete,
    handleToolbarCopy,
    handleToolbarWrap,
    handleToolbarMoveUp,
    handleToolbarMoveDown,
    handleToolbarUndo,
  };
}
