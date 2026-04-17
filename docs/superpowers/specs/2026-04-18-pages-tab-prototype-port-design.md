# Pages Tab — Full Prototype Port (Design Spec)

**Date:** 2026-04-18
**Branch:** `feat/page-tab-phase-2-visuals`
**Source of truth:** `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/page-tab-premium-20260417/prototype.html` (1564 lines)

---

## 1. Goal

Port the Pages tab prototype into the live editor **1:1 in look and behavior** for everything that does NOT require new engine capability. Remove or retire old CSS after the new styling is proven in browser. After this spec ships, the Pages panel + settings drawer should be visually indistinguishable from `prototype.html` rendered in Chrome at the same viewport widths.

Previous Phase-2 work (Chunks 1–3) already covers: dark chrome, cobalt accent, dot chips, HOME pill, row grip/thumb/inline-slug/updated, and the drawer shell (header/tabs/save/body container). This spec finishes the job.

---

## 2. Scope

### In scope (this spec)

**SP-1 — Pages list polish**
- Panel header: `Pages` title + `⌘K` kbd hint button + Help + Close (match prototype spacing, tokens).
- Search bar (`.pg-search`): icon + placeholder + `/` kbd hint (and wire `/` as a keyboard shortcut that focuses it).
- Group labels (`.pg-list-group`: "Site", etc.) — a small uppercase section heading above groups of rows.
- Footer (`.pg-footer`): stats line (`9 pages · 2 drafts · 1 hidden`) + sticky primary `+ Add Page` button matching prototype's cobalt solid button.
- Empty state (`.empty-state`): illustration + title + subtitle + two CTAs ("Create blank page" + "From template") — full replacement of current minimal empty state.
- Error state (`.error-state`): dark card with message + subtext + Retry — replace current `.pages-error` styling.
- Bulk toolbar (`.bulk-toolbar`): port visual to the sticky-bottom dark bar with count, spacer, Publish / Unpublish / Move to folder / Duplicate / Delete / clear-X — replace current `.pg-bulk-bar` visuals.
- Drag insert indicator (`.pg-drop-indicator`): cobalt 2-px line with accent-tint shadow shown during drag-to-reorder. Rendered conditionally; actual reorder **logic** stays deferred (out of scope — see SP-3 below).
- Select-all row (`.pg-selectall`): shown only when `bulk-mode` class is present on the list.
- Thumbnail shimmer state (`.pg-row-thumb.generating`): animated gradient for rows where a real thumbnail is still generating. For now there's no real thumbnail pipeline, so we only wire the class and leave the trigger for a future "real thumbnails" spec.

**SP-2 — Settings drawer body port**
- SEO tab:
  - Score row (`.seo-score-row`) with 22/28-px mono score number, label, and the SEO checks grid (4 items with colored dots + +pts labels).
  - "Reach 80+" info banner (`.banner-warn`).
  - Google preview card (`.gpreview`) with `.gdomain` crumb, `.gtitle`, `.gdesc` — restyled to match prototype.
  - Form fields (`.field`) with monospace counters (ideal / ok / short / long colored), slug row with `.slug-prefix` monospace segment, slug change warning.
  - AI-assist chip (`.ai-chip`) — "Write with AI" pill that surfaces when title/desc is short (render-only, hooks into existing composer AI stub if present; no new AI integration in this spec).
- Social tab:
  - OG card preview (`.og-card`) with 1200×630 image, domain crumb, title, desc.
  - Form fields for OG title/desc, image upload button, image URL field.
- Advanced tab:
  - Visibility toggle group (3 options: Live / Hidden / Password).
  - Password input block (`.password-wrap`) — revealed when visibility = password, with show/hide toggle + copy button.
  - Indexing toggles (`.toggle-row` + `.toggle`): allow-indexing, allow-follow.
  - Schedule picker (`.schedule-picker`): date + time inputs for "Publish on" (render-only — the scheduled status is out of scope, see SP-3).
  - Robots / redirects rows.
  - Head code (`.field textarea`) with monospace font, larger min-height, and existing DOMPurify allowlist preserved.

