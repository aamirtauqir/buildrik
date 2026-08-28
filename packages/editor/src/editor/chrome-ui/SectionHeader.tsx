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
  "tw:flex tw:items-center tw:gap-2 tw:h-7 tw:px-4 tw:[font-family:var(--bk-font-ui)] tw:text-[length:var(--bk-text-11)] " +
  "tw:font-medium tw:tracking-[0.08em] tw:text-[var(--bk-ink-muted)] tw:uppercase";

export function SectionHeader({ tint, count, level = 3, className, children, ...rest }: SectionHeaderProps) {
  return (
    <div
      className={[BASE, tint && "tw:bg-[var(--bk-bg-subtle)]", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {/* The heading is the LABEL, not the bar — with the role on the container
          the accessible name came out "Collections3". Same shape as the bug
          PanelHeader had. */}
      <span role="heading" aria-level={level}>
        {children}
      </span>
      {count !== undefined ? (
        /* Mono + tabular-nums, per 16:16's own note: "The right-aligned count is
           mono so the numbers do not jitter as a list filters — that is the
           whole reason data/* is a separate family." It was rendering in the UI
           font, so a filtering list shifted its own count sideways. Tracking is
           reset because the label's .08em caps spacing is wrong for digits. */
        <span className="tw:ml-auto tw:[font-family:var(--bk-font-mono)] tw:tabular-nums tw:tracking-normal tw:text-[var(--bk-ink-muted)]">
          {count}
        </span>
      ) : null}
    </div>
  );
}
