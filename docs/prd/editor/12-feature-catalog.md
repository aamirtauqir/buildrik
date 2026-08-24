# Editor PRD · Ch.12 — Master Feature Catalog

> Part of BUILDRIK-PRD-EDITOR v3.0 · `main` @ `e5624ca1` · 2026-07-08 · One row per user-facing feature. Status verified against code this pass (7 parallel module scans); doc-status inherited from `docs/reviews/complete-feature-list-20260623.md` (07-02 code-verify update) where re-verified.
>
> **Status legend:** ✅ working · 🟡 partial · 🔵 stub/fake · 🔴 broken · ⚪ local-only (no server persistence) · 👻 orphan (built, unreachable in UI) · 🔒 flag/plan-gated
>
> **Flow ref** = Ch.11 flow ids (F-A*/U*/FF*).

## 12.1 Shell & global

| Feature | Entry | Status | Backend | Flow | Evidence |
|---|---|---|---|---|---|
| Boot: load project by siteId | `/edit/:id` or `?siteId=` | ✅ | sites.get + pages.list + siteDetail.settings.get | F-A1 | `BuildrikSyncProvider.ts:197-233` |
| Boot: local/demo mode | no siteId | ⚪ | localStorage/IndexedDB | F-A1 | `useComposerInit.ts:237-285` |
| Autosave (dashboard) | any edit | ✅ | sites.saveProject dual-write | F-A2 | `BuildrikSyncProvider.ts:288-329,494` |
| Save-conflict UX | concurrent edit | ✅ | expectedLastEditedAt → CONFLICT | F-A2 | `AquibraStudio.tsx:278-538` |
| Undo/redo | ⌘Z/⌘⇧Z | ✅⚪ RAM-only | — | F-A7 | `HistoryManager.ts:70-274` |
| Save pill (4 variants + offline queue) | topbar | ✅ | — | F-A2 | `Topbar.tsx:270-317`. The queue half was ✅ over two defects until 2026-08-24: its notice could not be retracted (a successful retry left a permanent "not on the server" toast; a second failure stacked another), and both exit doors were blind to it, so a clean project walked out on a full queue and ended it — the queue is a `Map` of closures in memory. Fixed; see `docs/walks/F-A2-save-autosave-conflict.md`. |
| Breakpoint switcher (wide/desktop/tablet/mobile) | topbar | ✅ | — | U2 | `Topbar.tsx:388-393` |
| Color mode light/dark/system | topbar cycle | ✅ | persisted `buildrik:colorMode` | FF28 | `ColorMode.ts:4-71` |
| Preview (sanitized window) | ⌘P | ✅ | client-side | FF33 | `StudioHeader.tsx:197-217` |
| Publish dropdown | topbar | 🟡🔒 flag `publish` | sites.publish family | F-A3 | `PublishDropdown.tsx` — only Publish/View/Copy wired; Submit-review/Approve/Unpublish no-ops (§13 A1) |
| Export HTML fallback | topbar (flag off) | ✅ | client-side ZIP | U10 | `useExportHandlers.ts:60-81` |
| Command palette (shell ⌘K) | topbar/⌘K | ✅ | — | FF34 | `Topbar.tsx:259-268` — fragmented vs canvas ⌘⇧P |
| Command palette (canvas ⌘⇧P) | canvas | ✅ | — | FF34 | `useCanvasCommandPalette.ts` |
| Keyboard shortcut system | global + canvas | ✅ | — | FF27 | Ch.04 §4.2 — ⚠ dual arrow-handler conflict (§13b A13) |
| 4-tool rail (Insert/Pages/Styles/Site) | default | ✅ | — | 11.0 | `editorViewMode.ts:34` — `?rail=legacy` escape; ⚠ stale opt-in comment `LeftSidebar.tsx:399` |
| Legacy 11-tab rail | `?rail=legacy` | ✅ | — | 11.0 | `tabsConfig.ts:79-247` |
| Client view mode | `?view=client` | ✅ | — | U5 | `editorViewMode.ts:31-38` |
| Send for review | client-view Ship | 🟡 | reviews.submit | U6 | gates nothing (§13 A1) |
| Conflict modal backup download | conflict | ✅ | — | F-A2 | `buildrik-backup-<ts>.json` |
| Issues pill | topbar (when >0) | ✅ | — | — | `Topbar.tsx:398-409` |
| StructurePopover (footer ⌗) | footer | ✅ | — | — | `StructurePopover.tsx:52-99` |
| Footer zoom presets 25–200 | footer | ✅ | — | FF26 | `StudioFooter.tsx:17,73-90` |
| Footer "Connected · main" branch label | footer | 🔵 static | — | — | `StudioFooter.tsx:130` |
| Crash recovery | reload | ✅ | sessionStorage sentinel | FF35 | `RecoveryManager.ts:26-198` |
| Error boundary + reload screen | crash | ✅ | — | — | `AquibraStudio.tsx:84-119` — componentDidCatch empty |
| Onboarding checklist (7 steps) | first run | ✅⚪ | localStorage only | FF30/U1 | `useOnboardingOrchestrator.ts:114-239` |
| Achievement prompts | step complete | ✅ | — | U1 | 4s auto-dismiss |
| WelcomeModal | — | 👻 | — | — | exported, never mounted (`onboarding/index.ts:22`) |
| SpotlightOverlay | — | 👻 | — | — | never mounted; spotlightTarget fields unused |
| PageWizard | blank first-run | 🔵 "AI" simulated | none — inputs discarded | U1 | `PageWizard.tsx:53-135,230` |
| UpgradeModal (403 → billing) | quota hit | ✅ | window `upgrade-modal-open` | F-A5 | `UpgradeModal.tsx:56-76` |
| ConflictModal / TabGuard / confirm dialogs | various | ✅ | — | — | Ch.01 |

