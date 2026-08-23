# Editor PRD · Ch.11 — Flows (App Flows · User Flows · Feature Flows)

> Part of BUILDRIK-PRD-EDITOR v3.0 · `main` @ `e5624ca1` · 2026-07-08 · reverse-engineered; nothing invented; uncertainty `[TBC]` · paths under `packages/editor/src/` unless noted. This chapter documents flows **as built** (not as intended). Broken/absent legs are marked ⛔ and cross-referenced to the §13 register in the master doc.

---

## 11.0 Personas × entry matrix

| Persona | Entry | Rail/density | Ship action |
|---|---|---|---|
| Agency designer (OWNER/ADMIN/DESIGNER) | dashboard "Edit site" → `/edit/:id` or `?siteId=` (`BuildrikSyncProvider.ts:402-413`) | 4-tool rail, full inspector | Publish dropdown (flag `publish`) or Export fallback (`Topbar.tsx:530-548`) |
| Invited editor (role `EDITOR`, labelled "Editor" since 2026-08-23) | same URL, member session | 4-tool, full | same. **Publish requires EDITOR, not ADMIN** (`routers/sites.ts:316`) — this row said ADMIN. `Workspace.editsRequireApproval` defaults FALSE, so on a default workspace this member publishes to the live site with no approval. |
| Owner in view mode | `?view=readonly` (renamed from `?view=client` 2026-08-23) | no rail, no drawer, no inspector; `Composer.readOnly` blocks every mutating command | none — Publish and Send for review are both withheld. Send for review lives in the Review panel now. This row described an "editor" persona; nothing ever routed anyone here, and the mode grants no editing at all. |
| Anonymous/local (demo) | no siteId | 4-tool | Export only; saves to localStorage |
| Legacy rail escape | `?rail=legacy` | 11-tab rail (`editorViewMode.ts:34`) | as above |

---

## 11.1 APP FLOWS (system-level)

### F-A1 · Boot & project load

```
demo/main.tsx → <AquibraStudio> → StudioSkeleton until composer:ready
  └─ useComposerInit (composer:ready):
     siteId? ──yes──▶ versions.setProjectId + components.setProjectId (per-site IndexedDB scope)
     │               ▶ loadProject(siteId): parallel tRPC sites.get + pages.list + siteDetail.settings.get
     │               ▶ DS schema migrations (instance.migration.run)
     │               ▶ importProject (DOMPurify sanitize per page root, Composer.ts:452-470)
     │               ▶ save pill seeded "Saved · just now" ▶ loadServerMedia (200 assets cap)
     │               ▶ toast "Project loaded / Loaded from dashboard"
     └──no───▶ engine IndexedDB → localStorage["buildrick-project"] → else create getDefaultPageName([]) = "Home"
```
- Auth fail on load: `UNAUTHORIZED` → toast **"Session expired. Sign in to load this site from the dashboard — you're seeing local changes for now."** (Dismiss / Sign in / Retry) → `${DASHBOARD_URL}/auth`; other errors → **"Couldn't load this site from the dashboard. You're seeing local changes for now."** (Dismiss / Retry) (`useComposerInit.ts:209-232`). *Copy re-read from the running app 2026-08-24 — the short forms recorded here were never the shipped strings. Walk record: `docs/walks/F-A1-boot-and-project-load.md`.*
- First-run blank canvas → PageWizard mounts unless `buildrik:page-wizard-dismissed`/starter-seen (`AquibraStudio.tsx:140-161,582-588`).
- Crash recovery: sessionStorage sentinel `buildrick:last-crash` restores page/root/selection (`recovery/RecoveryManager.ts:26-198`).
- Sources: `useComposerInit.ts:137-285`, `BuildrikSyncProvider.ts:197-233`.

### F-A2 · Save / autosave / conflict

