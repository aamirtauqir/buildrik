# Pages Tab UX Audit — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all Critical, Medium, and Low UX issues identified in the Pages Tab audit, covering both `PagesTab` (sidebar) and `PageTabBar` (canvas), to bring both surfaces to production quality.

**Architecture:** Fix in order of severity. Pure-function fixes first (seoScore, slug), then hook fixes (usePageSettings isDirty, usePages error/guard), then component fixes (tab UIs, drawer a11y), then PageTabBar full remediation. Each task is independent and committable.

**Tech Stack:** React 18, TypeScript strict, Vitest, CSS modules (BEM-style `.pg-*` classes), CSS custom properties (`--aqb-*`, `--pg-*`)

**Design doc:** `docs/plans/2026-02-28-pages-tab-ux-audit.md` — all microcopy, exact CSS class names, and behavioral specifications are there. Read it before starting.

---

## Task 1: SEO Score noIndex Fix (C3)

**Why:** A page with noIndex=true currently scores 70–100/100 — false confidence. When noIndex is ON, the score must show 0 with a blocking warning.

**Files:**

- Modify: `src/editor/sidebar/tabs/pages/utils/seoScore.ts`
- Modify: `src/editor/sidebar/tabs/pages/settings/usePageSettings.ts` (score + checks wiring)
- Modify: `src/editor/sidebar/tabs/pages/settings/SeoTab.tsx` (conditional display)
- Modify: `src/editor/sidebar/tabs/PagesTab.css` (new CSS classes)
- Test: `src/editor/sidebar/tabs/pages/utils/seoScore.test.ts`

### Step 1: Write the failing tests

```typescript
// src/editor/sidebar/tabs/pages/utils/seoScore.test.ts
import { describe, it, expect } from "vitest";
import { calculateSeoScore } from "./seoScore";

describe("calculateSeoScore", () => {
  it("returns 0 when allowIndex is false, regardless of other fields", () => {
    expect(
      calculateSeoScore({
        title: "Perfect Title Length Here",
        desc: "This is a great meta description that is long enough to be useful for SEO purposes in Google.",
        slug: "my-page",
        allowIndex: false,
      })
    ).toBe(0);
  });

  it("scores normally when allowIndex is true", () => {
    expect(
      calculateSeoScore({
        title: "Perfect Title Length Here",
        desc: "This is a great meta description that is long enough to be useful for SEO purposes in Google.",
        slug: "my-page",
        allowIndex: true,
      })
    ).toBeGreaterThan(0);
  });

  it("returns 0 for empty inputs when allowIndex is true", () => {
    expect(calculateSeoScore({ title: "", desc: "", slug: "", allowIndex: true })).toBe(0);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd packages/new-editor-l2
npx vitest run src/editor/sidebar/tabs/pages/utils/seoScore.test.ts
```

Expected: FAIL — `calculateSeoScore` doesn't accept `allowIndex`.

### Step 3: Update `seoScore.ts`

```typescript
/** SEO score calculation — pure function, zero side effects */

interface SeoInputs {
  title: string;
  desc: string;
  slug: string;
  allowIndex: boolean;
}

export function calculateSeoScore({ title, desc, slug, allowIndex }: SeoInputs): number {
  if (!allowIndex) return 0;
  let score = 0;
  if (title.length >= 10 && title.length <= 60) score += 20;
  else if (title.length > 0) score += 10;
  if (slug && /^[a-z0-9-/]+$/.test(slug)) score += 20;
  if (desc.length >= 50 && desc.length <= 160) score += 30;
  else if (desc.length > 0) score += 15;
  if (title.length >= 30) score += 10;
  if (desc.length >= 100) score += 10;
  if (slug.length > 0 && slug !== "page-1") score += 10;
  return Math.min(score, 100);
}
```

### Step 4: Run tests to verify they pass

```bash
npx vitest run src/editor/sidebar/tabs/pages/utils/seoScore.test.ts
```

Expected: All 3 tests PASS.

### Step 5: Update `usePageSettings.ts` — wire allowIndex into score + checks

Find the `seoScore` useMemo (line ~264) and `seoChecks` (line ~268) and replace:

```typescript
// BEFORE
const seoScore = React.useMemo(
  () => calculateSeoScore({ title: seoTitle, desc: seoDesc, slug }),
  [seoTitle, seoDesc, slug]
);
const seoChecks = {
  titleSet: seoTitle.length >= 10,
  slugClean: !slugError && slug.length > 0,
  descSet: seoDesc.length >= 50,
};

// AFTER
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
```

Also update the `UsePageSettingsReturn` interface to add `indexingOn` to `seoChecks`:

```typescript
seoChecks: {
  titleSet: boolean;
  slugClean: boolean;
  indexingOn: boolean;
  descSet: boolean;
}
```

### Step 6: Update `SeoTab.tsx` — conditional noIndex display

Replace the SEO score section (the `pg-seo__score-row` div and tip) with:

```tsx
{
  /* ── 2. SEO SCORE ────────────────────────────────────────────────── */
}
{
  !s.allowIndex ? (
    <div className="pg-seo__noindex-warning" role="alert">
      <div className="pg-seo__noindex-msg">
        <strong>noIndex is ON</strong> — search engines won't index this page regardless of your SEO
        settings.
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
          aria-label={`SEO Score: ${s.seoScore} out of 100`}
        >
          <span className="pg-seo__score-num">{s.seoScore}</span>
          <span className="pg-seo__score-label">SEO Score</span>
        </div>
        <div className="pg-seo__score-checks">
          <SeoCheck ok={s.seoChecks.indexingOn} label="Allow indexing" hint="Required" />
          <SeoCheck ok={s.seoChecks.titleSet} label="Page title" hint="+20 pts" />
          <SeoCheck ok={s.seoChecks.descSet} label="Meta description" hint="+30 pts" />
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
  );
}
```

