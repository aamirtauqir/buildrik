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
 * build lives behind these six." · Got it). That is not built here: it has its
 * own boards in the S1 flow family (S1.1 · coach-dismissed, S1.1b, S1.1c),
 * which own its copy, its dismissal and what each button opens.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";

interface CanvasEmptyCTAProps {
  onBrowseTemplates: () => void;
  onStartBlank: () => void;
}

export function CanvasEmptyCTA({
  onBrowseTemplates,
  onStartBlank,
}: CanvasEmptyCTAProps): React.ReactElement {
  return (
    <div className="bd-canvas-empty-cta" role="status" aria-label="Canvas is empty">
      <p className="bd-canvas-empty-cta__title">
        Start with a template, or drop your first section.
      </p>
      <div className="bd-canvas-empty-cta__actions">
        <Button onClick={onBrowseTemplates}>Browse templates</Button>
        <Button color="light" onClick={onStartBlank}>
          Start blank
        </Button>
      </div>
    </div>
  );
}
