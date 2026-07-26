/**
 * Badge — Figma component set 12:16 (Kind).
 * @license BSD-3-Clause
 */
import React from "react";

export type BadgeKind = "neutral" | "success" | "warning" | "danger" | "pro";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind?: BadgeKind;
}

export function Badge({ kind = "neutral", className, children, ...rest }: BadgeProps) {
  return (
    <span className={["bk-badge", `bk-badge--${kind}`, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}
