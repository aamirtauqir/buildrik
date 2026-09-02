/**
 * EmptyState — Figma 17:18.
 *
 * An empty state without an action is a dead end. `action` is not optional by
 * accident — every one of the editor's 11 empty states has a next step.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { twMerge } from "tailwind-merge";

export type EmptyStateSize = "compact" | "sm" | "md";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** compact/sm are for inline slots; md is the full-panel state. */
  size?: EmptyStateSize;
  /** centered card (default) or the boards' left-anchored top block. */
  align?: "center" | "start";
  /** Optional when the caller composes EmptyStateTitle/Desc/Actions itself. */
  title?: string;
  body?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const TITLE_CLASS = "tw:font-medium tw:text-[var(--bk-ink)]";
const BODY_CLASS = "tw:text-[var(--bk-ink-muted)] tw:text-[length:var(--bk-text-12)] tw:max-w-[34ch]";
/* Merged, not concatenated: two size utilities both compile and source order picks the
   winner, so `<EmptyStateDesc className="tw:text-[13px]">` rendered 12 (board 149:7). */
const mergeBody = (className?: string) => twMerge(BODY_CLASS, className);

/** Compound parts — call sites that build their own copy blocks use these. */
export function EmptyStateTitle({ className, children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={[TITLE_CLASS, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}
export function EmptyStateDesc({ className, children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={mergeBody(className)} {...rest}>
      {children}
    </span>
  );
}
export function EmptyStateActions({ className, children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={["tw:flex tw:items-center tw:gap-2", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}

const BASE =
  "tw:flex tw:flex-col " +
  "tw:[font-family:var(--bk-font-ui)] tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink-soft)]";

/** Two alignment languages ship (audits 2026-08-28): the centered card and
 *  the newer boards' left-anchored top-of-panel block. Both are THIS
 *  component now — the third/fourth/fifth hand-rolled variants have no
 *  reason left to exist. */
const ALIGN = {
  center: "tw:items-center tw:justify-center tw:text-center",
  start: "tw:items-start tw:text-left",
};

/** md and the collapsed compact/sm bucket each supply their OWN gap+padding
 *  (never both at once in the same composed string) — same no-two-classes-
 *  same-property discipline as Row's SIZE map (same commit family). */
const SIZE = {
  md: "tw:gap-2 tw:py-8 tw:px-6",
  sm: "tw:gap-1 tw:py-4 tw:px-3",
};

export function EmptyState({ size = "md", align = "center", title, body, icon, action, className, children, ...rest }: EmptyStateProps) {
  return (
    <div className={[BASE, ALIGN[align], size !== "md" ? SIZE.sm : SIZE.md, className].filter(Boolean).join(" ")} {...rest}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {title ? <span className={TITLE_CLASS}>{title}</span> : null}
      {body ? <span className={BODY_CLASS}>{body}</span> : null}
      {children}
      {action}
    </div>
  );
}
