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
import type { BlockData } from "../../../shared/types";
import { useToast } from "../../../shared/ui/Toast";
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
        addToast({ message: "Editor not ready. Please wait.", variant: "warning" });
        return;
      }

      setIsInsertingBlock(true);
      composer.beginTransaction("insert-block-sidebar");
      try {
        const page = composer.elements.getActivePage();
        if (!page) {
          addToast({ message: "No active page. Please select a page first.", variant: "error" });
          return;
        }
        const root = composer.elements.getElement(page.root.id);
        if (!root) {
          addToast({ message: "Page root element not found.", variant: "error" });
          return;
        }

        const def = getBlockDefinitions().find((b) => b.id === block.id);
        if (!def) {
          addToast({ message: `Block "${block.label}" not found in registry.`, variant: "error" });
          return;
        }

        // Smart placement: insert into selected container if valid, otherwise into root
        const selectedIds = composer.selection.getSelectedIds();
        let parentId = root.getId();
        let insertIndex: number | undefined = root.getChildCount();

        if (selectedIds.length === 1) {
          const selectedEl = composer.elements.getElement(selectedIds[0]);
          if (selectedEl) {
            const selectedType = selectedEl.getType();
            const canContain = canNestElement(def.elementType, selectedType);
            if (canContain) {
              parentId = selectedEl.getId();
              insertIndex = selectedEl.getChildCount?.() ?? 0;
            } else {
              const parentEl = selectedEl.getParent();
              if (parentEl) {
                const siblingIndex = parentEl
                  .getChildren()
                  .findIndex((c) => c.getId() === selectedEl.getId());
                parentId = parentEl.getId();
                insertIndex = siblingIndex >= 0 ? siblingIndex + 1 : undefined;
              }
            }
          }
        }

        const insertedId = insertBlock(composer, def, parentId, insertIndex);
        if (insertedId) {
          const el = composer.elements.getElement(insertedId);
          if (el) composer.selection.select(el);
          addToast({ message: `Inserted: ${block.label}`, variant: "success", duration: 2000 });
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
            message: `Can't add ${block.label} — ${parentType} doesn't allow it. ${suggestionText}`,
            variant: "warning",
            duration: 5000,
          });
        }
      } catch (err) {
        addToast({
          message: `Error inserting block: ${err instanceof Error ? err.message : "Unknown error"}`,
          variant: "error",
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
