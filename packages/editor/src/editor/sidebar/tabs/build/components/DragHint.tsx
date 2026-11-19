/**
 * The drag-only Add panel (owner rule 2026-11-19): a mouse click on an Add
 * item — an element, a block, a saved component — does not insert. It shows
 * this hint under the item and nothing else; dragging onto the canvas
 * inserts.
 *
 * The keyboard still inserts (Enter, Space — an a11y contract), and so does
 * any click with no pointer behind it: `detail` is 0 for a click the keyboard
 * or assistive technology dispatched on a button, ≥ 1 for a real pointer.
 * ⌘K's "Add …" rows are commands, not the panel, and keep inserting.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BK_TOOLTIP_CLASS } from "@/editor/chrome-ui";

export const DRAG_HINT_TEXT = "Drag onto the canvas to add";

/** How long the hint stays up after a click. */
const HINT_MS = 2000;

/** A pointer click (only hints) rather than a keyboard / AT activation (inserts). */
export const isPointerClick = (e: React.MouseEvent): boolean => e.detail > 0;

/** Shows the hint under an anchor inside `container` (positioned relative). */
export function useDragHint(container: React.RefObject<HTMLElement | null>) {
  const [at, setAt] = React.useState<{ top: number; left: number } | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const show = React.useCallback(
    (anchor: HTMLElement) => {
      const box = container.current?.getBoundingClientRect();
      const rect = anchor.getBoundingClientRect();
      setAt({ top: box ? rect.bottom - box.top + 4 : 0, left: box ? Math.max(8, rect.left - box.left) : 8 });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setAt(null), HINT_MS);
    },
    [container],
  );
  const bubble = at ? (
    <div
      role="tooltip"
      data-testid="add-drag-hint"
      style={{ top: at.top, left: at.left }}
      className={`tw:pointer-events-none tw:absolute tw:z-10 tw:bg-[var(--bk-gray-900)] tw:font-medium tw:shadow-sm ${BK_TOOLTIP_CLASS}`}
    >
      {DRAG_HINT_TEXT}
    </div>
  ) : null;
  return { show, bubble };
}
