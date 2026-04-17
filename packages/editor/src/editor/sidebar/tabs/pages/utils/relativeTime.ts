/**
 * relativeTime — ISO8601 → short human string.
 * Buckets: just now (<60s) / Nm ago (<60m) / Nh ago (<24h) / yesterday (24-48h) /
 * Nd ago (<7d) / Nw ago (>=7d). Empty string on invalid/undefined input.
 *
 * @license BSD-3-Clause
 */

export function relativeTime(iso: string | undefined, nowMs: number = Date.now()): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, nowMs - t);
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 2) return "yesterday";
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}
