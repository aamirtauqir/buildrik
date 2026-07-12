"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { LoadingSkeleton, ErrorState } from "@/components/states";

const STEPS = [
  { id: "workspace", title: "Create your workspace", href: "/dashboard" },
  { id: "site", title: "Create your first site", href: "/dashboard/sites/new" },
  { id: "domain", title: "Connect a custom domain", href: "/dashboard/domains" },
  { id: "team", title: "Invite a teammate", href: "/dashboard/team" },
  { id: "publish", title: "Publish your site", href: "/dashboard/sites" },
] as const;

export default function GettingStartedPage() {
  // Same source the floating dashboard-checklist uses (onboarding.getState).
  // Auxiliary queries derive real workspace state for the site/domain steps.
  const onboarding = trpc.onboarding.getState.useQuery(undefined, { retry: false });
  const sites = trpc.sites.list.useQuery({ page: 1, perPage: 1 }, { retry: false });
  const domains = trpc.siteDetail.domains.listForWorkspace.useQuery(undefined, { retry: false });

  const rawTasks = onboarding.data?.dashboardTasks;
  const completedTasks = new Set(
    Array.isArray(rawTasks) ? rawTasks.filter((t): t is string => typeof t === "string") : [],
  );

  // Completion derived only from real state; anything not derivable stays false.
  const completion: Record<string, boolean> = {
    workspace: Boolean(onboarding.data), // existing user — onboarding state loaded
    site: (sites.data?.total ?? 0) > 0,
    domain: (domains.data ?? []).some((d) => d.status === "VERIFIED"),
    team: completedTasks.has("invite-team-member"),
    publish: completedTasks.has("publish-site"),
  };

  const doneCount = STEPS.filter((s) => completion[s.id]).length;
  const pct = Math.round((doneCount / STEPS.length) * 100);
  const firstIncompleteId = STEPS.find((s) => !completion[s.id])?.id;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Getting started</h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Finish setup to launch your first site.
        </p>
      </header>

      {onboarding.isLoading ? (
        <LoadingSkeleton rows={5} variant="list" />
      ) : onboarding.isError ? (
        <ErrorState
          title="Couldn't load your setup progress"
          description="Something went wrong on our end."
          onRetry={() => onboarding.refetch()}
        />
      ) : (
        <>
          <div
            className="mb-5 rounded-xl border p-4"
            style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {doneCount} of {STEPS.length} complete
              <span style={{ color: "var(--color-text-secondary)" }}> · {pct}%</span>
            </p>
            <div className="mt-3 h-1.5 w-full rounded-full" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: "var(--color-primary)" }}
              />
            </div>
          </div>

          <ul
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
          >
            {STEPS.map((step) => {
              const done = completion[step.id];
              const isNext = step.id === firstIncompleteId;
              return (
                <li
                  key={step.id}
                  className="flex items-center gap-3 border-b px-4 py-3.5 last:border-0"
                  style={{ borderColor: "var(--color-border-default)" }}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: "var(--color-success)" }} />
                  ) : (
                    <span
                      className="h-5 w-5 flex-shrink-0 rounded-full border-2"
                      style={{ borderColor: "var(--color-border-default)" }}
                      aria-hidden
                    />
                  )}
                  <span
                    className="flex-1 text-sm font-medium"
                    style={{ color: done ? "var(--color-text-secondary)" : "var(--color-text-primary)" }}
                  >
                    {step.title}
                  </span>
                  {isNext && (
                    <Link
                      href={step.href}
                      className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
                    >
                      Start
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
