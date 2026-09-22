/**
 * chipTones — the ONE 4-tone palette for every shell-level chip and pill.
 *
 * Plan #26 (C2): `PublishGateBanner`, the Topbar `ReviewBadge`, and the
 * `IssueChip` were three independent tone vocabularies drifting apart. The
 * banner used `error | warn | neutral | hidden` (4-tone, --bk-* tokens);
 * IssueChip used `neutral | warning | error` with Tailwind defaults
 * (`tw:bg-yellow-50`, `tw:bg-red-100`) — not the bk-warning-tint / bk-error-tint
 * the design system says to use; Topbar used `info | warning | success` and
 * rendered `warning` as amber. Three tables, two halves of one palette.
 *
 * This module is the single source of truth:
 *   1. The 4-tone `Tone` vocabulary
 *   2. `TONE_FOR_GATE` — `NextMoveGate → Tone` for every gate value
 *   3. `TONE_CLASS` — every `Tone → CSS class string` (--bk-* tokens only)
 *   4. `toneForIssues(errors, warnings)` — issue-derived chips
 *   5. `toneForReviewPill(reviewTone)` — legacy 3-tone → 4-tone adapter for
 *      `Topbar.ReviewTone`, kept here so the chrome-ui ReviewBadge does not
 *      need to know about `Tone` directly.
 *
 * `--bk-*` tokens only — never Tailwind defaults (`tw:bg-yellow-50` is NOT a
 * token). The token names below are verified against
 * `src/themes/tokens.generated.css`; Gate `gate:tokens-generated` will fail a
 * rename.
 *
 * No `<button>` / `<input>` / `<select>` / `<textarea>` here — this file
 * exports pure constants and helpers (Gate 24: chrome-ui is the only exempt
 * owner of native chrome elements).
 *
 * @license BSD-3-Clause
 */
import type { NextMoveGate } from "./lifecycle";

/**
 * The 4-tone chip palette. `hidden` means "do not render" — `publish-anyway`
 * siblings that compute to `hidden` must short-circuit before allocating
 * a chip, not paint an empty box.
 */
export type Tone = "error" | "warn" | "neutral" | "hidden";

/**
 * Map every `NextMoveGate` value to a chip tone. `changes-requested` is a
 * non-publish move (`kind: "open-feedback"`) so callers short-circuit before
 * this table — keeping it here as `"hidden"` documents the contract in one
 * file. `confirm` and `none` are deliberately `hidden`: painting "Waiting"
 * over a `confirm` move would contradict the open-feedback CTA that already
 * named the next act.
 */
export const TONE_FOR_GATE: Record<NextMoveGate, Tone> = {
  "open-errors": "error",
  "changes-requested": "hidden",
  waiting: "neutral",
  "stale-approval": "warn",
  confirm: "hidden",
  none: "hidden",
};

/**
 * CSS class string per `Tone`. Border / surface / ink all come from
 * `--bk-*` tokens — never `tw:bg-yellow-50` / `tw:bg-red-100` (Tailwind
 * defaults that drift from the design system on theme edits).
 *
 * The `hidden` entry is the empty string: callers MUST short-circuit on
 * `tone === "hidden"` before allocating a chip container.
 */
export const TONE_CLASS: Record<Tone, string> = {
  /* red-50 surface, red-700 border + ink. Matches the failureSection's
     `--bk-error-text`/`--bk-error-bg` use in PublishTab — the two reds read
     as the same colour ten pixels apart. */
  error:
    "tw:border-[var(--bk-error)] tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]",
  /* amber-50 surface — the only "still ok, but check this" tone in the
     palette. The review pill pulses this colour on `reviewChangesRequested`;
     the publish banner uses it for `stale-approval`. */
  warn:
    "tw:border-[var(--bk-warning)] tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]",
  /* The "Sent — waiting on Sara" tone: surface is soft neutral, ink is body.
     Not a warning, not an error. The review pill already uses this colour
     for "In review" and "Approved"; the banner uses it for `waiting`. */
  neutral:
    "tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink)]",
  /* Not rendered. Kept in the table so every tone value is reviewable here.
     Empty string — callers MUST check `tone === "hidden"` and return null. */
  hidden: "",
};

/**
 * Issue counts → tone. The chip carries severity by shape AND colour (F25,
 * never colour-alone) so the colour decision is co-equal with the glyph
 * choice, not a fallback.
 *
 *   errors > 0       → error tone, octagon glyph
 *   warnings > 0     → warn tone,  triangle glyph
 *   both zero        → neutral tone, shield-check glyph
 *
 * `hidden` is not a valid result here — the IssueChip is always rendered.
 */
export function toneForIssues(errors: number, warnings: number): Tone {
  if (errors > 0) return "error";
  if (warnings > 0) return "warn";
  return "neutral";
}

/**
 * Topbar's review pill (chrome-ui/Topbar.tsx) still uses a 3-tone vocabulary
 * (`info | warning | success`) so existing call sites don't need to change.
 * This adapter is the ONE place that maps the legacy vocab to the 4-tone
 * palette — co-located here so the chrome-ui ReviewBadge never imports
 * `Tone` directly (chrome-ui surface contract: chrome-ui imports chrome-ui).
 *
 *   info     → neutral  (no urgency, e.g. "In review")
 *   success  → neutral  (approved, all-clear)
 *   warning  → warn     (e.g. "Changes requested" — the only blocking review
 *                        state, which IS a warning to publish)
 *
 * There is no `error` mapping: a review state is never error-typed (errors
 * live in the IssueChip, never in the review pill).
 */
export type LegacyReviewTone = "info" | "warning" | "success";

export function toneForReviewPill(review: LegacyReviewTone): Tone {
  if (review === "warning") return "warn";
  return "neutral";
}
