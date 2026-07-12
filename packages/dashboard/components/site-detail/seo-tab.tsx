"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { getEditorHref, useUnifiedEditorFlag } from "@/components/editor-route/unified-flag";
import { SectionCard } from "@/components/dashboard/primitives";

/**
 * SEO content (meta title/description, social image) has ONE edit home: the
 * editor's SEO screen (redesign E5 — "SEO content → editor"). This dashboard tab
 * is a read-only at-a-glance preview + a jump into the editor; it no longer
 * offers a duplicate editing surface. (Technical SEO — sitemap/robots — would
 * live here if/when added.)
 */
interface SeoTabProps {
  site: {
    id?: string;
    slug?: string;
    name?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaTitleTemplate?: string | null;
    ogImage?: string | null;
    [key: string]: unknown;
  };
}

export function SeoTab({ site }: SeoTabProps) {
  const unified = useUnifiedEditorFlag();
  const siteSlug = site.slug ?? "example";
  const metaTitle = site.metaTitle ?? "";
  const metaDesc = site.metaDescription ?? "";
  const ogImage = site.ogImage ?? null;
  const editorHref = site.id ? getEditorHref(site.id, unified) : "/dashboard/sites";

  return (
    <div className="space-y-6">
      <div
        className="flex items-center justify-between rounded-xl border bg-white p-4"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          SEO content is edited in the editor. This is a live preview.
        </p>
        <Link
          href={editorHref}
          className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Pencil className="h-4 w-4" />
          Edit SEO in the editor
        </Link>
      </div>

      <SectionCard title="Google Search Preview">
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border-default)" }}>
          <p className="text-sm" style={{ color: "#1a0dab" }}>{metaTitle || "Page Title"}</p>
          <p className="text-xs" style={{ color: "#006621" }}>{siteSlug}.buildrik.app</p>
          <p className="text-xs" style={{ color: "#545454" }}>{metaDesc || "No description set"}</p>
        </div>
      </SectionCard>

      <SectionCard title="Current Meta Tags">
        <dl className="space-y-3 text-sm">
          <Row label="Meta title" value={metaTitle} empty="Not set" />
          <Row label="Meta description" value={metaDesc} empty="Not set" />
          <Row label="Title template" value={site.metaTitleTemplate ?? ""} empty="{page_title} | {site_name}" />
        </dl>
      </SectionCard>

      {ogImage && (
        <SectionCard title="Social Share Image (og:image)">
          <div className="space-y-3">
            <SocialCardPreview title={metaTitle} description={metaDesc} slug={siteSlug} imageUrl={ogImage} variant="twitter" />
            <SocialCardPreview title={metaTitle} description={metaDesc} slug={siteSlug} imageUrl={ogImage} variant="facebook" />
          </div>
        </SectionCard>
      )}

      {site.id && <TechnicalSeoSection siteId={site.id} />}
    </div>
  );
}

// Technical SEO (d5) — server-side knobs the editor doesn't own: canonical host,
// search-index opt-out, and a custom robots.txt. Self-contained: reads + writes
// via siteDetail.settings so the read-only content preview above stays untouched.
function TechnicalSeoSection({ siteId }: { siteId: string }) {
  const { addToast } = useToast();
  const settings = trpc.siteDetail.settings.get.useQuery({ siteId });
  const [canonicalUrl, setCanonicalUrl] = useState<string | null>(null);
  const [allowIndexing, setAllowIndexing] = useState<boolean | null>(null);
  const [robotsTxt, setRobotsTxt] = useState<string | null>(null);

  const update = trpc.siteDetail.settings.update.useMutation({
    onSuccess: () => { settings.refetch(); addToast("success", "Technical SEO saved"); },
    onError: (e) => addToast("error", "Couldn't save", e.message),
  });

  const data = settings.data as { canonicalUrl?: string | null; allowIndexing?: boolean; robotsTxt?: string | null } | undefined;
  // Fall back to persisted values until the user edits a field locally.
  const canonical = canonicalUrl ?? data?.canonicalUrl ?? "";
  const indexing = allowIndexing ?? data?.allowIndexing ?? true;
  const robots = robotsTxt ?? data?.robotsTxt ?? "";

  const save = () => update.mutate({
    id: siteId,
    canonicalUrl: canonical.trim() || null,
    allowIndexing: indexing,
    robotsTxt: robots.trim() || null,
  });

  return (
    <SectionCard title="Technical SEO">
      {settings.isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-neutral-100" />
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Canonical domain</label>
            <p className="mb-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>The preferred URL search engines should index (e.g. https://www.example.com).</p>
            <input
              value={canonical}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://www.example.com"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              style={{ borderColor: "var(--color-border-default)" }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Allow search engines to index this site</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Off adds a noindex directive — useful for staging.</p>
            </div>
            <button
              type="button"
              onClick={() => setAllowIndexing(!indexing)}
              className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
              style={{ backgroundColor: indexing ? "var(--color-primary)" : "var(--color-border-default)" }}
              aria-pressed={indexing}
            >
              <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform" style={{ transform: indexing ? "translateX(18px)" : "translateX(2px)" }} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>robots.txt</label>
            <p className="mb-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>Leave blank for the sensible default. Custom rules override it.</p>
            <textarea
              value={robots}
              onChange={(e) => setRobotsTxt(e.target.value)}
              rows={4}
              placeholder={"User-agent: *\nAllow: /"}
              className="w-full rounded-md border px-3 py-2 font-mono text-xs outline-none focus:border-[var(--color-primary)]"
              style={{ borderColor: "var(--color-border-default)" }}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={update.isPending}
              className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {update.isPending ? "Saving…" : "Save technical SEO"}
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function Row({ label, value, empty }: { label: string; value: string; empty: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0" style={{ color: "var(--color-text-secondary)" }}>{label}</dt>
      <dd className="text-right" style={{ color: value ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
        {value || empty}
      </dd>
    </div>
  );
}

function SocialCardPreview({
  title,
  description,
  slug,
  imageUrl,
  variant,
}: {
  title: string;
  description: string;
  slug: string;
  imageUrl: string;
  variant: "twitter" | "facebook";
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
        {variant === "twitter" ? "Twitter / X Preview" : "Facebook Preview"}
      </p>
      <div
        className="overflow-hidden rounded-lg border"
        style={{ borderColor: "var(--color-border-default)", maxWidth: variant === "twitter" ? 504 : 524 }}
      >
        <div
          className="w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})`, height: variant === "twitter" ? 252 : 274 }}
        />
        <div className="p-3" style={{ backgroundColor: variant === "twitter" ? "#fff" : "#F0F2F5" }}>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{slug}.buildrik.app</p>
          <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {title || "Page Title"}
          </p>
          {variant === "facebook" && (
            <p className="truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {description || "No description set"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
