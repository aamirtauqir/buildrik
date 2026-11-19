/**
 * The one SEO status word a page shows (FG-008): the drawer's tab, the Pages
 * dot and the Settings overview all read it from the same findings. Status
 * words are exactly the owner's — never a number.
 */
import type { Finding } from "./analysis";

export type SeoStatus = "not-checked" | "needs-attention" | "no-issues" | "hidden";

export const SEO_STATUS_LABEL: Record<SeoStatus, string> = {
  "not-checked": "Not checked",
  "needs-attention": "Needs attention",
  "no-issues": "No issues detected",
  hidden: "Hidden from search",
};

/** `findings === null` means the page has not been analysed yet. */
export function seoStatus(findings: ReadonlyArray<Finding> | null, opts: { noIndex: boolean }): SeoStatus {
  if (opts.noIndex) return "hidden";
  if (findings === null) return "not-checked";
  return findings.some((f) => f.rating !== "good") ? "needs-attention" : "no-issues";
}

/** "2 problems · 3 improvements" — the count part of an accessible label. */
export function findingCounts(findings: ReadonlyArray<Finding>): string {
  const problems = findings.filter((f) => f.rating === "problem").length;
  const improvements = findings.filter((f) => f.rating === "improvement").length;
  const part = (n: number, one: string) => (n ? `${n} ${one}${n === 1 ? "" : "s"}` : "");
  return [part(problems, "problem"), part(improvements, "improvement")].filter(Boolean).join(" · ");
}
