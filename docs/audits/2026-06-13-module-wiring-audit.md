# Buildrik — Module-by-Module Wiring Audit (2026-06-13)

8 parallel specialist agents traced every interactive UI → router/handler → service → model across editor + dashboard. Only confirmed gaps (read-verified). Intentional "coming soon" / demo-only / documented-deferral items excluded. Status: [ ] open · [x] fixed · [~] partial · [def] deferred (wire-or-delete decision).

## Batch H — NEW critical finding (surfaced during deferred-feature build)
- [ ] **H1 (P0/P1) Publish path emits style-less HTML.** The multi-page publish path used by Vercel (`ExportEngine.exportAllPages` → `renderPageElement`) emits each element from `element.attributes` ONLY — it drops `element.styles` (inline base styles), `element.classes`, AND `data-buildrick-id`. Empirically verified: a page with styled elements exports HTML containing no `class=`, no `style=`, no `data-buildrick-id`. Consequence: published sites likely ship with element base styling stripped, and StyleEngine breakpoint rules (keyed `[data-buildrick-id]` via `generateResponsiveCSS`) match nothing. NOT a safe blind fix — base styles are inline (higher specificity than the stylesheet's breakpoint media rules), so the correct fix is cascade-sensitive (class-based base styles so `@media` overrides win) and touches the live deploy path. Needs its own arc with a real Vercel deploy to live-verify. Blocks D1's published-site half. The single-page/ZIP export path (`elementToHTML` + `extractStyles`) is class-based and does NOT have this gap. Discovered 2026-06-14 while building C2/D1.

## Batch A — Editor persistence (DATA-LOSS, P0/P1)
- [x] A1 Manual Save + Cmd+S persist to localStorage only, fake "Saved" toast — useSaveCallback.ts:62 → route through dashboard saveProject
- [x] A2 Undo/redo + version-restore never auto-persist (autosave only on project:changed) — useComposerInit autosave must also fire on history:undo/redo/version:restored

## Batch B — Editor wiring (P1)
- [def] B1 Sidebar PublishTab button inert — StudioPanels never forwards onPublish, so usePublish returns false. NOT a simple wiring miss: the sidebar uses a host-callback contract `(projectId)=>Promise<PublishResult>` (await-to-completion) while the canonical Topbar publish (handleVercelPublish) is fire-and-poll `()=>Promise<void>`. The Topbar dropdown is the working publish path (gated VITE_FEATURE_PUBLISH). Unifying the two state machines is a dedicated arc, not a thread-through — deferred to avoid double-publish/double-toast.
- [x] B2 Settings tab hardcoded userPlan="starter" → Custom-code/Integrations locked for all — thread real plan
- [x] B3 IntegrationsHub children miss registerFlushHandler → GA/pixel/head/body dropped on save
- [x] B4 Media drag-to-canvas broken — AssetCell sets wrong MIME; use setMediaDragData SSOT (+ LibraryView cards)
- [x] B5 Pages drag-to-reorder advertised but never calls reorderPage — wired drop target → composer.elements.reorderPage
- [x] B6 Components row-menu Duplicate FAKE (manual-instructions modal) — call composer.components.duplicateComponent
- [x] B7 Component detail Swap button FAKE (toast only) — removed dead Swap control + handler

## Batch C — Editor export (P1)
- [x] C1 Animation keyframes (bd-anim-*) missing from export CSS → animations dead on published sites
- [def] C2 Interaction attributes + runtime dropped on export — forwarding the data-buildrick-interactions attr alone does nothing without the InteractionRuntime JS on the published page; needs a runtime-bundling step (dedicated arc). Interactions still run in-editor. Deferred (animations — far more common — fixed in C1).

## Batch D — Editor inspector/AI/misc (P1/P2)
- [~] D1 Responsive visibility. Toggle writes `--hide-<bp>: true` into the element's inline style; nothing consumed it. **Canvas half SHIPPED** (deferred-build #3): canvas root now carries `data-device`, and `Canvas.css` hides `[style*="--hide-<bp>: true"]` under the matching device — the toggle now visibly hides/shows in the device preview (browser-verified: mobile hides `--hide-mobile`, desktop hides `--hide-desktop`, reactive to device switch). **Published-site half BLOCKED by H1** (the publish path emits no element styles at all, so `--hide-*` can't reach the live site); lands with H1.
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
- [def] G9 Change-email — net-new UI (account-tab has no email-change section at all); backend (requestEmailChange + verify flow) intact. Building the form + verify-landing UX is feature-scope, not a broken interactive.
- [def] G10 Workspace-transfer — full backend (router+service+3 emails+expiry cron) with no UI. Net-new feature (recipient picker + accept flow), not a broken interactive; backend left intact for the build.
- [def] G11 Media asset-versions (list/create/restore) — no UI; assetVersionsCap plan-limit signals intent. Net-new version-history UI is feature-scope; backend left intact.
- [x] G12 Deleted dead completeTour/completeTourStep procedures + service fns (zero consumers; no tour UI). tourStep/tourCompleted columns kept for a future tour.
- [x] G13 account-deletion cron deleteMany({ownerId}) destroyed shared TEAM workspaces (all co-members' sites). Now transfers ownership of shared workspaces to the longest-tenured member; only solo workspaces deleted.

## Verified-healthy (NOT flagged — core spines sound)
Auth spine, sites/pages CRUD + publish pipeline, team invite/role/revoke, settings saves + 2FA + sessions, AI generate worker (real progress/cancel/credits), help seed/ticket/ack, notification prefs/mute/delete, editor Add/Templates/History/Layers-core/Pages-core/Settings-core/AI-apply/Components-core, DS tokens/export, ecommerce modal, wizard.
