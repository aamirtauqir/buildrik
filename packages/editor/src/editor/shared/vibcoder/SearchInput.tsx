/**
 * Vibcoder SearchInput wrapper — search input molecule with leading icon
 * + optional clear button.
 * Renders the bd-search composite from
 * src/themes/components/molecules/search-input.css.
 *
 * Filename != classname: file is `SearchInput.tsx` per molecule-name in
 * the vibcoder manifest, but the actual CSS class is `bd-search`
 * (Phase 1 convention precedent: IconButton renders bd-icon-btn).
 *
 * Slots (from CSS):
 *   __icon   leading magnifier icon (always rendered)
 *   __input  the actual <input type="search">
 *   __clear  trailing clear "×" button (only when clearable + has value)
 *   __kbd    trailing keyboard hint slot (e.g. ⌘K) — Phase 2 ships it via
 *            the kbd prop (caller passes <Kbd> children)
 *
 * Cross-atom imports (Contract D from Phase 2 design):
 *   Icon        — sibling atom file ./Icon (search + close glyphs)
 *   IconButton  — sibling atom file ./IconButton (clear "×" button)
 *
 * Contract B (always-controlled state) — Phase 2 mandate:
 *   value     REQUIRED — caller owns the input value. NO defaultValue.
 *             NO internal useState. The search query lives in caller
 *             state OR in URL / Composer search-state.
 *   onChange  REQUIRED — receives the unwrapped string (NOT the
 *             ChangeEvent). Same shape as Switch.onCheckedChange and
 *             Tabs.onValueChange — ergonomic for caller setState calls.
 *
 * Clear button visibility:
 *   The vendored CSS already auto-hides __clear via `:has(:not(:placeholder-shown))`
 *   purely declaratively. We additionally gate the clear button at the React
 *   level on `clearable && value` (truthy check — empty string is falsy in
 *   JS, so empty value correctly hides the button). This avoids emitting a
 *   stray <button> in the DOM that would still occupy the gap layout slot.
 *
 * Variant + size union from `vibcoder-variants.mjs molecules/search-input`:
 *   variants: error
 *   sizes:    sm (28), lg (40) — md (32) is base default, no modifier
 *   states:   disabled (also natively disabled-able via aria-disabled or
 *             input.disabled — wrapper passes the prop through)
 *
 * forwardRef targets the <input> (focus management + selection-range
 * consumers like CommandPalette wiring need the input element directly).
 *
 * @license BSD-3-Clause
 */
import {
  type InputHTMLAttributes,
  type ChangeEvent,
  type ReactNode,
  forwardRef,
} from "react";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";

export type SearchInputSize = "sm" | "lg";

export interface SearchInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type" | "size"
  > {
  /** REQUIRED — caller-owned value. NO defaultValue. */
  value: string;
  /** REQUIRED — receives the unwrapped string (NOT the ChangeEvent). */
  onChange: (value: string) => void;
  /** Renders a trailing clear "×" button when value is non-empty. */
  clearable?: boolean;
  /** Optional trailing keyboard hint slot (caller passes <Kbd>⌘K</Kbd>). */
  kbd?: ReactNode;
  /** Visual error state. */
  error?: boolean;
  size?: SearchInputSize;
  /**
   * aria-label override. The wrapper has no inherent label text (search
   * inputs typically use placeholder). If a screen-reader-only label is
   * needed, pass aria-label via the standard prop.
   */
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      clearable,
      kbd,
      error,
      size,
      disabled,
      className,
      placeholder,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      "bd-search",
      size && `bd-search--${size}`,
      error && "bd-search--error",
      disabled && "bd-search--disabled",
      // is-dirty mirrors the CSS hook for the auto-show-clear selector.
      // Truthy `value` (non-empty string) emits the class.
      value && "is-dirty",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div className={classes} aria-disabled={disabled || undefined}>
        <span className="bd-search__icon" aria-hidden="true">
          <Icon name="search" />
        </span>
        <input
          ref={ref}
          type="search"
          className="bd-search__input"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          {...rest}
        />
        {clearable && value && (
          <IconButton
            className="bd-search__clear"
            size="xs"
            aria-label="Clear search"
            onClick={() => onChange("")}
            disabled={disabled}
          >
            <Icon name="close" />
          </IconButton>
        )}
        {kbd && <span className="bd-search__kbd">{kbd}</span>}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
