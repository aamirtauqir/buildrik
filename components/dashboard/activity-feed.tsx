"use client";

import { useState } from "react";
import type { ActivityEntry } from "@/lib/validations/dashboard";

type FilterTab = "all" | "mine" | "team";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mine", label: "My Activity" },
  { key: "team", label: "Team Activity" },
];

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

type ActivityFeedProps = {
  entries: ActivityEntry[];
  currentUserId?: string;
};

export function ActivityFeed({ entries, currentUserId }: ActivityFeedProps) {
  const [tab, setTab] = useState<FilterTab>("all");

  const filtered = entries.filter((entry) => {
    if (tab === "mine") return entry.actorName !== null && currentUserId !== undefined;
    if (tab === "team") return entry.actorName !== null;
    return true;
  });

  return (
    <div className="rounded-xl border border-[#E8E8E8] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#0D0D0D]">Activity</h2>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                tab === t.key
                  ? "rounded-lg bg-[#F4F4F4] px-3 py-1 text-xs font-medium text-[#0D0D0D]"
                  : "rounded-lg px-3 py-1 text-xs text-[#7A7A7A] hover:bg-[#F4F4F4]"
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#B0B0B0]">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#E42313]" />
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
          ))}
        </ul>
      )}
    </div>
  );
}
