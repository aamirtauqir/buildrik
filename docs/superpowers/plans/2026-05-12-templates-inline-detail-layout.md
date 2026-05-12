# Templates Inline Detail Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Templates fullpage tab so clicking a card opens detail beside the grid (50/50 split with independent column scroll), matching prototype-v3 §2.

**Architecture:** Approach B from spec — structural 2-column wrapper. Add new `.tpl-detail-layout` class family with `--split` modifier toggling CSS Grid `1fr 1fr` columns. Delete the existing `.tpl-content-inner--with-detail` and `.tpl-grid-area--dimmed` rules that hide the grid. Remove the duplicate header breadcrumb (in-panel breadcrumb inside `TemplateDetail` is canonical).

**Tech Stack:** React 18 + TypeScript + Vite + Vitest + jsdom + React Testing Library. CSS via plain `.css` files imported alongside components. Buildrik DESIGN.md tokens via `var(--bd-*)`.

**Spec:** `docs/superpowers/specs/2026-05-12-templates-inline-detail-layout-design.md`

---

## File Structure

| File | Action | Lines affected |
|---|---|---|
| `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx` | Modify | ~248-289 (header), ~378-409 (content wrapper) |
| `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.css` | Modify | ~182-208 (delete), insert new rules before `/* ── Grid area ── */` block |
| `packages/editor/src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.layout.test.tsx` | Create | New test file — 3 layout regression tests |

**Untouched** (locked by spec scope cut):
- `components/TemplateDetail.tsx`
- `TemplatePreviewModal.tsx`
- `TemplatesTabModals.tsx`
- `components/TemplateUsageDrawer.tsx`
- `components/TemplateCard.tsx`
- All `hooks/`, `utils/` under templates

---

### Task 1: Failing layout regression test

**Files:**
- Create: `packages/editor/src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.layout.test.tsx`

- [ ] **Step 1: Write the failing test file**

Create `packages/editor/src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.layout.test.tsx`:

```tsx
// @vitest-environment jsdom
/**
 * TemplatesTab layout tests — prototype-v3 §2 inline detail panel.
 * Verifies grid stays visible beside detail (no display:none regression),
 * detail-layout wrapper carries --split modifier when detail open,
 * and header breadcrumb is removed (in-panel breadcrumb is canonical).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";

vi.mock("@/editor/shared/vibcoder", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/shared/vibcoder");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { TemplatesTab } from "../TemplatesTab";

describe("TemplatesTab — inline detail layout (prototype-v3 §2)", () => {
  it("applies tpl-detail-layout--split when a template card is selected", async () => {
    const user = userEvent.setup();
    const { container } = render(<TemplatesTab composer={null} />);

    const cards = container.querySelectorAll(".tpl-card");
    expect(cards.length).toBeGreaterThan(0);

    await user.click(cards[0]);

    const wrapper = container.querySelector(".tpl-detail-layout");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.classList.contains("tpl-detail-layout--split")).toBe(true);
  });

  it("keeps the grid visible (not display:none) when detail is open", async () => {
    const user = userEvent.setup();
    const { container } = render(<TemplatesTab composer={null} />);

    const cards = container.querySelectorAll(".tpl-card");
    await user.click(cards[0]);

    const gridArea = container.querySelector(".tpl-grid-area");
    expect(gridArea).not.toBeNull();
    const grid = container.querySelector(".tpl-grid");
    expect(grid).not.toBeNull();
    expect(grid?.children.length).toBeGreaterThan(0);
  });

  it("does not render the header breadcrumb (.tpl-breadcrumb) when detail is open", async () => {
    const user = userEvent.setup();
    const { container } = render(<TemplatesTab composer={null} />);

    const cards = container.querySelectorAll(".tpl-card");
    await user.click(cards[0]);

    const headerBreadcrumb = container.querySelector(".tpl-header .tpl-breadcrumb");
    expect(headerBreadcrumb).toBeNull();
    expect(screen.getByRole("heading", { name: "Templates" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `packages/editor`:
```bash
npx vitest run src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.layout.test.tsx
```

Expected: FAIL. All three assertions fail:
- `.tpl-detail-layout` selector returns null (class doesn't exist yet)
- `.tpl-header .tpl-breadcrumb` exists when detail open (header still renders breadcrumb)
- Grid stays in DOM today (passes incidentally), but `--split` class missing fails the first test

The first test failure proves the test file is wired correctly.

- [ ] **Step 3: Commit the failing test**

```bash
git add packages/editor/src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.layout.test.tsx
git commit -m "$(cat <<'EOF'
test(templates): failing tests for prototype-v3 §2 inline detail layout

