/**
 * StatusDot — Figma component set 10:27 (State).
 * Colour alone never carries meaning: the dot ships an accessible label.
 * @license BSD-3-Clause
 */
import React from "react";

export type StatusDotState = "live" | "review" | "changes" | "draft" | "failed";

const LABEL: Record<StatusDotState, string> = {
  live: "Live",
  review: "In review",
  changes: "Changes requested",
  draft: "Draft",
  failed: "Failed",
};

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  state: StatusDotState;
  label?: string;
}

export function StatusDot({ state, label, className, ...rest }: StatusDotProps) {
  return (
    <span
      className={["bk-dot", `bk-dot--${state}`, className].filter(Boolean).join(" ")}
      role="img"
      aria-label={label ?? LABEL[state]}
      {...rest}
    />
  );
}
