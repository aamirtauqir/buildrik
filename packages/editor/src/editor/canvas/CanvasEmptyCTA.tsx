/**
 * Canvas Empty State CTA
 * Shown when the canvas has no content.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/ui";

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
      {/* Plus icon */}
      <svg
        className="bd-canvas-empty-cta__icon"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <h3 className="bd-canvas-empty-cta__title">Start building</h3>
      <p className="bd-canvas-empty-cta__desc">
        Click + in the sidebar to add elements, or drag a template onto the canvas.
      </p>
      <Button className="bd-canvas-empty-cta__browse" onClick={onBrowseTemplates}>
        Browse templates
      </Button>
      <Button className="bd-canvas-empty-cta__blank" onClick={onStartBlank}>
        Start Blank
      </Button>
    </div>
  );
}
