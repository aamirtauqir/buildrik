/**
 * BrandCard — the list card every Brand workspace page draws (Colour mode
 * 7316:80949 · Fonts & type styles 7316:81551 · Component styles 7316:82755 ·
 * Classes 7316:83357 · Presets 7316:83953 · Brand checks 7316:84555): a
 * 620-wide bordered card, 48px rows with no rules between them, a 14px ink
 * name over a 13px muted line, 16 in on the left and 12 on the right, and
 * whatever the row ends in (a ›, a Set, a ✓).
 *
 * A row with `onSelect` is the control — click, Enter or Space. Any `data-*`
 * or `aria-*` attribute given to the row lands on that row element.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export const BrandCard: React.FC<{ label: string; children: React.ReactNode } & React.HTMLAttributes<HTMLUListElement>> = ({
  label,
  children,
  ...rest
}) => (
  <ul
    aria-label={label}
    {...rest}
    className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:overflow-hidden tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:p-0"
  >
    {children}
  </ul>
);

export interface BrandRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  name: React.ReactNode;
  sub?: React.ReactNode;
  /** What the row ends in — a ›, a Set, a ✓. */
  trailing?: React.ReactNode;
  onSelect?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

const ROW = "tw:flex tw:h-12 tw:w-full tw:items-center tw:gap-3 tw:pl-4 tw:pr-3 tw:text-left tw:outline-none";
const BRAND_ROW_NAME = "tw:truncate tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink)]";
const BRAND_ROW_SUB = "tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/** The muted › a drill-in row ends in. */
export const BrandChevron: React.FC = () => (
  <span aria-hidden="true" className="tw:flex-none tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
    ›
  </span>
);

export const BrandRow: React.FC<BrandRowProps> = ({ name, sub, trailing, onSelect, selected = false, disabled = false, className, ...rest }) => {
  const interactive = Boolean(onSelect) && !disabled;
  const state = selected
    ? "tw:bg-[var(--bk-accent-tint)]"
    : interactive
      ? "tw:cursor-pointer tw:hover:bg-[var(--bk-bg-subtle)] tw:focus-visible:[box-shadow:inset_var(--bk-shadow-focus)]"
      : disabled
        ? "tw:opacity-40"
        : "";
  return (
    <li className="tw:list-none">
      <div
        role={onSelect ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-pressed={onSelect ? selected : undefined}
        aria-disabled={onSelect && disabled ? true : undefined}
        onClick={interactive ? onSelect : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.();
                }
              }
            : undefined
        }
        {...rest}
        className={`${ROW} ${state}${className ? ` ${className}` : ""}`}
      >
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
          <span className={BRAND_ROW_NAME}>{name}</span>
          {sub !== undefined && <span className={BRAND_ROW_SUB}>{sub}</span>}
        </div>
        {trailing}
      </div>
    </li>
  );
};
