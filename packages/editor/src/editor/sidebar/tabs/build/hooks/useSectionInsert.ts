/**
 * useSectionInsert — handles section (HTML blob) insertion from the Sections
 * tab into the active page root.
 *
 * Mirrors useBlockInsertion but inserts via composer.elements.insertHTMLToElement
 * since each section is a production-HTML snippet, not a single element.
 *
 * Spam-guarded so a fast double-click doesn't re-insert. Wraps everything in
 * a single history transaction so undo removes the whole section in one step.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import type { SectionCard } from "../catalog/sections";
import { useToast } from "../../../../../shared/ui/Toast";

export interface UseSectionInsertResult {
  handleSectionClick: (card: SectionCard) => void;
  isInserting: boolean;
}

export function useSectionInsert(composer: Composer | null): UseSectionInsertResult {
  const { addToast } = useToast();
  const [isInserting, setIsInserting] = React.useState(false);

  const handleSectionClick = React.useCallback(
    (card: SectionCard) => {
      if (isInserting) return;

      if (!composer) {
        addToast({ message: "Editor not ready. Please wait.", variant: "warning" });
        return;
      }

      setIsInserting(true);
      composer.beginTransaction("insert-section-sidebar");
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

        // Sections always insert at the end of the page root — they are
        // full-width layout chunks, not nested content. Selection is ignored
        // on purpose, unlike useBlockInsertion's smart-placement logic.
        const inserted = composer.elements.insertHTMLToElement(
          root.getId(),
          card.html,
          root.getChildCount()
        );

        if (inserted && inserted.length > 0) {
          composer.selection.select(inserted[0]);
          addToast({
            message: `Inserted: ${card.name}`,
            variant: "success",
            duration: 2000,
          });
        } else {
          addToast({
            message: `Couldn't insert ${card.name}. Section HTML may be invalid.`,
            variant: "error",
          });
        }
      } catch (err) {
        addToast({
          message: `Error inserting section: ${err instanceof Error ? err.message : "Unknown error"}`,
          variant: "error",
        });
      } finally {
        composer.endTransaction();
        setTimeout(() => setIsInserting(false), 150);
      }
    },
    [composer, addToast, isInserting]
  );

  return { handleSectionClick, isInserting };
}
