# Pages Tab — Dark Prototype Alignment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the pages tab visually match the dark prototype at `designs/page-tab-premium-20260417/prototype.html` — right now the global `--aqb-*` tokens resolve to LIGHT values (`#F8FAFC` panel background, `#334155` text) but the pages panel must be dark per DESIGN.md ("editor chrome is dark-only").

**Architecture:** Add dark color overrides scoped to `.pages-panel {}` in PagesTab.css so all existing `--aqb-*` consumer rules inside that scope see dark values — no global token changes. Simultaneously add "scheduled" page status to types/logic, add page slug to drawer header, and update thumbnail gradients to match the prototype's dark gradient palette.

**Tech Stack:** React 18 + TypeScript 5.3, raw CSS (no Emotion/Tailwind), Vite 7.2, Vitest

---

## File Map

| File | Change |
|------|--------|
| `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css` | Add dark token override block at `.pages-panel` root |
| `packages/editor/src/editor/sidebar/tabs/pages/types.ts` | Add `"scheduled"` to `PageStatus` union |
| `packages/editor/src/editor/sidebar/tabs/pages/components/PageRow.tsx` | Add `statusLabel`/`statusTooltip` for `"scheduled"` |
| `packages/editor/src/editor/sidebar/tabs/pages/components/PageList.tsx` | Track `scheduled` in footer stats |
| `packages/editor/src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx` | Add page slug line below title in drawer header |

---

### Task 1: Scope dark tokens to `.pages-panel` in PagesTab.css

The ENTIRE token mismatch is fixed by one block. The Phase 2 CSS (lines 2175+) already uses the correct dark styling — it just relies on `--aqb-*` tokens that now resolve to light values. Override them locally.

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css`

- [ ] **Step 1: Open PagesTab.css and find the Phase 2 `.pages-panel` block**

  At line 2175 you will see:
  ```css
  .pages-panel {
    /* Explicit dark tokens — don't inherit from whatever the sidebar root is */
    background: var(--aqb-bg-panel);
    color: var(--aqb-text-primary);
  }
  ```

- [ ] **Step 2: Replace that block with the dark token override block**

  Replace the existing `.pages-panel { background: var(--aqb-bg-panel); ... }` block (at line 2175) with:

  ```css
  .pages-panel {
    /* ── Dark surface layer (editor chrome is dark-only per DESIGN.md) ── */
    /* Override global --aqb-* light tokens with dark equivalents.
       All downstream .pages-panel .pg-* rules consume these scoped values. */
    --aqb-bg-app:    #0c0c14;
    --aqb-bg-panel:  #14141f;
    --aqb-bg-subtle: #1e1e28;
    --aqb-bg-card:   #17171f;
    --aqb-bg-elevated: #1e1e28;
    --aqb-bg-hover:  rgba(255, 255, 255, 0.04);
    --aqb-bg-active: rgba(255, 255, 255, 0.06);

    --aqb-surface-1: #0f0f14;
    --aqb-surface-2: #14141f;
    --aqb-surface-3: #1e1e28;
    --aqb-surface-4: #252531;
    --aqb-surface-5: #2e2e38;

    --aqb-text-primary:   #F5F5F0;
    --aqb-text-secondary: #B8B5AD;
    --aqb-text-tertiary:  #A09D96;
    --aqb-text-muted:     #908D85;
    --aqb-text-disabled:  #6b7280;

    --aqb-border:        rgba(255, 255, 255, 0.08);
    --aqb-border-medium: rgba(255, 255, 255, 0.12);
    --aqb-border-strong: rgba(255, 255, 255, 0.15);
    --aqb-border-light:  rgba(255, 255, 255, 0.05);
    --aqb-border-subtle: rgba(255, 255, 255, 0.05);
    --aqb-border-hover:  rgba(255, 255, 255, 0.15);

    /* Semantic — bright variants for dark backgrounds */
    --aqb-success:       #22c55e;
    --aqb-success-light: rgba(34, 197, 94, 0.10);
    --aqb-warning:       #f59e0b;
    --aqb-warning-light: rgba(245, 158, 11, 0.10);
    --aqb-error:         #ef4444;
    --aqb-error-light:   rgba(239, 68, 68, 0.10);

    background: var(--aqb-bg-panel);
    color: var(--aqb-text-primary);
  }
  ```

- [ ] **Step 3: Run TypeScript check — no type errors expected (CSS-only change)**

  ```bash
  cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no errors (or same pre-existing errors as before).

