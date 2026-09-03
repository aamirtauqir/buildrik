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
    <div className="bd-canvas-empty-cta" role="status" aria-label="Canvas is empty">
      <p className="bd-canvas-empty-cta__title">
        {started
          ? "Drop an element from the Insert panel, or drag a section."
          : "Start with a template, or drop your first section."}
      </p>
      {!started && (
        <div className="bd-canvas-empty-cta__actions">
          <Button onClick={onBrowseTemplates}>Browse templates</Button>
          <Button color="light" onClick={onStartBlank}>
            Start blank
          </Button>
        </div>
      )}
    </div>
  );
}
