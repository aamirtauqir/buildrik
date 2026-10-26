/**
 * BreakpointSwitcher — segmented viewport switcher (ported from vibcoder).
 *
 * Breakpoints are fixed by design: wide (1920, opt-in via `includeWide`) /
 * desktop / tablet (768) / mobile (375). This is the editor's canonical
 * viewport switcher, not a generic segmented control — don't grow it an
 * `options` array.
 *
 * The default is icon-only (2L9 shell, F1.07 `302:7348`): one device icon
 * per cell, no visible text, the name as the accessible label and the width
 * in a tooltip. `glyphs` overrides the icons; `labelled` renders full names
 * instead. The board says "Phone"; the code's "Mobile" is kept
 * (authority: code:mobile-label).
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Monitor, Smartphone, Tablet, Tv, type LucideIcon } from "lucide-react";
import { BREAKPOINTS, DEVICE_PREVIEW_SIZES } from "@/shared/constants/breakpoints";
import { HintTooltip } from "./HintTooltip";

export type Breakpoint = "wide" | "desktop" | "tablet" | "mobile";

export interface BreakpointSwitcherProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "children"> {
  value: Breakpoint;
  onChange: (next: Breakpoint) => void;
  /** When true, renders full breakpoint names instead of icons. */
  labelled?: boolean;
  /** Muted text after each labelled cell's name — the preview draws the
   *  width it renders at ("Desktop 1320px", board 4418:165611). */
  sublabels?: Partial<Record<Breakpoint, string>>;
  /** When true, prepends a "wide" (1920) cell ahead of desktop/tablet/mobile. */
  includeWide?: boolean;
  /** Optional glyph map overriding the default device icons. */
  glyphs?: Partial<Record<Breakpoint, React.ReactNode>>;
}

interface BreakpointEntry {
  id: Breakpoint;
  Icon: LucideIcon;
  label: string;
}

const CORE_BREAKPOINTS: ReadonlyArray<BreakpointEntry> = [
  { id: "desktop", Icon: Monitor, label: "Desktop" },
  { id: "tablet", Icon: Tablet, label: "Tablet" },
  { id: "mobile", Icon: Smartphone, label: "Mobile" },
];

const WIDE_BREAKPOINT: BreakpointEntry = { id: "wide", Icon: Tv, label: "Wide" };

/* The width each cell previews, from DEVICE_PREVIEW_SIZES — the one table the
   canvas frame reads, so the tooltip cannot disagree with the frame. Desktop
   has no fixed width (it fills the column, floored at the desktop
   breakpoint), so it says exactly that floor. */
function widthHint(id: Breakpoint): string {
  const { width } = DEVICE_PREVIEW_SIZES[id];
  return typeof width === "number" ? `${width}px` : `\u2265${BREAKPOINTS.desktop.minWidth}px`;
}

/* The well is gray-50, which is the ground board 807:8321 sits its chips on
   — and it is load-bearing for legibility, not decoration. Moving the resting
   label to the board's ink-muted `var(--bk-gray-500)` (below) measures 4.39:1 on gray-100
   `var(--bk-gray-100)`, i.e. an AA failure the board never had; on gray-50 `var(--bk-gray-50)` the same
   ink is 5.0:1. Measured, not guessed. */
const WELL_CLASS =
  "tw:inline-flex tw:p-0.5 tw:gap-0.5 tw:bg-[var(--bk-gray-50)] tw:rounded-lg tw:border tw:border-[var(--bk-gray-200)]";

/* Icon-only cells are fixed-size (w-8); labelled cells hug their text
   (w-auto + horizontal padding) — the `labelled` prop is known at render
   time, so branching in JS reproduces the old `.bk-bp-switcher--labelled
   .bk-bp-switcher__btn` descendant override without a modifier class. */
/* Board 807:8069's breakpoint chips: 24 high on a 4 radius, the label 11px —
   ink-muted at rest (807:8322/8323), and the SELECTED one filled --color/accent
   with the label in white Semi Bold (807:8325/8326). It shipped a 6 radius,
   12px labels in ink-soft, and a selected state that inverted the other way:
   a WHITE cell with blue-700 text raised on a shadow. Both readings are legible;
   the board's is the one the rest of the editor uses for a chosen thing
   (Row's aria-selected, the rail's active bar, the publish stepper). */
const BTN_BASE_CLASS =
  "tw:h-6 tw:rounded tw:border-0 tw:cursor-pointer tw:bg-transparent tw:text-[var(--bk-ink-muted)] " +
  "tw:inline-flex tw:items-center tw:justify-center tw:font-medium tw:text-[11px] tw:leading-none " +
  "tw:[font-family:var(--bk-font-ui)] tw:[transition:var(--bk-transition-fast)] tw:hover:text-[var(--bk-ink)] " +
  "tw:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)] " +
  "tw:aria-[pressed=true]:bg-[var(--bk-accent)] tw:aria-[pressed=true]:text-white " +
  "tw:aria-[pressed=true]:font-semibold";

export const BreakpointSwitcher = React.forwardRef<HTMLDivElement, BreakpointSwitcherProps>(
  function BreakpointSwitcher(
    { value, onChange, labelled = false, sublabels, includeWide = false, glyphs, className, ...rest },
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
          <HintTooltip key={bp.id} content={`${bp.label} \u00b7 ${widthHint(bp.id)}`}>
            <button
              type="button"
              /* Per-cell anchor, read by tests and the conformance harness;
                 measure.mjs refuses an ambiguous target if two switchers
                 ever render at once. */
              data-testid={`bp-cell-${bp.id}`}
              className={`${BTN_BASE_CLASS} ${labelled ? "tw:w-auto tw:px-3" : "tw:w-8"}`}
              aria-pressed={value === bp.id}
              aria-label={bp.label}
              onClick={() => onChange(bp.id)}
            >
              {labelled ? bp.label : (glyphs?.[bp.id] ?? <bp.Icon size={14} aria-hidden="true" />)}
              {labelled && sublabels?.[bp.id] ? (
                <span className="tw:ml-1 tw:font-normal tw:opacity-70">{sublabels[bp.id]}</span>
              ) : null}
            </button>
          </HintTooltip>
        ))}
      </div>
    );
  },
);
