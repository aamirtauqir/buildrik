/**
 * Canvas Empty State CTA
 * Shown when the canvas has no content.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

interface CanvasEmptyCTAProps {
  onBrowseTemplates: () => void;
  onStartBlank: () => void;
}

export function CanvasEmptyCTA({
  onBrowseTemplates,
  onStartBlank,
}: CanvasEmptyCTAProps): React.ReactElement {
  return (
    <div className="aqb-canvas-empty-cta" role="status" aria-label="Canvas is empty">
      <svg
        className="aqb-canvas-empty-cta__icon"
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
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
      </svg>
      <h3 className="aqb-canvas-empty-cta__title">Your Canvas is Empty</h3>
      <p className="aqb-canvas-empty-cta__desc">Start with a template or build from scratch</p>
      <button className="aqb-canvas-empty-cta__browse" onClick={onBrowseTemplates}>
        Browse Templates
      </button>
      <button className="aqb-canvas-empty-cta__blank" onClick={onStartBlank}>
        Start Blank
      </button>
    </div>
  );
}
