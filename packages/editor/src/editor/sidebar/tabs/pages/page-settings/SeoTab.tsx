/**
 * SeoTab — Pure form renderer. No state. No logic.
 * All state via UsePageSettingsReturn (s prop).
 *
 * Order: Google Preview → SEO Score → Title → Description → Slug → the
 * redirect offer for a saved slug change (Clone 3519:19920's door).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { generateContent } from "@/shared/utils/openai";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import type { PageItem } from "../types";
import type { UsePageSettingsReturn } from "./usePageSettings";
import { BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS, BK_LABEL_CLASS, Button, HelperText, Label, Select, Textarea, TextInput } from "@/editor/chrome-ui";
import { isPlaceholderSlug } from "../utils/seoScore";

interface Props {
  s: UsePageSettingsReturn;
  page: PageItem;
  /** The redirect offer's door into Settings › Redirects goes through the composer. */
  composer: Composer | null;
  /** Opened by a rename's "Update URL" (G2-076): the offer measures from here. */
  previousSlug?: string;
  /** 6887:73809 "Site SEO defaults ›" → Settings › SEO defaults (the drawer
   *  guards unsaved edits first). */
  onOpenSiteDefaults?: () => void;
}

/** The public path a page answers on. The home page is `/` whatever its slug
 *  says (SitemapGenerator, the exporter), so a home-page slug edit moves no URL. */
