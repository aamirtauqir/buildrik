"use client";

import { cn } from "@lib/utils";

interface OnbEmptyProps {
  /** Optional icon tile above the title (T1's no-results frame: a Search glyph
   *  in a 56px neutral square). Omit for a purely typographic block. */
  icon?: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}

/** Centered, typographic "no results" block for wizard lists — no illustrations
 *  (spec: tokens only, no decorative slop). T1's empty-search-results frame is
 *  the first consumer; the shape generalizes to any future in-wizard empty
 *  state. Gaps (16/16/24px) are measured off the frame, not eyeballed. */
export function OnbEmpty({ icon, title, body, action, className }: OnbEmptyProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 text-center", className)}>
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-slate-100">{icon}</div>
      ) : null}
      <p className="text-base font-semibold text-onb-text">{title}</p>
      <p className="text-[13px] text-onb-muted">{body}</p>
      {action}
    </div>
  );
}
