"use client";
import Link from "next/link";
import { Globe, FileText, Pencil, Settings, Users, Clock } from "lucide-react";
import { cn } from "@lib/utils";
import { ContextMenu } from "./context-menu";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PUBLISHED: { bg: "#DCFCE7", text: "#166534" },
  DRAFT: { bg: "#FEF9C3", text: "#854D0E" },
  ARCHIVED: { bg: "#FED7AA", text: "#9A3412" },
};

interface SiteCardFullProps {
  site: { id: string; name: string; slug: string; status: string; thumbnail: string | null; pages: number; lastEditedAt: Date; publishedUrl: string | null; visitors30d: number; createdBy: string; domain: string | null };
  selected: boolean;
  onSelect: (id: string, event?: React.MouseEvent) => void;
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

export function SiteCardFull({ site, selected, onSelect, onAction }: SiteCardFullProps) {
  const statusColor = STATUS_COLORS[site.status] ?? STATUS_COLORS.DRAFT;
  return (
    <div className={cn("group relative rounded-xl border bg-white transition-shadow hover:shadow-md", selected && "ring-2 ring-[#E42313]")} style={{ borderColor: "#E8E8E8" }}>
      <div className="absolute left-3 top-3 z-10">
        <input type="checkbox" checked={selected} onChange={() => {}} className="h-4 w-4 rounded border-gray-300 accent-[#E42313]" onClick={(e) => { e.stopPropagation(); onSelect(site.id, e); }} />
      </div>
      <Link href={`/dashboard/sites/${site.id}`}>
        <div className="flex h-36 items-center justify-center rounded-t-xl" style={{ backgroundColor: "#F4F4F4" }}>
          <Globe className="h-10 w-10" style={{ color: "#B0B0B0" }} />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="truncate text-sm font-semibold" style={{ color: "#0D0D0D" }}>{site.name}</h3>
            <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>{site.status.toLowerCase()}</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: "#B0B0B0" }}>{site.slug}.buildrik.app</p>
          <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "#7A7A7A" }}>
            <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{site.pages} pages</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{formatVisitors(site.visitors30d)} visitors</span>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: "#B0B0B0" }}>
            <Clock className="h-3 w-3" />Edited {getTimeAgo(site.lastEditedAt)}
          </p>
        </div>
      </Link>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 rounded-b-xl bg-white/95 px-4 py-3 opacity-0 transition-opacity group-hover:opacity-100" style={{ borderTop: "1px solid #E8E8E8" }}>
        <Link href={`/editor/${site.id}`} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: "#E42313" }}>
          <Pencil className="h-3 w-3" />Edit
        </Link>
        <Link href={`/dashboard/sites/${site.id}`} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}>
          <Settings className="h-3 w-3" />Manage
        </Link>
        <div className="ml-auto">
          <ContextMenu siteStatus={site.status} onAction={(action) => onAction(action, site.id)} />
        </div>
      </div>
    </div>
  );
}
