"use client";
import Link from "next/link";
import { ArrowLeft, Pencil, Globe, MoreHorizontal, ExternalLink } from "lucide-react";
import { EditorLink } from "@/components/editor-route/EditorLink";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PUBLISHED: { bg: "#DCFCE7", text: "#166534" },
  DRAFT: { bg: "#FEF9C3", text: "#854D0E" },
  ARCHIVED: { bg: "#FED7AA", text: "#9A3412" },
};

interface SiteHeaderProps {
  site: { id: string; name: string; slug: string; status: string; publishedUrl: string | null };
  onPublish?: () => void;
  onUnpublish?: () => void;
}

export function SiteHeader({ site, onPublish, onUnpublish }: SiteHeaderProps) {
  const sc = STATUS_COLORS[site.status] ?? STATUS_COLORS.DRAFT;
  return (
    <div>
      <Link href="/dashboard/sites" className="mb-3 inline-flex items-center gap-1 text-sm transition-colors hover:underline" style={{ color: "var(--color-text-secondary)" }}>
        <ArrowLeft className="h-4 w-4" />Back to My Sites
      </Link>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>{site.name}</h1>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: sc.bg, color: sc.text }}>{site.status.toLowerCase()}</span>
          {site.publishedUrl && (
            <a href={site.publishedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs hover:underline" style={{ color: "var(--color-text-secondary)" }}>
              <Globe className="h-3 w-3" />{site.slug}.buildrik.app
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {site.status === "PUBLISHED" && site.publishedUrl ? (
            <a
              href={site.publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            >
              <ExternalLink className="h-4 w-4" />View Site
            </a>
          ) : (
            <span
              className="flex cursor-not-allowed items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium opacity-50"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
              title="Publish your site first"
            >
              <ExternalLink className="h-4 w-4" />View Site
            </span>
          )}
          <EditorLink siteId={site.id} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-primary)" }}>
            <Pencil className="h-4 w-4" />Edit in Editor
          </EditorLink>
          {site.status === "DRAFT" && onPublish && (
            <button onClick={onPublish} className="rounded-lg border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}>Publish</button>
          )}
          {site.status === "PUBLISHED" && onUnpublish && (
            <button onClick={onUnpublish} className="rounded-lg border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>Unpublish</button>
          )}
          <button className="rounded-lg border p-2" style={{ borderColor: "var(--color-border-default)" }}><MoreHorizontal className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} /></button>
        </div>
      </div>
    </div>
  );
}