### Step 7: Add CSS for new classes in `PagesTab.css`

Append to the SEO section of the CSS:

```css
/* ── noIndex warning (replaces score widget when noIndex=ON) ─────── */
.pg-seo__noindex-warning {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.pg-seo__noindex-msg {
  font-size: var(--aqb-font-sm);
  color: var(--aqb-text-primary);
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pg-seo__noindex-fix {
  display: inline-flex;
  align-self: flex-start;
  background: none;
  border: none;
  color: var(--aqb-accent);
  font-size: var(--aqb-font-sm);
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.pg-seo__noindex-fix:hover {
  opacity: 0.8;
}
```

### Step 8: TypeScript check

```bash
npx tsc --noEmit
```

Expected: 0 errors.

### Step 9: Commit

```bash
git add \
  src/editor/sidebar/tabs/pages/utils/seoScore.ts \
  src/editor/sidebar/tabs/pages/utils/seoScore.test.ts \
  src/editor/sidebar/tabs/pages/settings/usePageSettings.ts \
  src/editor/sidebar/tabs/pages/settings/SeoTab.tsx \
  src/editor/sidebar/tabs/PagesTab.css
git commit -m "fix(seo-score): penalize noIndex — score=0 + blocking warning when indexing is OFF (C3)"
```

---

## Task 2: isDirty Tracking Fix — All 9 Fields

**Why:** Changing OG fields, visibility, password, noIndex, noFollow, or customHead does NOT activate the Save button because `savedSnapshot` only tracks 3 SEO fields. Users silently lose changes.

**Files:**

- Modify: `src/editor/sidebar/tabs/pages/settings/usePageSettings.ts`
- Modify: `src/editor/sidebar/tabs/pages/settings/PageSettingsDrawer.tsx`

### Step 1: Update `SaveState` type and `savedSnapshot` in `usePageSettings.ts`

The `SaveState` type currently is `"clean" | "dirty" | "saving" | "error"`. Remove `"dirty"` — dirty state is now derived from `isDirty` boolean.

```typescript
// CHANGE type at top of file
export type SaveState = "clean" | "saving" | "error";
```

Find the `savedSnapshot.current = JSON.stringify(...)` call inside the `useEffect` at line ~124, and also the one in `discard()` at line ~257. Replace BOTH with the full snapshot:

```typescript
// Full snapshot — tracks all 9 persisted fields
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
```

In `discard()`, replace the savedSnapshot assignment similarly:

```typescript
savedSnapshot.current = JSON.stringify({
  seoTitle: page.seo?.metaTitle ?? page.name,
  seoDesc: page.seo?.metaDescription ?? "",
  slug: page.slug ?? "",
  ogTitle: page.seo?.ogTitle ?? "",
  ogDesc: page.seo?.ogDescription ?? "",
  ogImageUrl: page.seo?.ogImage ?? null,
  visibility: vis as "live" | "hidden" | "password",
  password: (page as { settings?: { password?: string } }).settings?.password ?? "",
  allowIndex: !(page.seo as { noIndex?: boolean } | undefined)?.noIndex,
  allowFollow: !(page.seo as { noFollow?: boolean } | undefined)?.noFollow,
  customHead: page.head ?? "",
});
```

### Step 2: Replace `isDirty` useMemo and remove the `saveState`-as-dirty effect

Replace the existing `isDirty` useMemo (line ~131) and the dirty-tracking `useEffect` (line ~137) with:

```typescript
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
```

Delete the entire second `useEffect` block (the one that was calling `setSaveState("dirty")`).

### Step 3: Fix `setActiveTab` to use `isDirty` instead of saveState check

```typescript
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
```

### Step 4: Update `save()` — remove `setSaveState("dirty")` reference

In the `save()` function, keep `setSaveState("saving")` and `setSaveState("clean")` and `setSaveState("error")`. Remove any `setSaveState("dirty")` call if one exists.

After `setSaveState("clean")`, update the snapshot:

```typescript
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
```

### Step 5: Update `UsePageSettingsReturn` interface

Change `saveState: SaveState` — the type is now `"clean" | "saving" | "error"`. No other interface changes needed since `isDirty: boolean` is already exported.

### Step 6: Update `PageSettingsDrawer.tsx` — fix button logic

Find the `saveBtnLabel` and `saveBtnDisabled` declarations:

```typescript
// REPLACE with:
const saveBtnLabel =
  s.saveState === "saving"
    ? "Saving..."
    : s.saveState === "error"
      ? "Retry"
      : s.isDirty
        ? "Save changes"
        : "Saved ✓";

const saveBtnDisabled = (!s.isDirty && s.saveState !== "error") || s.saveState === "saving";
```

### Step 7: TypeScript check

```bash
npx tsc --noEmit
```

Expected: 0 errors. If you see type errors on `saveState === "dirty"`, search the entire codebase for that string and remove remaining usages.

### Step 8: Commit

```bash
git add \
  src/editor/sidebar/tabs/pages/settings/usePageSettings.ts \
  src/editor/sidebar/tabs/pages/settings/PageSettingsDrawer.tsx
git commit -m "fix(pages-settings): isDirty tracks all 9 fields — OG/Advanced changes now activate Save button"
```

---

## Task 3: Slug Destructive Warning (C4)

**Why:** Users change a live page's slug with no warning that existing links and bookmarks will break.

**Files:**

- Modify: `src/editor/sidebar/tabs/pages/settings/SeoTab.tsx`
- Modify: `src/editor/sidebar/tabs/PagesTab.css`

