"use client";
import Link from "next/link";
import { ArrowLeft, Pencil, Globe, ExternalLink } from "lucide-react";
import { EditorLink } from "@/components/editor-route/EditorLink";
import { siteStatusTone } from "@/components/sites/site-status";
import { Pill } from "@/components/dashboard/primitives";

interface SiteHeaderProps {
  site: { id: string; name: string; slug: string; status: string; publishedUrl: string | null };
  onPublish?: () => void;
  onUnpublish?: () => void;
}

export function SiteHeader({ site, onPublish, onUnpublish }: SiteHeaderProps) {
  return (
    <div>
      <Link href="/dashboard/sites" className="mb-3 inline-flex items-center gap-1 text-sm transition-colors hover:underline" style={{ color: "var(--color-text-secondary)" }}>
        <ArrowLeft className="h-4 w-4" />Back to My Sites
      </Link>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>{site.name}</h1>
          <Pill tone={siteStatusTone(site.status)}>{site.status.toLowerCase()}</Pill>
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
          {/* Dead "more options" button (no onClick, no menu) removed. */}
        </div>
      </div>
    </div>
  );
}
