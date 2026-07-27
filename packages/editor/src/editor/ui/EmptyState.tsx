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

/** Compound parts — call sites that build their own copy blocks use these. */
export function EmptyStateTitle({ className, children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={["bk-empty__title", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}
export function EmptyStateDesc({ className, children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={["bk-empty__body", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}
export function EmptyStateActions({ className, children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={["bk-stack bk-stack--row bk-stack--sm", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}

export function EmptyState({ size = "md", title, body, icon, action, className, children, ...rest }: EmptyStateProps) {
  return (
    <div className={["bk-empty", size !== "md" && "bk-empty--sm", className].filter(Boolean).join(" ")} {...rest}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {title ? <span className="bk-empty__title">{title}</span> : null}
      {body ? <span className="bk-empty__body">{body}</span> : null}
      {children}
      {action}
    </div>
  );
}
