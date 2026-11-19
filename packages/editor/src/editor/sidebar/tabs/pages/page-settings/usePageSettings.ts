/**
 * usePageSettings — ALL state and logic for the PageSettingsDrawer.
 *
 * Called ONCE in PageSettingsDrawer.tsx.
 * SeoTab, SocialTab, AdvancedTab receive values + setters as props.
 *
 * No business logic in the tab components — they are pure form renderers.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useToast } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "@/engine";
import type { PageItem, DrawerTab } from "../types";
import { pageSeoSchema } from "@buildrik/shared/schemas/sites";
import { resolvePageTitle } from "@/engine/export/SEOInjector";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { useSiteOrigin } from "@/editor/shared/useSiteOrigin";
import { normalizeSlug, validateSlug, isSlugDuplicate } from "../utils/slug";

export type SaveState = "clean" | "saving" | "error";

export interface UsePageSettingsReturn {
  activeTab: DrawerTab;
  setActiveTab: (tab: DrawerTab) => void;

  /** The page's OWN meta title — empty when it has none. Only what the user
   *  types here is saved (D1, owner 2026-10-06 "empty field + placeholder"). */
  seoTitle: string;
  setSeoTitle: (v: string) => void;
  /** The title this page ships with when it has no own title — the exporter's
   *  own precedence (site default, else the page name through the template).
   *  The title field's placeholder. */
  inheritedTitle: string;
  /** The title this page ships with as drafted: the own title through the
   *  site template, else the inherited one. The Google / social previews. */
  effectiveTitle: string;
  seoDesc: string;
  setSeoDesc: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  slugError: string | null;

  ogTitle: string;
  setOgTitle: (v: string) => void;
  ogDesc: string;
  setOgDesc: (v: string) => void;
  ogImageUrl: string | null;
  setOgImageUrl: (url: string | null) => void;
  /** The site's default social image (Settings › SEO), used when the page has none. */
  siteOgImage: string | null;

  /** FG-007: optional focus keyphrase — with none, keyphrase checks are not run. */
  keyphrase: string;
  setKeyphrase: (v: string) => void;

  /** FG-011: X uses the shared social values unless this is on. */
  xCustomized: boolean;
  /** Turning it on starts the X fields from the shared values when they are
   *  empty; turning it off keeps them (they are only ignored on export). */
  setXCustomized: (on: boolean) => void;
  xTitle: string;
  setXTitle: (v: string) => void;
  xDesc: string;
  setXDesc: (v: string) => void;
  xImageUrl: string | null;
  setXImageUrl: (url: string | null) => void;

  /** "" = this page's own address; else a full http(s) URL (FG-007). */
  canonicalUrl: string;
  setCanonicalUrl: (v: string) => void;
  /** The shared schema's refusal, or null. Save stays off while it is set. */
  canonicalError: string | null;
  schemaType: "WebPage" | "Article";
  setSchemaType: (v: "WebPage" | "Article") => void;
  articleAuthor: string;
  setArticleAuthor: (v: string) => void;
  /** YYYY-MM-DD, or "". */
  articleDate: string;
  setArticleDate: (v: string) => void;
  /** The site's author (General), the Article author placeholder. */
  siteAuthor: string;

  /** Decision #21: Live · Hidden. Password is gone until the published-site
   *  middleware exists to enforce it. */
  visibility: "live" | "hidden";
  setVisibility: (v: "live" | "hidden") => void;
  allowIndex: boolean;
  setAllowIndex: (v: boolean) => void;
  allowFollow: boolean;
  setAllowFollow: (v: boolean) => void;
  customHead: string;
  setCustomHead: (v: string) => void;
  headCodeError: string | null;

  /** The host the published page sits on, without the scheme (`acme.com`,
   *  `proj.vercel.app`); null until something is known. */
  domain: string | null;
  /** Whether the live deploy serves clean URLs (`/about`); until then the
   *  page's URL is its `.html` file (BD-39 (4)). */
  servesCleanUrls: boolean;
  /** The site's live URL, or null when it has never been published. Gates the
      slug-change warning: "existing links" can only exist if the site is
      reachable, which is a fact about the site rather than the page. */
  publishedUrl: string | null;

  saveState: SaveState;
  isDirty: boolean;
  /** Resolves true once the page is written; false when blocked or failed. */
  save: () => Promise<boolean>;
  discard: () => void;

  showDiscardConfirm: boolean;
  setShowDiscardConfirm: (v: boolean) => void;
}

/* Void elements never take a closing tag: `<meta …>` and `<link …>` without
   a slash are valid HTML (a Google site-verification tag was refused). */
const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

