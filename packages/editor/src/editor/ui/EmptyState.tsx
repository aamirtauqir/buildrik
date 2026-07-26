/**
 * EmptyState — Figma 17:18.
 *
 * An empty state without an action is a dead end. `action` is not optional by
 * accident — every one of the editor's 11 empty states has a next step.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  body?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, body, icon, action, className, ...rest }: EmptyStateProps) {
  return (
    <div className={["bk-empty", className].filter(Boolean).join(" ")} {...rest}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span className="bk-empty__title">{title}</span>
      {body ? <span className="bk-empty__body">{body}</span> : null}
      {action}
    </div>
  );
}
