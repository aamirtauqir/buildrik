"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, ExternalLink, Share2, BarChart3, Pencil, LayoutDashboard } from "lucide-react";

interface PublishSuccessProps {
  siteId: string;
  publicUrl: string;
  lighthouseScore: number | null;
}

export function PublishSuccess({ siteId, publicUrl, lighthouseScore }: PublishSuccessProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <CheckCircle2 className="mx-auto h-16 w-16" style={{ color: "#22C55E" }} />
      <h2 className="mt-4 text-2xl font-bold" style={{ color: "#0D0D0D" }}>Site Published!</h2>
      <p className="mt-2 text-sm" style={{ color: "#7A7A7A" }}>Your site is now live and accessible to the world.</p>

      {/* URL */}
      <div className="mt-6 flex items-center gap-2 rounded-xl border p-3" style={{ borderColor: "#E8E8E8" }}>
        <span className="flex-1 truncate text-left text-sm font-medium" style={{ color: "#0D0D0D" }}>{publicUrl}</span>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-lg p-2 hover:bg-gray-100"
          title="Copy URL"
        >
          <Copy className="h-4 w-4" style={{ color: copied ? "#22C55E" : "#7A7A7A" }} />
        </button>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg p-2 hover:bg-gray-100"
          title="Open site"
        >
          <ExternalLink className="h-4 w-4" style={{ color: "#7A7A7A" }} />
        </a>
      </div>

      {/* Lighthouse */}
      {lighthouseScore !== null && (
        <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "#E8E8E8" }}>
          <p className="text-xs font-medium" style={{ color: "#7A7A7A" }}>Lighthouse Score</p>
          <p
            className="mt-1 text-3xl font-bold"
            style={{ color: lighthouseScore >= 90 ? "#22C55E" : lighthouseScore >= 50 ? "#F59E0B" : "#E42313" }}
          >
            {lighthouseScore}
          </p>
        </div>
      )}

      {/* CTAs */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "#E42313" }}
        >
          <Share2 className="h-4 w-4" />
          Share with Client
        </button>
        <Link
          href={`/dashboard/sites/${siteId}/analytics`}
          className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
          style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
        >
          <BarChart3 className="h-4 w-4" />
          View Analytics
        </Link>
        <Link
          href={`/dashboard/sites/${siteId}`}
          className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
          style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
        >
          <Pencil className="h-4 w-4" />
          Edit Site
        </Link>
        <Link
          href="/dashboard/sites"
          className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
          style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
