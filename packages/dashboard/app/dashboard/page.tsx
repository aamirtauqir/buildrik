"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { trpc } from "@lib/trpc/client";
import { StatCard, PageHeader, SectionCard, MetricValue } from "@/components/dashboard/primitives";
import { TrendArrow, Sparkline } from "@/components/dashboard/dataviz";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { EmptyState, type EmptyStateVariant } from "@/components/dashboard/empty-state";
import { DunningBanner } from "@/components/dashboard/dunning-banner";
import { DashboardChecklist } from "@/components/onboarding/dashboard-checklist";
import { NeedsAttention } from "@/components/dashboard/needs-attention";
import { ErrorState } from "@/components/states";

/** 24800 → "24.8k", 1_200_000 → "1.2m". Keeps big visitor counts compact. */
function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  const m = n / 1_000_000;
  return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
}

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
          <div className="grid grid-cols-4 gap-[14px]">
            <StatCard
              label="Sites"
              value={stats.data?.totalSites ?? 0}
              delta={<><MetricValue>{stats.data?.draftSites ?? 0}</MetricValue> in draft</>}
              visual={<Sparkline data={[4, 5, 5, 6, 6, 7, 8]} />}
              href="/dashboard/projects"
            />
            <StatCard
              label="Published"
              mono={false}
              value={<><MetricValue>{stats.data?.publishedSites ?? 0}</MetricValue> live</>}
              delta={(stats.data?.publishedSites ?? 0) > 0 ? "live now" : "none published"}
              visual={<Sparkline data={[3, 3, 4, 4, 4, 5, 5]} color="var(--color-text-muted)" />}
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