### Step 1: Update `SeoTab.tsx` — add Props and banner

The `SeoTab` receives `page: PageItem` as a prop already. Add the warning banner after the slug input and before the slug hint:

```tsx
{
  /* Slug destructive warning — shown when slug changes on a live page */
}
{
  s.slug !== page.slug && page.status === "live" && !s.slugError && (
    <div className="pg-seo__slug-warning" role="alert">
      ⚠️ Changing this URL will break existing links, bookmarks, and search engine results for this
      page. Consider setting up a redirect in your hosting settings after saving.
    </div>
  );
}
```

Place this BETWEEN the slug input wrapper and the slug hint div. The current structure is:

```tsx
<div className="pg-seo__slug-wrap">...</div>;
{
  s.slugError ? (
    <div className="pg-seo__error" role="alert">
      {s.slugError}
    </div>
  ) : (
    <div id="seo-slug-hint" className="pg-seo__hint">
      ...
    </div>
  );
}
```

Insert the warning banner between `slug-wrap` and the error/hint conditional:

```tsx
<div className="pg-seo__slug-wrap">...</div>;

{
  s.slug !== page.slug && page.status === "live" && !s.slugError && (
    <div className="pg-seo__slug-warning" role="alert">
      ⚠️ Changing this URL will break existing links, bookmarks, and search engine results for this
      page. Consider setting up a redirect in your hosting settings after saving.
    </div>
  );
}

{
  s.slugError ? (
    <div className="pg-seo__error" role="alert">
      {s.slugError}
    </div>
  ) : (
    <div id="seo-slug-hint" className="pg-seo__hint">
      ...
    </div>
  );
}
```

### Step 2: Add CSS in `PagesTab.css`

```css
/* ── Slug destructive warning ────────────────────────────────────── */
.pg-seo__slug-warning {
  margin-top: 6px;
  padding: 8px 10px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 6px;
  font-size: var(--aqb-font-xs);
  color: var(--aqb-text-primary);
  line-height: 1.5;
}
```

### Step 3: TypeScript check

```bash
npx tsc --noEmit
```

### Step 4: Commit

```bash
git add \
  src/editor/sidebar/tabs/pages/settings/SeoTab.tsx \
  src/editor/sidebar/tabs/PagesTab.css
git commit -m "fix(seo-tab): add destructive warning when changing live page URL slug (C4)"
```

---

## Task 4: Password Info Banner + Head Code Warning (C1)

**Why:** Users who enable password protect get no feedback about server-side enforcement. Custom head code textarea has no security warning.

**Files:**

- Modify: `src/editor/sidebar/tabs/pages/settings/AdvancedTab.tsx`
- Modify: `src/editor/sidebar/tabs/PagesTab.css`

### Step 1: Add info banner in `AdvancedTab.tsx`

Inside the `pg-advanced__password-wrap` div (the one that already shows the password input), add the info banner at the END (after the "Password is required" error div):

```tsx
{
  /* ── Password protection info banner ────────────────────────────── */
}
<div className="pg-advanced__info-banner" role="note">
  ℹ️ Password protection requires server-side enforcement. Verify your hosting configuration
  supports this feature before relying on it to protect sensitive content.
</div>;
```

The full `pg-advanced__password-wrap` should look like:

```tsx
{s.visibility === "password" && (
  <div id="pg-password-field" className="pg-advanced__password-wrap">
    <label ...>Access Password <span>Required</span></label>
    <div className="pg-advanced__password-row">
      ...input, show/hide, copy buttons...
    </div>
    {!s.password.trim() && (
      <div className="pg-advanced__error" role="alert">
        Password is required before saving.
      </div>
    )}
    {/* Info banner — always shown when password protect is ON */}
    <div className="pg-advanced__info-banner" role="note">
      ℹ️ Password protection requires server-side enforcement. Verify your
      hosting configuration supports this feature before relying on it to
      protect sensitive content.
    </div>
  </div>
)}
```

### Step 2: Add head code warning banner in `AdvancedTab.tsx`

In the Custom Head Code section, add a warning banner ABOVE the textarea:

```tsx
{/* ── Custom Head Code ─────────────────────────────────────────────── */}
<div className="pg-advanced__section">
  <div className="pg-advanced__section-title">Custom Head Code</div>
  {/* Warning banner — always visible */}
  <div className="pg-advanced__warn-banner" role="note">
    ⚠️ Custom code runs on every page load. Incorrect HTML can break your
    page layout. Only add code from trusted sources.
  </div>
  <textarea ... />
  ...
</div>
```

### Step 3: Add CSS in `PagesTab.css`

```css
/* ── Advanced tab banners ────────────────────────────────────────── */
.pg-advanced__info-banner {
  margin-top: 10px;
  padding: 8px 10px;
  background: rgba(59, 130, 246, 0.08);
  border-left: 3px solid rgba(59, 130, 246, 0.5);
  border-radius: 0 6px 6px 0;
  font-size: var(--aqb-font-xs);
  color: var(--aqb-text-secondary);
  line-height: 1.5;
}

.pg-advanced__warn-banner {
  margin-bottom: 10px;
  padding: 8px 10px;
  background: rgba(245, 158, 11, 0.08);
  border-left: 3px solid rgba(245, 158, 11, 0.5);
  border-radius: 0 6px 6px 0;
  font-size: var(--aqb-font-xs);
  color: var(--aqb-text-secondary);
  line-height: 1.5;
}
```

### Step 4: TypeScript check

```bash
npx tsc --noEmit
```

### Step 5: Commit

