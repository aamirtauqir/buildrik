/**
 * useLayerContextActions - Handles actions dispatched from the right-click context menu.
 * Bridges LayerContextMenu → useLayerActions / useLayerSelection / useLayerTree.
 *
 * With the clicked row inside a multi-selection (board 6881:71323), cut / copy
 * / duplicate / delete act on the WHOLE selection through the engine's own
 * commands — `composer.selection` is the single source of truth the tree
 * mirrors, and the registry commands prune to top-most elements and wrap one
 * transaction (defaultCommands.ts). Delete of N > 1 asks first (board
 * 6887:78291), which is the panel's dialog: `requestDeleteSelection`.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { findById } from "../data/layerUtils";
import type { LayerAction } from "../types";
import type { UseLayersStateReturn } from "./useLayersState";
import { useToast } from "@/editor/chrome-ui";

export interface LayerContextActionOptions {
  /** Delete asked for N ≥ 2 elements — open the confirm (board 6887:78291). */
  requestDeleteSelection: () => void;
  /** "Move to page…" — open the page picker (board 4418:82847) for these ids. */
  requestMoveToPage: (ids: string[]) => void;
}

export function useLayerContextActions(
  state: UseLayersStateReturn,
  { requestDeleteSelection, requestMoveToPage }: LayerContextActionOptions,
) {
  const { composer, actionsHook, treeHook, selectionHook } = state;
  const { addToast } = useToast();
  return React.useCallback(
    (action: LayerAction, nodeId: string) => {
      const syntheticEvent = { stopPropagation: () => {} } as unknown as React.MouseEvent;
      /* The clicked row is one of two or more selected rows: the menu was the
         selection's, so the action is too. */
      const multi = selectionHook.selectedIds.size >= 2 && selectionHook.selectedIds.has(nodeId);
      switch (action) {
        // Board 1082:4527 Cut/Copy/Paste — the same composer.clipboard
        // contract the canvas ⌘X/⌘C/⌘V path uses (useCanvasKeyboard).
        case "copy": {
          if (!composer) break;
          if (multi) {
            composer.commands.run("copy");
            break;
          }
          const data = composer.elements.serializeElement(nodeId);
          composer.clipboard = data ? [data] : null;
          break;
        }
        case "copyLink": {
          /* Board 1082:4527's "Copy link": a URL that reopens THIS editor with
             this element selected. The page id rides along because the element
             registry only holds the active page — the consumer (useDeepLink)
             has to activate the page before it can select. Clipboard failures
             surface as a toast rather than silently copying nothing. */
          const pageId = composer?.elements.getActivePage?.()?.id;
          const url = new URL(window.location.href);
          url.searchParams.set("el", nodeId);
          if (pageId) url.searchParams.set("page", pageId);
          navigator.clipboard.writeText(url.toString()).then(
            () => addToast({ description: "Link copied — opens the editor with this element selected", tone: "success" }),
            () => addToast({ description: "Couldn't copy the link", tone: "error" }),
          );
          break;
        }
        case "cut": {
          if (!composer) break;
          if (multi) {
            composer.commands.run("cut");
            break;
          }
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
          if (multi) composer?.commands.run("duplicate");
          else actionsHook.duplicateLayer(nodeId);
          break;
        case "hide":
        case "show":
          actionsHook.toggleVisibility(nodeId, syntheticEvent);
          break;
        case "lock":
        case "unlock":
          actionsHook.toggleLock(nodeId, syntheticEvent);
          break;
        case "delete": {
          /* Decision #17: a Layers delete is instant, with the same Undo toast
             the canvas gives — never a confirm for one row. Two or more ask
             first. */
          if (multi) {
            requestDeleteSelection();
            break;
          }
          const node = findById(treeHook.layers, nodeId);
          const type = actionsHook.customNames.get(nodeId) ?? node?.type ?? "Element";
          const label = type.charAt(0).toUpperCase() + type.slice(1);
          actionsHook.deleteLayer(nodeId, treeHook.layers, () => selectionHook.clearSelection());
          addToast({
            description: `${label} deleted`,
            tone: "info",
            action: { label: "Undo", onClick: () => composer?.history.undo() },
          });
          break;
        }
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
        case "moveToPage":
          requestMoveToPage(multi ? [...selectionHook.selectedIds] : [nodeId]);
          break;
      }
    },
    [composer, actionsHook, treeHook, selectionHook, addToast, requestDeleteSelection, requestMoveToPage]
  );
}
