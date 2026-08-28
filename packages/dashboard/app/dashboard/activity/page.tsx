"use client";

import { useState } from "react";
import { trpc } from "@lib/trpc/client";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { SectionCard, FilterTabs } from "@/components/dashboard/primitives";
import { ErrorState } from "@/components/states";

type ActivityFilter = "all" | "mine" | "team";

const FILTERS: readonly { value: ActivityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mine", label: "Mine" },
  { value: "team", label: "Team" },
];

/** The full workspace activity history — the honest destination for the home
 *  card's "View all" (which used to land on Notifications, a different concept). */
export default function ActivityPage() {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const activity = trpc.dashboard.activity.useQuery({ filter });

  // Left-aligned, not centred: `mx-auto` put this H1 at x=483 while the other
  // nine sidebar screens sit at x=333, so the title slid 150px sideways on the
  // way in from Home. `py-8` also went — every other screen's header starts at
  // the same y. Measured on all 12 screens.
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-page-title" style={{ color: "var(--color-text-primary)" }}>Activity</h1>
          <p className="mt-1 text-body" style={{ color: "var(--color-text-secondary)" }}>
            Everything that&apos;s happened across your workspace.
          </p>
        </div>
        <FilterTabs value={filter} onChange={setFilter} options={FILTERS} label="Activity type" />
      </div>

      {activity.isError ? (
        <ErrorState title="Couldn't load activity" description="Something went wrong on our end." onRetry={() => activity.refetch()} />
      ) : activity.isLoading ? (
        <div className="h-64 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
      ) : (
        <SectionCard title="Recent activity" padding="none">
          <ActivityFeed feed={activity.data ?? { groups: [] }} />
        </SectionCard>
      )}
    </div>
  );
}
