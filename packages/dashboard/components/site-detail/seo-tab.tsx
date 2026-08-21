"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { getEditorHref, useUnifiedEditorFlag } from "@/components/editor-route/unified-flag";
import { Button, SectionCard } from "@/components/dashboard/primitives";

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
    /** The home page's own SEO, which is what the editor edits. */
    pageSeo?: {
      pageName: string;
      metaTitle: string | null;
      metaDescription: string | null;
      ogImage: string | null;
    } | null;
    [key: string]: unknown;
  };
}

// This tab reads siteDetail.settings, which carries no domain and no
// publishedUrl — so the site's real address isn't knowable here. The search and
// social cards show a neutral stand-in rather than a host we can't promise.
const SERP_PLACEHOLDER_HOST = "yoursite.com";

export function SeoTab({ site }: SeoTabProps) {
  const unified = useUnifiedEditorFlag();
  /* Prefer what the editor writes. `site.metaTitle` / `metaDescription` are
     site columns no screen writes — the editor's SEO panel writes the PAGE's
     settings, which arrive here as `pageSeo`. Site-level values remain the
     fallback for anything set through the API. */
  const pageSeo = site.pageSeo ?? null;
  const metaTitle = pageSeo?.metaTitle ?? site.metaTitle ?? "";
  const metaDesc = pageSeo?.metaDescription ?? site.metaDescription ?? "";
  const ogImage = pageSeo?.ogImage ?? site.ogImage ?? null;
  const editorHref = site.id ? getEditorHref(site.id, unified) : "/dashboard/projects";

  return (
    <div className="space-y-6">
      <div
        className="flex items-center justify-between rounded-lg border bg-white p-4"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
          SEO content is edited in the editor. This is a live preview.
        </p>
        <Link
          href={editorHref}
          className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-body font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Pencil className="h-4 w-4" />
          Edit SEO in the editor
        </Link>
      </div>

      <SectionCard title="Google Search Preview">
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border-default)" }}>
          <p className="text-body" style={{ color: "#1a0dab" }}>{metaTitle || "Page Title"}</p>
          <p className="text-body-sm" style={{ color: "#006621" }}>{SERP_PLACEHOLDER_HOST}</p>
          <p className="text-body-sm" style={{ color: "#545454" }}>{metaDesc || "No description set"}</p>
        </div>
      </SectionCard>

      <SectionCard title={pageSeo ? `Current Meta Tags — ${pageSeo.pageName}` : "Current Meta Tags"}>
        <dl className="space-y-3 text-body">
          <Row label="Meta title" value={metaTitle} empty="Not set" />
          <Row label="Meta description" value={metaDesc} empty="Not set" />
          <Row label="Title template" value={site.metaTitleTemplate ?? ""} empty="{page_title} | {site_name}" />
        </dl>
      </SectionCard>

      {ogImage && (
        <SectionCard title="Social Share Image (og:image)">
          <div className="space-y-3">
            <SocialCardPreview title={metaTitle} description={metaDesc} imageUrl={ogImage} variant="twitter" />
            <SocialCardPreview title={metaTitle} description={metaDesc} imageUrl={ogImage} variant="facebook" />
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
            <label className="block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>Canonical domain</label>
            <p className="mb-1.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>The preferred URL search engines should index (e.g. https://www.example.com).</p>
            <input
              value={canonical}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://www.example.com"
              className="w-full rounded-md border px-3 py-2 text-body outline-none focus:border-[var(--color-primary)]"
              style={{ borderColor: "var(--color-border-default)" }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>Allow search engines to index this site</p>
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>Off adds a noindex directive — useful for staging.</p>
            </div>
            {/* Icon-only switch: axe reported "does not have inner text that is
                visible to screen readers". role=switch + aria-checked + a name,
                the same trio the Settings toggles carry. */}
            <button
              type="button"
              role="switch"
              aria-checked={indexing}
              aria-label="Allow search engines to index this site"
              onClick={() => setAllowIndexing(!indexing)}
              className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
              style={{ backgroundColor: indexing ? "var(--color-primary)" : "var(--color-border-default)" }}
            >
              <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform" style={{ transform: indexing ? "translateX(18px)" : "translateX(2px)" }} />
            </button>
          </div>

          <div>
            <label className="block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>robots.txt</label>
            <p className="mb-1.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>Leave blank for the sensible default. Custom rules override it.</p>
            <textarea
              value={robots}
              onChange={(e) => setRobotsTxt(e.target.value)}
              rows={4}
              placeholder={"User-agent: *\nAllow: /"}
              className="w-full rounded-md border px-3 py-2 font-mono text-body-sm outline-none focus:border-[var(--color-primary)]"
              style={{ borderColor: "var(--color-border-default)" }}
            />
          </div>

          {/* All three of these reach visitors through the deploy, not through
              this save: the publish worker writes robots.txt, the noindex meta
              and the canonical link into each page as it uploads them. Saving
              stores the values and leaves the live site exactly as it was. */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
              Applied when you next publish — the live site keeps its current rules until then.
            </p>
            <Button type="button" onClick={save} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save technical SEO"}
            </Button>
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
  imageUrl,
  variant,
}: {
  title: string;
  description: string;
  imageUrl: string;
  variant: "twitter" | "facebook";
}) {
  return (
    <div>
      <p className="mb-1 text-body-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
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
          <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{SERP_PLACEHOLDER_HOST}</p>
          <p className="truncate text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {title || "Page Title"}
          </p>
          {variant === "facebook" && (
            <p className="truncate text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
              {description || "No description set"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