```
any edit → markDirty → PROJECT_CHANGED (fan-out hub, Composer.ts:696-710)
  ├─ HistoryManager: 500ms coalesce → patch/checkpoint (max 100, checkpoint every 10)
  ├─ shell autosave hook: debounce → siteId ? saveProject(dashboard) : composer.saveProject(localStorage)
  │    (fires on project:changed, history:undo/redo, version:restored — useComposerInit.ts:385-388)
  └─ engine StorageAdapter autosave 5000ms (localStorage/IndexedDB; secrets redacted at rest)
saveProject (BuildrikSyncProvider):
  dual-write sites.saveProject{expectedLastEditedAt} + siteDetail.settings.update (Site-column fields only)
  ├─ OK → baseline lastEditedAt advances; pendingChanges re-emitted
  ├─ NO auto-retry → onSaveError → save pill "Save failed — retry" (clickable, and it works)
  └─ SAVE_CONFLICT:<ts> → SaveConflictError → window "buildrik:save-conflict"
       → ConflictModal: Reload | Save backup (buildrik-backup-<ts>.json) | Overwrite (adopt token, re-save)
```
- *Walked live 2026-08-24 (`docs/walks/F-A2-save-autosave-conflict.md`): the conflict modal, its three actions and the backup file are all real — the backup is a full 41KB project carrying the unsaved edit that caused the conflict. The `retry ×1` this diagram used to claim was never the shipping path; it belonged to `initBuildrikSync`, deleted 2026-08-19 as uncalled. Not adding one: the chip is honest immediately and a silent retry would delay that.*
- Data-loss guard: empty tree never auto-saved until content observed this session (2026-06-04 fixture-wipe incident, `BuildrikSyncProvider.ts:86-92,444-474`).
- ~~⛔ Engine-level autosave has no conflict handling and never clears dirty flag~~ — **mostly stale, verified 2026-08-23**. Conflict handling ships: `SaveConflictError` (`BuildrikSyncProvider.ts:85`) is thrown, caught and given its own state by both save paths — the autosave catch in `useComposerInit` and the manual one in `useSaveCallback`. The dirty half was true until `768e9661`: the dashboard autosave persisted through the sync provider and told the composer nothing, so `composer.isDirty()` stayed true and every page kept its dirty dot over work already on the server. It now calls `composer.markSaved(snapshot)`. What REMAINS true, and is not a defect: `StorageAdapter`'s own 5s localStorage autosave (`:45-57`) still announces nothing — it writes a crash-recovery cache, not a save.
- Sources: `BuildrikSyncProvider.ts:288-329,457-494`, `AquibraStudio.tsx:278-538`.

### F-A3 · Publish pipeline (end-to-end)

```
Topbar Publish (flag publish=true, siteId required)
  → exportPublishPages(composer) — engine ExportEngine.exportAllPages({format:"html"}) client-side
  → PublishService.publishSite: tRPC sites.publish{siteId, pages[{path,html}]} → jobId
  → usePublishJob poll sites.publishStatus every 2000ms (immediate first poll)
  server: PublishBuildJob QUEUED→BUILDING→COMPLETED|FAILED|CANCELLED (DEPLOYING declared, never written — §13b A9)
    worker: prePublish honesty guards; Vercel deploy via workspace OAuth when configured, else dev simulation
    server-side injection at deploy: analytics beacon, favicon/og, canonical+robots, robots.txt, FREE-plan badge
  client terminal:
  ├─ COMPLETED → sites.get → publishedUrl → toast "Site published" (6s) → PublishDropdown "published"
  ├─ FAILED → toast; VERCEL_NOT_CONNECTED/TOKEN_INVALID branch deep-links dashboard integrations
  └─ CANCELLED (sites.cancelPublish)
```
- Republish blocked only while job non-terminal (`usePublishJob.ts:92-96`); prior published state hydrated on mount (`:144-160`).
- ~~⛔ PublishDropdown states in-review/approved defined but never driven~~ — **stale, verified 2026-08-23**: `PublishDropdown` **no longer exists** (2 stray comments reference it; no file). Original text: PublishDropdown states in-review/approved defined but never driven — shell passes only draft|published (`AquibraStudio.tsx:402`); Submit-for-Review / Approve / Unpublish menu items are no-ops ("Phase 7", `PublishDropdown.tsx:163-165`).
- ~~⛔ Review approval gates nothing server-side (`editsRequireApproval` never read)~~ — **stale, verified 2026-08-23**: `publish.service.ts:252,259` reads it and `startPublish` throws APPROVAL_NONE / APPROVAL_PENDING / APPROVAL_CHANGES / APPROVAL_STALE. The gate exists. What is worth knowing instead is that the flag **defaults to false** (`schema.prisma:198`), so an unconfigured workspace has no approval step at all.
- Sources: `useExportHandlers.ts:83-159`, `PublishService.ts:19-105`, Ch.10 §10.2.

