# Editor PRD · Ch.14 — Screen Specs (every screen, build-ready)

> Per-screen PRD for the redesigned editor. One block per screen so a UI-UX designer can design each in isolation and an engineer can build it. **Grounded in the 6-agent code inventory (2026-07-18)** — features cited are verified in the codebase, not assumed. IA/roadmap SSOT = `docs/designs/2026-07-17-editor-product-redesign-complete.md`; feature catalog SSOT = Ch.12; enhancement SSOT = `2026-07-18-feature-improvements.md`. This chapter owns per-screen specs only — it links, never re-derives.
>
> **Template per screen:** Job · IA home · Build-status · Purpose · Entry→Exit · Features (verified) · States · Roles · Data/backend · Improvements (★/◆) · Open questions.
> Status: **EXISTS** (works) · **REDESIGN** · **BUILD** (new) · **FIX** (broken). Roles: OW=Owner, AD=Admin, DE=Designer, CL=Client.
>
> ⚠ **IA-home values in this chapter are SUPERSEDED by §4.3 of the redesign doc** (the authoritative placement map). They were written against the earlier CREATE/STRUCTURE/BRAND/REVIEW grouping. Current homes: rail = **Insert · Layers · Pages · Media · Content · Brand** (6, canvas-interacting only) · topbar = **global only, 7 items** (Exit/site · save-pill→Versions→Compare · review-pill→review-bar · **notification bell→360w panel** · CTA · ⋯Site) · canvas toolbar = undo/redo · device · preview · 💬comment-mode · view-options · zoom · right = inspector (+ component management) · footer = issues→panel · sync · breadcrumb · **Site full-page** = settings ×11 · domains · export · publish history · **Portfolio** = brand-push · handover · shared templates/components/brand-kits. Templates dissolved (New-Page flow + Insert); AI = ⌘K + selection toolbar; comments = canvas mode; versions = save-pill.

---

## J1 · Discover & onboard

### S1.1 — First-open (empty canvas)
- **Job/IA/Build:** J1 · shell (rail collapsed, canvas max) · REDESIGN
- **Purpose:** New site opens; designer knows what to do in <5s.
- **Entry→Exit:** editor URL (no last-edit) → S1.3 new-page choice, or straight to S3.1 canvas.
- **Features:** empty-canvas CTA ("Browse templates / Start blank", `canvas/Canvas.tsx:369`); first-run coach (replaces orphan SpotlightOverlay); rail collapsed to job-group icons.
- **States:** first-run (coach visible) · coach-dismissed · empty-canvas idle.
- **Roles:** OW/AD/DE.
- **Data:** none (local); onboarding phase in localStorage.
- **Improvements:** ◆ real coach highlighting the 6 rail icons once ("start here").
- **Open:** does the coach block canvas or overlay non-modally?

### S1.2 — Returning-open
- **Job/IA/Build:** J1 · shell · EXISTS
- **Purpose:** Resume last-edited site instantly.
- **Entry→Exit:** editor URL (has draft) → S3.1 canvas.
- **Features:** last-edited restore; RecoveryManager crash/inactivity check (`engine/recovery`).
- **States:** clean-restore · **crash-recovery banner** ("restore unsaved work from 3m ago") · load-error.
- **Roles:** OW/AD/DE.
- **Data:** ProjectData via BuildrikSyncProvider (`sites.get`).
- **Improvements:** ◆ surface RecoveryManager as a real recover-banner (X7).
- **Open:** recovery UX copy + retention window.

### S1.3 — New-page choice
- **Job/IA/Build:** J1 · modal · REDESIGN
- **Purpose:** Blank vs Template vs AI-draft.
- **Entry→Exit:** S1.1 / add-page → Blank→S3.1 · Template→S3.4 · AI→S2.1.
- **Features:** 3-way choice. **Cut the fake PageWizard** (`wizard/PageWizard.tsx` simulated).
- **States:** 3-way idle · loading · error.
- **Roles:** OW/AD/DE.
- **Data:** creates page via PageManager.
- **Improvements:** ◆ route AI branch to real J2 wizard (S2.1).
- **Open:** §6.5 binary — PageWizard cut vs wire.

### S1.4 — Onboarding checklist
- **Job/IA/Build:** J1 · overlay panel · EXISTS
- **Purpose:** Guided first-run tasks.
- **Entry→Exit:** first-run auto (OnboardingMount) → deep-links into J3/J4/J5.
- **Features:** 7-step checklist, minimize-to-pill, CTA routing, AchievementPrompt toasts (4s), orchestrator SSOT (`onboarding/useOnboardingOrchestrator`).
- **States:** 0/7…7/7 · minimized-pill · dismissed.
- **Roles:** OW/AD/DE.
- **Data:** localStorage (server-persist = improvement).
- **Improvements:** • agency-flavored steps ("connect first client", "set brand", "send for review"); server-persist.
- **Open:** none.

### S1.5 — Load-error
- **Job/IA/Build:** J1 · full-screen · BUILD
- **Purpose:** Session expired / load failure → recover.
- **Entry→Exit:** load failure → sign-in / retry → S1.2.
- **Features:** error message + retry (retrySync exists in some tabs; needs a shell-level screen).
- **States:** session-expired · network-error · retrying.
- **Roles:** all.
- **Data:** auth/session.
- **Improvements:** —
- **Open:** distinguish auth-expiry vs transient net.

---

## J2 · AI-draft

### S2.1 — AI brief entry
- **Job/IA/Build:** J2 · CREATE › AI · REDESIGN
- **Purpose:** Capture a real brief (industry/pages/tone) for whole-site draft.
- **Entry→Exit:** S1.3 AI branch / rail AI → S2.2.
- **Features:** prompt/brief input, scope. (Today AITab is edit-scope; whole-site is a stub.)
- **States:** empty · typing · submit.
- **Roles:** OW/AD/DE.
- **Data:** → server AI (PageGenerator is a dead stub — must build).
- **Improvements:** ◆ brief wizard (industry→pages→tone→assets).
- **Open:** §6.5 binary — build whole-site AI vs cut.

