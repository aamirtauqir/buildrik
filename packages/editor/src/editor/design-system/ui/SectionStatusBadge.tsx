/**
 * The status badge the Brand drill-in screens are drawn with and did not have.
 *
 * Eight Brand boards carry `authority: open:status-pill-convention`. Read from
 * Figma on 2026-08-27, the convention is not open at all — the boards agree and
 * settle it: a SINGLE Badge, x=16, height 20, in the band between the back row
 * (44→80) and the first content row (y=80). One per SCREEN, not one per row.
 *
 * The labels are the boards' own, read out of their reference code, and their
 * widths corroborate each one:
 *
 *   306:2111  "Bound to elements"  128px
 *   306:2136  "Unbound"             73px
 *   306:2161  "Draft preset"        89px
 *
 * Of THAT trio only "Draft preset" ships. That is the finding, not a shortcut.
 * The rest of the family's Badge instances are separate states and four of them
 * do ship: 306:2232 "Exported", 306:2265 "Imported tokens", 306:2186
 * "Starter applied" and 306:2217 "Warnings suppressed" — each answerable from
 * state the panel already holds.
 *
 * The first guess here was that "bound" meant a preset's `bindings` all resolve
 * to a token id — `bindings: Record<string, { tokenId: string }>` in
 * project.ts — and a badge was built on it. The board says ELEMENTS, not
 * tokens, and that is a different question: is this preset applied anywhere on
 * the page. Nothing can answer it. Elements carry no preset reference at all
 * (`ElementManager`, `element.ts`), and `TokenUsageTracker` recomputes usage for
 * TOKENS, not presets.
 *
 * So `presets · bound` and `presets · unbound` are design-ahead boards sitting
 * in the census as `active`: they specify a state the data model cannot
 * produce. Shipping a badge that answered the tokens question under the board's
 * elements wording would have been a lie wearing the right label.
 *
 * `Draft preset` is real — it is the registry's own `isDirty`, the buffer Apply
 * and Discard sit on — so it is what renders.
 *
 * Precedence, per CLAUDE.md: the BOARD wins on anything visual (placement,
 * height, inset, wording); the CODE contract wins on behaviour (whether a state
 * can be stated at all).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

/** Only the state the data model can actually answer. `bound` / `unbound` are
 *  absent on purpose — see the note above. */
export type SectionStatus =
  | "draft"
  | "exported"
  | "imported"
  | "import-failed"
  | "starter-applied"
  | "warnings-suppressed";

/** The boards' wording, not a paraphrase — 306:2161, 306:2232, 306:2186 and
 *  306:2217. The export label names the FORMAT ("Exported CSS"), so it
 *  composes. */
const LABEL: Record<SectionStatus, string> = {
  draft: "Draft preset",
  exported: "Exported",
  imported: "Imported tokens",
  "import-failed": "Import failed",
  "starter-applied": "Starter applied",
  "warnings-suppressed": "Warnings suppressed",
};

/** Neither is a failure — a draft is a state the user chose, an export is a
 *  thing that worked — so neither is red. */
/* Boards 306:2232 / 2265 / 2298 draw a bordered pill — 20 tall, radius full,
   12/500 — not flowbite's square Badge, which measured radius 4, no border and
   weight 600 against all three. */
/* The inset is 10, not 8, and the label leads at 16, not 1 — every Badge
   instance in the family states `px-[10px] py-[2px]` with a 16px line
   (333:2348, 333:2350, 333:2356, 333:2358). Height is left to fall out of
   2 + line + 2 rather than pinned at `h-5`, because 333:2360 leads at 18 and a
   fixed 20 clipped it.
   `rounded-[9999px]`, not `rounded-full`: Tailwind v4 compiles the latter to
   `calc(infinity * 1px)`, which a browser reports as 3.35544e+07px — a value
   no length parser reads, so the radius the boards state (`rounded-[9999px]`
   on all four Badge instances) came back UNCOMPARABLE rather than equal. Same
   pixel, a number the diff can see. */
