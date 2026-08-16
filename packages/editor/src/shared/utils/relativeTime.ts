/**
 * formatRelativeTime — single source of truth for "Nm ago" / "Just now" labels.
 *
 * Replaces 4 near-identical inline implementations across editor/shell,
 * editor/sync, and editor/sidebar/tabs/history. Behavioral options preserve
 * each callsite's existing UX (long-form for ConflictModal, sub-minute
 * seconds for StatusIndicators, time-of-day fallback for history panel).
 *
 * @license BSD-3-Clause
 */

export type RelativeTimeFormat = "short" | "long";
export type RelativeTimeFallback = "date" | "time" | "days" | "daysShort";

export interface RelativeTimeOptions {
  /** "Nm ago" (default) vs "N min ago" / "N hours ago". */
  format?: RelativeTimeFormat;
  /**
   * What to show once the timestamp is older than 24h. "days" is the long
   * form ("2 days ago"); "daysShort" is "2d ago".
   *
   * They are separate values rather than `format` because `format` also
   * governs the minute and hour branches, and the three existing "days"
   * callers (StudioHeader, NotificationPanel, SaveStatus) want short minutes
   * AND long days — "Saved · 2m ago" under an hour, "Saved · 2 days ago" over
   * a day. Routing this through `format` flipped their minutes too and broke
   * three tests that were right.
   */
  fallback?: RelativeTimeFallback;
  /** Show "Ns ago" for sub-minute diffs. Default: collapse to justNowLabel. */
  showSeconds?: boolean;
  /** Sub-threshold label. Default "Just now". */
  justNowLabel?: string;
}

export function formatRelativeTime(
  timestamp: number,
  opts: RelativeTimeOptions = {}
): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  const format = opts.format ?? "short";
  const justNow = opts.justNowLabel ?? "Just now";

  if (opts.showSeconds) {
    if (seconds < 10) return justNow;
    if (seconds < 60) return `${seconds}s ago`;
  } else if (seconds < 60) {
    return justNow;
  }

  if (minutes < 60) {
    return format === "long" ? `${minutes} min ago` : `${minutes}m ago`;
  }
  if (hours < 24) {
    if (format === "long") return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    return `${hours}h ago`;
  }

  switch (opts.fallback ?? "date") {
    case "time":
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "daysShort":
      // Media's versions board (146:32) draws "2d ago" in a 320 panel whose
      // row already carries a size delta and a ⋯. Before this existed the
      // rows fell through to `date` and printed "8/15/2026".
      return `${days}d ago`;
    case "days":
      return `${days} day${days === 1 ? "" : "s"} ago`;
    case "date":
    default:
      return new Date(timestamp).toLocaleDateString();
  }
}