### S2.2 — Generating
- **Job/IA/Build:** J2 · CREATE › AI (panel) · BUILD
- **Purpose:** Show real generation progress.
- **Entry→Exit:** S2.1 → S2.3.
- **Features:** progress (real, not fake); cancel.
- **States:** streaming · slow · cancel · error/quota.
- **Roles:** OW/AD/DE.
- **Data:** server AI stream (subscriptionClient exists for edit-AI).
- **Improvements:** ◆ real progress; brand-aware images (not picsum).
- **Open:** —

### S2.3 — Result & accept
- **Job/IA/Build:** J2 · canvas + AI panel · BUILD
- **Purpose:** Preview draft; accept or regenerate.
- **Entry→Exit:** S2.2 → accept→S3.1 · regenerate→S2.2.
- **Features:** preview draft, accept/regenerate.
- **States:** preview · accepted · regen.
- **Roles:** OW/AD/DE.
- **Data:** applies generated ProjectData into composer.
- **Improvements:** ◆ per-section regenerate.
- **Open:** —

### S2.4 — AI unavailable
- **Job/IA/Build:** J2 · CREATE › AI · BUILD
- **Purpose:** Honest "not configured / quota".
- **Entry→Exit:** guards S2.1.
- **Features:** no-key / quota / error states (AIError taxonomy exists, `services/ai/AIErrors`).
- **States:** no-key · quota · generic-error.
- **Roles:** OW/AD/DE.
- **Data:** —
- **Open:** —

### S2.5 — AITab chat (edit-AI)
- **Job/IA/Build:** J2 · CREATE › AI · EXISTS (hardened)
- **Purpose:** In-editor AI edit (chat + agent).
- **Entry→Exit:** ✨/⌘J/⌘K → AITab; edits apply to selection/page.
- **Features (verified):** chat/agent toggle; single-element streaming edit w/ accept/reject/regenerate diff; page-scope batch (attaches elements+tokens+assets); multi-select guard (v1=one); agent plan/steps/approve/skip/stop/auto-apply; privileged-action confirm gate; adoption tracking (`sidebar/tabs/ai/AITab.tsx`).
- **States:** idle · thinking · applied · reject · agent-plan · error.
- **Roles:** OW/AD/DE.
- **Data:** tRPC AI (AiTrpcClient, 30/60s rate-limit, 30s timeout).
- **Improvements:** ◆ ⌘K launcher; inline actions on selection ("make modern").
- **Open:** whole-site vs edit-scope boundary.

---

## J3 · Build the page (protect — 9/10)

### S3.1 — Canvas
- **Job/IA/Build:** J3 · center · EXISTS (do not disturb)
- **Purpose:** Direct-manipulation editing.
- **Entry→Exit:** always present; select→S3.9 inspector; exits to J4/J5/J6.
- **Features (verified):** drag/select/resize/rotate, 48 element types, nesting rules, inline dbl-click edit, right-click ElementContextMenu (edit/insert/layout/style/standalone), pick-mode crosshair, zoom-to-fit, aria-live selection, imperative undo/redo/getHTML/getCSS (`canvas/Canvas.tsx`).
- **States:** empty (CTA) · selected · multi-select · dragging · pick-mode · inline-edit.
- **Roles:** OW/AD/DE.
- **Data:** engine (Composer, StyleEngine).
- **Improvements:** ◆ edit-one-breakpoint-see-all live preview.
- **Open:** none — protect.

### S3.1a — Canvas overlays & viewport toolbar (part of S3.1)
- **Features (verified):** overlays — Grid, Hover(+spacing labels), Rulers, Guides, SmartGuides, SelectionBox(+resize handles), SelectionLabel, Alignment, MultiSelectBadge, RichText bar, DropFeedback, CanvasBreadcrumb, SectionReorder, RemoteCursors🔵. CanvasFooterToolbar: undo/redo, BreakpointSwitcher, toggles **Snap/Spacing/Grid/Rulers/Badges/X-Ray**, zoom, help(?), DeviceFrame. UnifiedSelectionToolbar (floating): nav-ancestors/dup/delete/copy/wrap/move/+Add/✨AI(AiPromptPopover). BlockPickerModal (insert child/before/after + nesting-validate).
- **Build:** EXISTS; **FIX** zoom ×3 (B20), cut orphan overlays (MediaQuickActions, TemplatePreviewPanel).

### S3.2 — Insert (rail)
- **Job/IA/Build:** J3 · CREATE › Insert · EXISTS (FIX)
- **Purpose:** Add elements/blocks.
- **Entry→Exit:** rail Insert → drag/click onto S3.1.
- **Features (verified):** BuildTab — **53-block** catalog (basic/layout/forms/media/navigation/interactive), exclusive-accordion, debounced search ("/"+Esc), drag+click, TipsFooter carousel, TransitionCallout (`sidebar/tabs/build`).
- **States:** category · empty-search · results · drag · disabled "Soon".
- **Roles:** OW/AD/DE.
- **Data:** build/catalog (53).
- **Improvements:** ◆ type-to-insert; recent/favorites (favorites currently DEAD — N3).
- **Open:** N2 — unify with the 63-block registry (ElementsTab/BlockPickerModal).

### S3.3 — Blocks catalog (part of Insert)
- **Features (verified):** 63-block registry (Basic11/Media9/Layout5/Forms16/Sections5/Components13/Ecommerce4), nesting-validated + sanitized insert (`blocks/blockRegistry.ts`).
- **Build:** EXISTS; **FIX** contact-form orphan (absent from registry); reconcile 53-vs-63 (N2).

