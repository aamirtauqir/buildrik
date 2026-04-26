/**
 * Vibcoder Link wrapper.
 * Renders the `bd-link` class from src/themes/components/atoms/link.css with
 * tone variants + state modifier flags.
 *
 * Modifier union sourced from `vibcoder-variants.mjs atoms/link`:
 *   tones (mutually exclusive): muted, inverse — undefined = default accent look
 *   modifiers (state booleans, compose with tone): no-underline, external
 *
 * The variants script bucketed all four under "variants" because its heuristic
 * doesn't know that `no-underline` and `external` are state booleans — exposed
 * here separately to let callers compose them with a tone.
 *
 * `external` security default: when true, auto-applies `target="_blank"` and
 * `rel="noopener noreferrer"` UNLESS the caller already set them. Consumers
 * almost always want external links opened in new tabs with hardened rel
 * semantics; making this the silent default reduces XSS+tabnabbing footguns.
 *
 * `disabled` maps to `aria-disabled="true"` (anchors can't take a native
 * `disabled` attribute). The vendored CSS targets both forms.
 *
 * forwardRef targets the `<a>` (focus + measurement consumer needs the
 * native element).
 *
 * @license BSD-3-Clause
 */
import { type AnchorHTMLAttributes, forwardRef } from "react";

export type LinkTone = "muted" | "inverse";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  tone?: LinkTone;
  noUnderline?: boolean;
  external?: boolean;
  /**
   * Anchors don't support native `disabled`. We map this to
   * `aria-disabled="true"`, which the vendored CSS targets.
   */
  disabled?: boolean;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      tone,
      noUnderline = false,
      external = false,
      disabled = false,
      className,
      children,
      target,
      rel,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      "bd-link",
      tone && `bd-link--${tone}`,
      noUnderline && "bd-link--no-underline",
      external && "bd-link--external",
      className,
    ].filter(Boolean).join(" ");
    // External default: open in new tab + harden rel. Caller wins if they pass
    // explicit target / rel (e.g., `target="_self"` or a bespoke rel string).
    const resolvedTarget = external && target === undefined ? "_blank" : target;
    const resolvedRel = external && rel === undefined ? "noopener noreferrer" : rel;
    return (
      <a
        ref={ref}
        className={classes}
        aria-disabled={disabled || undefined}
        target={resolvedTarget}
        rel={resolvedRel}
        {...rest}
      >
        {children}
      </a>
    );
  },
);
Link.displayName = "Link";
