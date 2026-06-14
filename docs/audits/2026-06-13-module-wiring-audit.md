# Buildrik — Module-by-Module Wiring Audit (2026-06-13)

8 parallel specialist agents traced every interactive UI → router/handler → service → model across editor + dashboard. Only confirmed gaps (read-verified). Intentional "coming soon" / demo-only / documented-deferral items excluded. Status: [ ] open · [x] fixed · [~] partial · [def] deferred (wire-or-delete decision).

## Batch H — NEW critical finding (surfaced during deferred-feature build)
- [x] **H1 (P0/P1) Publish path emitted style-less HTML — FIXED.** The multi-page publish path used by Vercel (`exportPublishPages` → `ExportEngine.exportAllPages` → `renderPageElement`) emitted each element from `element.attributes` ONLY — dropping `element.styles` (inline base styles), `element.classes`, AND `data-buildrick-id`. Empirically verified a styled page exported HTML with no `class=`/`style=`/`data-buildrick-id` → deployed sites rendered structurally but **unstyled** (base styling gone; the styles.css breakpoint rules keyed `[data-buildrick-id]` matched nothing). Fix: `renderPageElement` now emits `data-buildrick-id` + `class` (from element.classes) + inline base `style` (from element.styles), so published elements carry their base styling and the breakpoint rules can match. Covered by a new regression test (`H1`). **Cascade refinement SHIPPED 2026-06-14 (was the documented follow-up):** publish base styles are now CLASS-based (`.buildrick-<id>{…}` via new `buildPublishBaseCss`), NOT inline — so they share specificity (0,0,1,0) with the `@media [data-buildrick-id]` breakpoint rules and the override wins by source order (base emitted first). renderPageElement now emits `class` + `data-buildrick-id` and NO inline style. **Real-browser-proven (Chromium):** desktop → base renders (box red, heading 32px); mobile (375px) → the @media override WINS (box blue) and per-breakpoint hide works (promo display:none). The remaining gap vs done is only the actual Vercel deploy pipeline (creds-gated) — the CSS/cascade/render is proven locally. The single-page/ZIP path (`elementToHTML` + `extractStyles`) was already class-based and unaffected. Found + fixed 2026-06-14 while building C2/D1.

## Batch A — Editor persistence (DATA-LOSS, P0/P1)
- [x] A1 Manual Save + Cmd+S persist to localStorage only, fake "Saved" toast — useSaveCallback.ts:62 → route through dashboard saveProject
- [x] A2 Undo/redo + version-restore never auto-persist (autosave only on project:changed) — useComposerInit autosave must also fire on history:undo/redo/version:restored

