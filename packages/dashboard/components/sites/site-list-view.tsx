"use client";
import Link from "next/link";
import { siteAddress } from "@lib/utils";
import { ContextMenu } from "./context-menu";
import { siteStatusTone, siteStatusLabel } from "./site-status";
import { Pill, MetricValue } from "@/components/dashboard/primitives";

interface Site {
  id: string;
  name: string;
  slug: string;
  status: string;
  pages: number;
  lastEditedAt: Date;
  publishedUrl: string | null;
  folderId: string | null;
  domain: string | null;
  visitors30d: number;
}

interface SiteListViewProps {
  sites: Site[];
  selectedIds: Set<string>;
  onSelect: (id: string, event?: React.MouseEvent) => void;
  onSelectAll: () => void;
  allSelected: boolean;
  onAction: (action: string, siteId: string) => void;
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function SiteListView({ sites, selectedIds, onSelect, onSelectAll, allSelected, onAction }: SiteListViewProps) {
  return (
    <div className="overflow-hidden rounded-lg border shadow-card" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
      <table className="w-full text-body">
        <thead>
          <tr className="border-b text-left text-eyebrow uppercase tracking-wide" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-subtle)" }}>
            <th className="w-10 px-[18px] py-2.5"><input type="checkbox" checked={allSelected} onChange={onSelectAll} className="h-4 w-4 rounded accent-[var(--color-primary)]" aria-label="Select all sites" /></th>
            <th className="px-[18px] py-2.5 font-semibold">Name</th>
            <th className="px-[18px] py-2.5 font-semibold">Edited</th>
            <th className="px-[18px] py-2.5 font-semibold">Status</th>
            <th className="w-10 px-[18px] py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => (
            <tr key={site.id} className="border-b last:border-0 transition-colors hover:bg-[var(--color-bg-subtle)]" style={{ borderColor: "var(--color-border-default)" }}>
              <td className="px-[18px] py-3.5"><input type="checkbox" checked={selectedIds.has(site.id)} onChange={() => {}} className="h-4 w-4 rounded accent-[var(--color-primary)]" onClick={(e) => onSelect(site.id, e)} aria-label={`Select ${site.name}`} /></td>
              <td className="px-[18px] py-3.5">
                <Link href={`/dashboard/sites/${site.id}`} className="font-medium hover:underline" style={{ color: "var(--color-text-primary)" }}>{site.name}</Link>
                <p className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>{siteAddress(site) ?? "Not published"}</p>
              </td>
              <td className="px-[18px] py-3.5" style={{ color: "var(--color-text-secondary)" }}><MetricValue>{getTimeAgo(site.lastEditedAt)}</MetricValue></td>
              <td className="px-[18px] py-3.5"><Pill tone={siteStatusTone(site.status)}>{siteStatusLabel(site.status)}</Pill></td>
              <td className="px-[18px] py-3.5"><ContextMenu siteStatus={site.status} onAction={(action) => onAction(action, site.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
