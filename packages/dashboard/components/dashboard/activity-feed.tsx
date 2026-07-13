"use client";

import type { ActivityFeed as ActivityFeedData, ActivityEntry } from "@buildrik/shared/schemas/dashboard";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Collapse consecutive identical entries (same actor + same text) into one
 * row carrying a repeat count. Without this the feed reads as a wall of
 * "Saqib Updated 2 settings" repeated dozens of times — repetition the user
 * has to scroll past with no added information.
 */
export function collapseEntries(entries: ActivityEntry[]): Array<{ entry: ActivityEntry; count: number }> {
  const out: Array<{ entry: ActivityEntry; count: number }> = [];
  for (const entry of entries) {
    const last = out[out.length - 1];
    const sameAs =
      last &&
      last.entry.actorName === entry.actorName &&
      (last.entry.description ?? last.entry.action) === (entry.description ?? entry.action);
    if (sameAs) last.count += 1;
    else out.push({ entry, count: 1 });
  }
  return out;
}

// Dot colors cycle through the accent set (primary → success → amber → teal)
// so the flat feed reads as a scannable, rhythmic list.
const DOT_COLORS = [
  "var(--color-primary)",
  "var(--color-success)",
  "var(--color-amber)",
  "var(--color-teal)",
];

function ActivityRow({ entry, count, index }: { entry: ActivityEntry; count: number; index: number }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: DOT_COLORS[index % DOT_COLORS.length] }}
      />
      <p className="min-w-0 flex-1 truncate text-body" style={{ color: "var(--color-text-primary)" }}>
        {entry.actorName && <span className="font-medium">{entry.actorName} </span>}
        {entry.description ?? entry.action}
        {count > 1 && (
          <span className="ml-1.5 text-body-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            ×{count}
          </span>
        )}
      </p>
      <span className="shrink-0 font-mono tabular-nums text-body-sm" style={{ color: "var(--color-text-muted)" }}>
        {timeAgo(entry.createdAt)}
      </span>
    </li>
  );
}

type ActivityFeedProps = {
  feed: ActivityFeedData;
};

/** Flat "Recent activity" list — colored dot + text + right-aligned mono
 *  timestamp per row. Renders rows only; the surrounding SectionCard owns the
 *  title, "View all" action, and card chrome. */
export function ActivityFeed({ feed }: ActivityFeedProps) {
  const rows = collapseEntries(feed.groups.flatMap((group) => group.entries));

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-body" style={{ color: "var(--color-text-muted)" }}>
        No activity yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3.5">
      {rows.map(({ entry, count }, i) => (
        <ActivityRow key={entry.id} entry={entry} count={count} index={i} />
      ))}
    </ul>
  );
}
