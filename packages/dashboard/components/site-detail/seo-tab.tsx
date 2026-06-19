"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { getEditorHref, useUnifiedEditorFlag } from "@/components/editor-route/unified-flag";

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

      <Section title="Google Search Preview">
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border-default)" }}>
          <p className="text-sm" style={{ color: "#1a0dab" }}>{metaTitle || "Page Title"}</p>
          <p className="text-xs" style={{ color: "#006621" }}>{siteSlug}.buildrik.app</p>
          <p className="text-xs" style={{ color: "#545454" }}>{metaDesc || "No description set"}</p>
        </div>
      </Section>

      <Section title="Current Meta Tags">
        <dl className="space-y-3 text-sm">
          <Row label="Meta title" value={metaTitle} empty="Not set" />
          <Row label="Meta description" value={metaDesc} empty="Not set" />
          <Row label="Title template" value={site.metaTitleTemplate ?? ""} empty="{page_title} | {site_name}" />
        </dl>
      </Section>

      {ogImage && (
        <Section title="Social Share Image (og:image)">
          <div className="space-y-3">
            <SocialCardPreview title={metaTitle} description={metaDesc} slug={siteSlug} imageUrl={ogImage} variant="twitter" />
            <SocialCardPreview title={metaTitle} description={metaDesc} slug={siteSlug} imageUrl={ogImage} variant="facebook" />
          </div>
        </Section>
      )}
    </div>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--color-border-default)" }}>
      <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
      {children}
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
