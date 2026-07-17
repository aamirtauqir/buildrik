"use client";

import Link from "next/link";
import type { WorkspaceHealth as WorkspaceHealthData } from "@buildrik/shared/schemas/dashboard";
import { ProgressBar, MetricValue } from "@/components/dashboard/primitives";

type HealthBarProps = {
  label: string;
  used: number;
  limit: number;
  unit?: string;
};

function HealthBar({ label, used, limit, unit = "" }: HealthBarProps) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-body-sm">
        <span className="text-[var(--color-text-secondary)]">{label}</span>
        <span className="text-[var(--color-text-primary)]">
          <MetricValue>{used}{unit} / {limit}{unit}</MetricValue>
        </span>
      </div>
      <ProgressBar pct={pct} tone="auto" />
    </div>
  );
}

type WorkspaceHealthProps = {
  data: WorkspaceHealthData;
};

export function WorkspaceHealth({ data }: WorkspaceHealthProps) {
  // Bandwidth omitted — no bandwidth-tracking pipeline yet (would always
  // render a fake 0/limit gauge). Storage is real (summed media bytes).
  const metrics = [
    { label: "Sites", used: data.sites.used, limit: data.sites.limit, unit: "" },
    { label: "Storage", used: data.storage.usedMB, limit: data.storage.limitMB, unit: " MB" },
    { label: "AI Credits", used: data.aiCredits.used, limit: data.aiCredits.limit, unit: "" },
  ];

  const hasUsage = metrics.some((m) => m.used > 0);
  const anyOver50 = metrics.some(
    (m) => m.limit > 0 && (m.used / m.limit) * 100 >= 50
  );

  if (!hasUsage || !anyOver50) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-section-title text-[var(--color-text-primary)]">Workspace Usage</h3>
        <Link href="/dashboard/settings/billing" className="text-body-sm text-[var(--color-primary)] hover:underline">
          Manage plan →
        </Link>
      </div>
      <div className="space-y-3">
        {metrics.map((m) => (
          <HealthBar key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
}
