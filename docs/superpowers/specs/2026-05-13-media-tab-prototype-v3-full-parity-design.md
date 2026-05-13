# Media Tab — prototype-v3 Full Parity Design

**Date:** 2026-05-13
**Author:** Claude Opus 4.7 (1M context) via /superpowers:brainstorming
**Status:** Awaiting user spec-review before plan generation
**Prototype source of truth:** `file:///Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-templates-media-engine-20260507/prototype-v3.html` sections §10-§22

## Goal

Bring Buildrik editor Media tab to prototype-v3 functional parity across all 13 visible-state sections (§10 quick browse through §22 upload zone states). Replace fragmented current IA — slim launcher with shortcuts → maximize → expanded library — with prototype-aligned IA where 320px default mode IS the self-sufficient browsing experience.

## Context

User feedback 2026-05-13: "media tab ki protypes is example sae bilkul bhee match ni kar rahi" (Media tab does not match prototype at all). Audit confirmed major drift:

- §10 default 320px: current SlimLauncher renders only a Recent strip + ghost search + "Open library" button. Prototype shows TypePills + real search + 3-col asset grid with usage pips + UploadZone with quota progress bar.
- §11-§22: mixed shipped state across various components, no audit done.

Solo workflow (commit-to-main) per `feedback_solo_workflow`.

## Constraints (user-locked)

| Constraint | Value | Locked at |
|------------|-------|-----------|
| Scope | All 13 sections §10-§22 in single spec | Q1 |
| Match fidelity | Functional parity + DS-token alignment | Q3 |
| Test discipline | Per-section TDD (failing test first) | Q3 |
| Existing code policy | Audit first, fix-forward (no rewrites for working features) | Q3 |
| Execution sequencing | Strict sequential §10 → §22 | Q4 |
| SSOT contracts | Locked component list (see SSOT section) | Q5 |

## Architecture

### Mount path

```
LeftSidebar (drawer slot)
  └── TabRouter (panel mode, onOpenLibrary callback provided)
       └── MediaTab.tsx
            ├── if (state.panelExpanded) → ExpandedMediaPanel (560px, §12 territory)
            ├── if (selectionContext)    → above + SelectionContextBar (§11 territory)
            └── else                     → SlimLauncher (320px, §10 territory)
```

Fullpage mode (no `onOpenLibrary` callback) is OUT OF SCOPE — prototype only describes panel mode behavior.

### Three logical layers (all 22 sections)

| Layer | Concern | Files |
|-------|---------|-------|
| Container | Panel-mode routing, selection-context state, top-level layout | `MediaTab.tsx`, `useMediaState.ts` |
| View shells | §10 default 320px view, §12 expanded 560px split | `SlimLauncher.tsx`, `ExpandedMediaPanel.tsx` |
| Feature components | Pills, search, grid cells, upload, drawer, modals, context menu | `media/components/*` |

### Common cross-section patterns

1. **Panel-width events** — `composer.emit("ui:media-panel-width", { width: N, expanded: boolean })`, LeftSidebar listens. Already in place for §12 320→560 expansion; same mechanism Templates §2 uses (320→700).
2. **Selection-context state** — `state.selectionContext` (snap-back mode) drives §11 banner + modifies §10 asset click semantics (click inserts into requesting canvas element + clears context).
3. **Composer events** — `composer.media.*` API for asset CRUD, upload queue, storage quota. Subscribed via `useMediaState`.
4. **Modal overlays** — vibcoder `Dialog` / extension `ConfirmDialog`. Toast feedback via vibcoder `useToast`.

## SSOT contracts (must lock BEFORE implementation)

### Component SSOT

