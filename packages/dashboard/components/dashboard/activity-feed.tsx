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

function EntryRow({ entry, count }: { entry: ActivityEntry; count: number }) {
  return (
    <li className="flex items-start gap-3">
      {entry.actorAvatar ? (
        <img
          src={entry.actorAvatar}
          alt=""
          className="mt-0.5 h-5 w-5 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-text-primary)]">
          {entry.actorName && (
            <span className="font-medium">{entry.actorName} </span>
          )}
          {entry.description ?? entry.action}
          {count > 1 && (
            <span className="ml-1.5 text-xs font-medium text-[var(--color-text-muted)]">
              ×{count}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{timeAgo(entry.createdAt)}</p>
      </div>
    </li>
  );
}

type ActivityFeedProps = {
  feed: ActivityFeedData;
};

export function ActivityFeed({ feed }: ActivityFeedProps) {
  if (feed.groups.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border-default)] bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Activity</h2>
        <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Activity</h2>
      <div className="space-y-5">
        {feed.groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              {group.label}
            </p>
            <ul className="space-y-3">
              {collapseEntries(group.entries).map(({ entry, count }) => (
                <EntryRow key={entry.id} entry={entry} count={count} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
