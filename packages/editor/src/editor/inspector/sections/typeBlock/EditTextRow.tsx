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
import { useInspectorField } from "@/editor/inspector/shared/controls/InspectorFieldContext";
import { WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";

interface EditTextRowProps {
  composer: Composer | null | undefined;
  elementId: string;
}

export function EditTextRow({ composer, elementId }: EditTextRowProps) {
  /* Read-only (locked, save conflict — DD-18): the door stays visible and
     focusable, and the click is refused here — never `disabled`. */
  const { readOnly } = useInspectorField();
  /* A bound text comes from its record (D01 / B5-D04 draw no edit door):
     what the canvas would edit is the record's value. */
  const bound = composer?.cms?.bindings?.getBindings?.(elementId)?.some((b) => b.property === "content");
  if (!composer || bound) return null;
  return (
    /* 2L9 161:8480: a full-width bordered button under the "Text" row. */
    <div className="tw:flex tw:items-center tw:py-1" data-testid="inspector-text-content">
      <Button
        type="button"
        size="xs"
        color="light"
        className={WIDE_BUTTON}
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