| Concept | Canonical home | Consumers |
|---------|----------------|-----------|
| Asset thumbnail cell (image / video / icon / font preview) | `media/components/AssetCell.tsx` *(new)* | §10 grid, §12 library area, §15 drawer Preview, §16 context-menu trigger |
| Asset grid (N-col, virtualized as needed) | Reuse `LibraryView.tsx` grid sub-component | §10, §12 expanded |
| Usage pips (cobalt dots = N pages used) | `media/components/UsagePips.tsx` *(new)* | §10 grid cell, §12 grid cell, §15 drawer "Where used" |
| TypePills (Image / Video / Icon / Font + counts) | Reuse existing `TypePills.tsx` | §10 header, §12 header |
| UploadZone | Reuse existing `UploadZone.tsx`, extended | §10 footer, §22 quota state variations |
| Storage quota indicator | `media/components/StorageQuotaBar.tsx` *(new)* | UploadZone (§10, §22) |
| Search input + debounce | Reuse `shared/SearchBar.tsx` | §10, §12, §15 |
| Selection-context bar | `media/components/SelectionContextBar.tsx` *(new — extract from inline `MediaTab.tsx:211-242`)* | §10, §12 (one source of truth) |
| Folder tree | Reuse `LibraryView.tsx` folder logic | §12, §13 |
| Multi-select banner | `media/components/MultiSelectBanner.tsx` *(new)* | §14 |
| Modal shells | vibcoder `Dialog` + extension `ConfirmDialog` | §17, §18, §19, §20, §21 |

### State SSOT

- One state hook: `useMediaState(composer)`. Every section reads + writes via this. No parallel state.
- One event channel: `composer.media.emit()` for asset events. Subscribed by `useMediaState`.
- One panel-width event: `ui:media-panel-width` for 320 ↔ 560 transitions.

### Visual SSOT

- Colors via `var(--bd-*)` aliases only. No inline hex (Gate 24 enforces).
- Spacing via `var(--bd-space-N)` aliases or literal `4px / 8px / 12px / 16px` rounded to 4-base grid.
- Motion via `var(--bd-motion-*)` aliases or literal `120ms / 180ms`.
- Vibcoder primitives (`Button`, `Input`, `Pill`, `Kbd`) — NO inline `<button>/<input>/<select>` in editor chrome.

### Constant + type SSOT

- Media types in `shared/types/media.ts` only.
- Media events in `shared/constants/media.ts` (`MEDIA_EVENTS`) only.
- No parallel `interface Asset` definitions in component files.

### CI gate enforcement (per commit)

- `gate:ds-ssot` — ERROR mode on componentDuplicates, keyframeDuplicates, tokenAliasSSOT.
- `gate:buildrick-baseline` — per-panel growth lock (no new `buildrick-*` classes).
- Gate 24 — zero inline `<button>` in editor chrome.
- Templates baseline tests (166) — no regression.

## Per-section scope audit

### §10 — Quick browse (320px default)

**Prototype intent:** Panel-header "Media" title + Manage icon + Close. TypePills row (Image 42 / Video 3 / Icon 8) + "+ Stock" primary button right-aligned. Real search input. 3-col asset grid with usage pips. UploadZone at bottom with dashed border, "Drop or click to upload", "2.4 GB / 5 GB used" text, progress bar.

**Current state:** `SlimLauncher` is launcher pattern (Recent strip 12 tiles, ghost search button opens full library, "Open library" CTA). Missing: TypePills, real search, grid view, UploadZone, usage pips.

**Gap signal:** Major rewrite of SlimLauncher to render §10 contents directly. Reuse `TypePills`, `UploadZone`, extracted `AssetCell` + `UsagePips` + `StorageQuotaBar`. Estimated 8-12 commits.

### §11 — Selection-context (snap-back mode)

**Prototype intent:** Cobalt accent bar pinned above panel header. "Selecting image for: Hero block" message. Cancel button right. Pulsing white dot left.

**Current state:** Implemented inline in `MediaTab.tsx:211-242` with hardcoded styles. Functional, but violates SSOT (inline styles, no component extraction).

**Gap signal:** Extract `SelectionContextBar` component, replace inline; verify visual matches prototype tokens. Estimated 3-4 commits.

### §12 — Expanded 560px on upload

**Prototype intent:** On upload, panel expands 320→560px. Inner layout splits: folder tree (180px) + library area (380px). Sort / format / grid-size controls available. "Compact" button collapses back to 320.

**Current state:** `ExpandedMediaPanel.tsx` exists, triggered by `state.panelExpanded`. Internal layout split TBD.

**Gap signal:** Audit 180/380 inner split, controls bar parity, Compact button position. Estimated 4-6 commits.

### §13 — Folder navigation + drag-to-folder

**Prototype intent:** Click folder in tree → library area shows breadcrumb + folder contents. Drag asset onto folder name → moves with snap feedback. Right-click folder → rename / delete (with "move contents to All assets" warning). Empty folder shows drop zone.

