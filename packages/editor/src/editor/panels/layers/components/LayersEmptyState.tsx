/**
 * LayersEmptyState — design-2l9 board 101:42581: under the page's own row,
 * one muted line, "Empty page · Add elements to begin" (was v3 4418:83911's
 * glyph + "No layers yet" block). The board draws no button — Add is the rail
 * item beside the drawer.
 * @license BSD-3-Clause
 */

import * as React from "react";

export const LayersEmptyState: React.FC = () => (
  <p className="tw:m-0 tw:px-3 tw:py-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="layers-empty">
    Empty page · Add elements to begin
  </p>
);

export default LayersEmptyState;
