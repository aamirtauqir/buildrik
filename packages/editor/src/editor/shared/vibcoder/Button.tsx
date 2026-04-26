/**
 * Vibcoder Button wrapper.
 * Renders the `bd-btn` class from src/themes/components/atoms/button.css
 * with `--variant` and `--size` BEM modifiers.
 * @license BSD-3-Clause
 */
import { type ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "publish";
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
      `bd-btn--${size}`,
      busy && "bd-btn--busy",
      className,
    ].filter(Boolean).join(" ");
    return (
      <button ref={ref} className={classes} {...rest}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
