"use client";

import Link from "next/link";
import type { WorkspaceHealth as WorkspaceHealthData } from "@buildrik/shared/schemas/dashboard";

export function getHealthColor(pct: number): "green" | "yellow" | "red" {
  if (pct >= 85) return "red";
  if (pct >= 60) return "yellow";
  return "green";
}

const COLOR_CLASSES = {
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
};

type HealthBarProps = {
  label: string;
  used: number;
  limit: number;
  unit?: string;
};

function HealthBar({ label, used, limit, unit = "" }: HealthBarProps) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = getHealthColor(pct);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-text-secondary)]">{label}</span>
        <span className="font-medium text-[var(--color-text-primary)]">
          {used}
          {unit} / {limit}
          {unit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border-default)]">
        <div
          className={`h-full rounded-full ${COLOR_CLASSES[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
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
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Workspace Usage</h3>
        <Link href="/dashboard/settings/billing" className="text-xs text-[var(--color-primary)] hover:underline">
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
