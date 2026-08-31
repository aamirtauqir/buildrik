/**
 * How many recorded changes each version captured since the one before it.
 *
 * Board 162:2 puts this on every row — `Auto-save · 3 changes · 16:20`. The row
 * shipped `{elementCount} el` instead, and never rendered even that:
 * `VersionList.tsx` hardcoded `elementCount={0}` at its only call site, so the
 * badge, its prop and its styling were all reachable and all dead.
 *
 * "Changes" are undo-stack entries, which is what the board's own sibling view
 * (`History · Saves · changes`) lists. Versions arrive NEWEST FIRST, matching
 * `useVersionHistory`.
 *
 * @license BSD-3-Clause
 */

/** A version, reduced to what this needs. */
export interface CountableVersion {
  id: string;
  createdAt: number;
}

/** A history entry, reduced to what this needs. */
export interface CountableEntry {
  timestamp: number;
}

/**
 * Map of version id → changes captured by that version.
 *
 * A version's window opens when the PREVIOUS version was taken and closes when
 * this one was. The oldest version has no predecessor, so its window is
 * everything before it — which the undo stack rarely reaches, and that is the
 * point of the omission rule below.
 *
 * Ids absent from the map mean "not known", never "zero". The undo stack is
 * bounded and does not reach back to old versions, so a count of 0 there is the
 * absence of evidence rather than evidence of no change — and a row that
 * announces "0 changes" over a version that reshaped the site is a lie the
 * board never asked for. Callers render the badge only for ids present here.
 */
export function versionChangeCounts(
  versions: CountableVersion[],
  history: CountableEntry[]
): Map<string, number> {
  const counts = new Map<string, number>();
  if (versions.length === 0 || history.length === 0) return counts;

  const stamps = history.map((e) => e.timestamp);

  for (let i = 0; i < versions.length; i++) {
    const closes = versions[i].createdAt;
    const opens = i + 1 < versions.length ? versions[i + 1].createdAt : -Infinity;
    const n = stamps.filter((t) => t > opens && t <= closes).length;
    if (n > 0) counts.set(versions[i].id, n);
  }

  return counts;
}