**Current state:** `LibraryView.tsx` has folder logic (664 LOC file). Drag/right-click likely partial.

**Gap signal:** Audit drag-snap UX + right-click parity, breadcrumb integration. Estimated 5-7 commits.

### §14 — Multi-select banner

**Prototype intent:** Toggle select-mode (right-click → Select more, or shift-click). Each cell shows checkbox. Top banner appears: count + Move to folder + Delete + Cancel.

**Current state:** `state.selMode` exists, banner UI unclear.

**Gap signal:** Extract `MultiSelectBanner` component, audit mount conditions + bulk action handlers. Estimated 3-5 commits.

### §15 — Asset detail drawer (5 tabs)

**Prototype intent:** Click asset → drawer slides in (480px). Five tabs: Preview (full-size + metadata), Where used (pages with this asset), Versions (image edit history), Edit (rename + tags + alt-text), Optimize (compress shortcut). Replace + Delete actions in footer.

**Current state:** `AssetDetailOverlay.tsx` exists. Tab structure TBD.

**Gap signal:** Audit 5-tab parity, footer actions, drawer width. Estimated 6-9 commits.

### §16 — Right-click context menu

**Prototype intent:** Right-click asset → ContextMenu near cursor. Groups: (insert / edit), (rename / move), (copy URL / copy alt-text), danger (delete). Move-to-folder has nested submenu listing folders.

**Current state:** `MediaContextMenu.tsx` exists.

**Gap signal:** Audit group order + submenu parity. Estimated 3-5 commits.

### §17 — Image editor modal (crop / rotate / adjust)

**Prototype intent:** Full-screen modal. Left: tool rail (crop / rotate / brightness / contrast / saturation / filter). Center: live canvas. Right: parameters + reset + before/after toggle. Save creates v_n+1 in Versions tab — original never overwritten.

**Current state:** `onOpenImageEditor` handler wired through MediaTab; modal component location TBD.

**Gap signal:** Locate / create modal; audit tool rail + parameters. Estimated 6-10 commits.

### §18 — Optimization panel

**Prototype intent:** Compress shortcut from asset detail. Side-by-side: original vs optimized preview. Format select (WebP / AVIF / JPG / PNG), quality slider, max-dimension override. Live byte-savings counter.

**Current state:** `handleOptimized` callback wired.

**Gap signal:** Locate / create panel UI; audit controls. Estimated 4-6 commits.

### §19 — Stock source modal

**Prototype intent:** Add from Stock → modal. Tabs for asset type + source pills (Unsplash / Pexels / Pixabay for photos). Filters: orientation + color. Each tile: hover shows attribution + Save + Insert. Quota strip at top shows remaining searches this month.

**Current state:** `StockSourceModal.tsx` shipped per memory.

**Gap signal:** Audit source pills + attribution display + quota strip. Estimated 4-6 commits.

### §20 — Icon picker modal

**Prototype intent:** Icon picker with search + category filter + tile grid.

**Current state:** `onOpenIconPicker` wired.

**Gap signal:** Locate picker component; audit UI. Estimated 3-5 commits.

### §21 — Replace-across modal

**Prototype intent:** From asset detail "Replace across all pages". Modal lists every page using asset; per-page diff thumbnail (before/after); uncheck to skip. CTA shows live count: "Replace on N pages".

**Current state:** `ReplaceAcrossDialog.tsx` shipped 2026-05-08 per memory.

**Gap signal:** Audit diff thumbs + per-page checkbox + live count. Estimated 2-4 commits.

### §22 — Upload zone states (6 variants)

**Prototype intent:** UploadZone has 6 visual states. States: idle / drag-over / uploading / quota-warning (80%) / exhausted / error. Quota near limit shows warning at 80%; exhausted disables zone with upgrade CTA. Error state per-file keeps queue visible with retry.

**Current state:** `UploadZone.tsx` exists; 6 state variations TBD.

**Gap signal:** Audit each of 6 states + transitions. Estimated 4-6 commits.

## Component map + data flow

### New component files

