"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { IconChip } from "@/components/dashboard/primitives";
import { SETTINGS_GROUPS, type SettingsSection } from "@/components/dashboard/shell/settings-sections";

function SettingsCard({ entry }: { entry: SettingsSection }) {
  const Icon = entry.icon;
  return (
    <Link
      href={entry.href}
      className="flex items-center gap-3.5 rounded-xl border px-[18px] py-4 transition-colors hover:border-[var(--color-border-strong)]"
      style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
    >
      <IconChip>
        <Icon className="h-5 w-5" />
      </IconChip>
      <div className="min-w-0 flex-1">
        <p className="text-section-title" style={{ color: "var(--color-text-primary)" }}>{entry.label}</p>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>{entry.description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
    </Link>
  );
}

export default function SettingsIndexPage() {
  // Reviews and the partner program live behind the agency layer; hiding those
  // cards keeps every card on this page a destination the user can actually open.
  const features = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  const agency = !!features.data?.agency_layer;

  return (
    <div className="flex flex-col gap-8">
      {SETTINGS_GROUPS.map((group) => {
        const items = group.items.filter((i) => !i.agencyOnly || agency);
        if (items.length === 0) return null;
        return (
          <section key={group.label}>
            <h2 className="mb-3 text-eyebrow font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              {group.label}
            </h2>
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
              {items.map((item) => (
                <SettingsCard key={item.href} entry={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
