/**
 * Issue-count copy — the one source for how the editor counts issues out
 * loud (plan D14, eng D7).
 *
 * @license BSD-3-Clause
 */

/**
 * The one pluralization primitive for issue counts — used by
 * `formatIssueSummary` below and by the publish-errors confirm and the export
 * modal, whose titles need one noun only (reusing the full summary there would
 * surface warnings in a title that is specifically about errors).
 */
export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * The one source for the FULL issue-count summary copy (plan D14, eng D7).
 * Locus-free on purpose (eng D13/T10): counts may mix page-bound and
 * site-wide issues, so naming a scope here would lie in one of them. Used by
 * the site menu's Issues row (the topbar IssueChip that carried it is gone —
 * C3, §16.1 row 11).
 */
export function formatIssueSummary(errors: number, warnings: number): string {
  const total = errors + warnings;
  if (total === 0) return "No issues";
  const parts = [errors > 0 && plural(errors, "error"), warnings > 0 && plural(warnings, "warning")]
    .filter(Boolean)
    .join(", ");
  return `${plural(total, "issue")} · ${parts} — review before publish`;
}