### F-A4 · Media upload pipeline

```
file picked/dropped (accept image/video/audio/svg/fonts)
  → validate size (img 10MB / video 100MB / audio 50MB / SVG 1MB; dim ≤4096)
  → MIME magic-byte sniff (spoofed ext) → SVG: DOMPurify sanitize (reject non-svg root)
  → auto-WebP convert → thumbnail → IndexedDB "aquibra-media" (local-first)
  → best-effort server mirror: @vercel/blob client upload via POST ${DASHBOARD_URL}/api/asset-upload
      (server validates session+quota+size → scoped token → direct browser→Blob upload)
  → media.createAsset (idempotent on URL); server CUID replaces local id
  ├─ mirror fail → localOnly=true + retryQueue (rebuilt on init, survives reload)
  ├─ delete-during-upload → tombstone
  └─ UPLOAD_COMPLETE → AltTextService auto-trigger (claude-haiku-4-5; never overwrites user text)
FSM: pending(0)→uploading(25-50)→optimizing→processing(75)→complete(100)|error; rows clear 1.5s
```
- Quota: server `media.checkStorageQuota` (FREE/PRO/BUSINESS, −1 unlimited) else local 1GB SSOT; pre-check blocks; warn 80% / critical 95%.
- Sources: `MediaManager.ts:684-903`, `AssetUploadService.ts:50-92`, Ch.08 §8.1.

### F-A5 · AI edit pipeline (AITab — the real path)

```
AITab (rail "ai" / topbar ✨) → scope chip (element/page; locked during stream)
  ├─ Chat: prompt ≤5000 → tRPC subscription ai.streamPrompt (intent text|style-command|plan)
  │    server: provider-check BEFORE quota reserve; refund on no-delivery
  │    → streamed edit-command batch (14 command types; server-side validation gate:
  │      style/attr allow-lists, unsafe-value regex, exact-id — ai.service.ts)
  │    → diff UI accept/reject/regenerate → applied in ONE transaction
  │    → adoptionTracker fire-and-forget ai.logAdoption (edit.applied / edit.reverted)
  └─ Agent: plan ≤8 steps → per-step pending→running→awaiting→applied|skipped|nochange|failed
       (approve / skip / auto-apply; agent.run adoption event)
Quota 403 → window "upgrade-modal-open" → UpgradeModal → ${DASHBOARD_URL}/dashboard/billing
Privileged action (site.publish only): propose→ConfirmDialog→confirm w/ single-use 5-min token, role re-checked
Client transport guards: 30 req/60s sliding window, timeout 30s, retry ×2 (5xx/408/429 only), queue concurrency 3, cache TTL 5min
```
- ~~⛔ Parallel legacy surfaces: AIAssistantBar~~ — **stale, verified 2026-08-23**: `AIAssistantBar`, `AICopilot` and the `showAI` prop are **0 hits** repo-wide; the surfaces this described were deleted. Original text: Parallel legacy surfaces: AIAssistantBar (dark-glass, credits via window event, never enforced client-side) + AIAssistant modal both open on `showAI` simultaneously (`StudioModals.tsx:240-247` + `AquibraStudio.tsx:570-574`); AICopilot mounted but **no trigger calls openCopilot** — orphan. Image gen + streaming in `openai.ts` facade are fake (picsum / non-streaming fallback).
- Sources: Ch.02 §2.2/2.4, Ch.09 §9.1-9.2, `AiTrpcClient.ts:14-18,106`.

### F-A6 · Version snapshot / restore

