# Build Tab — V4 Implementation Design

> **⚠️ SUPERSEDED — DO NOT IMPLEMENT**
>
> This spec was invalidated by the 2026-04-18 CEO review (`/plan-ceo-review`).
> **Outside voice (Codex)** found 7 structural errors: the "fresh rewrite" premise
> was wrong because most claimed "new v4 features" already exist in current code:
>
> - Last-in-wins accordion: already in `useBuildTab.ts:198-204`
> - Icon grid for Sections: already in `SectionsMode.tsx:161`
> - `useBlockInsertion` shell hook: already provides spam-guard, smart parent
>   resolution, transactions, toast feedback — this spec would bypass it
> - `useSectionInsert` uses a different MIME (`application/aquibra-template`) —
>   this spec's unified `insertBlock` path would break sections
> - `storageKeys.ts` has canonical `aqb-*` keys; this spec invents raw strings
> - Current code uses `sessionStorage` for mode/open-cats; this spec moves to
>   `localStorage` (changes persistence semantics)
> - Shared `PanelHeader` + `SearchBar` have debounce/analytics/kbd behavior
>   this spec forks, losing functionality
>
> **Correct approach:** targeted surgical refactor, NOT ground-up rewrite.
> A replacement spec will be authored. See CEO review log for findings detail.

**Date:** 2026-04-18
**Branch:** `main`
**Authority:** `docs/superpowers/specs/build-tab-prototypes-v4.html` (pixel-perfect reference)
**Supersedes:** `docs/superpowers/specs/2026-04-18-build-tab-prototype-design.md` (v2, outdated where it conflicts with v4 HTML)

---

## 1. Context

The Build Tab v4 prototype was produced on 2026-04-18 as a full visual redesign of the Add tab in the editor's left sidebar. Six screens cover every state: Elements default, category accordion open, search results, no-results, Sections icon grid, and collapsed-tips state.

A prior spec doc (v2, `2026-04-18-build-tab-prototype-design.md`) was written but **never implemented** — zero commits touched `BuildTab.tsx` after the spec was authored. The v2 spec also contradicts v4 in places (tips placement, Sections mode structure); **v4 HTML is authoritative** wherever the two disagree.

This document specifies a **fresh rewrite** of the Build tab UI layer, preserving the engine/data layer (`catalog/`, `blocks/`, composer integration).

### Key V4 Changes from Current Code

| Current | V4 |
|---|---|
| QuickPicks pinned chips above scroll | **Deleted entirely** |
| AI Suggestions card | **Deleted entirely** |
| Tips as separate footer region | **Inside pinned bottom strip (below tip dots)** |
| All categories can be open simultaneously | **Last-in-wins — only one category open at a time** |
| Sections mode: flat family list | **Section type icon grid (9 types) + Templates accordion** |
| No transition notice for removed features | **"Quick Picks removed" callout, one-time, auto-dismiss 8s** |

---

## 2. Decisions Captured from Brainstorming

| # | Question | Decision |
|---|---|---|
| 1 | Scope | **(A) Full v4 in one shot** — all 6 screens, structural changes, new Sections mode together |
| 2 | Data migration | **(C) Transition callout with auto-dismiss** — shown once if user had picks, auto-dismisses after 8s, wipes `BUILD_PICKS` + `BUILD_FTUE_SEEN` from localStorage |
| 3 | Testing | **(A) Full TDD** — failing tests first, then implementation, red→green→refactor |
| 4 | Right-click pin | **(B) Drop pin mention** — callout text changed to "Browse and drag elements directly from categories below". Pin/favorites feature out of scope — separate future plan |
| 5 | Implementation approach | **Fresh rewrite (UI only)** — delete all existing UI files, rebuild from v4; reuse engine/data layer (`catalog/`, `blocks/`, composer) |
| 6 | CSS strategy | **Pixel-perfect v4 tokens in self-contained `BuildTab.css`**, no mapping to `--aqb-*`, no changes to `themes/default.css`, scoped via `.bld-v4` wrapper class |
| 7 | Shared primitives | **Not reused** — PanelHeader/SearchBar shared components skipped; v4's own styles used throughout for pixel-perfect match |

