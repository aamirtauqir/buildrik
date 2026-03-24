"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { StatCard, MiniDonut, Sparkline, AvatarStack, TrendArrow } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentSites } from "@/components/dashboard/recent-sites";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { WorkspaceHealth } from "@/components/dashboard/workspace-health";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DashboardChecklist } from "@/components/onboarding/dashboard-checklist";
import Link from "next/link";
import { Plus } from "lucide-react";

type ActivityFilter = "all" | "mine" | "team";

const QUICK_ACTIONS_NEW_USER = [
  { label: "Create Site", href: "/dashboard/sites/new", icon: "Plus" as const, description: "Start from scratch" },
  { label: "Set Up Profile", href: "/dashboard/settings", icon: "Settings" as const, description: "Personalize your account" },
  { label: "Explore Templates", href: "/dashboard/sites/new?method=template", icon: "LayoutTemplate" as const, description: "Browse 50+ templates" },
  { label: "Invite Team", href: "/dashboard/team", icon: "UserPlus" as const, description: "Collaborate together" },
];

const QUICK_ACTIONS_ACTIVE = [
  { label: "New Site", href: "/dashboard/sites/new", icon: "Plus" as const, description: "Create a new site" },
  { label: "View Analytics", href: "/dashboard/sites", icon: "BarChart3" as const, description: "Check site performance" },
  { label: "Manage Domains", href: "/dashboard/sites", icon: "Globe" as const, description: "Connect custom domains" },
  { label: "Invite Member", href: "/dashboard/team", icon: "UserPlus" as const, description: "Add team members" },
];

export default function DashboardPage() {
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const stats = trpc.dashboard.stats.useQuery();
  const recentSites = trpc.dashboard.recentSites.useQuery();
  const activity = trpc.dashboard.activity.useQuery({ filter: activityFilter });
  const health = trpc.dashboard.health.useQuery();
  const onboardingState = trpc.onboarding.getState.useQuery();
  const dismissOnboarding = trpc.onboarding.dismiss.useMutation({
    onSuccess: () => onboardingState.refetch(),
  });
  const showChecklist = onboardingState.data && !onboardingState.data.completed && !onboardingState.data.dismissed;

  const isLoading = stats.isLoading || recentSites.isLoading;
  const isEmpty = stats.data?.totalSites === 0;

  const quickActions = isEmpty ? QUICK_ACTIONS_NEW_USER : QUICK_ACTIONS_ACTIVE;

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Dashboard</h1>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Dashboard</h1>
        <Link href="/dashboard/sites/new" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>
          <Plus className="h-4 w-4" />New Site
        </Link>
      </div>

      {isEmpty ? (
        <div className="mt-8">
          <EmptyState variant="owner_new" />
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              title="Total Sites"
              value={`${stats.data?.totalSites ?? 0} sites`}
              subtitle={`${stats.data?.publishedSites ?? 0} published · ${stats.data?.draftSites ?? 0} draft`}
              href="/dashboard/sites"
              visual={
                <MiniDonut
                  segments={[
                    { value: stats.data?.publishedSites ?? 0, color: "#22C55E" },
                    { value: stats.data?.draftSites ?? 0, color: "#EAB308" },
                    { value: stats.data?.archivedSites ?? 0, color: "#7A7A7A" },
                  ]}
                />
              }
            />
            <StatCard
              title="Published"
              value={`${stats.data?.publishedSites ?? 0} live`}
              subtitle={stats.data?.lastPublishedSiteName ? `Last: ${stats.data.lastPublishedSiteName}` : undefined}
              href="/dashboard/sites?status=published"
            />
            <StatCard
              title="Monthly Visits"
              value={stats.data?.monthlyVisits ?? 0}
              href="/dashboard/sites"
              trend={stats.data?.visitsChange !== undefined ? { value: stats.data.visitsChange, label: "vs last month" } : undefined}
              visual={
                <div className="flex flex-col items-end gap-1">
                  {stats.data?.dailyVisitors && stats.data.dailyVisitors.length >= 2 && (
                    <Sparkline data={stats.data.dailyVisitors} />
                  )}
                  {stats.data?.visitsChange !== undefined && (
                    <TrendArrow value={stats.data.visitsChange} />
                  )}
                </div>
              }
            />
            <StatCard
              title="Collaborators"
              value={`${stats.data?.collaborators ?? 0} active`}
              subtitle={stats.data?.pendingInvites ? `${stats.data.pendingInvites} pending` : undefined}
              href="/dashboard/team"
              visual={
                stats.data?.memberAvatars && stats.data.memberAvatars.length > 0
                  ? <AvatarStack avatars={stats.data.memberAvatars} />
                  : undefined
              }
            />
          </div>

          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Recent Sites */}
          {recentSites.data && recentSites.data.length > 0 && (
            <RecentSites sites={recentSites.data} />
          )}

          {/* Activity + Health side by side */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="mb-2 flex gap-1">
                {(["all", "mine", "team"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActivityFilter(f)}
                    className={
                      activityFilter === f
                        ? "rounded-lg bg-[#F4F4F4] px-3 py-1 text-xs font-medium text-[#0D0D0D]"
                        : "rounded-lg px-3 py-1 text-xs text-[#7A7A7A] hover:bg-[#F4F4F4]"
                    }
                  >
                    {f === "all" ? "All" : f === "mine" ? "My Activity" : "Team"}
                  </button>
                ))}
              </div>
              <ActivityFeed feed={activity.data ?? { groups: [] }} />
            </div>
            <div>
              {health.data && <WorkspaceHealth data={health.data} />}
            </div>
          </div>
        </div>
      )}
      {showChecklist && (
        <DashboardChecklist
          completedIds={onboardingState.data?.dashboardTasks as string[] | undefined}
          onDismiss={() => dismissOnboarding.mutate()}
        />
      )}
    </div>
  );
}
