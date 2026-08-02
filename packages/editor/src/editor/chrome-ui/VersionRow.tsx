/**
 * VersionRow — Figma 240:6 (Current).
 * History panel and Publish history.
 * @license BSD-3-Clause
 */
import React from "react";
import { Row, type RowProps, ROW_META_CLASS } from "./Row";
import { Badge } from "flowbite-react";
import { StatusDot, type StatusDotState } from "./StatusDot";

export interface VersionRowProps extends Omit<RowProps, "children" | "size"> {
  title: string;
  meta: string;
  state?: StatusDotState;
  current?: boolean;
  /** What "current" is called on this surface. The history panel says CURRENT;
   *  publish history says LIVE, because the site is actually serving that
   *  version. Forcing one word on both would make one of them less true. */
  currentLabel?: string;
  /** Optional glyph or thumbnail ahead of the title — the media library's
   *  version list shows the asset itself, where the history panel shows a
   *  status dot. Both sit in the same slot order. */
  leading?: React.ReactNode;
  actions?: React.ReactNode;
}

export function VersionRow({
  title, meta, state, current, currentLabel = "CURRENT", leading, actions, className, style, ...rest
}: VersionRowProps) {
  return (
    <Row
      size="tall"
      interactive
      /* Row's "tall" size bakes in `items-center` (its shared default for
       * every non-comment size) — this row needs a column layout with
       * stretch alignment instead. Two same-specificity Tailwind utility
       * classes targeting the same property (align-items/gap here) have no
       * className-order-to-cascade-order guarantee, unlike the old CSS
       * (`.bk-version-row`'s rule simply sat later in ui.css than `.bk-row`'s
       * and won deterministically) — `style` is the one override channel
       * that's always deterministic, and it's already part of Row's
       * untouched HTMLAttributes contract. */
      style={{ flexDirection: "column", alignItems: "stretch", justifyContent: "center", gap: "var(--bk-space-2)", ...style }}
      className={className}
      {...rest}
    >
      <span className="tw:flex tw:items-center tw:gap-2">
        {leading}
        {state ? <StatusDot state={state} /> : null}
        <span className="tw:font-medium tw:flex-1">{title}</span>
        {current ? <Badge color="success" className="tw:text-green-600">{currentLabel}</Badge> : null}
        {actions}
      </span>
      <span className={ROW_META_CLASS}>{meta}</span>
    </Row>
  );
}
