/**
 * useBlockInsertion — handles block insertion from the sidebar Build tab
 *
 * Extracted from StudioPanels.tsx so the panel component is layout-only.
 * Encapsulates: spam guard, smart parent resolution, history transaction, toast feedback.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { getBlockDefinitions, insertBlock } from "../../../blocks/blockRegistry";
import type { Composer } from "../../../engine";
import type { BlockData, ElementType } from "../../../shared/types";
import { useToast } from "@/editor/shared/vibcoder";
import { animateDropSuccess } from "../../../shared/utils/dragDrop/animations";
import { canNestElement, getSuggestedParents } from "../../../shared/utils/nesting";

export interface UseBlockInsertionResult {
  handleBlockClick: (block: BlockData) => void;
  isInsertingBlock: boolean;
}

export function useBlockInsertion(composer: Composer | null): UseBlockInsertionResult {
  const { addToast } = useToast();
  const [isInsertingBlock, setIsInsertingBlock] = React.useState(false);

  const handleBlockClick = React.useCallback(
    (block: BlockData) => {
      // Prevent spam clicking during insertion
      if (isInsertingBlock) return;

      if (!composer) {
        addToast({ description: "Editor not ready. Please wait.", tone: "warning" });
        return;
      }

      setIsInsertingBlock(true);
      composer.beginTransaction("insert-block-sidebar");
      try {
        const page = composer.elements.getActivePage();
        if (!page) {
          addToast({ description: "No active page. Please select a page first.", tone: "error" });
          return;
        }
        const root = composer.elements.getElement(page.root.id);
        if (!root) {
          addToast({ description: "Page root element not found.", tone: "error" });
          return;
        }

        const def = getBlockDefinitions().find((b) => b.id === block.id);
        if (!def) {
          addToast({ description: `Block "${block.label}" not found in registry.`, tone: "error" });
          return;
        }

        // Smart placement: walk up from the selected element looking for the
        // nearest ancestor that can accept this block. Insert into selected if
        // it is itself a valid container; otherwise insert as sibling at the
        // ancestor's child list, after whichever descendant is on the
        // selected element's path. If no ancestor accepts the block, fall
        // back to the page root. This prevents silent-fail cascades where
        // one-level lookups give up after a single rejection.
        const selectedIds = composer.selection.getSelectedIds();
        let parentId = root.getId();
        let insertIndex: number | undefined = root.getChildCount();

        if (selectedIds.length === 1) {
          const selectedEl = composer.elements.getElement(selectedIds[0]);
          if (selectedEl) {
            let candidate: ReturnType<typeof composer.elements.getElement> = selectedEl;
            let childOnPath = selectedEl;
            let isSelected = true;

            while (candidate) {
              const canContain = canNestElement(
                def.elementType,
                candidate.getType() as ElementType
              );
              if (canContain) {
                if (isSelected) {
                  // Selected itself accepts the block: insert inside at end.
                  parentId = candidate.getId();
                  insertIndex = candidate.getChildCount?.() ?? 0;
                } else {
                  // Inserting as sibling of whichever descendant of candidate
                  // sits on the selection path.
                  const siblingIdx = candidate
                    .getChildren()
                    .findIndex((c) => c.getId() === childOnPath.getId());
                  parentId = candidate.getId();
                  insertIndex = siblingIdx >= 0 ? siblingIdx + 1 : candidate.getChildCount?.();
                }
                break;
              }
              // Walk up. getParent() returns Element | null; normalize to
              // undefined so the loop guard (while candidate) exits cleanly.
              childOnPath = candidate;
              candidate = candidate.getParent() ?? undefined;
              isSelected = false;
            }
            // candidate === null means nothing up to (and including) root
            // accepts this block. The initial root-fallback parentId/insertIndex
            // values are already set above, so the insert still tries.
          }
        }

        const insertedId = insertBlock(composer, def, parentId, insertIndex);
        if (insertedId) {
          const el = composer.elements.getElement(insertedId);
          if (el) composer.selection.select(el);
          // Post-insert highlight flash — parity with drag-drop success animation.
          setTimeout(() => {
            const domEl = document.querySelector(
              `[data-buildrick-id="${insertedId}"]`
            ) as HTMLElement | null;
            if (domEl) void animateDropSuccess(domEl);
          }, 0);

          // Media elements without a src need an asset — open Media tab picker
          const mediaTypes = new Set(["image", "video", "audio", "icon", "svg", "lottie"]);
          if (mediaTypes.has(def.elementType) && el && !el.getAttribute("src")) {
            composer.emit("element:needs-asset", {
              elementId: insertedId,
              type: def.elementType,
            });
          }

          addToast({ description: `Inserted: ${block.label}`, tone: "success", duration: 2000 });
        } else {
          // Build contextual nesting error message
          const parentEl = composer.elements.getElement(parentId);
          const parentType = parentEl?.getType?.() ?? "this element";
          const suggestions = getSuggestedParents(def.elementType);
          const suggestionText =
            suggestions.length > 0
              ? `Try selecting a ${suggestions.slice(0, 2).join(" or ")} first.`
              : "Select a container element and try again.";
          addToast({
            description: `Can't add ${block.label} — ${parentType} doesn't allow it. ${suggestionText}`,
            tone: "warning",
            duration: 5000,
          });
        }
      } catch (err) {
        addToast({
          description: `Error inserting block: ${err instanceof Error ? err.message : "Unknown error"}`,
          tone: "error",
        });
      } finally {
        composer.endTransaction();
        // Small delay to prevent rapid re-clicks
        setTimeout(() => setIsInsertingBlock(false), 150);
      }
    },
    [composer, addToast, isInsertingBlock]
  );

  return { handleBlockClick, isInsertingBlock };
}