## 12.2 Canvas

| Feature | Status | Notes / evidence |
|---|---|---|
| Select (click/shift/⌘-cycle/dbl/triple) | ✅ | `useSelectionBehavior.ts:74-264`; locked → toast |
| Marquee multi-select | ✅ | min-drag 5px |
| Drag/reorder + Alt-clone + multi-drag + touch | ✅ | `useCanvasElementDrag.ts`; long-press 500ms |
| Drop validation (9 invalid reasons, 8 error types) | ✅ | `DropFeedbackOverlay.tsx:18-28` |
| Resize/rotate (8 handles, 15° snap) | ✅ | `SelectionHandles.tsx:81-208` |
| Inline text edit (whitelisted tags, sanitize) | ✅ | `useCanvasInlineEdit.ts:31-211` |
| Rich-text commands (Selection API) | ✅ | unsafe URLs rejected |
| Context menu (Edit/Insert/Layout/QuickStyle/standalone) | ✅ | full item list Ch.11 report / `contextMenuRegistry.ts:49-105` |
| Snapping + smart guides + ruler guides | ✅ | 5px÷scale; guides persisted `buildrick-guides` |
| Section reorder handles | ✅ | `useSectionReorder` |
| Empty-canvas CTA + QuickAddBar | ✅ | Browse templates / Start blank |
| Zoom/fit-to-screen | ✅ | UI 25–200 (engine caps 10–500 ⚠ conflict) |
| Device frame preview | ✅ | mobile/tablet chrome only |
| Overlay toggles (guides/spacing/grid/rulers/badges/x-ray) | ✅ | `CanvasFooterToolbar.tsx:33-55` |
| OS image drop → upload+src | ✅ | `useDropExecution.ts:219-261` |
| Catalog component drop | 🔵 placeholder insert | "future renderer arc" (`dropOperations.tsx:492-536`) |
| GSAP selection animation | 👻 disabled "FOR STABILITY" | `SelectionBoxOverlay.tsx:316-321` |

## 12.3 Sidebar tabs