const PILL =
  "tw:inline-flex tw:items-center tw:rounded-[9999px] tw:border tw:px-2.5 tw:py-0.5 tw:text-xs tw:font-medium";
/* Its own map rather than a `leading-[18px]` appended to COLOR: two `tw:`
   line-height utilities on one plain span do not merge — both compile and the
   stylesheet's source order picks the winner (CLAUDE.md, the flowbite/twMerge
   trap). One key, one value, no race. */
const LEADING: Record<SectionStatus, string> = {
  draft: "tw:leading-4",
  exported: "tw:leading-4",
  imported: "tw:leading-4",
  "import-failed": "tw:leading-4",
  "starter-applied": "tw:leading-4",
  "warnings-suppressed": "tw:leading-[18px]",
};
const COLOR: Record<SectionStatus, string> = {
  /* Gray, not accent. 333:2356 fills the draft pill `--flowbite/gray/200` with
     a `gray/400` edge and `gray/700` label; the blue it shipped in read as a
     call to action on a state that is only a fact. */
  draft: "tw:border-[var(--bk-gray-400)] tw:bg-[var(--bk-gray-200)] tw:text-[var(--bk-gray-700)]",
  /* 333:2362 names `--flowbite/green/700` for the label, which is
     `--bk-green-700` #046c4e — a shade darker than `--bk-success-text`
     (green-600, #057a55). Same call as `starter-applied` on 333:2358: the
     board names the palette entry, not the semantic. Only `exported` moves;
     `imported` is measured on 306:2265 by another recipe. */
  exported: "tw:border-[var(--bk-success)] tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-green-700)]",
  imported: "tw:border-[var(--bk-success)] tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-success-text)]",
  /* The one state here that IS a failure, and the only one that may be red. */
  "import-failed": "tw:border-[var(--bk-error)] tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]",
  /* 333:2358. `--bk-green-700` rather than `--bk-success-text`: the two are a
     a shade apart and the board names the palette entry, not the semantic. */
  "starter-applied":
    "tw:border-[var(--bk-success)] tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-green-700)]",
  /* 333:2360. `--bk-warning` resolves to the same value as the board's
     `--flowbite/yellow/500`, and `--bk-yellow-100` is its fill; only the 18px
     line is peculiar to this instance. */
  "warnings-suppressed":
    "tw:border-[var(--bk-warning)] tw:bg-[var(--bk-yellow-100)] tw:text-[var(--bk-warning-text)]",
};

export interface SectionStatusBadgeProps {
  status: SectionStatus;
  /** Appended to the label — board 306:2232 reads "Exported CSS", naming the
   *  format that was written. */
  detail?: string;
  /** `status` for anything a screen reader should announce when it appears
   *  (a starter was applied), `undefined` for a standing fact (this preset is
   *  a draft). */
  role?: "status";
}

export function SectionStatusBadge({ status, detail, role }: SectionStatusBadgeProps) {
  return (
    /* `flex`, not a bare block: flowbite's Badge is a span that stretches to
       its container, and it measured 263px wide against the board's
       content-width 73–128. The board draws a chip, not a bar. */
    <div className="tw:flex tw:px-4 tw:pt-2 tw:pb-1" data-testid="brand-section-status">
      <span
        role={role}
        className={`${PILL} ${LEADING[status]} ${COLOR[status]}`}
        data-testid={`brand-section-status-${status}`}
      >
        {detail ? `${LABEL[status]} ${detail}` : LABEL[status]}
      </span>
    </div>
  );
}

/**
 * Which badge the Presets screen shows, or `null` for none.
 *
 * One state, deliberately. The screen has no way to know whether a preset is
 * bound to elements, so it says nothing rather than guessing — an absent badge
 * is honest; a wrong one is not.
 */
export function presetsStatus(dirty: boolean): SectionStatus | null {
  return dirty ? "draft" : null;
}
