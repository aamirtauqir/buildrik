"use client";

import { trpc } from "@lib/trpc/client";
import { LoadingSkeleton, ErrorState } from "@/components/states";
import { SectionCard, MetricValue, ProgressBar, Pill } from "@/components/dashboard/primitives";
import { PageHeaderActions } from "@/components/dashboard/shell/page-actions";

type UsageMetric = { key: string; label: string; used: number; limit: number; unit: string; estimated?: boolean };

function fmt(n: number, unit: string) {
  const v = unit === "GB" ? n.toFixed(1) : n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);
  return unit ? `${v} ${unit}` : v;
}

export default function UsagePage() {
  const query = trpc.dashboard.usage.useQuery(undefined, { retry: false });

  return (
    <div>
      {/* On the layout's title row via the actions slot. The loading fallback
          here used to read "Track your workspace usage against plan limits.",
          which is the header description's job — the layout already says
          "Bandwidth, storage & credits". Now it shows the period or nothing. */}
      <PageHeaderActions>
        {query.data && (
          <span className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            {query.data.period.label}
          </span>
        )}
        <span
          className="inline-flex shrink-0 items-center rounded-pill border px-3 py-1 text-body-sm font-medium"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
        >
          This month
        </span>
      </PageHeaderActions>

      {query.isLoading ? (
        <LoadingSkeleton rows={4} variant="card" />
      ) : query.isError ? (
        <ErrorState title="Couldn't load usage" description="Something went wrong on our end." onRetry={() => query.refetch()} />
      ) : query.data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {query.data.metrics.map((m) => (
              <UsageTile key={m.key} metric={m} />
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

/** The bar reads headroom, not identity.
 *
 *  It used to take a hardcoded per-tile colour from the design mockup —
 *  "Form submissions → warning" meant a bar at 0/100 rendered amber, while
 *  amber means "approaching the limit" on every other bar in the product. And
 *  because the colour was keyed to the metric and not the number, "Team
 *  members 2 / 1" — over the limit — drew in the accent blue, while the
 *  Billing screen drew the same fact in red. Two screens, one fact, two
 *  answers. `tone="auto"` is the ProgressBar behaviour that already existed:
 *  accent under 60%, warning from 60%, error from 85%. */
function UsageTile({ metric }: { metric: UsageMetric }) {
  const unlimited = metric.limit < 0;
  // limit 0 is a hard cap, not "no data": anything used against it is over the
  // line and must read as over the line. It painted accent-blue at 0% before,
  // which is the same "two screens, one fact, two answers" the tone change
  // above fixes.
  const pct = unlimited
    ? 0
    : metric.limit === 0
      ? (metric.used > 0 ? 100 : 0)
      : Math.min((metric.used / metric.limit) * 100, 100);
  return (
    <div
      className="rounded-lg border p-4 shadow-card"
      style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-eyebrow uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>{metric.label}</span>
        {metric.estimated && <Pill tone="neutral">est.</Pill>}
      </div>
      <p className="mt-2 font-mono tabular-nums text-metric" style={{ color: "var(--color-text-primary)" }}>
        {fmt(metric.used, metric.unit)}
        <span className="font-normal" style={{ color: "var(--color-text-muted)" }}> / {unlimited ? "∞" : fmt(metric.limit, metric.unit)}</span>
      </p>
      <div className="mt-3">
        <ProgressBar pct={pct} tone="auto" />
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
