/**
 * PageSettingsScreen — Slide-in settings drawer for individual page config.
 * Replaces the old drill-in overlay approach with an absolute-positioned drawer
 * that slides in from the right (translateX(100%) → translateX(0)).
 *
 * Fixes applied:
 *   FIX C1 — isDirty() check: prompts user before discarding unsaved changes.
 *   FIX H2 — Slug duplicate check: validates slug uniqueness before saving.
 *   FIX H4 — SEO title default: uses page.name only (no hardcoded "My Site").
 *   FIX M2 — Toggle mutex: Hidden + Password visibility are mutually exclusive.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { ConfirmDialog } from "../../../../shared/ui/Modal";
import { useToast } from "../../../../shared/ui/Toast";
import type { PageItem } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageSettingsScreenProps {
  composer: Composer | null;
  /** Currently selected page. Null = drawer is closed. */
  page: PageItem | null;
  /** All pages — used for slug duplicate check (FIX H2) */
  allPages: PageItem[];
  onClose: () => void;
}

type DrawerTab = "seo" | "social" | "advanced";
type Visibility = "live" | "hidden" | "password";

// ─── Component ────────────────────────────────────────────────────────────────

export const PageSettingsScreen: React.FC<PageSettingsScreenProps> = ({
  composer,
  page,
  allPages,
  onClose,
}) => {
  const { addToast } = useToast();
  const [tab, setTab] = React.useState<DrawerTab>("seo");
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);

  // SEO fields
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDesc, setSeoDesc] = React.useState("");
  const [slug, setSlug] = React.useState("");

  // Visibility (FIX M2)
  const [visibility, setVisibility] = React.useState<Visibility>("live");

  // Advanced
  const [noIndex, setNoIndex] = React.useState(false);
  const [noFollow, setNoFollow] = React.useState(false);

  // Social / OG
  const [ogTitle, setOgTitle] = React.useState("");
  const [ogDesc, setOgDesc] = React.useState("");

  // Custom head code
  const [customHead, setCustomHead] = React.useState("");

  // Password — UI-only until engine supports page-level visibility/password
  const [password, setPassword] = React.useState("");

  // Reset local state when page changes (key-based remount handled in PagesTab)
  React.useEffect(() => {
    if (!page) return;
    // FIX H4: default SEO title = page.name only (no hardcoded "My Site")
    setSeoTitle(page.seo?.metaTitle ?? page.name);
    setSeoDesc(page.seo?.metaDescription ?? "");
    setSlug(page.slug ?? page.name.toLowerCase().replace(/\s+/g, "-"));
    setTab("seo");

    // Derive current visibility from page.seo (stored as noIndex/noFollow in engine)
    // Actual visibility field would come from page settings if engine supports it
    setVisibility("live");
    setNoIndex(page.seo?.noIndex ?? false);
    setNoFollow(page.seo?.noFollow ?? false);
    setOgTitle(page.seo?.ogTitle ?? "");
    setOgDesc(page.seo?.ogDescription ?? "");
    setCustomHead(page.head ?? "");
    setPassword(""); // always reset — UI-only, not persisted
  }, [page]);

  // ── Dirty check (FIX C1) ──────────────────────────────────────────────────

  const isDirty = React.useCallback((): boolean => {
    if (!page) return false;
    const origTitle = page.seo?.metaTitle ?? page.name;
    const origDesc = page.seo?.metaDescription ?? "";
    const origSlug = page.slug ?? page.name.toLowerCase().replace(/\s+/g, "-");
    const origOgTitle = page.seo?.ogTitle ?? "";
    const origOgDesc = page.seo?.ogDescription ?? "";
    const origHead = page.head ?? "";
    return (
      seoTitle !== origTitle || seoDesc !== origDesc || slug !== origSlug ||
      ogTitle !== origOgTitle || ogDesc !== origOgDesc || customHead !== origHead
    );
  }, [page, seoTitle, seoDesc, slug, ogTitle, ogDesc, customHead]);

  const handleClose = () => {
    if (isDirty()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // ── Save (FIX H2, M2) ────────────────────────────────────────────────────

  const handleSave = () => {
    if (!composer || !page) return;

    // FIX H2: slug duplicate check
    const trimmedSlug = slug.trim();
    const slugUsedByOther = allPages.some((p) => p.id !== page.id && p.slug === trimmedSlug);
    if (trimmedSlug && slugUsedByOther) {
      addToast({ message: `Slug "${trimmedSlug}" is already used by another page.`, variant: "error" });
      return;
    }

    composer.elements.updatePage(page.id, {
      slug: trimmedSlug || undefined,
      settings: {
        head: customHead.trim() || undefined,
        seo: {
          metaTitle: seoTitle.trim() || undefined,
          metaDescription: seoDesc.trim() || undefined,
          ogTitle: ogTitle.trim() || undefined,
          ogDescription: ogDesc.trim() || undefined,
          noIndex,
          noFollow,
        },
      },
    });

    addToast({ message: "Settings saved", variant: "success", duration: 2000 });
    onClose();
  };

  // ── Visibility toggles (FIX M2 — mutual exclusion) ───────────────────────

  const handlePasswordToggle = () => {
    setVisibility((prev) => {
      if (prev === "password") return "live";
      return "password"; // auto-OFF hidden (mutual exclusion)
    });
  };

  const handleHiddenToggle = () => {
    setVisibility((prev) => {
      if (prev === "hidden") return "live";
      return "hidden"; // auto-OFF password (mutual exclusion)
    });
  };

  // ── SEO score derived from field completeness ─────────────────────────────

  const seoScore = React.useMemo(() => {
    let score = 0;
    if (seoTitle.trim()) score += 30;
    if (seoDesc.trim()) score += 30;
    if (slug.trim()) score += 20;
    if (seoTitle.length >= 10 && seoTitle.length <= 60) score += 10;
    if (seoDesc.length >= 50 && seoDesc.length <= 160) score += 10;
    return score;
  }, [seoTitle, seoDesc, slug]);

  const seoScoreColor = seoScore >= 70 ? "#22C55E" : seoScore >= 40 ? "#F59E0B" : "#EF4444";

  const titleCcClass =
    seoTitle.length > 60 ? "pages-drawer__cc--err" :
    seoTitle.length > 50 ? "pages-drawer__cc--warn" : "";

  const descCcClass =
    seoDesc.length > 160 ? "pages-drawer__cc--err" :
    seoDesc.length > 140 ? "pages-drawer__cc--warn" : "";

  const slugSlug = page?.slug ?? page?.name.toLowerCase().replace(/\s+/g, "-") ?? "";
  const previewTitle = seoTitle.trim() || page?.name || "Untitled";
  const previewDesc = seoDesc.trim() || "No description — add a meta description.";
  const previewSlug = slug.trim() || slugSlug;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className={`pages-drawer${page ? " pages-drawer--open" : ""}`}>
        {page && (
          <>
            {/* Header */}
            <div className="pages-drawer__hdr">
              <button
                className="pages-drawer__back"
                onClick={handleClose}
                aria-label="Back to pages"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div className="pages-drawer__title">{page.name} — Settings</div>
              <button className="pages-drawer__save" onClick={handleSave}>
                Save
              </button>
            </div>

            {/* Tab bar */}
            <div className="pages-drawer__tabs">
              {(["seo", "social", "advanced"] as DrawerTab[]).map((t) => (
                <button
                  key={t}
                  className={`pages-drawer__tab${tab === t ? " pages-drawer__tab--active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t === "seo" ? "SEO" : t === "social" ? "Social" : "Advanced"}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="pages-drawer__body aqb-scrollbar">
              {/* ── SEO Tab ── */}
              {tab === "seo" && (
                <div className="pages-drawer__section">
                  {/* Score bar */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: seoScoreColor, lineHeight: 1 }}>
                        {seoScore}
                      </div>
                      <div style={{ fontSize: 9, color: seoScoreColor, marginTop: 2 }}>SEO Score</div>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <SeoCheck ok={!!seoTitle.trim()} label="Page title set" />
                      <SeoCheck ok={slug.trim().length > 0} label="Slug is clean" />
                      <SeoCheck ok={!!seoDesc.trim()} label="Meta description" />
                    </div>
                  </div>

                  <div className="pages-drawer__sep" />

                  {/* SEO Title */}
                  <div className="pages-drawer__field">
                    <div className="pages-drawer__field-label">
                      <span>Title</span>
                      <span className={`pages-drawer__cc ${titleCcClass}`}>
                        {seoTitle.length}/60
                      </span>
                    </div>
                    <input
                      className="pages-drawer__input"
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="Page title…"
                    />
                  </div>

                  {/* Meta description */}
                  <div className="pages-drawer__field">
                    <div className="pages-drawer__field-label">
                      <span>Description</span>
                      <span className={`pages-drawer__cc ${descCcClass}`}>
                        {seoDesc.length}/160
                      </span>
                    </div>
                    <textarea
                      className="pages-drawer__textarea"
                      rows={3}
                      value={seoDesc}
                      onChange={(e) => setSeoDesc(e.target.value)}
                      placeholder="Page description…"
                    />
                  </div>

                  {/* Slug */}
                  <div className="pages-drawer__field">
                    <div className="pages-drawer__field-label">
                      <span>URL Slug</span>
                    </div>
                    <div className="pages-drawer__slug-row">
                      <span className="pages-drawer__slug-pre">yourdomain.com/</span>
                      <input
                        className="pages-drawer__slug-input"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="page-slug"
                      />
                    </div>
                  </div>

                  <div className="pages-drawer__sep" />

                  {/* Google preview */}
                  <div className="pages-drawer__field-label" style={{ marginBottom: 8 }}>
                    <span>Google Preview</span>
                  </div>
                  <div className="pages-drawer__goog">
                    <div className="pages-drawer__goog-site">
                      yourdomain.com › {previewSlug}
                    </div>
                    <div className="pages-drawer__goog-title">{previewTitle}</div>
                    <div className="pages-drawer__goog-desc">{previewDesc}</div>
                  </div>
                </div>
              )}

              {/* ── Social Tab ── */}
              {tab === "social" && (
                <div className="pages-drawer__section">
                  <div className="pages-drawer__section-title">Visibility (FIX M2)</div>

                  {/* Hidden toggle */}
                  <div className="pages-drawer__tog-row">
                    <div className="pages-drawer__tog-info">
                      <div className="pages-drawer__tog-name">Hide from navigation</div>
                      <div className="pages-drawer__tog-sub">Published but hidden from nav</div>
                    </div>
                    <button
                      className={`pages-drawer__tog${visibility === "hidden" ? " pages-drawer__tog--on" : ""}`}
                      onClick={handleHiddenToggle}
                      aria-label={visibility === "hidden" ? "Hidden: on" : "Hidden: off"}
                      aria-pressed={visibility === "hidden"}
                    />
                  </div>

                  {/* Password toggle */}
                  <div className="pages-drawer__tog-row">
                    <div className="pages-drawer__tog-info">
                      <div className="pages-drawer__tog-name">Password protect</div>
                      <div className="pages-drawer__tog-sub">Visitors need a password</div>
                    </div>
                    <button
                      className={`pages-drawer__tog${visibility === "password" ? " pages-drawer__tog--on" : ""}`}
                      onClick={handlePasswordToggle}
                      aria-label={visibility === "password" ? "Password: on" : "Password: off"}
                      aria-pressed={visibility === "password"}
                    />
                  </div>

                  {/* Password input (only when password mode) */}
                  {visibility === "password" && (
                    <div className="pages-drawer__field" style={{ marginTop: 8 }}>
                      {/* UI-only — engine page-level visibility/password support needed to persist */}
                      <input
                        className="pages-drawer__input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Set page password…"
                      />
                    </div>
                  )}

                  <div className="pages-drawer__sep" />
                  <div className="pages-drawer__section-title">Open Graph</div>

                  <div className="pages-drawer__field">
                    <div className="pages-drawer__field-label"><span>OG Title</span></div>
                    <input className="pages-drawer__input" type="text" value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="Social share title…" />
                  </div>
                  <div className="pages-drawer__field">
                    <div className="pages-drawer__field-label"><span>OG Description</span></div>
                    <textarea className="pages-drawer__textarea" rows={2} value={ogDesc} onChange={(e) => setOgDesc(e.target.value)} placeholder="Social share description…" />
                  </div>
                </div>
              )}

              {/* ── Advanced Tab ── */}
              {tab === "advanced" && (
                <div className="pages-drawer__section">
                  <div className="pages-drawer__section-title">Robots Meta</div>

                  <div className="pages-drawer__tog-row">
                    <div className="pages-drawer__tog-info">
                      <div className="pages-drawer__tog-name">Allow indexing</div>
                      <div className="pages-drawer__tog-sub">Let search engines index this page</div>
                    </div>
                    <button
                      className={`pages-drawer__tog${!noIndex ? " pages-drawer__tog--on" : ""}`}
                      onClick={() => setNoIndex((v) => !v)}
                      aria-pressed={!noIndex}
                    />
                  </div>

                  <div className="pages-drawer__tog-row">
                    <div className="pages-drawer__tog-info">
                      <div className="pages-drawer__tog-name">Allow following links</div>
                      <div className="pages-drawer__tog-sub">Search engines follow outbound links</div>
                    </div>
                    <button
                      className={`pages-drawer__tog${!noFollow ? " pages-drawer__tog--on" : ""}`}
                      onClick={() => setNoFollow((v) => !v)}
                      aria-pressed={!noFollow}
                    />
                  </div>

                  <div className="pages-drawer__sep" />
                  <div className="pages-drawer__section-title">Custom Head Code</div>

                  <div className="pages-drawer__field">
                    <textarea
                      className="pages-drawer__textarea"
                      rows={3}
                      value={customHead}
                      onChange={(e) => setCustomHead(e.target.value)}
                      placeholder="<meta>, <link>, or <script> tags…"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* FIX C1: Discard confirm dialog */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose();
        }}
        title="Discard Changes"
        message="You have unsaved changes. Discard them?"
        confirmText="Discard"
        variant="danger"
      />
    </>
  );
};

// ─── Small helpers ────────────────────────────────────────────────────────────

const SeoCheck: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 10,
      color: ok ? "#22C55E" : "var(--aqb-text-muted)",
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: ok ? "#22C55E" : "rgba(255,255,255,0.15)",
        flexShrink: 0,
      }}
    />
    {label}
  </div>
);

export default PageSettingsScreen;
