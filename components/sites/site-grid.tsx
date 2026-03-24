"use client";
import { SiteCardFull } from "./site-card-full";

interface SiteGridProps {
  sites: Array<{ id: string; name: string; slug: string; status: string; thumbnail: string | null; pages: number; lastEditedAt: Date; publishedUrl: string | null }>;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onAction: (action: string, siteId: string) => void;
}

export function SiteGrid({ sites, selectedIds, onSelect, onAction }: SiteGridProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {sites.map((site) => (
        <SiteCardFull key={site.id} site={site} selected={selectedIds.has(site.id)} onSelect={onSelect} onAction={onAction} />
      ))}
    </div>
  );
}
