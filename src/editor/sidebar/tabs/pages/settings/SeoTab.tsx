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

function scoreColor(score: number): string {
  if (score <= 40) return "#EF4444";
  if (score <= 70) return "#F59E0B";
  return "#22C55E";
}

function scoreLabel(score: number): string {
  if (score <= 40) return "Needs work";
  if (score <= 70) return "Getting there";
  return "Great";
}

export const SeoTab: React.FC<Props> = ({ s, page }) => {
  const domain = s.domain ?? "yourdomain.com";
  const previewSlug = s.slug || page.slug || page.id;
  const range = titleRange(s.seoTitle);

  return (
    <div className="pg-seo">
      {/* ── 1. GOOGLE PREVIEW — TOP ────────────────────────────────────── */}
      <div className="pg-seo__section-label">How your page looks in Google Search</div>
      <div className="pg-seo__google-preview" aria-label="Google search preview">
        <div className="pg-seo__gp-domain">
          {domain} › {previewSlug}
        </div>
        <div className="pg-seo__gp-title">{s.seoTitle || "Untitled page"}</div>
        <div className="pg-seo__gp-desc">
          {s.seoDesc || (
            <span className="pg-seo__gp-missing">
              No description — add one below to improve ranking
            </span>
          )}
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
          <div className="pg-seo__score-row">
            <div
              className="pg-seo__score-badge"
              aria-live="polite"
              aria-label={`SEO Score: ${s.seoScore} out of 100 — ${scoreLabel(s.seoScore)}`}
            >
              <span className="pg-seo__score-num" style={{ color: scoreColor(s.seoScore) }}>{s.seoScore}</span>
              <span className="pg-seo__score-label">{scoreLabel(s.seoScore)}</span>
            </div>
            <div className="pg-seo__score-checks">
              <SeoCheck ok={s.seoChecks.indexingOn} label="Allow indexing" hint="Required" />
              <SeoCheck ok={s.seoChecks.titleSet} label="Page title" hint="+20 pts" />
              <SeoCheck ok={s.seoChecks.descSet} label="Meta description" hint="+30 pts" />
              <SeoCheck ok={s.seoChecks.slugClean} label="Clean URL slug" hint="+20 pts" />
              <SeoCheck ok={s.seoTitle.length >= 30} label="Detailed title (30+ chars)" hint="+10 pts" />
            </div>
          </div>
          {s.seoScore < 80 && (
            <div className="pg-seo__score-tip">
              Reach 80+ before publishing —{" "}
              {!s.seoChecks.descSet
                ? "add a meta description (+30 pts)"
                : !s.seoChecks.titleSet
                  ? "improve your title (+20 pts)"
                  : "add a clean slug (+20 pts)"}
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
          <label className="pg-seo__label" htmlFor="seo-desc">
            Meta Description
            <Tooltip
              content={
                <span style={{ display: "block", whiteSpace: "normal", maxWidth: 240 }}>
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
                  padding: "0 0 0 4px",
                  color: "var(--aqb-text-muted)",
                  display: "inline-flex",
                  verticalAlign: "middle",
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
          </label>
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
            ⚠️ Changing this URL will break existing links, bookmarks, and search engine results for
            this page. Consider setting up a redirect in your hosting settings after saving.
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

const SeoCheck: React.FC<{ ok: boolean; label: string; hint: string }> = ({ ok, label, hint }) => (
  <div className={`pg-seo__check ${ok ? "pg-seo__check--ok" : "pg-seo__check--missing"}`}>
    <span className="pg-seo__check-dot" aria-hidden="true" />
    <span>{label}</span>
    {!ok && <span className="pg-seo__check-hint">{hint}</span>}
  </div>
);
