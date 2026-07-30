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
        <h2 className="text-section-title text-[var(--color-text-primary)]">Recent Sites</h2>
        <Link href="/dashboard/projects" className="text-body-sm text-[var(--color-primary)] hover:underline">
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
            className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] hover:border-[var(--color-primary)]/40 transition-colors"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-white">
              <Plus className="h-4 w-4 text-[var(--color-text-secondary)]" />
            </span>
            <span className="text-body-sm text-[var(--color-text-secondary)]">Create your next site</span>
          </Link>
        )}
      </div>
    </div>
  );
}
