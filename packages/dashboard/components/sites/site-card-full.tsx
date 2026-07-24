"use client";
import Link from "next/link";
import { FileText, Pencil, Settings, Users, Clock } from "lucide-react";
import { cn, siteAddress, coverFromSeed } from "@lib/utils";
import { ContextMenu } from "./context-menu";
import { EditorLink } from "@/components/editor-route/EditorLink";
import { siteStatusTone, siteStatusLabel } from "./site-status";
import { Pill, MetricValue } from "@/components/dashboard/primitives";

interface SiteCardFullProps {
  site: { id: string; name: string; slug: string; status: string; thumbnail: string | null; pages: number; lastEditedAt: Date; publishedUrl: string | null; visitors30d: number; createdBy: string; domain: string | null; themeLocked?: boolean };
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
  return (
    <div
      className={cn("group relative overflow-hidden rounded-xl border bg-white shadow-card transition-shadow hover:shadow-md", selected && "ring-2 ring-[var(--color-primary)]")}
      style={{ borderColor: "var(--color-border-default)" }}
    >
      <div className="absolute left-3 top-3 z-10">
        <input type="checkbox" checked={selected} onChange={() => {}} className="h-4 w-4 rounded border-gray-300 accent-[var(--color-primary)]" onClick={(e) => { e.stopPropagation(); onSelect(site.id, e); }} />
      </div>
      <Link href={`/dashboard/sites/${site.id}`}>
        {/* 16:10 preview. A real screenshot when we have one; otherwise a
            deterministic tinted cover with the site's initial, so no two cards
            read as the same grey globe (audit B1). */}
        {site.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={site.thumbnail} alt="" className="aspect-[16/10] w-full object-cover" />
        ) : (
          (() => {
            const cover = coverFromSeed(site.id);
            return (
              <div className="flex aspect-[16/10] w-full items-center justify-center" style={{ backgroundColor: cover.bg }}>
                <span className="text-[38px] font-bold leading-none" style={{ color: cover.fg }}>
                  {site.name.charAt(0).toUpperCase()}
                </span>
              </div>
            );
          })()
        )}
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[14px] font-semibold leading-tight" style={{ color: "var(--color-text-primary)" }}>{site.name}</h3>
            <Pill tone={siteStatusTone(site.status)} className="shrink-0">{siteStatusLabel(site.status)}</Pill>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p className="truncate text-body-sm" style={{ color: "var(--color-text-muted)" }}>{siteAddress(site) ?? "Not published"}</p>
            {site.themeLocked && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-[var(--color-bg-subtle)] px-1.5 py-0.5 text-eyebrow font-medium" style={{ color: "var(--color-text-secondary)" }} title="This site overrides the shared theme">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--color-amber)" }} />
                Local theme
              </span>
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-3 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /><MetricValue>{site.pages}</MetricValue> pages</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /><MetricValue>{formatVisitors(site.visitors30d)}</MetricValue> visitors</span>
            <span className="ml-auto flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
              <Clock className="h-3.5 w-3.5" /><MetricValue>{getTimeAgo(site.lastEditedAt)}</MetricValue>
            </span>
          </div>
        </div>
      </Link>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 rounded-b-xl bg-white/95 px-4 py-3 opacity-0 transition-opacity group-hover:opacity-100" style={{ borderTop: "1px solid var(--color-border-default)" }}>
        <EditorLink siteId={site.id} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-body-sm font-medium text-white" style={{ backgroundColor: "var(--color-primary)" }}>
          <Pencil className="h-3.5 w-3.5" />Edit
        </EditorLink>
        <Link href={`/dashboard/sites/${site.id}`} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-body-sm font-medium" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>
          <Settings className="h-3.5 w-3.5" />Manage
        </Link>
        <div className="ml-auto">
          <ContextMenu siteStatus={site.status} onAction={(action) => onAction(action, site.id)} />
        </div>
      </div>
    </div>
  );
}
