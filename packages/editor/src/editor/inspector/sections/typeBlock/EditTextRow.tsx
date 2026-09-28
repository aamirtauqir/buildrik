/**
 * EditTextRow — the type block's "Edit text on canvas" action (boards 1, 4,
 * 5, 15). `elementId` is the element holding the text — for a checkbox, the
 * text beside its box, not the label that wraps both. It starts the canvas's own inline edit, the same edit a
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
import { useInspectorField } from "../../shared/controls/InspectorFieldContext";

interface EditTextRowProps {
  composer: Composer | null | undefined;
  elementId: string;
}

export function EditTextRow({ composer, elementId }: EditTextRowProps) {
  /* Read-only (locked, save conflict — DD-18): the door stays visible and
     focusable, and the click is refused here — never `disabled`. */
  const { readOnly } = useInspectorField();
  if (!composer) return null;
  return (
    <div className="tw:flex tw:h-6 tw:items-center tw:justify-end" data-testid="inspector-text-content">
      <Button
        type="button"
        size="xs"
        color="light"
        className="tw:h-6 tw:w-40 tw:justify-center tw:border-0 tw:bg-transparent tw:px-2 tw:text-[12px] tw:font-normal tw:text-[var(--bk-accent-text)] tw:hover:bg-[var(--bk-accent-tint)]"
        aria-disabled={readOnly || undefined}
        onClick={() => {
          if (!readOnly) composer.emit(EVENTS.UI_INLINE_EDIT_REQUEST, { elementId });
        }}
        data-testid="inspector-edit-text-on-canvas"
      >
        Edit text on canvas
      </Button>
    </div>
  );
}
