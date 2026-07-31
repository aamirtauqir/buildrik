/**
 * EmptyState — Figma 17:18.
 *
 * An empty state without an action is a dead end. `action` is not optional by
 * accident — every one of the editor's 11 empty states has a next step.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export type EmptyStateSize = "compact" | "sm" | "md";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** compact/sm are for inline slots; md is the full-panel state. */
  size?: EmptyStateSize;
  /** Optional when the caller composes EmptyStateTitle/Desc/Actions itself. */
  title?: string;
  body?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const TITLE_CLASS = "tw:font-medium tw:text-gray-900";
const BODY_CLASS = "tw:text-gray-500 tw:text-xs tw:max-w-[34ch]";

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
    <span className={[BODY_CLASS, className].filter(Boolean).join(" ")} {...rest}>
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
  "tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-center " +
  "tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-gray-600";

/** md and the collapsed compact/sm bucket each supply their OWN gap+padding
 *  (never both at once in the same composed string) — same no-two-classes-
 *  same-property discipline as Row's SIZE map (same commit family). */
const SIZE = {
  md: "tw:gap-2 tw:py-8 tw:px-6",
  sm: "tw:gap-1 tw:py-4 tw:px-3",
};

export function EmptyState({ size = "md", title, body, icon, action, className, children, ...rest }: EmptyStateProps) {
  return (
    <div className={[BASE, size !== "md" ? SIZE.sm : SIZE.md, className].filter(Boolean).join(" ")} {...rest}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {title ? <span className={TITLE_CLASS}>{title}</span> : null}
      {body ? <span className={BODY_CLASS}>{body}</span> : null}
      {children}
      {action}
    </div>
  );
}