---

## 3. Architecture & File Structure

### 3.1 Files to Delete (UI layer — 12 files)

```
packages/editor/src/editor/sidebar/tabs/build/
├── BuildTab.tsx                              DELETE
├── BuildTab.css                              DELETE
├── hooks/useBuildTab.ts                      DELETE
├── components/
│   ├── QuickPicks.tsx                        DELETE
│   ├── AISuggestions.tsx                     DELETE
│   ├── AISuggestions.css                     DELETE
│   ├── CatAccordion.tsx                      DELETE
│   ├── ElCard.tsx                            DELETE
│   ├── SearchResults.tsx                     DELETE
│   ├── TipsFooter.tsx                        DELETE
│   ├── MyComponents.tsx                      DELETE
│   ├── SectionsMode.tsx                      DELETE
│   ├── OnboardingTip.tsx                     DELETE
│   ├── FavZone.tsx                           DELETE
│   ├── SvgIcon.tsx                           DELETE
│   └── __tests__/
│       ├── ElCard.test.tsx                   DELETE
│       └── AISuggestions.test.tsx            DELETE
```

### 3.2 Files to Keep (Data + Engine — untouched)

```
├── catalog/          KEEP — 53 element/section definitions
├── utils/            KEEP — helpers
└── index.ts          UPDATE re-exports only
```

### 3.3 Files to Create (12 files)

```
├── BuildTab.tsx                              NEW (shell — 80-100 lines)
├── BuildTab.css                              NEW (pixel-perfect v4, self-contained)
├── hooks/
│   ├── useBuildTab.ts                        NEW (mode, search, drag, accordion state)
│   └── useCallout.ts                         NEW (transition callout lifecycle)
├── components/
│   ├── icons.tsx                             NEW (all v4 inline SVGs as React components)
│   ├── ModePills.tsx                         NEW (Elements | Sections switcher)
│   ├── SearchBar.tsx                         NEW (v4's own search input with kbd hint)
│   ├── TransitionCallout.tsx                 NEW (one-time notice, auto-dismiss)
│   ├── MyComponents.tsx                      NEW (collapsible section header)
│   ├── CategoryAccordion.tsx                 NEW (last-in-wins, driven by parent prop)
│   ├── ElementCard.tsx                       NEW (icon + name card)
│   ├── SearchResults.tsx                     NEW (grouped results with hit counts)
│   ├── EmptyState.tsx                        NEW (no-results state)
│   ├── SectionsView.tsx                      NEW (icon grid + Templates accordion)
│   └── TipsStrip.tsx                         NEW (tips header + card + dots + footer-hint)
└── __tests__/                                NEW (13 test files — full TDD coverage)
```

### 3.4 Layout Hierarchy (V4 HTML 1:1)

```
<div className="bld-v4">                          ← scoping wrapper (holds all tokens)
  <div className="panel-header">                  ← v4's own panel-header styles
    <span className="panel-title">Add</span>
    <div className="panel-actions">[pin][close]</div>
  </div>
  <div className="panel-body">
    <ModePills />                                 ← .mode-switch > .mode-pill
    <SearchBar />                                 ← .search-wrap > .search-bar (v4 styles)
    <div className="panel-scroll">                ← flex: 1, overflow-y: auto
      {mode === 'elements' && !searching && (
        <>
          {callout.visible && <TransitionCallout />}
          <MyComponents />
          <div className="divider" />
          <div className="sec-label">Categories</div>
          {categories.map(cat => <CategoryAccordion isOpen={openCatId === cat.id} />)}
        </>
      )}
      {mode === 'sections' && !searching && <SectionsView />}
      {searching && (results.length ? <SearchResults /> : <EmptyState />)}
    </div>
    {!searching && <TipsStrip />}                 ← .panel-bottom (pinned, hidden on search)
  </div>
</div>
```

### 3.5 State → Region Map