function publicPath(page: PageItem, slug: string): string {
  return page.isHome ? "/" : `/${slug}`;
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
/* Density-32 buttons: flowbite `size="xs"` supplies the h-8, these the rest. */
const BTN_32 = "tw:rounded-[var(--bk-radius-md)] tw:text-[length:var(--bk-text-13)] tw:font-medium tw:focus:ring-0 tw:focus:[box-shadow:var(--bk-shadow-focus)]";
const BTN_SECONDARY = `${BTN_32} tw:border-transparent tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-200)]`;

export const SeoTab: React.FC<Props> = ({ s, page, composer, previousSlug, onOpenSiteDefaults }) => {
  const siteName = composer?.getProjectMetadata?.()?.name;
  const domain = s.domain ?? "yoursite.com";
  const range = titleRange(s.seoTitle);
  const [aiBusy, setAiBusy] = React.useState(false);

  /* The redirect offer (Clone 3519:19920's door). `page.slug` is the SAVED
     slug — the row re-syncs from the engine after updatePage — so a change of
     it under the same page id is a slug change that has landed. Measured from
     the slug the tab OPENED on rather than the previous save: autosave fires
     at every 500ms pause, and a slug typed in two pauses would otherwise offer
     a redirect from the half-typed one. A new page id resets the baseline
     (adjust-state-during-render — no effect tick with a stale baseline). */
  const [opened, setOpened] = React.useState({ id: page.id, slug: previousSlug ?? page.slug });
  if (opened.id !== page.id) setOpened({ id: page.id, slug: previousSlug ?? page.slug });
  const [answeredChange, setAnsweredChange] = React.useState<string | null>(null);

  const from = publicPath(page, opened.slug);
  const to = publicPath(page, page.slug);
  const change = opened.slug && page.slug && from !== to ? `${from} → ${to}` : null;
  const redirectOffer = change !== null && change !== answeredChange;
  /* Opened by "Update URL": the offer is why the sheet opened, so bring it
     into view (it sits under the slug field, below the fold). */
  const offerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (previousSlug) offerRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [previousSlug]);

  /* One emit: StudioPanels hears it (this panel is about to be unmounted
     under the Settings fullpage), switches the tab and hands the draft down. */
  const addRedirect = () => {
    setAnsweredChange(change);
    composer?.emit(EVENTS.UI_SETTINGS_OPEN, {
      screen: "redirects",
      repair: { pageId: page.id, pageName: page.name, from, to },
    });
  };

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
      {/* ── 5. URL SLUG ─────────────────────────────────────────────────── */}
      <div className={FIELD} data-testid="seo-field-slug">
        <Label htmlFor="seo-slug" className={BK_LABEL_CLASS} data-testid="seo-label-slug">URL slug</Label>
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
              sizing="sm"
              value={s.slug}
              onChange={(e) => s.setSlug(e.target.value)}
              aria-describedby="seo-slug-hint"
              aria-invalid={!!s.slugError}
            />
          </div>
        </div>
        {/* Slug destructive warning — shown when the slug changes on a site
            that is actually reachable. Was gated on `page.status === "live"`,
            i.e. `settings.visibility ?? "draft"`, a per-page field nobody sets
            unless they open the Advanced tab — so it never fired on a normal
            page and the warning was effectively dead code. The rejected
            alternative was to warn whenever the field is unset, which would
            fire on brand-new sites where "this will break existing links" is
            false; a warning that cries wolf is worse than none. */}
        {s.slug !== page.slug && !!s.publishedUrl && !s.slugError && (
          <div className={`tw:flex tw:gap-2 tw:px-2.5 tw:py-2 tw:text-[length:var(--bk-text-12)] ${UI} ${BANNER}`} role="alert">
            <svg className="tw:flex-none tw:mt-px" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              Changing this URL will break existing links, bookmarks, and search engine results
              for this page. You can add a redirect once it saves.
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
        ) : null}
        {/* Clone 3519:19920 — the saved slug change offers its redirect here,
            beside the field that made it. One text node for the sentence.
            `Add redirect` leaves for Settings › Redirects with the draft
            prefilled; `Not now` answers THIS change and it does not come back
            for it — a further change is a new offer. */}
        {redirectOffer && (
          <div
            ref={offerRef}
            role="status"
            data-testid="page-seo-redirect-offer"
            className={`tw:mt-1 tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:py-2.5 ${CARD} ${UI}`}
          >
            <span className="tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink)]">
              {`URL changed from ${from} to ${to}. Add a redirect so old links keep working?`}
            </span>
            <div className="tw:flex tw:items-center tw:gap-2">
              <Button
                type="button"
                size="xs"
                variant="secondary"
                className={BTN_SECONDARY}
                data-testid="page-seo-redirect-add"
                onClick={addRedirect}
              >
                Add redirect
              </Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className={BTN_32}
                data-testid="page-seo-redirect-later"
                onClick={() => setAnsweredChange(change)}
              >
                Not now
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* ── 3. TITLE ────────────────────────────────────────────────────── */}
      <div className={FIELD} data-testid="seo-field-title">
        <div className={FIELD_HEAD}>
          <Label htmlFor="seo-title" className={BK_LABEL_CLASS} data-testid="seo-label-title">Meta title · page override</Label>
          {s.seoTitle.length < 10 && (
            <Button
              color="light"
              size="xs"
              type="button"
              aria-label="Suggest SEO title"
              disabled={aiBusy}
              onClick={suggestTitle}
              aria-busy={aiBusy || undefined}
              className={`tw:ml-auto tw:inline-flex tw:items-center tw:gap-1 tw:h-auto tw:min-h-0 tw:p-0 tw:border-0 tw:bg-transparent tw:text-[var(--bk-accent-text)] tw:hover:bg-transparent tw:hover:underline tw:text-[length:var(--bk-text-11)] tw:font-medium ${UI}`}
            >
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              Write with AI
            </Button>
          )}
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
        <TextInput
          id="seo-title"
          sizing="sm"
          data-testid="seo-input-title"
          value={s.seoTitle}
          onChange={(e) => s.setSeoTitle(e.target.value.slice(0, 60))}
          maxLength={60}
          aria-describedby="seo-title-hint"
        />
      </div>
      {/* ── 4. META DESCRIPTION ─────────────────────────────────────────── */}
      <div className={FIELD} data-testid="seo-field-desc">
        <div className={FIELD_HEAD}>
          {/* label + info icon in a flex row — button must NOT be inside <label> (HTML spec) */}
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <Label htmlFor="seo-desc" className={BK_LABEL_CLASS} data-testid="seo-label-desc">Meta description</Label>
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
          rows={1}
          value={s.seoDesc}
          onChange={(e) => s.setSeoDesc(e.target.value.slice(0, 160))}
          placeholder="One sentence about this page"
          aria-describedby="seo-desc-hint"
        />
      </div>
      {/* 6887:73809 "Search indexing" — the same switch as Advanced's
          indexing toggle (one state, two doors). */}
      <div className={FIELD} data-testid="seo-field-indexing">
        <Label htmlFor="seo-indexing" className={BK_LABEL_CLASS}>Search indexing</Label>
        <Select
          id="seo-indexing"
          sizing="sm"
          data-testid="seo-input-indexing"
          value={s.allowIndex ? "index" : "noindex"}
          onChange={(e) => s.setAllowIndex(e.target.value === "index")}
        >
          <option value="index">Indexed · shown in search</option>
          <option value="noindex">Hidden · not in search</option>
        </Select>
        <p className={`tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-soft)] ${UI}`} data-testid="seo-override-note">
          {siteName ? `${siteName} · ` : ""}These overrides affect {page.name} only.
        </p>
        {onOpenSiteDefaults && (
          <Button
            variant="link"
            data-testid="seo-site-defaults"
            className={`tw:self-start tw:h-auto tw:min-h-0 tw:p-0 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-accent-text)] ${UI}`}
            onClick={onOpenSiteDefaults}
          >
            Site SEO defaults ›
          </Button>
        )}
      </div>
      {/* Kept under the board's form (owner: never silently remove a
          capability — designer notes): the Google preview and the score. */}
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
              className={`tw:text-[24px] tw:font-medium tw:tabular-nums tw:min-w-12 ${MONO} ${
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
    </div>
  );
};

SeoTab.displayName = "SeoTab";