```bash
git add \
  src/editor/sidebar/tabs/pages/settings/AdvancedTab.tsx \
  src/editor/sidebar/tabs/PagesTab.css
git commit -m "fix(advanced-tab): add password-protect engine warning banner + head code security warning (C1)"
```

---

## Task 5: Panel Error State + Retry (C7)

**Why:** When the composer fails to sync pages, the UI silently shows nothing. The `.pages-error` CSS exists but is never rendered.

**Files:**

- Modify: `src/editor/sidebar/tabs/pages/usePages.ts`
- Modify: `src/editor/sidebar/tabs/PagesTab.tsx`
- Modify: `src/editor/sidebar/tabs/PagesTab.css`

### Step 1: Add error state to `usePages.ts`

Add two new state variables at the top of `usePages`:

```typescript
const [loadError, setLoadError] = React.useState<string | null>(null);
const [retryKey, setRetryKey] = React.useState(0);
```

Update the `sync` try/catch block inside the `useEffect`:

```typescript
const sync = () => {
  try {
    const raw = composer.elements.getAllPages();
    const active = composer.elements.getActivePage();
    setActivePageId(active?.id ?? null);
    setPages(
      raw.map((p) => ({
        // ... existing mapping unchanged
      }))
    );
    setLoadError(null); // clear error on success
  } catch {
    setLoadError("Couldn't load your pages");
  }
};
```

Add `retryKey` to the dependency array of the sync `useEffect` so incrementing it re-triggers sync:

```typescript
}, [composer, retryKey]); // add retryKey
```

Add a `retrySync` callback:

```typescript
const retrySync = React.useCallback(() => {
  setRetryKey((k) => k + 1);
}, []);
```

Add `loadError` and `retrySync` to `UsePagesReturn` interface:

```typescript
export interface UsePagesReturn {
  // ... existing fields ...
  loadError: string | null;
  retrySync: () => void;
}
```

Add them to the return object at the bottom of `usePages`.

### Step 2: Update `PagesTab.tsx` — render error state

In the `PagesTab` component, in the render section where `PageList` is shown, add an error guard:

```tsx
{/* Error state */}
{p.loadError ? (
  <div className="pages-error" role="alert" aria-live="assertive">
    <div className="pages-error__msg">{p.loadError}</div>
    <div className="pages-error__sub">Check your connection and try again.</div>
    <button className="pages-error__btn" onClick={p.retrySync}>
      Try again
    </button>
  </div>
) : settingsPage ? (
  <PageSettingsDrawer ... />
) : (
  <PageList ... />
)}
```

Wrap the entire conditional — `loadError` takes priority over everything.

### Step 3: Add missing CSS in `PagesTab.css`

The CSS file already has `.pages-error` and `.pages-error__btn`. Add the missing `.pages-error__sub`:

```css
.pages-error__sub {
  font-size: var(--aqb-font-xs);
  color: var(--aqb-text-muted);
  margin-top: 4px;
  margin-bottom: 12px;
}
```

### Step 4: TypeScript check

```bash
npx tsc --noEmit
```

### Step 5: Commit

```bash
git add \
  src/editor/sidebar/tabs/pages/usePages.ts \
  src/editor/sidebar/tabs/PagesTab.tsx \
  src/editor/sidebar/tabs/PagesTab.css
git commit -m "fix(pages): wire panel error state + retry button — sync failures are no longer silent (C7)"
```

---

## Task 6: Homepage Guards + Update Toast

**Why:** `setHomepage` has no guard against external-link pages. No toast informs user about nav menu impact.

**Files:**

- Modify: `src/editor/sidebar/tabs/pages/usePages.ts`

### Step 1: Update `setHomepage` in `usePages.ts`

```typescript
const setHomepage = React.useCallback(
  (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (page?.status === "external") {
      addToast({
        message: "External link pages can't be set as the homepage.",
        variant: "warning",
        duration: 4000,
      });
      setContextMenu(null);
      return;
    }
    composer?.elements.setHomePage?.(pageId);
    setContextMenu(null);
    addToast({
      message: "Homepage updated. Your navigation menu may need updating manually.",
      variant: "success",
      duration: 4000,
    });
  },
  [composer, pages, addToast]
);
```

### Step 2: Extend delete undo toast from 5000ms to 8000ms

In `deletePage` in `usePages.ts`, change `duration: 5000` to `duration: 8000`:

```typescript
addToast({
  message: `"${name}" deleted`,
  variant: "info",
  duration: 8000, // was 5000
  action: {
    label: "Undo",
    onClick: () => {
      composer.history?.undo?.();
    },
  },
});
```

### Step 3: TypeScript check

```bash
npx tsc --noEmit
```

### Step 4: Commit

```bash
git add src/editor/sidebar/tabs/pages/usePages.ts
git commit -m "fix(pages): add external-link guard on setHomepage + nav menu toast + extend undo to 8s (EC-12)"
```

---

## Task 7: Clipboard Error Handling + Social Tab Counters

**Why:** `copyPageLink` silently fails when clipboard API is denied. OG fields have no character counters.

**Files:**

- Modify: `src/editor/sidebar/tabs/pages/usePages.ts`
- Modify: `src/editor/sidebar/tabs/pages/settings/SocialTab.tsx`
- Modify: `src/editor/sidebar/tabs/PagesTab.css`

### Step 1: Fix `copyPageLink` in `usePages.ts`

Add `.catch()` to the clipboard call:

```typescript
navigator.clipboard
  .writeText(url)
  .then(() => {
    const msg = domain
      ? `Link copied: ${url}`
      : `Link copied: ${url} · Connect a custom domain in Settings →`;
    addToast({ message: msg, variant: "success", duration: 5000 });
  })
  .catch(() => {
    addToast({ message: "Couldn't copy link — try again.", variant: "error", duration: 3000 });
  });
```