| Tab | Feature set | Status | Evidence |
|---|---|---|---|
| Insert (A) | 53 elements / 6 categories; search 150ms; exclusive accordion; drag+click insert | ✅ | `catalog.ts:10-482` — favorites plumbing orphaned/DEAD (`useBuildTab.ts:260-287` — defect N3); ecommerce blocks ARE reachable under "Advanced" via CATEGORY_REMAP |
| Pages (P) | CRUD, rename-dup-check, duplicate, delete+8s undo, set-home, copy link, bulk ops, folders (⚪ localStorage), SEO table view, ⌘K | ✅ | `usePages.ts:34-333`; page persistence rides sites.saveProject blob |
| Page settings drawer | SEO/Social/Advanced; autosave 500ms; slug validate+history; visibility live/hidden/password; head-code guard | ✅ | ⚠ SEO counter lies (80 vs /60, 200 vs /160); score UI weights ≠ algorithm (`seoScore.ts:10-22` vs `SeoTab.tsx:120-124`) |
| Templates (T) | 10 site templates + sections; 2-stage filters; page-size 6; detail 320→700; apply/add-as-page/replace+backup; premium 🔒 upgrade modal; usage drawer | ✅ | `templatesData.ts:160-285`, apply FSM 15s timeout |
| My Templates | save/rename/delete | 🟡 | localStorage + userTemplates server mirror (`templateSync.ts:47-89`) |
| Media (M) | 3 modes; pills+counts; stock modal; folders; bulk; detail overlay; versions; **paging** | ✅ | Ch.08 — ⚠ UI ceiling 50MB vs copy "10MB each" (`UploadZone.tsx:18` vs `mediaData.ts:67-75`). Paging + server-side search added 2026-08-24: this row read ✅ while the library silently stopped at 200 assets — `media.listAssets` had one caller in the editor, it discarded `nextCursor`, and it never sent the `search` argument the endpoint has always accepted, so a query reached 200 of 412 assets and said "Nothing matches" about a file on the server. Boards `144:2` (`Load more`), `145:2` (`Search scope`) and `782:4353` (failed-search line); see `docs/walks/U7-F-A4-media.md`. **Cross-site bleed fixed the same day**: media AND CMS lived in browser-global IndexedDB with no site partition (`useComposerInit` scoped only `versions`/`components`), so a site opened second in the same browser listed the first one's assets — reproduced live on two real sites. See `docs/walks/F-A1-boot-and-project-load.md`. |
| Layers (Z) | tree, search+SR, drag reorder 30/40/30, hide/lock (⚪ localStorage/page), rename F2, group, 11 context actions, ⚡ badges | ✅ | `panels/layers/index.tsx` |
| Components (⇧A) | groups, create-from-selection, instantiate, variant swap, detach; MAX 100 | 🟡 | override reset UI dead (§13 A2); ~~V2 panel 🔒 flag off; V2 "+AI" → localStorage only~~ — **stale, verified 2026-08-23**: `ComponentsPanelV2` and its flag were deleted 2026-08-16 (root `CLAUDE.md`) |
| Design (D) | DS tab v12: Tokens(14 kinds)/Styles(11 cats)/Components(read-only)/Export; starters ×6; lint; import/export | ✅ | Ch.06 — persistAll 3/14 kinds (§13 A3); Figma export stub; preset binding click no-op v1 |
| Settings (S) | 10 screens 3 groups + 3 workspace deep-links; dirty savebar; plan gates advanced+integrations→Pro | ✅ | screens detail Ch.11 report §2E |
| — Redirects/Headers/Localization | saved server-side | 🟡 not enforced live | explicit banners (§13b B8) |
| — Integrations | 6 catalog cards | 🔵 all "Coming Soon" | `IntegrationsScreen.tsx:81-89` |
| — Forms inbox | filter tabs, 20/page, mark/spam/archive, CSV export | ✅ | `FormsScreen.tsx` |
| — Analytics IDs | GA4 + Meta Pixel + consent | ✅ | regex-validated; injected at export/publish |
| — Branding | nav-map only, no fields | 🔵 | `SettingsTab.tsx:145-211` |
| Publish (U) | status badge, URL copy, 5-item checklist | ✅ read-only | computes 7 checks renders 5 (§13/Ch.02) |
| History (H) | Changes (virtualized undo timeline, j/k nav) + Saves (versions, restore/delete/compare, AI summary 60s cooldown) + Time-Travel Ctrl+Shift+T + auto-milestone | ✅ | `HistoryTab.tsx`, `VersionHistoryPanel.tsx:43` |
| AI (I) | chat + agent + model picker + scope chip | ✅ | F-A5; server-authoritative tier gating |

