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

const BASE =
  "tw:flex tw:items-center tw:gap-2 tw:h-7 tw:px-4 tw:[font-family:var(--bk-font-ui)] tw:text-[11px] " +
  "tw:font-medium tw:tracking-[0.08em] tw:text-gray-500 tw:uppercase";

export function SectionHeader({ tint, count, level = 3, className, children, ...rest }: SectionHeaderProps) {
  return (
    <div
      role="heading"
      aria-level={level}
      className={[BASE, tint && "tw:bg-gray-100", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span>{children}</span>
      {count !== undefined ? <span className="tw:ml-auto tw:text-gray-500">{count}</span> : null}
    </div>
  );
}
