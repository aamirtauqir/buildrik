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
    <div className="bd-pg-seo">
      {/* ── 1. GOOGLE PREVIEW — TOP ────────────────────────────────────── */}
      <div className="bd-pg-seo-section-label">How your page looks in Google Search</div>
      {/* Google preview — prototype .gpreview */}
      <div className="bd-pg-seo-gp">
        <div className="bd-pg-seo-gp-domain">
          {s.domain ?? "yoursite.aquibra.io"} › {page.slug?.replace(/^\//, "") || page.id}
        </div>
        <div className="bd-pg-seo-gp-title">{s.seoTitle || page.name}</div>
        <div className={`bd-pg-seo-gp-desc${!s.seoDesc ? " bd-pg-seo-gp-desc--missing" : ""}`}>
          {s.seoDesc || "No description — add one below to improve ranking"}
        </div>
      </div>

      {/* ── 2. SEO SCORE ────────────────────────────────────────────────── */}
      {!s.allowIndex ? (
        <div className="bd-pg-seo-noindex-warning" role="alert">
          <div className="bd-pg-seo-noindex-msg">
            <strong>noIndex is ON</strong> — search engines won't index this page regardless of your
            SEO settings.
            <button className="bd-pg-seo-noindex-fix" onClick={() => s.setAllowIndex(true)}>
              Turn indexing on →
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Score row + checks grid — prototype .seo-score-row + .seo-checks */}
          <div className="bd-pg-seo-score-row">
            <div className={`bd-pg-seo-score-num${s.seoScore >= 80 ? " bd-pg-seo-score-num--ok" : ""}`}>
              {s.seoScore}
            </div>
            <div className="bd-pg-seo-score-meta">
              <div className="bd-pg-seo-score-label">
                {s.seoScore >= 80 ? "Looks good" : "Needs work"}
              </div>
              <div className="bd-pg-seo-checks">
                <div className={`bd-pg-seo-check${s.seoChecks.titleSet ? " bd-pg-seo-check--ok" : ""}`}>
                  <span>Page title</span>
                  <span className="bd-pg-seo-check-pts">+20 pts</span>
                </div>
                <div className={`bd-pg-seo-check${s.seoChecks.descSet ? " bd-pg-seo-check--ok" : ""}`}>
                  <span>Meta description</span>
                  <span className="bd-pg-seo-check-pts">+30 pts</span>
                </div>
                <div className={`bd-pg-seo-check${s.seoChecks.slugClean ? " bd-pg-seo-check--ok" : ""}`}>
                  <span>Clean URL slug</span>
                  <span className="bd-pg-seo-check-pts">+10 pts</span>
                </div>
                <div className={`bd-pg-seo-check${s.seoChecks.indexingOn ? " bd-pg-seo-check--ok" : ""}`}>
                  <span>Allow indexing</span>
                  <span className="bd-pg-seo-check-pts">+40 pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reach 80+ banner — shown when score < 80 and indexing is on */}
          {s.seoScore < 80 && s.allowIndex && (
            <div className="bd-pg-seo-banner-warn" role="note">
              Reach 80+ before publishing{s.seoChecks.descSet ? "" : " — add a meta description (+30 pts)"}
            </div>
          )}
        </>
      )}

      {/* ── 3. TITLE ────────────────────────────────────────────────────── */}
      <div className="bd-pg-seo-field">
        <div className="bd-pg-seo-field-header">
          <label className="bd-pg-seo-label" htmlFor="seo-title">
            Title
          </label>
          <span className={`bd-pg-seo-counter bd-pg-seo-counter--${range}`}>
            {s.seoTitle.length}/60{rangeLabel[range]}
          </span>
        </div>
        {s.seoTitle.length < 10 && (
          <button type="button" className="bd-pg-seo-ai-chip" aria-label="Suggest SEO title">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
            Write with AI
          </button>
        )}
        <input
          id="seo-title"
          className="bd-pg-seo-input"
          value={s.seoTitle}
          onChange={(e) => s.setSeoTitle(e.target.value.slice(0, 80))}
          maxLength={80}
          aria-describedby="seo-title-hint"
        />
        <div id="seo-title-hint" className="bd-pg-seo-hint">
          Aim for 50–60 characters for best Google ranking
        </div>
      </div>

      {/* ── 4. META DESCRIPTION ─────────────────────────────────────────── */}
      <div className="bd-pg-seo-field">
        <div className="bd-pg-seo-field-header">
          {/* label + info icon in a flex row — button must NOT be inside <label> (HTML spec) */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <label className="bd-pg-seo-label" htmlFor="seo-desc">
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
            className={`bd-pg-seo-counter ${
              s.seoDesc.length > 160
                ? "bd-pg-seo-counter--long"
                : s.seoDesc.length > 50
                  ? "bd-pg-seo-counter--ideal"
                  : ""
            }`}
          >
            {s.seoDesc.length}/160
          </span>
        </div>
        <textarea
          id="seo-desc"
          className="bd-pg-seo-textarea"
          rows={3}
          value={s.seoDesc}
          onChange={(e) => s.setSeoDesc(e.target.value.slice(0, 200))}
          placeholder='E.g. "We help small businesses build professional websites. Start free today."'
          aria-describedby="seo-desc-hint"
        />
        <div id="seo-desc-hint" className="bd-pg-seo-hint">
          Briefly describe this page (150–160 chars). Appears in Google results below your title.
        </div>
      </div>

      {/* ── 5. URL SLUG ─────────────────────────────────────────────────── */}
      <div className="bd-pg-seo-field">
        <label className="bd-pg-seo-label" htmlFor="seo-slug">
          URL Slug
        </label>
        <div className="bd-pg-seo-slug-wrap">
          <span className="bd-pg-seo-slug-prefix">{domain}/</span>
          <input
            id="seo-slug"
            className={`bd-pg-seo-input bd-pg-seo-input--slug${s.slugError ? " bd-pg-seo-input--error" : ""}`}
            value={s.slug}
            onChange={(e) => s.setSlug(e.target.value)}
            aria-describedby="seo-slug-hint"
            aria-invalid={!!s.slugError}
          />
        </div>
        {/* Slug destructive warning — shown when slug changes on a live page */}
        {s.slug !== page.slug && page.status === "live" && !s.slugError && (
          <div className="bd-pg-seo-slug-warning" role="alert">
            <svg
              className="bd-pg-seo-slug-warning-icon"
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
          <div className="bd-pg-seo-error" role="alert">
            {s.slugError}
          </div>
        ) : (
          <div id="seo-slug-hint" className="bd-pg-seo-hint">
            Lowercase letters, numbers, and hyphens only — auto-formatted as you type
          </div>
        )}
      </div>
    </div>
  );
};
