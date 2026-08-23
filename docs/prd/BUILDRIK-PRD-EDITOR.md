# Buildrik — PRD: Editor (M5)

| | |
|---|---|
| **Version** | 3.0 |
| **Date** | 2026-07-08 (v2.0: 2026-07-07 · v1.0: 2026-07-06) |
| **Source** | Reverse-engineered — `main` @ `e5624ca1`. v1.0: 3 parallel scans. v2.0: **10 deep per-module scans** (~2.1M tokens). v3.0: 7 fresh cross-verify scans + **flows volume** (Ch.11) + **master feature catalog** (Ch.12). |
| **Method** | Nothing invented; uncertainty `[TBC]`. Citations `file:line` (`PKG` = `packages/editor/src`). |

## Module chapters (v2.0 — deep dives, one file per module)

| Ch | Scope | File |
|---|---|---|
| 01 | Shell, Topbar, Footer, Panels, Layers, Versions, Onboarding | [editor/01-shell-rail-panels.md](./editor/01-shell-rail-panels.md) |
| 02 | Sidebar rail + 11 tabs (Pages/Settings/Publish/History/AI/Insert/Media/Components/Templates) | [editor/02-sidebar.md](./editor/02-sidebar.md) |
| 03 | Inspector (18 sections, 7 profiles, edit-propagation contract) | [editor/03-inspector.md](./editor/03-inspector.md) |
| 04 | Canvas (selection/drag/resize/inline-edit/snapping/keyboard) | [editor/04-canvas.md](./editor/04-canvas.md) |
| 05 | Engine (document model, history, transactions, styling, storage) | [editor/05-engine.md](./editor/05-engine.md) |
| 06 | Design system, components catalog, themes, DSLinter | [editor/06-design-system-catalog.md](./editor/06-design-system-catalog.md) |
| 07 | Blocks (63) & Templates (18+11) | [editor/07-blocks-templates.md](./editor/07-blocks-templates.md) |
| 08 | Media, Export, Preview | [editor/08-media-export-preview.md](./editor/08-media-export-preview.md) |
| 09 | AI surfaces, Services layer, Wizard/Collab/Ecommerce/Animation | [editor/09-ai-services-misc.md](./editor/09-ai-services-misc.md) |
| 10 | Server API, publish/AI pipelines, plan rules, Prisma | [editor/10-server-api-data.md](./editor/10-server-api-data.md) |
| 11 | **Flows** — 8 app flows, 12 user flows, 35 feature flows, dead-end map (v3.0) | [editor/11-flows.md](./editor/11-flows.md) |
| 12 | **Master feature catalog** — every feature × status × backend × evidence + counts + new drift (v3.0) | [editor/12-feature-catalog.md](./editor/12-feature-catalog.md) |

---

## 1–2. Executive summary

The editor is Buildrik's core product: a Vite-based visual site builder (`AquibraStudio`) with ~60 insertable blocks, a 3-tab inspector, a component/instance system, design tokens, AI editing (chat + agent + edit-command batches), versioning, and a Vercel publish pipeline. It is far more built than most docs assume — and its docs are its biggest liability: **three authoritative documents disagree about what works** (override-on-sync, interaction counts, edit-scope picker).

**The single biggest risk:** *governance features exist on the server but don't govern.* `Workspace.editsRequireApproval` is saved by settings but **never read in the publish path** — the entire client-review workflow is advisory; any ADMIN publishes regardless (`grep editsRequireApproval server/ → zero enforcement`). Same pattern client-side: the inspector's "reset to master / is-overridden" affordances are **non-functional** because two override path-schemes never match (`ComponentInstance.ts:257-278` builds `/elements/…` paths against stored `#/…` paths). The product's trust features — approval, override control — are the least trustworthy parts.

## 3. Users & jobs

