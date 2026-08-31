/**
 * IssueChip — the topbar's permanent issues anchor.
 *
 * Figma node: PENDING — T1 of docs/plans/2026-07-30-topbar-complete-redesign.md
 * (code-first per the B9 as-built ledger pattern; draw the node, then put its
 * id here).
 *
 * Always visible (plan D6): a chip that appears only when something is wrong
 * moves the buttons around it and teaches its location only after the first
 * failure. At zero it is the "all clear" reassurance and still opens the
 * Issues panel. Severity is carried by shape AND colour (F25 — never colour
 * alone): shield-check at zero, triangle for warnings, octagon for errors.
 * The colour previews the publish outcome — an amber/red chip means Publish
 * will read "Publish anyway".
 *
 * Copy rule (D14): the chip shows the TOTAL count; the breakdown lives in the
 * tooltip and accessible name via `formatIssueSummary`. StudioHeader's
 * publish-anyway confirm modal does NOT import `formatIssueSummary` — its
 * title is errors-only copy (that modal only opens when errorCount > 0), so
 * it shares only the `plural` primitive below, not the full summary string.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface IssueChipProps {
  errors: number;
  warnings: number;
  onClick?: () => void;
  /** Viewer-role hint appended to the tooltip — the chip stays readable, the fix door is labelled shut. */
  readOnlyReason?: string;
}

/**
 * The one pluralization primitive for issue counts — used directly by
 * `formatIssueSummary` below (chip tooltip/aria) and by StudioHeader's
 * publish-anyway confirm modal (its title only ever needs the error count,
 * since that modal is gated on errorCount > 0 and warnings alone never
 * trigger it — reusing the full `formatIssueSummary` string there would wrongly
 * surface warnings in a title that's specifically about errors).
 */
export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * The one source for the FULL issue-count summary copy (plan D14, eng D7).
 * Locus-free on purpose (eng D13/T10): counts may mix page-bound and
 * site-wide issues, so naming a scope here would lie in one of them. Used by
 * IssueChip's tooltip and accessible name.
 */
export function formatIssueSummary(errors: number, warnings: number): string {
  const total = errors + warnings;
  if (total === 0) return "No issues";
  const parts = [errors > 0 && plural(errors, "error"), warnings > 0 && plural(warnings, "warning")]
    .filter(Boolean)
    .join(", ");
  return `${plural(total, "issue")} · ${parts} — review before publish`;
}

/** Accessible name: count AND severity, never colour-only (F25). */
function ariaName(errors: number, warnings: number): string {
  const total = errors + warnings;
  if (total === 0) return "No issues";
  return errors > 0
    ? `${plural(total, "issue")}, ${plural(errors, "error")}`
    : `${plural(total, "issue")}, ${plural(warnings, "warning")}`;
}

const ShieldCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const Triangle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);
const Octagon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

const BASE_CLASS =
  "tw:inline-flex tw:items-center tw:gap-1 tw:h-7 tw:px-2 tw:border-0 tw:bg-transparent " +
  "tw:rounded-md tw:cursor-pointer tw:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

const TONE_CLASS: Record<"neutral" | "warning" | "error", string> = {
  neutral: "tw:text-[var(--bk-ink-muted)] tw:hover:bg-gray-100",
  warning: "tw:text-yellow-800 tw:hover:bg-yellow-50",
  error: "tw:text-red-700 tw:hover:bg-red-100",
};

export function IssueChip({ errors, warnings, onClick, readOnlyReason }: IssueChipProps) {
  const total = errors + warnings;
  const tone = errors > 0 ? "error" : warnings > 0 ? "warning" : "neutral";
  const summary = formatIssueSummary(errors, warnings);
  const title = readOnlyReason ? `${summary} — ${readOnlyReason}` : summary;
  const label = readOnlyReason ? `${ariaName(errors, warnings)} — ${readOnlyReason}` : ariaName(errors, warnings);
  return (
    <button
      type="button"
      className={`${BASE_CLASS} ${TONE_CLASS[tone]}`}
      aria-label={label}
      title={title}
      onClick={onClick}
    >
      {tone === "neutral" ? <ShieldCheck /> : tone === "warning" ? <Triangle /> : <Octagon />}
      {total > 0 ? (
        <span className="tw:text-xs tw:font-semibold tw:tabular-nums">{total > 99 ? "99+" : total}</span>
      ) : null}
    </button>
  );
}

export default IssueChip;
