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
import type { Composer } from "../../../../../engine";
import { useToast } from "../../../../../shared/ui/Toast";
import type { PageItem, DrawerTab } from "../types";
import { calculateSeoScore } from "../utils/seoScore";
import { normalizeSlug, validateSlug, isSlugDuplicate } from "../utils/slug";

export type SaveState = "clean" | "saving" | "error";

export interface UsePageSettingsReturn {
  activeTab: DrawerTab;
  setActiveTab: (tab: DrawerTab) => void;

  seoTitle: string;
  setSeoTitle: (v: string) => void;
  seoDesc: string;
  setSeoDesc: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  slugError: string | null;
  seoScore: number;
  seoChecks: { titleSet: boolean; slugClean: boolean; indexingOn: boolean; descSet: boolean };

  ogTitle: string;
  setOgTitle: (v: string) => void;
  ogDesc: string;
  setOgDesc: (v: string) => void;
  ogImageUrl: string | null;
  setOgImageUrl: (url: string | null) => void;

  visibility: "live" | "hidden" | "password";
  setVisibility: (v: "live" | "hidden" | "password") => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  allowIndex: boolean;
  setAllowIndex: (v: boolean) => void;
  allowFollow: boolean;
  setAllowFollow: (v: boolean) => void;
  customHead: string;
  setCustomHead: (v: string) => void;
  headCodeError: string | null;

  domain: string | null;

  saveState: SaveState;
  isDirty: boolean;
  save: () => Promise<void>;
  discard: () => void;

  showDiscardConfirm: boolean;
  setShowDiscardConfirm: (v: boolean) => void;
  pendingTabChange: DrawerTab | null;
  confirmTabChange: () => void;
  cancelTabChange: () => void;
}

function validateHeadCode(code: string): string | null {
  if (!code.trim()) return null;
  const openTags = (code.match(/<[a-z][^/]*>/gi) ?? []).length;
  const closeTags = (code.match(/<\/[a-z]+>/gi) ?? []).length;
  const selfClosing = (code.match(/<[a-z][^>]*\/>/gi) ?? []).length;
  if (openTags > closeTags + selfClosing) {
    return "Unclosed HTML tag detected. Ensure all tags are properly closed.";
  }
  return null;
}

