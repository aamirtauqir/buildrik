"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Globe, Pencil, ArrowRight, Upload, Link2, Check } from "lucide-react";
import type { RecentSite } from "@buildrik/shared/schemas/dashboard";
import { EditorLink } from "@/components/editor-route/EditorLink";
import { Pill, MetricValue, type PillTone } from "@/components/dashboard/primitives";

const STATUS_TONE: Record<string, PillTone> = {
  published: "success",
  draft: "warning",
  archived: "neutral",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type SiteCardProps = {
  site: RecentSite;
};

export function SiteCard({ site }: SiteCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopyUrl(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!site.publishedUrl) return;
    navigator.clipboard.writeText(site.publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-white hover:border-[var(--color-primary)]/30 transition-colors">
      {/* Thumbnail */}
      <div className="relative flex h-32 items-center justify-center bg-[var(--color-bg-subtle)]">
        {site.thumbnail ? (
          <Image
            src={site.thumbnail}
            alt={site.name}
            fill
            className="object-cover"
          />
        ) : (
          <Globe className="h-8 w-8 text-[var(--color-text-muted)]" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <EditorLink
            siteId={site.id}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-body-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </EditorLink>
          <Link
            href={`/dashboard/sites/${site.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-body-sm font-medium text-white hover:bg-white/20 transition-colors"
          >
            Manage
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Quick action icon */}
        {site.status === "draft" && (
          <Link
            href={`/dashboard/sites/${site.id}`}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-white"
            title="Publish"
          >
            <Upload className="h-3.5 w-3.5 text-[var(--color-warning-text)]" />
          </Link>
        )}
        {site.status === "published" && site.publishedUrl && (
          <button
            onClick={handleCopyUrl}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-white"
            title="Copy URL"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[var(--color-success-text)]" />
            ) : (
              <Link2 className="h-3.5 w-3.5 text-[var(--color-success-text)]" />
            )}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-body font-medium text-[var(--color-text-primary)]">{site.name}</p>
          <Pill tone={STATUS_TONE[site.status] ?? "neutral"} className="shrink-0 capitalize">
            {site.status}
          </Pill>
        </div>
        <p className="mt-1 text-body-sm text-[var(--color-text-muted)]">
          Edited {timeAgo(site.lastEditedAt)} · <MetricValue>{site.pages}</MetricValue> page{site.pages !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
