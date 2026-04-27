// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled IconButton.
/**
 * Adapter shim — translates legacy IconButton API to vibcoder IconButton.
 *
 * Strategy: bridge. Renders `<VibcoderIconButton>`
 * (`<button class="bd-icon-btn">`) internally and remaps the legacy variant
 * union, the `icon`-prop slot model, and the `active`/`rounded` add-ons.
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   icon (ReactNode) → rendered as children of vibcoder IconButton
 *                      (vibcoder uses `.bd-icon-btn > svg` for sizing —
 *                      caller still supplies the inner glyph element).
 *   tooltip (string) → wraps the vibcoder button in legacy `<Tooltip>`
 *                      (vibcoder has a presentational `<Tooltip>` surface
 *                      but no hover-intent overlay engine yet — Phase 6
 *                      ports the overlay layer; the legacy Tooltip stays
 *                      the canonical hover-intent wrapper meanwhile).
 *                      Also passed as `aria-label` fallback when ariaLabel
 *                      is unset, preserving prior accessibility behavior.
 *   ariaLabel        → forwarded as `aria-label` (overrides tooltip text).
 *   size:
 *     "sm" → vibcoder size="sm"
 *     "md" → vibcoder undefined (base default — no modifier)
 *     "lg" → vibcoder size="lg"
 *   variant:
 *     "ghost"  → vibcoder variant="ghost"   (transparent → bg-subtle hover)
 *     "subtle" → vibcoder variant="primary" (text-primary, hover bg-subtle —
 *                closest match for "subtle" intent in vibcoder's union)
 *     "solid"  → vibcoder variant="accent"  (most prominent / filled-feel
 *                option; vibcoder has no true "solid" tone — accent is the
 *                vendored CSS's strongest visual treatment)
 *   active (boolean) → vibcoder pressed={active}. Always passed (not just
 *                      when truthy) so `aria-pressed="false"` keeps emitting
 *                      for the legacy contract (IconButton.test asserts
 *                      both true and false branches). When true, also adds
 *                      the vibcoder-defined "is-on" marker class (an explicit
 *                      duplicate of `[aria-pressed="true"]` in icon-button.css)
 *                      so the legacy classNames-differ contract holds.
 *   rounded (boolean):
 *     true  → adds marker className "is-rounded" + inline style
 *             borderRadius: var(--buildrick-radius-full). Vibcoder has no
 *             rounded modifier for icon-button; the marker class keeps the
 *             className-distinctness contract green (legacy test asserts
 *             rounded ≠ default classNames) while the inline style is the
 *             actual visual mechanism.
 *     false → no marker, no style override.
 *
 * Untranslatable: none currently. Throws-at-render reserved for future
 * legacy props that have no vibcoder mapping.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { IconButton as VibcoderIconButton, type IconButtonVariant } from "@/editor/shared/vibcoder";
import { Tooltip } from "./Tooltip";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  tooltip?: string;
  /** More descriptive aria-label for screen readers (defaults to tooltip) */
  ariaLabel?: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "subtle" | "solid";
  active?: boolean;
  rounded?: boolean;
}

const VARIANT_MAP: Record<NonNullable<IconButtonProps["variant"]>, IconButtonVariant> = {
  ghost: "ghost",
  subtle: "primary",
  solid: "accent",
};

const SIZE_MAP: Record<NonNullable<IconButtonProps["size"]>, "sm" | "md" | "lg"> = {
  sm: "sm",
  md: "md",
  lg: "lg",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      tooltip,
      ariaLabel,
      size = "md",
      variant = "ghost",
      active = false,
      rounded = false,
      disabled,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const mergedClassName =
      [className, active && "is-on", rounded && "is-rounded"]
        .filter(Boolean)
        .join(" ") || undefined;
    const mergedStyle: React.CSSProperties | undefined = rounded
      ? { borderRadius: "var(--buildrick-radius-full)", ...style }
      : style;

    const button = (
      <VibcoderIconButton
        ref={ref}
        variant={VARIANT_MAP[variant]}
        size={SIZE_MAP[size]}
        pressed={active}
        disabled={disabled}
        aria-label={ariaLabel || tooltip}
        className={mergedClassName}
        style={mergedStyle}
        {...props}
      >
        {icon}
      </VibcoderIconButton>
    );

    if (tooltip) {
      return (
        <Tooltip content={tooltip} position="bottom">
          {button}
        </Tooltip>
      );
    }
    return button;
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