```
media/components/
├── AssetCell.tsx                NEW — single asset thumb cell with variants
├── UsagePips.tsx                NEW — cobalt dot count = pages-used
├── StorageQuotaBar.tsx          NEW — dashed bar + "N GB / N GB used" + progress
├── SelectionContextBar.tsx      NEW (extract from MediaTab.tsx:211-242)
└── MultiSelectBanner.tsx        NEW (§14)
```

### Existing files audited + retained

```
media/
├── MediaTab.tsx                 audited — routing logic stays; inline JSX extracted
├── components/
│   ├── SlimLauncher.tsx         REWRITTEN — becomes §10 self-sufficient
│   ├── ExpandedMediaPanel.tsx   audited — confirm 180/380 inner split
│   ├── LibraryView.tsx          audited — grid + sort + folders for §12/13/14
│   ├── TypePills.tsx            reused as-is
│   ├── UploadZone.tsx           extended — §22 6 visual states
│   ├── AssetDetailOverlay.tsx   audited — §15 5-tab structure
│   ├── MediaContextMenu.tsx     audited — §16 grouping
│   ├── StockSourceModal.tsx     audited — §19 tabs + attribution
│   ├── ReplaceAcrossDialog.tsx  audited — §21 diff thumb
│   └── ConfirmDeleteModal.tsx   retained
└── hooks/
    └── useMediaState.ts         single state source, extended per-section
```

### Data flow

```
User action
  → MediaTab.tsx routing
    → SlimLauncher / ExpandedMediaPanel / Drawer
       → component reads state from useMediaState(composer)
       → component dispatches via state.*Action(...)
          → useMediaState mutates → composer.media.emit(MEDIA_EVENTS.X)
            → composer broadcasts → other subscribers update
              → useMediaState re-syncs → UI rerenders
```

### Selection-context flow (§11)

```
Canvas element (Image empty state) clicks "Choose image"
  → composer.emit("media:selection-context", { elementId, label })
    → useMediaState listener → setSelectionContext({ ... })
      → MediaTab renders <SelectionContextBar /> above shell
      → AssetCell.onClick now calls insertToCanvas(elementId) + clears context
```

### Panel-width flow (§12 expansion on upload)

```
state.upload([files]) → emits MEDIA_EVENTS.UPLOAD_STARTED
  → useMediaState side-effect: setPanelExpanded(true)
    → MediaTab routing switches to ExpandedMediaPanel
    → composer.emit("ui:media-panel-width", { width: 560, expanded: true })
      → LeftSidebar listener widens panel
        → User clicks Compact → state.setPanelExpanded(false) → width 320
```

### Cross-section integration flow

After all 22 sections land, one integration test verifies full user journey:
1. Open Media tab → §10 default visible.
2. Upload file → §22 upload-zone progress → §12 expansion → 560px.
3. Click asset → §15 drawer with 5 tabs.
4. Right-click another asset → §16 context menu.
5. Select multiple → §14 banner + bulk delete.

## Error + empty states

### Per-state behavior

| State | UI behavior | Per § |
|-------|-------------|-------|
| Empty library (zero uploads) | Friendly empty card: "Your library is empty" + CTAs "Upload first asset" / "Browse stock" | §10 default — replaces grid |
| Empty filter (TypePill=Video, only images uploaded) | Inline empty row: "No videos yet" + CTA "Upload video" | §10 grid area |
| Empty search | "No assets matching 'foo'" + "Clear search" CTA | §10, §12, §15 |
| Quota warning ≥80% | UploadZone bg shifts to warn-soft, text "Approaching limit" | §10 footer, §22 |
| Quota exhausted | UploadZone disabled, dashed border danger color, "Storage full — upgrade" CTA opens billing | §10 footer, §22 |
| Upload error per-file | Failed file stays in queue with red badge + Retry button | §10, §22 |
| Network error (stock fetch) | StockSourceModal banner: "Couldn't reach Unsplash. Retry." + button | §19 |
| Network error (replace-across) | Per-page row marker ⚠ "Couldn't update — skipped" | §21 |
| Asset load fail (broken src) | AssetCell shows fallback icon + tooltip "Asset unavailable" | §10, §12, §15 |
| Selection context lost (canvas element deleted while picking) | SelectionContextBar auto-dismisses with toast "Element no longer exists" | §11 |
| Folder rename collision | Inline form error: "A folder named 'foo' already exists" | §13 |

