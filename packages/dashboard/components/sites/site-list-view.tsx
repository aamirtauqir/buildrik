"use client";
import Link from "next/link";
import { ContextMenu } from "./context-menu";
import { siteStatusTone } from "./site-status";
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

function formatVisitors(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

export function SiteListView({ sites, selectedIds, onSelect, onSelectAll, allSelected, onAction }: SiteListViewProps) {
  return (
    <div className="rounded-xl border bg-white" style={{ borderColor: "var(--color-border-default)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--color-border-default)" }}>
            <th className="w-10 px-4 py-3"><input type="checkbox" checked={allSelected} onChange={onSelectAll} className="h-4 w-4 rounded accent-[var(--color-primary)]" /></th>
            <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>Name</th>
            <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>Status</th>
            <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>Pages</th>
            <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>Visitors (30d)</th>
            <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>Domain</th>
            <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>Last Edited</th>
            <th className="w-10 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => {
            return (
              <tr key={site.id} className="border-b transition-colors hover:bg-[var(--color-bg-page)]" style={{ borderColor: "var(--color-border-default)" }}>
                <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(site.id)} onChange={() => {}} className="h-4 w-4 rounded accent-[var(--color-primary)]" onClick={(e) => onSelect(site.id, e)} /></td>
                <td className="px-4 py-3"><Link href={`/dashboard/sites/${site.id}`} className="font-medium hover:underline" style={{ color: "var(--color-text-primary)" }}>{site.name}</Link><p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{site.slug}.buildrik.app</p></td>
                <td className="px-4 py-3"><Pill tone={siteStatusTone(site.status)}>{site.status.toLowerCase()}</Pill></td>
                <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}><MetricValue>{site.pages}</MetricValue></td>
                <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}><MetricValue>{formatVisitors(site.visitors30d)}</MetricValue></td>
                <td className="px-4 py-3" style={{ color: site.domain ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>{site.domain ?? "--"}</td>
                <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}><MetricValue>{getTimeAgo(site.lastEditedAt)}</MetricValue></td>
                <td className="px-4 py-3"><ContextMenu siteStatus={site.status} onAction={(action) => onAction(action, site.id)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
