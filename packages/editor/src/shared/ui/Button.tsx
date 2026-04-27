// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled Button.
/**
 * Adapter shim — translates legacy Button API to vibcoder Button.
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   variant: passthrough (same union)
 *   size: passthrough (same union)
 *   icon + iconPosition: composed as children of vibcoder Button
 *   loading: maps to busy={loading}; renders Spinner when loading
 *   fullWidth: applied as inline style (vibcoder has no fullWidth prop)
 *
 * Untranslatable: none currently. Throws-at-render strategy (Phase 4 Q4)
 * applies if a future legacy prop arrives without a vibcoder mapping.
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type CSSProperties } from "react";
import { Button as VibcoderButton } from "@/editor/shared/vibcoder";
import { Spinner } from "./Spinner";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "publish";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", icon, iconPosition = "left", loading = false, fullWidth = false, children, style, ...rest },
    ref,
  ) => {
    const composedStyle: CSSProperties | undefined = fullWidth
      ? { width: "100%", ...style }
      : style;
    return (
      <VibcoderButton
        ref={ref}
        variant={variant}
        size={size}
        busy={loading}
        style={composedStyle}
        {...rest}
      >
        {loading && <Spinner size={size === "sm" ? 12 : 16} color="currentColor" />}
        {!loading && icon && iconPosition === "left" && icon}
        {children}
        {!loading && icon && iconPosition === "right" && icon}
      </VibcoderButton>
    );
  },
);
Button.displayName = "Button";

export default Button;
