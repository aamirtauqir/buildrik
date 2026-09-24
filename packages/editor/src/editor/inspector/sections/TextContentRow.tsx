/**
 * TextContentRow — board 4418:107674: a text element's inspector opens with
 * "Text content · Edit this text on the canvas. · [Edit text on canvas]",
 * which starts the canvas's own inline edit (4418:126485) — the same edit a
 * double-click starts (G2-027).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine/Composer";
import { EVENTS } from "../../../shared/constants/events";

/** Element types whose text is edited on the canvas. */
const TEXT_TYPES = new Set(["heading", "text", "paragraph", "link", "button"]);

interface TextContentRowProps {
  composer: Composer | null | undefined;
  selectedElement: { id: string; type: string };
}

export function TextContentRow({ composer, selectedElement }: TextContentRowProps) {
  if (!composer || !TEXT_TYPES.has(selectedElement.type)) return null;
  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:border-b tw:border-[var(--bk-border)] tw:px-4 tw:py-3" data-testid="inspector-text-content">
      <span className="tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-ink)]">Text content</span>
      <span className="tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-soft)]">Edit this text on the canvas.</span>
      <Button
        type="button"
        size="xs"
        className="tw:mt-1 tw:h-7 tw:self-start tw:px-3"
        onClick={() => composer.emit(EVENTS.UI_INLINE_EDIT_REQUEST, { elementId: selectedElement.id })}
        data-testid="inspector-edit-text-on-canvas"
      >
        Edit text on canvas
      </Button>
    </div>
  );
}
