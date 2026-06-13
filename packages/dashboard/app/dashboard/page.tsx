"use client";

import { useState } from "react";
import { trpc } from "@lib/trpc/client";
import { StatCard, MiniDonut, Sparkline, AvatarStack, TrendArrow } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentSites } from "@/components/dashboard/recent-sites";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { WorkspaceHealth } from "@/components/dashboard/workspace-health";
import { EmptyState, type EmptyStateVariant } from "@/components/dashboard/empty-state";
import { DunningBanner } from "@/components/dashboard/dunning-banner";
import { DashboardChecklist } from "@/components/onboarding/dashboard-checklist";
import Link from "next/link";
import { Plus } from "lucide-react";

type ActivityFilter = "all" | "mine" | "team";


export default function DashboardPage() {
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const stats = trpc.dashboard.stats.useQuery();
  const recentSites = trpc.dashboard.recentSites.useQuery();
  const activity = trpc.dashboard.activity.useQuery({ filter: activityFilter });
  const health = trpc.dashboard.health.useQuery();
  const quickActionsQuery = trpc.dashboard.quickActions.useQuery();
  const wsData = trpc.account.workspace.get.useQuery();
  const pendingDeletion = trpc.account.dangerZone.pendingDeletion.useQuery();
  const cancelWsDelete = trpc.account.workspace.cancelDelete.useMutation({ onSuccess: () => wsData.refetch() });
  const cancelAcctDelete = trpc.account.dangerZone.cancelAccountDeletion.useMutation({ onSuccess: () => pendingDeletion.refetch() });
  const billingOverview = trpc.billing.overview.useQuery();
  const onboardingState = trpc.onboarding.getState.useQuery();
  const dismissOnboarding = trpc.onboarding.dismiss.useMutation({
    onSuccess: () => onboardingState.refetch(),
  });
  const showChecklist = onboardingState.data && !onboardingState.data.completed && !onboardingState.data.dismissed;

  const isLoading = stats.isLoading || recentSites.isLoading;
  const isEmpty = stats.data?.totalSites === 0;

  // Determine empty state variant based on role
  const memberRole = stats.data?.memberRole;
  const emptyVariant: EmptyStateVariant | null = isEmpty
    ? memberRole === "OWNER"
      ? (stats.data?.archivedSites ?? 0) > 0
        ? "owner_empty"
        : "owner_new"
      : memberRole === "EDITOR"
        ? "editor_no_sites"
        : "viewer"
    : null;

  const quickActions = quickActionsQuery.data ?? [];

  // Only show workspace health when any metric exceeds 50%
  const showHealth = health.data && (
    health.data.sites.used / health.data.sites.limit > 0.5 ||
    health.data.storage.usedMB / health.data.storage.limitMB > 0.5 ||
    health.data.aiCredits.used / health.data.aiCredits.limit > 0.5
  );

  const isPastDue = billingOverview.data?.status === "PAST_DUE";

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Dashboard</h1>
        </div>
        {/* Stat cards skeleton */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          ))}
        </div>
        {/* Quick actions skeleton */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          ))}
        </div>
        {/* Recent sites skeleton */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          ))}
        </div>
        {/* Activity + Health skeleton */}
        <div className="mt-6 grid grid-cols-3 gap-6">
          <div className="col-span-2 h-48 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          <div className="h-48 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Dunning Banner */}
      {isPastDue && (
        <div className="mb-6">
          <DunningBanner
            graceEndsAt={
              billingOverview.data?.currentPeriodEnd
                ? new Date(new Date(billingOverview.data.currentPeriodEnd).getTime() + 7 * 24 * 60 * 60 * 1000)
                : null
            }
          />
        </div>
      )}

      {/* Workspace Deletion Grace Period Banner */}
      {wsData.data?.deletionScheduledAt && (
        <div className="mb-4 rounded-lg p-4" style={{ backgroundColor: "#FEF2F2", borderLeft: "3px solid #EF4444" }}>
          <p className="text-sm font-medium" style={{ color: "#991B1B" }}>
            Your workspace is scheduled for deletion on {new Date(wsData.data.deletionScheduledAt).toLocaleDateString()}.
          </p>
          <button
            onClick={() => cancelWsDelete.mutate()}
            disabled={cancelWsDelete.isPending}
            className="mt-2 text-sm font-semibold underline"
            style={{ color: "var(--color-primary)" }}
          >
            {cancelWsDelete.isPending ? "Cancelling..." : "Cancel Deletion"}
          </button>
        </div>
      )}

      {/* Account Deletion Grace Period Banner */}
      {pendingDeletion.data && (
        <div className="mb-4 rounded-lg p-4" style={{ backgroundColor: "#FEF2F2", borderLeft: "3px solid #EF4444" }}>
          <p className="text-sm font-medium" style={{ color: "#991B1B" }}>
            Your account is scheduled for deletion on {new Date(pendingDeletion.data.scheduledAt).toLocaleDateString()}.
          </p>
          <button
            onClick={() => cancelAcctDelete.mutate()}
            disabled={cancelAcctDelete.isPending}
            className="mt-2 text-sm font-semibold underline"
            style={{ color: "var(--color-primary)" }}
          >
            {cancelAcctDelete.isPending ? "Cancelling..." : "Cancel Deletion"}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Dashboard</h1>
        <Link href="/dashboard/sites/new" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-primary)" }}>
          <Plus className="h-4 w-4" />New Site
        </Link>
      </div>

      {emptyVariant ? (
        <div className="mt-8">
          <EmptyState variant={emptyVariant} />
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
                    { value: stats.data?.publishedSites ?? 0, color: "var(--color-success)" },
                    { value: stats.data?.draftSites ?? 0, color: "#EAB308" },
                    { value: stats.data?.archivedSites ?? 0, color: "var(--color-text-secondary)" },
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
                        ? "rounded-lg bg-[var(--color-bg-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-text-primary)]"
                        : "rounded-lg px-3 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
                    }
                  >
                    {f === "all" ? "All" : f === "mine" ? "My Activity" : "Team"}
                  </button>
                ))}
              </div>
              <ActivityFeed feed={activity.data ?? { groups: [] }} />
            </div>
            <div>
              {showHealth && health.data && <WorkspaceHealth data={health.data} />}
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
