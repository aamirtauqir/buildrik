"use client";

import type { ReactNode } from "react";
import { cn } from "@lib/utils";
import { SectionCard } from "@/components/dashboard/primitives";

/** dc categorical tints cycled across the integration tiles (teal→amber→primary→pink). */
const TILE_TINTS = ["var(--color-teal)", "var(--color-amber)", "var(--color-primary)", "var(--color-pink)"];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform"
      style={{ color: "var(--color-text-muted)", transform: open ? "rotate(180deg)" : undefined }}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IntegrationCard({
  tintIndex,
  initial,
  name,
  description,
  right,
  expandable,
  expanded,
  onToggle,
  children,
}: {
  tintIndex: number;
  initial: string;
  name: string;
  description: ReactNode;
  right: ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  children?: ReactNode;
}) {
  const tint = TILE_TINTS[tintIndex % TILE_TINTS.length];
  return (
    <SectionCard padding="none">
      <div
        className={cn("flex items-center gap-3 p-4", expandable && "cursor-pointer")}
        onClick={expandable ? onToggle : undefined}
      >
        <span
          className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-lg text-[15px] font-semibold"
          style={{ backgroundColor: `color-mix(in srgb, ${tint} 12%, var(--color-bg-surface))`, color: tint }}
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-5" style={{ color: "var(--color-text-primary)" }}>{name}</p>
          <p className="truncate text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {right}
          {expandable && <Chevron open={!!expanded} />}
        </div>
      </div>
      {expanded && children && (
        <div className="border-t p-4" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-subtle)" }}>
          {children}
        </div>
      )}
    </SectionCard>
  );
}
