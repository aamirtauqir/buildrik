/**
 * Row — Figma component set 8:47 (Size × State).
 *
 * The base every list surface in the editor is built from. Rows are divs, not
 * buttons: a row often contains its own buttons (rename, delete, chevron), and
 * a button inside a button is invalid HTML that breaks keyboard navigation.
 * When `interactive` is set the row takes the keyboard contract on itself —
 * tabIndex, Enter/Space, and a role the caller can override for tree/listbox.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export type RowSize = "dense" | "default" | "header" | "stack" | "tall" | "comment";

export interface RowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  size?: RowSize;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

/** Shared row internals — `bk-row__*` — reused directly (as plain className
 *  strings, not exported symbols) by every row variant below and by
 *  NavItem (ported separately, T6 batch 1). */
export const ROW_LABEL_CLASS = "tw:flex-1 tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap";
export const ROW_META_CLASS = "tw:text-[var(--bk-ink-muted)] tw:text-[11px] tw:flex-none";
export const ROW_CHEVRON_CLASS = "tw:text-[var(--bk-ink-muted)] tw:flex-none";
export const ROW_ICON_CLASS = "tw:flex-none tw:inline-flex tw:text-[var(--bk-ink-muted)]";

const BASE =
  "tw:relative tw:flex tw:gap-2 tw:px-4 tw:[font-family:var(--bk-font-ui)] tw:text-[var(--bk-ink)] tw:bg-transparent " +
  "tw:border-0 tw:w-full tw:text-left tw:[transition:var(--bk-transition-fast)] " +
  "tw:data-[interactive=true]:cursor-pointer tw:data-[interactive=true]:hover:bg-gray-100 " +
  "tw:aria-selected:bg-blue-50 tw:aria-selected:text-blue-700 " +
  /* Selected = 3px accent bar PLUS tint. Nav item 16:26's note makes it a
     product-wide rule, not a nav detail: "Active is a 3px accent left bar plus
     tint, matching the rail and every selected Row: one active language across
     the product." Only Rail.tsx had the bar; Row and NavItem had tint alone, so
     two of the three places spoke a different language. Same geometry as the
     rail's, flush-left here because a Row is full-bleed and not rounded. */
  "tw:aria-selected:before:content-[''] tw:aria-selected:before:absolute tw:aria-selected:before:left-0 " +
  "tw:aria-selected:before:inset-y-0 tw:aria-selected:before:w-[3px] tw:aria-selected:before:bg-blue-700 " +
  "tw:aria-disabled:text-[var(--bk-gray-300)] tw:aria-disabled:pointer-events-none " +
  "tw:outline-none tw:focus-visible:[box-shadow:inset_var(--bk-shadow-focus)]";

/** Each entry supplies its OWN height/font-size/align-items so no two size
 *  variants ever contribute two utility classes for the same CSS property
 *  at once — Tailwind utilities of equal specificity have no className-
 *  order-to-cascade-order guarantee, so overriding-by-concatenation (e.g.
 *  a shared `items-center` in BASE plus a conditional `items-start`) isn't
 *  a safe way to express "comment differs from the rest". */
const SIZE: Record<RowSize, string> = {
  dense: "tw:h-7 tw:text-[11px] tw:items-center",
  default: "tw:h-8 tw:text-[13px] tw:items-center",
  header: "tw:h-11 tw:text-[13px] tw:items-center",
  /* 44, per the Content boards (151:2 fields, 151:62 variables): a name over
     a type line, centred — `comment` (64, top-aligned) was carrying these. */
  stack: "tw:h-11 tw:text-[13px] tw:items-center",
  /* 56, per board 8:29 — NOT 64. At h-16 `tall` was byte-identical in height
     to `comment` (min-h-16), so the set shipped five names for four heights. */
  tall: "tw:h-14 tw:text-[13px] tw:items-center",
  /* min-height, not height: a comment body wraps, and a fixed 64px clipped it.
     Every other variant is a single line and stays exact. */
  comment: "tw:min-h-16 tw:text-[13px] tw:items-start tw:py-3",
};

export const Row = React.forwardRef<HTMLDivElement, RowProps>(function Row(
  { size = "default", interactive, selected, disabled, className, children, onClick, onKeyDown, role, ...rest },
  ref,
) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (!interactive || e.defaultPrevented) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      (onClick as ((ev: unknown) => void) | undefined)?.(e);
    }
  };
  return (
    <div
      ref={ref}
      className={[BASE, SIZE[size], className].filter(Boolean).join(" ")}
      data-interactive={interactive || undefined}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      tabIndex={interactive && !disabled ? 0 : undefined}
      role={role ?? (interactive ? "button" : undefined)}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </div>
  );
});
