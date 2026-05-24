"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import type { RecentSite } from "@buildrik/shared/schemas/dashboard";
import { SiteCard } from "@/components/dashboard/site-card";

type RecentSitesProps = {
  sites: RecentSite[];
};

export function RecentSites({ sites }: RecentSitesProps) {
  const visible = sites.slice(0, 3);
  const showEmptySlot = visible.length < 4;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#0D0D0D]">Recent Sites</h2>
        <Link href="/dashboard/sites" className="text-xs text-[var(--color-primary)] hover:underline">
          View All &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {visible.map((site) => (
          <SiteCard key={site.id} site={site} />
        ))}
        {showEmptySlot && (
          <Link
            href="/dashboard/sites/new"
            className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#E8E8E8] bg-[#F4F4F4] hover:border-[var(--color-primary)]/40 transition-colors"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E8E8] bg-white">
              <Plus className="h-4 w-4 text-[#7A7A7A]" />
            </span>
            <span className="text-xs text-[#7A7A7A]">Create your next project</span>
          </Link>
        )}
      </div>
    </div>
  );
}
