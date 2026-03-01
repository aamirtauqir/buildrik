/**
 * useSelectionAnnouncement
 * Produces screen-reader announcement text when the canvas selection changes.
 * Used by the aria-live="polite" region in Canvas.tsx (WCAG 4.1.3).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";

export interface UseSelectionAnnouncementOptions {
  composer: Composer | null;
  selectedId: string | null;
  selectedIds: string[];
}

/**
 * Returns `announcement` — a string to place in an aria-live region.
 * The string is only updated when the selection actually changes, preventing
 * spurious re-announcements on unrelated re-renders.
 */
export function useSelectionAnnouncement({
  composer,
  selectedId,
  selectedIds,
}: UseSelectionAnnouncementOptions): string {
  const [announcement, setAnnouncement] = React.useState<string>("");
  const prevRef = React.useRef<string>("");

  React.useEffect(() => {
    let next = "";

    if (selectedIds.length > 1) {
      next = `Selected ${selectedIds.length} elements`;
    } else if (selectedId !== null) {
      const elType = composer?.elements.getElement(selectedId)?.getType?.() ?? "element";
      next = `Selected: ${elType}`;
    } else {
      // Transition from having a selection → nothing selected
      if (prevRef.current !== "") {
        next = "Selection cleared";
      }
    }

    if (next !== prevRef.current) {
      prevRef.current = next;
      setAnnouncement(next);
    }
  }, [selectedId, selectedIds, composer]);

  return announcement;
}
