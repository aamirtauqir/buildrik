/**
 * Icon + IconButton + Kbd + Spinner.
 *
 * Icon is a sizing and colour wrapper, not an icon set — the glyphs stay where
 * they are (lucide, editor/shared/elementIcons) so this library does not become
 * a place SVGs get pasted into.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number | string;
  /** Icons are decorative unless the caller gives them a label. */
  label?: string;
}

export function Icon({ size = 16, label, className, children, style, ...rest }: IconProps) {
  return (
    <span
      className={["bk-icon", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, ...style }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      {children}
    </span>
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: an icon-only control with no name is invisible to screen readers. */
  label: string;
  size?: "sm" | "md";
  pressed?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", pressed, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={["bk-icon-button", size === "sm" && "bk-icon-button--sm", className].filter(Boolean).join(" ")}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      {...rest}
    >
      {children}
    </button>
  );
});

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

export function Kbd({ className, children, ...rest }: KbdProps) {
  return (
    <kbd className={["bk-kbd", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </kbd>
  );
}

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Spinner({ size = "md", label = "Loading", className, ...rest }: SpinnerProps) {
  return (
    <span
      className={["bk-spinner", size !== "md" && `bk-spinner--${size}`, className].filter(Boolean).join(" ")}
      role="status"
      aria-label={label}
      {...rest}
    />
  );
}
