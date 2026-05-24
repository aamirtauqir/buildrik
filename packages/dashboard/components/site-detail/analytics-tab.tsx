"use client";

import { BarChart3 } from "lucide-react";

export const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

interface MetricCard { label: string; value: string | number; change?: number; }

interface AnalyticsData {
  timeSeries: Array<{ date: string | Date; visitors: number; pageViews: number }>;
  metrics?: MetricCard[];
  trafficSources: Array<{ source: string; count: number; percentage?: number }>;
  countries: Array<{ country: string; count: number; percentage?: number }>;
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
          <button key={opt.value} onClick={() => onRangeChange(opt.value)} className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style={{ backgroundColor: range === opt.value ? "#FEF2F2" : "transparent", color: range === opt.value ? "var(--color-primary)" : "#7A7A7A" }}>
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />)}
        </div>
      )}

      {!isLoading && data && data.timeSeries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="h-10 w-10 mb-4" style={{ color: "#B0B0B0" }} />
          <h3 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>No analytics data yet</h3>
          <p className="text-sm mt-1 max-w-sm" style={{ color: "#7A7A7A" }}>
            Analytics will appear here once your site starts receiving visitors.
          </p>
        </div>
      )}

      {!isLoading && data && data.timeSeries.length > 0 && (
        <>
          {/* Metric Cards */}
          {data.metrics && (
            <div className="grid grid-cols-3 gap-4">
              {data.metrics.map((m) => (
                <div key={m.label} className="rounded-xl border bg-white p-4" style={{ borderColor: "#E8E8E8" }}>
                  <p className="text-xs font-medium" style={{ color: "#7A7A7A" }}>{m.label}</p>
                  <p className="mt-1 text-xl font-bold" style={{ color: "#0D0D0D" }}>{m.value}</p>
                  {m.change !== undefined && <p className="mt-1 text-xs font-medium" style={{ color: m.change >= 0 ? "#22C55E" : "var(--color-primary)" }}>{m.change >= 0 ? "↑" : "↓"} {Math.abs(m.change)}%</p>}
                </div>
              ))}
            </div>
          )}

          {/* Chart placeholder */}
          <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
            <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Traffic Overview</h3>
            <div className="mt-4 flex h-48 items-end gap-1">
              {data.timeSeries.map((d, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(10, (d.visitors / Math.max(...data.timeSeries.map((t) => t.visitors), 1)) * 100)}%`, backgroundColor: "var(--color-primary)", opacity: 0.7 }} title={`${d.date}: ${d.visitors} visitors`} />
              ))}
            </div>
          </div>

          {/* Traffic Sources + Countries */}
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
              <h3 className="mb-3 text-sm font-semibold" style={{ color: "#0D0D0D" }}>Traffic Sources</h3>
              {data.trafficSources.map((s) => (
                <div key={s.source} className="flex items-center justify-between py-2">
                  <span className="text-sm" style={{ color: "#0D0D0D" }}>{s.source}</span>
                  <span className="text-sm font-medium" style={{ color: "#7A7A7A" }}>{s.percentage}%</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
              <h3 className="mb-3 text-sm font-semibold" style={{ color: "#0D0D0D" }}>Top Countries</h3>
              {data.countries.map((c) => (
                <div key={c.country} className="flex items-center justify-between py-2">
                  <span className="text-sm" style={{ color: "#0D0D0D" }}>{c.country}</span>
                  <span className="text-sm font-medium" style={{ color: "#7A7A7A" }}>{c.count} ({c.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!isLoading && !data && (
        <div className="rounded-xl border-2 border-dashed py-16 text-center" style={{ borderColor: "#E8E8E8" }}>
          <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>No analytics data yet</p>
          <p className="mt-1 text-xs" style={{ color: "#7A7A7A" }}>Publish your site to start tracking visitors.</p>
        </div>
      )}
    </div>
  );
}