## 12.4 Inspector

| Feature | Status | Evidence |
|---|---|---|
| 3 tabs (Look/Layout/Effects) + profile default-tab | ✅ | `InspectorTabs.tsx:23-28`, 7 profiles `elementProfiles.ts:52-179` |
| 18-section registry (SSOT) | ✅ | `registry/index.tsx:56-65` — full field tables Ch.03 + Ch.11 report §3.2 |
| Per-breakpoint + pseudo-state overrides w/ indicators | ✅ | `cssContext.ts:52-74` |
| Edit propagation: 300ms debounce, txn, instant preview | ✅ | `useStyleHandlers.ts:106-192` |
| Multi-select merged view + batch (5 fields) | ✅ | `useBatchStyleHandler.ts:87-214` |
| Reach strip (This item / All like this / Whole site) | ✅ | `ReachScopeStrip.tsx:93-138` |
| Token binding chips + chains | ✅ | `tokenBindingDetection.ts:17-41` |
| Element properties per-type + custom data-attrs | ✅ | `config.ts:23-321` — duplicate link-editing homes (LinkSection + config) |
| Link section (6 types, validation) | ✅ | `LinkSection.tsx:43-312` |
| CSS classes chips + autocomplete (8) | ✅ | `CSSClassesSection.tsx:107-207` |
| Visibility per-breakpoint (`--hide-*`) | ✅ | `VisibilitySection.tsx:21-71` |
| Interactions (13-14 triggers × 42 presets) | ✅ | `interactions/types.ts:13-148` — code enumerates element(5)+page(3)+scroll(3)+mouse(3); "7" in older docs is wireframe-era stale (§13 B6) |
| Animation editor (12/8/5 presets) | ✅ | triggers removed 2026-05-18; Timeline/ScrollTrigger L0 stubs |
| AllCSS raw editor | 👻 dead | `devMode` hardcoded false (`ProInspector.tsx:95`); keep dead until Pro-gate+sanitize (§13 C2) |
| ColorInput alpha | 🔵 stub | 0/100 only (`ColorInput.tsx:46-48`) |
| Schema-driven border/spacing | 🔒 localStorage flag | parallel pipeline off-default |
| DetachInstance | ✅ pro-DS-mode only | `DetachInstanceButton.tsx:54` |

## 12.5 Engine (headless)