function validateHeadCode(code: string): string | null {
  if (!code.trim()) return null;
  let openTags = 0;
  let closeTags = 0;
  for (const [tag, name] of code.matchAll(/<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi)) {
    if (tag.startsWith("</")) closeTags++;
    else if (!VOID_TAGS.has(name.toLowerCase()) && !tag.endsWith("/>")) openTags++;
  }
  if (openTags > closeTags) {
    return "Unclosed HTML tag detected. Ensure all tags are properly closed.";
  }
  return null;
}

interface PersistedState {
  seoTitle: string;
  seoDesc: string;
  slug: string;
  ogTitle: string;
  ogDesc: string;
  ogImageUrl: string | null;
  keyphrase: string;
  xCustomized: boolean;
  xTitle: string;
  xDesc: string;
  xImageUrl: string | null;
  canonicalUrl: string;
  schemaType: "WebPage" | "Article";
  articleAuthor: string;
  articleDate: string;
  visibility: "live" | "hidden";
  allowIndex: boolean;
  allowFollow: boolean;
  customHead: string;
}

function getPersistedState(page: PageItem): PersistedState {
  const seoFlags = page.seo as { noIndex?: boolean; noFollow?: boolean } | undefined;
  /* A legacy password page already arrives as "hidden" (usePages, #26). */
  const visibility: PersistedState["visibility"] = page.status === "hidden" ? "hidden" : "live";
  return {
    /* The page's own title only. Seeding page.name here (D1) wrote it back as
       the page's title on any save and opted the page out of the site's
       default title. What the page inherits is the placeholder instead. */
    seoTitle: page.seo?.metaTitle ?? "",
    seoDesc: page.seo?.metaDescription ?? "",
    slug: page.slug ?? "",
    ogTitle: page.seo?.ogTitle ?? "",
    ogDesc: page.seo?.ogDescription ?? "",
    ogImageUrl: page.seo?.ogImage ?? null,
    keyphrase: page.seo?.focusKeyphrase ?? "",
    xCustomized: page.seo?.xCustomized === true,
    xTitle: page.seo?.twitterTitle ?? "",
    xDesc: page.seo?.twitterDescription ?? "",
    xImageUrl: page.seo?.twitterImage ?? null,
    canonicalUrl: page.seo?.canonicalUrl ?? "",
    schemaType: page.seo?.schemaType === "Article" ? "Article" : "WebPage",
    articleAuthor: page.seo?.article?.authorName ?? "",
    articleDate: (page.seo?.article?.datePublished ?? "").slice(0, 10),
    visibility,
    allowIndex: !seoFlags?.noIndex,
    allowFollow: !seoFlags?.noFollow,
    customHead: page.head ?? "",
  };
}