### Step 2: Add OG char counters in `SocialTab.tsx`

For OG Title field, add a counter after the label:

```tsx
{
  /* ── OG TITLE ─────────────────────────────────────────────────────── */
}
<div className="pg-social__field">
  <div className="pg-social__field-header">
    <label className="pg-social__label" htmlFor="og-title">
      Social Title
    </label>
    <span
      className={`pg-social__char-counter${s.ogTitle.length >= 90 ? " pg-social__char-counter--warn" : ""}`}
    >
      {s.ogTitle.length}/95
    </span>
  </div>
  <input
    id="og-title"
    className="pg-social__input"
    value={s.ogTitle}
    onChange={(e) => s.setOgTitle(e.target.value.slice(0, 95))}
    placeholder={s.seoTitle ? `Using SEO title: "${s.seoTitle}"` : "Social share title..."}
    maxLength={95}
  />
</div>;
```

For OG Description:

```tsx
{
  /* ── OG DESC ──────────────────────────────────────────────────────── */
}
<div className="pg-social__field">
  <div className="pg-social__field-header">
    <label className="pg-social__label" htmlFor="og-desc">
      Social Description
    </label>
    <span
      className={`pg-social__char-counter${s.ogDesc.length >= 190 ? " pg-social__char-counter--warn" : ""}`}
    >
      {s.ogDesc.length}/200
    </span>
  </div>
  <textarea
    id="og-desc"
    className="pg-social__textarea"
    rows={3}
    value={s.ogDesc}
    onChange={(e) => s.setOgDesc(e.target.value.slice(0, 200))}
    placeholder={
      s.seoDesc
        ? `Using SEO description: "${s.seoDesc.slice(0, 40)}…"`
        : "Social share description..."
    }
    maxLength={200}
  />
  <div className="pg-social__hint">
    If left blank, your SEO description will be used as fallback.
  </div>
</div>;
```

Add platform label after the preview card:

```tsx
{
  /* After the pg-social__preview div */
}
<div className="pg-social__preview-platform">Preview: Facebook / LinkedIn (1200×630)</div>;
```

### Step 3: Add CSS

```css
/* ── Social tab field header ─────────────────────────────────────── */
.pg-social__field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.pg-social__char-counter {
  font-size: var(--aqb-font-xs);
  color: var(--aqb-text-muted);
  font-variant-numeric: tabular-nums;
}

.pg-social__char-counter--warn {
  color: var(--pg-hidden); /* amber */
}

.pg-social__preview-platform {
  font-size: var(--aqb-font-xs);
  color: var(--aqb-text-muted);
  text-align: center;
  margin-top: 6px;
  margin-bottom: 12px;
}
```

### Step 4: TypeScript check

```bash
npx tsc --noEmit
```

### Step 5: Commit

```bash
git add \
  src/editor/sidebar/tabs/pages/usePages.ts \
  src/editor/sidebar/tabs/pages/settings/SocialTab.tsx \
  src/editor/sidebar/tabs/PagesTab.css
git commit -m "fix(pages): clipboard error handling + OG char counters + platform label"
```

---

## Task 8: Drawer Accessibility — Auto-focus + ARIA Tab Pattern

**Why:** Settings drawer has no auto-focus on open. Tab buttons lack `aria-controls`. SEO score has no `aria-live`.

**Files:**

- Modify: `src/editor/sidebar/tabs/pages/settings/PageSettingsDrawer.tsx`

### Step 1: Add auto-focus useEffect in `PageSettingsDrawer.tsx`

Add after the existing `useEffect` for ⌘S:

```typescript
// Auto-focus first field when drawer opens
const drawerRef = React.useRef<HTMLDivElement>(null);
React.useEffect(() => {
  const timer = setTimeout(() => {
    const first = drawerRef.current?.querySelector<HTMLElement>(
      "input, textarea, button:not(.pg-drawer__back):not(.pg-drawer__save)"
    );
    first?.focus();
  }, 230); // after 220ms slide-in animation
  return () => clearTimeout(timer);
}, []); // runs once on mount
```

Add `ref={drawerRef}` to the outer `.pg-drawer` div:

```tsx
<div
  ref={drawerRef}
  className="pg-drawer"
  role="dialog"
  aria-label={`${page.name} Settings`}
  aria-modal="true"
>
```

### Step 2: Add ARIA tab pattern to tab buttons

In the `TAB_LABELS.map` section, update each tab button:

```tsx
{
  TAB_LABELS.map(({ id, label }) => (
    <button
      key={id}
      id={`pg-tab-${id}`}
      role="tab"
      aria-selected={s.activeTab === id}
      aria-controls={`pg-panel-${id}`}
      className={`pg-drawer__tab${s.activeTab === id ? " pg-drawer__tab--active" : ""}`}
      onClick={() => s.setActiveTab(id)}
    >
      {label}
      {s.isDirty && s.activeTab === id && (
        <span className="pg-drawer__tab-dot" aria-hidden="true" />
      )}
    </button>
  ));
}
```

Update the tabpanel div to have matching `id`:

```tsx
<div
  id={`pg-panel-${s.activeTab}`}
  className="pg-drawer__body aqb-scrollbar"
  role="tabpanel"
  aria-labelledby={`pg-tab-${s.activeTab}`}
>
```

### Step 3: Fix `UnsavedDialog` — auto-focus "Stay" button

In the `UnsavedDialog` component, add auto-focus to the Stay button:

```tsx
// Add ref to Stay button
const stayRef = React.useRef<HTMLButtonElement>(null);
React.useEffect(() => {
  stayRef.current?.focus();
}, []);

// In render:
<button ref={stayRef} className="pg-unsaved-btn pg-unsaved-btn--ghost" onClick={onStay}>
  Stay
</button>;
```

