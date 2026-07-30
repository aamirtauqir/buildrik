"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { trpc } from "@lib/trpc/client";
import { formatCompact } from "@lib/utils";
import { StatCard, PageHeader, SectionCard, MetricValue } from "@/components/dashboard/primitives";
import { TrendArrow, Sparkline, MiniDonut } from "@/components/dashboard/dataviz";
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
  // Has sites, but nothing is live yet. The single most important next move is
  // to publish — promote it above the stat grid instead of leaving it as one of
  // three equal quick actions (audit B2).
  const draftCount = stats.data?.draftSites ?? 0;
  const noneLive = !isEmpty && (stats.data?.publishedSites ?? 0) === 0 && draftCount > 0;

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
          {noneLive && (
            <div
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5"
              style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--color-primary-subtle)" }}
            >
              <div className="min-w-0">
                <p className="text-[15px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {draftCount === 1 ? "Your site is ready to go live" : `${draftCount} drafts, none live yet`}
                </p>
                <p className="mt-0.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Publish to get a real URL you can share with your client.
                </p>
              </div>
              <Link
                href="/dashboard/projects?status=draft"
                className="shrink-0 rounded-lg px-4 py-2 text-body font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {draftCount === 1 ? "Review & publish" : "Pick a draft to publish"}
              </Link>
            </div>
          )}
          {/* Stat tiles. Rule (design audit G1/G3, 2026-07-24): a tile's visual
              MUST reflect real data or it isn't drawn. Counts with no time-series
              (Sites/Published/Team) carry NO sparkline — a synthesised uptrend on
              zero is dishonest. Sites shows a real donut of its published/draft
              split; Visitors shows the real dailyVisitors series, or a flat
              zero-baseline when there is no traffic. Never a fabricated trend. */}
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Sites"
              value={stats.data?.totalSites ?? 0}
              delta={<><MetricValue>{stats.data?.draftSites ?? 0}</MetricValue> in draft</>}
              visual={
                (stats.data?.totalSites ?? 0) > 0 ? (
                  <MiniDonut
                    segments={[
                      { value: stats.data?.publishedSites ?? 0, color: "var(--color-primary)" },
                      { value: stats.data?.draftSites ?? 0, color: "var(--color-border-strong)" },
                    ]}
                  />
                ) : undefined
              }
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
              href="/dashboard/projects?status=published"
            />
            {/* No href: there is no workspace-level analytics view to link to.
                Linking to the sites list was a weak, misleading destination for a
                traffic metric, so this stays a display-only tile. */}
            <StatCard
              label="Visitors"
              value={formatCompact(stats.data?.monthlyVisits ?? 0)}
              delta={
                <span className="flex items-center gap-1">
                  <TrendArrow value={stats.data?.visitsChange ?? 0} /> · 30d
                </span>
              }
              visual={
                (stats.data?.dailyVisitors?.length ?? 0) >= 2 ? (
                  <Sparkline data={stats.data!.dailyVisitors} />
                ) : (
                  // Honest empty: a flat baseline at zero, muted — reads as "no
                  // traffic", not growth. Not a fabricated series.
                  <Sparkline data={[0, 0, 0, 0, 0, 0, 0]} color="var(--color-border-strong)" />
                )
              }
            />
            {/* This is the team metric — collaborator count + pending invites,
                linking to Team settings. */}
            <StatCard
              label="Team"
              value={stats.data?.collaborators ?? 0}
              delta={
                (stats.data?.pendingInvites ?? 0) > 0
                  ? <><MetricValue>{stats.data?.pendingInvites}</MetricValue> pending</>
                  : undefined
              }
              href="/dashboard/settings/team"
            />
          </div>

          {/* Recent activity + Quick actions */}
          <div className="grid gap-[14px]" style={{ gridTemplateColumns: "1.55fr 1fr" }}>
            <SectionCard
              title="Recent activity"
              padding="none"
              actions={
                <Link href="/dashboard/activity" className="text-body-sm font-medium" style={{ color: "var(--color-primary)" }}>
                  View all
                </Link>
              }
            >
              <ActivityFeed feed={activity.data ?? { groups: [] }} limit={6} />
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