### S3.4 — Templates
- **Job/IA/Build:** J3 · **DISSOLVED** — full-page templates → New-Page flow · section templates → Insert · REDESIGN
- **Purpose:** Start/insert from templates.
- **Entry→Exit:** rail Templates → apply-to-current (replace confirm + backup) or add-as-new-page → S3.1.
- **Features (verified):** 10 SITE_TEMPLATES, 4 category pills, 2 type pills + 7 sub-tags, 4-col grid + pagination + drill-in + search-highlight, token-resolution `{{token.kind.name}}` before import, apply-progress + retry, preview modal, usage drawer, applied-template persistence, "Go to page" (B4 fixed) (`sidebar/tabs/templates`).
- **States:** gallery · preview · applying · error-retry · empty.
- **Roles:** OW/AD/DE; Pro upgrade gate on premium.
- **Data:** templatesData (10) + My Templates (localStorage + templateSync server mirror).
- **Improvements:** ◆ collapse the 3 template surfaces (sidebar 10 + TemplateLibrary modal 15 + SectionTemplates) into ONE.
- **Open:** which surface becomes canonical; FullPageRouter templates branch is unreachable (N4).

### S3.5 — Components
- **Job/IA/Build:** J3 · **SPLIT** — browse+insert → Insert · management (variants/detach) → Inspector · FIX
- **Purpose:** Reusable component authoring.
- **Entry→Exit:** rail Components → drag instance / detail-screen.
- **Features (verified):** legacy ComponentsTab (grouped accordions, filter chips, search, favorites, instance counts); create-from-selection (name/group/prefill-DS); ComponentRow (drag/instantiate/rename/dup/swap-variant/favorite/delete); variant picker; ComponentDetailScreen (insert/dup/delete + instance-count warn); detach (Pro) + DetachConfirmModal (`sidebar/tabs/component-library`). ComponentsPanelV2 gated OFF.
- **States:** list · detail · instance · overridden · reset · no-storage · error.
- **Roles:** OW/AD/DE; detach = Pro.
- **Data:** ComponentManager + ComponentStorage (IDB) + componentSync.
- **Improvements:** ◆ Figma-grade variant props; instance swap.
- **Open:** **FIX reset-to-master** path-scheme (§13-A2, `ComponentInstance.ts:72` `#/` vs `:174` `/elements/`); `handleDetailInsert` no-op; "Swap" removed (no engine API).

### S3.6 — Media library
- **Job/IA/Build:** J3 · CREATE › Media · EXISTS (FIX stubs)
- **Purpose:** Manage/insert media.
- **Entry→Exit:** rail Media (slim/expanded) or fullpage LibraryManager → insert onto S3.1.
- **Features (verified):** grid + type-pills + counts + sort + multi-select + bulk delete/move; UploadZone (drag-drop, retry, quota-disable); MediaContextMenu (insert/rename/move/delete/copy-url/edit/replace-across); ImageEditorModal (crop/rotate/flip/adjust brightness-contrast-saturation-blur/6 filter presets/resize/save-as-version); OptimizationPanel (WebP/AVIF/JPEG/PNG); IconPickerModal (**370 icons/17 cat**, recent); StockSourceModal (photos/videos/icons/fonts + orientation/color filters); AssetDetailOverlay (rename/versions/used-in/replace-across); smart folders (recent/used/unused); FolderTree; storage-quota bar (**1GB enforced**) (`editor/media`, `sidebar/tabs/media`).
- **States:** grid · detail · upload · editing · optimizing · stock-search · empty · quota-full.
- **Roles:** OW/AD/DE.
- **Data:** MediaManager + MediaStorage (IDB) + AssetUploadService (Vercel Blob) + MediaVersionService + StockService.
- **Improvements:** • —
- **Open:** **FIX** From-URL modal stub (MediaLibraryPanel) vs live LibraryManager import; Trash stub; MediaLibraryPanel upload-fail unhandled (B11).

### S3.7 — Pages
- **Job/IA/Build:** J3 · STRUCTURE › Pages · EXISTS
- **Purpose:** Page management + site SEO.
- **Entry→Exit:** rail Pages → page-settings **modal (580w)** / switch page.
- **Features (verified):** page tree vs SearchListingsTable (site SEO); CRUD (add/dup/delete+undo/set-home/rename+dup-guard/copy-link); delete guards (home/only-page); bulk (shift-range dup/delete/move-to-folder); bulk-delete-all spares first (B3 fixed); folders (localStorage); PageContextMenu (6 actions); ⌘K PageCommandPalette; canSearch≥5. **page settings — a 580w MODAL, not a drawer** (`drawer-cargo-sheets.md` D-A: 580 cannot fit the 320 drawer; SEO/Social/Advanced tabs; slug validate; password-protect; custom head; autosave 500ms+⌘S) (`sidebar/tabs/pages`).
- **States:** tree · SEO-table · empty · bulk-select · folder · load-error; **page-settings modal (580w)**: SEO/Social/Advanced.
- **Roles:** OW/AD/DE.
- **Data:** PageManager + PageRouter; page meta composer-persisted → publish.
- **Improvements:** • folders server-persist.
- **Open:** password-protect + custom-head enforcement depends on publish middleware (saved-not-live).

### S3.8 — Layers
- **Job/IA/Build:** J3 · STRUCTURE › Layers · EXISTS
- **Purpose:** Tree navigation/structure.
- **Entry→Exit:** rail Layers → select→S3.1/S3.9.
- **Features (verified):** search, expand/collapse-all, display-settings, node-count; tree reorder/hover/select (LayersPanel); LayerContextMenu (Rename/Group/Lock-Unlock/Delete); DragTooltip validation; stats event (`sidebar/tabs/layers`).
- **States:** tree · filtered · locked/hidden · drag.
- **Roles:** OW/AD/DE.
- **Data:** ElementManager; hide/lock localStorage/page.
- **Improvements:** • —
- **Open:** also mirrored in footer StructurePopover.