| Capability | Status | Evidence |
|---|---|---|
| ~30 managers via Composer; events = only engine→UI path | ✅ | `Composer.ts:207-291`; EVENTS catalog ~293 keys |
| Element model: 48 types, nesting rules registry, depth cap | ✅ | `element.ts:69-119`, `rules.ts:15-520` — ⚠ caps conflict 50 vs 30 |
| Pages: Map-ordered, single-home invariant, slug history 100, duplicate/reorder | ✅ | `PageManager.ts:61-340` — engine allows last-page delete; UI guards |
| History: patches+checkpoints, coalesce 500ms, depth 100, flushPending SSOT | ✅ | `HistoryManager.ts` |
| Transactions w/ rollback snapshot | ✅ | `Composer.ts:712-777` |
| Storage: local/session/IndexedDB/remote; secret redaction at rest | ✅ | `StorageAdapter.ts:176-193` |
| Sanitize SSOT: DOMPurify at import/parse/head-code/SVG boundaries; fail-closed head sanitizer | ✅ | `sanitization.ts:108-154`, `sanitizeHeadCode.ts:26-182` |
| Style engine: inline + global rules, desktop-first breakpoints | ✅ | ⚠ setDeviceRule 991/575 vs canonical 1023/767 (§13b B9) |
| Tokens: CSS vars, binding resolver, alias depth 3, dark resolver | ✅ | `TokenBindingResolver.ts:23-50` |
| Interaction runtime (preview mode) | ✅ | `InteractionRuntime.ts:164-253` |
| Version timeline (IndexedDB, cap 50, JPEG snapshots) | ✅ | `VersionHistoryStorage.ts:210-224` |
| Export engine: HTML/ZIP/React + injectors (SEO/GA4/Pixel/Stripe/Formspree/sitemap) | ✅ | `ExportEngine.ts` — "zip" absent from declared union ⚠ |
| Plugin manager | 🔒 off | `config.ts:235` |
| TemplateManager | 👻 soft-deprecated | `TemplateManager.ts:10` |
| Collab manager (OT over SSE) | 🔴 demo-only | 6 P1 non-convergence; remote-wins clobbers coalesce window (§13 B3) |

## 12.6 Media / DS / AI / peripheral

| Feature | Status | Evidence |
|---|---|---|
| Upload pipeline (sniff, SVG sanitize, WebP, local-first + Blob mirror + retry queue) | ✅ | F-A4; `MediaManager.ts:684-903` |
| Image editor (crop/adjust/resize, 6 filters, versions) | ✅ | `ImageEditorModal.tsx` — hold-to-compare present (earlier audit gap closed) `[TBC which audit stands]` |
| Optimization panel (WebP/AVIF/JPEG/PNG) | ✅ | `OptimizationPanel.tsx:159-304` |
| Alt-text + AI generate + provenance | ✅ | ≤125 chars; haiku; TOCTOU server guard |
| Replace-across (atomic + per-page) | ✅ | `AssetDetailsPanel.tsx:311-415`, `ReplaceAcrossModal.tsx` |
| Stock search (Unsplash/Pexels/Pixabay proxy) | ✅ env-gated | keys unset → silent `[]` |
| Icon picker (Lucide 370, 17 categories) | ✅ | `IconPickerModal.tsx` |
| Modal library "From URL" tab | 🔵 stub | vs working LibraryManager import — two inconsistent UIs |
| Trash | 🔵 toast stub | `LibraryManager.tsx:318-319` |
| "This device only" pill | ⚠ misleading | assets do mirror to server |
| DS tokens/presets/starters/lint/import/export | ✅ | Ch.06 |
| Shared theme push (agency→clients) | ⚪ editor side | link-out only; theme.* routers ADMIN+flag, zero editor wiring |
| AITab chat/agent/models | ✅ | F-A5 |
| AIAssistant modal (6 tabs) | 🟡 legacy | Analyze/Colors/A11y = client-side non-AI |
| ~~AIAssistantBar (⌘K bar)~~ | — | **deleted, verified 2026-08-23**: `AIAssistantBar` is 0 hits repo-wide |
| AICopilot | 👻 | mounted, no trigger calls openCopilot |
| AIPageGenerator/AIContentPanel/AICodeEditor | 👻 L0 | `ai/index.ts:24-25` |
| Image generation | 🔵 fake | picsum fallback (`openai.ts:150-157`) |
| Facade streaming | 🔵 fake | non-streaming fallback (AITab real streaming separate) |
| AI adoption telemetry | ✅ | `adoptionTracker.ts:42-97` — only real product instrumentation |
| Sidebar analytics | 🔵 no-op | provider never set (`sidebarAnalytics.ts:4-44`) |
| Collab presence/quality UI | 🔴🔒 | MOCK_USERS fallback; ConnectionQualityIndicator 👻 never mounted |
| Ecommerce CollectionSetupModal | ✅ local CMS | once/session on e-com block drop |
| Ecommerce blocks (4) | ✅ | ~~registered but excluded from build catalog~~ — **wrong, corrected 2026-08-23**: reachable under "Advanced"; this row contradicted the footer note below for months |
| contact-form block | 👻 | exported, unregistered (§13b A14) |
| Forms runtime (editor preview) | ⚪ in-memory | `FormSubmissionService.ts:99` — published sites use real POST endpoint |
| EmailService cloud providers | 🔵 throw | `/api/email/send` unimplemented (§13b A16) |
| Export modal (HTML/ZIP/React; Vue/Next coming-soon) | ✅ | `ExportOptions.tsx:20-23` |
| Animation editor | ✅ | triggers removed; Timeline/ScrollTrigger L0 |