**SP-0 — Legacy CSS cleanup (last step of this spec, separate commit)**
- Delete any `--ls-*` token fallbacks still referenced (≈13 lines as of commit `7048c58`).
- Delete dead selectors: `.pg-drawer__save--dirty` (old name, replaced by `.pg-drawer-slide__save--dirty`), any `.pages-*` rules in the legacy section (lines 1–1000 of `PagesTab.css`) that are now superseded by `.pg-*` Phase-2 equivalents.
- Do not touch the shared `--aqb-*` tokens file (`themes/default.css`); scope is `packages/editor/src/editor/sidebar/tabs/pages/` only.

### Out of scope (future spec)

**SP-3 — Prototype tabs that need engine work**
- **Versions list** (`.versions`, `.version-row`): requires `VersionHistoryStorage` read-path wired to page-level — there is storage today but no per-page surface. Separate spec.
- **A11y score** (`.a11y-score`, `.a11y-ring`, `.a11y-issue`): requires an accessibility scanner pass over rendered pages. No such engine today. Separate spec.
- **i18n locales** (`.locale-row`, `.locale-add`): requires a locale model on `PageData`. No such field today. Separate spec.
- **Presence avatars** (`.pg-presence`, `.avatar`): requires real-time collab feed. Separate spec.
- **Real thumbnail snapshots**: requires canvas-to-image pipeline. Separate spec.
- **Scheduled-publish behavior**: UI exists in this spec (Advanced tab schedule picker), but the actual scheduling backend / status chip `scheduled` is separate.
- **Drag-to-reorder logic**: the drop indicator is in this spec; the reorder handler is in a follow-up once the backend `reorderPage` semantics settle.

---

## 3. Architecture

**Approach: additive CSS + minimal JSX, no engine changes.**

- All visual work happens in `PagesTab.css` and the existing component files. No new hooks, no new types, no new engine calls.
- JSX changes are limited to **inserting missing DOM nodes** the prototype shows (e.g., group labels, search kbd hint, footer stats line, empty state, drop indicator) and **restructuring a handful of drawer tab bodies** to match the prototype's element hierarchy.
- **Do not rename existing class names** — we already have `.pg-drawer-slide__*` that the CSS targets. Renaming mid-session invites HMR chaos and git-diff bloat. Future contributors reading the code will see the prototype-to-code class-name mapping documented in CSS section headers.
- **Legacy CSS cleanup (SP-0) is the last commit** — keep the old rules alive until the new ones render correctly in-browser, so we can revert individually if anything regresses.

**Why not rewrite the whole file?** `PagesTab.css` is 2817 lines; most of it IS the Phase-2 theme work the user approved in Chunks 1–3. Rewriting it from scratch would (a) discard unrelated working CSS for unrelated features (context menu, modals, folder drop indicator), (b) block on re-testing all of those, (c) produce a massive diff nobody can review. Additive-then-cleanup is safer, faster, and fits the prototype's "extend, don't replace" spirit.

---

## 4. File Structure

| File | Change | Lines est. |
|---|---|---|
| `packages/editor/src/editor/sidebar/tabs/pages/components/PageList.tsx` | Add `.pg-list-group` section headers (SP-1); restyle empty state (SP-1); pass `/` keyboard shortcut wiring | ~40 |
| `packages/editor/src/editor/sidebar/tabs/pages/components/AddPageButton.tsx` | Restructure to match prototype: sticky solid cobalt button as primary, popover trigger for "From template" and "New folder" | ~30 |
| `packages/editor/src/editor/sidebar/tabs/pages/components/BulkToolbar.tsx` | Restyle shell (dark bar, spacer, buttons in order from prototype); keep existing handlers | ~20 |
| `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx` | Port score row + checks grid + Google preview card + form fields layout to match prototype element order & nesting | ~80 |
| `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SocialTab.tsx` | Port OG card preview + form fields | ~60 |
| `packages/editor/src/editor/sidebar/tabs/pages/page-settings/AdvancedTab.tsx` | Port visibility toggle group + schedule picker (render-only) + password block + robots toggles + head-code textarea | ~90 |
| `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css` | Chunk 4 block (list polish) + Chunk 5 block (drawer body) + Chunk 6 cleanup (delete `--ls-*` and legacy) | +800 / −~200 |
| `packages/editor/src/editor/sidebar/tabs/pages/utils/keyboardShortcuts.ts` | **New.** `/` → focus search, `⌘K` already handled in PagesTab. | ~30 |