### S3.9 — Inspector
- **Job/IA/Build:** J3 · RIGHT · REDESIGN (density 6→2)
- **Purpose:** Edit selected element.
- **Entry→Exit:** select on S3.1/S3.8 → edit.
- **Features (verified):** **no tab strip** — flattened to one scrolling column ordered per element profile (`inspector-spec.md`; the 3 Look/Layout/Effects tabs were removed); **18-section registry**, 7 element profiles (CONTAINER/TEXT/FLEX/GRID/MEDIA/BUTTON/INPUT); sections — QuickActions(4), Layout(display6/size Fixed-Fill-Hug/position5+offsets+z/overflow/visibility/float/clear), Size(W-H+spacing-token-chain/min-max/object-fit), Spacing(box-model/link-sides/gaps), Flexbox(cond), Grid(cond), Typography(cond: FontPicker+GoogleFonts/token-chain/weight9/advanced), Background(color/gradient/image/blend), Border(width/style9/color/sides/outline), CornerRadius, Effects(opacity/box-shadow7/inner-shadow/transform/transition/cursor13/filters/blend10/text-shadow/will-change), Visibility(per-bp), Link(cond), ElementProperties(15 types + data/aria), CSSClasses, AllCSS(👻 devMode-dead); reach-strip (This🔵/All-like✅ blast/Whole-site🔵); BreakpointPill; StatePills(Base/hover/focus/active/disabled); per-breakpoint+pseudo cascade; DSBindingChip(3 states); ColorInput(alpha 🔵); **BindingPopover** (bind element→CMS collection→field→record); pick-on-canvas; select-parent; overflow-menu (dup/copy-paste-styles/delete); DeleteConfirmModal; density full/fewer; per-element scroll persistence; error boundary; empty-state CTAs (`editor/inspector`).
- **States:** no-selection (CTA) · single · multi (MultiSelectToolbar align/distribute/batch) · per-breakpoint · pseudo-state · overridden.
- **Roles:** OW/AD/DE.
- **Data:** StyleEngine + designSystem.
- **Improvements:** ◆ contextual density (only relevant sections, advanced collapsed) — the 6→2 target.
- **Open:** **FIX** B14 (no memo, re-render per keystroke), B15 (link/attr keystroke-transaction undo-spam), AllCSS dead, ColorInput alpha, Background titled "Colors".

### S3.10 — Inspector › Interactions (part of Effects tab)
- **Features (verified):** add/list/edit/remove/enable interactions; **14 triggers** (element5: hover/click/active/focus/blur; page3: load/scroll/leave; scroll3: into-view/while/out; mouse3: over/move/out); **39 presets**; per-interaction preset/duration/delay/easing + preview (`inspector/sections/interactions`).
- **Build:** EXISTS; **FIX** editor-preview≠published (InteractionRuntime.reverseAnimation no-op, B9).

### S3.11 — Inspector › Animation (part of Effects tab)
- **Features (verified):** enable/disable; AnimationEditor — **25 presets** (12 entrance/8 attention/5 exit) + 7 easings + generated-CSS preview; triggers removed (`animation/AnimationEditor.tsx`).
- **Build:** EXISTS; **CUT** Timeline/ScrollTrigger L0 stubs.

### S3.12 — CMS / dynamic content
- **Job/IA/Build:** J3 · STRUCTURE › Data/CMS · COMPLETE the front-door
- **Purpose:** Data-driven content.
- **Entry→Exit:** today via ecom block-drop or inspector BindingPopover → needs discoverable rail entry.
- **Features (verified):** CollectionManager (collections/fields/items CRUD/query/validate); CMSBindingManager (bind element→field, repeaters); **CMSCollectionSetupModal** (2-step + **dynamic-page-per-entry**); **CMSRecordsModal** (record CRUD + **publish/unpublish**); BindingPopover (inspector); ProductCollectionService (`engine/cms`, `shell/modals`).
- **States:** empty · collection · fields · record-draft/published · bound.
- **Roles:** OW/AD/DE.
- **Data:** CollectionStorage (IDB) + cmsSync server mirror.
- **Improvements:** ◆ discoverable dynamic-page builder front-door.
- **Open:** RepeaterRenderer/DataBindResolver are 👻 (0 non-test importers) — wire or cut.

### S3.12b — Data binding (DataManager) — NEW surface
- **Job/IA/Build:** J3 · STRUCTURE › Data · BUILD (engine exists, no UI home)
- **Purpose:** Bind element content/style/traits to data sources + global variables + conditions.
- **Features (verified):** DataManager (data-source registry, path resolution, condition eval, contexts, global vars, watch); StyleDataBinding/TextDataBinding/TraitDataBinding; useDataManager hook (`engine/data`).
- **States:** no-source · bound · conditional · watching.
- **Roles:** OW/AD/DE.
- **Data:** DataManager registry.
- **Improvements:** ◆ give it a discoverable panel.
- **Open:** is this shipped scope or advanced/beta?

### S3.13 — Ecommerce
- **Job/IA/Build:** J3 · CREATE › Insert + modal · KEEP
- **Features (verified):** 4 product blocks (productCard/Grid/Detail/cartButton — reachable under "Advanced"); CollectionSetupModal (Products collection + 3 sample products + 8-field schema); ProductCollectionService.
- **States:** setup · sample-added · bound.
- **Build:** EXISTS (earlier "excluded" claim wrong).

### S3.14 — Command palette
- **Job/IA/Build:** J3 · overlay (⌘K) · REDESIGN (unify)
- **Purpose:** Keyboard-driven everything.
- **Entry→Exit:** ⌘K (shell) / ⌘⇧P (canvas) → run command / navigate.
- **Features (verified):** shell CommandPalette (nav from GROUPED_TABS_CONFIG + hardcoded Edit/View/History); canvas CommandPalette (~27 hardcoded, requiresSelection gating); PageCommandPalette (jump-to-page). CommandCenter has **39 registered commands** but both palettes **ignore it** (`shell/modals`, `canvas/controls`, `engine/commands`).
- **States:** closed · open · results · empty · recent.
- **Roles:** OW/AD/DE.
- **Data:** CommandCenter registry (unread).
- **Improvements:** ◆ unify 2→1, registry-backed, AI-aware.
- **Open:** **FIX** B8 (bypass CommandCenter; export-html/json unreachable); N6 (shell palette mounts twice).

