/**
 * Button — Figma component set 9:102 (Kind × Size × State).
 *
 * Figma's hover/focus/rest variants are CSS states here, not props: an API
 * where the caller passes state="hover" would put the browser's job in React.
 * disabled and loading ARE props, because they are data the caller owns.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export type ButtonKind = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  kind?: ButtonKind;
  size?: ButtonSize;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { kind = "primary", size = "md", loading = false, disabled, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={["bk-btn", `bk-btn--${kind}`, `bk-btn--${size}`, className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
    </button>
  );
});
