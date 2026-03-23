"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecentSite } from "@/lib/validations/dashboard";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-[#DCFCE7] text-[#166534]",
  draft: "bg-[#FEF9C3] text-[#854D0E]",
  archived: "bg-[#FED7AA] text-[#9A3412]",
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
  const statusStyle = STATUS_STYLES[site.status] ?? "bg-[#F4F4F4] text-[#7A7A7A]";

  return (
    <Link
      href={`/dashboard/sites/${site.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-[#E8E8E8] bg-white hover:border-[#E42313]/30 transition-colors"
    >
      <div className="flex h-32 items-center justify-center bg-[#F4F4F4]">
        <Globe className="h-8 w-8 text-[#B0B0B0]" />
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-[#0D0D0D]">{site.name}</p>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", statusStyle)}>
            {site.status}
          </span>
        </div>
        <p className="mt-1 text-xs text-[#B0B0B0]">
          {timeAgo(site.lastEditedAt)} · {site.pages} page{site.pages !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}
