"use client";

import { BarChart3 } from "lucide-react";
import { FilterChip, SectionCard, MetricValue } from "@/components/dashboard/primitives";

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
          <FilterChip key={opt.value} active={range === opt.value} onClick={() => onRangeChange(opt.value)}>
            {opt.label}
          </FilterChip>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />)}
        </div>
      )}

      {/* Empty state only when EVERY dataset is empty. Source/country/device data
          comes from live events and can exist before the daily rollup runs — it
          used to be hidden whenever the (lagging) timeSeries was empty. */}
      {!isLoading && data && data.timeSeries.length === 0 && data.trafficSources.length === 0 && data.countries.length === 0 && (data.devices?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="h-10 w-10 mb-4" style={{ color: "var(--color-text-muted)" }} />
          <h3 className="text-section-title" style={{ color: "var(--color-text-primary)" }}>No analytics data yet</h3>
          <p className="text-body mt-1 max-w-sm" style={{ color: "var(--color-text-secondary)" }}>
            Analytics will appear here once your site starts receiving visitors.
          </p>
        </div>
      )}

      {!isLoading && data && (data.timeSeries.length > 0 || data.trafficSources.length > 0 || data.countries.length > 0 || (data.devices?.length ?? 0) > 0) && (
        <>
          {/* Traffic chart — only when there's a time series to plot. */}
          {data.timeSeries.length > 0 && (
            <SectionCard title="Traffic Overview">
              <div className="flex h-48 items-end gap-1">
                {data.timeSeries.map((d, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(10, (d.visitors / Math.max(...data.timeSeries.map((t) => t.visitors), 1)) * 100)}%`, backgroundColor: "var(--color-primary)", opacity: 0.7 }} title={`${d.date}: ${d.visitors} visitors`} />
                ))}
              </div>
            </SectionCard>
          )}

          {/* Traffic Sources + Countries */}
          {(() => {
            const sourceTotal = data.trafficSources.reduce((a, s) => a + s.count, 0);
            const countryTotal = data.countries.reduce((a, c) => a + c.count, 0);
            const deviceTotal = (data.devices ?? []).reduce((a, d) => a + d.count, 0);
            return (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <SectionCard title="Traffic Sources">
                    {data.trafficSources.map((s) => (
                      <div key={s.source} className="flex items-center justify-between py-2">
                        <span className="text-body" style={{ color: "var(--color-text-primary)" }}>{s.source}</span>
                        <span className="text-body font-medium" style={{ color: "var(--color-text-secondary)" }}><MetricValue>{pct(s.count, sourceTotal)}</MetricValue>%</span>
                      </div>
                    ))}
                  </SectionCard>
                  <SectionCard title="Top Countries">
                    {data.countries.map((c) => (
                      <div key={c.country} className="flex items-center justify-between py-2">
                        <span className="text-body" style={{ color: "var(--color-text-primary)" }}>{c.country}</span>
                        <span className="text-body font-medium" style={{ color: "var(--color-text-secondary)" }}><MetricValue>{c.count}</MetricValue> (<MetricValue>{pct(c.count, countryTotal)}</MetricValue>%)</span>
                      </div>
                    ))}
                  </SectionCard>
                </div>
                {/* Devices — returned by the service but previously never rendered. */}
                {data.devices && data.devices.length > 0 && (
                  <SectionCard title="Devices">
                    {data.devices.map((d) => (
                      <div key={d.device} className="flex items-center justify-between py-2">
                        <span className="text-body capitalize" style={{ color: "var(--color-text-primary)" }}>{d.device}</span>
                        <span className="text-body font-medium" style={{ color: "var(--color-text-secondary)" }}><MetricValue>{d.count}</MetricValue> (<MetricValue>{pct(d.count, deviceTotal)}</MetricValue>%)</span>
                      </div>
                    ))}
                  </SectionCard>
                )}
              </>
            );
          })()}
        </>
      )}

      {!isLoading && !data && (
        <div className="rounded-lg border-2 border-dashed py-16 text-center" style={{ borderColor: "var(--color-border-default)" }}>
          <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>No analytics data yet</p>
          <p className="mt-1 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>Publish your site to start tracking visitors.</p>
        </div>
      )}
    </div>
  );
}
