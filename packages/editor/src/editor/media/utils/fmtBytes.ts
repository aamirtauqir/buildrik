/**
 * fmtBytes — D5 Stage 2 extraction (audit-remediation 2026-05-08).
 *
 * Library Manager's display contract for byte sizes:
 *   < 1 KB   → "{n} B"        (no decimals)
 *   < 1 MB   → "{n.n} KB"     (1 decimal)
 *   ≥ 1 MB   → "{n.n} MB"     (1 decimal)
 *
 * Distinct from `shared/utils/helpers/number.ts:formatBytes` which
 * uses "Bytes"/2-decimal display — that one's contract is wrong for
 * the Library Manager's compact UI density. Don't unify; the
 * audit's "duplicate" call was off.
 *
 * @license BSD-3-Clause
 */

export function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