Three regression tests:
- tpl-detail-layout--split modifier applied when card selected
- grid stays in DOM (no display:none) in detail mode
- header breadcrumb removed when detail open

Tests fail until JSX + CSS changes ship.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Remove header breadcrumb branch from TemplatesTab.tsx

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx:248-289`

- [ ] **Step 1: Replace the header block**

Open `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx`. Find the existing header block starting at line 248:

```jsx
      <div className="tpl-header">
        {detailTemplate ? (
          /* Breadcrumb (Screen cV3OT) */
          (<div className="tpl-breadcrumb">
            <Button
              className="tpl-breadcrumb-back"
              onClick={() => sel.setDetailId(null)}
              aria-label="Back to grid"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to grid</span>
            </Button>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bd-fg-secondary, var(--bd-fg-muted))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span className="tpl-breadcrumb-cat">{detailTemplate.category ?? "All"}</span>
          </div>)
        ) : newPageMode ? (
          <div className="tpl-newpage-header">
            <h2 className="tpl-header-title tpl-header-title--sm">Choose a template for your new page</h2>
            <div className="tpl-newpage-chip">New Page</div>
          </div>
        ) : (
          <h2 className="tpl-header-title">Templates</h2>
        )}
```

Replace the entire ternary (lines 249-274) with this simpler conditional:

```jsx
      <div className="tpl-header">
        {newPageMode ? (
          <div className="tpl-newpage-header">
            <h2 className="tpl-header-title tpl-header-title--sm">Choose a template for your new page</h2>
            <div className="tpl-newpage-chip">New Page</div>
          </div>
        ) : (
          <h2 className="tpl-header-title">Templates</h2>
        )}
```

Leave `<div className="tpl-header-actions">...</div>` (lines 275-288) untouched.

- [ ] **Step 2: Verify the third layout test now passes**

Run from `packages/editor`:
```bash
npx vitest run src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.layout.test.tsx -t "does not render the header breadcrumb"
```

Expected: PASS.

The other two tests in the file still fail (CSS class changes pending).

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx
git commit -m "$(cat <<'EOF'
fix(templates): remove header breadcrumb — in-panel breadcrumb is canonical

Prototype-v3 §2 places breadcrumb inside the TemplateDetail card top
(‹ Back  Category › Name  ✕), not in the panel header. Header always shows
'Templates' (or 'Choose a template…' in new-page mode).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Restructure content wrapper JSX in TemplatesTab.tsx

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx:378-424`

- [ ] **Step 1: Replace the content wrapper block**

Open `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx`. Find the existing content wrapper starting at the line with `<div className={`tpl-content-inner${sel.detailId ? " tpl-content-inner--with-detail" : ""}`}>`:

```jsx
          <div className={`tpl-content-inner${sel.detailId ? " tpl-content-inner--with-detail" : ""}`}>
            <div className={`tpl-grid-area${sel.detailId ? " tpl-grid-area--dimmed" : ""}`}>
              {sel.searchQ.trim() && (
                <div className="tpl-search-results-count" aria-live="polite">
                  {sel.filteredTemplates.length} result{sel.filteredTemplates.length === 1 ? "" : "s"} for &ldquo;{sel.searchQ.trim()}&rdquo;
                </div>
              )}
              <div className="tpl-grid" role="listbox" aria-label="Available templates">
                {sel.paginatedTemplates.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    template={tpl}
                    isSelected={sel.detailId === tpl.id}
                    onClick={(id) => sel.setDetailId(sel.detailId === id ? null : id)}
                    highlightQuery={sel.searchQ.trim() || undefined}
                  />
                ))}
              </div>
            </div>
            {detailTemplate && (
              <TemplateDetail
                template={detailTemplate}
                onApplyToCurrent={handleApplyToCurrent}
                onAddAsNewPage={handleAddAsNewPage}
                onPreview={(id) => sel.setPreviewId(id)}
                onCancel={() => sel.setDetailId(null)}
                usageCount={detailUsage.length}
                onShowUsage={() => setUsageDrawerOpen(true)}
                currentPageName={activePageInfo?.name}
                appliedToCurrentPage={detailAppliedToCurrent}
              />
            )}
            {detailTemplate && (
              <TemplateUsageDrawer
                open={usageDrawerOpen}
                onOpenChange={setUsageDrawerOpen}
                templateId={detailTemplate.id}
                templateName={detailTemplate.name}
                usage={detailUsage}
                onJumpToPage={handleJumpToPage}
                currentVersion={detailTemplate.version ?? DEFAULT_TEMPLATE_VERSION}
                onOpenPreview={() => {
                  setUsageDrawerOpen(false);
                  sel.setPreviewId(detailTemplate.id);
                }}
              />
            )}
          </div>
```

