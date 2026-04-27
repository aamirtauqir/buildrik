import { TextInput } from "@/shared/ui/TextInput";
/**
 * SocialTab — Open Graph + Twitter sharing preview & fields.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PageItem } from "../types";
import type { UsePageSettingsReturn } from "./usePageSettings";

interface Props {
  s: UsePageSettingsReturn;
  page: PageItem;
}

export const SocialTab: React.FC<Props> = ({ s, page }) => {
  const title = s.ogTitle || s.seoTitle || page.name;
  const desc = s.ogDesc || s.seoDesc || "";
  const domain = s.domain ?? "yoursite.aquibra.io";

  return (
    <div className="bd-pg-social">
      {/* OG card preview — prototype .og-card */}
      <div className="bd-pg-social-og-card">
        <div className="bd-pg-social-og-img" role="img" aria-label="Open Graph image preview">
          {s.ogImageUrl ? (
            <img src={s.ogImageUrl} alt="" className="bd-pg-social-og-img-real" />
          ) : (
            <span className="bd-pg-social-og-placeholder">1200 × 630</span>
          )}
        </div>
        <div className="bd-pg-social-og-body">
          <div className="bd-pg-social-og-domain">{domain}</div>
          <div className="bd-pg-social-og-title">{title}</div>
          <div className="bd-pg-social-og-desc">{desc || "Add a description to preview here"}</div>
        </div>
      </div>
      {/* OG Title */}
      <div className="bd-pg-seo-field">
        <div className="bd-pg-seo-field-header">
          <label className="bd-pg-seo-label" htmlFor="og-title">Open Graph Title</label>
          <span className="bd-pg-seo-counter">{s.ogTitle.length}/60</span>
        </div>
        <TextInput
          id="og-title"
          className="bd-pg-seo-input"
          value={s.ogTitle}
          onChange={(e) => s.setOgTitle(e.target.value)}
          placeholder={s.seoTitle || page.name}
        />
        <div className="bd-pg-seo-hint">Title shown when the page is shared on social networks. Defaults to SEO title.</div>
      </div>
      {/* OG Description */}
      <div className="bd-pg-seo-field">
        <div className="bd-pg-seo-field-header">
          <label className="bd-pg-seo-label" htmlFor="og-desc">Open Graph Description</label>
          <span className="bd-pg-seo-counter">{s.ogDesc.length}/160</span>
        </div>
        <textarea
          id="og-desc"
          className="bd-pg-seo-textarea"
          value={s.ogDesc}
          onChange={(e) => s.setOgDesc(e.target.value)}
          placeholder={s.seoDesc || "Brief summary shown on social"}
        />
      </div>
      {/* OG Image URL */}
      <div className="bd-pg-seo-field">
        <label className="bd-pg-seo-label" htmlFor="og-image">Image URL</label>
        <TextInput
          id="og-image"
          className="bd-pg-seo-input"
          value={s.ogImageUrl ?? ""}
          onChange={(e) => s.setOgImageUrl(e.target.value || null)}
          placeholder="https://…"
          type="url"
        />
        <div className="bd-pg-seo-hint">Recommended size: 1200×630. Appears in Facebook, Twitter/X, LinkedIn previews.</div>
      </div>
    </div>
  );
};

SocialTab.displayName = "SocialTab";