export function usePageSettings(
  composer: Composer | null,
  page: PageItem | null,
  allPages: PageItem[]
): UsePageSettingsReturn {
  const { addToast } = useToast();
  const [activeTab, _setActiveTab] = React.useState<DrawerTab>("seo");
  const [pendingTabChange, setPendingTabChange] = React.useState<DrawerTab | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);

  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDesc, setSeoDesc] = React.useState("");
  const [slug, setSlugRaw] = React.useState("");
  const [slugError, setSlugError] = React.useState<string | null>(null);
  const [ogTitle, setOgTitle] = React.useState("");
  const [ogDesc, setOgDesc] = React.useState("");
  const [ogImageUrl, setOgImageUrl] = React.useState<string | null>(null);
  const [visibility, setVisibility] = React.useState<"live" | "hidden" | "password">("live");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [allowIndex, setAllowIndex] = React.useState(true);
  const [allowFollow, setAllowFollow] = React.useState(true);
  const [customHead, setCustomHead] = React.useState("");
  const [headCodeError, setHeadCodeError] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>("clean");

  const savedSnapshot = React.useRef<string>("");

  React.useEffect(() => {
    if (!page) return;
    setSeoTitle(page.seo?.metaTitle ?? page.name);
    setSeoDesc(page.seo?.metaDescription ?? "");
    setSlugRaw(page.slug ?? "");
    setSlugError(null);
    setOgTitle(page.seo?.ogTitle ?? "");
    setOgDesc(page.seo?.ogDescription ?? "");
    setOgImageUrl(page.seo?.ogImage ?? null);
    const vis =
      page.status === "password" ? "password" : page.status === "hidden" ? "hidden" : "live";
    setVisibility(vis as "live" | "hidden" | "password");
    setPassword((page as { settings?: { password?: string } }).settings?.password ?? "");
    setAllowIndex(!(page.seo as { noIndex?: boolean } | undefined)?.noIndex);
    setAllowFollow(!(page.seo as { noFollow?: boolean } | undefined)?.noFollow);
    setCustomHead(page.head ?? "");
    setHeadCodeError(null);
    setSaveState("clean");
    savedSnapshot.current = JSON.stringify({
      seoTitle: page.seo?.metaTitle ?? page.name,
      seoDesc: page.seo?.metaDescription ?? "",
      slug: page.slug ?? "",
      ogTitle: page.seo?.ogTitle ?? "",
      ogDesc: page.seo?.ogDescription ?? "",
      ogImageUrl: page.seo?.ogImage ?? null,
      visibility: vis,
      password: (page as { settings?: { password?: string } }).settings?.password ?? "",
      allowIndex: !(page.seo as { noIndex?: boolean } | undefined)?.noIndex,
      allowFollow: !(page.seo as { noFollow?: boolean } | undefined)?.noFollow,
      customHead: page.head ?? "",
    });
  }, [page?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      visibility,
      password,
      allowIndex,
      allowFollow,
      customHead,
    });
    return current !== savedSnapshot.current;
  }, [
    page,
    seoTitle,
    seoDesc,
    slug,
    ogTitle,
    ogDesc,
    ogImageUrl,
    visibility,
    password,
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

  const setActiveTab = React.useCallback(
    (tab: DrawerTab) => {
      if (isDirty || saveState === "error") {
        setPendingTabChange(tab);
        setShowDiscardConfirm(true);
        return;
      }
      _setActiveTab(tab);
    },
    [isDirty, saveState]
  );

  const confirmTabChange = React.useCallback(() => {
    if (pendingTabChange) _setActiveTab(pendingTabChange);
    setPendingTabChange(null);
    setShowDiscardConfirm(false);
    setSaveState("clean");
  }, [pendingTabChange]);

  const cancelTabChange = React.useCallback(() => {
    setPendingTabChange(null);
    setShowDiscardConfirm(false);
  }, []);

  const save = React.useCallback(async () => {
    if (!composer || !page) return;
    if (slugError) {
      addToast({ message: "Fix slug error before saving", variant: "warning" });
      return;
    }
    const codeErr = validateHeadCode(customHead);
    if (codeErr) {
      setHeadCodeError(codeErr);
      addToast({ message: codeErr, variant: "warning" });
      return;
    }
    if (visibility === "password" && !password.trim()) {
      addToast({ message: "Set an access password before saving", variant: "warning" });
      return;
    }
    setSaveState("saving");
    try {
      await composer.elements.updatePage(page.id, {
        slug,
        settings: {
          visibility,
          password: visibility === "password" ? password : undefined,
          head: customHead || undefined,
          seo: {
            metaTitle: seoTitle || undefined,
            metaDescription: seoDesc || undefined,
            ogTitle: ogTitle || undefined,
            ogDescription: ogDesc || undefined,
            ogImage: ogImageUrl || undefined,
            noIndex: !allowIndex,
            noFollow: !allowFollow,
          },
        },
      });
      setSaveState("clean");
      savedSnapshot.current = JSON.stringify({
        seoTitle,
        seoDesc,
        slug,
        ogTitle,
        ogDesc,
        ogImageUrl,
        visibility,
        password,
        allowIndex,
        allowFollow,
        customHead,
      });
      addToast({ message: "Page settings saved", variant: "success" });
    } catch {
      setSaveState("error");
      addToast({
        message: "Save failed — your changes are still here.",
        variant: "error",
        duration: 0,
        action: { label: "Retry", onClick: () => save() },
      });
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
    visibility,
    password,
    allowIndex,
    allowFollow,
    customHead,
    slugError,
    addToast,
  ]);

  const discard = React.useCallback(() => {
    if (!page) return;
    // Reset ALL fields to persisted page state
    setSeoTitle(page.seo?.metaTitle ?? page.name);
    setSeoDesc(page.seo?.metaDescription ?? "");
    setSlugRaw(page.slug ?? "");
    setSlugError(null);
    setOgTitle(page.seo?.ogTitle ?? "");
    setOgDesc(page.seo?.ogDescription ?? "");
    setOgImageUrl(page.seo?.ogImage ?? null);
    const vis =
      page.status === "password" ? "password" : page.status === "hidden" ? "hidden" : "live";
    setVisibility(vis as "live" | "hidden" | "password");
    setPassword((page as { settings?: { password?: string } }).settings?.password ?? "");
    setShowPassword(false);
    setAllowIndex(!(page.seo as { noIndex?: boolean } | undefined)?.noIndex);
    setAllowFollow(!(page.seo as { noFollow?: boolean } | undefined)?.noFollow);
    setCustomHead(page.head ?? "");
    setHeadCodeError(null);
    setSaveState("clean");
    const vis2 =
      page.status === "password" ? "password" : page.status === "hidden" ? "hidden" : "live";
    savedSnapshot.current = JSON.stringify({
      seoTitle: page.seo?.metaTitle ?? page.name,
      seoDesc: page.seo?.metaDescription ?? "",
      slug: page.slug ?? "",
      ogTitle: page.seo?.ogTitle ?? "",
      ogDesc: page.seo?.ogDescription ?? "",
      ogImageUrl: page.seo?.ogImage ?? null,
      visibility: vis2 as "live" | "hidden" | "password",
      password: (page as { settings?: { password?: string } }).settings?.password ?? "",
      allowIndex: !(page.seo as { noIndex?: boolean } | undefined)?.noIndex,
      allowFollow: !(page.seo as { noFollow?: boolean } | undefined)?.noFollow,
      customHead: page.head ?? "",
    });
  }, [page]);

  const seoScore = React.useMemo(
    () => calculateSeoScore({ title: seoTitle, desc: seoDesc, slug, allowIndex }),
    [seoTitle, seoDesc, slug, allowIndex]
  );
  const seoChecks = {
    titleSet: seoTitle.length >= 10,
    slugClean: !slugError && slug.length > 0,
    indexingOn: allowIndex,
    descSet: seoDesc.length >= 50,
  };

  const domain = (composer as { project?: { domain?: string } } | null)?.project?.domain ?? null;

  return {
    activeTab,
    setActiveTab,
    seoTitle,
    setSeoTitle,
    seoDesc,
    setSeoDesc,
    slug,
    setSlug,
    slugError,
    seoScore,
    seoChecks,
    ogTitle,
    setOgTitle,
    ogDesc,
    setOgDesc,
    ogImageUrl,
    setOgImageUrl,
    visibility,
    setVisibility,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    allowIndex,
    setAllowIndex,
    allowFollow,
    setAllowFollow,
    customHead,
    setCustomHead,
    headCodeError,
    domain,
    saveState,
    isDirty,
    save,
    discard,
    showDiscardConfirm,
    setShowDiscardConfirm,
    pendingTabChange,
    confirmTabChange,
    cancelTabChange,
  };
}