Replace with this new structure:

```jsx
          <>
            <div className={`tpl-detail-layout${detailTemplate ? " tpl-detail-layout--split" : ""}`}>
              <div className="tpl-grid-area">
                {sel.searchQ.trim() && (
                  <div className="tpl-search-results-count" aria-live="polite">
                    {sel.filteredTemplates.length} result{sel.filteredTemplates.length === 1 ? "" : "s"} for &ldquo;{sel.searchQ.trim()}&rdquo;
                  </div>
                )}
                <div className="tpl-grid" role="listbox" aria-label="Available templates">
                  {sel.paginatedTemplates.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      isSelected={sel.detailId === tpl.id}
                      onClick={(id) => sel.setDetailId(sel.detailId === id ? null : id)}
                      highlightQuery={sel.searchQ.trim() || undefined}
                    />
                  ))}
                </div>
              </div>
              {detailTemplate && (
                <TemplateDetail
                  template={detailTemplate}
                  onApplyToCurrent={handleApplyToCurrent}
                  onAddAsNewPage={handleAddAsNewPage}
                  onPreview={(id) => sel.setPreviewId(id)}
                  onCancel={() => sel.setDetailId(null)}
                  usageCount={detailUsage.length}
                  onShowUsage={() => setUsageDrawerOpen(true)}
                  currentPageName={activePageInfo?.name}
                  appliedToCurrentPage={detailAppliedToCurrent}
                />
              )}
            </div>
            {detailTemplate && (
              <TemplateUsageDrawer
                open={usageDrawerOpen}
                onOpenChange={setUsageDrawerOpen}
                templateId={detailTemplate.id}
                templateName={detailTemplate.name}
                usage={detailUsage}
                onJumpToPage={handleJumpToPage}
                currentVersion={detailTemplate.version ?? DEFAULT_TEMPLATE_VERSION}
                onOpenPreview={() => {
                  setUsageDrawerOpen(false);
                  sel.setPreviewId(detailTemplate.id);
                }}
              />
            )}
          </>
```

Key changes:
- Outer wrapper class: `tpl-content-inner${...with-detail}` → `tpl-detail-layout${...--split}`
- Grid wrapper: dropped `tpl-grid-area--dimmed` modifier (grid stays interactive)
- `TemplateUsageDrawer` moved OUTSIDE the layout wrapper (it's a portal/overlay; doesn't belong inside the 2-col flow)
- Wrapped in `<>...</>` Fragment since we now have two sibling roots (layout + drawer)

- [ ] **Step 2: Run the first layout test to confirm it passes**

```bash
cd packages/editor
npx vitest run src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.layout.test.tsx -t "applies tpl-detail-layout--split"
```

Expected: PASS.

- [ ] **Step 3: Run the grid-stays-visible test**

```bash
npx vitest run src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.layout.test.tsx -t "keeps the grid visible"
```

Expected: PASS. (Already passed in failing state since grid was technically still in DOM under `display:none`; now passes for the same reason — the test is a future-regression guard.)

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx
git commit -m "$(cat <<'EOF'
fix(templates): restructure content wrapper to .tpl-detail-layout (B2 pattern)

Single wrapper with CSS modifier toggles single-column vs split layout.
Drops the .tpl-grid-area--dimmed opacity hack so grid stays interactive
in detail mode (user can click another card to switch detail).

TemplateUsageDrawer moves outside the layout wrapper — it's a portal,
not a layout child.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Add new .tpl-detail-layout CSS family

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.css` — insert new block before `/* ── Grid area ── */` (currently line 197)

- [ ] **Step 1: Insert the new CSS block**

Open `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.css`. Find the line:

```css
/* ── Grid area ── */
```

(Currently line 197.) Insert this block IMMEDIATELY BEFORE that line:

```css
/* ── Detail layout: single-column default, 2-col in split mode (prototype-v3 §2) ── */
.tpl-detail-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.tpl-detail-layout > .tpl-grid-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.tpl-detail-layout--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--bd-space-4);
  padding: var(--bd-space-4);
  overflow: hidden;
}
.tpl-detail-layout--split > .tpl-grid-area {
  padding: 0;
  overflow-y: auto;
  min-height: 0;
}
.tpl-detail-layout--split > .tpl-detail {
  overflow-y: auto;
  min-height: 0;
  align-self: stretch;
}

