"use client";

import type { ActivityFeed as ActivityFeedData, ActivityEntry } from "@lib/validations/dashboard";

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

function EntryRow({ entry }: { entry: ActivityEntry }) {
  return (
    <li className="flex items-start gap-3">
      {entry.actorAvatar ? (
        <img
          src={entry.actorAvatar}
          alt=""
          className="mt-0.5 h-5 w-5 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#E42313]" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#0D0D0D]">
          {entry.actorName && (
            <span className="font-medium">{entry.actorName} </span>
          )}
          {entry.description ?? entry.action}
        </p>
        <p className="mt-0.5 text-xs text-[#B0B0B0]">{timeAgo(entry.createdAt)}</p>
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
      <div className="rounded-xl border border-[#E8E8E8] bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-[#0D0D0D]">Activity</h2>
        <p className="py-8 text-center text-sm text-[#B0B0B0]">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E8E8E8] bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-[#0D0D0D]">Activity</h2>
      <div className="space-y-5">
        {feed.groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#7A7A7A]">
              {group.label}
            </p>
            <ul className="space-y-3">
              {group.entries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
