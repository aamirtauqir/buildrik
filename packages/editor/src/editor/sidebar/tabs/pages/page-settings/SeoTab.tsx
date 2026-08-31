/**
 * SeoTab — Pure form renderer. No state. No logic.
 * All state via UsePageSettingsReturn (s prop).
 *
 * Order: Google Preview → SEO Score → Title → Description → Slug
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { generateContent } from "@/shared/utils/openai";
import type { PageItem } from "../types";
import type { UsePageSettingsReturn } from "./usePageSettings";
import { BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS, BK_LABEL_CLASS, Button, HelperText, Label, Textarea, TextInput, Tooltip } from "@/editor/chrome-ui";
import { isPlaceholderSlug } from "../utils/seoScore";

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

const UI = "tw:[font-family:var(--bk-font-ui)]";
const MONO = "tw:[font-family:var(--bk-font-mono)]";
const CARD = "tw:bg-[var(--bk-bg-subtle)] tw:border tw:border-[var(--bk-gray-200)] tw:rounded";
const BANNER = "tw:bg-[var(--bk-warning-tint)] tw:border tw:border-[var(--bk-warning-text)] tw:rounded tw:text-[var(--bk-warning)]";
const FIELD = "tw:flex tw:flex-col tw:gap-1.5";
const FIELD_HEAD = "tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2";
const COUNTER = `tw:text-[length:var(--bk-text-11)] tw:font-medium ${MONO}`;
const GHOST_BTN = "tw:border-transparent tw:bg-transparent";

export const SeoTab: React.FC<Props> = ({ s, page }) => {
  const domain = s.domain ?? "yoursite.com";
  const range = titleRange(s.seoTitle);
  const [aiBusy, setAiBusy] = React.useState(false);

  // Generate an SEO title via the AI service (was a dead TODO handler).
  const suggestTitle = React.useCallback(async () => {
    if (aiBusy) return;
    setAiBusy(true);
    try {
      const context = [page.name, s.seoDesc].filter(Boolean).join(" — ");
      const prompt = `Write one concise, compelling SEO page title (max 60 characters, no quotes) for this page: ${context || "a web page"}.`;
      const title = await generateContent(prompt, "headline", "professional");
      const clean = title.replace(/^["']|["']$/g, "").trim().slice(0, 60);
      if (clean) s.setSeoTitle(clean);
    } catch {
      // AI unavailable — leave the field for manual entry.
    } finally {
      setAiBusy(false);
    }
  }, [aiBusy, page.name, s]);

  return (
    <div className="tw:flex tw:flex-col tw:gap-4">
      {/* ── 1. GOOGLE PREVIEW — TOP ────────────────────────────────────── */}
      <div className={`tw:text-[11px] tw:font-medium tw:text-[var(--bk-ink-muted)] tw:uppercase tw:tracking-[0.04em] ${UI}`}>
        How your page looks in Google Search
      </div>
      {/* Google preview — prototype .gpreview */}
      <div className={`tw:p-3.5 ${CARD}`}>
        <div className={`tw:text-[length:var(--bk-text-11)] tw:font-medium tw:text-[var(--bk-ink-soft)] ${MONO}`}>
          {s.domain ?? "yoursite.com"} › {page.slug?.replace(/^\//, "") || page.id}
        </div>
        <div className={`tw:mt-1 tw:mb-0.5 tw:text-base tw:font-medium tw:text-[var(--bk-accent-text)] ${UI}`}>
          {s.seoTitle || page.name}
        </div>
        <div
          className={`tw:text-[length:var(--bk-text-13)] tw:leading-snug ${UI} ${
            s.seoDesc ? "tw:text-[var(--bk-ink)]" : "tw:text-[var(--bk-ink-muted)] tw:italic"
          }`}
        >
          {s.seoDesc || "No description — add one below to improve ranking"}
        </div>
      </div>
      {/* ── 2. SEO SCORE ────────────────────────────────────────────────── */}
      {!s.allowIndex ? (
        <div className={`tw:px-3 tw:py-2.5 tw:text-xs ${UI} ${BANNER}`} role="alert">
          <div>
            <strong className="tw:text-[var(--bk-ink)]">noIndex is ON</strong> — search engines won&apos;t index this page regardless of your
            SEO settings.
            <Button
              color="light"
              size="xs"
              type="button"
              onClick={() => s.setAllowIndex(true)}
              className={`tw:ml-1.5 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-accent-text)] tw:hover:text-[var(--bk-accent-hover)] ${GHOST_BTN} ${UI}`}
            >
              Turn indexing on →
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Score row + checks grid — prototype .seo-score-row + .seo-checks */}
          <div className={`tw:flex tw:items-center tw:gap-3.5 tw:p-3 ${CARD}`}>
            <div
              className={`tw:text-[28px] tw:font-medium tw:tabular-nums tw:min-w-12 ${MONO} ${
                s.seoScore >= 80 ? "tw:text-[var(--bk-success)]" : "tw:text-[var(--bk-warning)]"
              }`}
            >
              {s.seoScore}
            </div>
            <div className="tw:flex-1 tw:min-w-0">
              <div className={`tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-ink-soft)] ${UI}`}>
                {s.seoScore >= 80 ? "Looks good" : "Needs work"}
              </div>
              <div className="tw:grid tw:grid-cols-2 tw:gap-x-2.5 tw:gap-y-1 tw:mt-2">
                {[
                  // Point labels mirror calculateSeoScore's real max weights:
                  // title 20 (+10 at ≥30 chars) = 30; slug 20 (+10 non-empty) = 30;
                  // desc 30 (+10 at ≥100 chars) = 40; indexing is an all-or-nothing
                  // gate (off → whole score 0), not an additive component.
                  { label: "Page title", ok: s.seoChecks.titleSet, pts: "+30 pts" },
                  { label: "Meta description", ok: s.seoChecks.descSet, pts: "+40 pts" },
                  { label: "Clean URL slug", ok: s.seoChecks.slugClean, pts: "+30 pts" },
                  { label: "Allow indexing", ok: s.seoChecks.indexingOn, pts: "Required" },
                ].map((c) => (
                  <div
                    key={c.label}
                    className={`tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] ${UI} ${
                      c.ok ? "tw:text-[var(--bk-ink)]" : "tw:text-[var(--bk-ink-muted)]"
                    }`}
                  >
                    <span
                      className={`tw:size-1.5 tw:rounded-full tw:flex-none ${
                        c.ok ? "tw:bg-[var(--bk-success)]" : "tw:bg-[var(--bk-gray-400)]"
                      }`}
                    />
                    <span>{c.label}</span>
                    <span className={`tw:ml-auto tw:text-[length:var(--bk-text-11)] tw:font-medium tw:text-[var(--bk-ink-muted)] ${MONO}`}>{c.pts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reach 80+ banner — shown when score < 80 and indexing is on.
              ONE clause. A first version chained the slug reason on with a
              second em-dash and the box became a two-line run-on sentence in a
              260px drawer — a wall, not advice. Read it on screen and it was
              obvious. Per-item guidance belongs beside the control that fixes
              the item, not stacked here; the slug's lives under the slug
              field. */}
          {s.seoScore < 80 && s.allowIndex && (
            <div className={`tw:px-2.5 tw:py-2 tw:text-[length:var(--bk-text-12)] ${UI} ${BANNER}`} role="note">
              Reach 80+ before publishing{s.seoChecks.descSet ? "" : " — add a meta description (up to +40 pts)"}
            </div>
          )}
        </>
      )}
      {/* ── 3. TITLE ────────────────────────────────────────────────────── */}
      <div className={FIELD}>
        <div className={FIELD_HEAD}>
          <Label htmlFor="seo-title" className={BK_LABEL_CLASS}>Title</Label>
          <span
            className={`${COUNTER} ${
              range === "ok" || range === "ideal"
                ? "tw:text-[var(--bk-success)]"
                : range === "short"
                  ? "tw:text-[var(--bk-warning)]"
                  : "tw:text-[var(--bk-error)]"
            }`}
          >
            {s.seoTitle.length}/60{rangeLabel[range]}
          </span>
        </div>
        {s.seoTitle.length < 10 && (
          <Button
            color="light"
            size="xs"
            type="button"
            aria-label="Suggest SEO title"
            disabled={aiBusy}
            onClick={suggestTitle}
            aria-busy={aiBusy || undefined}
            className={`tw:self-start tw:inline-flex tw:items-center tw:gap-1 tw:px-2 tw:py-[3px] tw:border tw:border-[var(--bk-accent)] tw:rounded-full tw:bg-blue-50 tw:text-[var(--bk-accent-text)] tw:hover:bg-[var(--bk-accent-subtle)] tw:text-[length:var(--bk-text-11)] tw:font-medium ${UI}`}
          >
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
            Write with AI
          </Button>
        )}
        <TextInput
          id="seo-title"
          value={s.seoTitle}
          onChange={(e) => s.setSeoTitle(e.target.value.slice(0, 60))}
          maxLength={60}
          aria-describedby="seo-title-hint"
        />
        <HelperText className={BK_HELPER_CLASS}>Aim for 50–60 characters for best Google ranking</HelperText>
      </div>
      {/* ── 4. META DESCRIPTION ─────────────────────────────────────────── */}
      <div className={FIELD}>
        <div className={FIELD_HEAD}>
          {/* label + info icon in a flex row — button must NOT be inside <label> (HTML spec) */}
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <Label htmlFor="seo-desc" className={BK_LABEL_CLASS}>Meta Description</Label>
            <Tooltip
              content="A short summary of your page shown in Google search results (keep under 160 characters)"
              placement="bottom"
              arrow={false}
              className="tw:max-w-[280px] tw:whitespace-normal"
            >
              <Button
                color="light"
                size="xs"
                type="button"
                aria-label="About Meta Description"
                className={`tw:p-0.5 tw:inline-flex tw:leading-none tw:text-[var(--bk-ink-muted)] tw:hover:text-[var(--bk-ink)] ${GHOST_BTN}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </Button>
            </Tooltip>
          </div>
          <span
            className={`${COUNTER} ${
              s.seoDesc.length > 160
                ? "tw:text-[var(--bk-error)]"
                : s.seoDesc.length > 50
                  ? "tw:text-[var(--bk-success)]"
                  : "tw:text-[var(--bk-ink-muted)]"
            }`}
          >
            {s.seoDesc.length}/160
          </span>
        </div>
        <Textarea
          className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
          id="seo-desc"
          rows={3}
          value={s.seoDesc}
          onChange={(e) => s.setSeoDesc(e.target.value.slice(0, 160))}
          placeholder='E.g. "We help small businesses build professional websites. Start free today."'
          aria-describedby="seo-desc-hint"
        />
        <HelperText className={BK_HELPER_CLASS}>Briefly describe this page (150–160 chars). Appears in Google results below your title.</HelperText>
      </div>
      {/* ── 5. URL SLUG ─────────────────────────────────────────────────── */}
      <div className={FIELD}>
        <Label htmlFor="seo-slug" className={BK_LABEL_CLASS}>URL Slug</Label>
        <div className="tw:flex tw:items-stretch">
          <span
            className={`tw:inline-flex tw:items-center tw:px-2 tw:border tw:border-r-0 tw:border-[var(--bk-gray-200)] tw:rounded-l tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-soft)] tw:text-[11px] tw:font-medium ${MONO}`}
          >
            {domain}/
          </span>
          {/* The input's own border-radius/type face live on theme.field.input,
              which a caller theme would REPLACE leaf-wise (losing the token
              colours) — so reach the real <input> with a descendant variant. */}
          <div className={`tw:flex-1 tw:min-w-0 tw:[&_input]:rounded-l-none tw:[&_input]:text-[11.5px] tw:[&_input]:[font-family:var(--bk-font-mono)]`}>
            <TextInput
              id="seo-slug"
              value={s.slug}
              onChange={(e) => s.setSlug(e.target.value)}
              aria-describedby="seo-slug-hint"
              aria-invalid={!!s.slugError}
            />
          </div>
        </div>
        {/* Slug destructive warning — shown when slug changes on a live page */}
        {s.slug !== page.slug && page.status === "live" && !s.slugError && (
          <div className={`tw:flex tw:gap-2 tw:px-2.5 tw:py-2 tw:text-[length:var(--bk-text-12)] ${UI} ${BANNER}`} role="alert">
            <svg className="tw:flex-none tw:mt-px" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        {/* Three states, in the order they matter: a rejected slug, a slug the
            app generated for you, then the format rule. The middle one exists
            because "Clean URL slug" goes grey on `page-4` — lowercase,
            hyphenated, perfectly valid — and nothing said why. It says so here,
            beside the field that fixes it.

            It describes the URL and does NOT claim who wrote it. The first
            wording said "is auto-generated", which is a statement about
            provenance this code cannot check: `page-404` may well have been
            typed on purpose. The SCORE still applies — /page-404 is a weak URL
            for search whoever chose it, and scoring by provenance would give
            one URL two different scores — but the COPY must not assert a fact
            it does not have. Codex, whole-session review. */}
        {s.slugError ? (
          <HelperText color="red" className={BK_HELPER_ERROR_CLASS}>{s.slugError}</HelperText>
        ) : isPlaceholderSlug(s.slug) ? (
          <HelperText className={BK_HELPER_CLASS}>
            “{s.slug}” is a numbered URL — a descriptive slug ranks better (+10 pts)
          </HelperText>
        ) : (
          <HelperText className={BK_HELPER_CLASS}>Lowercase letters, numbers, and hyphens only — auto-formatted as you type</HelperText>
        )}
      </div>
    </div>
  );
};

SeoTab.displayName = "SeoTab";