```
HistoryTab / VersionHistoryPanel
  save version (name ≤50) → VersionTimelineManager → IndexedDB "aquibra-versions" (cap 50, JPEG snapshot q0.6)
  → versionSync mirror → tRPC siteVersions.create (server cap 50/site)
  restore → client-side importProject from snapshot (clone-before-import, P0 2026-06-09)
  time-travel scrubber (Ctrl+Shift+T): restoreEntry truncates redo, pushes "Restored to:" checkpoint
  hover 300ms → preview banner "Preview — not saved / Exit" (canvas dims)
  compare: Visual diptych / Semantic list (cap 20 changes); AI summary via POST /api/trpc/ai.summarize (60s cooldown; ⛔ quota-free — §13 B7)
```
- Sources: Ch.01 (VersionHistoryPanel), `HistoryManager.ts:645-699`, `versionSync.ts:52-94`.

### F-A7 · Undo / redo (user-visible contract)

```
edit → PROJECT_CHANGED → 500ms coalesce → JSON-patch entry (style bursts labeled "style-batch")
undo/redo: flushPending() first → whole-tree importProject + selection revalidation
  bail-out without mutation if patch path diverges (iter-13 P0-9 guard)
not undoable: runWithoutTracking (txn rollback), collab remote ops, restore-in-progress
canUndo requires stack >1 (baseline checkpoint protected); depth 100; RAM-only — lost on reload
```
- Sources: `HistoryManager.ts:70-274,451-611`.

### F-A8 · Sync services fan-out (background mirrors)

| Mirror | Trigger | Server | Offline behavior |
|---|---|---|---|
| cmsSync | collection/entry mutations | cms.* upsert/delete/list | retry queue latest-wins, `online` auto-retry (`cmsSync.ts:34-98`) |
| componentSync | component master CRUD | siteComponents.* | best-effort |
| versionSync | version create/delete | siteVersions.* | idempotent mirror |
| templateSync | My Templates save | userTemplates.upsert/list | localStorage cache `MY_TEMPLATES` |
| MediaVersionService | image-editor save `_v{n}` | media.*AssetVersion | plan cap 5/25/100 server-side |

---

## 11.2 USER FLOWS (persona step-by-step, as built)

### U1 · First-run builder → first publish
1. Dashboard "Edit site" → `/edit/:id` (needs `NEXT_PUBLIC_UNIFIED_EDITOR=true`, else dead legacy demo — root CLAUDE.md env table).
2. F-A1 load → blank canvas → **PageWizard** (~~⛔ 7 hardcoded steps insert static HTML; "AI" simulated — inputs discarded~~ — **stale, verified 2026-08-23**: `PageWizard` is **0 hits** repo-wide, the component is gone) or empty-canvas CTA "Browse Templates / Start blank".
3. Onboarding checklist (7 steps: name-project → pick-start → add-element → edit-text → change-style → preview → publish) bottom-right pill; achievement modal 4s per completion; collapses on element select (`useOnboardingOrchestrator.ts:114`). ~~⛔ WelcomeModal + SpotlightOverlay orphans — never mounted~~ — **stale, verified 2026-08-24**: both have **0 references and no files**; they were deleted, not left orphaned. Walked the rest of this step live the same day (`docs/walks/U1-first-run.md`): the checklist pill reads `0 / 7 done` and moves to `1 / 7` when an element is actually inserted.
4. Build (U2) → Preview ⌘P (sanitized sandboxed window) → Publish (F-A3).

### U2 · Build a page (core loop)
1. Rail Insert (A) → BuildTab exclusive-accordion catalog (53 elements / 6 categories; ecommerce excluded) → click-to-add (smart parent walk-up + nesting-error toast, `useBlockInsertion.ts:66-165`) or drag to canvas (snap guides 5px, drop zones 25% edges, touch long-press 500ms).
2. Select → inspector (Look/Layout/Effects tabs, profile-ordered sections) → edits: instant local preview + 300ms debounced engine write in `beginTransaction("style-change")` (`useStyleHandlers.ts:106-192`).
3. Breakpoint switcher (wide/desktop/tablet/mobile) → per-breakpoint overrides (desktop-first: tablet ≤1023, mobile ≤767); pseudo-state pills (hover/focus/active/disabled).
4. Double-click → inline text edit (whitelisted tags; Enter commits, Esc reverts; Selection-API rich commands, unsafe URLs rejected).
5. Right-click → context menu (Edit/Insert/Layout/Quick-Style submenus + Save-as-component/Group/Lock — full list Ch.04 §4.1).
6. Autosave F-A2; undo toast on destructive ops.

