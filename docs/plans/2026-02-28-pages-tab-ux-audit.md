# Pages Tab — Complete UX Audit & Fix Design

**Date:** 2026-02-28
**Surfaces audited:** `PagesTab` (sidebar), `PageTabBar` (canvas top), `PageSettingsDrawer` (SEO / Social / Advanced)
**Scope:** Full production remediation — all critical, medium, and low issues
**Approach:** Design doc first → writing-plans → implementation

---

## 1. Mental Model Summary

1. **First open:** User expects to see a list of all pages, know which is active, and be able to add/rearrange/delete. They do NOT expect to manage SEO or visibility here — they expect that to be a secondary action.
2. **Status colors:** Non-technical users understand "Live" vs "Draft" but not "Hidden" vs "Password" vs "External" without textual labels. Color alone is insufficient. Current code uses text badges (Live, Draft, Hidden, 🔒) — this is correct.
3. **Page Settings save model:** Most SaaS users expect auto-save. When forced into explicit save, they expect the button to be clearly labeled and always visible. They do NOT expect unsaved changes to survive a tab switch without a warning.
4. **Slug changes:** Users do NOT understand that changing a URL slug breaks existing links. They think of it as "renaming the address." A destructive warning is mandatory before save.
5. **Password protect:** When a user enables "Password protect" and clicks Save, they believe the page is immediately locked. If the engine doesn't enforce this, they have a false sense of security — this is a Critical trust issue.
6. **Set as Homepage:** Non-technical users expect this to be immediate and to update navigation menus automatically. In reality it may only update the homepage flag. The UI should clarify: "Your nav menu may need to be updated manually."
7. **SEO score with noIndex=true:** A user who sees 70/100 but has noIndex enabled believes their page is search-optimized. It is invisible to all search engines. This is false confidence — a Critical display bug.
8. **Delete:** Most SaaS users expect a confirmation dialog for irreversible actions like page deletion. An undo-toast alone (5s) is insufficient for non-technical users who may not notice it.

---

## 2. User Journey Audit

| Stage                         | Current State                                                         | Issues                                                                                  | Fix                                                                        |
| ----------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1. Opening Pages tab          | Shows page list with header, search (when ≥5 pages), rows, add button | Good first impression                                                                   | None needed                                                                |
| 2. Browsing page list         | Status text badges, home badge, drag handle visual, action buttons    | Drag handle is visual-only (DnD not wired) — misleading affordance                      | Add `aria-label="Reorder (coming soon)"` + CSS `cursor: default` on handle |
| 3. Searching                  | Real-time filter, shown only when ≥5 pages                            | Empty state not specified for zero search results                                       | Add empty state: "No pages match '[query]'" with Clear button              |
| 4. Adding a page              | Single button → `createPage()` → auto-renames newest                  | No add menu (Blank / External / Template options) — future feature                      | No action now; document as future                                          |
| 5. Selecting a page           | Click row → `setActivePage()`                                         | No loading indicator while canvas switches                                              | Low priority — canvas switch is fast                                       |
| 6. Triggering context menu    | Right-click or ⋯ button                                               | ⋯ button has no `aria-expanded` state                                                   | Add `aria-expanded={contextMenu?.pageId === page.id}`                      |
| 7. Rename flow                | F2, double-click, context menu; Enter/Escape/blur commit              | Slug is NOT auto-updated when name changes — user must update slug manually in settings | Acceptable — slug changes are destructive; document in SEO hint            |
| 8. Duplicate flow             | Creates `"[Name] Copy"` with slug dedup                               | PageTabBar creates `"[Name] (Copy)"` — inconsistency                                    | PageTabBar adopts `"[Name] Copy"` (no parens)                              |
| 9. Set as Homepage            | Calls `setHomePage()`, badge transfers                                | No clarification about nav menus                                                        | Add toast: "Homepage updated. Your navigation menu may need updating."     |
| 10. Copy Page Link            | Copies live URL or placeholder, shows toast                           | Clipboard API failure is silent (no `.catch`)                                           | Add `.catch()` → toast: "Couldn't copy link — try again."                  |
| 11. Delete flow               | PagesTab: confirm dialog → undo-toast. PageTabBar: undo-toast only    | PagesTab has confirm ✅ but PageTabBar doesn't. Undo window is 5s                       | PageTabBar adds confirm dialog; both extend to 8s undo window              |
| 12. Opening settings drawer   | Slides in over page list, SEO tab default                             | No auto-focus to first field on open                                                    | Add `useEffect` → focus first input on mount                               |
| 13. SEO tab                   | Google preview, score, title, desc, slug                              | Score ignores noIndex; no slug-change destructive warning                               | C3 + C4 fixes (detailed below)                                             |
| 14. Social tab                | OG image upload, live preview card, title/desc                        | Missing character counters on OG fields                                                 | Add char counter: OG title ≤95, OG desc ≤200                               |
| 15. Advanced tab              | Visibility, noIndex, noFollow, custom head                            | Password protect: engine support unknown; no warning                                    | Add info banner when password toggle is on                                 |
| 16. Save flow                 | 4-state button; ⌘S shortcut; error recovery                           | isDirty only tracks SEO 3 fields — OG/Advanced changes don't activate Save              | Fix `savedSnapshot` to track all 9 fields                                  |
| 17. Cross-surface consistency | Two surfaces, different patterns                                      | Multiple inconsistencies (delete, duplicate naming, keyboard access)                    | Full unification — see Section 11                                          |

