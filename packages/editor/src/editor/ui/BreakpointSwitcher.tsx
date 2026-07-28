/**
 * BreakpointSwitcher — segmented viewport switcher (ported from vibcoder).
 *
 * Breakpoints are fixed by design: wide (1920+, opt-in) / desktop (1440) /
 * tablet (768) / mobile (375). This is the editor's canonical viewport
 * switcher, not a generic segmented control — don't grow it an `options`
 * array.
 *
 * The icon-only default renders short text glyphs ("W" / "D" / "T" / "M");
 * callers can pass richer glyphs via the `glyphs` map. `labelled` renders
 * full breakpoint names instead.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export type Breakpoint = "wide" | "desktop" | "tablet" | "mobile";

export interface BreakpointSwitcherProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "children"> {
  value: Breakpoint;
  onChange: (next: Breakpoint) => void;
  /** When true, renders full breakpoint names instead of short glyphs. */
  labelled?: boolean;
  /** When true, prepends a "wide" (1920+) cell ahead of desktop/tablet/mobile. */
  includeWide?: boolean;
  /** Optional glyph map for a richer icon set (overrides default text glyphs). */
  glyphs?: Partial<Record<Breakpoint, React.ReactNode>>;
}

interface BreakpointEntry {
  id: Breakpoint;
  glyph: string;
  label: string;
}

const CORE_BREAKPOINTS: ReadonlyArray<BreakpointEntry> = [
  { id: "desktop", glyph: "D", label: "Desktop" },
  { id: "tablet", glyph: "T", label: "Tablet" },
  { id: "mobile", glyph: "M", label: "Mobile" },
];

const WIDE_BREAKPOINT: BreakpointEntry = { id: "wide", glyph: "W", label: "Wide" };

export const BreakpointSwitcher = React.forwardRef<HTMLDivElement, BreakpointSwitcherProps>(
  function BreakpointSwitcher(
    { value, onChange, labelled = false, includeWide = false, glyphs, className, ...rest },
    ref,
  ) {
    const entries: ReadonlyArray<BreakpointEntry> = includeWide
      ? [WIDE_BREAKPOINT, ...CORE_BREAKPOINTS]
      : CORE_BREAKPOINTS;
    return (
      <div
        ref={ref}
        role="group"
        aria-label="Breakpoint"
        className={["bk-bp-switcher", labelled && "bk-bp-switcher--labelled", className]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {entries.map((bp) => (
          <button
            key={bp.id}
            type="button"
            className="bk-bp-switcher__btn"
            aria-pressed={value === bp.id}
            aria-label={bp.label}
            onClick={() => onChange(bp.id)}
          >
            {labelled ? bp.label : (glyphs?.[bp.id] ?? bp.glyph)}
          </button>
        ))}
      </div>
    );
  },
);
