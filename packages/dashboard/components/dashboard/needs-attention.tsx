"use client";

import Link from "next/link";
import { ClipboardCheck, MessageSquare, Globe, AlertTriangle, ArrowRight } from "lucide-react";
import { trpc } from "@lib/trpc/client";

const ICONS = {
  reviews: ClipboardCheck,
  comments: MessageSquare,
  domains: Globe,
  publish_failed: AlertTriangle,
} as const;

// m3 dashboard "Needs attention" — the agency work queue. Hidden entirely when
// nothing is outstanding (no empty chrome on a clean workspace).
export function NeedsAttention() {
  const query = trpc.dashboard.attentionQueue.useQuery(undefined, { retry: false });
  const items = query.data ?? [];
  if (query.isLoading || items.length === 0) return null;

  // Compact chip row, not a tinted band: with few items the old full-width
  // accent band was mostly empty surface (design-review FINDING-005).
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-eyebrow font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Needs attention</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const Icon = ICONS[item.type as keyof typeof ICONS] ?? AlertTriangle;
          return (
            <Link
              key={item.type}
              href={item.href}
              className="group inline-flex items-center gap-3 rounded-lg border bg-white py-2 pl-2.5 pr-3.5 transition-colors hover:border-[var(--color-primary)]"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-base font-bold leading-none" style={{ color: "var(--color-text-primary)" }}>{item.count}</span>
                <span className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-[var(--color-primary)]" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
