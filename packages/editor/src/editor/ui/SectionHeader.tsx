/**
 * SectionHeader — Figma 16:16 (Tint · Count).
 * Groups rows inside a panel. Renders as a real heading so the panel has an
 * outline a screen reader can jump through.
 * @license BSD-3-Clause
 */
import React from "react";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  tint?: boolean;
  count?: number | string;
  level?: 2 | 3 | 4;
}

export function SectionHeader({ tint, count, level = 3, className, children, ...rest }: SectionHeaderProps) {
  return (
    <div
      role="heading"
      aria-level={level}
      className={["bk-section-header", tint && "bk-section-header--tint", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span>{children}</span>
      {count !== undefined ? <span className="bk-section-header__count">{count}</span> : null}
    </div>
  );
}
