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
import { BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS, BK_LABEL_CLASS, Button, HelperText, Label, Modal, Select, Textarea, TextInput } from "@/editor/chrome-ui";
import { isPlaceholderSlug } from "../utils/seoScore";
import { resolvePageDescription } from "@/engine/export/SEOInjector";
import { pageFileNames } from "@/engine/export/pageFiles";
import { pageCanonicalUrl } from "@buildrik/shared/seo/urls";

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
 *  says (the exporter), so a home-page slug edit moves no URL. */
function publicPath(page: PageItem, slug: string): string {
  return page.isHome ? "/" : `/${slug}`;
}

const UI = "tw:[font-family:var(--bk-font-ui)]";
const CARD = "tw:bg-[var(--bk-bg-subtle)] tw:border tw:border-[var(--bk-gray-200)] tw:rounded";
const BANNER = "tw:bg-[var(--bk-warning-tint)] tw:border tw:border-[var(--bk-warning-text)] tw:rounded tw:text-[var(--bk-warning)]";
const FIELD = "tw:flex tw:flex-col tw:gap-1.5";
/* Board 63:15939: 13/600 ink labels; blue text links set in from the edge. */
const LABEL_TEXT = "tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]";
const LINK = "tw:self-start tw:h-7 tw:min-h-0 tw:px-6 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:text-[var(--bk-accent-text)]";
const FIELD_HEAD = "tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2";
/* Density-32 buttons: flowbite `size="xs"` supplies the h-8, these the rest. */
const BTN_32 = "tw:rounded-[var(--bk-radius-md)] tw:text-[length:var(--bk-text-13)] tw:font-medium tw:focus:ring-0 tw:focus:[box-shadow:var(--bk-shadow-focus)]";
const BTN_SECONDARY = `${BTN_32} tw:border-transparent tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-200)]`;

/** The first heading and the first run of body copy on a page — what the
 *  page is actually about, for the AI title prompt. */