| User | Entry | Job |
|---|---|---|
| Agency designer (OWNER/ADMIN/DESIGNER) | dashboard "Edit site" → `/edit/:id` (needs `NEXT_PUBLIC_UNIFIED_EDITOR=true`, else dead legacy demo — CLAUDE.md env table) | Build/style pages fast, push brand, publish |
| Owner in view mode | `?view=readonly` → read-only, chrome-less (`editorViewMode.ts`) | Look at the draft with the editor out of the way. NOTE: this row read "Invited content editor" until 2026-08-23; nothing ever routed an invited member here, and the mode grants no editing at all now. |
| Workspace admin | topbar publish / review resolve | Gate quality: review, approve, publish |
| Client (external) | ShareLink preview (server model exists `schema.prisma:522`) | View + approve — **no editor surface** |

## 4. Success metrics *(proposed — partially instrumented)*

Analytics reality: **AI adoption IS instrumented** (`ai.logAdoption` → `AiAdoptionEvent`, fire-and-forget `routers/ai.ts`); general product funnel is NOT (no PostHog/Segment/etc.). The accept/reject diff UI (`AITab.tsx:126-157`) is a ready-made signal nobody aggregates.

| Metric | Definition | Target |
|---|---|---|
| Time-to-first-edit | editor open → first applied change | ≤2 min (spec's own activation bar, onboarding spec L12) |
| AI edit acceptance | accepted ÷ (accepted+rejected) edit batches | ≥60% — instrument from existing diff UI |
| Publish success | publish jobs COMPLETED ÷ started | ≥95% |
| Save-conflict rate | ConflictModal shown ÷ sessions | <2% |
| Override integrity | instance syncs with `overridesDropped=0` ÷ syncs | ≥99% (event already emitted: `INSTANCE_SYNCED`, `ComponentInstances.ts:266-274`) |
| Version restores | restores ÷ active site-week | baseline TBD (signal of trust in undo/versions) |
| Quota-hit → upgrade | UpgradeModal shown → billing visit | ≥20% |

## 5. User journeys (as built)

- **J1 build:** open editor → 4-tool rail (insert/pages/styles/site, `tabsConfig.ts:299-306`) → click-to-add or drag block (`useBlockInsertion.ts`) → style via inspector (3 tabs, per-breakpoint + pseudo-states) → autosave 5s debounce (`BuildrikSyncProvider.ts:494`).
- **J2 AI edit:** AITab → scope element/page → chat or agent plan (max 8 steps) → streamed edit-command batch → accept/reject diff → applied in one transaction. Quota 403 → UpgradeModal → `/dashboard/billing`.
- **J3 componentize:** save-as-component → instantiate → per-instance overrides (`#/` position paths) → master edit → sync re-applies overrides (F1a shipped; reorder survival F1b deferred).
- **J4 version rescue:** HistoryTab → Time-Travel scrubber → preview banner → restore (client-side from server-mirrored snapshot; 50/site cap `site-version.service.ts:13`).
- **J5 publish:** topbar Publish (flag `VITE_FEATURE_PUBLISH`) → prePublishChecks → ADMIN-only `sites.publish` → job QUEUED→BUILDING→DEPLOYING→COMPLETED, 2s poll → publishedUrl. Review flow exists but **cannot block this** (§13-A1).
- **J6 client review (broken loop):** EDITOR submits review → ADMIN emails → resolve APPROVED/CHANGES_REQUESTED — but publish never checks it, and the external client (ShareLink) is not part of it.

## 6. Functional requirements (per surface, condensed)

**Shell** (`AquibraStudio.tsx:603-611`): topbar (undo/redo, device toggles, preview, publish dropdown) · rail 4-tool default, `?rail=legacy` escape (11 tabs: add/ai/templates/assets/layers/pages/components/design/settings/publish/history, widths locked 280/320, `tabsConfig.ts:63-247`) · canvas · inspector (280px) · footer (sync pill, breadcrumb, zoom, structure ⌗).
**Elements:** ~50 types (`element.ts:69-119`), ~60 registry blocks incl. 16 form controls + ecommerce (`blockRegistry.ts:96-174`). Click-to-add with smart-parent walk-up + nesting-error toasts (`useBlockInsertion.ts:66-165`); drag-drop with snap guides + touch + keyboard move. Multi-select with mixed-value detection (`ProInspector.tsx:155-191`).
**Inspector:** 3 tabs (Style/Element/Effects), registry SSOT (`registry/index.tsx:56-65`); per-breakpoint + pseudo-state overrides w/ indicators; density `fewer` = first 3 sections + "show full controls" (`InspectorTabContent.tsx:174-230`). Defect: AllCSS section dead code (`devMode===false` hardcoded, not Pro-gated — `ProInspector.tsx:95`, complete-feature-list L94).
**Pages:** JSON block tree per page (`Page.blocks`, sanitized on write `page.service.ts:110`); per-locale translations; slug auto-collision `-${Date.now()}`; plan gate `pagesPerSite`; no per-page publish status (site-level only); optimistic-concurrency via `updatedAt` → CONFLICT.
**Design tokens:** 15 kinds, applied as CSS vars, dark-resolver aware (`TokenRegistryContext.tsx:157-192`). **Defect: `persistAll` persists only 3 of 15 kinds** — radius/shadow/motion/etc. lost on reload (`:198-202`).
**AI:** two parallel entry surfaces — AITab (tRPC streaming, model picker: opus/sonnet/haiku/gpt-4o-mini, server-authoritative tier gating) and AIAssistantBar (legacy path via `shared/utils/openai`, dark-glass styling violating DESIGN.md light mandate `AIAssistantBar.tsx:179`). Edit commands: 14 types incl. set-token, set-style-variant, add-section (≤12 children), propose-action (`ai.service.ts:706`). Privileged action = only `site.publish`, always behind explicit ConfirmDialog + single-use 5-min token (`useAiActionGate.ts`, `action-confirmation.service`).
**Save/versions:** autosave 5s debounce, empty-project data-loss guard, conflict modal w/ backup download; undo depth 100 (`config.ts:108`); versions mirrored to server, cap 50/site, restore client-side.
**Publish:** ADMIN-only; payload caps 2MB/page, 16MB, 500 pages (`schemas/publish.ts:12-18`); Vercel via per-workspace OAuth; prod-without-pages honesty guard; 1 active job/site; stale cutoffs 5/15 min.
**Media:** user-owned (not workspace-scoped — asymmetric by design, `media.service.ts:24-31`); storage quota gate + 80% warn; asset versions cap 5/25/100 auto-prune; AI alt-text (Claude Haiku, never overwrites user text, TOCTOU-guarded `alt-text.service.ts:141-156`); stock = Unsplash + Pexels server-proxied.
**Collab:** engine exists (OT, presence, cursors, locks over SSE) but **flag-off, demo-only, "6 known non-convergence P1s"** (`runtimeEnv.ts:60-64`). Server op-log: 1.5s poll, 24h retention — latency = poll, not realtime.
**Comments:** full server surface (create incl. VIEWER, list, workspace triage, resolve — `routers/comments.ts`) with pin coordinates — **zero editor UI** (client grep empty). Backend built, front door missing `[TBC where UI was planned]`.

## 7. State machines

| Machine | States | Notes |
|---|---|---|
| Site.status | DRAFT → PUBLISHING → PUBLISHED (→DRAFT unpublish) | String col, site-level only |
| PublishBuildJob | QUEUED → BUILDING → DEPLOYING → COMPLETED \| FAILED \| CANCELLED | terminal clears raw HTML `log` |
| ReviewRequest | PENDING → APPROVED \| CHANGES_REQUESTED | 1 PENDING/site; **gates nothing** |
| Comment | OPEN ⇄ RESOLVED | flat, no threading |
| AIGenerationJob | QUEUED → GENERATING_* → … \| CANCELLED | cancellable pre-terminal |
| Publish uiState (client) | idle→publishing→published\|failed\|cancelled | 2s poll (`usePublishJob.ts`) |
| ComponentInstance | synced ⇄ stale (version-gated) → detached | overridesPreserved/Dropped emitted |

## 8. Business & plan rules (master)

**Plan-gated** (`lib/constants/plan-limits.ts`, FREE/PRO/BUSINESS): sites 3/15/50 · pagesPerSite 10/30/50 · domains 0/3/20 · team 1/5/25 · storageMB 500/5120/51200 · fileUploadMaxMB 10/50/200 **(defined but unwired — presign uses fixed per-context caps, §13-A5)** · AI gens/mo 3/20/∞ · AI prompts/day 10/200/∞ · form subs 100/2500/∞ · redirects 100/500/∞ · integrations 0/2/∞ · analytics retention 7/30/90d · share-link expiry 7/30/90d · share-link passwords ✗/✓/✓ · asset versions 5/25/100 · template versions ∞ (all — enforced nowhere, dead).

**Hard-coded:** autosave debounce 5s · undo depth 100 · site versions 50/site · theme snapshots 10/site · publish poll 2s · publish payload 2MB/16MB/500p · stale job 5/15min · worker 300s · collab poll 1.5s, retention 24h, batch 200 · upload TTL 10min; per-context MB (site_media 50, avatar 5, favicon 0.5, og 2, ticket 10) · AI plan steps ≤8 · page-edit caps: 200 elements / 120 tokens / 100 assets · add-section ≤12 children · action-confirm TTL 5min · actions rate 20/60s · AI hourly anti-abuse 3/hr · quota reset midnight UTC.

## 9. API surface (condensed)

pages (8) · sites (publish family 5) · media (16: folders/assets/versions/quota/alt-text/stock) · upload (presign/confirm/limits) · ai (content/page/layout/summarize/milestone/quota/streamPrompt-subscription/componentSchema/logAdoption) · actions (propose/confirm, 20/60s) · theme (9, `agency_layer`-flagged + ADMIN) · reviews (3) · comments (4) · siteVersions (4) · siteComponents (6) · userTemplates (3). Non-tRPC: collab ops POST + SSE, publish worker, cron cleanups. Guards: `guardSiteEditor`(EDITOR) writes / `guardSiteAccess`(any member) reads; publish/theme = ADMIN; media = **user-owned only**. Full tables: server-side scan (§A of the map).

## 10. Enums

Element types (~50) · blocks (~60) · AI models `claude-opus-4-7 / claude-sonnet-4-6 (default) / claude-haiku-4-5 / gpt-4o-mini / ollama` (tier defaults haiku/sonnet/opus) · edit-commands (14) · rail tools (4) + tabs (11) · density `full/fewer` · devices desktop/tablet/mobile · publish/job/review/comment enums (§7) — all String columns, no DB enums.

## 11. Non-functional

- **Security:** server-side edit-command validation gate (style/attr allow-lists, unsafe-value regex, exact-id) `ai.service.ts` · DOMPurify = sanitize SSOT · privileged actions single-use tokens, role re-checked at execute · OAuth tokens AES-256-GCM.
- **Resilience:** atomic quota reserve/release · empty-project save guard · idempotent version mirror · publish honesty guard · alt-text TOCTOU guard.
- **Debt:** override path-scheme split (§13-A2) · token persist gap (§13-A3) · dual AI surfaces + DESIGN.md violation (§13-B) · dead root `src/editor/` copy · ~25 TODO/deprecated markers.

## 12. Spec-vs-built delta

Docs corpus: 14 specs/audits/plans (inventory in specs-map). The 10 truths:

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Override-on-sync | **Partial; 3 docs disagree.** Style+attr survive (F1a `00eaa131`); content/trait disputed (complete-feature-list L92 🔴 vs design-reconciliation 07-02 "all 4 survive"); reset/is-overridden UI dead either way (path mismatch) | `ComponentInstances.ts:242`, `ComponentInstance.ts:257-278` |
| 2 | Edit-scope picker (element↔master) | **NOT built** — complete-feature-list ✅ is stale; only AI ScopeChip exists | 07-02 reconcile L17 |
| 3 | Inline-AI rewrite/tone bar | NOT built (alt-text leg only; RichTextEditor has zero AI actions) | 07-02 L18 |
| 4 | Custom CSS Pro-gating | Dead code — `devMode===false` never renders; not Pro-gated | `ProInspector.tsx:95` |
| 5 | Unified ⌘K | Target; live = 2-3 fragmented palettes | editor-wireframe §29 L1004 |
| 6 | CMS front-door + per-record publish | Target; dynamic pages unreachable via UI alone; `cms.dynamicPages` router orphan | editor-wireframe §10, feature-list L517 |
| 7 | DS-push / component-browser / blast-radius | Backend shipped (`69fe715f`,`c6ae723f`); **UI unverified/remaining** | 5-features L204 |
| 8 | Topbar-slim + inspector 6→2 levels | ux-audit targets, open (G-1, G-3, D-1 High) | ux-audit-20260621 L107-125 |
| 9 | Interaction triggers | Count disputed: 7 (wireframe §5, feature-list) vs 13 (07-02 reconcile, `InteractionRuntime.ts:164-253`) | unresolved |
| 10 | "Dark-only" token/layers plans | Stale — light flip 2026-04-18 (CLAUDE.md); plans predate it | design-token plan L46 |

Also: F1b slotKey deferred · templates 3→1 collapse "won't do" · seed-gallery claim contradicted by feature-list ("seeds none") · sections-mode icon grid unverified.

## 13. Gaps & decisions register

**A — broken/dead in code (8):**
A1 **`editsRequireApproval` saved but never enforced** — review flow gates nothing (migration exists, zero server reads) · A2 **override reset/is-overridden non-functional** (path-scheme mismatch `#/` vs `/elements/`) + `syncToMaster` stub (`ComponentInstance.ts:295-338`) · A3 `persistAll` drops 12/15 token kinds (`TokenRegistryContext.tsx:198-202`) · A4 comments backend complete, editor UI absent · A5 `fileUploadMaxMB` plan limit unwired at presign · A6 dead root `src/editor/` (3 stale files) + AllCSS dead code + ComponentsPanelV2 AI stub (`:158`) · A7 `ai.getQuotaStatus` orphan (0 editor consumers) + AI-site-generation stub ("no AI branch → blank site") · A8 `templateVersionsCap` + `TemplateVersion` model dead.

**B — product decisions (7):**
B1 approval gate: enforce at publish (block unless APPROVED when flag on) ya setting delete karo — half-built trust feature worst option · B2 dual AI surfaces: AITab vs AIAssistantBar consolidate (Bar = legacy path + dark-glass DESIGN.md violation) · B3 collab: flag-off demo w/ 6 P1s — invest (real WS/convergence) or cut from marketing · B4 comments: build editor UI (server ready) or descope · B5 media user-owned vs workspace-scoped — multi-workspace quota ambiguity (`media.service.ts:24-31`) · B6 interaction-count dispute resolve (7 vs 13) — one doc must win · B7 `ai.summarize`/`milestoneSuggest` quota-free — cap or accept.

**C — security (2):** C1 review-approval bypass is also an authz statement (any ADMIN publishes even when workspace demands review) · C2 AllCSS raw-CSS editor must stay dead until Pro-gate + sanitize review.

**D — spec-only (from §12):** edit-scope picker · inline-AI bar · unified ⌘K · CMS front-door · topbar-slim · inspector collapse · F1b slotKey · PanelShell system (ux-audit root cause: "the founder's 'AI-designed' feeling, located" — L117,131).

**E — design↔code drift:** AIAssistantBar dark glassmorphism vs light-theme mandate · `--ls-*` indigo remnants (layers plan) vs cobalt-only rule · stale dark-only plans · Figma M5 page vs built editor not diffed this pass `[TBC]`.

## 13b. v2.0 register addendum (new findings from deep scan — chapter cites inside)

**A — broken/dead (new):** A9 DEPLOYING publish status declared everywhere, written nowhere (Ch.10) · A10 `listSitesSchema` omits PUBLISHING — mid-publish sites unfilterable (Ch.10) · A11 AI site-gen + `ai.page` hardcode gpt-4o-mini, bypassing PLAN_MODELS tiers — paid model quality unenforced on those paths (Ch.10) · A12 AI-gen job stranding: fire-and-forget dispatch, no reaper (Ch.10) · A13 dual conflicting arrow-key handlers on canvas (Ch.04) · A14 `contact-form` block exported but unregistered — unreachable (Ch.07) · A15 duplicate token IDs in DEFAULT_TOKENS (radius/shadow sm+md ×2) (Ch.06) · A16 EmailService cloud providers throw (route unimplemented); FormSubmissionService in-memory only (Ch.09) · A17 image-gen + streaming fake in openai facade; PageWizard "AI" simulated, inputs discarded (Ch.09) · A18 WelcomeModal + SpotlightOverlay orphans — spotlight ids carried by steps, nothing consumes (Ch.01) · A19 useAdvancedSettings value-auto-expand dead for kebab keys (Ch.03) · A20 publish worker MVP no-op steps shown as completed; lighthouseScore always null (Ch.10).

**B — product decisions (new):** B8 Redirects/Headers/Localization saved-but-unenforced with "not yet live" banners — ship enforcement or label beta (Ch.02) · B9 two responsive query sets (1023/767 vs 991/575) + two nesting caps (50/30) + two token taxonomies (9/14) — pick one each (Ch.05) · B10 ~~SEO score UI labels contradict algorithm (+10/+40 shown, +20/none real)~~ — **RESOLVED 2026-08-23**: the labels now mirror `calculateSeoScore`'s real max weights (title 30 / desc 40 / slug 30, indexing an all-or-nothing gate). Walking it turned up a different, live defect in the same panel, fixed in `ea33fe24`: the checklist advertised "+30 pts" for a clean slug while the score paid 20, because the rule was the literal `slug !== "page-1"` — it caught a new project's first page (`createPage("Page 1")` → `page-1`) and let every later `page-N` the app generates through. Measured live: dot green over 20 paid, now grey (Ch.02) · B11 brand-name chaos ×5 (Aquibra/aquibra.io/buildrick/buildrik/dudo) across UI copy, storage keys, help links, export title — user-visible in exports and help links (Ch.02/05/07/08) · B12 RESOLVED 2026-08-23 — the mode was renamed `?view=readonly` / "view mode" because it was never a client's surface; the tokenized links that are (`/share/<token>`, `/review/<token>`) both exist and the site menu's "Share preview link" opens the first · B13 summarize/milestoneSuggest quota-free (= v1.0 B7, now with exact cites) · B14 feature flags COLLABORATION/PLUGINS/VERSION_HISTORY=false contradict shipped code (Ch.05).

**C — security (new):** C3 EmailService custom template renders caller HTML unescaped (Ch.09) · C4 collab ops route trusts client clientId/op JSON — spoofable (Ch.05, production-blocked anyway) · C5 upload onUploadCompleted never throws → quota-exceeded silently logs, orphan blobs possible (Ch.10).

**E — drift (new):** hero attributes schema omits overlay props; two CSS-var prefixes inside blocks; footer year hardcoded 2024; publish target copy `buildrik.app` vs slug preview `aquibra.io` (Ch.07/02).

## 14. Release readiness

**Must-fix (trust core):** A1/B1 approval-gate decision + enforcement · A2 override path unification (revenue-trust-plan already scoped it as a real arc; until fixed, "reset to master" lies to users) · A3 token persistence (users lose 12 kinds of design decisions on reload — silent data loss).
**Should-fix:** B2 AI consolidation + E theme violation · A4/B4 comments decision · A5 plan-limit wiring · §12 doc reconciliation (one truth doc; complete-feature-list has 2 known-stale rows).
**Can-ship:** current build/style/save/version/publish core — it is genuinely solid (validation gates, honesty guards, atomic quotas, conflict UX are senior-grade).
**Open questions:** 1) Is client-facing review (ShareLink approval) the intended M6 wedge? Server pieces exist disconnected. 2) Collab investment vs cut — 6 P1s is a rewrite, not a polish. 3) Who owns doc-truth reconciliation cadence? Three SSOTs drifting is how #2-style stale-✅ rows happen.

---
*Companion PRDs: `BUILDRIK-PRD-COMPLETE.md` (M1 auth + M2 onboarding) · billing PRD in chat log 2026-07-06. Scan maps: 3 agent reports (client/server/specs), session 2026-07-06.*