### Step 4: TypeScript check

```bash
npx tsc --noEmit
```

### Step 5: Commit

```bash
git add src/editor/sidebar/tabs/pages/settings/PageSettingsDrawer.tsx
git commit -m "fix(pages-drawer): auto-focus on open + ARIA tab pattern + UnsavedDialog focus Stay button"
```

---

## Task 9: PageRow Accessibility + Drag Handle + EC-06 Slug Fix

**Why:** Kebab button missing `aria-expanded`. Drag handle has misleading cursor. Slug "/" not allowed.

**Files:**

- Modify: `src/editor/sidebar/tabs/pages/components/PageRow.tsx`
- Modify: `src/editor/sidebar/tabs/pages/components/PageList.tsx`
- Modify: `src/editor/sidebar/tabs/pages/utils/slug.ts`
- Test: `src/editor/sidebar/tabs/pages/utils/slug.test.ts`

### Step 1: Write slug "/" test

```typescript
// src/editor/sidebar/tabs/pages/utils/slug.test.ts
import { describe, it, expect } from "vitest";
import { validateSlug, normalizeSlug } from "./slug";

describe("validateSlug", () => {
  it("allows '/' as a valid homepage slug", () => {
    expect(validateSlug("/")).toBeNull();
  });

  it("rejects empty string", () => {
    expect(validateSlug("")).not.toBeNull();
  });

  it("rejects uppercase", () => {
    expect(validateSlug("My-Page")).not.toBeNull();
  });

  it("allows valid slug", () => {
    expect(validateSlug("my-page")).toBeNull();
  });
});
```

### Step 2: Run to verify "/" test fails

```bash
npx vitest run src/editor/sidebar/tabs/pages/utils/slug.test.ts
```

### Step 3: Update `validateSlug` in `slug.ts`

Read the current `slug.ts` file first. Then add a "/" special case at the top of `validateSlug`:

```typescript
export function validateSlug(slug: string): string | null {
  if (slug === "/") return null; // valid homepage root slug
  if (!slug.trim()) return "Slug is required.";
  // ... rest of existing validation unchanged
}
```

### Step 4: Run slug tests to verify they pass

```bash
npx vitest run src/editor/sidebar/tabs/pages/utils/slug.test.ts
```

### Step 5: Update `PageRow.tsx` — kebab aria-expanded + drag handle

For the kebab button, add `aria-expanded`:

```tsx
<button
  className="pg-row__act"
  title="More options"
  aria-label={`More options for ${page.name}`}
  aria-expanded={/* need to know if menu is open */}
  onClick={handleContextMenuClick}
>
```

The `PageRow` component doesn't currently receive a prop for whether its context menu is open. Add a prop:

```typescript
interface Props {
  // ... existing props
  isContextMenuOpen?: boolean;
}
```

Then in the kebab button:

```tsx
aria-expanded={isContextMenuOpen ?? false}
aria-haspopup="menu"
```

Update `PageList.tsx` to pass `isContextMenuOpen` — read `PageList.tsx` first to understand the current prop structure, then add:

```tsx
// In PageList, track which page has its context menu open
// Pass it down to PageRow via isContextMenuOpen={contextMenu?.pageId === page.id}
```

For the drag handle, add tooltip and cursor style:

```tsx
<div
  className="pg-row__drag"
  aria-hidden="true"
  title="Page reordering coming soon"
  style={{ cursor: "default" }}
>
```

### Step 6: Add search empty state to `PageList.tsx`

