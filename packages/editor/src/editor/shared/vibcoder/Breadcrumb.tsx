/**
 * Vibcoder Breadcrumb wrapper — breadcrumb trail molecule.
 * Renders the bd-crumbs composite from
 * src/themes/components/molecules/breadcrumb.css.
 *
 * Filename != classname: file is `breadcrumb.tsx` per molecule-name in the
 * vibcoder manifest, but the actual CSS class is `bd-crumbs` (Phase 1
 * convention precedent: IconButton.tsx renders bd-icon-btn).
 *
 * Slots (from CSS):
 *   __icon   optional leading icon
 *   __item   single crumb (anchor or button)
 *   __sep    chevron / "/" separator between crumbs
 *
 * Polymorphism choice (per Phase 2 Contract D guidance): COMPOSITION
 * with sibling exports.
 *   Crumb children are uniform (text or icon, separator between). The
 *   caller composes the trail explicitly — no data-driven `items={…}`
 *   API. Source CSS docstring shows uniform-children intent, and the
 *   manifest entry lists `__icon`, `__item`, `__sep` as composable
 *   slots, not as data fields.
 *
 * Sibling exports (Contract C):
 *   Breadcrumb           <nav> root with aria-label
 *   BreadcrumbItem       single crumb — renders <a> normally, <span> when
 *                        `current` (terminal crumb gets aria-current="page")
 *   BreadcrumbSeparator  optional explicit separator wrapper (text "/" or
 *                        an <Icon name="chevron-right" />)
 *   BreadcrumbIcon       optional leading icon wrapper
 *
 * Variant + size union from `vibcoder-variants.mjs molecules/breadcrumb`:
 *   sizes:    sm
 *   variants: mono (file paths), truncate (overflow ellipsis)
 *
 * A11y:
 *   - Container is `<nav aria-label="Breadcrumb">` by default; caller can
 *     override aria-label via the standard prop.
 *   - The terminal crumb passes `current` which:
 *     1) Renders <span> instead of <a> (no href on the current page)
 *     2) Emits aria-current="page"
 *     3) Applies the bd-crumbs__item--current visual class
 *
 * forwardRef on every export — Breadcrumb root is a layout measurement
 * consumer (truncation host); items + separators are visual only.
 *
 * @license BSD-3-Clause
 */
import {
  type HTMLAttributes,
  type AnchorHTMLAttributes,
  type Ref,
  forwardRef,
} from "react";

export type BreadcrumbSize = "sm";
export type BreadcrumbVariant = "mono" | "truncate";

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  size?: BreadcrumbSize;
  variant?: BreadcrumbVariant;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  (
    {
      size,
      variant,
      className,
      children,
      "aria-label": ariaLabel,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      "bd-crumbs",
      size && `bd-crumbs--${size}`,
      variant && `bd-crumbs--${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <nav
        ref={ref}
        aria-label={ariaLabel ?? "Breadcrumb"}
        className={classes}
        {...rest}
      >
        {children}
      </nav>
    );
  },
);
Breadcrumb.displayName = "Breadcrumb";

export interface BreadcrumbItemProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * When true, renders as <span> with aria-current="page" instead of <a>.
   * This is the terminal crumb (the current page) — non-interactive.
   */
  current?: boolean;
}

export const BreadcrumbItem = forwardRef<
  HTMLAnchorElement | HTMLSpanElement,
  BreadcrumbItemProps
>(({ current, className, children, ...rest }, ref) => {
  const classes = [
    "bd-crumbs__item",
    current && "bd-crumbs__item--current",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  if (current) {
    // `current=true` renders a <span aria-current="page">. Anchor-only props
    // (href/target/rel/download) are explicitly dropped before spread because
    // they would emit as invalid attributes on a span. Ref widened to
    // HTMLSpanElement so callers measuring the terminal crumb still work.
    const {
      href: _href,
      target: _target,
      rel: _rel,
      download: _download,
      ...spanRest
    } = rest;
    return (
      <span
        ref={ref as Ref<HTMLSpanElement>}
        aria-current="page"
        className={classes}
        {...spanRest}
      >
        {children}
      </span>
    );
  }
  return (
    <a ref={ref as Ref<HTMLAnchorElement>} className={classes} {...rest}>
      {children}
    </a>
  );
});
BreadcrumbItem.displayName = "BreadcrumbItem";

export type BreadcrumbSeparatorProps = HTMLAttributes<HTMLSpanElement>;

export const BreadcrumbSeparator = forwardRef<
  HTMLSpanElement,
  BreadcrumbSeparatorProps
>(({ className, children, ...rest }, ref) => {
  const classes = ["bd-crumbs__sep", className].filter(Boolean).join(" ");
  return (
    <span ref={ref} aria-hidden="true" className={classes} {...rest}>
      {children ?? "/"}
    </span>
  );
});
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export type BreadcrumbIconProps = HTMLAttributes<HTMLSpanElement>;

export const BreadcrumbIcon = forwardRef<HTMLSpanElement, BreadcrumbIconProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-crumbs__icon", className].filter(Boolean).join(" ");
    return (
      <span ref={ref} aria-hidden="true" className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
BreadcrumbIcon.displayName = "BreadcrumbIcon";
