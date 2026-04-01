"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Globe, Pencil, ArrowRight, Upload, Link2, Check } from "lucide-react";
import { cn } from "@lib/utils";
import type { RecentSite } from "@buildrik/shared/schemas/dashboard";

const editorUrl = process.env.NEXT_PUBLIC_EDITOR_URL || "http://localhost:5050";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-[#DCFCE7] text-[#166534]",
  draft: "bg-[#FEF9C3] text-[#854D0E]",
  archived: "bg-[#F4F4F4] text-[#7A7A7A]",
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
  const statusStyle = STATUS_STYLES[site.status] ?? "bg-[#F4F4F4] text-[#7A7A7A]";

  function handleCopyUrl(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!site.publishedUrl) return;
    navigator.clipboard.writeText(site.publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-[#E8E8E8] bg-white hover:border-[#E42313]/30 transition-colors">
      {/* Thumbnail */}
      <div className="relative flex h-32 items-center justify-center bg-[#F4F4F4]">
        {site.thumbnail ? (
          <Image
            src={site.thumbnail}
            alt={site.name}
            fill
            className="object-cover"
          />
        ) : (
          <Globe className="h-8 w-8 text-[#B0B0B0]" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <a
            href={`${editorUrl}/?siteId=${site.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-[#E42313] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#C91F10] transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </a>
          <Link
            href={`/dashboard/sites/${site.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors"
          >
            Manage
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Quick action icon */}
        {site.status === "draft" && (
          <Link
            href={`/dashboard/sites/${site.id}`}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-white"
            title="Publish"
          >
            <Upload className="h-3.5 w-3.5 text-[#854D0E]" />
          </Link>
        )}
        {site.status === "published" && site.publishedUrl && (
          <button
            onClick={handleCopyUrl}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-white"
            title="Copy URL"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#166534]" />
            ) : (
              <Link2 className="h-3.5 w-3.5 text-[#166534]" />
            )}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-[#0D0D0D]">{site.name}</p>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize", statusStyle)}>
            {site.status}
          </span>
        </div>
        <p className="mt-1 text-xs text-[#B0B0B0]">
          Edited {timeAgo(site.lastEditedAt)} · {site.pages} page{site.pages !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
