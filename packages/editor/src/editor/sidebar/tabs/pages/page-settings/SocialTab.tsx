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
    <div className="pg-social">
      {/* OG card preview — prototype .og-card */}
      <div className="pg-social__og-card">
        <div className="pg-social__og-img" role="img" aria-label="Open Graph image preview">
          {s.ogImageUrl ? (
            <img src={s.ogImageUrl} alt="" className="pg-social__og-img-real" />
          ) : (
            <span className="pg-social__og-placeholder">1200 × 630</span>
          )}
        </div>
        <div className="pg-social__og-body">
          <div className="pg-social__og-domain">{domain}</div>
          <div className="pg-social__og-title">{title}</div>
          <div className="pg-social__og-desc">{desc || "Add a description to preview here"}</div>
        </div>
      </div>

      {/* OG Title */}
      <div className="pg-seo__field">
        <div className="pg-seo__field-header">
          <label className="pg-seo__label" htmlFor="og-title">Open Graph Title</label>
          <span className="pg-seo__counter">{s.ogTitle.length}/60</span>
        </div>
        <input
          id="og-title"
          className="pg-seo__input"
          value={s.ogTitle}
          onChange={(e) => s.setOgTitle(e.target.value)}
          placeholder={s.seoTitle || page.name}
        />
        <div className="pg-seo__hint">Title shown when the page is shared on social networks. Defaults to SEO title.</div>
      </div>

      {/* OG Description */}
      <div className="pg-seo__field">
        <div className="pg-seo__field-header">
          <label className="pg-seo__label" htmlFor="og-desc">Open Graph Description</label>
          <span className="pg-seo__counter">{s.ogDesc.length}/160</span>
        </div>
        <textarea
          id="og-desc"
          className="pg-seo__textarea"
          value={s.ogDesc}
          onChange={(e) => s.setOgDesc(e.target.value)}
          placeholder={s.seoDesc || "Brief summary shown on social"}
        />
      </div>

      {/* OG Image URL */}
      <div className="pg-seo__field">
        <label className="pg-seo__label" htmlFor="og-image">Image URL</label>
        <input
          id="og-image"
          className="pg-seo__input"
          value={s.ogImageUrl ?? ""}
          onChange={(e) => s.setOgImageUrl(e.target.value || null)}
          placeholder="https://…"
          type="url"
        />
        <div className="pg-seo__hint">Recommended size: 1200×630. Appears in Facebook, Twitter/X, LinkedIn previews.</div>
      </div>
    </div>
  );
};

SocialTab.displayName = "SocialTab";
