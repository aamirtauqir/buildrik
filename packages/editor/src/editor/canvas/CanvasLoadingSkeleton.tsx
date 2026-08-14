/**
 * CanvasLoadingSkeleton — board 65:412 (Shell state 12 · Loading).
 *
 * What the canvas shows while the site's own pages are still arriving from the
 * dashboard: stacked placeholders where the sections will be. It replaces the
 * empty-state CTA for that window — "Start building · Browse templates" is a
 * true statement about an empty project and a false one about a project that
 * has simply not arrived yet, and the user cannot tell which they are looking
 * at. One of them invites them to start over on top of their own site.
 *
 * The board's four bars are the shape, not a count of anything real: nothing
 * here knows how many sections are coming.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SkeletonBlock } from "@/editor/chrome-ui";

/** Board: one short bar, then three tall ones. */
const BARS = [56, 104, 104, 104];

export function CanvasLoadingSkeleton(): React.ReactElement {
  return (
    <div
      className="bd-canvas-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading your site"
      data-testid="canvas-loading"
    >
      {BARS.map((height, i) => (
        <SkeletonBlock key={i} className="bd-canvas-loading__bar" style={{ height }} />
      ))}
    </div>
  );
}
