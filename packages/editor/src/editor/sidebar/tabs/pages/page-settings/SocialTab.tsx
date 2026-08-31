/**
 * SocialTab — Open Graph + Twitter sharing preview & fields.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BK_HELPER_CLASS, BK_LABEL_CLASS, HelperText, Label, Textarea, TextInput } from "@/editor/chrome-ui";
import type { PageItem } from "../types";
import type { UsePageSettingsReturn } from "./usePageSettings";

interface Props {
  s: UsePageSettingsReturn;
  page: PageItem;
}

export const SocialTab: React.FC<Props> = ({ s, page }) => {
  const title = s.ogTitle || s.seoTitle || page.name;
  const desc = s.ogDesc || s.seoDesc || "";
  const domain = s.domain ?? "yoursite.com";

  return (
    <div className="tw:flex tw:flex-col tw:gap-[14px]">
      {/* OG card preview — prototype .og-card */}
      <div style={{ maxWidth: 420, background: "var(--bk-bg-card)", border: "1px solid var(--bk-border)", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: "100%", aspectRatio: "1200 / 630", display: "grid", placeItems: "center", background: "var(--bk-bg-subtle)", position: "relative" }} role="img" aria-label="Open Graph image preview">
          {s.ogImageUrl ? (
            <img src={s.ogImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <span style={{ font: "500 14px var(--bk-font-mono)", color: "var(--bk-ink-muted)", letterSpacing: "0.04em" }}>1200 × 630</span>
          )}
        </div>
        <div className="tw:flex tw:flex-col tw:gap-0.5 tw:px-3 tw:py-[10px]">
          <div style={{ font: "500 11px var(--bk-font-mono)", color: "var(--bk-ink-muted)" }}>{domain}</div>
          <div style={{ font: "500 13px var(--bk-font-ui)", color: "var(--bk-ink)" }}>{title}</div>
          <div style={{ font: "400 12px var(--bk-font-ui)", color: "var(--bk-ink)", lineHeight: 1.4 }}>{desc || "Add a description to preview here"}</div>
        </div>
      </div>
      {/* OG Title */}
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
          <Label htmlFor="og-title" className={BK_LABEL_CLASS}>Open Graph Title</Label>
          <span style={{ font: "500 11px var(--bk-font-mono)", color: "var(--bk-ink-muted)" }}>{s.ogTitle.length}/60</span>
        </div>
        <TextInput
          id="og-title"
          value={s.ogTitle}
          onChange={(e) => s.setOgTitle(e.target.value)}
          placeholder={s.seoTitle || page.name}
        />
        <HelperText className={BK_HELPER_CLASS}>Title shown when the page is shared on social networks. Defaults to SEO title.</HelperText>
      </div>
      {/* OG Description */}
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
          <Label htmlFor="og-desc" className={BK_LABEL_CLASS}>Open Graph Description</Label>
          <span style={{ font: "500 11px var(--bk-font-mono)", color: "var(--bk-ink-muted)" }}>{s.ogDesc.length}/160</span>
        </div>
        <Textarea
          className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
          id="og-desc"
          value={s.ogDesc}
          onChange={(e) => s.setOgDesc(e.target.value)}
          placeholder={s.seoDesc || "Brief summary shown on social"}
        />
      </div>
      {/* OG Image URL */}
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        <Label htmlFor="og-image" className={BK_LABEL_CLASS}>Image URL</Label>
        <TextInput
          id="og-image"
          value={s.ogImageUrl ?? ""}
          onChange={(e) => s.setOgImageUrl(e.target.value || null)}
          placeholder="https://…"
          type="url"
        />
        <HelperText className={BK_HELPER_CLASS}>Recommended size: 1200×630. Appears in Facebook, Twitter/X, LinkedIn previews.</HelperText>
      </div>
    </div>
  );
};

SocialTab.displayName = "SocialTab";
