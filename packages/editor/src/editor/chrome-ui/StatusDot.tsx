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

/** `--bk-success`/`-warning`/`-accent`/`-border-strong`/`-error` ramp equivalents
 *  (flowbite-react/plugin/tailwindcss/colors.js): green-500, yellow-500,
 *  blue-700, gray-400, red-600 — all exact hex matches, no arbitrary values. */
const TONE: Record<StatusDotState, string> = {
  live: "tw:bg-green-500",
  review: "tw:bg-yellow-500",
  changes: "tw:bg-blue-700",
  draft: "tw:bg-gray-400",
  failed: "tw:bg-red-600",
};

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  state: StatusDotState;
  label?: string;
}

export function StatusDot({ state, label, className, ...rest }: StatusDotProps) {
  return (
    <span
      className={["tw:inline-block tw:h-2 tw:w-2 tw:rounded-full tw:flex-none", TONE[state], className]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-label={label ?? LABEL[state]}
      {...rest}
    />
  );
}