| State | `panel-scroll` content | `panel-bottom` (TipsStrip) |
|---|---|---|
| Elements mode, idle | Callout? + MyComp + Divider + "CATEGORIES" + accordions | Visible |
| Elements mode, searching with results | SearchResults (grouped) | Hidden |
| Elements mode, searching no results | EmptyState | Hidden |
| Sections mode, idle | "SECTION TYPES" grid + Divider + "TEMPLATES" + accordions | Visible |
| Sections mode, searching | Filtered SectionsView | Hidden |

---

## 4. CSS & Design Tokens

### 4.1 File

**New:** `packages/editor/src/editor/sidebar/tabs/build/BuildTab.css`

Self-contained. No `@import` of `themes/default.css` or `--aqb-*` tokens. Pixel-perfect v4 values.

### 4.2 Token Definitions (Copied Verbatim from V4 Prototype)

All v4 tokens scoped to `.bld-v4` wrapper:

```css
.bld-v4 {
  /* Colors */
  --accent: #2D6DFF;
  --accent-hover: #4D7FFF;
  --accent-bg: rgba(45, 109, 255, 0.08);
  --accent-bg-hover: rgba(45, 109, 255, 0.12);
  --surface: #0f0f14;
  --surface-1: #14141c;
  --surface-2: #1a1a24;
  --surface-3: #22222e;
  --surface-hover: #2a2a3a;
  --surface-active: #32324a;
  --border: #2e2e3e;
  --border-subtle: #242430;
  --text-primary: #f0f0f5;
  --text-secondary: #a0a0b0;
  --text-muted: #686878;
  --text-tertiary: #484858;
  --warning: #F59E0B;
  --warning-bg: rgba(245, 158, 11, 0.08);
  --success: #10B981;

  /* Typography */
  --font-ui: 'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;

  /* Spacing — 4px base */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-5: 20px; --sp-6: 24px; --sp-8: 32px; --sp-10: 40px;

  /* Radii */
  --r-sm: 4px; --r-md: 6px; --r-lg: 8px; --r-xl: 12px; --r-pill: 999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.5);
  --shadow-glow: 0 0 0 1px var(--accent), 0 0 12px rgba(45, 109, 255, 0.3);

  /* Container */
  font-family: var(--font-ui);
  color: var(--text-primary);
  background: var(--surface-1);
  height: 100%;
  display: flex;
  flex-direction: column;
}
```

### 4.3 Class Names

V4's exact class names, scoped via `.bld-v4` wrapper (no `.bld-` prefix needed — wrapper provides isolation):

`.panel-header`, `.panel-title`, `.panel-actions`, `.icon-btn`, `.panel-body`, `.panel-scroll`, `.panel-bottom`, `.mode-switch`, `.mode-pill`, `.mode-pill.active`, `.search-wrap`, `.search-bar`, `.kbd-hint`, `.change-callout`, `.change-callout-text`, `.mycomp-hd`, `.mycomp-chev`, `.mycomp-label`, `.divider`, `.sec-label`, `.cat-item`, `.cat-row`, `.cat-row.open`, `.cat-body`, `.cat-body.open`, `.cat-body-inner`, `.cat-name`, `.cat-chev`, `.el-grid`, `.el-card`, `.el-icon`, `.el-name`, `.tips-hd`, `.tips-icon`, `.tips-label`, `.tips-meta`, `.tips-nav-btns`, `.tips-nav-btn`, `.tip-card`, `.tip-dots`, `.tip-dot`, `.tip-dot.on`, `.panel-footer-hint`.

Each selector written as `.bld-v4 .xyz` to guarantee scope.

### 4.4 Icons

V4's inline SVGs become React components in `components/icons.tsx`. Lucide-react is NOT used in the new Build tab.

Example:
```tsx
export const IconPlus: React.FC = () => (
  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
```

### 4.5 Typography

Font sizes specified inline in CSS (px values), per v4:
- Panel title: 13px / 600 weight
- Element card labels: 12px
- Metadata / kbd hints: 11px
- Section labels (CATEGORIES, SECTION TYPES): 10px / 600 weight / 0.06em letter-spacing / uppercase

