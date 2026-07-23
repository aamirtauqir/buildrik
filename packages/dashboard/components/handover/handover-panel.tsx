"use client";

import { Rocket, Check, Clock, AlertTriangle, Minus } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { SectionCard, Pill, type PillTone } from "@/components/dashboard/primitives";
import { StateEmpty, LoadingSkeleton, ErrorState, DeniedState } from "@/components/states";

type ItemStatus = "ok" | "pending" | "warning" | "na";
type HandoverItem = { key: string; status: ItemStatus; label: string };
type HandoverSite = { siteId: string; siteName: string; items: HandoverItem[]; ready: boolean };

const STATUS_ICON: Record<ItemStatus, typeof Check> = {
  ok: Check,
  pending: Clock,
  warning: AlertTriangle,
  na: Minus,
};

const STATUS_COLOR: Record<ItemStatus, string> = {
  ok: "var(--color-success)",
  pending: "var(--color-text-muted)",
  warning: "var(--color-warning)",
  na: "var(--color-text-muted)",
};

const GROUP_LABEL: Record<string, string> = {
  domain: "Domain",
  forms: "Forms",
  approval: "Approval",
  publish: "Publish",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

function SiteRow({ site }: { site: HandoverSite }) {
  const blockers = site.items.filter((i) => i.status === "warning" || (i.status === "pending" && i.key !== "domain")).length;
  const readyTone: PillTone = site.ready ? "success" : "warning";
  return (
    <div
      className="border-b py-4 first:pt-0 last:border-b-0 last:pb-0"
      style={{ borderColor: "var(--color-border-default)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-eyebrow"
            style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}
          >
            {initials(site.siteName)}
          </div>
          <p className="truncate text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {site.siteName}
          </p>
        </div>
        <Pill tone={readyTone}>
          {site.ready ? "Ready to hand over" : `${blockers} to finish`}
        </Pill>
      </div>
      {/* Expanded checklist — always visible so the whole portfolio reads at a glance. */}
      <div className="mt-3 grid gap-2 pl-11 sm:grid-cols-2">
        {site.items.map((item) => {
          const Icon = STATUS_ICON[item.status];
          return (
            <div key={item.key} className="flex items-center gap-2 text-body-sm">
              <Icon className="h-4 w-4 shrink-0" style={{ color: STATUS_COLOR[item.status] }} />
              <span style={{ color: "var(--color-text-muted)" }}>{GROUP_LABEL[item.key] ?? item.key}:</span>
              <span style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HandoverPanel() {
  // Admin-gated server-side; a FORBIDDEN means this member isn't a portfolio owner.
  const query = trpc.handover.rollup.useQuery(undefined, { retry: false });

  const sites = (query.data as HandoverSite[] | undefined) ?? [];
  const forbidden = query.error?.data?.code === "FORBIDDEN";
  const allReady = sites.length > 0 && sites.every((s) => s.ready);

  return (
    <SectionCard title="Handover">
      {query.isLoading ? (
        <LoadingSkeleton rows={3} variant="list" />
      ) : forbidden ? (
        <DeniedState
          title="Only admins can see the handover rollup"
          description="Ask a workspace admin for the portfolio launch status."
          action={{ label: "Back to projects", href: "/dashboard/projects" }}
        />
      ) : query.isError ? (
        <ErrorState
          title="Couldn't load the handover rollup"
          description="Something went wrong on our end."
          onRetry={() => query.refetch()}
        />
      ) : sites.length === 0 ? (
        <StateEmpty
          icon={<Rocket className="h-7 w-7" />}
          title="No sites to hand over yet"
          description="When you create sites for clients, their launch checklist — domain, forms, approval, publish — shows up here."
        />
      ) : (
        <div>
          {allReady && (
            <div
              className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-body-sm font-medium"
              style={{ backgroundColor: "var(--color-success-subtle)", color: "var(--color-success-text)" }}
            >
              <Check className="h-4 w-4" />
              Every site is ready to hand over.
            </div>
          )}
          {sites.map((site) => (
            <SiteRow key={site.siteId} site={site} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