## 12.7 Counts snapshot

Blocks **64** (registry) / build catalog shows **50** in BLOCKS + **14** in COMPONENTS *(**"defect N2" was not a defect — corrected 2026-08-23 by counting.** `blockDefinitions` = 64, `componentBlockDefinitions` = 14 and all 14 sit inside the 64, so `catalog/groups.ts:46` `blockRows` = 64 − 14 = 50. `BuildTab.tsx:200-201` renders BOTH groups and `useBuildTab.ts:235` searches both, so every one of the 64 is reachable — the split is deliberate, not a loss. The old "63 / 53" numbers were stale in both halves.)* · element types **48** · inspector sections **18** · element profiles **7** · sidebar tabs **11** (4-tool folded) · templates **10** (tab) + **15** (TemplateLibrary modal) + **11** section quick-inserts — ⚠ three template surfaces (§12 #F2 collapse "won't do") · DS token kinds **14** · presets **18** seeded / **11** categories · starter themes **6** · catalog components **27** (8 atoms / 11 molecules / 8 organisms, `catalog.ts`) *(corrected 2026-07-18; was "27-30 [TBC]")* · Lucide icons **370** (17 categories) *(corrected 2026-07-18)* · interaction triggers **14** (element 5 · page 3 · scroll 3 · mouse 3) × presets **39** *(corrected 2026-07-18; was 13 × 42 — the prose enumeration already summed to 14)* · animation presets **25** · events catalog **~293** · settings screens **10** + 3 deep-links · shortcuts: full map Ch.04 §4.2.

## 12.8 New drift found this pass (feeds §13 as E/F rows)

1. `LeftSidebar.tsx:399` comment claims 4-tool rail is opt-in `?rail=4`; code default is 4-tool ON, `?rail=legacy` opt-out (`editorViewMode.ts:34`). Stale comment, wrong param name.
2. Media upload copy "max 10 MB each" vs enforced 50MB ceiling (`mediaData.ts:67-75` vs `UploadZone.tsx:18`).
3. Templates: 3 parallel surfaces confirmed live (sidebar tab 10 · TemplateLibrary modal 15 · SectionTemplates 11) — F2 collapse still open.
4. Help-docs domain split: `docs.buildrik.com` (`LeftSidebar.tsx:469`) vs `docs.aquibra.com` (`FullPageView.tsx:51`) — B11 brand chaos instance.
5. `showAI` opens AIAssistant modal AND AIAssistantBar simultaneously (`StudioModals.tsx:240-247` + `AquibraStudio.tsx:570-574`) — B2 consolidation evidence.
6. AICopilot openCopilot prop plumbed through 3 files, zero callers; stale "⌘K → Copilot" comment (`CommandPalette.tsx:14,84`).
7. Build-tab favorites: full state/persistence in `useBuildTab.ts:103-287`, no UI renders it.
8. Onboarding "AI token-pick flow" (onboarding spec v3) — zero code in editor onboarding (schema v3 = checklist only). Spec-only, D-class.
9. Engine allows deleting last/home page; only UI guards (`PageManager.ts:248-272` vs `usePages.ts:232-243`) — defense gap if API-driven.
10. `licenseKey` prop accepted, unused (`AquibraStudio.tsx:123`).
