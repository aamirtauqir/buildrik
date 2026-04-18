# Build Tab — V4 Surgical Refactor Design (V2)

**Date:** 2026-04-18
**Branch:** `main`
**Authority:** `docs/superpowers/specs/build-tab-prototypes-v4.html` (pixel-perfect reference)
**Supersedes:** `2026-04-18-build-tab-v4-implementation-design.md` (V1 — invalidated by CEO review)
**CEO review outcome:** See commit `8f918d1` for why V1 was scrapped.

---

## 1. Context

V1 of this spec proposed a "fresh rewrite" that would have re-implemented ~25 files worth of UI code. Outside voice review (Codex) revealed the premise was wrong: most claimed "new v4 features" already exist in the codebase. The real delta is small.

**This V2 spec is a surgical refactor.** Delete dead features, restyle layout, add a transition callout, fix one pre-existing bug. Preserve all working infrastructure.

---

## 2. Decisions Preserved from V1 Brainstorming

| # | Decision | Outcome |
|---|---|---|
| 1 | V4 pixel-perfect visual match | ✅ Applied to CSS deltas only |
| 2 | Transition callout for QuickPicks removal | ✅ New component, auto-dismiss 8s |
| 3 | Full TDD | ✅ Tests for TransitionCallout + any modified behavior |
| 4 | Right-click pin dropped, callout wording changed | ✅ Callout: "Browse and drag elements directly from categories below" |

## 3. CEO Review Fixes Incorporated

From the 9 issues surfaced in CEO review of V1, these apply to V2:

| # | Fix | Where in V2 |
|---|---|---|
| 1.1 | `try/catch` around `JSON.parse` on localStorage reads | `useCallout` + any new parsing |
| 2.A | `try/catch` around `localStorage.setItem` (quota errors) | `useCallout.dismiss()` |
| 2.B | `try/catch` around element insertion via `useBlockInsertion` | Already handled by `useBlockInsertion` toast — **reuse existing** |
| 4.3 | Tips nav wraps at boundaries | Verify current code; if not wrap-around, patch `tipPrev`/`tipNext` in existing `useBuildTab` |
| 6.2 | `safeGet`/`safeSet` storage helpers | New utility in `shared/utils/safeStorage.ts` — applied to callout only (existing storage code unchanged to stay stable) |
| 6.3 | Error Boundary for `SectionsMode` lazy-load | Add React Error Boundary around `<Suspense>` in `BuildTab.tsx` |
| 8.1 | `console.debug` on callout lifecycle | Mount + dismiss events |
| 11.1 | Accessibility section | Preserved: current code already has `role="tablist"`, `aria-selected`. TransitionCallout needs `role="status"`. Element cards keep `tabindex="0"` |

Issues 5.1 + 6.1 (atomic `setMode` clear search + rapid mode switch test) — verify current implementation; patch if gap exists.

---

## 4. Files Affected (Surgical Scope)

### NEW Files (3)

```
packages/editor/src/editor/sidebar/tabs/build/
├── components/TransitionCallout.tsx      NEW — one-time dismissible notice
└── hooks/useCallout.ts                    NEW — callout lifecycle + storage

packages/editor/src/shared/utils/
└── safeStorage.ts                         NEW — guarded localStorage helpers
```

### MODIFIED Files (6)

```
packages/editor/src/editor/sidebar/tabs/build/
├── BuildTab.tsx                           MODIFY — remove QuickPicks + AISuggestions JSX,
│                                                    add <TransitionCallout /> mount,
│                                                    add <ErrorBoundary /> around lazy SectionsMode,
│                                                    re-structure to panel-scroll + panel-bottom
├── BuildTab.css                           MODIFY — add .bld-panel-bottom region styles,
│                                                    add .bld-change-callout styles,
│                                                    delete obsolete .bld-qp*, .bld-ftue*,
│                                                    .bld-ai-suggestions* selectors
├── hooks/useBuildTab.ts                   MODIFY — delete picks/ftueSeen state + handlers,
│                                                    verify setMode atomically clears search,
│                                                    verify tipPrev/tipNext wrap

packages/editor/src/shared/constants/
└── storageKeys.ts                         MODIFY — add BUILD_V4_TRANSITION_SEEN key,
                                                     mark BUILD_PICKS + BUILD_FTUE_SEEN as
                                                     "deprecated, cleaned by TransitionCallout"

packages/editor/src/editor/sidebar/
└── TabRouter.tsx                          VERIFY — confirm onBlockClick flows from
                                                    AquibraStudio → TabRouter → BuildTab.
                                                    If broken (per audit), patch.
```

### DELETED Files (4)

