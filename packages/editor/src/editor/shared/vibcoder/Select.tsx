/**
 * Vibcoder Select wrapper.
 * Renders the `bd-select` class from src/themes/components/atoms/select.css
 * with `--xs|--sm` size and `--error` state BEM modifiers.
 *
 * Variant + size + state union sourced from `vibcoder-variants.mjs atoms/select`:
 *   sizes: xs, sm  (md is base default — no `bd-select--md` rule exists)
 *   variants: error  (semantically a state, demoted to boolean prop per Tag pattern)
 *
 * Composite render: vendored CSS uses `bd-select-wrap` as a positioning parent
 * for the dropdown caret pseudo-element (`::after`). Wrapper renders the wrap
 * div around the native `<select>`. Caller passes `<option>` children directly —
 * NO items-array abstraction (YAGNI).
 *
 * forwardRef targets the inner `<select>` (focus/measurement consumer needs the
 * native element, not the wrap div).
 *
 * @license BSD-3-Clause
 */
import { type SelectHTMLAttributes, forwardRef } from "react";

export type SelectSize = "xs" | "sm" | "md";

// Omit native `size` (numeric, controls visible-rows in multi-select) — we
// repurpose the prop name for our string-union sizing modifier (xs/sm/md).
// Multi-select with explicit row count is YAGNI for chrome use; can be re-added
// as `visibleRows` if a consumer needs it.
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: SelectSize;
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ size = "md", error = false, className, children, ...rest }, ref) => {
    const classes = [
      "bd-select",
      // md is base default — no `bd-select--md` rule exists in vendored CSS
      size !== "md" && `bd-select--${size}`,
      error && "bd-select--error",
      className,
    ].filter(Boolean).join(" ");
    return (
      <div className="bd-select-wrap">
        <select
          ref={ref}
          className={classes}
          aria-invalid={error || undefined}
          {...rest}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";
