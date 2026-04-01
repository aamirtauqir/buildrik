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
        <span className="text-[#7A7A7A]">{label}</span>
        <span className="font-medium text-[#0D0D0D]">
          {used}
          {unit} / {limit}
          {unit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8E8E8]">
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
  const metrics = [
    { label: "Sites", used: data.sites.used, limit: data.sites.limit, unit: "" },
    { label: "Storage", used: data.storage.usedMB, limit: data.storage.limitMB, unit: " MB" },
    { label: "AI Credits", used: data.aiCredits.used, limit: data.aiCredits.limit, unit: "" },
    {
      label: "Bandwidth",
      used: data.bandwidth.usedMB,
      limit: data.bandwidth.limitMB,
      unit: " MB",
    },
  ];

  const hasUsage = metrics.some((m) => m.used > 0);
  const anyOver50 = metrics.some(
    (m) => m.limit > 0 && (m.used / m.limit) * 100 >= 50
  );

  if (!hasUsage || !anyOver50) return null;

  return (
    <div className="rounded-xl border border-[#E8E8E8] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#0D0D0D]">Workspace Usage</h3>
        <Link href="/dashboard/billing" className="text-xs text-[#E42313] hover:underline">
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
