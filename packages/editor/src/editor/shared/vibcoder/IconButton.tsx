/**
 * Vibcoder IconButton wrapper.
 * Renders the `bd-icon-btn` class from src/themes/components/atoms/icon-button.css
 * with `--variant` (tone) and `--size` BEM modifiers.
 *
 * Variant + size union sourced from `vibcoder-variants.mjs atoms/icon-button`:
 *   variants (tones): ghost, primary, accent, danger
 *   sizes: xs (24), sm (28), md (32, base default — no modifier), lg (40)
 *
 * Composition: IconButton does NOT take an icon `name` prop. Vendored CSS uses
 * `.bd-icon-btn > svg` to size the inner SVG. Caller passes `<Icon>` (or any
 * SVG) as a child:
 *
 *   <IconButton variant="primary" size="sm" aria-label="Settings">
 *     <Icon name="settings" />
 *   </IconButton>
 *
 * This keeps icon resolution in one place (Icon.tsx) and lets callers swap
 * the inner glyph implementation later without touching IconButton.
 *
 * `pressed` exposes the `[aria-pressed="true"]` toggle state. Only emitted
 * when explicitly passed (matches Switch pattern — undefined ≠ false in aria).
 *
 * forwardRef targets the `<button>` (focus management + measurement consumer).
 *
 * @license BSD-3-Clause
 */
import { type ButtonHTMLAttributes, forwardRef } from "react";

export type IconButtonVariant = "ghost" | "primary" | "accent" | "danger";
export type IconButtonSize = "xs" | "sm" | "md" | "lg";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /**
   * When defined, applies `aria-pressed` for the toggle state visual.
   * Undefined = non-toggleable button (no aria-pressed attribute emitted).
   */
  pressed?: boolean;
  type?: "button" | "submit" | "reset";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", size = "md", pressed, className, children, type = "button", ...rest }, ref) => {
    const classes = [
      "bd-icon-btn",
      `bd-icon-btn--${variant}`,
      // md is base default — no `bd-icon-btn--md` rule exists in vendored CSS
      size !== "md" && `bd-icon-btn--${size}`,
      className,
    ].filter(Boolean).join(" ");
    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        aria-pressed={pressed}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
