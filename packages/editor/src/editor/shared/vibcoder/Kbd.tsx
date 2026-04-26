/**
 * Vibcoder Kbd + KbdSeq wrappers.
 * Both atoms ship in the same vendored CSS file:
 *   src/themes/components/atoms/kbd.css → `.bd-kbd`, `.bd-kbd-seq`, `.bd-kbd-seq__then`
 *
 * Two atoms, one file (mirrors vendor source). Same convention as Spinner+StatusDot.
 *
 * KBD
 *   Variant + size union from `vibcoder-variants.mjs atoms/kbd`:
 *     variants: bare (no chrome — colored mono glyph), inverted (dark surfaces)
 *     sizes:    xs (cmd-palette / rail)  (default sm = 18px chip — omit modifier)
 *
 *   The base `.bd-kbd` class IS the sm variant per the upstream docstring
 *   ("Sizes: xs (cmd-palette / rail), sm (default, menus / inline)"). Only
 *   `--xs` is exposed as a size modifier.
 *
 *   Renders as `<kbd>` (native HTML keyboard input element) for semantic
 *   correctness — screen readers announce `<kbd>` content as keyboard input.
 *
 * KBD SEQ
 *   Sequence wrapper — chains multiple `<Kbd>` children with optional
 *   "then" separators. Caller-driven composition:
 *
 *     <KbdSeq>
 *       <Kbd>⌘</Kbd>
 *       <Kbd>K</Kbd>
 *     </KbdSeq>
 *
 *   For "then" separators (e.g., chord shortcuts):
 *
 *     <KbdSeq>
 *       <Kbd>g</Kbd>
 *       <span className="bd-kbd-seq__then">then</span>
 *       <Kbd>p</Kbd>
 *     </KbdSeq>
 *
 *   Separators are NOT auto-injected — the caller decides whether keys are
 *   simultaneous (no separator) or sequential ("then" separator).
 *
 * forwardRef on each — Kbd targets the `<kbd>` element, KbdSeq targets the
 * wrapping `<div>`. Tooltips and command-palette overlays may attach refs
 * for positioning.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type KbdVariant = "bare" | "inverted";
export type KbdSize = "xs";

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  variant?: KbdVariant;
  size?: KbdSize;
}

export const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ variant, size, className, children, ...rest }, ref) => {
    const classes = [
      "bd-kbd",
      // default (light chrome at sm size) has no modifier
      variant && `bd-kbd--${variant}`,
      size && `bd-kbd--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <kbd ref={ref} className={classes} {...rest}>
        {children}
      </kbd>
    );
  },
);
Kbd.displayName = "Kbd";

export type KbdSeqProps = HTMLAttributes<HTMLDivElement>;

export const KbdSeq = forwardRef<HTMLDivElement, KbdSeqProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-kbd-seq", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
KbdSeq.displayName = "KbdSeq";