### Toast tone contract

| Event | Tone | Wording template |
|-------|------|------------------|
| Upload complete (single) | success | `"<filename> uploaded"` |
| Upload complete (batch) | success | `"<n> files uploaded"` |
| Upload failed | error + Retry action | `"<filename> failed to upload"` |
| Delete confirmed | success | `"<filename> deleted"` |
| Bulk delete | success | `"<n> assets deleted"` |
| Replace-across applied | success | `"Replaced on <n> pages"` |
| Replace-across partial | warning | `"Replaced on <n> pages, <m> skipped"` |
| Asset insert | info | Suppressed in default; only shown when selection-context completed |

### Loading states

| Section | Loading affordance |
|---------|-------------------|
| §10 / §12 grid | Skeleton tiles (3 dummy cells, subtle pulse) — first paint only |
| §15 drawer Preview tab | Spinner overlay on preview while metadata loads |
| §15 drawer Versions tab | Skeleton rows |
| §17 image editor | Full-screen spinner during initial load + during Save / Optimize |
| §19 stock modal | Inline skeleton tiles per source pill |
| §21 replace-across | Per-page row spinner during apply |

### Disabled / locked states

| Trigger | UI |
|---------|----|
| User on free plan + premium icon | Card overlay with lock icon + tooltip "Upgrade for premium" |
| Asset locked by another collaborator | Card border highlight + cursor: not-allowed + tooltip "Locked by <user>" |
| Quota exhausted + drag file over panel | Reject drop, brief "Storage full" overlay on UploadZone |

### Cross-section consistency rules

- All error messages via vibcoder Toast (no inline error UI).
- All confirmation modals via `shared/extensions/ConfirmDialog`.
- All disabled states use same disabled-opacity token: `var(--bd-disabled-opacity, 0.5)`.
- Loading skeletons via `shared/extensions/SkeletonCompounds`.

## Testing strategy

### TDD discipline per section

Each §N:

```
1. Write failing test
   - Asserts JSX shape: aria roles, class names, key elements per prototype
   - File: media/components/__tests__/Section<N>.test.tsx
   - Header comment cites prototype line numbers being mirrored
2. Run test → confirm fails
3. Implement minimal code to pass
4. Verify pass + commit
```

### Test type matrix

| Test type | When | Tool | Coverage target per § |
|-----------|------|------|----------------------|
| Unit | Component renders right shape given props | Vitest + RTL | Every new component |
| Integration | State hook + composer events wire correctly | Vitest + RTL + mock composer | Every state-touching section |
| Live (Playwright) | Computed CSS / layout sizes / event firing | Playwright via `/browse` skill | Every visible UI change after CSS lands |
| Accessibility | Roles, aria-labels, keyboard nav | RTL `getByRole` queries | Every interactive component |

### Required scenarios per section

| § | Test scenarios |
|---|---------------|
| §10 | Renders TypePills + search + grid + UploadZone; pill click filters grid; search filters live; click asset inserts |
| §11 | Renders SelectionContextBar when context set; click asset clears context + inserts; cancel clears |
| §12 | Expanded panel shows folder tree (180px) + library (380px); compact collapses to 320px |
| §13 | Folder click navigates; breadcrumb updates; drag-to-folder fires move event; right-click opens menu |
| §14 | Shift-click enters select mode; banner shows count; bulk delete fires confirm + executes |
| §15 | 5 tabs render; tab switch swaps content; footer Replace + Delete actions fire |
| §16 | Right-click opens at cursor; 4 groups render; submenu expands |
| §17 | Tool rail mounts crop/rotate/etc; live canvas reflects edits; Save creates new version |
| §18 | Original vs optimized side-by-side; format change updates preview; quality slider updates byte count |
| §19 | Tabs + source pills render; filter pills work; tile shows attribution on hover |
| §20 | Icon search works; tile insert fires callback |
| §21 | Per-page row checkboxes; live count updates; apply fires replace-across event |
| §22 | 6 visual states render correctly per state-flag |

### Shared test utilities (extracted upfront)

```
media/__tests__/test-utils/
├── mockComposer.ts          mock composer with media.* API stubs
├── mockMediaState.ts        canned state shapes for each section's needs
└── renderMediaTab.tsx       harness wrapping MediaTab with composer + toast providers
```