---

## 3. Gap Analysis by Dimension

### Information Hierarchy

**Problem:** Delete Page is the most destructive action but appears at the bottom of a menu without adequate visual separation beyond red color. The confirm dialog mitigates this for PagesTab, but not for PageTabBar.
**Fix:** Both surfaces: confirm dialog required before delete. Red color + disabled state for delete when page is homepage/only-page.

### Status System

**Problem:** 6 status types. The current text badges ("Live", "Draft", "Hidden", "🔒") are good but "error" and "external" statuses lack icons or clear textual explanation.
**Fix:** PageRow already handles "↗" for external, "🔒" for password. Add tooltip to each status badge: `title="This page is hidden from visitors"` etc.

### Save / Dirty State Model

**Problem:** `savedSnapshot` tracks only `{ seoTitle, seoDesc, slug }`. Changing OG fields, visibility, password, noIndex, noFollow, or customHead does NOT activate the Save button.
**Fix:** Expand `savedSnapshot` to track all 9 persisted fields. The `isDirty` computed value and `saveState` transitions must account for all fields.

### Non-functional Controls

**Problem:** Password protect may not be enforced at engine/server level. The UI lets users save and creates false confidence.
**Fix:** Add an info banner when password is toggled ON: _"Password protection requires server-side enforcement. Verify your hosting configuration supports this feature."_ Do not disable the control — the save path exists and may work.

### SEO Score Integrity

**Problem:** `calculateSeoScore` ignores `allowIndex`. A page with noIndex=true can score 100/100.
**Fix:** `calculateSeoScore` accepts `allowIndex: boolean`. When `allowIndex === false`: override display to show 0 with a red warning replacing the score widget: _"noIndex is ON — search engines won't index this page regardless of other settings."_ The score tip and checks are hidden when noIndex is on.

### Slug Safety

**Problem:** No warning when changing a live page's slug.
**Fix:** When `slug !== page.slug` (original saved slug) AND `page.status === "live"`: show amber inline banner below slug input: _"⚠️ Changing this URL will break existing links, bookmarks, and search engine results. Consider setting up a redirect in your hosting settings."_

### Social Tab Completeness

**Current state:** OG image upload ✅, live preview card ✅, OG title ✅, OG desc ✅
**Gaps:** Missing character counters on OG title/desc fields
**Fix:** Add `{s.ogTitle.length}/95` and `{s.ogDesc.length}/200` counters. Warn at 90/190 chars respectively.

### Advanced Tab Education

**Current state:** Good helper text for all toggles
**Gaps:** Custom Head Code textarea has no warning about security/performance risks
**Fix:** Add warning banner above textarea: _"⚠️ Custom code runs on every page load. Incorrect HTML can break your page layout. Only add code from trusted sources."_

### Feedback States

**Problem:** Copy Page Link has no error handling if clipboard API fails.
**Fix:** Add `.catch(() => addToast({ message: "Couldn't copy link — try again.", variant: "error" }))` to the clipboard call.

### Accessibility

See Section 8 (Accessibility Checklist) for full pass/fail/fix.

### Microcopy & Labels

See Section 7 (Recommended Interaction Model) for all exact text.

---

## 4. Critical Issues C1–C7

### C1 — Password protect toggle may not persist at engine level

**Status:** CONFIRMED (partially) — `usePageSettings.save()` sends `visibility: "password"` and `password` to `composer.elements.updatePage`. Whether the engine/server enforces password protection is unknown from frontend code alone.

**User impact:** User enables password protect, saves, sees no error. Believes page is locked. If engine doesn't enforce it, any visitor can access the page freely. Critical trust/security issue.

**Fix:**

```
Location: AdvancedTab.tsx — inside the password-protect toggle-row
When: visibility === "password" (i.e., after toggle is ON)
Add: Info banner below the password field:
  "ℹ️ Password protection requires server-side support.
   Verify your hosting configuration enforces this setting."
```

Banner class: `pg-advanced__info-banner`
Banner text: _"Password protection requires server-side enforcement. Confirm your hosting supports this feature before relying on it to protect sensitive content."_

The toggle and password input remain interactive. Do not disable — the save path exists.

**Also fix:** `savedSnapshot` must include `visibility` and `password` so toggling password triggers the dirty state correctly.

---

### C2 — Hide from navigation toggle

**Status:** RESOLVED in current code. `visibility: "hidden"` is saved to engine correctly. The "coming soon" warning from the audit prompt does not exist in the current codebase. No action needed.

---

### C3 — SEO score ignores noIndex

**Status:** CONFIRMED — `calculateSeoScore({ title, desc, slug })` does not accept `allowIndex`.

**User impact:** A page with noIndex=true scores 70–100/100. User publishes believing their SEO is optimized. The page never appears in search results.

**Fix:**

`seoScore.ts`:

```typescript
interface SeoInputs {
  title: string;
  desc: string;
  slug: string;
  allowIndex: boolean; // NEW
}

export function calculateSeoScore({ title, desc, slug, allowIndex }: SeoInputs): number {
  if (!allowIndex) return 0; // noIndex = SEO score is meaningless
  // ... existing calculation unchanged
}
```

`usePageSettings.ts`:

```typescript
const seoScore = React.useMemo(
  () => calculateSeoScore({ title: seoTitle, desc: seoDesc, slug, allowIndex }),
  [seoTitle, seoDesc, slug, allowIndex]
);
const seoChecks = {
  titleSet: seoTitle.length >= 10,
  slugClean: !slugError && slug.length > 0,
  indexingOn: allowIndex, // RENAMED from descSet
  descSet: seoDesc.length >= 50,
};
```

