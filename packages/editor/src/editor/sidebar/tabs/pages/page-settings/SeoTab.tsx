/**
 * SeoTab — Pure form renderer. No state. No logic.
 * All state via UsePageSettingsReturn (s prop).
 *
 * Order: Google Preview → SEO Score → Title → Description → Slug
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

type TitleRange = "short" | "ok" | "ideal" | "long";

function titleRange(title: string): TitleRange {
  if (title.length < 30) return "short";
  if (title.length < 50) return "ok";
  if (title.length <= 60) return "ideal";
  return "long";
}

const rangeLabel: Record<TitleRange, string> = {
  short: " · Too short",
  ok: "",
  ideal: " · Ideal",
  long: " · Too long",
};


export const SeoTab: React.FC<Props> = ({ s, page }) => {
  const domain = s.domain ?? "yoursite.aquibra.io";
  const range = titleRange(s.seoTitle);

  return (
    <div className="pg-seo">
      {/* ── 1. GOOGLE PREVIEW — TOP ────────────────────────────────────── */}
      <div className="pg-seo__section-label">How your page looks in Google Search</div>
      {/* Google preview — prototype .gpreview */}
      <div className="pg-seo__gp">
        <div className="pg-seo__gp-domain">
          {s.domain ?? "yoursite.aquibra.io"} › {page.slug?.replace(/^\//, "") || page.id}
        </div>
        <div className="pg-seo__gp-title">{s.seoTitle || page.name}</div>
        <div className={`pg-seo__gp-desc${!s.seoDesc ? " pg-seo__gp-desc--missing" : ""}`}>
          {s.seoDesc || "No description — add one below to improve ranking"}
        </div>
      </div>

      {/* ── 2. SEO SCORE ────────────────────────────────────────────────── */}
      {!s.allowIndex ? (
        <div className="pg-seo__noindex-warning" role="alert">
          <div className="pg-seo__noindex-msg">
            <strong>noIndex is ON</strong> — search engines won't index this page regardless of your
            SEO settings.
            <button className="pg-seo__noindex-fix" onClick={() => s.setAllowIndex(true)}>
              Turn indexing on →
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Score row + checks grid — prototype .seo-score-row + .seo-checks */}
          <div className="pg-seo__score-row">
            <div className={`pg-seo__score-num${s.seoScore >= 80 ? " pg-seo__score-num--ok" : ""}`}>
              {s.seoScore}
            </div>
            <div className="pg-seo__score-meta">
              <div className="pg-seo__score-label">
                {s.seoScore >= 80 ? "Looks good" : "Needs work"}
              </div>
              <div className="pg-seo__checks">
                <div className={`pg-seo__check${s.seoChecks.titleSet ? " pg-seo__check--ok" : ""}`}>
                  <span>Page title</span>
                  <span className="pg-seo__check-pts">+20 pts</span>
                </div>
                <div className={`pg-seo__check${s.seoChecks.descSet ? " pg-seo__check--ok" : ""}`}>
                  <span>Meta description</span>
                  <span className="pg-seo__check-pts">+30 pts</span>
                </div>
                <div className={`pg-seo__check${s.seoChecks.slugClean ? " pg-seo__check--ok" : ""}`}>
                  <span>Clean URL slug</span>
                  <span className="pg-seo__check-pts">+10 pts</span>
                </div>
                <div className={`pg-seo__check${s.seoChecks.indexingOn ? " pg-seo__check--ok" : ""}`}>
                  <span>Allow indexing</span>
                  <span className="pg-seo__check-pts">+40 pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reach 80+ banner — shown when score < 80 and indexing is on */}
          {s.seoScore < 80 && s.allowIndex && (
            <div className="pg-seo__banner-warn" role="note">
              Reach 80+ before publishing{s.seoChecks.descSet ? "" : " — add a meta description (+30 pts)"}
            </div>
          )}
        </>
      )}

      {/* ── 3. TITLE ────────────────────────────────────────────────────── */}
      <div className="pg-seo__field">
        <div className="pg-seo__field-header">
          <label className="pg-seo__label" htmlFor="seo-title">
            Title
          </label>
          <span className={`pg-seo__counter pg-seo__counter--${range}`}>
            {s.seoTitle.length}/60{rangeLabel[range]}
          </span>
        </div>
        {s.seoTitle.length < 10 && (
          <button type="button" className="pg-seo__ai-chip" aria-label="Suggest SEO title">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
            Write with AI
          </button>
        )}
        <input
          id="seo-title"
          className="pg-seo__input"
          value={s.seoTitle}
          onChange={(e) => s.setSeoTitle(e.target.value.slice(0, 80))}
          maxLength={80}
          aria-describedby="seo-title-hint"
        />
        <div id="seo-title-hint" className="pg-seo__hint">
          Aim for 50–60 characters for best Google ranking
        </div>
      </div>

      {/* ── 4. META DESCRIPTION ─────────────────────────────────────────── */}
      <div className="pg-seo__field">
        <div className="pg-seo__field-header">
          {/* label + info icon in a flex row — button must NOT be inside <label> (HTML spec) */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <label className="pg-seo__label" htmlFor="seo-desc">
              Meta Description
            </label>
            <Tooltip
              content={
                <span style={{ display: "block", whiteSpace: "normal", maxWidth: 244 }}>
                  A short summary of your page shown in Google search results (keep under 160
                  characters)
                </span>
              }
              position="right"
              delay={200}
            >
              <button
                type="button"
                aria-label="About Meta Description"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                  color: "var(--bd-fg-muted)",
                  display: "inline-flex",
                  lineHeight: 0,
                }}
              >
                <svg
                  width="13"
                  height="13"
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
          </div>
          <span
            className={`pg-seo__counter ${
              s.seoDesc.length > 160
                ? "pg-seo__counter--long"
                : s.seoDesc.length > 50
                  ? "pg-seo__counter--ideal"
                  : ""
            }`}
          >
            {s.seoDesc.length}/160
          </span>
        </div>
        <textarea
          id="seo-desc"
          className="pg-seo__textarea"
          rows={3}
          value={s.seoDesc}
          onChange={(e) => s.setSeoDesc(e.target.value.slice(0, 200))}
          placeholder='E.g. "We help small businesses build professional websites. Start free today."'
          aria-describedby="seo-desc-hint"
        />
        <div id="seo-desc-hint" className="pg-seo__hint">
          Briefly describe this page (150–160 chars). Appears in Google results below your title.
        </div>
      </div>

      {/* ── 5. URL SLUG ─────────────────────────────────────────────────── */}
      <div className="pg-seo__field">
        <label className="pg-seo__label" htmlFor="seo-slug">
          URL Slug
        </label>
        <div className="pg-seo__slug-wrap">
          <span className="pg-seo__slug-prefix">{domain}/</span>
          <input
            id="seo-slug"
            className={`pg-seo__input pg-seo__input--slug${s.slugError ? " pg-seo__input--error" : ""}`}
            value={s.slug}
            onChange={(e) => s.setSlug(e.target.value)}
            aria-describedby="seo-slug-hint"
            aria-invalid={!!s.slugError}
          />
        </div>
        {/* Slug destructive warning — shown when slug changes on a live page */}
        {s.slug !== page.slug && page.status === "live" && !s.slugError && (
          <div className="pg-seo__slug-warning" role="alert">
            <svg
              className="pg-seo__slug-warning-icon"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              Changing this URL will break existing links, bookmarks, and search engine results
              for this page. Consider setting up a redirect in your hosting settings after saving.
            </span>
          </div>
        )}
        {s.slugError ? (
          <div className="pg-seo__error" role="alert">
            {s.slugError}
          </div>
        ) : (
          <div id="seo-slug-hint" className="pg-seo__hint">
            Lowercase letters, numbers, and hyphens only — auto-formatted as you type
          </div>
        )}
      </div>
    </div>
  );
};
