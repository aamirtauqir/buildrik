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
      className={["bk-row", `bk-row--${size}`, className].filter(Boolean).join(" ")}
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