No font-size tokens (not in DESIGN.md; can unify later).

---

## 5. Data Flow & State

### 5.1 `useBuildTab` Hook (Rewritten)

```typescript
interface BuildTabState {
  mode: 'elements' | 'sections';
  searchQuery: string;
  openCatId: string | null;      // last-in-wins: only one open
  myCompOpen: boolean;
  tipIdx: number;
  tipsCollapsed: boolean;
  tipDismissed: boolean;
}

interface BuildTabHandlers {
  setMode: (m: 'elements' | 'sections') => void;
  setSearchQuery: (q: string) => void;   // auto-clears when mode changes
  toggleCat: (catId: string) => void;
  setMyCompOpen: (v: boolean) => void;
  tipPrev: () => void;
  tipNext: () => void;
  tipSetAt: (idx: number) => void;
  toggleTipsCollapsed: () => void;
  dismissTip: () => void;
  handleDragStart: (e: React.DragEvent, data: BlockData) => void;
  handleElClick: (data: BlockData) => void;
}
```

**Removed from prior hook:** `picks`, `ftueSeen`, `addPick`, `removePick`, `togglePick`, `dismissFtue`.

### 5.2 Last-In-Wins Accordion

Single source of truth: `openCatId: string | null` in `useBuildTab`.

```typescript
toggleCat(catId: string) {
  setOpenCatId(prev => prev === catId ? null : catId);
}
```

Each `<CategoryAccordion>` receives `isOpen={openCatId === cat.id}` as a prop; clicking fires `toggleCat(cat.id)`. Same pattern for Templates accordions in Sections mode (second independent source of truth: `openTemplateId`).

### 5.3 `useCallout` Hook (New)

```typescript
function useCallout(autoDismissMs: number = 8000) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const picks = localStorage.getItem('BUILD_PICKS');
    const hasPicks = picks ? JSON.parse(picks).length > 0 : false;
    const seenFlag = localStorage.getItem('BUILD_V4_TRANSITION_SEEN') === '1';
    return hasPicks && !seenFlag;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seenFlag = localStorage.getItem('BUILD_V4_TRANSITION_SEEN') === '1';
    if (!visible && !seenFlag) {
      localStorage.setItem('BUILD_V4_TRANSITION_SEEN', '1');
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => dismiss(), autoDismissMs);
    return () => clearTimeout(t);
  }, [visible, autoDismissMs]);

  const dismiss = useCallback(() => {
    localStorage.removeItem('BUILD_PICKS');
    localStorage.removeItem('BUILD_FTUE_SEEN');
    localStorage.setItem('BUILD_V4_TRANSITION_SEEN', '1');
    setVisible(false);
  }, []);

  return { visible, dismiss };
}
```

Edge cases handled: SSR safety (window check), timer cleanup on unmount, idempotent dismiss, first-time user silent flag.

### 5.4 Drag + Click to Canvas (Engine Integration — Unchanged)

```typescript
function handleDragStart(e: React.DragEvent, data: BlockData) {
  e.dataTransfer.setData('application/aquibra-block', JSON.stringify(data));
  e.dataTransfer.effectAllowed = 'copy';
}

function handleElClick(data: BlockData) {
  if (!composer) return;
  composer.elements.insertBlock(data);  // existing engine API
}
```

### 5.5 Search Behavior

