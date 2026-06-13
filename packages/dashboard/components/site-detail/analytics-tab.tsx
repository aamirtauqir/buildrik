"use client";

import { BarChart3 } from "lucide-react";

export const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

interface AnalyticsData {
  timeSeries: Array<{ date: string | Date; visitors: number; pageViews: number }>;
  // service returns {source,count}/{country,count}/{device,count}; percentages
  // are computed client-side (the service doesn't send them — they rendered
  // "undefined%"). `metrics` was never returned by the service (dead block).
  trafficSources: Array<{ source: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
  devices?: Array<{ device: string; count: number }>;
}

function pct(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

interface AnalyticsTabProps {
  data: AnalyticsData | null;
  range: string;
  onRangeChange: (range: string) => void;
  isLoading: boolean;
}

export function AnalyticsTab({ data, range, onRangeChange, isLoading }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      {/* Date range picker */}
      <div className="flex items-center gap-2">
        {DATE_RANGE_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => onRangeChange(opt.value)} className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style={{ backgroundColor: range === opt.value ? "#FEF2F2" : "transparent", color: range === opt.value ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />)}
        </div>
      )}

      {!isLoading && data && data.timeSeries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="h-10 w-10 mb-4" style={{ color: "var(--color-text-muted)" }} />
          <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>No analytics data yet</h3>
          <p className="text-sm mt-1 max-w-sm" style={{ color: "var(--color-text-secondary)" }}>
            Analytics will appear here once your site starts receiving visitors.
          </p>
        </div>
      )}

      {!isLoading && data && data.timeSeries.length > 0 && (
        <>
          {/* Chart placeholder */}
          <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--color-border-default)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Traffic Overview</h3>
            <div className="mt-4 flex h-48 items-end gap-1">
              {data.timeSeries.map((d, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(10, (d.visitors / Math.max(...data.timeSeries.map((t) => t.visitors), 1)) * 100)}%`, backgroundColor: "var(--color-primary)", opacity: 0.7 }} title={`${d.date}: ${d.visitors} visitors`} />
              ))}
            </div>
          </div>

          {/* Traffic Sources + Countries */}
          {(() => {
            const sourceTotal = data.trafficSources.reduce((a, s) => a + s.count, 0);
            const countryTotal = data.countries.reduce((a, c) => a + c.count, 0);
            const deviceTotal = (data.devices ?? []).reduce((a, d) => a + d.count, 0);
            return (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--color-border-default)" }}>
                    <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Traffic Sources</h3>
                    {data.trafficSources.map((s) => (
                      <div key={s.source} className="flex items-center justify-between py-2">
                        <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{s.source}</span>
                        <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{pct(s.count, sourceTotal)}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--color-border-default)" }}>
                    <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Top Countries</h3>
                    {data.countries.map((c) => (
                      <div key={c.country} className="flex items-center justify-between py-2">
                        <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{c.country}</span>
                        <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{c.count} ({pct(c.count, countryTotal)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Devices — returned by the service but previously never rendered. */}
                {data.devices && data.devices.length > 0 && (
                  <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--color-border-default)" }}>
                    <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Devices</h3>
                    {data.devices.map((d) => (
                      <div key={d.device} className="flex items-center justify-between py-2">
                        <span className="text-sm capitalize" style={{ color: "var(--color-text-primary)" }}>{d.device}</span>
                        <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{d.count} ({pct(d.count, deviceTotal)}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}

      {!isLoading && !data && (
        <div className="rounded-xl border-2 border-dashed py-16 text-center" style={{ borderColor: "var(--color-border-default)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>No analytics data yet</p>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>Publish your site to start tracking visitors.</p>
        </div>
      )}
    </div>
  );
}