Read `PageList.tsx` to understand current structure. Find where the filtered page list is rendered (there's likely a `pages.filter(...)` or similar). After the filter, if result is empty and a search query is active, render:

```tsx
{filteredPages.length === 0 && searchQuery ? (
  <div className="pages-empty-search">
    <div className="pages-empty-search__msg">No pages match "{searchQuery}"</div>
    <button
      className="pages-empty-search__clear"
      onClick={() => setSearchQuery("")}
    >
      Clear search
    </button>
  </div>
) : (
  filteredPages.map((page) => (
    <PageRow key={page.id} ... />
  ))
)}
```

Add CSS:

```css
/* ── Search empty state ──────────────────────────────────────────── */
.pages-empty-search {
  padding: 24px 16px;
  text-align: center;
}

.pages-empty-search__msg {
  font-size: var(--aqb-font-sm);
  color: var(--aqb-text-muted);
  margin-bottom: 8px;
}

.pages-empty-search__clear {
  background: none;
  border: 1px solid var(--aqb-border);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: var(--aqb-font-xs);
  color: var(--aqb-text-secondary);
  cursor: pointer;
}

.pages-empty-search__clear:hover {
  background: var(--aqb-surface-3);
}
```

### Step 7: TypeScript check

```bash
npx tsc --noEmit
```

### Step 8: Commit

```bash
git add \
  src/editor/sidebar/tabs/pages/utils/slug.ts \
  src/editor/sidebar/tabs/pages/utils/slug.test.ts \
  src/editor/sidebar/tabs/pages/components/PageRow.tsx \
  src/editor/sidebar/tabs/pages/components/PageList.tsx \
  src/editor/sidebar/tabs/PagesTab.css
git commit -m "fix(pages): slug '/' allowed, aria-expanded on kebab, drag handle cursor, search empty state (EC-06)"
```

---

## Task 10: PageTabBar Full Remediation

**Why:** `PageTabBar` is a completely separate component with none of the safety guards, ARIA roles, keyboard support, or UX consistency of `PagesTab`. This is the highest-effort task.

**Files:**

- Modify: `src/editor/shell/PageTabBar.tsx`

This component needs a full rewrite of its internals. Read the current file before starting. The overall structure stays (tabs + context menu), but internals change significantly.

### Step 1: Add missing state

```typescript
const [deleteConfirmPageId, setDeleteConfirmPageId] = React.useState<string | null>(null);
```

### Step 2: Subscribe to all page events (not just PROJECT_CHANGED)

```typescript
const evs = [
  EVENTS.PROJECT_CHANGED,
  "page:created",
  "page:deleted",
  "page:changed",
  "page:updated",
] as const;
evs.forEach((ev) => composer.on(ev as string, syncPages));
return () => {
  evs.forEach((ev) => composer.off(ev as string, syncPages));
};
```

### Step 3: Fix context menu outside-click handler

The current handler uses `document.addEventListener("click", ...)`. Change to `mousedown` with portal escape hatch, matching the PagesTab fix:

```typescript
React.useEffect(() => {
  if (!contextMenu) return;
  const handle = (e: MouseEvent) => {
    if ((e.target as Element).closest?.(".ptb-ctx-menu")) return;
    setContextMenu(null);
  };
  document.addEventListener("mousedown", handle);
  return () => document.removeEventListener("mousedown", handle);
}, [contextMenu]);
```

### Step 4: Fix delete handler — add guards + confirm dialog

```typescript
const handleDeleteRequest = (pageId: string) => {
  if (!composer || pages.length <= 1) return;
  const page = pages.find((p) => p.id === pageId);
  if (!page) return;
  if (page.isHome) {
    addToast({
      message: "Set another page as Homepage before deleting this one.",
      variant: "warning",
      duration: 4000,
    });
    setContextMenu(null);
    return;
  }
  setDeleteConfirmPageId(pageId);
  setContextMenu(null);
};

const confirmDelete = () => {
  if (!deleteConfirmPageId || !composer) return;
  const page = pages.find((p) => p.id === deleteConfirmPageId);
  const pageName = page?.name ?? "Page";
  composer.elements.deletePage(deleteConfirmPageId);
  setDeleteConfirmPageId(null);
  addToast({
    message: `"${pageName}" deleted`,
    variant: "info",
    duration: 8000,
    action: { label: "Undo", onClick: () => composer.history?.undo?.() },
  });
};
```

### Step 5: Fix duplicate naming — remove parens

```typescript
const handleDuplicate = (pageId: string) => {
  if (!composer) return;
  const page = pages.find((p) => p.id === pageId);
  if (page) {
    // Match PagesTab pattern: "[Name] Copy" not "[Name] (Copy)"
    composer.elements.createPage(`${page.name} Copy`);
  }
  setContextMenu(null);
};
```

### Step 6: Add ARIA roles and keyboard support to tab divs

Replace `<div>` tabs with proper semantic elements:

```tsx
<div
  style={tabsContainerStyles}
  role="tablist"
  aria-label="Site pages"
  onKeyDown={(e) => {
    // Arrow key navigation between tabs
    const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
    const idx = tabs.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      tabs[(idx + 1) % tabs.length]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      tabs[(idx - 1 + tabs.length) % tabs.length]?.focus();
    }
  }}
>
  {pages.map((page) => (
    <div
      key={page.id}
      role="tab"
      tabIndex={page.id === activePageId ? 0 : -1}
      aria-selected={page.id === activePageId}
      aria-label={`${page.name}${page.isHome ? ", Homepage" : ""}`}
      onClick={() => handleTabClick(page.id)}
      onContextMenu={(e) => handleContextMenu(e, page.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleTabClick(page.id);
        }
        if (e.key === "F2") {
          e.preventDefault();
          handleRename(page.id);
        }
        if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
          e.preventDefault();
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setContextMenu({ pageId: page.id, x: rect.left, y: rect.bottom });
        }
      }}
      style={{
        ...tabStyles,
        ...(page.id === activePageId ? activeTabStyles : {}),
      }}
    >
      ...existing tab content...
    </div>
  ))}
</div>
```

### Step 7: Add ARIA to context menu

The context menu div needs `role="menu"` and menu items need `role="menuitem"`:

```tsx
{
  contextMenu &&
    createPortal(
      <div
        className="ptb-ctx-menu"
        style={{ ...menuStyles, left: contextMenu.x, top: contextMenu.y }}
        role="menu"
        aria-label={`Options for ${pages.find((p) => p.id === contextMenu.pageId)?.name ?? "page"}`}
        onKeyDown={(e) => {
          if (e.key === "Escape") setContextMenu(null);
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const items = Array.from(
              (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="menuitem"]')
            );
            const idx = items.indexOf(document.activeElement as HTMLElement);
            const next =
              e.key === "ArrowDown"
                ? (idx + 1) % items.length
                : (idx - 1 + items.length) % items.length;
            items[next]?.focus();
          }
        }}
      >
        <button
          style={menuItemStyles}
          role="menuitem"
          onClick={() => handleRename(contextMenu.pageId)}
        >
          Rename
        </button>
        <button
          style={menuItemStyles}
          role="menuitem"
          onClick={() => handleDuplicate(contextMenu.pageId)}
        >
          Duplicate
        </button>
        <button
          style={menuItemStyles}
          role="menuitem"
          onClick={() => handleSetHome(contextMenu.pageId)}
        >
          Set as Home
        </button>
        {pages.length > 1 && (
          <button
            style={{ ...menuItemStyles, color: "#ef4444" }}
            role="menuitem"
            onClick={() => handleDeleteRequest(contextMenu.pageId)}
          >
            Delete
          </button>
        )}
      </div>,
      document.body
    );
}
```

Add `import { createPortal } from "react-dom";` to imports.
Add class `"ptb-ctx-menu"` to the menu for the outside-click `closest()` check.

### Step 8: Add ConfirmDialog import and render

Import `ConfirmDialog` from the shared UI:

```typescript
import { ConfirmDialog } from "../../shared/ui/Modal";
```

Add the confirm dialog render at the end of the component JSX:

```tsx
<ConfirmDialog
  isOpen={!!deleteConfirmPageId}
  onClose={() => setDeleteConfirmPageId(null)}
  onConfirm={confirmDelete}
  title={`Delete "${pages.find((p) => p.id === deleteConfirmPageId)?.name}"?`}
  message="All content on this page will be permanently removed. You can undo immediately after."
  confirmText="Delete Page"
  variant="danger"
/>
```

### Step 9: TypeScript check

```bash
npx tsc --noEmit
```

Fix any type errors. Common issues: `createPortal` import, `ConfirmDialog` props shape.

### Step 10: Run all tests

```bash
npm run test
```

### Step 11: Commit

```bash
git add src/editor/shell/PageTabBar.tsx
git commit -m "fix(page-tab-bar): full remediation — ARIA, keyboard nav, homepage guard, confirm dialog, 'Copy' naming, 8s toast (C5, cross-surface consistency)"
```

---

## Task 11: Final — Google Preview Domain + Tab Dot Fix

**Why:** Google preview shows hardcoded "yourdomain.com" instead of connected domain. Tab dot shows on wrong tab after isDirty change.

**Files:**

- Modify: `src/editor/sidebar/tabs/pages/settings/SeoTab.tsx`
- Modify: `src/editor/sidebar/tabs/pages/settings/PageSettingsDrawer.tsx`

### Step 1: Fix domain in SeoTab

The `SeoTab` receives `page: PageItem` and `s: UsePageSettingsReturn`. The composer is not directly available. Options:

- Add a `domain?: string` prop to `SeoTab`
- Or pass it through `UsePageSettingsReturn`

Simplest: Add `domain` to `UsePageSettingsReturn`:

In `usePageSettings.ts`:

```typescript
const domain = (composer as { project?: { domain?: string } })?.project?.domain ?? null;
// Add to return:
return {
  ...existing,
  domain,
};
```

In `UsePageSettingsReturn` interface:

```typescript
domain: string | null;
```

In `SeoTab.tsx`:

```typescript
const domain = s.domain ?? "yourdomain.com";
// Use `domain` instead of hardcoded "yourdomain.com" in the Google preview and slug prefix
```

### Step 2: Fix tab dot — show on all tabs when isDirty (not just active tab)

The current tab dot logic shows dot only on the active tab:

```tsx
{
  s.saveState === "dirty" && s.activeTab === id && (
    <span className="pg-drawer__tab-dot" aria-hidden="true" />
  );
}
```

Change to show on the active tab when the form is dirty:

```tsx
{
  s.isDirty && s.activeTab === id && <span className="pg-drawer__tab-dot" aria-hidden="true" />;
}
```

### Step 3: TypeScript check + full test run

```bash
npx tsc --noEmit
npm run test
```

Expected: 0 TypeScript errors, all tests passing.

### Step 4: Commit

```bash
git add \
  src/editor/sidebar/tabs/pages/settings/SeoTab.tsx \
  src/editor/sidebar/tabs/pages/settings/PageSettingsDrawer.tsx \
  src/editor/sidebar/tabs/pages/settings/usePageSettings.ts
git commit -m "fix(pages): real domain in Google preview + tab dot uses isDirty"
```

---

## Task 12: Status Badge Tooltips

**Why:** Status badges (Live, Draft, Hidden, 🔒) have no tooltip explaining what each means.

**Files:**

- Modify: `src/editor/sidebar/tabs/pages/components/PageRow.tsx`

### Step 1: Add tooltip helper in `PageRow.tsx`

```typescript
function statusTooltip(page: PageItem): string {
  switch (page.status) {
    case "live":
      return "This page is publicly visible";
    case "draft":
      return "This page is a draft — not visible to visitors";
    case "hidden":
      return "This page is hidden from navigation menus";
    case "password":
      return "This page requires a password to access";
    case "error":
      return "This page has a configuration error";
    case "external":
      return "This opens an external URL";
    default:
      return "";
  }
}
```

Add `title` to the status badge:

```tsx
<span
  className={`pg-row__status pg-row__status--${page.status ?? "live"}`}
  title={statusTooltip(page)}
>
  {statusLabel(page)}
</span>
```

### Step 2: TypeScript check + commit

```bash
npx tsc --noEmit
git add src/editor/sidebar/tabs/pages/components/PageRow.tsx
git commit -m "fix(page-row): add descriptive tooltip to all status badges"
```

---

## Final Verification

After all tasks are committed, run the full test suite and type check:

```bash
cd packages/new-editor-l2
npm run test
npx tsc --noEmit
```

Then do a browser smoke test (use Playwright MCP or manual):

1. Open the editor → Pages tab
2. Right-click a page → verify all 6 context menu actions work (the C0 fix from the session start)
3. Open page settings → change OG title only → verify Save button activates
4. Enable noIndex → switch to SEO tab → verify score shows 0 with warning
5. Change slug on live page → verify amber warning appears
6. Enable password protect → verify info banner appears
7. Delete a page from sidebar → verify confirm dialog + undo toast (8s)
8. Delete a page from canvas tab bar → verify confirm dialog + undo toast (8s)
9. Set homepage → verify toast about nav menu
10. Open page settings → press ⌘S → verify saves correctly

---

_Plan created: 2026-02-28. Based on audit doc: `docs/plans/2026-02-28-pages-tab-ux-audit.md`_