```
packages/editor/src/editor/sidebar/tabs/build/components/
├── QuickPicks.tsx                         DELETE
├── AISuggestions.tsx                      DELETE
├── AISuggestions.css                      DELETE
└── __tests__/AISuggestions.test.tsx       DELETE
```

### PRESERVED (critical — do not touch)

```
✅ hooks/useBlockInsertion.ts (shell) — spam guard, smart parent, transaction, toast
✅ hooks/useSectionInsert.ts — HTML template insertion via `application/aquibra-template`
✅ components/SectionsMode.tsx — icon grid already there at line 161
✅ components/CatAccordion.tsx — last-in-wins already implemented
✅ components/ElCard.tsx, SearchResults.tsx, TipsFooter.tsx, MyComponents.tsx
✅ components/icons registry (reuse existing SvgIcon.tsx or inline — implementer's call)
✅ Shared PanelHeader + SearchBar (debounce + analytics + kbd preserved)
✅ catalog/ folder (data untouched)
```

---

## 5. Layout Changes (CSS + JSX Deltas Only)

### 5.1 Current Layout

```
.bld-container (flex col, 100%)
  <PanelHeader />
  .bld-content (flex col, flex 1)
    .bld-mode-switch
    .bld-search-wrap
    <QuickPicks />          ❌ TO REMOVE
    <TipsFooter />
    <MyComponents />
    <AISuggestions />       ❌ TO REMOVE
    .bld-scroll
      <SearchResults /> or <CatAccordion × N />
```

### 5.2 V2 Target Layout (V4 Prototype Match)

```
.bld-container (flex col, 100%)
  <PanelHeader />
  .bld-content (flex col, flex 1)
    .bld-mode-switch
    .bld-search-wrap
    .bld-scroll (flex: 1, overflow-y: auto)
      {callout visible && <TransitionCallout />}
      <MyComponents />
      .bld-divider
      .bld-sec-label "CATEGORIES"
      <CatAccordion × N />  ← pre-existing, last-in-wins intact
    .bld-panel-bottom (flex-shrink: 0, border-top)  ← NEW region
      <TipsFooter />
      .bld-footer-hint "Drag elements onto canvas or click to insert"
```

### 5.3 Key CSS Deltas

Add to `BuildTab.css`:
- `.bld-panel-bottom { flex-shrink: 0; border-top: 1px solid var(--border-subtle); padding: 12px 16px; }`
- `.bld-footer-hint { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted); margin-top: 8px; }`
- `.bld-change-callout { /* v4 prototype styles for transition notice */ }`

Delete from `BuildTab.css`:
- All `.bld-qp*` selectors (QuickPicks)
- All `.bld-ftue*` selectors (QuickPicks FTUE)
- `.chip*` if only used by QuickPicks
- `.bld-pin-popover*` if only used by QuickPicks
- AISuggestions styles (or delete entire `AISuggestions.css`)

Tokens: **use existing `--aqb-*` tokens from `themes/default.css`**. No new token file. No `.bld-v4` wrapper. If specific v4 hex values don't have token matches, add missing tokens to `themes/default.css` as part of this PR.

---

## 6. Storage Changes (Minimal)

### 6.1 New Storage Key

Add to `shared/constants/storageKeys.ts`:
```typescript
BUILD_V4_TRANSITION_SEEN: "aqb-build-v4-transition-seen",
```

Existing keys (`BUILD_PICKS`, `BUILD_FTUE_SEEN`) — **keep in `storageKeys.ts`** with a deprecation comment; callout dismiss removes from storage. Do NOT delete from the registry (breaks migration tooling).

### 6.2 `useCallout` Storage Behavior

```typescript
// Reads
const picks = safeGet(STORAGE_KEYS.BUILD_PICKS);  // null-safe, returns null on any error
const hasPicks = picks ? parseArrayOrDefault(picks, []).length > 0 : false;
const seen = safeGet(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN) === "1";

// On dismiss (safe-wrapped, proceed regardless of failure)
safeRemove(STORAGE_KEYS.BUILD_PICKS);
safeRemove(STORAGE_KEYS.BUILD_FTUE_SEEN);
safeSet(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN, "1");
```

### 6.3 What NOT to Change

- `BUILD_MODE` stays in sessionStorage (intentional: per-tab)
- `BUILD_OPEN_CATS` stays in sessionStorage
- `BUILD_TIP_DISMISSED`, `BUILD_TIPS_COLLAPSED` stay in localStorage
- Existing storage helpers in `useBuildTab.ts` unchanged

---

## 7. Pre-Existing Bug Fix

**Bug (per audit doc):** Click-to-insert broken — `onBlockClick` not wired through TabRouter.

