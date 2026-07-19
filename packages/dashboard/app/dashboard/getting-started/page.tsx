"use client";

import { Check } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { cn } from "@lib/utils";
import { LoadingSkeleton, ErrorState } from "@/components/states";
import { PageHeader, SectionCard, ProgressBar, ButtonLink } from "@/components/dashboard/primitives";

const STEPS = [
  { id: "workspace", title: "Create your workspace", href: "/dashboard" },
  { id: "site", title: "Create your first site", href: "/dashboard/sites/new" },
  { id: "domain", title: "Connect a custom domain", href: "/dashboard/settings/domains" },
  { id: "team", title: "Invite a teammate", href: "/dashboard/settings/team" },
  { id: "publish", title: "Publish your site", href: "/dashboard/projects" },
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
    <div className="mx-auto max-w-[760px]">
      <PageHeader title="Getting started" description="Finish setup to launch your first site." />

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
          <SectionCard className="mb-5">
            <div className="flex items-center justify-between">
              <span className="text-body font-bold" style={{ color: "var(--color-text-primary)" }}>
                {doneCount} of {STEPS.length} complete
              </span>
              <span className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{pct}%</span>
            </div>
            <ProgressBar pct={pct} size="lg" className="mt-3" />
          </SectionCard>

          <SectionCard padding="none">
            <ul>
              {STEPS.map((step) => {
                const done = completion[step.id];
                const isCurrent = step.id === firstIncompleteId;
                return (
                  <li
                    key={step.id}
                    className="flex items-center gap-3 border-b px-4 py-3.5 last:border-0"
                    style={{
                      borderColor: "var(--color-border-default)",
                      backgroundColor: isCurrent ? "var(--color-primary-subtle)" : undefined,
                    }}
                  >
                    {done ? (
                      <span
                        className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: "var(--color-success)" }}
                        aria-hidden
                      >
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </span>
                    ) : (
                      <span
                        className="h-[22px] w-[22px] flex-shrink-0 rounded-full border-2"
                        style={{ borderColor: isCurrent ? "var(--color-primary)" : "var(--color-border-strong)" }}
                        aria-hidden
                      />
                    )}
                    <span
                      className={cn("flex-1 text-body", isCurrent ? "font-semibold" : "font-normal", done && "line-through")}
                      style={{ color: done ? "var(--color-text-muted)" : "var(--color-text-primary)" }}
                    >
                      {step.title}
                    </span>
                    {isCurrent && (
                      <ButtonLink href={step.href} size="sm">
                        Start
                      </ButtonLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        </>
      )}
    </div>
  );
}
