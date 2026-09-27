/**
 * EditTextRow — the type block's "Edit text on canvas" action (boards 1, 4,
 * 5, 15). It starts the canvas's own inline edit, the same edit a
 * double-click starts (G2-027); it is the keyboard route to it until an
 * Enter/F2 edit key exists (D-9). The text itself is never edited in a
 * textarea here (R-DD-9).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { Composer } from "@/engine/Composer";
import { EVENTS } from "@/shared/constants/events";

interface EditTextRowProps {
  composer: Composer | null | undefined;
  elementId: string;
}

export function EditTextRow({ composer, elementId }: EditTextRowProps) {
  if (!composer) return null;
  return (
    <div className="tw:flex tw:justify-end tw:py-0.5" data-testid="inspector-text-content">
      <Button
        type="button"
        size="xs"
        color="light"
        className="tw:h-6 tw:w-40 tw:justify-center tw:border-0 tw:bg-transparent tw:px-2 tw:text-[12px] tw:font-normal tw:text-[var(--bk-accent-text)] tw:hover:bg-[var(--bk-accent-tint)]"
        onClick={() => composer.emit(EVENTS.UI_INLINE_EDIT_REQUEST, { elementId })}
        data-testid="inspector-edit-text-on-canvas"
      >
        Edit text on canvas
      </Button>
    </div>
  );
}
