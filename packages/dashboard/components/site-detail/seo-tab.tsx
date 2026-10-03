"use client";

import { SectionCard } from "@/components/dashboard/primitives";
import { EditInSiteSettings, SummaryCard, SummaryNotice, SummaryRow } from "./settings-summary";

/**
 * Site tab · SEO — read-only (Settings Phase B, PD-1, plan row #51).
 *
 * SEO defaults, social profiles and indexing (canonical URL, allow indexing,
 * robots.txt) are edited in the editor's Site settings › SEO; this tab shows
 * the search and social previews and what is stored, and every card opens
 * that screen (`?settings=seo` — SET-13: the old link opened the canvas).
 */
interface SeoTabProps {
  site: {
    id?: string;
    slug?: string;
    name?: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    metaTitleTemplate?: string | null;
    ogImage?: string | null;
    canonicalUrl?: string | null;
    allowIndexing?: boolean;
    robotsTxt?: string | null;
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
  /* Prefer what the editor writes: the home PAGE's SEO (`pageSeo`); the site
     columns stay the fallback for anything set through the API. */
  const pageSeo = site.pageSeo ?? null;
  const metaTitle = pageSeo?.metaTitle ?? site.metaTitle ?? "";
  const metaDesc = pageSeo?.metaDescription ?? site.metaDescription ?? "";
  const ogImage = pageSeo?.ogImage ?? site.ogImage ?? null;
  const siteId = site.id ?? "";
  const robotsLines = site.robotsTxt?.trim() ? site.robotsTxt.trim().split(/\r?\n/).length : 0;

  return (
    <div className="space-y-6">
      <SummaryNotice>SEO is edited in the editor&rsquo;s Site settings. This is a live preview of what is stored.</SummaryNotice>

      <SectionCard title="Google Search Preview" actions={siteId ? <EditInSiteSettings siteId={siteId} screen="seo" /> : undefined}>
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border-default)" }}>
          <p className="text-body" style={{ color: "#1a0dab" }}>{metaTitle || "Page Title"}</p>
          <p className="text-body-sm" style={{ color: "#006621" }}>{SERP_PLACEHOLDER_HOST}</p>
          <p className="text-body-sm" style={{ color: "#545454" }}>{metaDesc || "No description set"}</p>
        </div>
      </SectionCard>

      {siteId ? (
        <SummaryCard title={pageSeo ? `Current Meta Tags — ${pageSeo.pageName}` : "Current Meta Tags"} siteId={siteId} screen="seo">
          <SummaryRow label="Meta title" value={metaTitle} />
          <SummaryRow label="Meta description" value={metaDesc} />
          <SummaryRow label="Title template" value={site.metaTitleTemplate ?? ""} empty="{page_title} | {site_name}" />
        </SummaryCard>
      ) : null}

      {ogImage && (
        <SectionCard title="Social Share Image (og:image)">
          <div className="space-y-3">
            <SocialCardPreview title={metaTitle} description={metaDesc} imageUrl={ogImage} variant="twitter" />
            <SocialCardPreview title={metaTitle} description={metaDesc} imageUrl={ogImage} variant="facebook" />
          </div>
        </SectionCard>
      )}

      {siteId ? (
        <SummaryCard title="Indexing" siteId={siteId} screen="seo">
          <SummaryRow label="Allow indexing" value={site.allowIndexing === false ? "Off — pages carry noindex" : "On"} />
          <SummaryRow label="Canonical URL" value={site.canonicalUrl ?? ""} />
          <SummaryRow
            label="robots.txt"
            value={robotsLines ? `Custom · ${robotsLines} ${robotsLines === 1 ? "line" : "lines"}` : ""}
            empty="Default"
          />
          <SummaryRow label="Takes effect" value="Applied when you next publish — the live site keeps its current rules until then." />
        </SummaryCard>
      ) : null}
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