Total: one new file, seven modified. No deletions of component files; no type changes.

---

## 5. Feature Inventory (Prototype → Code Mapping)

Each row below is one discrete piece of work. The implementation plan (next step) will decompose each into 2–6 executable tasks.

| # | Prototype class | Code target | Visual check |
|---|---|---|---|
| F1 | `.panel-header` + `.kbd` | `PanelHeader` component | ⌘K kbd hint visible in header right side |
| F2 | `.pg-search` + `/` kbd | `PageList` search input | `/` hint visible, `/` key focuses input |
| F3 | `.pg-list-group` | `PageList` rendered above groups | "Site" uppercase label |
| F4 | `.pg-footer` + `.pg-stats` | `PageList` footer | "9 pages · 2 drafts · 1 hidden" + big cobalt Add Page |
| F5 | `.pg-add` (primary) | `AddPageButton` restructure | Solid cobalt, full-width within footer |
| F6 | `.empty-state` | `PageList` zero-pages branch | Illustration + title + 2 CTAs |
| F7 | `.error-state` | `PagesTab` error branch | Dark card + sub-msg + Retry |
| F8 | `.bulk-toolbar` | `BulkToolbar` | Dark sticky bar, buttons in prototype order |
| F9 | `.pg-drop-indicator.show` | `PageList` (render when a drag active) | Cobalt line visible during drag-over |
| F10 | `.pg-selectall` | `PageList` (render when `selectedIds.size > 0`) | "Select all (N pages)" row with checkbox |
| F11 | `.pg-row-thumb.generating` | `PageRow` (thumb state) | Shimmer class accepted; trigger out of scope |
| F12 | `.seo-score-row` + checks | `SeoTab` | Big score num + grid of 4 checks with colored dots |
| F13 | `.gpreview` | `SeoTab` | Google preview card matches prototype colors |
| F14 | `.field` + mono counter | `SeoTab`, `SocialTab`, `AdvancedTab` | Counters in monospace, color-shifted per range |
| F15 | `.banner-warn` | `SeoTab` (Reach 80+ message) | Amber tinted banner |
| F16 | `.ai-chip` | `SeoTab` (render-only) | Cobalt-tinted pill chip — no AI call |
| F17 | `.og-card` | `SocialTab` | 1200×630 ratio preview with domain/title/desc |
| F18 | `.toggle-row` + `.toggle` | `AdvancedTab` | Visibility, index, follow toggles |
| F19 | `.password-wrap` + `.password-row` | `AdvancedTab` | Shown when visibility=password; show/hide + copy |
| F20 | `.schedule-picker` | `AdvancedTab` | Date + time inputs with dark color-scheme |
| F21 | Cleanup | `PagesTab.css` | `--ls-*` fallbacks and duplicated legacy rules deleted |

---

## 6. Testing / Acceptance

**Unit/integration tests:**
- `relativeTime.test.ts` (already exists) — no change.
- **New:** `thumbnailKey.test.ts` — since `thumbnailKey` is now called in more places, pin its behavior (test that `isHome`, `external`, and deterministic-hash paths return stable classes).
- **New:** `keyboardShortcuts.test.ts` — test `/` focuses an injected ref.
- No snapshot tests for CSS — this is a visual port, user verifies in-browser.

