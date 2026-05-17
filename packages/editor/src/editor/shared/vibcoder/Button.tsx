/**
 * Vibcoder Button wrapper.
 * Renders the `bd-btn` class from src/themes/components/atoms/button.css
 * with `--variant`, `--size`, and `--busy` BEM modifiers.
 *
 * Variant + size + state union sourced from `vibcoder-variants.mjs atoms/button`.
 * @license BSD-3-Clause
 */
import { type ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "publish" | "bare";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  busy?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", busy = false, className, children, ...rest }, ref) => {
    const classes = [
      "bd-btn",
      `bd-btn--${variant}`,
      // md is base default — no `bd-btn--md` rule exists in vendored CSS
      size !== "md" && `bd-btn--${size}`,
      busy && "bd-btn--busy",
      className,
    ].filter(Boolean).join(" ");
    return (
      <button ref={ref} className={classes} aria-busy={busy || undefined} {...rest}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
