"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { trpc } from "@lib/trpc/client";
import { formatCompact } from "@lib/utils";
import { StatCard, PageHeader, SectionCard, MetricValue } from "@/components/dashboard/primitives";
import { TrendArrow, Sparkline } from "@/components/dashboard/dataviz";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { EmptyState, type EmptyStateVariant } from "@/components/dashboard/empty-state";
import { DunningBanner } from "@/components/dashboard/dunning-banner";
import { DashboardChecklist } from "@/components/onboarding/dashboard-checklist";
import { NeedsAttention } from "@/components/dashboard/needs-attention";
import { ErrorState } from "@/components/states";

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.trim().split(/\s+/)[0] || "there";
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const greeting = `Good ${timeOfDay}, ${firstName}`;

  const stats = trpc.dashboard.stats.useQuery();
  const activity = trpc.dashboard.activity.useQuery({ filter: "all" });
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

  const isPastDue = billingOverview.data?.status === "PAST_DUE";

  if (stats.isLoading) {
    return (
      <div>
        <PageHeader title={greeting} description="Here's what's happening across your workspace." />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          ))}
        </div>
        <div className="mt-6 grid gap-6" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
          <div className="h-72 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          <div className="h-72 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
        </div>
      </div>
    );
  }

  // Without this, a failed stats query left data undefined → an all-zeros
  // dashboard rendered as if the workspace were genuinely empty.
  if (stats.isError) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="mt-6">
          <ErrorState
            title="Couldn't load your dashboard"
            description="Something went wrong on our end. Refresh to try again."
            onRetry={() => stats.refetch()}
          />
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
        <div className="mb-4 rounded-lg border p-4" style={{ backgroundColor: "var(--color-error-subtle)", borderColor: "var(--color-error)" }}>
          <p className="text-body font-medium" style={{ color: "var(--color-error-text)" }}>
            Your workspace is scheduled for deletion on {new Date(wsData.data.deletionScheduledAt).toLocaleDateString()}.
          </p>
          <button
            onClick={() => cancelWsDelete.mutate()}
            disabled={cancelWsDelete.isPending}
            className="mt-2 text-body font-semibold underline"
            style={{ color: "var(--color-primary)" }}
          >
            {cancelWsDelete.isPending ? "Cancelling..." : "Cancel Deletion"}
          </button>
        </div>
      )}

      {/* Account Deletion Grace Period Banner */}
      {pendingDeletion.data && (
        <div className="mb-4 rounded-lg border p-4" style={{ backgroundColor: "var(--color-error-subtle)", borderColor: "var(--color-error)" }}>
          <p className="text-body font-medium" style={{ color: "var(--color-error-text)" }}>
            Your account is scheduled for deletion on {new Date(pendingDeletion.data.scheduledAt).toLocaleDateString()}.
          </p>
          <button
            onClick={() => cancelAcctDelete.mutate()}
            disabled={cancelAcctDelete.isPending}
            className="mt-2 text-body font-semibold underline"
            style={{ color: "var(--color-primary)" }}
          >
            {cancelAcctDelete.isPending ? "Cancelling..." : "Cancel Deletion"}
          </button>
        </div>
      )}

      <PageHeader title={greeting} description="Here's what's happening across your workspace." />

      <NeedsAttention />

      {emptyVariant ? (
        <div className="mt-8">
          <EmptyState variant={emptyVariant} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stat tiles — sparkline visual per the IA-fixed design. Visitors uses
              the real dailyVisitors series; the other metrics have no time-series
              yet, so their sparkline is a representative trend (visual only). */}
          {/* 4-up at the design's 1440 width; below that the tiles' fixed-width
              sparklines cannot fit four across and would push the page sideways. */}
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Sites"
              value={stats.data?.totalSites ?? 0}
              delta={<><MetricValue>{stats.data?.draftSites ?? 0}</MetricValue> in draft</>}
              visual={<Sparkline data={[4, 5, 5, 6, 6, 7, 8]} />}
              href="/dashboard/projects"
            />
            <StatCard
              label="Published"
              value={stats.data?.publishedSites ?? 0}
              delta={
                (stats.data?.publishedSites ?? 0) > 0 ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full text-[10px] font-bold tracking-[0.03em]"
                    style={{ color: "var(--color-success)", backgroundColor: "var(--color-success-subtle)", padding: "2px 8px 2px 6px" }}
                  >
                    <span
                      className="h-[6px] w-[6px] rounded-full"
                      style={{ backgroundColor: "var(--color-success)", boxShadow: "0 0 0 3px color-mix(in srgb, var(--color-success) 18%, transparent)" }}
                    />
                    LIVE
                  </span>
                ) : (
                  "none published"
                )
              }
              visual={<Sparkline data={[3, 3, 4, 4, 4, 5, 5]} />}
              href="/dashboard/sites?status=published"
            />
            <StatCard
              label="Visitors"
              value={formatCompact(stats.data?.monthlyVisits ?? 0)}
              delta={
                <span className="flex items-center gap-1">
                  <TrendArrow value={stats.data?.visitsChange ?? 0} /> · 30d
                </span>
              }
              visual={<Sparkline data={(stats.data?.dailyVisitors?.length ?? 0) >= 2 ? stats.data!.dailyVisitors : [10, 12, 11, 14, 13, 16, 18]} />}
              href="/dashboard/projects"
            />
            <StatCard
              label="Form leads"
              value={stats.data?.collaborators ?? 0}
              delta={
                (stats.data?.pendingInvites ?? 0) > 0
                  ? <><MetricValue>{stats.data?.pendingInvites}</MetricValue> pending</>
                  : undefined
              }
              visual={<Sparkline data={[2, 3, 3, 4, 4, 5, 6]} />}
              href="/dashboard/settings/team"
            />
          </div>

          {/* Recent activity + Quick actions */}
          <div className="grid gap-[14px]" style={{ gridTemplateColumns: "1.55fr 1fr" }}>
            <SectionCard
              title="Recent activity"
              padding="none"
              actions={
                <Link href="/dashboard/notifications" className="text-body-sm font-medium" style={{ color: "var(--color-primary)" }}>
                  View all
                </Link>
              }
            >
              <ActivityFeed feed={activity.data ?? { groups: [] }} />
            </SectionCard>

            <SectionCard title="Quick actions">
              <QuickActions />
            </SectionCard>
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