### S3.15 — Preview / device / color-mode (chrome)
- **Job/IA/Build:** J3 · **canvas toolbar** (color-mode → Brand) · EXISTS
- **Features (verified):** preview ⌘P (sanitized new-window); device switch (**wide · desktop · tablet · mobile** — 4, per `BreakpointSwitcher.tsx:40`; an earlier version of this line listed a 5th `watch` device that the code has never had); color-mode cycle (light/dark/system); DeviceFrame preview.
- **States:** edit · preview · per-device.
- **Open:** footer device-dims label (1440×900) mismatches canvas wide-render (1920) — P1-5.

---

## J4 · On-brand

### S4.1 — Design tokens
- **Job/IA/Build:** J4 · BRAND › Design · EXISTS (REDESIGN density)
- **Purpose:** Edit design tokens.
- **Entry→Exit:** rail Design → token detail / add.
- **Features (verified):** **14 token kinds** (border/breakpoint/color/grid/icon/imagery/motion/opacity/radius/shadow/sizing/spacing/type/zindex); **94 default tokens**; TokensSection/Router, TokenKindCard, TokenDetailView, TokenRow, TokenUsageChip; AddTokenModal; **TokenReplaceModal** (find/replace token across usages); persistAll 14/14; global ⌘Z dirty-guard (B1 fixed) (`editor/design-system`).
- **States:** view · edit · dirty/save/discard · add · replace.
- **Roles:** OW/AD/DE.
- **Data:** TokenRegistry + versioned projectMigrations.
- **Improvements:** ◆ token usage-map + safe-rename; import-from-URL.
- **Open:** density REDESIGN.

### S4.2 — Styles / presets
- **Job/IA/Build:** J4 · BRAND › Design · EXISTS
- **Features (verified):** **18 presets / 11 categories** (button3/card2/form1/link2/badge2/alert2/tooltip1/modal1/nav1/table1/layout1); StylesSection/Router, PresetDetailPane, PresetBindingRow, BindingRow; DraftChip (`design-system/ui/sections`).
- **States:** list · bound · unbound · draft.
- **Improvements:** ◆ component-level theming; **COMPLETE** binding picker (click no-op).

### S4.3 — Starters
- **Job/IA/Build:** J4 · BRAND › Design · EXISTS (🟡 scaffolds)
- **Features (verified):** **6 starters** (cobalt-default/stripe-blue/notion-warm/apple-minimal/linear-dark/vercel-mono); StarterGalleryModal (preview+apply); no longer auto-opens.
- **States:** gallery · applied.
- **Improvements:** • starter = full brand kit (tokens+components+sample pages).

### S4.4 — DS lint
- **Job/IA/Build:** J4 · BRAND › Design · EXISTS
- **Features (verified):** DSLinter (banned/off-brand/no-black/alias-depth); DSLintBanner (dismissible); LintState (persisted suppressions).
- **States:** clean · warnings · suppressed.
- **Improvements:** • one-click auto-fix (snap off-token to nearest).

