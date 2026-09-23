/**
 * CanvasEmptyCTA — board 65:2 (Shell state 1 · First run).
 *
 * One sentence and two buttons side by side. What the board does not carry and
 * this component used to: a plus glyph, a second paragraph explaining where the
 * sidebar is, and a stacked underlined "Start Blank" text link. The board makes
 * the two routes equal-weight siblings — template or blank — rather than a
 * primary action with an afterthought under it.
 *
 * The buttons are chrome-ui Buttons now. The old ones were `<Button>` with the
 * DS overridden back out in CSS (own background, own radius, own weight), which
 * is the same as not using it.
 *
 * Board 65:2 also draws a first-run coach mark over the rail ("Everything you
 * build lives behind these six." · Got it). That is not built here: it lives in
 * `editor/onboarding/RailCoach.tsx`, which owns its copy and its dismissal.
 *
 * Board 807:6558 is what Start blank leads to — the Insert drawer open, and
 * this sentence replaced by the next instruction rather than removed. Pressing
 * it used to hide the CTA and nothing else, which left a first-time user on an
 * empty canvas with no drawer, no guidance and nothing to press.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";

interface CanvasEmptyCTAProps {
  onBrowseTemplates: () => void;
  onStartBlank: () => void;
  /**
   * Board 807:6558 — after Start blank. The page is still empty, so the
   * invitation stays; it becomes the next instruction and drops its buttons,
   * because the Insert drawer it just opened is where the next act is.
   */
  started?: boolean;
}

export function CanvasEmptyCTA({
  onBrowseTemplates,
  onStartBlank,
  started,
}: CanvasEmptyCTAProps): React.ReactElement {
  return (
    <div className="bd-canvas-empty-cta" role="status" aria-label="Canvas is empty" data-testid="canvas-empty-cta">
      <p className="bd-canvas-empty-cta__title" data-testid="canvas-empty-cta-title">
        {started
          ? "Drop an element from the Insert panel, or drag a section."
          : "Start with a template, or drop your first section."}
      </p>
      {!started && (
        <div className="bd-canvas-empty-cta__actions" data-testid="canvas-empty-cta-actions">
          <Button onClick={onBrowseTemplates} className={PRIMARY} data-testid="canvas-empty-browse">
            Browse templates
          </Button>
          <Button color="light" onClick={onStartBlank} className={SECONDARY} data-testid="canvas-empty-start-blank">
            Start blank
          </Button>
        </div>
      )}
    </div>
  );
}

/* Board 338:2326 is a real Button COMPONENT instance and settles the primary:
   32 tall, 16 across, 10 top/bottom, radius 8. flowbite's size-md defaults are
   h-10/px-5, and only a SAME-property utility unseats them — `tw:h-8` does,
   a `min-h` would not (CLAUDE.md §Chrome Routing). */
const PRIMARY = "tw:h-8 tw:px-4 tw:py-2.5 tw:rounded-lg";
/* 297:2013, the "Start blank" box, is NOT a component instance — it is a
   hand-drawn frame beside a real one, and it disagrees with its neighbour on
   every shared property: 34 tall to the Button's 32 (exactly 32 + its own two
   1px strokes, which Figma draws outside the box and CSS draws inside), and
   `--radius/sm` where DESIGN.md puts every button on radius-lg. Its LABEL is
   the part that reads as a decision rather than a stub — 13 to the primary's
   14, a quieter secondary — and that is the part adopted, and the part the
   recipe joins. Height matches its sibling; radius follows DESIGN.md. */
const SECONDARY = "tw:h-8 tw:px-[14px] tw:rounded-lg tw:text-[13px] tw:leading-5";