### Per-commit verification gates

```
On every PR / commit:
  - vitest run packages/editor/src/editor/sidebar/tabs/media (all media tests pass)
  - npm run gate:ds-ssot (zero new componentDuplicates/keyframeDuplicates/tokenAliasSSOT)
  - node scripts/check-buildrick-baseline.mjs (per-panel growth lock)
  - npx tsc --noEmit (no new templates-or-media errors)
  - npx eslint src/editor/sidebar/tabs/media (no new lint errors)
```

### Live verification cadence

Every commit that touches visible UI:
1. Run dev server (5050).
2. Open in Playwright via `/browse` skill or direct CDP.
3. Capture computed CSS for assertions in spec (panel width, padding, border, gap).
4. Capture screenshot (cleanup after).
5. Compare to prototype reference dimensions.

If computed CSS does not match prototype: fix-forward in same commit OR revert. Do not ship visual drift uncorrected.

### Regression protection

Templates baseline: **166 templates tests must keep passing** through all 22 media sections.

All existing media tests must keep passing.

### Coverage stance

NOT pursuing 100% line coverage. Coverage means:
- Every new component file has at least one test.
- Every state-changing event has at least one integration test.
- Every error path (error toast, retry flow) has at least one negative test.
- Visual fidelity verified by live Playwright, not snapshot tests (snapshots brittle).

## Phasing + commit cadence

### Phase 0 — Pre-section refactor (~5-8 commits)

Extract shared SSOT pieces BEFORE any §N work:

1. Extract `SelectionContextBar` from inline `MediaTab.tsx:211-242`.
2. Create `AssetCell.tsx` with image / video / icon / font variants.
3. Create `UsagePips.tsx`.
4. Create `StorageQuotaBar.tsx`.
5. Refactor `UploadZone` to consume `StorageQuotaBar`.
6. Add shared test utilities (`mockComposer`, `mockMediaState`, `renderMediaTab`).
7. Wire `useMediaState` to surface `usageMap` per asset (new state field).
8. Document SSOT contract in spec → CLAUDE.md addendum if needed.

Acceptance: 166 templates tests still pass + all existing media tests still pass + gates green.

### Phase 1-13 — Section-by-section (§10 → §22)

Each section follows same pattern:

```
1. Failing test (1 commit)
2. Audit notes commit (markdown table comment in test file)
3. Implementation commits (3-8 each)
4. Live Playwright verify commit (screenshot + computed CSS evidence)
5. Memory update (if new pattern learned)
```

Section order (sequential, user-locked):

| Phase | § | Commits | Cumulative |
|-------|---|---------|------------|
| 1 | §10 | 8-12 | 8-12 |
| 2 | §11 | 3-4 | 11-16 |
| 3 | §12 | 4-6 | 15-22 |
| 4 | §13 | 5-7 | 20-29 |
| 5 | §14 | 3-5 | 23-34 |
| 6 | §15 | 6-9 | 29-43 |
| 7 | §16 | 3-5 | 32-48 |
| 8 | §17 | 6-10 | 38-58 |
| 9 | §18 | 4-6 | 42-64 |
| 10 | §19 | 4-6 | 46-70 |
| 11 | §20 | 3-5 | 49-75 |
| 12 | §21 | 2-4 | 51-79 |
| 13 | §22 | 4-6 | 55-85 |

### Phase 14 — Integration verify (~3-5 commits)

After §22 lands:

1. Full E2E integration test (open → upload → expand → drawer → context menu).
2. Final live Playwright sweep with screenshots per section.
3. Memory updates (arc completion record).
4. Documentation pass on `media/README.md` (if exists).

### Total estimated cost

- **Commit count:** 60-90 (refactor budget + sections + integration).
- **LOC delta:** +1500 to +2500 new, -500 to -1000 deleted (net +1000 to +1500).
- **Test files added:** 22 new + 3 shared utils = 25.
- **Calendar time:** ~2-3 weeks of focused work assuming no scope drift.

### Stop-points the user can interrupt

After each phase, user can:
- Continue to next section.
- Pause arc, address other work, resume later.
- Stop arc early (e.g., after §14 if Cluster A+B is enough).
- Re-prioritize remaining sections.