**Verification step:** Read `editor/shell/AquibraStudio.tsx` → does it pass `onBlockClick` to `TabRouter`? TabRouter *does* accept and forward it (line 82). If AquibraStudio doesn't pass it, wire it using the existing `useBlockInsertion(composer).handleBlockClick` hook.

**Fix:** Add (if missing) to AquibraStudio:
```typescript
const { handleBlockClick } = useBlockInsertion(composer);
// ...
<TabRouter onBlockClick={handleBlockClick} ... />
```

If already wired, note in implementation: "onBlockClick wiring verified intact."

---

## 8. Testing Plan

### New Tests (3 files)

| Test file | Covers |
|---|---|
| `__tests__/TransitionCallout.test.tsx` | Renders, role="status", auto-dismisses (fake timers) |
| `hooks/__tests__/useCallout.test.ts` | 4 visibility cases, auto-dismiss, corrupted-JSON safety, quota-error safety, SSR safety, first-time silent flag |
| `shared/utils/__tests__/safeStorage.test.ts` | Returns null on any storage error, never throws |

### Tests to Delete

- `components/__tests__/AISuggestions.test.tsx` (component deleted)

### Tests to Verify/Patch (existing)

- `hooks/__tests__/useBuildTab.test.ts` — verify or add:
  - "setMode clears pending search query"
  - "tipPrev from idx 0 wraps to last"
  - "tipNext from last wraps to idx 0"
  - "rapid mode toggle keeps state consistent"

### Acceptance Gate

1. ✅ All new tests pass
2. ✅ Existing `useBuildTab.test.ts` still passes (no regressions in preserved logic)
3. ✅ `npx tsc --noEmit` clean
4. ✅ Browser `localhost:5050` → Build tab: QuickPicks gone, AISuggestions gone, TipsFooter + footer-hint pinned at bottom, callout dismissible, scroll area clean

---

## 9. Implementation Sequence (4-5 commits)

1. **`feat(build): safeStorage helper + tests`** — new utility, isolated, no dependencies on Build tab
2. **`feat(build): useCallout hook + TransitionCallout component + tests`** — new files only, not yet mounted
3. **`feat(build): restructure layout — .bld-panel-bottom + scroll region + callout mount`** — BuildTab.tsx JSX + CSS delta; wire TransitionCallout. Also delete QuickPicks + AISuggestions imports + JSX + obsolete CSS.
4. **`chore(build): delete QuickPicks + AISuggestions files + tests + obsolete storage state`** — file deletions + useBuildTab hook trim + tests update
5. **`fix(build): verify/wire onBlockClick through AquibraStudio (if broken)`** — pre-existing bug fix, atomic

### Risk Checkpoints

| After commit | Verify |
|---|---|
| 1 | safeStorage unit tests pass |
| 2 | Callout tests pass (incl. corrupted JSON, quota error, SSR) |
| **3 (CRITICAL)** | Browser shows new layout; QuickPicks/AISuggestions gone from render; callout shows if picks pre-existed |
| 4 | `git grep "QuickPicks\|AISuggestions"` returns zero hits in `packages/editor/src/` |
| 5 | Click-to-insert works on elements (verify in browser) |

### Effort

With CC-assisted implementation: **~25-30 min total** (vs V1's estimated 90 min of rewrite work).

---

## 10. NOT in Scope

- ❌ Rewriting working code (`useBlockInsertion`, `useSectionInsert`, `CatAccordion`, `SectionsMode` icon grid, shared `PanelHeader`/`SearchBar`)
- ❌ New `.bld-v4` CSS wrapper (use existing `.bld-*` prefix + canonical `--aqb-*` tokens)
- ❌ New icon registry (existing `SvgIcon.tsx` or inline SVGs acceptable — implementer's choice)
- ❌ Right-click pin / favorites replacement
- ❌ AI element suggestions
- ❌ Design-token unification delta (no fragmentation introduced; uses existing tokens)
- ❌ Engine / composer / catalog data changes
- ❌ Other tabs (Pages, Layers, Media, History)

---

## 11. References

- V4 prototype: `docs/superpowers/specs/build-tab-prototypes-v4.html`
- V1 (superseded): `docs/superpowers/specs/2026-04-18-build-tab-v4-implementation-design.md`
- Build tab audit: `docs/superpowers/audit/2026-04-18-build-tab-audit.md`
- CEO review outcome commit: `8f918d1`
- Codex outside voice session: `019da15b-846e-7ce0-b884-6322ff79f485`
- Preserved hooks: `editor/shell/hooks/useBlockInsertion.ts`, `editor/sidebar/tabs/build/hooks/useSectionInsert.ts`
- Canonical storage: `shared/constants/storageKeys.ts`