During search (`searchQuery.trim().length > 0`):
- `panel-scroll` renders `SearchResults` (if results) or `EmptyState` (if none)
- `panel-bottom` (TipsStrip) hidden
- **Search is mode-scoped** (matches v4 prototype's placeholder text: "Search elements..." vs "Search sections..."):
  - Elements mode → searches element catalog only (53 elements across categories)
  - Sections mode → searches section templates only (9 types + template variants)
- Mode switching does NOT carry query across modes (cleared on mode change) — prevents user confusion where typing "hero" in Elements would yield 0 results but switching to Sections would surprise-match.

Escape key in search bar → clears query (existing behavior preserved).

### 5.6 localStorage Key Plan

| Key | Purpose | Written When |
|---|---|---|
| `BUILD_OPEN_CAT` | Last open category | `toggleCat` |
| `BUILD_OPEN_TEMPLATE` | Last open Templates accordion (Sections mode) | Template toggle |
| `BUILD_MY_COMP_OPEN` | MyComponents section state | `setMyCompOpen` |
| `BUILD_TIPS_COLLAPSED` | Tips collapsed state | `toggleTipsCollapsed` |
| `BUILD_TIP_IDX` | Current tip index | tip navigation |
| `BUILD_TIP_DISMISSED` | Tips dismissed forever | `dismissTip` |
| `BUILD_V4_TRANSITION_SEEN` | Callout one-time flag | First mount or dismiss |
| ~~`BUILD_PICKS`~~ | — | **Removed on callout dismiss** |
| ~~`BUILD_FTUE_SEEN`~~ | — | **Removed on callout dismiss** |

---

## 6. Testing Plan (Full TDD)

### 6.1 Test Files to Create (13)

| Unit | Test File |
|---|---|
| `useBuildTab` | `hooks/__tests__/useBuildTab.test.ts` |
| `useCallout` | `hooks/__tests__/useCallout.test.ts` |
| `BuildTab` shell | `__tests__/BuildTab.test.tsx` |
| `ModePills` | `components/__tests__/ModePills.test.tsx` |
| `CategoryAccordion` | `components/__tests__/CategoryAccordion.test.tsx` |
| `ElementCard` | `components/__tests__/ElementCard.test.tsx` |
| `SearchResults` | `components/__tests__/SearchResults.test.tsx` |
| `EmptyState` | `components/__tests__/EmptyState.test.tsx` |
| `SectionsView` | `components/__tests__/SectionsView.test.tsx` |
| `TransitionCallout` | `components/__tests__/TransitionCallout.test.tsx` |
| `MyComponents` | `components/__tests__/MyComponents.test.tsx` |
| `TipsStrip` | `components/__tests__/TipsStrip.test.tsx` |
| `SearchBar` | `components/__tests__/SearchBar.test.tsx` |

### 6.2 Critical Test Scenarios (Must-Have)

**`useCallout` — 4 visibility cases:**
1. New user (no picks, no flag) → hidden; silent flag set
2. Returning user with picks + no flag → visible
3. User with picks + already-seen flag → hidden
4. User with empty picks array → hidden

**`useCallout` — auto-dismiss timer (fake timers):**
- After 8s: `visible === false`; `BUILD_PICKS`, `BUILD_FTUE_SEEN` removed; `BUILD_V4_TRANSITION_SEEN === '1'`

**`useBuildTab` — last-in-wins:**
- Opening B while A is open → B open, A closed
- Clicking currently-open A → A closes, `openCatId === null`

**`BuildTab` — bottom strip behavior:**
- Idle state: TipsStrip in DOM
- Search with query: TipsStrip removed from DOM
- Empty search: TipsStrip back

### 6.3 Tests to Delete

```
components/__tests__/AISuggestions.test.tsx     DELETE
components/__tests__/ElCard.test.tsx            DELETE (replaced by ElementCard.test.tsx)
hooks/__tests__/useBuildTab.test.ts             REWRITE
```

### 6.4 Acceptance Gate

Implementation complete when:
1. All 13 test files pass (`npx vitest run packages/editor/src/editor/sidebar/tabs/build/`)
2. `npx tsc --noEmit` clean, zero errors
3. Full editor test suite passes (`npx vitest run`) — no regressions
4. Browser `localhost:5050` → Build tab → each of v4's 6 screens renders pixel-match

### 6.5 Out of Scope (Testing)

- Visual regression (Playwright screenshot diff) — future plan
- E2E drag-and-drop against real canvas — existing integration tests cover this

---

## 7. Implementation Sequence

**Total:** 9 commits across 3 phases. Each commit atomic, revertable.

### Phase 1: Foundation (3 commits)

1. `feat(build): scaffold v4 icons registry` — `components/icons.tsx`
2. `test+feat(build): useCallout hook with auto-dismiss + storage migration`
3. `test+feat(build): useBuildTab hook — mode/search/accordion/drag`

### Phase 2: Leaf Components (4 commits)

4. `feat(build): ElementCard + CategoryAccordion with tests`
5. `feat(build): TransitionCallout + MyComponents + TipsStrip + EmptyState`
6. `feat(build): SearchResults + ModePills + SearchBar`
7. `feat(build): SectionsView with icon grid + Templates accordion` (+ catalog data if missing)

### Phase 3: Integration + Cleanup (2 commits)

8. `feat(build): v4 shell — BuildTab.tsx + BuildTab.css` **← CRITICAL: browser render flip**
9. `chore(build): delete legacy files + cleanup`

### Risk Checkpoints

| After commit | Verify |
|---|---|
| 3 | Hook tests green in isolation |
| 7 | All new components render via their unit tests |
| **8 (CRITICAL)** | Browser shows v4 all 6 screens; no regressions in other tabs |
| 9 | `git grep "QuickPicks\|AISuggestions\|CatAccordion\|ElCard\|TipsFooter\|OnboardingTip\|FavZone\|SvgIcon"` returns zero hits in `src/` |

### Rollback

Phase 1-2 additive (no UI change yet) → trivially revertable. Phase 3 Commit 8 is the flip → `git revert <sha>` restores prior UI. Commit 9 is cleanup only, revertable without restoring functionality.

### Effort Estimate

| Phase | Human Solo | AI-Assisted |
|---|---|---|
| 1 (hooks + icons) | 4 hrs | ~25 min |
| 2 (components) | 8 hrs | ~45 min |
| 3 (integration + cleanup) | 3 hrs | ~20 min |
| **Total** | **15 hrs** | **~90 min** |

---

## 8. NOT in Scope

- ❌ Right-click context menu for pin/favorite actions
- ❌ Replacement Favorites/Pins UI
- ❌ AI element suggestions or prompts
- ❌ Changes to `catalog/catalog.ts` element HTML templates
- ❌ Changes to `composer`, `engine/`, or any non-UI code
- ❌ Sidebar shell, rail, or panel-width changes
- ❌ Visual regression testing infrastructure (Playwright)
- ❌ Design token unification with Buildrik canonical `--aqb-*` system
- ❌ Cross-tab design consistency changes (Pages, Layers, etc.)

---

## 9. Open Questions for CEO Review

These are surfaced for the `/plan-ceo-review` pass that will follow this spec:

1. **Premise check:** Is rebuilding the Build tab UI the highest-leverage work right now, or is an adjacent problem (e.g., Media tab polish, Canvas drag stability) more critical to user outcomes?
2. **10x opportunity:** Would AI-powered element suggestions ("suggest based on canvas context") or natural-language insertion ("add a hero with testimonials") deliver 10x the value for 2x the effort? Is v4's static grid the right target, or a stepping stone?
3. **Scope reduction check:** Can the same user benefit be achieved by only deleting QuickPicks + AISuggestions (without a full v4 rebuild)? What does the user lose if we skip the Sections icon grid?
4. **Design token unification:** Is keeping v4 tokens separate from `--aqb-*` a permanent fragmentation or a temporary state? If temporary, when do we unify — and who owns that?
5. **Transition callout UX:** Is auto-dismiss at 8s the right duration? Does a user glancing at the tab catch it in time? Should it be dismissible manually via click-anywhere instead?

---

## 10. References

- V4 prototype: `docs/superpowers/specs/build-tab-prototypes-v4.html`
- Prior (superseded) spec: `docs/superpowers/specs/2026-04-18-build-tab-prototype-design.md`
- Build tab audit: `docs/superpowers/audit/2026-04-18-build-tab-audit.md`
- Project conventions: `CLAUDE.md`, `packages/editor/CLAUDE.md`
- Design system: `DESIGN.md`
