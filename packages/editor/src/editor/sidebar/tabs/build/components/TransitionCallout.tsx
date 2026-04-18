/**
 * TransitionCallout — one-time notice shown to users whose Quick Picks
 * were removed in the v4 refactor. Purely presentational; lifecycle is
 * owned by useCallout hook.
 */

import * as React from "react";

export const TransitionCallout: React.FC = () => (
  <div className="bld-change-callout" role="status">
    <svg
      className="bld-change-callout-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <div className="bld-change-callout-text">
      <strong>Quick Picks removed.</strong> Browse and drag elements directly from categories below.
    </div>
  </div>
);
