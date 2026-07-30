"use client";

import type { ReactNode } from "react";

/** The one filter pill: outlined chip, accent-subtle when active. Every
 *  pick-one-of-N list filter (sites status/date/traffic, marketplace
 *  categories, analytics ranges) renders this — FilterTabs stays the track
 *  control for view/sort segments. */
export function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-pill border px-3 py-1 text-body-sm font-medium transition-colors"
      style={
        active
          ? { backgroundColor: "var(--color-primary-subtle)", borderColor: "var(--color-primary)", color: "var(--color-primary)" }
          : { backgroundColor: "var(--color-bg-surface)", borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }
      }
    >
      {children}
    </button>
  );
}