export function usePageSettings(
  composer: Composer | null,
  page: PageItem | null,
  allPages: PageItem[]
): UsePageSettingsReturn {
  const { addToast } = useToast();
  /* Decision #20: the three tabs are one form saved on Done, so a tab switch
     keeps every edit — it is no longer guarded. */
  const [activeTab, setActiveTab] = React.useState<DrawerTab>("seo");
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);

  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDesc, setSeoDesc] = React.useState("");
  const [slug, setSlugRaw] = React.useState("");
  const [slugError, setSlugError] = React.useState<string | null>(null);
  const [ogTitle, setOgTitle] = React.useState("");
  const [ogDesc, setOgDesc] = React.useState("");
  const [ogImageUrl, setOgImageUrl] = React.useState<string | null>(null);
  const [keyphrase, setKeyphrase] = React.useState("");
  const [xCustomized, setXCustomizedRaw] = React.useState(false);
  const [xTitle, setXTitle] = React.useState("");
  const [xDesc, setXDesc] = React.useState("");
  const [xImageUrl, setXImageUrl] = React.useState<string | null>(null);
  const [canonicalUrl, setCanonicalUrl] = React.useState("");
  const [schemaType, setSchemaType] = React.useState<"WebPage" | "Article">("WebPage");
  const [articleAuthor, setArticleAuthor] = React.useState("");
  const [articleDate, setArticleDate] = React.useState("");
  const [visibility, setVisibility] = React.useState<"live" | "hidden">("live");
  const [allowIndex, setAllowIndex] = React.useState(true);
  const [allowFollow, setAllowFollow] = React.useState(true);
  const [customHead, setCustomHead] = React.useState("");
  const [headCodeError, setHeadCodeError] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>("clean");

  /* State, not a ref: isDirty has to recompute when the snapshot moves. As a
     ref, a page whose persisted fields all equal the hook's initial ("" / defaults
     — a Home with an empty slug) changed no state when applied, nothing
     re-rendered, and the form read dirty against the empty first snapshot. */
  const [savedSnapshot, setSavedSnapshot] = React.useState<string>("");

  const siteId = React.useMemo(() => getSiteIdFromUrl(), []);
  const { getOrigin: getSiteOrigin, servesCleanUrls } = useSiteOrigin(composer, siteId);

  const applyPersistedState = React.useCallback((p: PageItem) => {
    const state = getPersistedState(p);
    setSeoTitle(state.seoTitle);
    setSeoDesc(state.seoDesc);
    setSlugRaw(state.slug);
    setSlugError(null);
    setOgTitle(state.ogTitle);
    setOgDesc(state.ogDesc);
    setOgImageUrl(state.ogImageUrl);
    setKeyphrase(state.keyphrase);
    setXCustomizedRaw(state.xCustomized);
    setXTitle(state.xTitle);
    setXDesc(state.xDesc);
    setXImageUrl(state.xImageUrl);
    setCanonicalUrl(state.canonicalUrl);
    setSchemaType(state.schemaType);
    setArticleAuthor(state.articleAuthor);
    setArticleDate(state.articleDate);
    setVisibility(state.visibility);
    setAllowIndex(state.allowIndex);
    setAllowFollow(state.allowFollow);
    setCustomHead(state.customHead);
    setHeadCodeError(null);
    setSaveState("clean");
    setSavedSnapshot(JSON.stringify(state));
  }, []);

  React.useEffect(() => {
    if (!page) return;
    applyPersistedState(page);
  }, [page?.id, applyPersistedState]); // eslint-disable-line react-hooks/exhaustive-deps

  // isDirty — compares all 9 fields against snapshot
  const isDirty = React.useMemo(() => {
    if (!page) return false;
    const current = JSON.stringify({
      seoTitle,
      seoDesc,
      slug,
      ogTitle,
      ogDesc,
      ogImageUrl,
      keyphrase,
      xCustomized,
      xTitle,
      xDesc,
      xImageUrl,
      canonicalUrl,
      schemaType,
      articleAuthor,
      articleDate,
      visibility,
      allowIndex,
      allowFollow,
      customHead,
    });
    return current !== savedSnapshot;
  }, [
    page,
    savedSnapshot,
    seoTitle,
    seoDesc,
    slug,
    ogTitle,
    ogDesc,
    ogImageUrl,
    keyphrase,
    xCustomized,
    xTitle,
    xDesc,
    xImageUrl,
    canonicalUrl,
    schemaType,
    articleAuthor,
    articleDate,
    visibility,
    allowIndex,
    allowFollow,
    customHead,
  ]);

  const setSlug = React.useCallback(
    (raw: string) => {
      const normalized = normalizeSlug(raw);
      setSlugRaw(normalized);
      const err = validateSlug(normalized);
      if (err) {
        setSlugError(err);
        return;
      }
      const dupName = isSlugDuplicate(normalized, page?.id ?? "", allPages);
      setSlugError(
        dupName ? `This slug is already used by "${dupName}". Choose a unique slug.` : null
      );
    },
    [page?.id, allPages]
  );

  /* FG-007: validated by the shared page schema — what the server accepts. */
  const canonicalError = React.useMemo(() => {
    const parsed = pageSeoSchema.shape.canonicalUrl.safeParse(canonicalUrl.trim());
    return parsed.success ? null : (parsed.error.issues[0]?.message ?? "Enter a full URL beginning with https:// or http://.");
  }, [canonicalUrl]);

  const save = React.useCallback(async (): Promise<boolean> => {
    if (!composer || !page) return false;
    if (canonicalError) return false;
    if (slugError) {
      addToast({ description: "Fix slug error before saving", tone: "warning" });
      return false;
    }
    const codeErr = validateHeadCode(customHead);
    if (codeErr) {
      setHeadCodeError(codeErr);
      addToast({ description: codeErr, tone: "warning" });
      return false;
    }
    setSaveState("saving");
    try {
      // slugManuallySet=true: any slug saved from the settings form is a
      // user-entered slug. Downstream: rename-autosuggests-slug in PageRow
      // must NOT overwrite this on future name edits.
      await composer.elements.updatePage(page.id, {
        slug,
        slugManuallySet: slug !== (page.slug ?? "") ? true : undefined,
        settings: {
          visibility,
          head: customHead || undefined,
          /* Merged over what the page holds: the form owns only these
             fields, and canonical URL / structured data / Twitter fields
             (set by import, API or templates) ship too. */
          seo: {
            ...page.seo,
            metaTitle: seoTitle || undefined,
            metaDescription: seoDesc || undefined,
            ogTitle: ogTitle || undefined,
            ogDescription: ogDesc || undefined,
            ogImage: ogImageUrl || undefined,
            focusKeyphrase: keyphrase.trim() || undefined,
            xCustomized: xCustomized || undefined,
            twitterTitle: xTitle || undefined,
            twitterDescription: xDesc || undefined,
            twitterImage: xImageUrl || undefined,
            canonicalUrl: canonicalUrl.trim() || undefined,
            schemaType: schemaType === "Article" ? "Article" : undefined,
            article:
              schemaType === "Article"
                ? { authorName: articleAuthor.trim() || undefined, datePublished: articleDate ? `${articleDate}T00:00:00.000Z` : undefined }
                : undefined,
            noIndex: !allowIndex,
            noFollow: !allowFollow,
          },
        },
      });
      setSaveState("clean");
      setSavedSnapshot(JSON.stringify({
        seoTitle,
        seoDesc,
        slug,
        ogTitle,
        ogDesc,
        ogImageUrl,
        keyphrase,
        xCustomized,
        xTitle,
        xDesc,
        xImageUrl,
        canonicalUrl,
        schemaType,
        articleAuthor,
        articleDate,
        visibility,
        allowIndex,
        allowFollow,
        customHead,
      }));
      /* 6887:73801 — the saved toast carries its way on: Manage pages. */
      addToast({
        description: "Page settings saved",
        tone: "success",
        action: { label: "Manage pages", onClick: () => composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "pages" }) },
      });
      return true;
    } catch {
      /* The dialog stays open with the edits and says so inline (design-2l9
         63:18189); its primary becomes Retry save. */
      setSaveState("error");
      return false;
    }
  }, [
    composer,
    page,
    slug,
    seoTitle,
    seoDesc,
    ogTitle,
    ogDesc,
    ogImageUrl,
    keyphrase,
    xCustomized,
    xTitle,
    xDesc,
    xImageUrl,
    canonicalUrl,
    schemaType,
    articleAuthor,
    articleDate,
    visibility,
    allowIndex,
    allowFollow,
    customHead,
    slugError,
    canonicalError,
    addToast,
  ]);

  const discard = React.useCallback(() => {
    if (!page) return;
    applyPersistedState(page);
  }, [page, applyPersistedState]);

  /* What ships, by the exporter's own rule (`resolvePageTitle`): the stored
     page settings carry a legacy `title` the exporter still honours. */
  const siteSeo = composer?.getProjectSettings?.()?.seo;
  const siteOgImage = siteSeo?.defaultOgImage?.trim() || null;
  const storedSettings = page ? composer?.elements?.getPage?.(page.id)?.settings : undefined;
  const inheritedTitle = page ? resolvePageTitle(page, undefined, storedSettings, siteSeo) : "";
  const effectiveTitle = page ? resolvePageTitle(page, { metaTitle: seoTitle }, storedSettings, siteSeo) : "";
  /* FG-011: on starts from the shared values — the OG fields, else what they
     fall back to — but only into empty X fields, so values kept from an
     earlier customisation come back as they were. */
  const setXCustomized = React.useCallback(
    (on: boolean) => {
      setXCustomizedRaw(on);
      if (!on) return;
      if (!xTitle) setXTitle(ogTitle || effectiveTitle);
      if (!xDesc) setXDesc(ogDesc || seoDesc);
      if (!xImageUrl) setXImageUrl(ogImageUrl);
    },
    [xTitle, xDesc, xImageUrl, ogTitle, ogDesc, ogImageUrl, effectiveTitle, seoDesc],
  );

  /* Whether this site is reachable by anyone. The slug warning is about
     "existing links", so the honest question is whether links can exist —
     which is a fact about the site being published, not about the page. */
  const publishedUrl = composer?.getProjectMetadata?.()?.publishedUrl ?? null;

  /* D2: the host the publish worker puts this page on (`siteOrigin`, the
     same order as the robots.txt preview). It read `metadata.domain`, filled
     from a `sites.get` field that does not exist — always yoursite.com. */
  const origin = getSiteOrigin();
  const domain = origin ? origin.replace(/^https?:\/\//, "") : null;

  return {
    activeTab,
    setActiveTab,
    seoTitle,
    setSeoTitle,
    inheritedTitle,
    effectiveTitle,
    seoDesc,
    setSeoDesc,
    slug,
    setSlug,
    slugError,
    ogTitle,
    setOgTitle,
    ogDesc,
    setOgDesc,
    ogImageUrl,
    setOgImageUrl,
    siteOgImage,
    keyphrase,
    setKeyphrase,
    xCustomized,
    setXCustomized,
    xTitle,
    setXTitle,
    xDesc,
    setXDesc,
    xImageUrl,
    setXImageUrl,
    canonicalUrl,
    setCanonicalUrl,
    canonicalError,
    schemaType,
    setSchemaType,
    articleAuthor,
    setArticleAuthor,
    articleDate,
    setArticleDate,
    siteAuthor: siteSeo?.author ?? "",
    visibility,
    setVisibility,
    allowIndex,
    setAllowIndex,
    allowFollow,
    setAllowFollow,
    customHead,
    setCustomHead,
    headCodeError,
    domain,
    servesCleanUrls,
    publishedUrl,
    saveState,
    isDirty,
    save,
    discard,
    showDiscardConfirm,
    setShowDiscardConfirm,
  };
}
