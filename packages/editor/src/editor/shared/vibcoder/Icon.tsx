/**
 * Vibcoder Icon wrapper.
 * Renders the `bd-icon` class from src/themes/components/atoms/icon.css and
 * pulls glyph geometry from the vendored sprite at
 * src/themes/components/atoms/icons.svg via `<svg><use href="…#i-NAME" />`.
 *
 * Variant + size union sourced from `vibcoder-variants.mjs atoms/icon`:
 *   sizes: xs (12), sm (14), md (20), lg (24), xl (32)  — base = 16 (no modifier)
 *   NO color/tone variants — color inherits from parent via `currentColor`
 *     (per icon.css comment: "compose, don't repaint").
 *
 * `name` is REQUIRED. The union is enumerated from the sprite's `id="i-*"`
 * attributes (41 glyphs as of bundle pin e4741a24). Re-grep after every
 * `vibcoder:vendor` cycle if the sprite changes:
 *   grep -oE 'id="i-[a-z0-9-]+"' \
 *     packages/editor/src/themes/components/atoms/icons.svg | sort -u
 *
 * Sprite path strategy: hard-coded Vite-served absolute path
 * `/src/themes/components/atoms/icons.svg`. This works in dev (Vite serves
 * src/ directly). PRODUCTION-BUILD CONCERN: a static SVG under src/ is not
 * automatically copied into dist/ by Vite — Phase 6 (or whichever phase
 * lands the production bundle) must either:
 *   (a) import the sprite as a URL via `import spriteUrl from "...?url"` and
 *       reference `${spriteUrl}#i-${name}`, OR
 *   (b) move the sprite to `public/` so Vite emits it verbatim, OR
 *   (c) inline the sprite once in the document root and reference `#i-NAME`.
 * Captured here so the bridge works in dev galleries today; production
 * resolution lands with the chrome integration phase.
 *
 * `aria-hidden="true"` is the default — caller can override by passing
 * `aria-label` (or any aria-* attr) via `...rest`, which will displace the
 * default per JSX attribute order.
 *
 * @license BSD-3-Clause
 */
import { type SVGAttributes, forwardRef } from "react";

export type IconName =
  | "alert-circle"
  | "arrow-down"
  | "arrow-up"
  | "check"
  | "check-circle"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "circle"
  | "close"
  | "components"
  | "copy"
  | "eye"
  | "eye-off"
  | "file"
  | "folder"
  | "grip-vertical"
  | "history"
  | "image"
  | "info"
  | "layers"
  | "link"
  | "lock"
  | "media"
  | "minus"
  | "more-horizontal"
  | "more-vertical"
  | "pages"
  | "palette"
  | "plus"
  | "plus-square"
  | "redo"
  | "refresh"
  | "search"
  | "settings"
  | "share"
  | "square"
  | "trash"
  | "undo"
  | "x";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

const SPRITE_HREF = "/src/themes/components/atoms/icons.svg";

// Native `name` SVG attribute (rare, mostly relevant on `<a>`-like elements)
// would clash with our prop. Omit it from `...rest`.
export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, "name"> {
  name: IconName;
  size?: IconSize;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ name, size, className, ...rest }, ref) => {
    const classes = [
      "bd-icon",
      // base 16px is implicit (no `bd-icon--md` class equivalent in the base
      // selector — `--md` is its own 20px size, so we DO emit it explicitly
      // when requested. No "default size to omit" rule like Tag/Button.
      size && `bd-icon--${size}`,
      className,
    ].filter(Boolean).join(" ");
    return (
      <svg ref={ref} aria-hidden="true" className={classes} {...rest}>
        <use href={`${SPRITE_HREF}#i-${name}`} />
      </svg>
    );
  }
);
Icon.displayName = "Icon";
