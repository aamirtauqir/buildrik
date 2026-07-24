"use client";

import { CheckCircle2, AlertTriangle, Settings2, UserPlus, Rocket, Activity, ChevronDown, type LucideIcon } from "lucide-react";
import type { ActivityFeed as ActivityFeedData, ActivityEntry } from "@buildrik/shared/schemas/dashboard";
import { cn } from "@lib/utils";

// Map an activity to a colored icon chip by keyword in its action/description.
// Real audit-log entries have no `type` enum, so we classify on the visible
// text — the same signal the reader sees. Tone drives both the icon and the
// chip tint; falls back to a neutral activity glyph.
function activityVisual(text: string): { Icon: LucideIcon; tone: string } {
  const t = text.toLowerCase();
  if (t.includes("fail") || t.includes("error")) return { Icon: AlertTriangle, tone: "var(--color-amber)" };
  if (t.includes("publish") || t.includes("deploy") || t.includes("live")) return { Icon: CheckCircle2, tone: "var(--color-success)" };
  if (t.includes("join") || t.includes("invite") || t.includes("member") || t.includes("team")) return { Icon: UserPlus, tone: "var(--color-primary)" };
  if (t.includes("setting") || t.includes("updated") || t.includes("changed")) return { Icon: Settings2, tone: "var(--color-teal)" };
  if (t.includes("site") || t.includes("app") || t.includes("build")) return { Icon: Rocket, tone: "var(--color-primary)" };
  return { Icon: Activity, tone: "var(--color-text-muted)" };
}

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
      last.entry.siteName === entry.siteName &&
      (last.entry.description ?? last.entry.action) === (entry.description ?? entry.action);
    if (sameAs) last.count += 1;
    else out.push({ entry, count: 1 });
  }
  return out;
}

function ActivityRow({ entry, count, isLast }: { entry: ActivityEntry; count: number; isLast: boolean }) {
  return (
    <li
      className={cn("flex items-center gap-[11px] px-[18px] py-[13px]", !isLast && "border-b")}
      style={{ borderColor: "var(--color-border-default)" }}
    >
      {(() => {
        const { Icon, tone } = activityVisual(`${entry.action} ${entry.description ?? ""}`);
        return (
          <span
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px]"
            style={{ backgroundColor: `color-mix(in srgb, ${tone} 12%, transparent)`, color: tone }}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        );
      })()}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-[13.5px]" style={{ color: "var(--color-text-primary)" }}>
          {entry.actorName && <span className="font-semibold">{entry.actorName} </span>}
          {entry.description ?? entry.action}
          {entry.siteName && (
            <span style={{ color: "var(--color-text-secondary)" }}> · {entry.siteName}</span>
          )}
          {count > 1 && (
            <span className="ml-1.5 text-body-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
              ×{count}
            </span>
          )}
        </p>
        <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
          {timeAgo(entry.createdAt)}
        </p>
      </div>
      <ChevronDown className="h-[15px] w-[15px] shrink-0" style={{ color: "var(--color-text-muted)" }} />
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
      <p className="px-5 py-8 text-center text-body" style={{ color: "var(--color-text-muted)" }}>
        No activity yet.
      </p>
    );
  }

  return (
    <ul>
      {rows.map(({ entry, count }, i) => (
        <ActivityRow key={entry.id} entry={entry} count={count} isLast={i === rows.length - 1} />
      ))}
    </ul>
  );
}
