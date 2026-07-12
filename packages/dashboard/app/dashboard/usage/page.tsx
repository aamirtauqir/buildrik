"use client";

import { trpc } from "@lib/trpc/client";
import { LoadingSkeleton, ErrorState } from "@/components/states";
import { PageHeader, SectionCard, StatCard, MetricValue, ProgressBar, Pill } from "@/components/dashboard/primitives";

function fmt(n: number, unit: string) {
  const v = unit === "GB" ? n.toFixed(1) : n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);
  return unit ? `${v} ${unit}` : v;
}

export default function UsagePage() {
  const query = trpc.dashboard.usage.useQuery(undefined, { retry: false });

  return (
    <div>
      <PageHeader
        title="Usage"
        description={query.data ? `Current billing period · ${query.data.period.label}` : "Track your workspace usage against plan limits."}
      />

      {query.isLoading ? (
        <LoadingSkeleton rows={4} variant="card" />
      ) : query.isError ? (
        <ErrorState title="Couldn't load usage" description="Something went wrong on our end." onRetry={() => query.refetch()} />
      ) : query.data ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {query.data.metrics.map((m) => {
              const unlimited = m.limit < 0;
              const pct = unlimited || m.limit === 0 ? 0 : Math.min((m.used / m.limit) * 100, 100);
              return (
                <StatCard
                  key={m.key}
                  label={<span className="inline-flex items-center gap-1.5">{m.label}{m.estimated && <Pill tone="neutral">est.</Pill>}</span>}
                  value={<>{fmt(m.used, m.unit)}<span className="text-body font-normal" style={{ color: "var(--color-text-muted)" }}> / {unlimited ? "∞" : fmt(m.limit, m.unit)}</span></>}
                  delta={<ProgressBar pct={pct} tone="auto" />}
                />
              );
            })}
          </div>

          <SectionCard className="mt-5" title="Form submissions" description="Last 14 days">
            <SubmissionChart data={query.data.submissionSeries} />
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}

function SubmissionChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map((d) => (
        <div key={d.day} className="group relative flex flex-1 flex-col items-center justify-end">
          <div
            className="w-full rounded-t transition-all"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 4 : 2, backgroundColor: d.count > 0 ? "var(--color-primary)" : "var(--color-border-default)" }}
            title={`${d.day}: ${d.count}`}
          />
          <span className="mt-1 text-[9px]" style={{ color: "var(--color-text-muted)" }}><MetricValue>{d.day.slice(8)}</MetricValue></span>
        </div>
      ))}
    </div>
  );
}
