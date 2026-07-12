"use client";

import { trpc } from "@lib/trpc/client";
import { LoadingSkeleton, ErrorState } from "@/components/states";

function fmt(n: number, unit: string) {
  const v = unit === "GB" ? n.toFixed(1) : n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);
  return unit ? `${v} ${unit}` : v;
}

export default function UsagePage() {
  const query = trpc.dashboard.usage.useQuery(undefined, { retry: false });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Usage</h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {query.data ? `Current billing period · ${query.data.period.label}` : "Track your workspace usage against plan limits."}
        </p>
      </header>

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
              const over = pct >= 85;
              return (
                <div key={m.key} className="rounded-xl border p-4" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>{m.label}</p>
                    {m.estimated && <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}>est.</span>}
                  </div>
                  <p className="mt-1.5 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {fmt(m.used, m.unit)}
                    <span className="text-sm font-normal" style={{ color: "var(--color-text-muted)" }}> / {unlimited ? "∞" : fmt(m.limit, m.unit)}</span>
                  </p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border-default)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: over ? "var(--color-error)" : "var(--color-primary)" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border p-5" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
            <p className="mb-4 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Form submissions <span className="font-normal" style={{ color: "var(--color-text-secondary)" }}>· last 14 days</span>
            </p>
            <SubmissionChart data={query.data.submissionSeries} />
          </div>
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
          <span className="mt-1 text-[9px]" style={{ color: "var(--color-text-muted)" }}>{d.day.slice(8)}</span>
        </div>
      ))}
    </div>
  );
}
