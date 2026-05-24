"use client";

import Link from "next/link";
import { cn } from "@lib/utils";
import type { ReactNode } from "react";

// -- Inline SVG sub-components --

function MiniDonut({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={40} height={40} viewBox="0 0 40 40" className="shrink-0">
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference;
        const currentOffset = offset;
        offset += dash;
        return (
          <circle
            key={i}
            cx={20}
            cy={20}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={6}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-currentOffset}
            transform="rotate(-90 20 20)"
          />
        );
      })}
    </svg>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const padding = 2;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = padding + ((max - v) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AvatarStack({ avatars }: { avatars: { name: string; avatar: string | null }[] }) {
  const maxShown = 4;
  const visible = avatars.slice(0, maxShown);
  const overflow = avatars.length - maxShown;

  return (
    <div className="flex items-center">
      {visible.map((a, i) => (
        <div
          key={i}
          className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[var(--color-bg-subtle)] text-[10px] font-medium text-[var(--color-text-secondary)]"
          style={{ marginLeft: i === 0 ? 0 : -8, zIndex: maxShown - i }}
          title={a.name}
        >
          {a.avatar ? (
            <img src={a.avatar} alt={a.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span>{a.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[var(--color-bg-subtle)] text-[10px] font-medium text-[var(--color-text-secondary)]"
          style={{ marginLeft: -8, zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

function TrendArrow({ value }: { value: number }) {
  const isPositive = value > 0;
  const isZero = value === 0;
  const color = isZero ? "var(--color-text-secondary)" : isPositive ? "var(--color-success)" : "var(--color-primary)";
  const arrow = isZero ? "" : isPositive ? "\u2191" : "\u2193";
  const sign = isPositive ? "+" : "";

  return (
    <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color }}>
      {arrow && <span>{arrow}</span>}
      <span>{sign}{value}%</span>
    </span>
  );
}

// -- StatCard --

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  href: string;
  trend?: { value: number; label: string };
  visual?: ReactNode;
};

export { MiniDonut, Sparkline, AvatarStack, TrendArrow };

export function StatCard({ title, value, subtitle, href, trend, visual }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <Link
      href={href}
      aria-label={`View ${title} details`}
      className="block rounded-xl border border-[var(--color-border-default)] bg-white p-5 hover:border-[var(--color-primary)]/30 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
          {trend && (
            <p
              className={cn(
                "mt-2 flex items-center gap-1 text-xs font-medium",
                isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              <span>{isPositive ? "\u2191" : "\u2193"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="font-normal text-[var(--color-text-secondary)]">{trend.label}</span>
            </p>
          )}
        </div>
        {visual && <div className="shrink-0 ml-3">{visual}</div>}
      </div>
    </Link>
  );
}
