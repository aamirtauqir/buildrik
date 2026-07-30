/**
 * SeoTab — Pure form renderer. No state. No logic.
 * All state via UsePageSettingsReturn (s prop).
 *
 * Order: Google Preview → SEO Score → Title → Description → Slug
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Cluster, HelperText, Label, Stack } from "@/editor/ui";
import { generateContent } from "@/shared/utils/openai";
import type { PageItem } from "../types";
import type { UsePageSettingsReturn } from "./usePageSettings";
import { Button, Textarea, TextInput, Tooltip } from "flowbite-react";
import { BK_TEXT_INPUT_THEME } from "@/editor/ui/textInputTheme";

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
    <Stack gap="lg">
      {/* ── 1. GOOGLE PREVIEW — TOP ────────────────────────────────────── */}
      <div style={{ font: "500 11px var(--bk-font-ui)", color: "var(--bk-ink-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        How your page looks in Google Search
      </div>
      {/* Google preview — prototype .gpreview */}
      <div style={{ padding: 14, background: "var(--bk-bg-subtle)", border: "1px solid var(--bk-border)", borderRadius: 4 }}>
        <div style={{ font: "500 10.5px var(--bk-font-mono)", color: "var(--bk-ink-soft)" }}>
          {s.domain ?? "yoursite.com"} › {page.slug?.replace(/^\//, "") || page.id}
        </div>
        <div style={{ margin: "var(--bk-space-4) 0 2px", font: "500 16px var(--bk-font-ui)", color: "var(--bk-accent)" }}>
          {s.seoTitle || page.name}
        </div>
        <div style={{ font: "400 12.5px var(--bk-font-ui)", color: s.seoDesc ? "var(--bk-ink)" : "var(--bk-ink-muted)", fontStyle: s.seoDesc ? undefined : "italic", lineHeight: 1.4 }}>
          {s.seoDesc || "No description — add one below to improve ranking"}
        </div>
      </div>
      {/* ── 2. SEO SCORE ────────────────────────────────────────────────── */}
      {!s.allowIndex ? (
        <div style={{ padding: "10px var(--bk-space-12)", background: "var(--bk-warning-tint)", border: "1px solid var(--bk-warning-text)", borderRadius: 4, font: "400 var(--bk-radius-lg) var(--bk-font-ui)", color: "var(--bk-warning)" }} role="alert">
          <div>
            <strong style={{ color: "var(--bk-ink)" }}>noIndex is ON</strong> — search engines won&apos;t index this page regardless of your
            SEO settings.
            <Button
              color="light"
              size="xs"
              type="button"
              style={{ marginLeft: 6, padding: "2px 6px", color: "var(--bk-accent)", font: "500 11.5px var(--bk-font-ui)" }}
              onClick={() => s.setAllowIndex(true)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
            >
              Turn indexing on →
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Score row + checks grid — prototype .seo-score-row + .seo-checks */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "var(--bk-space-12)", background: "var(--bk-bg-subtle)", border: "1px solid var(--bk-border)", borderRadius: 4 }}>
            <div style={{ font: "500 28px var(--bk-font-mono)", color: s.seoScore >= 80 ? "var(--bk-success)" : "var(--bk-warning)", fontVariantNumeric: "tabular-nums", minWidth: 48 }}>
              {s.seoScore}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "500 11.5px var(--bk-font-ui)", color: "var(--bk-ink-soft)" }}>
                {s.seoScore >= 80 ? "Looks good" : "Needs work"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--bk-space-4) 10px", marginTop: "var(--bk-space-8)" }}>
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
                  <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6, font: "400 11px var(--bk-font-ui)", color: c.ok ? "var(--bk-ink)" : "var(--bk-ink-muted)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "var(--bk-radius-full)", background: c.ok ? "var(--bk-success)" : "var(--bk-ink-muted)", flexShrink: 0 }} />
                    <span>{c.label}</span>
                    <span style={{ marginLeft: "auto", font: "500 10px var(--bk-font-mono)", color: "var(--bk-ink-muted)" }}>{c.pts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reach 80+ banner — shown when score < 80 and indexing is on */}
          {s.seoScore < 80 && s.allowIndex && (
            <div style={{ padding: "var(--bk-space-8) 10px", background: "var(--bk-warning-tint)", border: "1px solid var(--bk-warning-text)", borderRadius: 4, font: "400 11.5px var(--bk-font-ui)", color: "var(--bk-warning)" }} role="note">
              Reach 80+ before publishing{s.seoChecks.descSet ? "" : " — add a meta description (+30 pts)"}
            </div>
          )}
        </>
      )}
      {/* ── 3. TITLE ────────────────────────────────────────────────────── */}
      <Stack gap="xs" style={{ gap: 6 }}>
        <Cluster justify="between">
          <Label htmlFor="seo-title">Title</Label>
          <span style={{ font: "500 10.5px var(--bk-font-mono)", color: range === "ok" || range === "ideal" ? "var(--bk-success)" : range === "short" ? "var(--bk-warning)" : "var(--bk-error)" }}>
            {s.seoTitle.length}/60{rangeLabel[range]}
          </span>
        </Cluster>
        {s.seoTitle.length < 10 && (
          <Button
            color="light"
            size="xs"
            type="button"
            style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "var(--bk-space-4)", padding: "3px var(--bk-space-8)", border: "1px solid var(--bk-accent)", borderRadius: "var(--bk-radius-full)", background: "var(--bk-accent-subtle)", color: "var(--bk-accent)", font: "500 10.5px var(--bk-font-ui)", transition: "background 100ms" }}
            aria-label="Suggest SEO title"
            disabled={aiBusy}
            onClick={suggestTitle} aria-busy={aiBusy || undefined} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
          >
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
            Write with AI
          </Button>
        )}
        <TextInput
          theme={BK_TEXT_INPUT_THEME}
          id="seo-title"
          value={s.seoTitle}
          onChange={(e) => s.setSeoTitle(e.target.value.slice(0, 60))}
          maxLength={60}
          aria-describedby="seo-title-hint"
        />
        <HelperText>Aim for 50–60 characters for best Google ranking</HelperText>
      </Stack>
      {/* ── 4. META DESCRIPTION ─────────────────────────────────────────── */}
      <Stack gap="xs" style={{ gap: 6 }}>
        <Cluster justify="between">
          {/* label + info icon in a flex row — button must NOT be inside <label> (HTML spec) */}
          <Cluster>
            <Label htmlFor="seo-desc">Meta Description</Label>
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
                style={{ padding: 2, color: "var(--bk-ink-muted)", display: "inline-flex", lineHeight: 0 }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </Button>
            </Tooltip>
          </Cluster>
          <span style={{ font: "500 10.5px var(--bk-font-mono)", color: s.seoDesc.length > 160 ? "var(--bk-error)" : s.seoDesc.length > 50 ? "var(--bk-success)" : "var(--bk-ink-muted)" }}>
            {s.seoDesc.length}/160
          </span>
        </Cluster>
        <Textarea
          className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
          id="seo-desc"
          rows={3}
          value={s.seoDesc}
          onChange={(e) => s.setSeoDesc(e.target.value.slice(0, 160))}
          placeholder='E.g. "We help small businesses build professional websites. Start free today."'
          aria-describedby="seo-desc-hint"
        />
        <HelperText>Briefly describe this page (150–160 chars). Appears in Google results below your title.</HelperText>
      </Stack>
      {/* ── 5. URL SLUG ─────────────────────────────────────────────────── */}
      <Stack gap="xs" style={{ gap: 6 }}>
        <Label htmlFor="seo-slug">URL Slug</Label>
        <div style={{ display: "flex", alignItems: "stretch" }}>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "0 var(--bk-space-8)", border: "1px solid var(--bk-border)", borderRight: 0, borderRadius: "4px 0 0 4px", background: "var(--bk-bg-subtle)", color: "var(--bk-ink-soft)", font: "500 11px var(--bk-font-mono)" }}>
            {domain}/
          </span>
          <TextInput
            theme={BK_TEXT_INPUT_THEME}
            id="seo-slug"
            value={s.slug}
            onChange={(e) => s.setSlug(e.target.value)}
            aria-describedby="seo-slug-hint"
            aria-invalid={!!s.slugError}
            style={{ borderRadius: "0 4px 4px 0", fontFamily: "var(--bk-font-mono)", fontSize: "11.5px" }}
          />
        </div>
        {/* Slug destructive warning — shown when slug changes on a live page */}
        {s.slug !== page.slug && page.status === "live" && !s.slugError && (
          <div style={{ display: "flex", gap: "var(--bk-space-8)", padding: "var(--bk-space-8) 10px", background: "var(--bk-warning-tint)", border: "1px solid var(--bk-warning-text)", borderRadius: 4, font: "400 11.5px var(--bk-font-ui)", color: "var(--bk-warning)" }} role="alert">
            <svg style={{ flexShrink: 0, marginTop: 1 }} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          <HelperText error>{s.slugError}</HelperText>
        ) : (
          <HelperText>Lowercase letters, numbers, and hyphens only — auto-formatted as you type</HelperText>
        )}
      </Stack>
    </Stack>
  );
};

SeoTab.displayName = "SeoTab";