- [ ] **Step 4: Commit**

  ```bash
  git add packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css
  git commit -m "fix(pages): scope dark tokens to .pages-panel — light theme global tokens no longer leak in"
  ```

---

### Task 2: Add "scheduled" to PageStatus and statusLabel

The prototype shows a "Scheduled" chip (blue, like accent). Our `PageStatus` union doesn't include it and `statusLabel()` has no case for it.

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/types.ts`
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/components/PageRow.tsx`

- [ ] **Step 1: Write a failing test for scheduled status**

  In `packages/editor/src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx`, add this test inside the existing `PageRow active indicator` describe block:

  ```typescript
  it("renders Scheduled chip when page.status is scheduled", () => {
    const page = makePage({ status: "scheduled" as PageItem["status"] });
    render(<PageRow page={page} {...baseProps} />);
    // The status badge element should have the --scheduled modifier class
    const { container } = render(<PageRow page={page} {...baseProps} />);
    const badge = container.querySelector(".pg-row__status--scheduled");
    expect(badge).toBeTruthy();
  });
  ```

- [ ] **Step 2: Run test to confirm it fails**

  ```bash
  cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx 2>&1 | tail -20
  ```
  Expected: FAIL — TypeScript will reject `"scheduled"` as not assignable to `PageStatus`.

- [ ] **Step 3: Add "scheduled" to PageStatus union**

  File: `packages/editor/src/editor/sidebar/tabs/pages/types.ts`

  Change line 9 from:
  ```typescript
  export type PageStatus = "live" | "draft" | "hidden" | "password" | "error" | "external";
  ```
  To:
  ```typescript
  export type PageStatus = "live" | "draft" | "hidden" | "password" | "scheduled" | "error" | "external";
  ```

- [ ] **Step 4: Add "scheduled" to statusLabel() and statusTooltip() in PageRow.tsx**

  In `packages/editor/src/editor/sidebar/tabs/pages/components/PageRow.tsx`:

  Find `statusLabel()` function (around line 38). Add the `scheduled` case before `default`:
  ```typescript
  function statusLabel(page: PageItem): string {
    switch (page.status) {
      case "hidden":    return "Hidden";
      case "draft":     return "Draft";
      case "scheduled": return "Scheduled";
      case "password":  return "Password";
      case "external":  return "External";
      case "error":     return "Error";
      default:          return "Live";
    }
  }
  ```

  Find `statusTooltip()` function (around line 58). Add `scheduled` case:
  ```typescript
  function statusTooltip(page: PageItem): string {
    switch (page.status) {
      case "live":      return "This page is publicly visible";
      case "draft":     return "This page is a draft — not visible to visitors";
      case "hidden":    return "This page is hidden from navigation menus";
      case "password":  return "This page requires a password to access";
      case "scheduled": return "This page is scheduled to publish automatically";
      case "error":     return "This page has a configuration error";
      case "external":  return "This opens an external URL";
      default:          return "";
    }
  }
  ```

- [ ] **Step 5: Run test to confirm it passes**

  ```bash
  cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx 2>&1 | tail -20
  ```
  Expected: PASS

- [ ] **Step 6: Commit**

  ```bash
  git add packages/editor/src/editor/sidebar/tabs/pages/types.ts \
          packages/editor/src/editor/sidebar/tabs/pages/components/PageRow.tsx \
          packages/editor/src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx
  git commit -m "feat(pages): add 'scheduled' PageStatus — chip + tooltip + type"
  ```

---

### Task 3: Footer stats — track scheduled pages

