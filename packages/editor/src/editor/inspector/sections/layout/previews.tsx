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
const BOX = "tw:bg-blue-700 tw:rounded-[1px]";
const GRAY = "tw:bg-gray-400 tw:rounded-[1px]";
const GHOST = "tw:border tw:border-dashed tw:border-gray-400 tw:opacity-50";

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

// ============================================================================
// POSITION PREVIEW
// ============================================================================

const FRAME = "tw:w-6 tw:h-4 tw:bg-gray-50 tw:rounded-sm tw:relative tw:border tw:border-gray-200";
const DOT = "tw:w-2 tw:h-1.5 tw:rounded-[1px] tw:absolute";

export const PositionPreview: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case "static":
      return (
        <div className={FRAME}>
          <div className={`${DOT} tw:relative tw:my-[5px] tw:mx-auto tw:bg-blue-700`} />
        </div>
      );
    case "relative":
      return (
        <div className={FRAME}>
          <div className={`${DOT} tw:top-0.5 tw:left-0.5 tw:bg-blue-700`} />
          {/* the outline it moved away from */}
          <div className={`${GHOST} tw:w-2 tw:h-1.5 tw:rounded-[1px] tw:absolute tw:top-[5px] tw:left-2`} />
        </div>
      );
    case "absolute":
      return (
        <div className={FRAME}>
          <div className={`${DOT} tw:top-0.5 tw:right-0.5 tw:bg-blue-700`} />
        </div>
      );
    case "fixed":
      /* was `var(--bk-success, var(--bk-success))` — a fallback to itself. */
      return (
        <div className={FRAME}>
          <div className={`${DOT} tw:bottom-0.5 tw:right-0.5 tw:bg-[var(--bk-success)]`} />
        </div>
      );
    case "sticky":
      return (
        <div className={FRAME}>
          <div className={`${DOT} tw:top-0 tw:left-1/2 tw:-translate-x-1/2 tw:bg-[var(--bk-warning)]`} />
        </div>
      );
    default:
      return null;
  }
};
