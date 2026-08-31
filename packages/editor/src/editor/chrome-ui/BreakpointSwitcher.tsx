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
import { BREAKPOINTS, isValidBreakpoint } from "@/shared/constants/breakpoints";

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

/* Board 807:8069 draws each breakpoint with the width range it governs, and
   the glyph-only switcher never said what "T" meant in pixels. The ranges
   come from BREAKPOINTS (the media queries the exporter actually writes) —
   NOT from the board's own 992/480 numbers, which would change generated CSS.
   "wide" has no breakpoint config: it is a preview width whose style edits
   fall back to desktop (ProInspector), so it says exactly that. */
function widthHint(id: Breakpoint): string {
  if (!isValidBreakpoint(id)) return "preview width, uses Desktop styles";
  const { minWidth, maxWidth } = BREAKPOINTS[id];
  if (maxWidth === undefined) return `\u2265${minWidth}px`;
  if (minWidth === 0) return `\u2264${maxWidth}px`;
  return `${minWidth}\u2013${maxWidth}px`;
}

const WELL_CLASS =
  "tw:inline-flex tw:p-0.5 tw:gap-0.5 tw:bg-gray-100 tw:rounded-lg tw:border tw:border-gray-200";

/* Icon-only cells are fixed-size (w-8); labelled cells hug their text
   (w-auto + horizontal padding) — the `labelled` prop is known at render
   time, so branching in JS reproduces the old `.bk-bp-switcher--labelled
   .bk-bp-switcher__btn` descendant override without a modifier class. */
const BTN_BASE_CLASS =
  "tw:h-6 tw:rounded-md tw:border-0 tw:cursor-pointer tw:bg-transparent tw:text-[var(--bk-ink-soft)] " +
  "tw:inline-flex tw:items-center tw:justify-center tw:font-medium tw:text-xs tw:leading-none " +
  "tw:[font-family:var(--bk-font-ui)] tw:[transition:var(--bk-transition-fast)] tw:hover:text-[var(--bk-ink)] " +
  "tw:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)] " +
  "tw:aria-[pressed=true]:bg-white tw:aria-[pressed=true]:text-blue-700 " +
  "tw:aria-[pressed=true]:[box-shadow:var(--bk-shadow-raised)]";

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
        className={[WELL_CLASS, className].filter(Boolean).join(" ")}
        {...rest}
      >
        {entries.map((bp) => (
          <button
            key={bp.id}
            type="button"
            className={`${BTN_BASE_CLASS} ${labelled ? "tw:w-auto tw:px-3" : "tw:w-8"}`}
            aria-pressed={value === bp.id}
            aria-label={`${bp.label} (${widthHint(bp.id)})`}
            title={`${bp.label} \u00b7 ${widthHint(bp.id)}`}
            onClick={() => onChange(bp.id)}
          >
            {labelled ? bp.label : (glyphs?.[bp.id] ?? bp.glyph)}
          </button>
        ))}
      </div>
    );
  },
);