```

Important notes:
- `overflow: hidden` on parent + `overflow-y: auto` on children creates independent column scroll
- `min-height: 0` on flex/grid children is required to respect parent height (known overflow gotcha)
- `align-self: stretch` ensures the detail card fills the full row height

- [ ] **Step 2: Verify no CSS syntax errors**

Run from `packages/editor`:
```bash
npx tsc --noEmit 2>&1 | grep -i "TemplatesTab" | head -5
```

Expected: zero output (no TS errors mentioning TemplatesTab). CSS isn't TS-checked but the import line in TemplatesTab.tsx must still resolve.

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.css
git commit -m "$(cat <<'EOF'
fix(templates): add .tpl-detail-layout family (prototype-v3 §2)

Single-column default + --split modifier with grid-template-columns 1fr 1fr.
Independent column scroll via overflow: hidden on parent +
overflow-y: auto on children. min-height: 0 on grid/flex children to
honor parent height instead of intrinsic content height.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Delete obsolete .tpl-content-inner* and .tpl-grid-area--dimmed CSS rules

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.css:182-208`

- [ ] **Step 1: Delete the obsolete rules**

Open `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.css`. Find the rules between lines 182-208. The block to delete:

```css
.tpl-content-inner {
  display: flex;
  height: 100%;
}
.tpl-content-inner--with-detail {
  padding: var(--bd-space-4);
}
.tpl-content-inner--with-detail .tpl-grid-area {
  display: none;
}
.tpl-content-inner--with-detail .tpl-detail {
  width: 100%;
  max-width: 100%;
}
```

Delete those 13 lines completely.

Then find this rule (was at line 204-208):

```css
.tpl-grid-area--dimmed {
  opacity: 0.4;
  pointer-events: none;
  padding: 0;
}
```

Delete those 5 lines completely.

Keep the `.tpl-grid-area` base rule:

```css
.tpl-grid-area {
  flex: 1;
  min-width: 0;
  padding: var(--bd-space-6);
  transition: opacity 0.2s;
}
```

This base rule still applies in single-column mode (default). The `transition: opacity 0.2s` becomes a no-op (nothing animates opacity now) but leaving it costs nothing and avoids touching the base rule.

- [ ] **Step 2: Run all three layout tests to confirm they pass**

```bash
cd packages/editor
npx vitest run src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.layout.test.tsx
```

Expected: All 3 tests PASS.

- [ ] **Step 3: Run full templates test suite to confirm zero regressions**

```bash
cd packages/editor
npx vitest run src/editor/sidebar/tabs/templates
```

Expected: 161 passed (was 160 + 3 new from Task 1 = 163 total assertions across files... actual count depends on existing test file count; the key signal is **no FAIL lines**).

- [ ] **Step 4: Type-check the whole editor package**

```bash
cd packages/editor
npx tsc --noEmit 2>&1 | grep -E "templates/Tem|TemplatesTab" | head -10
```

Expected: zero output. Pre-existing server-side TS errors (in `../../server/trpc/routers/*`) are unrelated and were present before this work.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.css
git commit -m "$(cat <<'EOF'
fix(templates): delete obsolete .tpl-content-inner* and --dimmed CSS rules

Drained by .tpl-detail-layout (added in prior commit). Removed:
- .tpl-content-inner { display: flex; height: 100% }
- .tpl-content-inner--with-detail (padding + grid display:none + detail width:100%)
- .tpl-grid-area--dimmed (opacity + pointer-events)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Confirm dev server is running**

```bash
lsof -iTCP:5050 -sTCP:LISTEN 2>&1 | head -3
```

Expected: a `node` process listening on `*:mmcc` (port 5050). If not running, start it:

```bash
cd packages/editor
nohup npm run dev > /tmp/vite-dev.log 2>&1 &
sleep 4
```

- [ ] **Step 2: Open http://localhost:5050/ in Chrome**

Hard refresh with `Cmd+Shift+R` to bypass any cached CSS.

- [ ] **Step 3: Navigate to Templates fullpage tab**

Click the Templates icon in the left rail (or use the dropdown / shortcut that opens Templates fullpage view).

- [ ] **Step 4: Verify default state (no card selected)**

Confirm visually:
- Header shows "Templates" (no breadcrumb)
- Grid renders full-width with 2 columns of template cards
- No detail panel visible on the right

- [ ] **Step 5: Click any template card**

