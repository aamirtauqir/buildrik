/**
 * Layout Visual Previews — Display + Position tiny icons.
 *
 * Every value here is static: these are 28px diagrams of what `display: flex`
 * or `position: absolute` mean, not anything derived from the selected
 * element. So they are classes, with no inline styles left at all.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

/** The accent block every diagram is built from, and its muted counterpart. */
const BOX = "tw:bg-[var(--bk-accent)] tw:rounded-[1px]";
const GRAY = "tw:bg-[var(--bk-gray-400)] tw:rounded-[1px]";
const GHOST = "tw:border tw:border-dashed tw:border-[var(--bk-gray-400)] tw:opacity-50";

// ============================================================================
// DISPLAY PREVIEW
// ============================================================================

export const DisplayPreview: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case "block":
      return (
        <div className="tw:flex tw:flex-col tw:gap-0.5 tw:w-4">
          <div className={`${BOX} tw:h-[5px]`} />
          <div className={`${BOX} tw:h-[5px]`} />
        </div>
      );
    case "flex":
      return (
        <div className="tw:flex tw:gap-0.5 tw:w-4">
          <div className={`${BOX} tw:flex-1 tw:h-2.5`} />
          <div className={`${BOX} tw:flex-1 tw:h-2.5`} />
          <div className={`${BOX} tw:flex-1 tw:h-2.5`} />
        </div>
      );
    case "grid":
      return (
        <div className="tw:grid tw:grid-cols-2 tw:gap-0.5 tw:w-4">
          <div className={`${BOX} tw:h-[5px]`} />
          <div className={`${BOX} tw:h-[5px]`} />
          <div className={`${BOX} tw:h-[5px]`} />
          <div className={`${BOX} tw:h-[5px]`} />
        </div>
      );
    case "inline-block":
      return (
        <div className="tw:flex tw:gap-0.5 tw:items-center tw:w-4">
          <div className={`${BOX} tw:w-2.5 tw:h-2`} />
          <div className={`${BOX} tw:w-3.5 tw:h-2`} />
        </div>
      );
    case "inline":
      return (
        <div className="tw:flex tw:gap-px tw:items-center tw:w-4">
          <div className={`${GRAY} tw:w-1.5 tw:h-1`} />
          <div className={`${BOX} tw:w-2.5 tw:h-1.5`} />
          <div className={`${GRAY} tw:w-1.5 tw:h-1`} />
        </div>
      );
    case "none":
      return <div className={`${GHOST} tw:w-4 tw:h-2.5 tw:rounded-sm`} />;
    default:
      return null;
  }
};
