/**
 * Vibcoder Avatar wrapper.
 * Renders the `bd-avatar` composite from src/themes/components/atoms/avatar.css:
 *   <span class="bd-avatar bd-avatar--lg bd-avatar--accent bd-avatar--solid">
 *     <img src="…" alt="…" />        (if `src` provided)
 *     {children}                       (initials/glyph slot otherwise)
 *     <span class="bd-avatar__presence bd-avatar__presence--online" />  (if `presence`)
 *   </span>
 *
 * Variant + size + state union from `vibcoder-variants.mjs atoms/avatar`:
 *   sizes: xs (20), sm (24), md (32 base, no modifier), lg (40), xl (56)
 *   variants: accent (base default — `.bd-avatar` ships accent-tint already),
 *             neutral, ink, success, warning
 *   solid (state, demoted to boolean per Tag.selectable pattern):
 *     The variants script bucketed `solid` under variants because its heuristic
 *     doesn't recognize the token; semantically it's a state modifier that
 *     intensifies whichever tone is active (background → solid, text → on-accent).
 *   __presence sub-element: dedicated slot prop (`presence`) for status dot.
 *
 * The base `.bd-avatar` rule already paints accent (var(--bk-accent-tint)
 * background + var(--bk-accent) text). We treat "accent" as the virtual
 * default and OMIT the `bd-avatar--accent` modifier when variant is unset or
 * "accent" — matching the Tag.tsx convention where the base class IS the
 * default tone.
 *
 * `bd-avatar-stack` (overlapping collaborator strip) is NOT wrapped here —
 * it's a layout primitive applied by the consumer wrapping multiple <Avatar>
 * children in a `<div className="bd-avatar-stack">`. Wrapping it as a
 * separate component would add a single-purpose middle-man.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, type ReactNode, forwardRef } from "react";

export type AvatarVariant = "accent" | "neutral" | "ink" | "success" | "warning";
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarPresence = "online" | "away" | "offline";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: AvatarVariant;
  size?: AvatarSize;
  /** When true, applies `bd-avatar--solid` (intensifies tint to full color). */
  solid?: boolean;
  /** Renders a `bd-avatar__presence` status dot child when set. */
  presence?: AvatarPresence;
  /** When set, renders an `<img>` child; otherwise `children` (initials/glyph) renders. */
  src?: string;
  alt?: string;
  children?: ReactNode;
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  (
    {
      variant = "accent",
      size = "md",
      solid = false,
      presence,
      src,
      alt,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const classes = [
      "bd-avatar",
      // accent is the virtual base default — `.bd-avatar` already paints accent
      variant !== "accent" && `bd-avatar--${variant}`,
      // md is base default — no `bd-avatar--md` rule exists in vendored CSS
      size !== "md" && `bd-avatar--${size}`,
      solid && "bd-avatar--solid",
      className,
    ].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {src ? <img src={src} alt={alt ?? ""} /> : children}
        {presence && (
          <span
            className={`bd-avatar__presence bd-avatar__presence--${presence}`}
            aria-label={`Status: ${presence}`}
          />
        )}
      </span>
    );
  }
);
Avatar.displayName = "Avatar";