## Batch B — Editor wiring (P1)
- [x] B1 Publish state machines UNIFIED (deferred-build #6). The sidebar PublishTab now subscribes to the ONE canonical `usePublishJob` instance the Topbar drives, instead of its own dead host-callback machine. Threaded `publishJob` + `onVercelPublish` (= the Topbar's `handleVercelPublish`) AquibraStudio → StudioPanels → LeftSidebar → TabRouter → PublishTab; the sidebar reads `uiState/progress/publishedUrl/error` and fires the same handler. Toast stays single-source (useExportHandlers), the hook's re-entrancy guard blocks double-publish, and the action is gated on the same `isFeatureEnabled("publish")` flag as the Topbar dropdown. Deleted the dead `usePublish` hook (147 LOC) + its barrel exports + the host-callback `onPublish`/`onUnpublish` prop chain. (Unpublish dropped — no canonical equivalent; was never wired.) Tests: rewrote PublishTab.test for the new state-subscriber contract (fires handler / reflects publishing / shows published URL); shell+sidebar 1150 green, export 70, media 314.
- [x] B2 Settings tab hardcoded userPlan="starter" → Custom-code/Integrations locked for all — thread real plan
- [x] B3 IntegrationsHub children miss registerFlushHandler → GA/pixel/head/body dropped on save
- [x] B4 Media drag-to-canvas broken — AssetCell sets wrong MIME; use setMediaDragData SSOT (+ LibraryView cards)
- [x] B5 Pages drag-to-reorder advertised but never calls reorderPage — wired drop target → composer.elements.reorderPage
- [x] B6 Components row-menu Duplicate FAKE (manual-instructions modal) — call composer.components.duplicateComponent
- [x] B7 Component detail Swap button FAKE (toast only) — removed dead Swap control + handler

## Batch C — Editor export (P1)
- [x] C1 Animation keyframes (bd-anim-*) missing from export CSS → animations dead on published sites
- [x] C2 Interaction export SHIPPED (deferred-build #2). New `engine/export/interactionRuntime.ts`: a dependency-free Web Animations API runtime (no GSAP/bundler) + SSOT preset→keyframes/easing maps serialized into a self-contained `<script>`. ExportEngine emits `data-buildrick-interactions` in BOTH paths and injects the runtime before `</body>` ONLY when a page uses interactions. Covers all 19 presets, 12 easings, every trigger. Unit-tested + real-browser-smoked (hover fires a WAAPI animation; page-load fires on init).

## Batch D — Editor inspector/AI/misc (P1/P2)
- [x] D1 Responsive visibility — BOTH halves SHIPPED (deferred-build #3). Toggle writes `--hide-<bp>: true` into the element's inline style; nothing consumed it. **Canvas**: canvas root now carries `data-device`, `Canvas.css` hides `[style*="--hide-<bp>: true"]` under the matching device — toggle visibly hides/shows in device preview (browser-verified: mobile hides `--hide-mobile`, desktop hides `--hide-desktop`, reactive to device switch). **Published site**: per-breakpoint hide is a CLASS-based `@media { .buildrick-<id>{display:none!important} }` rule (via buildPublishBaseCss), consistent with the H1 cascade fix (was inline-substring before). Browser-proven: promo hides at 375px. Both covered by tests.
- [x] D2 elementProperties data-columns fall-through double-writes (missing return)
- [x] D3 AI chat-mode scope omits tokens/assets → set-token silently no-ops in chat
- [x] D4 AI Stop — already unsubscribes the stream client-side (verified); server-side quota refund-on-abort is a separate concern, not a client wiring bug
- [x] D5 LockedScreen/UpgradeModal upgrade URL 404 (/settings/subscription → /dashboard/billing)
- [x] D6 Media upload Retry now wired — failed Files retained + retryUpload re-uploads; MediaTab passes onRetryUpload. (StockSource source pills were already wired to onSetSource.)
- [x] D7 Collaborate button + footer "Connected" hardcoded — gate Collaborate behind flag, drive footer from real saveState
- [def] D8 DS dark-value input never commits — documented D4 deferral upstream; left as-is (matches engine roadmap)
- [def] D9 Layers Hide/Rename display-only (not persisted to publish) — documented as panel-local; wiring needs engine display layer (defer)

## Batch E — Dashboard flows (P1)
- [x] E1 Notification "Mark as unread" no-op (markAsRead hardsets read:true) — support read flag
- [x] E2 Access tab reads plan off wrong query → everyone FREE — use billing.overview/settings plan
- [x] E3 Share-link "No expiry" sends "0" → Zod min(1) fail — send undefined
- [x] E4 Domains tab never renders dnsRecords → verification impossible — render records table
- [x] E5 Publish flow no nav entry from detail area — pass onPublish to SiteHeader
- [x] E6 contextual-help slugs all 404 (ARTICLE_META mismatch w/ seeded slugs) — align to seeded slugs
- [x] E7 Forms "View submissions" 404 ×2 + email CTA dead — repoint to existing on-page table/drawer

## Batch F — Dashboard billing honesty (P1/P2)
- [x] F1 Billing Cancel-subscription unreachable (nothing opens CancelModal) — add Cancel button
- [x] F2 switchInterval FAKE proration + bypasses service — hide until real Stripe (honest)
- [x] F3 Bandwidth/storage meters hardcoded 0 (billing + dashboard-home + workspace-health) — compute storage from MediaAsset; hide bandwidth
- [x] F4 DunningBanner fake 14-day grace (no real failedAt) — thread real timestamp or hide

## Batch G — Dashboard orphans + honesty (P1/P2)
- [x] G1 Notification mentions tab empty (type set mismatch) — align to produced types
- [x] G2 Team revoke/revokeInvite missing onError (silent failure) — add toasts
- [x] G3 Account set-password no-op for social users — wire setPassword or hide
- [x] G4 Avatar GIF + workspace SVG picker-vs-validator mismatch — align formats
- [x] G5 AI editor endpoints (content/page/layout) bypass quota — route through reserveQuota
- [x] G6 Folder error string mismatch FOLDER_EXISTS vs FOLDER_NAME_EXISTS
- [x] G7 sites context-menu moveToFolder/export dead + bulk Export All dead + more-options button — wire move / remove export
- [x] G8 Analytics undefined% + dropped devices + dead metrics block + hardcoded archivedCount/SSL-fake/raw lastPublishedBy
- [x] G9 Change-email UI SHIPPED (deferred-build #1). Added an Email-address section to account-tab (current email, new-email + password for password users, skipped for social), wired `account.changeEmail`. The existing verify-email page (auth.service.verifyEmail handles email_change tokens) applies the switch on click. Live-verified the section renders.
- [x] G10 Workspace-transfer UI SHIPPED (deferred-build #4). Added a Transfer-ownership section to workspace settings (initiate form, pending-state with cancel) + the recipient accept-landing page at `/transfer/accept` (matches the invite email's URL). Wired `account.workspace.transfer.{pending,initiate,cancel,accept}`. Live-proven end-to-end: initiate → pending reflects the invited email → cancel → pending clears.
- [x] G11 Media asset-versions WIRED (deferred-build #5). The 3 orphaned procedures are now consumed: `LibraryItem.assetId` threaded from `MediaAsset.serverId` (toLibraryItem); new `MediaVersionService` (editor→dashboard); the detail-drawer Versions tab loads `listAssetVersions` and shows real **Restore points** with a Restore button (`restoreAssetVersion` → updates the live item src); edit + optimize save paths record a `createAssetVersion` snapshot. **Documented caveat:** the editor's edit/optimize flow creates *sibling files* (never replaces in place), while the DB model is replace-with-history — so restore-points snapshot the pre-op original (a real audit trail + rollback hook) rather than each edited result. Full fidelity (edit replaces in place + versions the result) is a flow redesign needing the upload pipeline to return URLs + live editor verification; deferred as a follow-up. Tests: assetId-threading unit test + media suite 314/314 green.
- [x] G12 Deleted dead completeTour/completeTourStep procedures + service fns (zero consumers; no tour UI). tourStep/tourCompleted columns kept for a future tour.
- [x] G13 account-deletion cron deleteMany({ownerId}) destroyed shared TEAM workspaces (all co-members' sites). Now transfers ownership of shared workspaces to the longest-tenured member; only solo workspaces deleted.

## Verified-healthy (NOT flagged — core spines sound)
Auth spine, sites/pages CRUD + publish pipeline, team invite/role/revoke, settings saves + 2FA + sessions, AI generate worker (real progress/cancel/credits), help seed/ticket/ack, notification prefs/mute/delete, editor Add/Templates/History/Layers-core/Pages-core/Settings-core/AI-apply/Components-core, DS tokens/export, ecommerce modal, wizard.

---

## GSTACK ENG REVIEW REPORT — deferred-feature build (2026-06-14)

Post-build architecture/regression review of the 7-commit deferred-feature arc (G9, C2, D1+H1, G10, G11, B1). Reviewed shipped code (no plan file). Both suites green at review time (editor 5806, root 2879), tsc clean both packages.

| Area | Verdict | Notes |
|------|---------|-------|
| H1 publish-styling | SHIP, 1 follow-up | inline base styles is the right interim fix; cascade follow-up scoped |
| C2 interaction runtime | SHIP | self-contained, no user data in script body; CSP note |
| B1 publish-unify | SHIP | single hook instance, re-entrancy guard intact; prop-depth is a smell not a bug |
| G11 asset-versions | SHIP | additive slice sound; model-mismatch documented |

### Findings
- **F1 (LOW, security defense-in-depth) — FIXED in this review.** H1's `renderPageElement` inline-style emission used `stylesToString` directly, bypassing the `isSafeAttrValue("style", …)` filter `buildAttributeString` applies (drops `expression()`/`behavior:`/`-moz-binding`). Self-XSS only (user's own site) + import-time sanitizer exists, but a defense-in-depth regression. Now guarded + regression-tested.
- **F2 (MEDIUM, already documented) — H1 cascade.** Inline base styles out-specificity the stylesheet's `@media [data-buildrick-id]` breakpoint overrides, so breakpoint-editor overrides are shadowed for properties also set at base. Correct interim (was fully-unstyled before); the class-based-base follow-up needs a real Vercel deploy to verify. Scoped correctly.
- **F3 (LOW, future) — CSP.** H1 inline styles + C2's inline `<script>` assume published sites have no Content-Security-Policy. If Buildrik adds CSP to published sites later, the interaction runtime + any inline style attrs need a nonce/hash. Document at that time.
- **F4 (LOW, UX) — G11 restore canvas refresh.** `restoreAssetVersion` updates the dashboard asset + the local item `src` via `onUpdate`, but canvas elements already referencing the old `src` may not repaint until reload. Minor; acceptable for the additive slice.
- **F5 (LOW, page-weight) — H1 inline-style bloat.** Emitting full inline styles per element grows published HTML vs class-based CSS. The F2 cascade follow-up (class-based base) also fixes this; bundled.

### VERDICT
SHIP — production-safe for the common case (most sites use base styles via element.styles, few breakpoint-editor overrides). F1 fixed inline. F2 (cascade) + F3 (CSP) + F4/F5 are documented follow-ups, none blocking. The H1 cascade refinement is the one item that genuinely wants a live Vercel deploy before it can be called fully production-grade for breakpoint-heavy sites.

NO UNRESOLVED DECISIONS

---

## GSTACK CEO REVIEW REPORT — deferred-feature build (2026-06-14)

Strategic retrospective on the 6-feature build + H1. Product: Buildrik, Webflow/Framer-style visual site builder, ~2 production users, solo founder.

| Lens | Read |
|------|------|
| Proxy skepticism | "Complete all features" was a proxy goal; the real goal is publish-fidelity (design → live site matches). H1 proved that core loop was broken. |
| Opportunity cost | G10 (team transfer), G11 (version refactor), B1 (internal cleanup) = ~0 current-user value at 2 users. The leverage was H1, found only by adjacency. |
| Inversion | A site builder whose published sites render unstyled fails on first real use. That failure mode was live until H1 was fixed today. |
| Leverage / focus | One founder + AI should concentrate on the core publish loop until provably perfect, not spread across low-demand features. |

### VERDICT
The build was executed well (tested, reviewed, shipped) but was the wrong *priority* at this stage. Highest-leverage next move, in order:
1. Ship the H1 cascade fix (class-based base CSS so breakpoint overrides win on published sites).
2. Do ONE real Vercel deploy of a genuinely-designed multi-element/multi-breakpoint page and visually verify it matches the canvas (VITE_FEATURE_PUBLISH=true + Vercel creds, editor CLAUDE.md Phase 1d). Validates H1 + cascade together.
3. Make "publish a real page and eyeball it" a standing gate before any "done" — green test suites coexisted with a fully-broken published product (H1).
Then pursue 5-10 real users. Stop building deferred features until the core loop is dogfood-proven.

NO UNRESOLVED DECISIONS

---

## GSTACK DESIGN REVIEW (conformance) — deferred-feature build (2026-06-14)

Checked the new UI surfaces (G9 email section in account-tab, G10 transfer section + /transfer/accept page, D1 device-preview) against DESIGN.md.

| Rule | Result |
|------|--------|
| Single accent = cobalt #2D6DFF | PASS — all accents via `var(--color-primary)`; no purple/violet/indigo |
| Tokens not raw hex | PASS — semantic `var(--color-*)` tokens throughout; only hex in scope is the pre-existing Google-logo SVG (legit brand palette, not new) |
| Reuse primitives | PASS — accept page reuses AuthCard/AuthButton/AuthIcon; forms match existing account/workspace patterns |
| No AI-slop / banned fonts | PASS — no decorative slop, no Arial/Helvetica/Roboto fallbacks |

VERDICT: conformant. No design follow-ups.

NO UNRESOLVED DECISIONS
