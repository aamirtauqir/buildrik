/**
 * SocialTab — Pure form renderer.
 * OG Image upload, live social card preview, fallback indicators.
 * Section label: "Social Share Preview" (not "OPEN GRAPH").
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Tooltip } from "@shared/ui/Tooltip";
import type { PageItem } from "../types";
import type { UsePageSettingsReturn } from "./usePageSettings";

interface Props {
  s: UsePageSettingsReturn;
  page: PageItem;
}

export const SocialTab: React.FC<Props> = ({ s, page }) => {
  const displayTitle = s.ogTitle || s.seoTitle || page.name;
  const displayDesc = s.ogDesc || s.seoDesc || "";
  const isFallbackTitle = !s.ogTitle;
  const isFallbackDesc = !s.ogDesc;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => s.setOgImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="pg-social">
      {/* ── SECTION LABEL ────────────────────────────────────────────────── */}
      <div className="pg-social__section-label">
        Social Share Preview
        <Tooltip
          content={
            <span style={{ display: "block", whiteSpace: "normal", maxWidth: 240 }}>
              Open Graph (OG) is a standard that controls how your page appears when shared on
              Facebook, LinkedIn, Twitter/X, and other social platforms
            </span>
          }
          position="right"
          delay={200}
        >
          <button
            type="button"
            aria-label="About Open Graph metadata"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 0 0 4px",
              color: "var(--aqb-text-muted)",
              display: "inline-flex",
              verticalAlign: "middle",
              lineHeight: 0,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </Tooltip>
        <span className="pg-social__section-sub">Open Graph metadata</span>
      </div>

      {/* ── LIVE SOCIAL CARD PREVIEW ─────────────────────────────────────── */}
      <div
        className="pg-social__preview"
        aria-label="Social share card preview (Facebook / LinkedIn 1200×630)"
      >
        {s.ogImageUrl ? (
          <img src={s.ogImageUrl} className="pg-social__preview-img" alt="OG preview" />
        ) : (
          <div className="pg-social__preview-img-placeholder">No image — upload one below</div>
        )}
        <div className="pg-social__preview-body">
          <div className="pg-social__preview-domain">yourdomain.com</div>
          <div
            className={`pg-social__preview-title${isFallbackTitle ? " pg-social__preview--fallback" : ""}`}
          >
            {displayTitle}
            {isFallbackTitle && <span className="pg-social__fallback-badge">using SEO title</span>}
          </div>
          <div
            className={`pg-social__preview-desc${isFallbackDesc ? " pg-social__preview--fallback" : ""}`}
          >
            {displayDesc || "No description"}
            {isFallbackDesc && s.seoDesc && (
              <span className="pg-social__fallback-badge">using SEO description</span>
            )}
          </div>
        </div>
      </div>
      <div className="pg-social__preview-platform">Preview: Facebook / LinkedIn (1200×630)</div>

      {/* ── OG IMAGE ─────────────────────────────────────────────────────── */}
      <div className="pg-social__field">
        <label className="pg-social__label">Social Share Image</label>
        <div className="pg-social__hint">Recommended: 1200 × 630px (JPG or PNG)</div>
        {s.ogImageUrl ? (
          <div className="pg-social__img-uploaded">
            <img src={s.ogImageUrl} className="pg-social__img-thumb" alt="OG image" />
            <button
              className="pg-social__img-remove"
              onClick={() => s.setOgImageUrl(null)}
              aria-label="Remove social image"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="pg-social__upload-zone" aria-label="Upload social share image">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="pg-social__file-input"
              onChange={handleFileChange}
            />
            <span>Upload image or drag &amp; drop</span>
          </label>
        )}
      </div>

      {/* ── OG TITLE ─────────────────────────────────────────────────────── */}
      <div className="pg-social__field">
        <div className="pg-social__field-header">
          <label className="pg-social__label" htmlFor="og-title">
            Social Title
          </label>
          <span
            className={`pg-social__char-counter${s.ogTitle.length >= 90 ? " pg-social__char-counter--warn" : ""}`}
          >
            {s.ogTitle.length}/95
          </span>
        </div>
        <input
          id="og-title"
          className="pg-social__input"
          value={s.ogTitle}
          onChange={(e) => s.setOgTitle(e.target.value.slice(0, 95))}
          placeholder={s.seoTitle ? `Using SEO title: "${s.seoTitle}"` : "Social share title..."}
          maxLength={95}
        />
      </div>

      {/* ── OG DESC ──────────────────────────────────────────────────────── */}
      <div className="pg-social__field">
        <div className="pg-social__field-header">
          <label className="pg-social__label" htmlFor="og-desc">
            Social Description
          </label>
          <span
            className={`pg-social__char-counter${s.ogDesc.length >= 190 ? " pg-social__char-counter--warn" : ""}`}
          >
            {s.ogDesc.length}/200
          </span>
        </div>
        <textarea
          id="og-desc"
          className="pg-social__textarea"
          rows={3}
          value={s.ogDesc}
          onChange={(e) => s.setOgDesc(e.target.value.slice(0, 200))}
          placeholder={
            s.seoDesc
              ? `Using SEO description: "${s.seoDesc.slice(0, 40)}…"`
              : "Social share description..."
          }
          maxLength={200}
        />
        <div className="pg-social__hint">
          If left blank, your SEO description will be used as fallback.
        </div>
      </div>
    </div>
  );
};
