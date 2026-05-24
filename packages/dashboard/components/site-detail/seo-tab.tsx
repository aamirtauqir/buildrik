"use client";
import { useState, useRef } from "react";
import { trpc } from "@lib/trpc/client";

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
  onSaveSeo: (data: Record<string, string | null>) => void;
}

export function SeoTab({ site, onSaveSeo }: SeoTabProps) {
  const [metaTitle, setMetaTitle] = useState(site.metaTitle ?? "");
  const [metaDesc, setMetaDesc] = useState(site.metaDescription ?? "");
  const [metaTitleTemplate, setMetaTitleTemplate] = useState(
    site.metaTitleTemplate ?? "{page_title} | {site_name}",
  );
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(site.ogImage ?? null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  const presignMutation = trpc.upload.presign.useMutation();
  const confirmMutation = trpc.upload.confirm.useMutation();

  async function handleOgImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setOgImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    const result = await presignMutation.mutateAsync({
      fileName: file.name,
      fileType: file.type,
      context: "og_image",
      siteId: site.id,
    });
    await fetch(result.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const confirmed = await confirmMutation.mutateAsync({ fileId: result.fileId });
    setOgImagePreview(confirmed.cdnUrl);
  }

  const siteSlug = site.slug ?? "example";

  return (
    <div className="space-y-6">
      <Section title="Meta Tags">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                Meta Title
              </label>
              <span
                className="text-xs"
                style={{ color: metaTitle.length > 60 ? "var(--color-primary)" : "var(--color-text-muted)" }}
              >
                {metaTitle.length}/60
              </span>
            </div>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              maxLength={60}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border-default)" }}
            />
          </div>
          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                Meta Description
              </label>
              <span
                className="text-xs"
                style={{ color: metaDesc.length > 160 ? "var(--color-primary)" : "var(--color-text-muted)" }}
              >
                {metaDesc.length}/160
              </span>
            </div>
            <textarea
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              maxLength={160}
              rows={3}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border-default)" }}
            />
          </div>
        </div>
      </Section>

      <Section title="Google Search Preview">
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border-default)" }}>
          <p className="text-sm" style={{ color: "#1a0dab" }}>
            {metaTitle || "Page Title"}
          </p>
          <p className="text-xs" style={{ color: "#006621" }}>
            {siteSlug}.buildrik.app
          </p>
          <p className="text-xs" style={{ color: "#545454" }}>
            {metaDesc || "No description set"}
          </p>
        </div>
      </Section>

      <Section title="Meta Title Template">
        <div>
          <input
            type="text"
            value={metaTitleTemplate}
            onChange={(e) => setMetaTitleTemplate(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--color-border-default)" }}
          />
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Applies to all pages. Use {"{page_title}"} and {"{site_name}"} as placeholders.
          </p>
        </div>
      </Section>

      <Section title="Social Share Image (og:image)">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => ogImageInputRef.current?.click()}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            >
              Upload Image
            </button>
            <input
              ref={ogImageInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleOgImageUpload}
              className="hidden"
            />
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Recommended: 1200x630px. JPG or PNG, max 2MB.
            </p>
          </div>
          {ogImagePreview && (
            <div className="space-y-3">
              <SocialCardPreview
                title={metaTitle}
                description={metaDesc}
                slug={siteSlug}
                imageUrl={ogImagePreview}
                variant="twitter"
              />
              <SocialCardPreview
                title={metaTitle}
                description={metaDesc}
                slug={siteSlug}
                imageUrl={ogImagePreview}
                variant="facebook"
              />
            </div>
          )}
        </div>
      </Section>

      <button
        onClick={() =>
          onSaveSeo({
            metaTitle,
            metaDescription: metaDesc,
            metaTitleTemplate,
          })
        }
        className="rounded-lg px-6 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Save SEO
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--color-border-default)" }}>
      <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
        {title}
      </h3>
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
          style={{
            backgroundImage: `url(${imageUrl})`,
            height: variant === "twitter" ? 252 : 274,
          }}
        />
        <div className="p-3" style={{ backgroundColor: variant === "twitter" ? "#fff" : "#F0F2F5" }}>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {slug}.buildrik.app
          </p>
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
