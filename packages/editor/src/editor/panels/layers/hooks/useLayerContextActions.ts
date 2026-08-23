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
          if (composer) {
            const data = composer.elements.serializeElement(nodeId);
            composer.clipboard = data ? [data] : null;
          }
          break;
        }
        case "cut": {
          if (!composer) break;
          const cutData = composer.elements.serializeElement(nodeId);
          composer.clipboard = cutData ? [cutData] : null;
          actionsHook.deleteLayer(nodeId, treeHook.layers, () => selectionHook.clearSelection());
          break;
        }
        case "paste": {
          /* Select the clicked row, then run the ENGINE command.
             This used to resolve its own target as `target.getParent() ?? target`
             and call pasteElement directly — two bugs codex found in review:
             a container row pasted into the container's PARENT rather than into
             the container, and pasteElement does no legality check at all (it
             calls addChild straight), so this path could nest a heading inside a
             heading, which the engine's own paste exists to prevent. Running the
             registry command gets the per-item target resolution, the nesting
             rules, the sibling index and the transaction — and deletes the
             duplicate implementation. */
          if (!composer?.clipboard?.length) break;
          const target = composer.elements.getElement(nodeId);
          if (!target) break;
          composer.selection.select(target);
          composer.commands.run("paste");
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
