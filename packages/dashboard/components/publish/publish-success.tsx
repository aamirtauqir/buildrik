"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, ExternalLink, Share2, BarChart3, Pencil, LayoutDashboard, Globe, Loader2, ArrowUpRight } from "lucide-react";

interface PublishSuccessProps {
  siteId: string;
  slug: string;
  customDomain?: string | null;
  plan?: string;
}

export function PublishSuccess({ siteId, slug, customDomain, plan = "FREE" }: PublishSuccessProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const buildrikUrl = `https://${slug}.buildrik.app`;
  const domainUrl = customDomain ? `https://${customDomain}` : null;

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <CheckCircle2 className="mx-auto h-16 w-16" style={{ color: "#22C55E" }} />
      <h2 className="mt-4 text-2xl font-bold" style={{ color: "#0D0D0D" }}>Site Published!</h2>
      <p className="mt-2 text-sm" style={{ color: "#7A7A7A" }}>Your site is now live and accessible to the world.</p>

      {/* Buildrik URL */}
      <UrlRow
        label="Live URL"
        url={buildrikUrl}
        isCopied={copiedUrl === buildrikUrl}
        onCopy={() => handleCopy(buildrikUrl)}
      />

      {/* Custom domain URL */}
      {domainUrl && (
        <UrlRow
          label="Custom Domain"
          url={domainUrl}
          isCopied={copiedUrl === domainUrl}
          onCopy={() => handleCopy(domainUrl)}
        />
      )}

      {/* Custom domain upgrade nudge for FREE plan users without a custom domain */}
      {plan === "FREE" && !customDomain && (
        <div className="mt-4 rounded-xl border p-4 text-left" style={{ borderColor: "#E8E8E8", backgroundColor: "#FAFAFA" }}>
          <p className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>
            Your site is live on <span style={{ color: "#E42313" }}>{slug}.buildrik.app</span>
          </p>
          <p className="mt-1 text-sm" style={{ color: "#7A7A7A" }}>
            Upgrade to PRO to connect your own domain — your client will never see buildrik.app.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
            style={{ backgroundColor: "#E42313" }}
          >
            Connect a custom domain
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Lighthouse placeholder */}
      <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "#E8E8E8" }}>
        <p className="text-xs font-medium" style={{ color: "#7A7A7A" }}>Lighthouse Score</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#7A7A7A" }} />
          <p className="text-sm font-medium" style={{ color: "#7A7A7A" }}>Calculating...</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          href={`/dashboard/sites/${siteId}/sharing`}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "#E42313" }}
        >
          <Share2 className="h-4 w-4" />
          Share with Client
        </Link>
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

function UrlRow({ label, url, isCopied, onCopy }: { label: string; url: string; isCopied: boolean; onCopy: () => void }) {
  return (
    <div className="mt-4">
      <p className="mb-1 text-left text-xs font-medium" style={{ color: "#7A7A7A" }}>
        <Globe className="mr-1 inline-block h-3.5 w-3.5" />
        {label}
      </p>
      <div className="flex items-center gap-2 rounded-xl border p-3" style={{ borderColor: "#E8E8E8" }}>
        <span className="flex-1 truncate text-left text-sm font-medium" style={{ color: "#0D0D0D" }}>{url}</span>
        <button
          onClick={onCopy}
          className="shrink-0 rounded-lg p-2 hover:bg-gray-100"
          title="Copy URL"
        >
          <Copy className="h-4 w-4" style={{ color: isCopied ? "#22C55E" : "#7A7A7A" }} />
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg p-2 hover:bg-gray-100"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" style={{ color: "#7A7A7A" }} />
        </a>
      </div>
    </div>
  );
}