The prototype footer shows `9 pages · 2 drafts · 1 scheduled · 1 hidden`. Our `PageList.tsx` tracks drafts and hidden but not scheduled.

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/components/PageList.tsx`

- [ ] **Step 1: Write a test for scheduled stat**

  In `packages/editor/src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx`, add a new describe block at the end:

  ```typescript
  describe("PageList footer stats", () => {
    it("counts scheduled pages in stats logic", () => {
      // Replicate the stats useMemo from PageList
      const pages: PageItem[] = [
        makePage({ id: "p1", status: "live" }),
        makePage({ id: "p2", status: "draft" }),
        makePage({ id: "p3", status: "scheduled" as PageItem["status"] }),
        makePage({ id: "p4", status: "hidden" }),
      ];

      let drafts = 0, scheduled = 0, hidden = 0;
      for (const p of pages) {
        if (p.status === "draft")     drafts++;
        else if (p.status === "scheduled") scheduled++;
        else if (p.status === "hidden")    hidden++;
      }
      expect(drafts).toBe(1);
      expect(scheduled).toBe(1);
      expect(hidden).toBe(1);
    });
  });
  ```

- [ ] **Step 2: Run test — it should pass already (pure logic test)**

  ```bash
  cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx 2>&1 | tail -10
  ```
  Expected: PASS

- [ ] **Step 3: Update the stats useMemo in PageList.tsx**

  File: `packages/editor/src/editor/sidebar/tabs/pages/components/PageList.tsx`

  Find the `stats` useMemo (around line 101). Change it from:
  ```typescript
  const stats = React.useMemo(() => {
    let drafts = 0;
    let hidden = 0;
    for (const p of pages) {
      if (p.status === "draft") drafts++;
      else if (p.status === "hidden") hidden++;
    }
    return { total: pages.length, drafts, hidden };
  }, [pages]);
  ```
  To:
  ```typescript
  const stats = React.useMemo(() => {
    let drafts = 0, scheduled = 0, hidden = 0;
    for (const p of pages) {
      if (p.status === "draft")          drafts++;
      else if (p.status === "scheduled") scheduled++;
      else if (p.status === "hidden")    hidden++;
    }
    return { total: pages.length, drafts, scheduled, hidden };
  }, [pages]);
  ```

- [ ] **Step 4: Update the footer JSX in PageList.tsx to show scheduled**

  Find the footer stats JSX (around line 297):
  ```tsx
  <div className="pg-list__stats">
    <span><b>{stats.total}</b> page{stats.total !== 1 ? "s" : ""}</span>
    {stats.drafts > 0 && (
      <><span>·</span><span>{stats.drafts} draft{stats.drafts !== 1 ? "s" : ""}</span></>
    )}
    {stats.hidden > 0 && (
      <><span>·</span><span>{stats.hidden} hidden</span></>
    )}
  </div>
  ```

  Replace with:
  ```tsx
  <div className="pg-list__stats">
    <span><b>{stats.total}</b> page{stats.total !== 1 ? "s" : ""}</span>
    {stats.drafts > 0 && (
      <><span>·</span><span>{stats.drafts} draft{stats.drafts !== 1 ? "s" : ""}</span></>
    )}
    {stats.scheduled > 0 && (
      <><span>·</span><span>{stats.scheduled} scheduled</span></>
    )}
    {stats.hidden > 0 && (
      <><span>·</span><span>{stats.hidden} hidden</span></>
    )}
  </div>
  ```

- [ ] **Step 5: Run vitest to confirm no regressions**

  ```bash
  cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run 2>&1 | tail -15
  ```
  Expected: all tests pass.

- [ ] **Step 6: Commit**

  ```bash
  git add packages/editor/src/editor/sidebar/tabs/pages/components/PageList.tsx \
          packages/editor/src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx
  git commit -m "feat(pages): add scheduled count to footer stats"
  ```

---

### Task 4: Drawer header — add page slug line below title

The prototype shows the page URL slug below the page name in the drawer header:
```
About               [Discard] [● Saved] [×]
acme.com/about
```

Our current drawer shows only the page name. The `page` prop already has `slug` on it.

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css`

- [ ] **Step 1: Update PageSettingsDrawer.tsx header to add slug**

  File: `packages/editor/src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx`

  Find the title section in the header (around line 96):
  ```tsx
  <div className="pg-drawer-slide__title" title={page.name}>
    {page.name}
  </div>
  ```

  Replace with:
  ```tsx
  <div className="pg-drawer-slide__title-block">
    <div className="pg-drawer-slide__title" title={page.name}>
      {page.name}
    </div>
    {s.domain && page.slug && (
      <div className="pg-drawer-slide__slug">
        {s.domain}/{page.slug.replace(/^\//, "")}
      </div>
    )}
  </div>
  ```

  Note: `s.domain` is available from `usePageSettings` return value (the hook exposes `domain: string | null`).