function pageCopySample(composer: Composer | null, pageId: string): string[] {
  const rootId = composer?.elements?.getAllPages?.().find((p) => p.id === pageId)?.root?.id;
  const root = rootId ? composer?.elements?.getElement?.(rootId) : null;
  if (!root) return [];
  let heading: string | undefined;
  let body: string | undefined;
  const queue = [...root.getChildren()];
  while (queue.length > 0 && !(heading && body)) {
    const el = queue.shift();
    if (!el) break;
    const text = String(el.getContent?.() ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    if (text && !heading && el.getType() === "heading") heading = text.slice(0, 120);
    else if (text && !body && el.getType() !== "heading" && el.getType() !== "button") body = text.slice(0, 240);
    queue.push(...el.getChildren());
  }
  return [heading, body].filter((t): t is string => Boolean(t));
}

/** "Write with AI"'s prompt: the site, the page and the page's own copy
 *  (L5-017 — it carried the page name alone, inside a generic "headline"
 *  template, and a local bakery got web-builder marketing back). */
function seoTitlePrompt(siteName: string | undefined, pageName: string, description: string, copy: string[]): string {
  const lines = [
    "Write one SEO page title for a web page. At most 60 characters. Plain text, no quotes.",
    siteName ? `Website: ${siteName}` : null,
    `Page: ${pageName}`,
    description ? `Page description: ${description}` : null,
    ...copy.map((c) => `On the page: ${c}`),
    "Describe what this page offers; do not invent claims the page does not make.",
  ];
  return lines.filter(Boolean).join("\n");
}

/** An AI title cut to `max` characters at the last whole word (L5-018: a
 *  hard slice ended "…Website B"). Quotes the model adds are dropped. */
function trimTitle(raw: string, max = 60): string {
  const clean = raw.replace(/^["'\s]+|["'\s]+$/g, "").replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : clean.slice(0, max)).replace(/[\s,;:–—-]+$/, "");
}

export const SeoTab: React.FC<Props> = ({ s, page, composer, previousSlug, onOpenSiteDefaults }) => {
  const siteName = composer?.getProjectMetadata?.()?.name;
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const domain = s.domain ?? "yoursite.com";
  /* An empty field ships the inherited title, so the counter measures that. */
  const countedTitle = s.seoTitle || s.inheritedTitle;
  /* The preview shows what ships: the exporter's own precedence, so a page
     with no title or description of its own previews the site defaults it
     inherits (owner decision Q4), not an empty slot. */
  const siteSeo = composer?.getProjectSettings?.()?.seo;
  const previewTitle = s.effectiveTitle;
  const previewDesc = resolvePageDescription({ metaDescription: s.seoDesc }, undefined, siteSeo);
  /* The URL the deploy serves for this page: the file the export writes for it
     (`about.html`, numbered on a slug clash, index.html for home) through the
     same builder as the canonical and sitemap. It read `/<slug>` while the
     deploy served `/<slug>.html` (no cleanUrls yet). */
  const sitePages = composer?.elements?.getAllPages?.() ?? [];
  const withThis = sitePages.some((p) => p.id === page.id) ? sitePages : [...sitePages, page];
  const servedFile =
    pageFileNames(withThis.map((p) => (p.id === page.id ? { ...p, slug: s.slug } : p))).get(page.id) ?? "index.html";
  const previewUrl = (pageCanonicalUrl(domain, servedFile) ?? "").replace(/^https?:\/\//, "");
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiFailed, setAiFailed] = React.useState(false);

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
  /* L3-005: when another page still answers on the old address, a redirect
     from it would hide that page once published — no offer. */
  const oldPathTaken = sitePages.some((p) => p.id !== page.id && (p.isHome ? "/" : `/${p.slug ?? ""}`) === from);
  const change = opened.slug && page.slug && from !== to && !oldPathTaken ? `${from} → ${to}` : null;
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
    setAiFailed(false);
    try {
      const prompt = seoTitlePrompt(siteName, page.name, s.seoDesc, pageCopySample(composer, page.id));
      const title = await generateContent(prompt, "headline", "professional", { useEnhancedPrompts: false });
      const clean = trimTitle(title);
      if (clean) s.setSeoTitle(clean);
      else setAiFailed(true);
    } catch {
      // The field stays for manual entry; say why nothing arrived.
      setAiFailed(true);
    } finally {
      setAiBusy(false);
    }
  }, [aiBusy, page.name, page.id, s, siteName, composer]);

  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      {/* ── 1. GOOGLE PREVIEW — TOP ────────────────────────────────────── */}
      <div className={`${LABEL_TEXT} ${UI}`} data-testid="seo-preview-label">
        {`Search preview · SEO score ${s.allowIndex ? s.seoScore : 0}`}
      </div>
      {/* Google preview — prototype .gpreview */}
      <div className="tw:flex tw:flex-col tw:gap-1 tw:rounded-md tw:bg-[var(--bk-gray-100)] tw:px-3 tw:py-3">
        <div className={`tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-soft)] ${UI}`} data-testid="seo-preview-url">
          {previewUrl}
        </div>
        <div className={`tw:text-[14px] tw:leading-5 tw:font-medium tw:text-[var(--bk-accent-text)] ${UI}`} data-testid="seo-preview-title">
          {previewTitle}
        </div>
        <div
          className={`tw:text-[length:var(--bk-text-12)] tw:leading-snug ${UI} ${
            previewDesc ? "tw:text-[var(--bk-ink)]" : "tw:text-[var(--bk-ink-muted)] tw:italic"
          }`}
          data-testid="seo-preview-desc"
        >
          {previewDesc || "No description — add one below to improve ranking"}
        </div>
      </div>
      {/* ── 3. TITLE ────────────────────────────────────────────────────── */}
      <div className={FIELD} data-testid="seo-field-title">
        <div className={FIELD_HEAD}>
          <Label htmlFor="seo-title" className={BK_LABEL_CLASS} data-testid="seo-label-title">
            {`SEO title · ${countedTitle.length} / 60 · ${s.seoTitle ? (s.isDirty ? "Unsaved override" : "Page override") : "Site default"}`}
          </Label>
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
            {s.seoTitle.length < 10 ? "Write with AI" : "Regenerate"}
          </Button>
        </div>
        <TextInput
          id="seo-title"
          sizing="sm"
          data-testid="seo-input-title"
          value={s.seoTitle}
          onChange={(e) => s.setSeoTitle(e.target.value.slice(0, 60))}
          maxLength={60}
          placeholder={s.inheritedTitle}
          aria-describedby="seo-title-hint"
        />
        {aiFailed && (
          <HelperText role="alert" className={BK_HELPER_ERROR_CLASS}>
            Couldn&rsquo;t write a title just now. Try again, or type one.
          </HelperText>
        )}
      </div>
      {/* ── 4. META DESCRIPTION ─────────────────────────────────────────── */}
      <div className={FIELD} data-testid="seo-field-desc">
        <Label htmlFor="seo-desc" className={BK_LABEL_CLASS} data-testid="seo-label-desc">Description</Label>
        <Textarea
          className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
          id="seo-desc"
          rows={2}
          value={s.seoDesc}
          onChange={(e) => s.setSeoDesc(e.target.value.slice(0, 160))}
          placeholder="One sentence about this page"
          aria-describedby="seo-desc-hint"
        />
        <span
          className={`tw:text-[length:var(--bk-text-11)] ${UI} ${
            s.seoDesc.length > 160
              ? "tw:text-[var(--bk-error)]"
              : s.seoDesc.length > 50
                ? "tw:text-[var(--bk-success)]"
                : "tw:text-[var(--bk-ink-muted)]"
          }`}
        >
          {`${s.seoDesc.length} / 160`}
        </span>
      </div>
      {/* ── 5. URL SLUG ─────────────────────────────────────────────────── */}
      <div className={FIELD} data-testid="seo-field-slug">
        <Label htmlFor="seo-slug" className={BK_LABEL_CLASS} data-testid="seo-label-slug">Page URL</Label>
        <div className="tw:flex tw:items-stretch">
          {/* Board 63:15939 reads "/about" in one filled field. */}
          <span
            aria-hidden="true"
            className={`tw:inline-flex tw:items-center tw:pl-2.5 tw:rounded-l-md tw:bg-[var(--bk-gray-100)] tw:text-[var(--bk-ink)] tw:text-[13px] ${UI}`}
          >
            /
          </span>
          {/* The input's own border-radius/type face live on theme.field.input,
              which a caller theme would REPLACE leaf-wise (losing the token
              colours) — so reach the real <input> with a descendant variant. */}
          <div className={`tw:flex-1 tw:min-w-0 tw:[&_input]:rounded-l-none tw:[&_input]:pl-0`}>
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
                Later
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Board 63:15939: "Search indexing" with its select on one row (the
          switch lives here; Advanced reads it out), then the two links and
          the scope note. */}
      <div className="tw:flex tw:items-center tw:gap-2" data-testid="seo-field-indexing">
        <Label htmlFor="seo-indexing" className={`${BK_LABEL_CLASS} tw:w-[172px] tw:flex-none`}>Search indexing</Label>
        <div className="tw:w-60">
          <Select
            id="seo-indexing"
            sizing="sm"
            data-testid="seo-input-indexing"
            value={s.allowIndex ? "index" : "noindex"}
            onChange={(e) => s.setAllowIndex(e.target.value === "index")}
          >
            <option value="index">Indexed</option>
            <option value="noindex">Hidden</option>
          </Select>
        </div>
      </div>
      {onOpenSiteDefaults && (
        <Button
          variant="link"
          data-testid="seo-site-defaults"
          className={`${LINK} ${UI}`}
          onClick={onOpenSiteDefaults}
        >
          Site SEO defaults
        </Button>
      )}
      {/* design-2l9 63:18189: a refused save is said here, in the form. */}
      {s.saveState === "error" && (
        <p role="alert" className={`tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-error-text)] ${UI}`} data-testid="pg-drawer-save-error">
          Couldn’t save page settings. Your changes are still here.
        </p>
      )}
      <Button
        variant="link"
        data-testid="seo-score-details"
        aria-haspopup="dialog"
        className={`${LINK} ${UI}`}
        onClick={() => setDetailsOpen(true)}
      >
        SEO score details
      </Button>
      {/* design-2l9 board 65:17860: the score's six parts in their own small
          dialog over Page settings, one "Part: n/max" line each, and "Back to
          SEO" to return. */}
      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        width="sm"
        title={`SEO score · ${page.name} · ${s.seoScore}/100`}
        testId="seo-score-breakdown"
      >
        <div className="tw:flex tw:flex-col tw:items-start">
          {s.seoBreakdown.map((row) => (
            <span key={row.label} className={`tw:text-[13px] tw:leading-5 tw:tabular-nums tw:text-[var(--bk-ink-soft)] ${UI}`}>
              {`${row.label}: ${row.earned}/${row.max}`}
            </span>
          ))}
          <Button
            variant="link"
            data-testid="seo-score-back"
            className={`${LINK} ${UI} tw:mt-3`}
            onClick={() => setDetailsOpen(false)}
          >
            Back to SEO
          </Button>
        </div>
      </Modal>
      <p className={`tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-soft)] ${UI}`} data-testid="seo-override-note">
        These overrides affect this page only. Clear the title to use site defaults.
      </p>
    </div>
  );
};

SeoTab.displayName = "SeoTab";
