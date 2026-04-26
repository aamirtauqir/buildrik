/**
 * Vibcoder BreakpointSwitcher wrapper — Phase 1 Batch 5 canary atom.
 * First COMPOUND atom: the wrapper renders a container + multiple
 * interactive children (one button per breakpoint).
 *
 * Renders the `bd-bp-switcher` composite from
 * src/themes/components/atoms/breakpoint-switcher.css:
 *   <div role="group" class="bd-bp-switcher">
 *     <button class="bd-bp-switcher__btn" aria-pressed="…" />  (3 buttons)
 *   </div>
 *
 * Variant union from `vibcoder-variants.mjs atoms/breakpoint-switcher`:
 *   variants: labelled (icon-only is default)
 *
 * BREAKPOINTS ARE FIXED. Per the upstream docstring (breakpoint-switcher.css
 * line 4), tokens are desktop=1440 / tablet=768 / mobile=375. Don't accept
 * an arbitrary `options` array here — that's a separate Phase 2 segmented
 * control molecule (TBD). This atom expresses the editor's canonical viewport
 * switcher and nothing else.
 *
 * ICON SPRITE NOTE:
 *   The vendored icons.svg sprite (bundle pin e4741a24, 41 glyphs) does NOT
 *   include `monitor` / `tablet` / `smartphone` glyphs. Rather than ship a
 *   broken `<use href="#i-monitor">` reference, the icon-only variant renders
 *   short single-character text glyphs ("D" / "T" / "M") inside the button.
 *   Sprite extension (adding actual viewport glyphs) is captured for the
 *   chrome integration phase — at which point the icon-only rendering can
 *   swap to <Icon name="monitor"> etc. without changing the consumer API.
 *
 *   The `labelled` variant renders the full breakpoint name ("Desktop",
 *   "Tablet", "Mobile") which reads cleanly without any icon.
 *
 * forwardRef targets the container `<div>` (focus-within / measurement
 * consumers want the group, not individual buttons).
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type Breakpoint = "desktop" | "tablet" | "mobile";

export interface BreakpointSwitcherProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "children"> {
  value: Breakpoint;
  onChange: (next: Breakpoint) => void;
  /** When true, renders full breakpoint names instead of short glyphs. */
  labelled?: boolean;
}

const BREAKPOINTS: ReadonlyArray<{
  id: Breakpoint;
  glyph: string;
  label: string;
}> = [
  { id: "desktop", glyph: "D", label: "Desktop" },
  { id: "tablet", glyph: "T", label: "Tablet" },
  { id: "mobile", glyph: "M", label: "Mobile" },
];

export const BreakpointSwitcher = forwardRef<HTMLDivElement, BreakpointSwitcherProps>(
  ({ value, onChange, labelled = false, className, ...rest }, ref) => {
    const classes = [
      "bd-bp-switcher",
      labelled && "bd-bp-switcher--labelled",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div
        ref={ref}
        role="group"
        aria-label="Breakpoint"
        className={classes}
        {...rest}
      >
        {BREAKPOINTS.map((bp) => (
          <button
            key={bp.id}
            type="button"
            className="bd-bp-switcher__btn"
            aria-pressed={value === bp.id}
            aria-label={bp.label}
            onClick={() => onChange(bp.id)}
          >
            {labelled ? bp.label : bp.glyph}
          </button>
        ))}
      </div>
    );
  },
);
BreakpointSwitcher.displayName = "BreakpointSwitcher";
