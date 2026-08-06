/**
 * useLayerContextActions - Handles actions dispatched from the right-click context menu.
 * Bridges LayerContextMenu → useLayerActions / useLayerSelection / useLayerTree.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { findById } from "../data/layerUtils";
import type { LayerAction } from "../types";
import type { UseLayersStateReturn } from "./useLayersState";

export function useLayerContextActions(state: UseLayersStateReturn) {
  const { composer, actionsHook, treeHook, selectionHook } = state;
  return React.useCallback(
    (action: LayerAction, nodeId: string) => {
      const syntheticEvent = { stopPropagation: () => {} } as unknown as React.MouseEvent;
      switch (action) {
        // Board 1082:4527 Cut/Copy/Paste — the same composer.clipboard
        // contract the canvas ⌘X/⌘C/⌘V path uses (useCanvasKeyboard).
        case "copy": {
          if (composer) composer.clipboard = composer.elements.serializeElement(nodeId);
          break;
        }
        case "cut": {
          if (!composer) break;
          composer.clipboard = composer.elements.serializeElement(nodeId);
          actionsHook.deleteLayer(nodeId, treeHook.layers, () => selectionHook.clearSelection());
          break;
        }
        case "paste": {
          if (!composer?.clipboard) break;
          const target = composer.elements.getElement(nodeId);
          const parent = target?.getParent?.() ?? target;
          if (!parent) break;
          composer.beginTransaction("paste-element");
          try {
            const pasted = composer.elements.pasteElement?.(composer.clipboard, parent);
            if (pasted) composer.selection.select(pasted);
          } finally {
            composer.endTransaction();
          }
          break;
        }
        case "rename": {
          const node = findById(treeHook.layers, nodeId);
          const displayName = actionsHook.customNames.get(nodeId) ?? node?.type ?? nodeId;
          actionsHook.startEditing(nodeId, displayName, syntheticEvent);
          break;
        }
        case "duplicate":
          actionsHook.duplicateLayer(nodeId);
          break;
        case "hide":
        case "show":
          actionsHook.toggleVisibility(nodeId, syntheticEvent);
          break;
        case "lock":
        case "unlock":
          actionsHook.toggleLock(nodeId, syntheticEvent);
          break;
        case "delete":
          actionsHook.deleteLayer(nodeId, treeHook.layers, () => selectionHook.clearSelection());
          break;
        case "group":
          actionsHook.groupLayers([...selectionHook.selectedIds], treeHook.layers);
          break;
        case "selectChildren": {
          const node = findById(treeHook.layers, nodeId);
          if (node && node.children.length > 0) {
            node.children.forEach((child, i) =>
              selectionHook.selectLayer(child.id, { meta: i > 0 })
            );
          }
          break;
        }
        case "moveToTop":
          actionsHook.moveToTop(nodeId, treeHook.layers);
          break;
        case "moveToBottom":
          actionsHook.moveToBottom(nodeId, treeHook.layers);
          break;
      }
    },
    [composer, actionsHook, treeHook, selectionHook]
  );
}
