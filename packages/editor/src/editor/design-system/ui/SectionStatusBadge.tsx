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
 * ONLY "Draft preset" ships. That is the finding, not a shortcut.
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
import { Badge } from "@/editor/chrome-ui";

/** Only the state the data model can actually answer. `bound` / `unbound` are
 *  absent on purpose — see the note above. */
export type SectionStatus = "draft";

/** The board's wording, not a paraphrase (306:2161). */
const LABEL: Record<SectionStatus, string> = {
  draft: "Draft preset",
};

/** A draft is a state the user put the screen in, not a failure — so not red. */
const COLOR: Record<SectionStatus, string> = {
  draft: "info",
};

export interface SectionStatusBadgeProps {
  status: SectionStatus;
}

export function SectionStatusBadge({ status }: SectionStatusBadgeProps) {
  return (
    /* `flex`, not a bare block: flowbite's Badge is a span that stretches to
       its container, and it measured 263px wide against the board's
       content-width 73–128. The board draws a chip, not a bar. */
    <div className="tw:flex tw:px-4 tw:pt-2 tw:pb-1" data-testid="brand-section-status">
      <Badge color={COLOR[status]} data-testid={`brand-section-status-${status}`}>
        {LABEL[status]}
      </Badge>
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
