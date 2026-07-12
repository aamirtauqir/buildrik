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

  return (
    <section className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-primary-subtle)" }}>
      <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Needs attention</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = ICONS[item.type as keyof typeof ICONS] ?? AlertTriangle;
          return (
            <Link
              key={item.type}
              href={item.href}
              className="group flex items-center gap-3 rounded-lg border bg-white p-3 transition-colors hover:border-[var(--color-primary)]"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold leading-none" style={{ color: "var(--color-text-primary)" }}>{item.count}</span>
                <span className="block truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-[var(--color-primary)]" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