Each phase's commits form a coherent unit — stopping anywhere leaves a working state.

### Risk register

| Risk | Mitigation |
|------|-----------|
| Refactor breaks existing media features | Phase 0 has zero-feature change discipline; tests gate each commit |
| §17 image editor scope balloons (canvas API) | Carve §17 into sub-phases if commit count >12; reassess scope |
| Stock provider APIs (§19) flaky in tests | Mock at network layer; document fallback for offline |
| Composer event ordering issues during refactor | Integration tests at end of each phase |
| User wants to change mid-arc | Each phase commit-clean; can branch off |

## Success criteria

### Per-section done

§N is shipped when ALL hold:

1. Prototype intent visible in live editor (functional parity).
2. Visual uses DS tokens — no inline hex, no Arial fallback (Gate 24 green).
3. Per-section tests pass (TDD discipline).
4. Live Playwright screenshot captured + computed CSS verified.
5. No buildrick-* class regressions (gate green).
6. ds-ssot gate green (no new duplicates).
7. 166 templates tests still pass.
8. tsc clean (no new errors).
9. Atomic commit with conventional message.

### Whole-arc done

Arc closed when:

- §10-§22 all individually shipped per above.
- Integration test passes (open → upload → expand → drawer → context menu → close).
- Memory updated: `project_media_tab_prototype_v3_arc_<date>.md`.
- Stale memory pruned if patterns subsumed.
- ExpandedMediaPanel + SlimLauncher mount paths documented.

## Out of scope (explicit non-goals)

| Out | Reason |
|-----|--------|
| MediaTab fullpage mode rewrite | Prototype covers panel mode only |
| New media types beyond image / video / icon / font | Prototype enumerates these 4 |
| Server-side asset storage migration | Pure UI arc; backend assumed stable |
| Multi-user collaborative editing on assets | §15 versions is single-user; no real-time |
| Mobile breakpoint | Editor is desktop-only per CLAUDE.md |
| Asset versioning beyond §15 Versions tab | No git-like asset history feature |
| Bulk replace-all-on-canvas-by-asset-type | §21 is one-asset-at-a-time replace |
| Color picker integration for §17 image editor | §17 brightness/contrast/saturation only; no hue/color-balance |
| Custom font upload UI beyond drop-file | §10 UploadZone accepts fonts but no font-naming UX |
| Telemetry beyond existing media:* events | No new analytics |

## Scope creep guards

If during implementation we hit:

- **"While we're at it, fix Y"** (Y unrelated to current §N) — file separate task, don't bolt onto current commit.
- **"This refactor needs X helper"** (X is for one consumer) — keep X local until 2nd consumer arrives.
- **"Prototype shows Z but Z is hard"** — document in spec deviation log, ship functional parity without Z, file follow-up.
- **"Let's add tests for existing broken thing"** — add failing test, file as separate issue, don't block §N.

## Quality bar adjustments user may invoke

Per user choice, current setting = **functional parity + DS tokens**. User can adjust mid-arc to:
- Higher: **strict pixel match** — adds CSS rewrite per section.
- Lower: **functional only** — accepts visual drift.

Each level change is an explicit decision logged in spec.

## Communication contract

- Each phase commit message: `feat(media): §N <one-line summary>`.
- Each refactor commit: `refactor(media): <what>`.
- Each test commit: `test(media): <what>`.
- Each phase-end summary back to user: 1-2 sentences "what shipped + what's next".
- No silent commits — every commit name reflects scope.

## Spec deviation log

(Populated during implementation. Reserved for any deviation from this spec.)

| Date | Section | Deviation | Rationale |
|------|---------|-----------|-----------|

## Related references

- Prototype source: `file:///Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-templates-media-engine-20260507/prototype-v3.html` §10-§22
- Templates §2 fix arc (reference pattern): `docs/superpowers/specs/2026-05-12-templates-inline-detail-layout-design.md`
- Memory: `feedback_prototype_v3_wins_over_config`, `feedback_read_prototype_source_not_screenshot`, `project_templates_inline_detail_layout_arc_20260512`
- DS-SSOT gate: `packages/editor/scripts/check-ds-ssot.mjs`
- Buildrick baseline gate: `packages/editor/scripts/check-buildrick-baseline.mjs`
