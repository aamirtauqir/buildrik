/**
 * Vibcoder Tag wrapper.
 * Renders the `bd-tag` class from src/themes/components/atoms/tag.css
 * with `--variant`, `--size`, and `--selectable` BEM modifiers.
 *
 * Variant + size + state union sourced from `vibcoder-variants.mjs atoms/tag`.
 * Note: the variants script bucketed `selectable` under variants because its
 * heuristic doesn't know that token; semantically it is a state (toggle pairs
 * with aria-pressed), so it is exposed as a boolean prop here.
 *
 * "neutral" is a virtual default — no `bd-tag--neutral` rule exists in the
 * vendored CSS; the base `.bd-tag` class IS the neutral tone. The default
 * value omits the modifier, matching Button.tsx's `size="md"` convention.
 *
 * Sub-elements (`bd-tag__close`, `bd-tag__dot`) are NOT exposed as slot
 * props. Callers needing close/dot affordances render BEM children directly.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type TagVariant = "neutral" | "accent" | "success" | "warning" | "error" | "ink";
export type TagSize = "sm" | "md";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  size?: TagSize;
  /**
   * When true, applies `bd-tag--selectable` (toggleable filter chip).
   * Caller is responsible for `aria-pressed` (they own the selection state).
   */
  selectable?: boolean;
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ variant = "neutral", size = "md", selectable = false, className, children, ...rest }, ref) => {
    const classes = [
      "bd-tag",
      // neutral is base default — no `bd-tag--neutral` rule exists in vendored CSS
      variant !== "neutral" && `bd-tag--${variant}`,
      // md is base default — no `bd-tag--md` rule exists in vendored CSS
      size !== "md" && `bd-tag--${size}`,
      selectable && "bd-tag--selectable",
      className,
    ].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  }
);
Tag.displayName = "Tag";