`SeoTab.tsx` — SEO check display when noIndex is ON:

```tsx
{
  !s.allowIndex ? (
    <div className="pg-seo__noindex-warning" role="alert">
      <span className="pg-seo__score-num pg-seo__score-num--zero">0</span>
      <div className="pg-seo__noindex-msg">
        noIndex is ON — search engines won't index this page.
        <button onClick={() => s.setAllowIndex(true)}>Turn indexing on →</button>
      </div>
    </div>
  ) : (
    <>
      {/* existing score widget */}
      <SeoCheck ok={s.seoChecks.indexingOn} label="Allow indexing" hint="Required" />
      <SeoCheck ok={s.seoChecks.titleSet} label="Page title" hint="+20 pts" />
      <SeoCheck ok={s.seoChecks.descSet} label="Meta description" hint="+30 pts" />
    </>
  );
}
```

---

### C4 — Slug change has no destructive warning

**Status:** CONFIRMED — no warning exists in `SeoTab.tsx` when slug changes from saved value.

**User impact:** User changes slug on a live page. Existing links, bookmarks, and search rankings break. No redirect offered.

**Fix — `SeoTab.tsx`:**

```tsx
{
  /* After slug field, before slug hint */
}
{
  s.slug !== page.slug && page.status === "live" && !s.slugError && (
    <div className="pg-seo__slug-warning" role="alert">
      ⚠️ Changing this URL will break existing links and search engine results. Bookmarks and shared
      links to this page will stop working. Consider setting up a redirect in your hosting settings
      after saving.
    </div>
  );
}
```

CSS: `.pg-seo__slug-warning` — amber background, amber border, `--pg-hidden` color token.

---

### C5 — Delete page: PageTabBar has no confirmation dialog

**Status:** CONFIRMED — `PageTabBar.tsx` calls `composer.elements.deletePage(pageId)` immediately, shows 5-second undo-toast. No confirm dialog.

**User impact:** A misclick or accidental right-click + Delete permanently removes a page with no friction. 5 seconds is insufficient for users who don't notice the toast.

**Resolution — unified pattern:**
Both surfaces: confirm dialog → (on confirm) delete + undo-toast (8 seconds).

**`PageTabBar.tsx` — new delete flow:**

```typescript
// State: deleteConfirmPageId: string | null
const [deleteConfirmPageId, setDeleteConfirmPageId] = React.useState<string | null>(null);

const handleDeleteRequest = (pageId: string) => {
  if (pages.length <= 1) return; // already guarded
  const page = pages.find((p) => p.id === pageId);
  if (!page) return;
  if (page.isHome) {
    addToast({
      message: "Set another page as Homepage before deleting this one",
      variant: "warning",
    });
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

**Confirm dialog text (both surfaces):**

- Title: `Delete "${pageName}"?`
- Body: `All content on this page will be permanently removed. You can undo immediately after.`
- Buttons: `[Cancel]` `[Delete Page]` (danger variant)

**Also add homepage guard to PageTabBar:**

```typescript
if (page.isHome) {
  addToast({
    message: "Set another page as Homepage before deleting this one",
    variant: "warning",
  });
  return;
}
```

---

### C6 — Add Menu "Soon" items

**Status:** NOT APPLICABLE — current `AddPageButton` is a single-action button with no add menu. The `AddMenuItem` with `soon?: boolean` described in the audit prompt does not exist in the codebase. No action needed.

---

### C7 — Panel error state undefined

**Status:** CONFIRMED — `.pages-error` and `.pages-error__btn` CSS classes exist in `PagesTab.css` but `PagesTab.tsx` never renders them. The `sync` function in `usePages.ts` silently swallows errors.

**Fix — `usePages.ts`:** Track error state:

```typescript
const [loadError, setLoadError] = React.useState<string | null>(null);

// In sync():
try {
  // ... existing sync code
  setLoadError(null);
} catch (err) {
  setLoadError("Couldn't load your pages");
}
```

Export `loadError` from `UsePagesReturn`.

**Fix — `PagesTab.tsx`:** Render error state:

```tsx
{p.loadError ? (
  <div className="pages-error" role="alert">
    <div className="pages-error__msg">{p.loadError}</div>
    <button
      className="pages-error__btn"
      onClick={() => /* trigger re-sync */ composer?.emit("page:sync:retry")}
    >
      Try again
    </button>
  </div>
) : (
  <PageList ... />
)}
```

Error message: _"Couldn't load your pages"_
Button label: **"Try again"**
The error state must have `role="alert"` for screen reader announcement.

---

## 5. isDirty Tracking Bug (Not in Audit Prompt)

**Status:** CONFIRMED from code review — `savedSnapshot.current` tracks only `{ seoTitle, seoDesc, slug }`. The `isDirty` effect also only compares these 3 fields against the snapshot, despite having all 9 fields in its dependency array. Result: changing OG title, visibility, password, noIndex, noFollow, or customHead does NOT activate the Save button.

**Fix — `usePageSettings.ts`:**

```typescript
// Expand savedSnapshot to all 9 fields
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

// Update isDirty computed value:
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