### S4.5 — Import / export
- **Job/IA/Build:** J4 · BRAND › Export · EXISTS (🟡 Figma stub)
- **Features (verified):** ExportSection 4 rows CSS/JSON/Tailwind/**Figma**; dark-strategy (media/data-attr/off); ExportDropdown; ImportCard (incl "Figma Variables JSON", darkValue fix).
- **States:** idle · exported · imported · error.
- **Improvements:** ◆ import-brand-from-URL/Figma/logo.
- **Open:** Figma export = 🔵 stub envelope — build or cut.

### S4.6 — Dark-mode preview
- **Job/IA/Build:** J4 · BRAND › Design · EXISTS
- **Features (verified):** ColorModeToggle/IconCycle (light/dark preview); DarkResolver (dark-missing detection).
- **States:** light · dark.
- **Improvements:** **COMPLETE** the inspector dark-missing warn-chip (DarkResolver UI "later phase").

### S4.7 — Cross-site brand push (NEW — 2nd wedge)
- **Job/IA/Build:** J4 · PORTFOLIO › Agency · BUILD  *(moved from BRAND › Push 2026-07-19 — see `docs/designs/2026-07-19-portfolio-wireframes.md` §4)*
- **Purpose:** Push one brand change across all client sites.
- **Entry→Exit:** PORTFOLIO › Brand push → pick source + sites → diff → blast radius → confirm → rollback.
- **Features:** NONE in-editor today (link-out only); backend `theme.*` schemas exist.
- **States:** pick-sites · diff-preview · blast-radius (N sites, M elements) · confirm · pushing · rollback.
- **Roles:** OW/AD (agency-level).
- **Data:** `theme.*` server; cross-workspace.
- **Improvements:** ★ this IS the improvement.
- **Open:** blast-radius scope; per-site opt-out; versioned rollback.

---

## J5 · Client sign-off (the wedge — build first)
> Full wireframes: `docs/designs/2026-07-18-j5-signoff-wireframes.md`. Specs condensed here.

### J5 — architecture reality (code-verified 2026-07-18) — READ FIRST

**J5 spans THREE packages, not one.** The editor-only redesign doc under-scoped it.

```
editor/ (Vite SPA)          S5.1 send-review · S5.2 status · S5.3 comments UI · S5.4 gate-error
dashboard/ (Next.js)        S5.5 CLIENT PAGE  →  app/review/[token]/   ← MISSING, must live here
server/ + prisma/           models · routers · services                ← mostly EXISTS
```
The client page **cannot** live in the Vite editor: no server routes (token must be verified server-side), multi-MB engine bundle for a one-click approve, and composer init assumes an authed session + siteId. The dashboard already ships the exact pattern at `app/share/[token]/` + `app/api/share/[token]/`.

**What already EXISTS (verified):**
| Piece | Evidence |
|---|---|
| `ReviewRequest` model — PENDING/APPROVED/CHANGES_REQUESTED, note, `changeSummary` | `prisma/schema.prisma:428` |
| `Comment` model — **pin coords x/y as 0..1 fractions + `targetSelector`**, OPEN/RESOLVED (explicitly designed for a preview-based reviewer without canvas access) | `prisma/schema.prisma:403` |
| `ShareLink` model — unique `token`, `passwordHash`, `expiresAt`, `viewCount`, `isActive` | `prisma/schema.prisma:560` |
| **`Client` model — `logoUrl`, `brandColor`, `customDomain`, `hideBuildrik`** = the ★ white-label infra already modelled | `prisma/schema.prisma:508` |
| `reviewsRouter` — submit / list / resolve | `server/trpc/routers/reviews.ts` |
| `commentsRouter` — create / list / workspaceList / resolve | `server/trpc/routers/comments.ts` |
| Agency review queue UI | `dashboard/app/dashboard/agency/(tabs)/reviews/` |
| Editor submit path | `editor/src/services/ReviewService.ts` → `reviews.submit` |
| Public tokenized route pattern | `dashboard/app/share/[token]/` |

**⚠ The real gap — what's built is INTERNAL, the wedge is EXTERNAL.**
Every review/comment procedure is `protectedProcedure` and workspace-member-scoped: `commentsRouter.create` authors with `ctx.session.user.id` after `assertSiteAccess`; `reviewsRouter.resolve` requires workspace **ADMIN**. The schema comment states the intent plainly — "a content editor sends for review; **an admin** approves." That is *staff approval*, not *client sign-off*. **Sara (no account) can neither comment nor approve today.** Note also `Client` = the client **organization** (branding container), not a person — the human reviewer is not modelled at all.

**Genuinely MISSING for the external wedge:**
1. **External reviewer identity** — `Comment.authorId` and `ReviewRequest.resolvedById` are Users. Needs a non-User path.
2. **Token → review binding** — `ShareLink` is not linked to `ReviewRequest`; no review-scoped token.
3. **Public API surface** — token-scoped `publicProcedure`s: `getReviewByToken` · `addCommentByToken` · `approveByToken` · `requestChangesByToken`.
4. **Authorization by token possession** rather than workspace role (today `resolve` = ADMIN-only).
5. **The page** — `dashboard/app/review/[token]/`.
6. **Notifications** — email on send / on approve / on changes-requested.
7. **Post-approval invalidation** — no content snapshot/hash to detect edits-since-approval.
8. **Flag** — the whole review surface sits behind the `agency_layer` feature flag; the client flow inherits it.

**RESOLVED (founder-locked 2026-07-18) → option C, hybrid.** Token grants access; on first visit capture name + email (no password, no verification loop); returning visits skip it. Attribution attaches to every comment and to the approval record (powers the ★ audit-trail). Design: client-page **State A0** in `2026-07-18-j5-signoff-wireframes.md`. Schema implication: `Comment.authorId` nullable + `authorName`/`authorEmail`; reviewer identity on `ReviewRequest`.

**The fork as considered — how is Sara identified?**
- **A · Anonymous token-scoped** — `Comment.authorId` nullable + `authorName`/`authorEmail`; approval authorized by token possession. Zero friction (matches the locked "no login" decision), but needs a schema migration and gives a weaker audit trail.
- **B · Lightweight invited client User** — Sara gets a magic-link account with a CLIENT role; every existing protected procedure and `authorId` works unchanged, full audit trail. More friction for a one-off client.
- **C · Hybrid (recommended)** — token grants access, then capture name+email on first use (Figma-style "who are you?"). Zero password friction, keeps attribution for the ★ approval audit-trail.

### S5.1 — Send-for-review
- **Job/IA/Build:** J5 · topbar (action) · FIX/BUILD
- **Features (verified):** Topbar send-for-review popover (summary+note → ReviewService.submit `reviews.submit`), clientView-gated.
- **States:** compose · sending · sent (link) · error.
- **Roles:** OW/AD/DE (submitters).
- **Data:** ReviewService → `reviews.submit`.
- **Improvements:** ◆ multi-stakeholder reviewers; deadline+reminder.
- ~~Open: link token security~~ — **settled**, `2026-07-19-system-contracts.md` §1.4: 90-day expiry · re-send issues a new token and revokes the old · manual revoke from the Review panel · one review, one site, comment+approve only.

### S5.2 — Review status
- **Job/IA/Build:** J5 · **topbar review-status pill → review bar** · BUILD
- **Features:** pending/changes/approved status; version compare.
- **States:** draft · pending · opened-not-acted · changes-requested · approved · approved-edited-since.
- **Roles:** OW/AD/DE.
- **Data:** ReviewRequest server model.
- **Improvements:** ◆ audit trail.
- **Open:** —

### S5.3 — Comments (editor)
- **Job/IA/Build:** J5 · **canvas 💬 comment mode + slide-in thread list** · BUILD
- **Features:** create/pin/resolve/thread (backend is internal/workspace-scoped only; external-client path missing — see "J5 — architecture reality").
- **States:** none · open-thread · replied · resolved · show-resolved.
- **Roles:** OW/AD/DE + CL (create).
- **Data:** comments backend (server done).
- **Improvements:** ★ threaded, @mention, filter, notify.
- **Open:** —

### S5.4 — Approval gate error-state
- **Job/IA/Build:** J5 · modal/inline · BUILD
- **Features:** publish blocked without approval → "needs approval + who + link" (today raw PRECONDITION_FAILED). Gate enforced server-side (D1, OWNER-exempt), flagged. **The gate is the approval, not the role** — a DESIGNER may publish once approved (contracts §2, decided 2026-07-19). ⚠ `sites.ts:272` is admin-only today and must change.
- **States:** pending · changes-requested · no-review-sent.
- **Roles:** OW/AD/**DE** — all blocked until approved; OW exempt from the gate.
- **Data:** publish-approval + ReviewRequest.
- **Open:** per-workspace flag rollout (S5).

### S5.5 — CLIENT review page (`/review/<token>`) — DESKTOP dedicated (L2)
- **Job/IA/Build:** J5 · public desktop surface · BUILD (#1 priority)
- **Purpose:** Non-authed client reviews + approves.
- **Entry→Exit:** tokenized link → view → comment/approve/request-changes.
- **Features:** branded bar (agency logo+version); site preview (view-only); comment pins; Approve / Request-changes.
- **States:** landing · viewing · commenting · request-changes · approved · post-approval(unchanged) · post-approval(edited-since) · expired-token · loading · load-error.
- **Roles:** CL (no account).
- **Data:** tokenized review session; comments; approval.
- **Improvements:** ★ video walkthrough · white-label · "what changed since last review".
- **Open:** — *(desktop-only is founder-locked; token model and reviewer identity are settled in `2026-07-19-system-contracts.md` §1.1–1.4: token grants access, name+email captured on first visit, identity stored against the token, no password.)*

### S5.6 — Post-approval lock
- **Job/IA/Build:** J5 · topbar/gate · BUILD
- **Features:** mark approval **stale** on post-approval edit (change-since-approval tracking) — else gate is theater. Publish stays possible behind an itemised acknowledgement; it is not revoked. Canonical: `2026-07-19-system-contracts.md` §1.5.
- **States:** approved-clean · approved-edited-since (N changes) · re-sent.
- **Roles:** OW/AD/DE.
- **Data:** change-tracking vs approved snapshot.
- **Open:** diff granularity.

---

## J6 · Ship & run

### S6.1 — Publish flow
- **Job/IA/Build:** J6 · topbar → modal · EXISTS (FIX)
- **Features (verified):** PublishDropdown (draft/published reachable; in-review/approved DEAD B18); PublishTab (status badge, published-URL+copy, **7-check** pre-publish checklist [title/favicon/≥1 page/content/SEO title/meta desc/social img], B2 fixed); Vercel BYO-OAuth publish (PublishService `sites.publish`, polls job).
- **States:** ready · connect-vercel · publishing · live · failed.
- **Roles:** OW/AD/**DE** (all gated by J5 approval; OW exempt).
- **Data:** PublishService + dashboard worker.
- **Improvements:** ◆ staging URL → real Lighthouse → preview-before-live → rollback.
- **Open:** **FIX** worker fake "Optimizing images"/"Performance" steps (no-op, lighthouseScore null); B18 dead dropdown states.

### S6.2 — Export
- **Job/IA/Build:** J6 · modal · EXISTS
- **Features (verified):** ExportModal 3 tabs (preview/code/options); formats **HTML/ZIP/React** (Vue/Next 🔵 coming-soon; JSON ambiguous); CodePreview (cssCode prop fixed); PreviewFrame; ReactExporter (dup-name fixed).
- **States:** idle · exporting · done · error.
- **Improvements:** • cut Vue/Next stubs or build.

### S6.3 — Custom domain
- **Job/IA/Build:** J6 · SETTINGS · COMPLETE
- **Features:** connect + DNS-verify (untested e2e).
- **States:** none · pending · verified · failed.
- **Improvements:** ◆ guided connect + auto DNS-verify + SSL status.

### S6.4 — Settings: General (SiteSettings)
- **Job/IA/Build:** J6 · SETTINGS · EXISTS
- **Features (verified):** site name/favicon/language, social links, legal links; composer-persisted → publish.
- **States:** view · edit · saved.
- **Roles:** OW/AD/DE.

### S6.5 — Settings: SEO
- **Job/IA/Build:** J6 · SETTINGS · FIX (score labels)
- **Features (verified):** twitter handle, default OG image (site-level); composer-persisted.
- **Improvements:** ◆ SEO score labels → live earned points.

### S6.6 — Settings: Analytics + Custom-code
- **Job/IA/Build:** J6 · SETTINGS · EXISTS (N1 gate-bug)
- **Features (verified):** Analytics (GA4 regex-validated/Meta Pixel/cookie banner → injected on publish); Advanced/Custom-code (head/body scripts + global CSS, validated, sanitized).
- **Open:** **FIX N1** — custom-code plan-gate no-op (id mismatch `custom-code` vs `advanced`).

### S6.7 — Settings: Redirects / Headers / Localization
- **Job/IA/Build:** J6 · SETTINGS · FIX (saved-not-live)
- **Features (verified):** Redirects (301/302, toUrl validated B12); Headers (CSP/HSTS/X-Frame/Referrer/Permissions); Localization (default+enabled locales, 24 common). All persist, **not enforced live** (self-declare via banner).
- **States:** saved · beta-label (not live).
- **Improvements:** ◆ enforce on live (publish middleware) or honest beta-label.

### S6.8 — Settings: Forms inbox
- **Job/IA/Build:** J6 · SETTINGS · EXISTS
- **Features (verified):** submissions inbox (form picker, inbox/unread/spam/archived filters, read/spam/archive/delete, pagination, **CSV export**), server-backed (formsRouter).
- **States:** empty · list · filtered · exported.
- **Improvements:** ◆ notifications + spam-guard + Slack/webhook integrations.
- **Open:** editor-preview submissions in-memory (published uses real endpoint).

### S6.9 — Settings: Integrations + Locked
- **Job/IA/Build:** J6 · SETTINGS · CUT dead cards / KEEP Locked
- **Features (verified):** IntegrationsHub (Analytics+IntegrationsScreen+Advanced, Pro-gated); IntegrationsScreen 6 cards (Formspree/Netlify/Stripe/Mailchimp/ConvertKit/Zapier) all "Coming Soon" + docs link 🔵; LockedScreen (pro/enterprise/coming-soon + waitlist).
- **Improvements:** CUT the 6 dead cards; KEEP LockedScreen (X1).

---

## Chrome (cross-cutting surfaces — actions/status, not job screens)

### C1 — Topbar
- **Build:** EXISTS. **Features (verified):** brand→dashboard · Exit · Issues-pill · collab-slot🔒 · offline-pill · status-pill(Saved/Saving/Unsaved+click-save) · freshness-ticker · ✨AI (**E3-mode-only, hidden in default figma mode**) · Preview⌘P · Send-for-review · PublishDropdown · Export-fallback🔒 · color-mode-cycle · ⌘K · ⋯overflow[Design-system·Site-settings(ProjectSettingsModal)·Version-history·Invite·Command-palette·Preview-as-client·Help·Account].
- **TARGET (§4.3) — topbar becomes GLOBAL-only, 7 items:** `‹Exit · site name` · **save-status pill → opens Versions → Compare/diff** (absorbs the offline pill) · **review-status pill → expands into the review bar while a review is active** · **[ Send for review ] / [ Publish ]** → publish-progress modal · **notification bell → 360w panel** (`floating-panels-spec.md` §6) · `⋯` (Site full-page · preview-as-client · invite · Help+checklist/coach replay · ⌘K · account). A one-time **recovery banner** sits directly beneath it.
- **MOVED OFF the topbar → canvas toolbar:** undo/redo · device/breakpoint switcher · preview ⌘P · 💬 comment-mode. **→ Brand panel:** color-mode. **→ footer:** issues pill (opens an issues panel). **→ Site page:** design-system/site-settings/version-history overflow rows.
- **FIX:** ✨AI is hidden in the default figma rail mode — retire the E3/legacy rail modes and move AI to ⌘K + the canvas selection toolbar (no topbar icon, no rail slot).

### C2 — Footer (StudioFooter)
- **Build:** EXISTS (FIX). **Features (verified):** Structure ⌗ (**E3-only, hidden default**) · sync-pill "Connected·main" (branch static🟡) · breadcrumb 2-level · device-dims (1440×900 vs canvas 1920 mismatch🟡) · zoom (3rd impl B20) · version "v2.14.0" hardcoded🔵.
- **TARGET (§4.3) — footer becomes a status strip only:** issues pill → **issues panel** (errors · warnings · a11y) · sync status · breadcrumb. **Zoom and view-options move to the canvas toolbar**; the **Structure ⌗ popover is CUT** (it duplicated the Layers rail item).
- **FIX:** static "main" sync label, zoom implemented 3× (B20), hardcoded "v2.14.0", device-dims 1440×900 vs canvas 1920 mismatch.

### C3 — PageTabBar (multi-page tabs)
- **Build:** EXISTS. **Features (verified):** page tabs (active/home🏠/dirty-dot) · add-page · inline rename F2+slug · context (rename/dup/set-home/delete) · home-delete-guard · delete-confirm+undo · keyboard nav.
- A real multi-page navigation surface above the canvas.

### C4 — ProjectSettingsModal (chrome ⋯)
- **Build:** EXISTS · **REDESIGN (design-review):** de-dup vs SETTINGS. **Features (verified):** General / Canvas (grid+snap) / SEO tabs → composer metadata/settings.
- **Fix:** General + SEO **duplicate** the Settings tab's SiteSettings/SEO screens (two settings homes). Keep only **Canvas (grid/snap)** here (editor prefs); route General/SEO to SETTINGS. Nav-hierarchy: one home per settings concern.

### C5 — ConflictModal (save state)
- **Build:** EXISTS. **Features (verified):** Reload / Save-backup / Overwrite(confirm) on SAVE_CONFLICT_EVENT. NOTE: P1-2 spurious-conflict for solo user (BuildrikSyncProvider save-race).

### C6 — Recovery banner (NEW)
- **Build:** BUILD (engine RecoveryManager exists). Restore-unsaved-work on reopen (X7).

### C7 — Keyboard shortcuts panel + Canvas cheat-sheet
- **Build:** EXISTS (FIX B5 — `?` opens BOTH; unify).

---

## Engine / invisible (no screen — infra, listed for completeness)
Composer + ~30 managers · History (undo/redo/time-travel/checkpoints) · VersionTimeline (named versions/compare/export) · Selection · Viewport · **FontManager** (system/Google/custom-upload/favorites) · **RecoveryManager** · **DataManager** (data-binding subsystem) · **PluginManager** (🔒 flag-dead) · AliasResolver · DarkResolver · StyleEngine/GlobalStyleManager · MediaManager · CollectionManager/CMSBindingManager · InteractionManager/Runtime (B9/B10) · export injectors (SEO/Sitemap/Analytics/Stripe/Formspree/sanitizeHeadCode) · StorageAdapter/VersionHistoryStorage · MigrationManager · PageRouter · commands (CommandCenter 39 cmds, B8) · sanitize SSOT (DOMPurify).
**Dead engine dirs (cut):** engine/history StateReconstructor · engine/templates (TemplateManager) · engine/ai generators · engine/integrations (EmailMarketingService) · cms/RepeaterRenderer+DataBindResolver · data/TemplateEngine.

---

## Screen count (this chapter)
J1=5 · J2=5 · J3=17 (incl. S3.1a/S3.12b) · J4=7 · J5=6 · J6=9 · Chrome=7 = **56 specs**. Net-new build (from scratch): S1.5, S2.1-2.4, S3.12b, S4.7, S5.2-5.6, C6 = **~14**; of which **6 = J5 wedge** (build first).