**Typecheck / existing tests:**
- `cd packages/editor && npx tsc --noEmit` must show 0 errors inside `sidebar/tabs/pages/`.
- `cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages` must stay green (24+7=31 today; expect 33+ after new util tests).

**Browser acceptance (hard refresh, compare side-by-side to prototype.html):**
- Panel width 320px, row density and spacing visually identical to prototype.
- Gear icon on a row → drawer slides in, dark chrome, tabs render styled, save button shows green-tinted "Saved" or blue "Save" per state.
- Each tab's body renders with prototype-matching typography, colors, spacing — no white bg anywhere.
- Empty state shows when pages.length === 0 (force by deleting all but one and then that one).
- Error state shows when composer throws during sync (simulate by temporarily breaking the getAllPages call).
- Bulk toolbar: select 2 pages, toolbar appears at bottom matching prototype.
- Search: type into search, filter works; press `/` to focus search from outside.

---

## 7. Commit Strategy

Five commits (one per chunk), on the existing branch:

1. `feat(pages): Chunk 4 — list polish (search kbd, group labels, footer stats, empty/error states)`
2. `feat(pages): Chunk 4 — bulk toolbar restyle + drop indicator + select-all row`
3. `feat(pages): Chunk 5 — SEO tab body port (score row, Google preview, AI chip, banner)`
4. `feat(pages): Chunk 5 — Social + Advanced tab bodies (OG card, toggles, password, schedule)`
5. `chore(pages): Chunk 6 cleanup — drop --ls-* fallbacks and duplicated legacy rulesets`

Each commit ships green tests + green typecheck and is independently revertable.

---

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| CSS specificity wars between new `.pages-panel .pg-*` rules and legacy unscoped `.pg-*` rules. | Medium | All new rules use `.pages-panel` prefix for the same specificity as Chunk 1. Cleanup step (F21) removes the legacy counterparts. |
| Re-parenting drawer body JSX breaks active-tab switching or auto-save. | Medium | Keep the same `usePageSettings` hook untouched. Only the render tree in the 3 tab files changes. Tests still cover hook behavior. |
| "Match prototype same-as-it-is" includes `pg-row.nested` (one level of folder indent) which is already in the prototype but not in our current rendering. | Low | We already render folder children via `PageFolder`. The `nested` class is a visual-only hint; add it in the render loop — no hook change. |
| User discovers a prototype element I missed during port. | Low | Feature inventory (§5) is comprehensive; any gap adds one more CSS rule and/or JSX node, not a structural change. |
| Dev server HMR caches stale CSS mid-port. | Low | We already killed the stale Vite earlier; commits land atomically, user hard-refreshes per commit if needed. |

---

## 9. Explicit Non-Goals

- Rewriting `PagesTab.css` from scratch.
- Changing hook signatures or adding new types.
- Adding engine APIs (thumbnail capture, a11y scan, version reads, i18n model, scheduling backend).
- Implementing drag-to-reorder handler (only the drop-indicator visual).
- Implementing real presence/collab avatars.
- Pixel-perfect at viewport widths outside 320-px panel (responsive variants are out of scope — panel width is fixed in the editor shell).

---

## 10. Self-Review

- **Placeholders:** none. Every feature row in §5 has a concrete file + visual check.
- **Internal consistency:** §2 "in scope" matches §5 feature inventory row-for-row; §3 architecture (additive, no rename) matches §4 file table; §7 commit strategy matches §5 scope partitioning.
- **Scope:** three chunks (4, 5, 6) + optional split of chunks 4 & 5 across two commits each = 5 atomic commits. Single plan, single session target of ~2–3 hours.
- **Ambiguity:** "Match prototype 1:1" resolved by the §5 inventory — we port class-by-class, not "vibe-check it." "Remove old design" resolved in §2 SP-0 + §7 commit 5: tokens and legacy rulesets only, not the entire file.