### U3 · Brand / design-system flow
1. Rail Styles (D) → DesignSystemTab v12: Tokens / Styles / Components / Export sections.
2. Tokens: 14 kinds; edit → live CSS var on documentElement; per-token undo; lint (no-black, banned purple/violet/indigo, alias depth ≤3, contrast auto-fix to AA 4.5).
3. Starter themes ×6 (cobalt/stripe/notion/apple/linear/vercel) — restyles tokens, keeps elements.
4. Apply → `composer.setProjectSettings({designTokens, schemaVersion:4, designPresets})` + markSaved. ~~⛔ `persistAll` localStorage path serializes only 3/14 kinds~~ — **stale, verified 2026-08-23**: `TokenRegistryContext.tsx:197-200` persists all 14, and its own comment records the bug this line describes — "Previously only color/spacing/type were saved, so edits to the other 11 … were silently lost on reload".
5. Bind in inspector: token chains stored `var(--buildrick-design-<id>)`; Reach strip This item / All like this (blast-radius confirm) / Whole site.
6. Export: CSS (dark: media|data-attr|off) / JSON / Tailwind (drops dark variants, warned) / ⛔ Figma stub. Import: JSON-only parser, conflict strategies Replace/keep-mine/keep-theirs.
7. Cross-site brand: "Open Shared theme ↗" **link-out to dashboard only** — no push UI in editor (§12 #7).

### U4 · Component flow
1. Select subtree → context "Save as component" or rail Components (⇧A; MAX 100).
2. Instantiate from panel → per-instance overrides stored as `#/` position paths.
3. Variant swap via inspector VariantSection; detach = pro-DS-mode only.
4. Master edit → sync re-applies overrides (style+attr survive — F1a; content/trait disputed; ⛔ reorder survival F1b deferred; ~~⛔ "reset to master"/is-overridden UI dead — path-scheme mismatch `#/` vs `/elements/`~~ — **stale on both halves, verified 2026-08-23**. The button ships: `VariantSection.tsx:142` "Reset to master" → `composer.components.resetInstance()` (`ComponentManager.ts:457`), which is real, awaited and covered by tests written against board 160:2. The path scheme is unified on `#/` and documented as canonical (`ComponentInstance.ts:59,68`). (A first pass of this walk called the feature dead on the strength of `ComponentInstance.resetOverride()` having zero callers. That method IS dead — it resets ONE property override, a finer-grained thing than the shipped button — but a symbol with no callers is not a feature with no door, and the two were conflated. The dead method is a cleanup item, not a broken flow.)).
5. Masters mirrored via componentSync → siteComponents.*.
6. Catalog (27 read-only polished components) inserts via `placeCatalogComponent` one-transaction; ⛔ catalog drag-to-canvas stub; ⛔ ComponentsPanelV2 "+AI" schema → localStorage only, canvas insert unbuilt.

### U5 · View mode (`?view=readonly`) — was "client editor flow"
*Walked live 2026-08-24 (`docs/walks/U5-view-mode.md`). All three original steps were stale; measured behaviour below.*
1. ~~Full reload with param → 4-tool rail + density `fewer`~~ — view mode has **no rail at all** and a topbar of `‹ Back to editing`. Chrome is stripped, not trimmed.
2. ~~Edits identical engine path (no scoped permissions client-side)~~ — **stale as of this session**: `Composer.readOnly` gates every mutating command at the command centre. Measured: with `?view=readonly`, select an element and press Delete and the count does not move (10 → 10). With the legacy `?view=client` it does (10 → 9) — that param no longer means anything and falls through to the ordinary editor. `editorViewMode.ts` records that nothing ever set it, so no link in the wild carries it; the fiction was in this document.
3. ~~Ship = "Send for review" popover~~ — `StudioHeader.tsx:644` leaves that slot deliberately empty in view mode ("sending a site for review is the owner's act"). `SendForReview` renders from the owner's Review tab (`ReviewTab.tsx:434`).
4. ~~⛔ No tokenized share link exists~~ — **stale, verified 2026-08-23**: `/share/<token>` and `/review/<token>` both ship (`app/share/[token]`, `app/review/[token]`), and the editor's site menu opens the first through the dashboard's ShareDraftModal. What the URL param is has been renamed accordingly: it is view mode, not a client preview.

### U6 · Review / approval loop (⛔ broken as designed)
1. EDITOR submits review (U5) → ADMIN notified by email → resolve APPROVED | CHANGES_REQUESTED (1 PENDING/site).
2. ~~⛔ Publish never checks review state~~ — **stale, verified 2026-08-23**, same as §11.1: the check is in `startPublish`. The live gap is the default (`false`), not the wiring.
3. ~~⛔ External client not in loop: comments backend complete — zero editor UI~~ — **stale, verified 2026-08-23**: `editor/sidebar/tabs/review/ReviewTab.tsx` and `editor/shell/ReviewBar.tsx` both ship. What is NOT re-verified here is whether the client's own `/review/<token>` view reaches them — that leg was not walked.

### U7 · Media flow
1. Rail Media (M) → 3 modes (280/320 launcher · 560 expanded · fullpage LibraryManager, shortcut J).
2. Upload (F-A4) / Import URL (LibraryManager prompt; ⛔ modal "From URL" tab = coming-soon stub) / Add from stock (Unsplash/Pexels/Pixabay server-proxied; tabs Photos/Videos/Icons/Fonts).
3. Organize: folders (create/delete; smart folders Recent-7d / In-use / Unused; ⛔ Trash = toast stub), bulk move/delete/select-all, sort, grid/list.
4. Detail rail: alt text ≤125 + AI generate w/ provenance chip; Versions tab (revert = replaceAcross); Used-in tab.
5. Edit image: crop (aspect presets, rotate ±180, flip, zoom 1-3×) / adjust (b/c/s ±100, blur 0-20, 6 filter presets) / resize → WebP q0.92 saved as `_v{n}` version.
6. Optimize: WebP/AVIF/JPEG/PNG, quality 10-100 (default 85), max-dim clamp, live savings.
7. Replace-across: all usages atomic (one undo) or per-page selective modal.
8. Icons: Lucide 369, size 12-96 / stroke 0.5-4 / color, recents ×12.

### U8 · CMS / ecommerce flow
1. Drop e-com block (product-card/grid/detail; ⛔ not in build-tab catalog — Ch.07) → CollectionSetupModal once per session → ProductCollectionService creates Products collection (8 fields, optional 3 samples) in composer.cms.
2. Bind elements via inspector BindingPopover (cms.bindings).
3. cmsSync mirrors collections/entries to server (retry queue).
4. ⛔ Dynamic pages have no editor front-door; records stay `draft`, per-record publish absent (§12 #6).

### U9 · Version rescue flow
HistoryTab (H) → Changes/Saves views → scrub timeline → hover-preview → restore (F-A6) → autosave persists restored state. Auto-milestone banner surfaces suggested save points.

### U10 · Export flow (no-publish path)
Topbar Export (flag off) → engine ZIP download direct; or ExportModal (StudioModals): format HTML/ZIP/React (⛔ Vue/Next coming-soon; JSON unsurfaced) → Preview/Code/Options tabs → download. Publish reuses the same engine exporters (F-A3).

### U11 · Pages management flow
1. PageTabBar above canvas: switch, + add, rename (F2, live slug preview), duplicate ("X Copy"), set-home 🏠, delete (confirm + 8s undo toast; home/last page protected — `PageTabBar.tsx:37,160-171`).
2. Rail Pages (P): CRUD + localStorage-only folders, bulk multi-select (⌘/Shift/Space) duplicate/move/delete, drag reorder, ⌘K palette, copy link, SEO table view.
3. Per-page settings drawer: SEO (score algorithm max 100; noIndex→0)/Social/Advanced; slug normalize + collision check; head-code tag-balance guard; autosave 500ms, ⌘S immediate.
4. ~~⛔ SEO counters lie: title shows /60 but maxLength 80; desc /160 slices 200; score labels contradict algorithm~~ — **stale, verified 2026-08-23**: `SeoTab.tsx:196-197` is `slice(0,60)` + `maxLength={60}`, `:246` is `slice(0,160)` against a `/160` counter, and the check labels mirror `calculateSeoScore`'s real weights. The live defect found in the same pass was different and is now fixed (`ea33fe24`): the panel advertised "+30 pts" for a clean slug and the score paid 20, because the rule was the literal `slug !== "page-1"` — which caught a new project's first page and let `page-2`..`page-N` through.

### U12 · Site settings flow
Rail Site (S) → SettingsTab drill-in (root ⇄ section, 180ms lock + dirty guard): 10 sections in 3 groups (SITE/DISTRIBUTION/PLUMBING) + 3 workspace deep-links (Domains/Members/Billing → dashboard). Central dirty counter + sticky savebar. Plan gates: advanced + integrations require pro → LockedScreen → billing. ⛔ Redirects/Headers saved but not enforced on live sites (explicit banners); Integrations all "Coming Soon"; Localization routing "Phase D" (§13b B8).

---

## 11.3 FEATURE FLOWS (trigger → path → outcome → failure modes)

Compact per-feature contracts. Full field/validation detail lives in Ch.01-10.

| # | Feature | Trigger | Path (engine/API) | Outcome | Failure/edge |
|---|---|---|---|---|---|
| FF1 | Select element | canvas click / layers / Tab-cycle | SelectionManager SSOT → events mirror to React | inspector opens, handles render | locked → toast+block; root excluded |
| FF2 | Multi-select | Shift+click / marquee ≥5px / ⌘A | SelectionManager multiple | MultiSelectToolbar (align ≥2, distribute ≥3); merged "Mixed" values | only 5 batch style fields |
| FF3 | Insert block | click/drag from BuildTab | `insertBlock`: canNest validate → sanitize → create/build | success animation + toast | 8 drop-error types; nesting toast; 150ms re-click guard |
| FF4 | Drag existing | mousedown 5px / touch 500ms | DragManager idle→pending→dragging; Alt=clone | move/reparent one txn | invalid-drop reasons ×9 overlay |
| FF5 | Resize/rotate | 8 handles / rotation handle | engine ResizeHandler | live W×H readout; Shift 15° snap | handles hidden ≤50px edges, locked |
| FF6 | Inline text edit | double-click text | contentEditable + Selection API | Enter commit → sanitize → setContent | Esc revert; nested-id block; unsafe URL reject |
| FF7 | Style edit | inspector field | 300ms debounce → txn "style-change" → setStyle / setBreakpointStyle / setRule(pseudo) | canvas updates; history coalesced | numeric regex; Esc revert + aria-invalid; kebab-key auto-expand dead (§13b A19) |
| FF8 | Token bind | chip in inspector | `var(--buildrick-design-<id>)` write | O(1) propagation via CSS var | never raw values |
| FF9 | Page CRUD | PageTabBar / PagesTab | PageManager (Map order; slug history 100; single-home invariant) | typed PROJECT_CHANGED | engine allows deleting last page — UI guards it `[TBC engine-side]` |
| FF10 | Template apply | TemplatesTab / empty-CTA | txn → importHTMLToActivePage; FSM idle→confirming→applying→success\|error (15s timeout) | sections appended | 500ms artificial delay; My Templates localStorage(+server mirror) |
| FF11 | Component create | context menu / panel | ComponentManager master + instance | ⚡ badge in layers | cap 100 |
| FF12 | Instance sync | master edit | version-gated stale → sync; overridesPreserved/Dropped events | style/attr overrides survive | ⛔ reset-UI dead (A2); reorder drops overrides (F1b) |
| FF13 | Publish | Topbar | F-A3 | publishedUrl | ADMIN-only server-side; 2MB/16MB/500p caps; 1 active job/site |
| FF14 | Send for review | client-view Ship | reviews.submit | "sent" state | ⛔ gates nothing (A1) |
| FF15 | AI chat edit | AITab prompt | F-A5 streaming | accept/reject diff → txn | quota 403 → UpgradeModal; provider-missing pre-reserve |
| FF16 | AI agent run | AITab agent mode | plan ≤8 steps FSM | per-step apply/skip | step failed → continue/abort |
| FF17 | AI alt-text | media detail / auto on upload | media.generateAltText (haiku) | provenance chip | never overwrites user text; TOCTOU-guarded server-side |
| FF18 | Upload asset | picker/drop/paste/OS-drag | F-A4 | grid + usable src | quota block pre-check; localOnly retry queue |
| FF19 | Replace across | media detail | mediaOps.replaceAcross(Selective) | atomic multi-page swap | per-page modal counts elements |
| FF20 | Version save/restore | HistoryTab | F-A6 | restored tree | cap 50; preview banner guards accidental edits |
| FF21 | Undo/redo | ⌘Z/⌘⇧Z | F-A7 | tree swap + selection revalidate | RAM-only; baseline protected |
| FF22 | Interactions | inspector section | 13-14 triggers × 42 presets, delay 0-5s | runtime on preview mode only (InteractionManager start/stop) | "7" in older docs stale (§13 B6); code enumerates 14 |
| FF23 | Animation | inspector AnimationSection | AnimationEditor 12/8/5 presets → generateAnimationCSS | CSS animation config | ⛔ triggers removed 2026-05-18 (engine ignored); Timeline/ScrollTrigger L0 |
| FF24 | Forms | form blocks + FormSettingsSection | formId gen; action submit/webhook/email | published: POST /api/public/forms (10/60s, 256KB, honeypot) | editor-preview submissions in-memory only (§13b A16); ContactForm swallows errors |
| FF25 | Export code | ExportModal / topbar | ExportEngine / ReactExporter client-side | download blobs | Vue/Next stubs; preview sanitized hard |
| FF26 | Zoom/fit | footer −/+, ⌘0-style fit | presets 25-200 UI (engine allows 10-500 ⚠) | scaled canvas | no free-pan mode |
| FF27 | Keyboard ops | Ch.04 §4.2 map | commands via CommandCenter | toasted w/ Undo | dual arrow-handler conflict (§13b A13) |
| FF28 | Color mode | topbar cycle | ColorMode light/dark/system persisted `buildrik:colorMode` | DarkResolver darkValue ?? value | DS UI dropped System pill (state keeps it) |
| FF29 | Collab session | "Collaborate" button (flag `collab`) | CollaborationManager over SSE (1.5s poll, 24h retention) | presence avatars, cursors | ⛔ DEMO-ONLY: OT non-convergent (6 P1s), MOCK_USERS fallback, clientId spoofable; ConnectionQualityIndicator orphan |
| FF30 | Onboarding step | checklist CTA | composer.emit(UI_PANEL_OPEN...) routes to panel | step complete + achievement 4s | local-only; last step / skipAll → done |
| FF31 | Stock insert | media "Add from stock" | media.searchStockPhotos/Videos proxy | insert w/ attribution data | keys unset → `[]` (silent empty) |
| FF32 | Icon insert | icon block / picker | IconConfig lucide + size/stroke/color | inline SVG element | recents localStorage |
| FF33 | Preview | ⌘P | sanitized HTML → sandboxed window | visual check | popup blocked → warning toast |
| FF34 | Command palettes | ⌘K (shell) / ⌘⇧P (canvas) | 2 separate registries | action exec | ⛔ fragmented; unified ⌘K = spec-only (§12 #5); "Open SEO" honest fallback |
| FF35 | Crash recovery | reload after crash | RecoveryManager sentinel | page/root/selection restored | `recovery:runtime-fault-caught` |

---

## 11.4 Flow dead-ends (outcome-closure gaps)

Cross-referenced to master §13 + design-gaps audit 2026-06-30:

1. **J5 sign-off loop open** — review submit works; approval enforces nothing; client has no surface (A1, A4, B12, C1).
2. **CMS payoff unreachable** — collections/bindings work in-editor; dynamic pages/per-record publish have no front door (§12 #6).
3. **Publish trust theater** — worker shows "Optimizing images"/"Performance check" as completed no-ops; lighthouseScore always null (§13b A20); dev simulation can mark non-deployed site COMPLETED.
4. **AI second path rot** — AIAssistantBar/AICopilot/openai facade legs are legacy/fake/orphaned while AITab is real (B2).
5. **Settings that don't act** — Redirects/Headers/Localization/Integrations saved-or-shown but not live (§13b B8).
6. **Local-feeling cloud** — LibraryManager shows "This device only" pill while assets actually mirror to server `[TBC intended copy]` (Ch.08 report).
