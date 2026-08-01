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

export type RowSize = "dense" | "default" | "header" | "tall" | "comment";

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
export const ROW_META_CLASS = "tw:text-gray-500 tw:text-[11px] tw:flex-none";
export const ROW_CHEVRON_CLASS = "tw:text-gray-500 tw:flex-none";
export const ROW_ICON_CLASS = "tw:flex-none tw:inline-flex tw:text-gray-500";

const BASE =
  "tw:flex tw:gap-2 tw:px-4 tw:[font-family:var(--bk-font-ui)] tw:text-gray-900 tw:bg-transparent " +
  "tw:border-0 tw:w-full tw:text-left tw:[transition:var(--bk-transition-fast)] " +
  "tw:data-[interactive=true]:cursor-pointer tw:data-[interactive=true]:hover:bg-gray-100 " +
  "tw:aria-selected:bg-blue-50 tw:aria-selected:text-blue-700 " +
  "tw:aria-disabled:text-gray-300 tw:aria-disabled:pointer-events-none " +
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
  tall: "tw:h-16 tw:text-[13px] tw:items-center",
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
