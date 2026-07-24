"use client";

import { trpc } from "@lib/trpc/client";
import { LoadingSkeleton, ErrorState } from "@/components/states";
import { SectionCard, MetricValue, ProgressBar, Pill } from "@/components/dashboard/primitives";

type UsageMetric = { key: string; label: string; used: number; limit: number; unit: string; estimated?: boolean };

/** Explicit per-tile bar color (design mockup), keyed to the service metric order:
 *  Bandwidth → cobalt, Build minutes → teal, Form submissions → warning, Storage → cobalt. */
const TILE_TONE: Record<string, "accent" | "warning" | "teal"> = {
  bandwidth: "accent",
  build: "teal",
  submissions: "warning",
  storage: "accent",
};

function fmt(n: number, unit: string) {
  const v = unit === "GB" ? n.toFixed(1) : n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);
  return unit ? `${v} ${unit}` : v;
}

export default function UsagePage() {
  const query = trpc.dashboard.usage.useQuery(undefined, { retry: false });

  return (
    <div>
      {/* The settings layout owns the section PageHeader (D10.4) — this row
          keeps the billing-period context. */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
          {query.data ? `Current billing period · ${query.data.period.label}` : "Track your workspace usage against plan limits."}
        </p>
        <span
          className="inline-flex shrink-0 items-center rounded-pill border px-3 py-1 text-body-sm font-medium"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
        >
          This month
        </span>
      </div>

      {query.isLoading ? (
        <LoadingSkeleton rows={4} variant="card" />
      ) : query.isError ? (
        <ErrorState title="Couldn't load usage" description="Something went wrong on our end." onRetry={() => query.refetch()} />
      ) : query.data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {query.data.metrics.map((m) => (
              <UsageTile key={m.key} metric={m} tone={TILE_TONE[m.key] ?? "accent"} />
            ))}
          </div>

          <SectionCard
            className="mt-5"
            title="Form submissions over time"
            actions={
              <span className="font-mono text-eyebrow uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                last 14 days
              </span>
            }
          >
            <BandwidthChart data={query.data.submissionSeries} />
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}

function UsageTile({ metric, tone }: { metric: UsageMetric; tone: "accent" | "warning" | "teal" }) {
  const unlimited = metric.limit < 0;
  const pct = unlimited || metric.limit === 0 ? 0 : Math.min((metric.used / metric.limit) * 100, 100);
  return (
    <div
      className="rounded-lg border p-4 shadow-card"
      style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-eyebrow uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>{metric.label}</span>
        {metric.estimated && <Pill tone="neutral">est.</Pill>}
      </div>
      <p className="mt-2 font-mono tabular-nums text-[22px] font-bold leading-[1.1]" style={{ color: "var(--color-text-primary)" }}>
        {fmt(metric.used, metric.unit)}
        <span className="font-normal" style={{ color: "var(--color-text-muted)" }}> / {unlimited ? "∞" : fmt(metric.limit, metric.unit)}</span>
      </p>
      <div className="mt-3">
        {tone === "teal" ? (
          <div className="h-1.5 w-full overflow-hidden rounded-pill" style={{ backgroundColor: "var(--color-border-default)" }}>
            <div className="h-full rounded-pill transition-all" style={{ width: `${pct}%`, backgroundColor: "var(--color-teal)" }} />
          </div>
        ) : (
          <ProgressBar pct={pct} tone={tone} />
        )}
      </div>
    </div>
  );
}

function BandwidthChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex items-end gap-1.5 border-b" style={{ height: 180, borderColor: "var(--color-border-default)" }}>
        {data.map((d) => (
          <div
            key={d.day}
            className="flex-1 rounded-t transition-all"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: 2, backgroundColor: "var(--color-primary)" }}
            title={`${d.day}: ${d.count}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {data.map((d) => (
          <span key={d.day} className="flex-1 text-center text-[9px]" style={{ color: "var(--color-text-muted)" }}>
            <MetricValue>{d.day.slice(8)}</MetricValue>
          </span>
        ))}
      </div>
    </div>
  );
}