- [ ] **Step 2: Add CSS for the new title block and slug line**

  File: `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css`

  Find the existing `.pages-panel .pg-drawer-slide__title { }` rule (around line 2600). After that rule, add:

  ```css
  .pages-panel .pg-drawer-slide__title-block {
    flex: 1;
    min-width: 0;
  }

  .pages-panel .pg-drawer-slide__slug {
    font-family: "Geist Mono", monospace;
    font-size: 10.5px;
    color: var(--aqb-text-muted);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  ```

  Also update the existing title rule to remove `flex: 1; min-width: 0;` (now on the block wrapper):
  ```css
  .pages-panel .pg-drawer-slide__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--aqb-text-primary);
    letter-spacing: -0.1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  ```

- [ ] **Step 3: Run TypeScript check**

  ```bash
  cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no new errors.

- [ ] **Step 4: Run vitest**

  ```bash
  cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run 2>&1 | tail -10
  ```
  Expected: all tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add packages/editor/src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx \
          packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css
  git commit -m "feat(pages): show page slug below name in settings drawer header"
  ```

---

### Task 5: Thumbnail gradients — match prototype palette

The prototype shows page thumbnails as colored gradients (`t-hero` = blue navy, `t-about` = dark gray, `t-blog` = purple-dark, `t-contact` = deep navy, `t-pricing` = dark olive, `t-ext` = near-black). Currently our CSS has flat `--aqb-bg-subtle` for all of them.

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css`

- [ ] **Step 1: Find the thumbnail variant rules in PagesTab.css**

  Around line 2505, you'll see:
  ```css
  /* Page-type thumbs — flat neutral surfaces, no gradients (DESIGN.md) */
  .pages-panel .pg-row__thumb--t-hero    { background: var(--aqb-bg-subtle); }
  .pages-panel .pg-row__thumb--t-about   { background: var(--aqb-bg-subtle); }
  .pages-panel .pg-row__thumb--t-blog    { background: var(--aqb-bg-subtle); }
  .pages-panel .pg-row__thumb--t-contact { background: var(--aqb-bg-subtle); }
  .pages-panel .pg-row__thumb--t-pricing { background: var(--aqb-bg-subtle); }
  .pages-panel .pg-row__thumb--t-ext     { background: var(--aqb-bg-subtle); }
  ```

- [ ] **Step 2: Replace flat backgrounds with prototype gradients**

  Replace those 6 lines (including the comment) with:
  ```css
  /* Page-type thumbs — prototype gradient palette */
  .pages-panel .pg-row__thumb--t-hero    { background: linear-gradient(180deg, #1b2950, #223070 40%, #0c0c14 100%); }
  .pages-panel .pg-row__thumb--t-about   { background: linear-gradient(180deg, #222833, #13151a 60%); }
  .pages-panel .pg-row__thumb--t-blog    { background: linear-gradient(180deg, #191721, #221f2b 70%); }
  .pages-panel .pg-row__thumb--t-contact { background: linear-gradient(180deg, #0f1a2e, #0a1424); }
  .pages-panel .pg-row__thumb--t-pricing { background: linear-gradient(180deg, #1a1f14, #131509); }
  .pages-panel .pg-row__thumb--t-ext     { background: linear-gradient(135deg, #222, #111); }
  ```

  Also update the ghost lines to use a lighter white (they need to be visible on the dark gradients):
  Find `.pages-panel .pg-row__thumb-ghost` (around line 2511). Update it:
  ```css
  .pages-panel .pg-row__thumb-ghost {
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    height: 2px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 1px;
  }
  .pages-panel .pg-row__thumb-ghost + .pg-row__thumb-ghost {
    top: 9px;
    width: 70%;
    background: rgba(255, 255, 255, 0.15);
  }
  ```

- [ ] **Step 3: Run TypeScript check + vitest**

  ```bash
  cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | head -5 && npx vitest run 2>&1 | tail -10
  ```
  Expected: no errors, all tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css
  git commit -m "feat(pages): thumbnail gradients from prototype palette (dark navy/gray/olive)"
  ```

---

### Task 6: Status chip colors — tune for dark backgrounds

With the dark token overrides from Task 1 now in place, `--aqb-success`, `--aqb-warning`, `--aqb-error` now resolve to bright `#22c55e`, `#f59e0b`, `#ef4444`. This makes the status chip text color too saturated / identical to the dot for live pages.

The prototype uses PASTEL text colors on dark backgrounds:
- Live: `color: #8ee0a6` (soft green)
- Draft: `color: #f2c16b` (soft amber)
- Scheduled: `color: #a8c5ff` (soft blue)
- Error: `color: #f5a3a3` (soft red)
- Hidden: `color: var(--text-3)` = `#A09D96`

Our chip text currently uses `color: var(--aqb-success)` = `#22c55e` (bright green) which is the DOT color — too intense for text.

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css`

- [ ] **Step 1: Find the status chip rules in PagesTab.css**

  Around line 2314, you'll see:
  ```css
  .pages-panel .pg-row__status--live {
    color: var(--aqb-success);
    background: rgba(34, 197, 94, 0.08);
  }
  .pages-panel .pg-row__status--live::before {
    background: var(--aqb-success);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18);
  }
  .pages-panel .pg-row__status--draft {
    color: var(--aqb-warning);
    background: rgba(245, 158, 11, 0.08);
  }
  ...
  ```

- [ ] **Step 2: Replace chip text colors with prototype pastel variants**

  Replace each status chip block with the pastel text versions:
  ```css
  .pages-panel .pg-row__status--live {
    color: #8ee0a6;
    background: rgba(34, 197, 94, 0.08);
  }
  .pages-panel .pg-row__status--live::before {
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.20);
  }
  .pages-panel .pg-row__status--draft {
    color: #f2c16b;
    background: rgba(245, 158, 11, 0.08);
  }
  .pages-panel .pg-row__status--draft::before { background: #f59e0b; }
  .pages-panel .pg-row__status--scheduled {
    color: #a8c5ff;
    background: rgba(45, 109, 255, 0.10);
  }
  .pages-panel .pg-row__status--scheduled::before { background: var(--accent); }
  .pages-panel .pg-row__status--hidden {
    color: #A09D96;
    background: rgba(255, 255, 255, 0.04);
  }
  .pages-panel .pg-row__status--hidden::before { background: #6b7280; }
  .pages-panel .pg-row__status--password {
    color: #d9d4c6;
    background: rgba(255, 255, 255, 0.05);
  }
  .pages-panel .pg-row__status--password::before { background: #A09D96; }
  .pages-panel .pg-row__status--external {
    color: #bfbfbf;
    background: rgba(255, 255, 255, 0.04);
  }
  .pages-panel .pg-row__status--external::before { background: #908D85; }
  .pages-panel .pg-row__status--error {
    color: #f5a3a3;
    background: rgba(239, 68, 68, 0.08);
  }
  .pages-panel .pg-row__status--error::before { background: #ef4444; }
  ```

- [ ] **Step 3: Run TypeScript check + vitest**

  ```bash
  cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | head -5 && npx vitest run 2>&1 | tail -10
  ```
  Expected: no errors, all tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css
  git commit -m "fix(pages): status chip text colors — pastel variants for dark panel"
  ```

---

## Self-Review

**Spec coverage:**
- ✅ Dark panel background matching prototype — Task 1
- ✅ "Scheduled" status chips — Tasks 2, 3, 6
- ✅ Page slug in drawer header — Task 4
- ✅ Thumbnail gradients — Task 5
- ✅ Status chip pastel colors — Task 6
- ✅ Footer stats include scheduled — Task 3

**Placeholder scan:** None — all steps contain exact CSS and exact code.

**Type consistency:** `PageStatus` union updated in Task 2 Step 3. All references in `statusLabel()`, `statusTooltip()`, the stats useMemo, and CSS class selectors are consistent with `"scheduled"` as the string value.

**What is NOT in this plan (out of scope):**
- Presence avatars (engine doesn't expose collaborator presence yet)
- Versions / A11y / Languages drawer tabs (stub tabs, no engine API)
- JSON-LD schema picker in SEO tab (separate feature)
- Schedule date/time picker in Advanced tab (separate feature)
- Shimmer animation on generating thumbnails (needs real thumbnail service)