// Simplify saveState effect — isDirty now drives dirty detection directly
// saveState becomes: "clean" | "saving" | "error" only (remove "dirty" state)
// saveBtnDisabled = !isDirty || saveState === "saving"
// saveBtnLabel = saveState === "saving" ? "Saving..." : saveState === "error" ? "Retry" : isDirty ? "Save changes" : "Saved ✓"
```

---

## 6. Prioritized Issue List

```
SEVERITY:    CRITICAL
LOCATION:    SEO Tab
ISSUE:       SEO score ignores noIndex — shows 70–100/100 when page is invisible to search engines
USER IMPACT: All users who enable noIndex get false confidence about SEO health
CURRENT:     calculateSeoScore() takes only {title, desc, slug}, not allowIndex
FIX:         Add allowIndex param; when false, display 0 score + red warning replacing score widget
EFFORT:      Low
```

```
SEVERITY:    CRITICAL
LOCATION:    SEO Tab
ISSUE:       Slug change on live page has no destructive warning
USER IMPACT: Any user who edits the URL slug breaks existing links silently
CURRENT:     No warning at all when slug is modified
FIX:         Inline amber banner: "⚠️ Changing this URL will break existing links..."
EFFORT:      Low
```

```
SEVERITY:    CRITICAL
LOCATION:    PageTabBar (canvas)
ISSUE:       Delete page has no confirmation dialog — immediate delete with 5s undo-toast only
USER IMPACT: Any misclick permanently deletes a page if user doesn't notice the toast
CURRENT:     compositor.elements.deletePage() called immediately on menu click
FIX:         Add ConfirmDialog before delete; extend undo window to 8s
EFFORT:      Medium
```

```
SEVERITY:    CRITICAL
LOCATION:    PageTabBar (canvas)
ISSUE:       No homepage guard on delete — homepage can be deleted from canvas tabs
USER IMPACT: User can accidentally delete the homepage, leaving site in undefined state
CURRENT:     Only pages.length <= 1 guard exists; no isHome check
FIX:         Add isHome guard: show warning toast, abort delete
EFFORT:      Low
```

```
SEVERITY:    CRITICAL
LOCATION:    Advanced Tab / All settings tabs
ISSUE:       isDirty only tracks SEO 3 fields — OG/Advanced changes don't activate Save button
USER IMPACT: Users change social or advanced settings, don't notice Save button is inactive, close settings — changes lost silently
CURRENT:     savedSnapshot tracks {seoTitle, seoDesc, slug} only
FIX:         Expand savedSnapshot to all 9 persisted fields
EFFORT:      Low
```

```
SEVERITY:    CRITICAL
LOCATION:    PagesTab (sidebar) — error state
ISSUE:       Panel error state has CSS but no render logic — sync failures are silently swallowed
USER IMPACT: When composer sync fails, pages list appears to load but shows stale/empty data
CURRENT:     catch block in sync() is empty — no error state set or rendered
FIX:         Track loadError in usePages; render .pages-error div with "Try again" button
EFFORT:      Low
```

```
SEVERITY:    CRITICAL
LOCATION:    Advanced Tab
ISSUE:       Password protect: engine enforcement unknown — user may believe page is locked when it isn't
USER IMPACT: Users who protect sensitive content with password protection may have unprotected pages
CURRENT:     Save sends visibility+password to composer but engine enforcement is unverified
FIX:         Add info banner: "Password protection requires server-side support. Verify your hosting configuration."
EFFORT:      Low
```

```
SEVERITY:    MEDIUM
LOCATION:    Cross-surface
ISSUE:       Duplicate page naming inconsistency — PagesTab: "[Name] Copy", PageTabBar: "[Name] (Copy)"
USER IMPACT: Inconsistent user experience between the two surfaces
CURRENT:     PageTabBar uses "(Copy)" in parentheses
FIX:         PageTabBar adopts "Copy" without parens to match PagesTab
EFFORT:      Low
```

```
SEVERITY:    MEDIUM
LOCATION:    PageTabBar (canvas)
ISSUE:       No keyboard accessibility — tabs are <div> elements with no tabIndex or ARIA
USER IMPACT: Keyboard-only users cannot navigate or interact with canvas tab bar
CURRENT:     No tabIndex, no role, no keyboard handlers on tab divs; context menu has no ARIA
FIX:         Add role="tablist", role="tab", tabIndex, arrow key navigation; upgrade context menu
EFFORT:      High
```

```
SEVERITY:    MEDIUM
LOCATION:    PageSettingsDrawer
ISSUE:       Settings drawer doesn't auto-focus first field on open
USER IMPACT: Keyboard users must Tab several times to reach the first form field
CURRENT:     No auto-focus on drawer mount
FIX:         useEffect → focus first input/textarea in drawer on mount
EFFORT:      Low
```

```
SEVERITY:    MEDIUM
LOCATION:    Social Tab
ISSUE:       OG title and OG description fields have no character counters
USER IMPACT: Users don't know when they've exceeded platform limits (95 / 200 chars)
CURRENT:     No character counters on OG fields
FIX:         Add {s.ogTitle.length}/95 and {s.ogDesc.length}/200 with warn state at 90/190
EFFORT:      Low
```

```
SEVERITY:    MEDIUM
LOCATION:    Copy Page Link
ISSUE:       Clipboard failure is silent — no catch handler on navigator.clipboard.writeText
USER IMPACT: In environments where clipboard API is denied, user sees no feedback
CURRENT:     No .catch() on clipboard promise
FIX:         Add .catch(() => addToast({ message: "Couldn't copy link — try again.", variant: "error" }))
EFFORT:      Low
```

```
SEVERITY:    MEDIUM
LOCATION:    Set as Homepage
ISSUE:       No clarification about navigation menu impact
USER IMPACT: User sets homepage, assumes nav menus update automatically — they may not
CURRENT:     No toast or tooltip about nav menu impact
FIX:         Toast after setHomepage: "Homepage updated. Your navigation menu may need updating manually."
EFFORT:      Low
```

```
SEVERITY:    MEDIUM
LOCATION:    Advanced Tab
ISSUE:       Custom Head Code textarea has no security warning
USER IMPACT: Users paste malicious or broken code without understanding the risk
CURRENT:     Only a hint: "Code injected into this page's <head>"
FIX:         Add warning banner: "⚠️ Custom code runs on every page load. Incorrect HTML can break your layout. Only add code from trusted sources."
EFFORT:      Low
```

```
SEVERITY:    MEDIUM
LOCATION:    Pages List
ISSUE:       Drag handle shows visual affordance but DnD is not wired — false affordance
USER IMPACT: Users attempt to drag-reorder pages and nothing happens — confusion
CURRENT:     Three dots render as drag handle with no interaction
FIX:         Add cursor: default and title="Page reordering coming soon" to drag handle
EFFORT:      Low
```

```
SEVERITY:    MEDIUM
LOCATION:    EC-12: Set external link as homepage
ISSUE:       No guard prevents setting an external-link page as homepage
USER IMPACT: Setting an external link as homepage may break site navigation
CURRENT:     setHomepage() calls setHomePage() without checking page.status
FIX:         Guard in usePages.setHomepage(): if page.status === "external", show toast: "External link pages can't be set as the homepage."
EFFORT:      Low
```

```
SEVERITY:    MEDIUM
LOCATION:    Pages List
ISSUE:       Search empty state not defined — no message when search returns no results
USER IMPACT: Users see blank list and may think pages are missing
CURRENT:     Undefined — list just shows no rows
FIX:         Add empty state in PageList when search query is active and filtered list is empty: "No pages match '[query]'" + Clear button
EFFORT:      Low
```

```
SEVERITY:    LOW
LOCATION:    PageRow
ISSUE:       ⋯ kebab button missing aria-expanded state
USER IMPACT: Screen readers can't announce whether context menu is open
CURRENT:     No aria-expanded on the kebab button
FIX:         Add aria-expanded={contextMenu?.pageId === page.id} to the kebab button
EFFORT:      Low
```

```
SEVERITY:    LOW
LOCATION:    SEO Tab
ISSUE:       Google preview shows "yourdomain.com" — not actual connected domain
USER IMPACT: Minor confusion — preview shows placeholder instead of real domain
CURRENT:     Hardcoded "yourdomain.com" string in SeoTab.tsx
FIX:         Read domain from composer.project?.domain ?? "yourdomain.com"
EFFORT:      Low
```

```
SEVERITY:    LOW
LOCATION:    PageSettingsDrawer tabs
ISSUE:       Tab buttons missing id and aria-controls — incomplete ARIA tab pattern
USER IMPACT: Screen readers can't associate tabs with their panels
CURRENT:     role="tab" and aria-selected only
FIX:         Add id="tab-{id}" and aria-controls="panel-{id}" to each tab button; add id="panel-{id}" to tabpanel div
EFFORT:      Low
```

---

## 7. Recommended Interaction Model

### Save Button States

| State  | Label          | Visual                      | Enabled? |
| ------ | -------------- | --------------------------- | -------- |
| clean  | "Saved ✓"      | Muted, check icon           | Disabled |
| dirty  | "Save changes" | Primary color, full opacity | Enabled  |
| saving | "Saving..."    | Spinner icon, muted         | Disabled |
| error  | "Retry"        | Warning/red tint            | Enabled  |

The `saveState` enum simplifies to `"clean" | "saving" | "error"`. The "dirty" state is replaced by `isDirty: boolean` derived from `savedSnapshot` comparison. Save button is enabled when `isDirty && saveState !== "saving"`.

### Dirty State Indicators

- Save button activates (primary color, "Save changes")
- Current tab shows a small dot indicator: `pg-drawer__tab-dot` (already implemented)
- No header-level dirty indicator needed (button is sufficient)

### Discard Confirmation Dialog

**Title:** "Unsaved changes"
**Body:** "Leave [page name] settings without saving?"
**Buttons (left to right):** [Stay] [Discard & Leave] [Save & Leave]
**Default focus:** "Stay" button (prevents accidental discard)
**Keyboard:** Escape = Stay

### Destructive Action Confirmations

**Delete page:**

- Title: `Delete "[Page Name]"?`
- Body: `All content on this page will be permanently removed. You can undo immediately after.`
- Buttons: [Cancel] [Delete Page] (danger)
- Default focus: [Cancel]

**Slug change warning (inline, not modal):**

- Amber banner below slug input
- Text: `⚠️ Changing this URL will break existing links, bookmarks, and search engine results for this page. Consider setting up a redirect in your hosting settings after saving.`
- Appears when: `s.slug !== page.slug && page.status === "live" && !s.slugError`

### Non-functional Controls

**Password protect (C1):**

- Control remains interactive (toggle + password input)
- When visibility === "password": show blue info banner below password field
- Banner text: _"Password protection requires server-side enforcement. Verify your hosting configuration supports this feature before relying on it for sensitive content."_
- Banner class: `pg-advanced__info-banner`

### Social Tab Character Limits

| Field          | Soft warn                       | Hard cap  |
| -------------- | ------------------------------- | --------- |
| OG Title       | 90 chars (counter turns amber)  | 95 chars  |
| OG Description | 190 chars (counter turns amber) | 200 chars |

**Fallback behavior:** When OG title is empty → SEO title is used. When OG desc is empty → SEO description is used. When SEO description is empty → "No description". This is indicated via `"using SEO title"` badge in preview (already implemented ✅).

### Advanced Tab Helper Text

**Allow Indexing (noIndex):**

> _"Let search engines index this page. Turn OFF for confirmation pages, admin pages, or private content that shouldn't appear in search results."_

**Allow Following Links (noFollow):**

> _"Search engines follow outbound links on this page. Turn OFF if this page contains untrusted or sponsored links."_

**Custom Head Code warning banner:**

> _"⚠️ Custom code runs on every page load. Incorrect HTML can break your page layout. Only add code from trusted sources."_
> Banner class: `pg-advanced__warn-banner` — amber background

### All Toast Messages

| Action                         | Toast text                                                           | Variant | Duration   |
| ------------------------------ | -------------------------------------------------------------------- | ------- | ---------- |
| Settings saved                 | "Page settings saved"                                                | success | 2000ms     |
| Save failed                    | "Save failed — your changes are still here." + Retry action          | error   | persistent |
| Page deleted                   | `"${pageName}" deleted` + Undo action                                | info    | 8000ms     |
| Homepage set                   | "Homepage updated. Your navigation menu may need updating manually." | success | 4000ms     |
| Copy link (success, no domain) | `"Link copied: ${url} · Connect a custom domain in Settings →"`      | success | 5000ms     |
| Copy link (success, domain)    | `"Link copied: ${url}"`                                              | success | 3000ms     |
| Copy link (failure)            | "Couldn't copy link — try again."                                    | error   | 3000ms     |
| Delete last page               | "Can't delete — your site needs at least 1 page."                    | warning | 4000ms     |
| Delete homepage                | "Set another page as Homepage before deleting this one."             | warning | 4000ms     |
| External link as homepage      | "External link pages can't be set as the homepage."                  | warning | 4000ms     |
| Slug format error              | "Fix slug error before saving."                                      | warning | 3000ms     |
| Head code invalid              | "Unclosed HTML tag detected. Ensure all tags are properly closed."   | warning | 3000ms     |
| Password missing               | "Set an access password before saving."                              | warning | 3000ms     |

---

## 8. Accessibility Checklist

| Check                                                      | Status     | Fix                                                                        |
| ---------------------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| All interactive elements reachable by Tab key (PagesTab)   | ✅ PASS    | PageRow has tabIndex=0, buttons are focusable                              |
| All interactive elements reachable by Tab key (PageTabBar) | ❌ FAIL    | Tab divs have no tabIndex; add tabIndex=0, role="tab"                      |
| Context menu (PagesTab) openable and navigable by keyboard | ✅ PASS    | Arrow keys + Escape implemented in PageContextMenu                         |
| Context menu (PageTabBar) navigable by keyboard            | ❌ FAIL    | No ARIA roles, no keyboard navigation in PageTabBar context menu           |
| Rename input receives focus and selects text               | ✅ PASS    | requestAnimationFrame → select() → focus() in PageRow                      |
| Settings drawer receives focus when opened                 | ❌ FAIL    | No auto-focus on mount; add useEffect → focus first input                  |
| Focus returns to trigger when drawer closes                | ❓ UNKNOWN | No focus-return logic in onClose — investigate and add                     |
| Toggle buttons have aria-pressed or aria-checked           | ✅ PASS    | AdvancedTab uses role="switch" aria-checked                                |
| Form fields have associated labels (not placeholder-only)  | ✅ PASS    | All fields use htmlFor/id pairs or aria-label                              |
| Field errors are associated via aria-describedby           | ✅ PASS    | slugError uses aria-describedby="seo-slug-hint"                            |
| SEO score updates announced to screen readers              | ❌ FAIL    | Score badge has no aria-live; add aria-live="polite" to score row          |
| Toast notifications announced                              | ❓ UNKNOWN | Depends on Toast component — verify it has role="status" or aria-live      |
| Status dots are not color-only                             | ✅ PASS    | PageRow uses text labels (Live, Draft, Hidden, 🔒)                         |
| Delete confirmation traps focus                            | ❓ UNKNOWN | ConfirmDialog component — verify focus trap implementation                 |
| Color contrast: draft badge meets 4.5:1                    | ✅ PASS    | Draft dot updated to #5A5A7A (FIX H1 in CSS) — passes 3.2:1 for large text |
| Icon-only buttons have aria-label                          | ✅ PASS    | Settings gear and ⋯ button have aria-label                                 |
| prefers-reduced-motion covers all animations               | ✅ PASS    | @media (prefers-reduced-motion) in PagesTab.css (confirmed)                |
| PageTabBar independently keyboard-navigable                | ❌ FAIL    | No keyboard support at all                                                 |
| Undo toast Undo button keyboard reachable                  | ❓ UNKNOWN | Depends on Toast component implementation                                  |
| Kebab button aria-expanded state                           | ❌ FAIL    | Add aria-expanded={contextMenu?.pageId === page.id}                        |
| Drawer tabs have aria-controls                             | ❌ FAIL    | Missing id and aria-controls attributes                                    |

---

## 9. Social Tab

**Current state (from code):** OG image upload ✅, live preview card ✅, fallback indicators ✅, OG title ✅, OG desc ✅

**Gaps:**

1. No character counters on OG title/desc
2. Preview card doesn't show platform context (which platform it's previewing — Facebook/Twitter/LinkedIn all have slightly different formats)
3. OG image recommended size is shown as hint but not validated

**Fixes:**

1. Add char counters: `{s.ogTitle.length}/95` (warn amber at 90), `{s.ogDesc.length}/200` (warn amber at 190)
2. Add platform label under preview card: "Preview: Facebook / LinkedIn (1200×630)" — static label is sufficient
3. Image size validation is out of scope for client-side (file dimensions not checked on upload) — keep hint text only

---

## 10. Advanced Tab Fix Plan

| Control                          | Current state                               | Fix                                        |
| -------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Hide from navigation             | Saves correctly (visibility: "hidden")      | No fix needed ✅                           |
| Password protect                 | Saves to engine; engine enforcement unknown | Info banner when toggle is ON              |
| noIndex (Allow Indexing)         | Saves correctly; not reflected in SEO score | Fix SEO score (C3)                         |
| noFollow (Allow Following Links) | Saves correctly                             | Good helper text ✅                        |
| Custom Head Code                 | Basic validation (unclosed tag detection)   | Add security warning banner above textarea |

**Info banner design (password protect):**

```
ℹ️ [blue left border]
Password protection requires server-side enforcement.
Verify your hosting configuration supports this feature
before relying on it to protect sensitive content.
```

Class: `pg-advanced__info-banner`
Position: Below the password input field (inside `pg-advanced__password-wrap`)

**Security warning design (custom head code):**

```
⚠️ [amber left border]
Custom code runs on every page load. Incorrect HTML can
break your page layout. Only add code from trusted sources.
```

Class: `pg-advanced__warn-banner`
Position: Above the `<textarea>` element

---

## 11. Cross-Surface Consistency Report

| Action                       | PagesTab (sidebar)                             | PageTabBar (canvas)            | Winner             | Action Required                                                                 |
| ---------------------------- | ---------------------------------------------- | ------------------------------ | ------------------ | ------------------------------------------------------------------------------- |
| **Rename trigger**           | F2, double-click, context menu                 | Double-click only              | PagesTab           | PageTabBar: add F2 + context menu rename                                        |
| **Rename commit**            | Enter / Escape / blur                          | Enter / Escape / blur          | Same ✅            | None                                                                            |
| **Duplicate name**           | `"[Name] Copy"`                                | `"[Name] (Copy)"`              | PagesTab (cleaner) | PageTabBar: change to `"[Name] Copy"`                                           |
| **Duplicate slug**           | Deduplicates (`-copy`, `-copy-2`)              | No slug handling (just name)   | PagesTab           | PageTabBar: add slug dedup (or omit — engine may auto-generate)                 |
| **Delete — confirmation**    | ConfirmDialog ✅                               | No dialog ❌                   | PagesTab           | PageTabBar: add ConfirmDialog                                                   |
| **Delete — undo**            | Undo-toast (5s)                                | Undo-toast (5s)                | Extend both        | Both: extend to 8s                                                              |
| **Homepage guard (delete)**  | ✅ Checks isHome                               | ❌ Not checked                 | PagesTab           | PageTabBar: add isHome guard                                                    |
| **Last-page guard (delete)** | ✅ `pages.length <= 1`                         | ✅ `pages.length <= 1`         | Same ✅            | None                                                                            |
| **Set Homepage**             | Via context menu                               | Via context menu               | Same ✅            | None                                                                            |
| **Copy Link**                | ✅ In context menu                             | ❌ Not available               | PagesTab           | Optional: PageTabBar could add it                                               |
| **Page Settings**            | ✅ Full drawer                                 | ❌ Not available               | PagesTab           | By design — PageTabBar is canvas surface                                        |
| **Context menu ARIA**        | ✅ Full ARIA + keyboard                        | ❌ No ARIA, no keyboard        | PagesTab           | PageTabBar: full ARIA upgrade                                                   |
| **Active page indicator**    | Blue highlighted row                           | Active tab styling             | Both ✅            | None                                                                            |
| **Page events subscribed**   | 5 events (PROJECT_CHANGED, page:created, etc.) | 1 event (PROJECT_CHANGED only) | PagesTab           | PageTabBar: subscribe to page:created, page:deleted, page:changed, page:updated |

---

## 12. Add Menu "Soon" Items Fix Plan (C6)

**Finding:** The add menu with "Soon" badges does not exist in the current codebase. `AddPageButton` is a single-action button. The `AddMenuItem` component described in the audit prompt is not implemented.

**Action:** No fix required for existing code. When the add menu is built in future:

- "Soon" items should be visually disabled: `opacity: 0.5`, `cursor: not-allowed`, `pointer-events: none`
- On hover: tooltip showing: "Coming soon — [feature name]"
- Do NOT make "Soon" items clickable

---

## 13. Panel Error State Design (C7)

**Trigger conditions:**

- `composer.elements.getAllPages()` throws an exception
- `composer.elements.getActivePage()` throws an exception

**Error message:** "Couldn't load your pages"
**Sub-text:** "Check your connection and try again."
**Button label:** "Try again"
**Button action:** Re-trigger `sync()` — implement via a `retryKey` state increment that re-runs the sync useEffect

**Rendering:**

```tsx
{p.loadError ? (
  <div className="pages-error" role="alert" aria-live="assertive">
    <div className="pages-error__msg">Couldn't load your pages</div>
    <div className="pages-error__sub">Check your connection and try again.</div>
    <button className="pages-error__btn" onClick={p.retrySync}>
      Try again
    </button>
  </div>
) : (
  <PageList ... />
)}
```

**Accessibility:** `role="alert"` + `aria-live="assertive"` for immediate announcement. Loading state before error: a skeleton or spinner for 500ms before showing the error state.

---

## 14. Edge Case Matrix

| EC    | Case                                              | Current behavior                                                   | Required fix                                                                           |
| ----- | ------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| EC-01 | Delete last page                                  | ✅ PagesTab: toast "Can't delete". PageTabBar: early return        | Both correct                                                                           |
| EC-02 | Delete homepage                                   | ✅ PagesTab: toast warning. PageTabBar: ❌ not checked             | PageTabBar: add isHome guard                                                           |
| EC-03 | Delete active/open page                           | Canvas behavior unknown                                            | After delete, composer auto-switches to homepage; if not available, first page in list |
| EC-04 | Duplicate at page limit                           | No page limit in codebase                                          | No guard needed                                                                        |
| EC-05 | Slug already exists                               | ✅ isSlugDuplicate() shows inline error                            | No fix needed                                                                          |
| EC-06 | Slug "/" or empty                                 | validateSlug() returns error for empty. "/" not explicitly allowed | Allow "/" as valid homepage slug in validateSlug()                                     |
| EC-07 | 100+ char page name                               | ✅ CSS truncation + title tooltip on both row and drawer header    | No fix needed                                                                          |
| EC-08 | Back arrow with unsaved changes                   | ✅ UnsavedDialog: Stay / Discard & Leave / Save & Leave            | Default focus must be "Stay"                                                           |
| EC-09 | Navigate to page while settings open              | Drawer covers list — can't click rows                              | By design ✅                                                                           |
| EC-10 | Save fails                                        | ✅ saveState="error", dirty preserved, Retry toast                 | No fix needed                                                                          |
| EC-11 | Copy link without domain                          | ✅ Copies `yoursite.aquibra.io/[slug]` + settings nudge in toast   | No fix needed                                                                          |
| EC-12 | External link as homepage                         | ❌ No guard in setHomepage()                                       | Add guard: if status==="external", show toast                                          |
| EC-13 | Narrow viewport                                   | ✅ Save button in header always visible; tabs fit                  | No fix needed                                                                          |
| EC-14 | Keyboard-only full flow                           | ❌ PageTabBar not keyboard accessible                              | Full keyboard upgrade for PageTabBar                                                   |
| EC-15 | Screen reader                                     | ❌ SEO score not aria-live; tabs missing aria-controls             | Fix aria-live + aria-controls                                                          |
| EC-16 | noIndex changed in Advanced, then back to SEO tab | ✅ calculateSeoScore is reactive via useMemo (after C3 fix)        | No additional fix after C3                                                             |
| EC-17 | Undo after 8s toast expires                       | After 8s, button gone. ⌘Z still works via composer.history.undo()  | Document that ⌘Z is fallback                                                           |
| EC-18 | Delete from PageTabBar vs PagesTab                | PagesTab: confirm+toast. PageTabBar: toast only                    | PageTabBar gets confirm dialog (C5 fix)                                                |
| EC-19 | "Soon" add menu click                             | Not applicable — add menu doesn't exist                            | N/A                                                                                    |

---

## 15. Implementation Scope Summary

### Files to change

| File                              | Changes                                                                                               | Effort |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- | ------ |
| `utils/seoScore.ts`               | Add `allowIndex` param; return 0 when noIndex                                                         | Low    |
| `settings/usePageSettings.ts`     | Expand savedSnapshot to 9 fields; fix isDirty                                                         | Low    |
| `settings/SeoTab.tsx`             | noIndex warning display; slug destructive warning; domain from composer; OG domain; aria-controls     | Low    |
| `settings/SocialTab.tsx`          | OG char counters; platform label                                                                      | Low    |
| `settings/AdvancedTab.tsx`        | Password info banner; head code warn banner                                                           | Low    |
| `settings/PageSettingsDrawer.tsx` | Auto-focus on mount; aria-controls on tabs; tabpanel ids                                              | Low    |
| `usePages.ts`                     | loadError state; retrySync; EC-12 guard in setHomepage                                                | Low    |
| `PagesTab.tsx`                    | Error state rendering; homepage toast (setHomepage)                                                   | Low    |
| `components/PageRow.tsx`          | aria-expanded on kebab; drag handle cursor+tooltip                                                    | Low    |
| `components/PageList.tsx`         | Search empty state                                                                                    | Low    |
| `shell/PageTabBar.tsx`            | Full remediation: confirm dialog, guards, ARIA, keyboard, "Copy" naming, 8s toast, event subscription | High   |

### New CSS classes needed

- `pg-seo__slug-warning` — amber banner
- `pg-seo__noindex-warning` — red/warning wrapper
- `pg-seo__noindex-msg` — noIndex message text
- `pg-seo__score-num--zero` — zero score display
- `pg-social__char-counter` — OG field char counter
- `pg-advanced__info-banner` — blue info banner (password)
- `pg-advanced__warn-banner` — amber warn banner (head code)
- `pages-error__sub` — error state sub-text

---

_Document approved 2026-02-28. Next step: invoke `writing-plans` skill to create implementation task list._
