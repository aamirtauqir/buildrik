/**
 * LayersEmptyState - Empty state for Layers panel when canvas has no elements.
 * @license BSD-3-Clause
 */

import * as React from "react";

const LayersIcon: React.FC = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

export const LayersEmptyState: React.FC = () => (
  <div className="aqb-layers-empty-state-custom">
    <div className="aqb-les-icon-wrap">
      <LayersIcon />
    </div>
    <p className="aqb-les-heading">No layers yet</p>
    <p className="aqb-les-sub">Add elements to your canvas to see them here.</p>
  </div>
);

export default LayersEmptyState;
