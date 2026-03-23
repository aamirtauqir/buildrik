"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  href: string;
  trend?: { value: number; label: string };
};

export function StatCard({ title, value, subtitle, href, trend }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <Link
      href={href}
      className="block rounded-xl border border-[#E8E8E8] bg-white p-5 hover:border-[#E42313]/30 transition-colors"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[#7A7A7A]">{title}</p>
      <p className="mt-2 text-2xl font-bold text-[#0D0D0D]">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-[#B0B0B0]">{subtitle}</p>}
      {trend && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-xs font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}
        >
          <span>{isPositive ? "↑" : "↓"}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="font-normal text-[#7A7A7A]">{trend.label}</span>
        </p>
      )}
    </Link>
  );
}