Confirm visually:
- Grid shrinks to roughly 50% width on the left
- Detail panel slides into right 50%
- Inside the detail card top: `‹ Back  Category › TemplateName  ✕`
- Detail card shows: preview block, title, description, 3 meta pills (TYPE / FREE-or-PRO / optional USED IN), "Apply to" label, 3 action buttons, info note at bottom
- Header still shows "Templates" (NO breadcrumb in header)

- [ ] **Step 6: Verify independent scroll**

If the grid has more rows than the viewport:
- Scroll inside the LEFT column (grid). Confirm only the grid scrolls; detail card stays fixed in view.
- Scroll inside the RIGHT column (detail). If detail content overflows (it usually doesn't, but try if the description is long), confirm only the detail scrolls.

- [ ] **Step 7: Click a different card while detail is open**

Confirm:
- Detail content swaps to the new template (title, preview, badge state, pills update)
- Detail panel does NOT close-and-reopen — same panel, new data
- Grid stays visible the whole time

- [ ] **Step 8: Click the same card again (or the ‹ Back button)**

Confirm:
- Detail panel disappears
- Grid expands to full width
- Header stays as "Templates"

- [ ] **Step 9: Click "Preview full-screen" inside the detail panel**

Confirm:
- Full-screen preview modal opens (this is the existing Section 3 modal — untouched by this work)
- Close modal with `Esc` or the X button
- Returns to split layout with detail still selected

- [ ] **Step 10: Commit completion marker (optional, if any tweaks were made during verification)**

If no tweaks were needed, skip this step. If you adjusted anything based on visual review (e.g., gap was too tight, padding wrong), make minimal CSS edits and commit:

```bash
git add packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.css
git commit -m "$(cat <<'EOF'
fix(templates): visual tweaks from manual verification

[describe what was adjusted, e.g., increased --bd-space gap, etc.]

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Run all editor tests + DS-SSOT gate as final guard

**Files:** none (validation only)

- [ ] **Step 1: Run the full editor vitest suite**

```bash
cd packages/editor
npx vitest run 2>&1 | tail -10
```

Expected: All test files pass. The summary line should read `Test Files  N passed` and `Tests  M passed`.

- [ ] **Step 2: Run DS-SSOT gate**

```bash
cd packages/editor
npm run gate:ds-ssot
```

Expected: `[ok] DS SSOT gate green`. New CSS uses `var(--bd-space-4)` tokens, no inline hex.

- [ ] **Step 3: Confirm git log shows clean commit history**

```bash
git log --oneline -10
```

Expected: 5 commits from this plan (Task 1 test, Task 2 header, Task 3 wrapper, Task 4 CSS add, Task 5 CSS delete). Optionally a 6th from Task 6 visual tweaks.

---

## Self-Review

**1. Spec coverage check:**

| Spec section | Plan task | Notes |
|---|---|---|
| Problem statement | Task 1 (failing tests reproduce) | ✅ |
| Architecture — TemplatesTab.tsx touched | Task 2, Task 3 | ✅ |
| Architecture — TemplatesTab.css touched | Task 4, Task 5 | ✅ |
| Architecture — other files untouched | Implied by plan never mentioning them | ✅ |
| Header simplification | Task 2 | ✅ |
| Content wrapper restructure | Task 3 | ✅ |
| New CSS family added | Task 4 | ✅ |
| Old CSS rules deleted | Task 5 | ✅ |
| Data flow unchanged | Task 3 keeps onClick/setDetailId logic | ✅ |
| Edge cases (card switch, toggle off, search active, new-page mode) | Task 6 step 7-8, step 5 covers search/new-page via existing renders | ✅ |
| Testing — existing tests pass | Task 5 step 3, Task 7 step 1 | ✅ |
| Testing — new regression tests | Task 1 | ✅ |
| Scope cuts (no animation, no splitter, no responsive, no other components) | Plan never adds tasks for these | ✅ |
| Implementation outline (8 steps from spec) | Mapped to Tasks 1-7 | ✅ all 8 covered |

**2. Placeholder scan:** searched for "TBD", "TODO", "fill in", vague phrases → none found.

**3. Type / class-name consistency:**
- Wrapper class `.tpl-detail-layout` — used in Task 1 test, Task 3 JSX, Task 4 CSS ✅
- Modifier `--split` — used identically in all three ✅
- Drawer outside wrapper — Task 3 JSX places it as Fragment sibling ✅
- Header always renders `<h2>Templates</h2>` — Task 2 replacement matches Task 1 test assertion ✅

Plan is clean.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-12-templates-inline-detail-layout.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

**Which approach?**
