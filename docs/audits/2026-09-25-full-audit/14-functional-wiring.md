# 14 — Functional Wiring & Application Integrity

- **Agent:** G (Verification & Test)
- **Prompt:** 14
- **Date:** 2026-09-25
- **Mode:** READ-ONLY
- **Scope:** I traced each UI control through its handler, hook or store, the client service, tRPC or REST, the server service, persistence, and back to what is rendered. This covers `packages/editor`, `packages/dashboard`, `server`, `lib`, `packages/shared` and `prisma`, plus the realtime paths (composer bus, window CustomEvents, and the three SSE streams) and the feature flags.

---

## Method & runtime status

**Commands run in this sandbox:**

| Command | Result |
|---|---|
| `node scripts/audit/event-graph.mjs` (+ `--json`) | 309 events, 123 "strong orphans", 7 isolated modules. **I re-checked these by hand (see A14-19).** 29 of the 123 do have listeners that the tool cannot see, so there are 94 true emit-without-listener events. |
| Scratch scan: listened-to but never emitted (composer bus, `packages/editor/src`) | **0 genuine cases.** The only hit, `COMPOSER_READY`, was a regex miss: it is emitted at `Composer.ts:401,487`. |
| Scratch scan: window `CustomEvent` dispatch vs `addEventListener` | Every app event is paired: `buildrik:save-conflict`, `buildrik:settings-mirror-error`, `upgrade-modal-open`. `cart:updated` is emitted into the *published* site runtime (`StripeInjector.ts:54`) and is out of scope. |
| Scratch scan: SSE server `send(event)` vs client `addEventListener` | publish: `status` is handled; `error` and `timeout` fall through to `onerror`, which retries (acceptable). notifications: `unread` is handled. **collab: `resync` has no handler (A14-8).** |
| `node packages/dashboard/scripts/check-trpc-orphans.mjs` | PASS: 286 procedures, 29 allowlisted orphans. **The gate has blind spots (A14-19).** |
| `node scripts/audit/link-audit.mjs` | **Crashes (ENOENT):** it hard-codes `/Users/shahg/...` at line 24. A path-patched copy reports 0 unmatched across 40 targets, but it scans `app/` only. |
| My wider link scan (scratch): dashboard `components/` + `lib/` + `server/` + editor + emails, checked against the 139 routes plus `lib/ia-v2-redirects.mjs` | 0 dead internal links. Every unmatched hit resolves through an IA-v2 permanent redirect or is a `startsWith` check. |
| Scratch scan: unimported modules | 11 real dead UI/hook files; the rest were barrels (A14-16). |
| `pnpm --filter @buildrik/editor exec vitest run CommandPalette.test.tsx CanvasEmptyCTA.test.tsx` | **4 failed / 42 passed.** Root cause confirmed; see A14-18. |
| `… vitest run useAutoMilestone.test.ts useAISummary.test.tsx useCanvasCommandPalette.test.ts` | 42/42 pass, **over the wiring defects in A14-1 and A14-4**. The tests mock the wrong wire shape or assert only the emit. |
| `pnpm vitest run redirects-copy.test.ts submissions-copy.test.ts` | 7/7 pass. **These tests lock in the stale copy described in A14-6.** |
| In-process tRPC protocol reproduction (`initTRPC` + `superjson` + `fetchRequestHandler` from the repo's own `node_modules`, run through `node -e`) | The body the editor sends raw (`{versionName, changes}`) gets **HTTP 400 BAD_REQUEST** ("expected object, received undefined"). A superjson-wrapped body `{json:{…}}` gets 200, with the response at `result.data.json.summary`. This proves A14-1 at the protocol level. |

**Housekeeping disclosure:** one command briefly copied a scratch file to the repo root (`.tmp-trpc-raw-audit.mjs`) and deleted it in the same command. It was never executed from there. `git status` is clean for my part.

**NOT RUNTIME VERIFIED.** There was no Postgres and no browser, so nothing was clicked in a running app. Every finding below is VERIFIED **in code**: I read the handler chain and cite file:line. Where I also ran something (a unit test or the protocol reproduction), the finding says so. None was observed end-to-end in the live app. Specifically:
- Production cron configuration, the baked `NEXT_PUBLIC_FEATURE_PUBLISH` value, and a real deploy honouring the redirects/forms wiring cannot be seen from the repo.
- The Playwright suites were not run.

---

## Wiring table

Status legend:
- **IMPLEMENTED:** the chain is complete in code.
- **PARTIAL:** part of the chain is missing, or part of the UI is a stub.
- **STUB:** the UI exists and deliberately does nothing real.
- **DEAD:** the handler does not do what its label says, or nothing imports the code.
- **UNREACHABLE:** the code is mounted but has no door in production.
- **NRV:** not runtime verified. This applies to *every* row.

| # | Source (control) | File / symbol | Handler | Destination | Reachability (prod) | Return path | Status | Pri |
|---|---|---|---|---|---|---|---|---|
| 1 | Rail items: Add / Layers / Pages / Assets / CMS / Brand | `E/editor/rail/tabsConfig.ts:75-265`, `LeftSidebar.tsx:653` (FigmaRail) | `onBtnClick` → `openLeftPanelToTab` | `TabRouter.tsx:139-265` (each id has a `case`) | Rail (default `figma`) | Panel renders | IMPLEMENTED | — |
| 2 | Off-rail tabs: ai, templates, components, settings, publish, history, review | `TabRouter.tsx`, `FullPageRouter.tsx:67,85,105` | ⌘K nav, shortcuts, site menu, `ui:switch-tab` (`StudioPanels.tsx:351`) | Tab components | ⌘K / keys / menu | Panel or full page | IMPLEMENTED | — |
| 3 | ⌘K "Open <Tab> panel" (13) | `shell/modals/CommandPalette.tsx:47-63` | `emit(UI_PANEL_OPEN)` | `useEditorEventListeners.ts:145-160` (allowlist taken from `GROUPED_TABS_CONFIG`) | ⌘K | Tab opens | IMPLEMENTED (tests drifted: A14-18) | P3 |
| 4 | ⌘K Preview / Zoom / Fit / Keyboard shortcuts / Replace layout | `CommandPalette.tsx:111-175` | emits `UI_TOGGLE_PREVIEW`, `ZOOM_*`, `UI_TOGGLE_CHEAT_SHEET`, `UI_BROWSE_TEMPLATES` | `AquibraStudio.tsx:209`, `Canvas.tsx:375,415-416`, `KeyboardCheatSheet.tsx:390`, `StudioPanels.tsx:312` | ⌘K | UI toggles | IMPLEMENTED | — |
| 5 | **⌘K "Clear history"** | `CommandPalette.tsx:152-156` | `emit(HISTORY_CLEARED)` | Listeners only *refresh state*; `HistoryManager.clear()` is never called | ⌘K | Nothing is cleared | **DEAD** (A14-3) | P2 |
| 6 | ⌘K registry commands (Export HTML/JSON, devices, group…) | `CommandPalette.tsx:176+` → `composer.commands` | `CommandCenter.run` | Engine commands; errors emit `COMMAND_ERROR` with no listener | ⌘K | Silent on error | IMPLEMENTED / error path orphaned (A14-17) | P3 |
| 7 | ⌘⇧P undo/redo/dup/delete/select/zoom/add-*/CMS records/save template/toggle layers/preview/open media | `canvas/hooks/useCanvasCommandPalette.ts:87-298` | `commands.run` or events | `useEditorEventListeners.ts:94,105,170,200`; `Canvas.tsx` | ⌘⇧P | As labelled | IMPLEMENTED | — |
| 8 | **⌘⇧P "Replace selected media"** | `useCanvasCommandPalette.ts:301-315` | `emit("ui:media-selection-request")` | Its only listener is `useMediaState.ts:124`, which is mounted only while MediaTab or LibraryManager is mounted | ⌘⇧P | No-op unless Assets is already the active tab | **PARTIAL / DEAD in most states** (A14-4) | P2 |
| 9 | ⌘⇧P "Export site" | `useCanvasCommandPalette.ts:259-264` | `UI_PANEL_OPEN {settings, screen:"export"}` | `SettingsTab.tsx:318-324` ignores `export` (a *door*, not a screen) | ⌘⇧P | Lands on Settings **Overview**, not the Exporter | Wrong return path (A14-13) | P3 |
| 10 | ⌘⇧P "Search stock photos" | `useCanvasCommandPalette.ts:317-325` | `ui:switch-tab {assets}` | MediaTab | ⌘⇧P | Opens Assets; no stock search is focused | PARTIAL | P3 |
| 11 | ⌘⇧P / header "Start collaboration" | `useCanvasCommandPalette.ts:187,326`, `StudioHeader.tsx:225,848` | `CollaborationManager.startSession` | `SSETransport` → `/api/collab/:id/ops` + `/api/sse/collab/:id` | **Flag off** (`FEATURE_COLLAB`) | See A14-8 | PARTIAL, flagged off | P2 |
| 12 | Site menu (16 items) | `shell/SiteMenu.tsx:189-305` | Props from `StudioHeader`; dashboard deep links via `openDashboard` | `#site-health` (`overview-tab.tsx:184`), `#activity-log` (`:306`), `?share=1` (`site-header.tsx:41`) | Topbar | As labelled | IMPLEMENTED | — |
| 13 | Footer "Structure" → StructurePopover | `StudioFooter.tsx:123,215`, `AquibraStudio.tsx:735-744` | `setStructureOpen(true)` | `StructurePopover` | **Only when `fourToolRail`, which is dev-only** (`editorViewMode.ts:70-75`) | — | **UNREACHABLE** (A14-11) | P3 |
| 14 | `?rail=e3` / `?rail=legacy` renderers | `LeftSidebar.tsx:653-667` | — | FourToolRail / RailZone | `resolveRailMode` returns `"figma"` when `!IS_DEV_BUILD` | — | UNREACHABLE in prod (A14-11) | P3 |
| 15 | Issues panel | `AquibraStudio.tsx:305-330,605-626` | `designSystem.lintState` → `setIssues` | `IssuesPanel` | Header `onOpenIssues` (`:517`) | Lists DS-lint issues only | IMPLEMENTED (single producer) | — |
| 16 | Autosave | `useComposerInit.ts` → `BuildrikSyncProvider.saveProject` | Debounced at 1000 ms | `sites.saveProject` → `saveProjectData` | Always | `SAVE_CONFLICT` window event → `AquibraStudio.tsx:356` ConflictModal; mirror error → `useSaveCallback.ts:105`, `SettingsTab.tsx:437` | IMPLEMENTED (behaviour → A12) | — |
| 17 | Local backup autosave | `engine/storage/StorageAdapter.ts:45-56` | Debounced `save()` | localStorage | Always | `STORAGE_ERROR` has **no listener**, so failure is silent | PARTIAL (A14-17) | P3 |
| 18 | **History → "AI summary" (Compare)** | `panels/version-history/useAISummary.ts:109-121` | Raw `fetch("/api/trpc/ai.summarize")`, not superjson-encoded | `ai.summarize` (`server/trpc/routers/ai.ts:233`) under `transformer: superjson` (`trpc.ts:57`) | History tab | **Always 400.** Even a 200 would be read at the wrong path | **DEAD** (A14-1) | P1 |
| 19 | **History → milestone suggestion banner** | `shared/hooks/useAutoMilestone.ts:180-191`, `HistoryTab.tsx:184` | Raw `fetch("/api/trpc/ai.milestoneSuggest")` | `ai.milestoneSuggest` (`ai.ts:253`) | History tab (auto) | **Always 400**, swallowed (`catch {}`), so the banner never appears | **DEAD** (A14-1) | P1 |
| 20 | Selected-element AI, AI chat, AI privileged actions | `AiTrpcClient.ts:162-170`, `subscriptionClient.ts:21-29`, `useAiActionGate.ts:63-71` | tRPC clients with superjson | `ai.streamPrompt`, `actions.propose/confirm` (confirm sends `exportPublishPages`) | ✨, ⌘K | Streamed | IMPLEMENTED | — |
| 21 | Editor Publish (topbar → PublishTab/Wizard) | `StudioHeader.tsx:220`, `TabRouter.tsx:210`, `PublishService.ts:61-69` | `sites.publish {siteId, pages}` | `startPublish` → worker `api/workers/publish/[jobId]` | **Needs `NEXT_PUBLIC_FEATURE_PUBLISH` baked into the bundle** | `usePublishJob` polling | IMPLEMENTED; the bake is unguarded (A14-9) | P2 |
| 22 | **Dashboard `/dashboard/sites/[id]/publish` page** | `app/dashboard/sites/[id]/publish/page.tsx:30,43` | `sites.publish.mutate({siteId})`, **with no pages** | Worker throws "No page content to deploy" (`workers/publish/[jobId]/route.ts:100-104`) | **No in-app link.** Header "Publish" goes to the editor (`sites/[id]/layout.tsx:75`) | SSE / poll → FAILED | **ORPHAN + broken** (A14-5) | P2 |
| 23 | Publish SSE (dashboard) | `lib/hooks/use-publish-sse.ts:29-44`; `api/sse/publish/[jobId]/route.ts:39-84` | `status` listener | `PublishProgress` (only mounted by #22) | Via #22 only | Falls back to `publishStatus` polling | IMPLEMENTED (on an orphan screen) | — |
| 24 | Dashboard bell | `lib/hooks/use-notification-sse.ts:16`; `api/sse/notifications/route.ts:30-47` | `unread` | Invalidates queries | Dashboard shell | Count updates | IMPLEMENTED | — |
| 25 | Notification `actionUrl`s | `workers/publish/route.ts:176-181,231-236`; `form-submission.service.ts:58-63`; `auth.ts:328` | — | `/dashboard/sites/:id`, `/dashboard/settings/team` | — | Routes exist | IMPLEMENTED | — |
| 26 | Notifications "Mentions" tab | `components/notifications/notification-page.tsx:13`; `shared/schemas/notifications.ts:13-18` | `filter:"mentions"` | SECURITY_* / PAYMENT_FAILED types | Dashboard | Shows security/billing items under a "Mentions" label | Mis-wired label (A14-15) | P3 |
| 27 | **Dashboard Redirects tab copy / editor Redirects** | `components/site-detail/redirects-tab.tsx:107-116` | CRUD through `siteDetail.redirects.*` | Worker reads `prisma.redirect` → `vercel.json` (`workers/publish/route.ts:311-321,404`; `lib/publish-files.ts:122-155`) | Dashboard | **Copy says "isn't wired up yet" while it is** | IMPLEMENTED; copy stale (A14-6) | P2 |
| 28 | **Forms inbox empty states** (dashboard + editor) | `submissions-panel.tsx:112-120`; `settings/screens/FormsScreen.tsx:240-254` | — | Worker `planFormWiring` rewrites `<form action>` to `/api/public/forms/:site/:block` and upserts FormBlock (`lib/publish-forms.ts:76-81`; worker `:357-362`) | Both | **Copy says capture "isn't wired / not captured yet"** | IMPLEMENTED; copy stale (A14-6) | P2 |
| 29 | Editor Settings screens: General, SEO, Domains, Redirects, Analytics, Forms, Custom code, Headers, Webhooks | `settings/screens/*` | `siteDetail.*`, `forms.*`, `webhooks.*` | site-settings / domain / redirect / form-submission / webhook services | Site menu → Settings | Save banners | IMPLEMENTED | — |
| 30 | **Editor Settings → Localization** | `LocalizationScreen.tsx:137-142`, `TranslationChecklistDialog.tsx:74` | `settings.update {defaultLocale, enabledLocales, localeAutoRedirect}` | Only `defaultLocale` reaches output (as `lang`). Extra locales and auto-redirect are never read by publish. Translation endpoints `pages.get/set/removeTranslation` have no UI | Settings | "Translation progress" with no way to translate | **PARTIAL** (A14-7) | P2 |
| 31 | Editor Settings → Integrations | `IntegrationsScreen.tsx:19-52` | "Learn More" → provider docs | — | Settings | Honest `soon` | STUB (honest) | — |
| 32 | Editor Settings → Export / Members / Billing doors | `SettingsTab.tsx:271-289` | `UI_OPEN_EXPORTER` (`StudioHeader.tsx:382`); `window.open` dashboard | Exporter; `/dashboard/settings/{team,billing}` | Settings | As labelled | IMPLEMENTED | — |
| 33 | Full Media → "Trash" row | `media/components/FolderTree.tsx:446-453`; `LibraryManager.tsx:864-866` | `addToast("Trash coming soon")` | None. Deletes are hard deletes (`media.service.ts:320-329`) | Full Media | Toast; count is always 0 | STUB (A14-12) | P3 |
| 34 | Export modal "Vue" / "Next.js" | `export/ExportOptions.tsx:29` | Disabled "coming soon" | `ExportEngine.ts:679` throws if it is ever reached | Exporter | Disabled | STUB (honest) | — |
| 35 | Upgrade modal | `chrome-ui/UpgradeModal.tsx:44-81` | `openUpgrade()` from `TemplatesTab.tsx:177,188` | Dashboard billing | Premium template click | Modal | IMPLEMENTED | — |
| 36 | Dashboard API tokens | `components/settings/api-tokens-tab.tsx:100-105`; `server/trpc/trpc.ts:127` | `apiTokens.*` | Tokens are created, but **no `scopedProcedure` consumer exists** | Settings | Honest banner | STUB (honest) / PRODUCT DECISION | — |
| 37 | Scheduled publish | `sites.schedulePublish/cancel/get` (`sites.ts:441-476`); `cron/scheduled-publish/route.ts:36` | — | `startPublish(site, ws, user)` with **no pages**, which the worker refuses | **No UI** (allowlisted) | — | NO-UI; the server half would fail if used (A14-14) | P3 |
| 38 | Crons (18) | `vercel.json` (18), `app/api/cron/*` (18) | cron-auth | account-deletion, billing-dunning/downgrade, purges… | **cPanel: 2 of 18 documented** (`docs/cpanel-deploy.md:182-192`) | — | NRV in prod (A14-2) | P1 |
| 39 | Collab inbound stream | `engine/collaboration/SSETransport.ts:42-76` | `hello`, `op`, `onerror` | `/api/sse/collab/:id` sends `hello`, `resync`, `op` (`route.ts:37-58`) | Flag off | `resync` unhandled; `hello.seq` ignored; auto-reconnect URL is frozen | **PARTIAL** (A14-8) | P2 |
| 40 | Collab outbound | `SSETransport.ts:90-99` | `fetch POST … .catch(()=>{})` | `appendCollabOp` | Flag off | A failed send is dropped silently | PARTIAL (→ D) | P2 |
| 41 | OT divergence / collab errors | `OTEngine.ts:144`; `CollaborationManager.ts:749,777` | emit `OT_DIVERGENCE_DETECTED`, `COLLAB_SYNC_ERROR`, `COLLAB_CONNECTION_LOST` | **No listener** | Flag off | Silent | PARTIAL (A14-17) | P3 |
| 42 | Dashboard partner program | `agency/(tabs)/partner/page.tsx` (redirects away), `partner-view.tsx:15` | `dashboard.partner` | `partner.service` | Door closed on purpose | — | UNREACHABLE (deliberate); the orphan gate misses it (A14-19) | P3 |
| 43 | Template management hook | `shell/hooks/useTemplateManager.ts` (incl. `deleteTemplate`) | — | `composer.templates` | **No consumer** | — | DEAD (A14-16) | P3 |
| 44 | Legacy duplicate flag registry | `shared/constants/config.ts:227-246` `FEATURES` / `isFeatureEnabled` | — | — | Re-exported (`constants/index.ts:38,43`), called nowhere | — | DEAD, stale values (A14-14) | P3 |

---

## Findings

### P0 — none

I found no immediate-fix item inside this concern.
- The one data-corruption-class wiring defect (A14-8, collaboration replay) is reachable only behind `FEATURE_COLLAB`, which is off in production. It is recorded as P2, with an explicit note that it becomes P0-class the day that flag is enabled.
- The orphan dashboard publish page (A14-5) cannot publish anything, so it cannot publish without authorisation. It only fails.

### P1

#### A14-1 — Version-history AI Summary and milestone suggestions are dead: raw `fetch` bypasses the superjson transformer
- **Severity:** P1
- **File:**
  - `packages/editor/src/editor/panels/version-history/useAISummary.ts:109-121`
  - `packages/editor/src/shared/hooks/useAutoMilestone.ts:180-191`
- **Symbol:** `useAISummary().requestSummary`, `useAutoMilestone().requestSuggestion`
- **Evidence:**
  - Both hooks POST a bare JSON body (`{versionName, changes}` and `{recentChanges, pageStructure}`) to `/api/trpc/ai.summarize` and `/api/trpc/ai.milestoneSuggest`.
  - Both procedures are `.mutation` with a zod `.input(...)` (`server/trpc/routers/ai.ts:233-235,253-255`), and the server's tRPC instance uses `transformer: superjson` (`server/trpc/trpc.ts:57`).
  - Every other editor client wraps calls in superjson (`api-client.ts:25`, `AiTrpcClient.ts:167`, `subscriptionClient.ts:25,29`).
  - **Reproduced in-process** with the repo's own `@trpc/server`, `superjson` and `zod`:
    - A raw body gets **HTTP 400** `BAD_REQUEST`: "expected object, received undefined".
    - A `{json:{…}}` body gets 200, with the payload at `result.data.json.summary`.
  - The hooks read `result.data.summary` and `result.data.suggestedName`, so even a corrected request would be parsed wrongly.
  - What the user sees:
    - AI Summary always shows the error state ("AI summary unavailable").
    - Milestone suggestions fail inside `catch {}` ("Silently fail"), so `MilestoneSuggestionBanner` (`HistoryTab.tsx:184`) never appears.
  - Both hooks' unit tests pass (run: 42/42), because they stub `fetch` with the *un-transformed* shape `{result:{data:{suggestedName, reasoning}}}` (`useAutoMilestone.test.ts:58-60`). This is the same failure mode as the "tests hand-build payloads" Stripe lesson in CLAUDE.md.
  - The orphan gate counts these raw fetches as callers, so the two procedures look wired.
- **Expected behavior:** Summarize returns a summary. Milestone names are suggested after big changes.
- **Root cause:** hand-rolled HTTP calls instead of the typed tRPC client. The mocks encode the author's assumption about the wire format, not the real format.
- **Affected modules:** History / Versioning, AI.
- **Recommendation:**
  - Call `ai.summarize` and `ai.milestoneSuggest` through the existing superjson tRPC client (`AiTrpcClient` or `getBuildrikClient`).
  - Replace the fetch-stub tests with a test that goes through the real transformer, for example a `createCaller` or `fetchRequestHandler` round trip.
- **Status:** VERIFIED (code + protocol reproduction). NOT RUNTIME VERIFIED in the app.

#### A14-2 — 16 of 18 scheduled jobs have no documented production trigger (cPanel)
- **Severity:** P1
- **File:** `vercel.json` (18 entries); `docs/cpanel-deploy.md:182-192`; `packages/dashboard/app/api/cron/*` (18 routes)
- **Symbol:** cron routes, including `account-deletion`, `billing-dunning`, `billing-downgrade`, `invite-expiry`, `session-cleanup`, `token-cleanup`, `soft-delete-purge`, `analytics-*`, `form-submission-purge`, `ip-anonymization`, `workspace-transfer-expiry`, `publish-job-cleanup`, `ai-job-cleanup`, `ephemeral-purge`, `scheduled-publish`
- **Evidence:**
  - Production is cPanel (CLAUDE.md "Where the values live"), where `vercel.json` crons do not fire.
  - The deploy doc heading says "15 routes", but it lists only `dns-verify` and `ssl-check`, and points to "full list in /Users/shahg/…/vercel.json", which is a founder-machine path.
  - Nothing else in the app fires these jobs. `instrumentation.ts` contains no scheduler; I grepped it for `setInterval` and `node-cron`.
  - `account-deletion/route.ts:14-20` is the only executor of `AccountDeletionReq` rows whose `scheduledAt` has passed.
- **Expected behavior:** every route in `vercel.json` has a matching cPanel cron entry, or an in-app scheduler.
- **Root cause:** the deploy target changed (Vercel → cPanel) without porting the schedule. The documentation is incomplete.
- **Affected modules:** Account deletion (privacy obligation), Billing dunning/downgrade, Invites, Sessions, retention purges.
- **Recommendation:**
  - Diff the live cPanel crontab against `vercel.json`.
  - Put the full 18-line crontab in `docs/cpanel-deploy.md`.
  - Consider extending `check-prod-env` to assert the crontab.
- **Status:** NOT VERIFIED. The production crontab is not visible from the repo. If the crontab is missing these jobs, account deletion and dunning never run, and that becomes a release blocker.

### P2

#### A14-3 — ⌘K "Clear history" announces a clear and never performs one
- **Severity:** P2
- **File:** `packages/editor/src/editor/shell/modals/CommandPalette.tsx:152-156`
- **Symbol:** command `history-clear`
- **Evidence:**
  - The handler is `composer.emit(EVENTS.HISTORY_CLEARED, undefined)`.
  - `HISTORY_CLEARED` is the *notification* that `HistoryManager.clear()` emits after it has emptied the stacks (`engine/HistoryManager.ts:745-761`).
  - Its listeners only re-read state: `useHistoryState.ts:45-59` (`updateState`), `useComposerInit.ts:705-716`, and `usePublishSnapshot.ts:141` (`bump`).
  - Nothing calls `composer.history.clear()`, so the undo/redo stacks survive, and the command is always enabled.
  - The unit test only checks that the label is present (`CommandPalette.test.tsx:89,124`).
- **Expected behavior:** the undo history is cleared (ideally behind a confirm), or the command is removed.
- **Root cause:** a request event and a notification event share one name.
- **Affected modules:** Undo/redo, Commands.
- **Recommendation:** call `composer.history.clear()`, or drop the command (it is also a destructive action with no confirm). Add a test that asserts `canUndo()` is false afterwards.
- **Status:** VERIFIED (code). NOT RUNTIME VERIFIED.

#### A14-4 — ⌘⇧P "Replace selected media" is a no-op unless the Assets panel is already active
- **Severity:** P2
- **File:**
  - `packages/editor/src/editor/canvas/hooks/useCanvasCommandPalette.ts:301-315`
  - `packages/editor/src/editor/sidebar/tabs/media/hooks/useMediaState.ts:111-124`
- **Symbol:** command `replace-media`; the `ui:media-selection-request` listener
- **Evidence:**
  - The command emits `ui:media-selection-request` synchronously.
  - The only listener is registered in `useMediaState`, which runs only while `MediaTab` or `LibraryManager` is mounted (`MediaTab.tsx:73`, `LibraryManager.tsx:109`). `TabRouter` renders only the active tab.
  - `useBlockInsertion.ts:129-152` documents exactly this problem ("listener only mounts when the Media tab is visible") and works around it with a two-step switch-tab plus a delayed emit. `replace-media` does not use that workaround.
  - The unit test asserts the emit only (`useCanvasCommandPalette.test.ts:273-290`).
- **Expected behavior:** the Assets picker opens, bound to the selected element.
- **Root cause:** the listener's lifetime is tied to a panel's mount.
- **Affected modules:** Media Quick, Canvas commands, Inspector media source.
- **Recommendation:** lift the `ui:media-selection-request` and `element:needs-asset` handlers into a shell-level hook, which is the fix the `useBlockInsertion` comment already proposes.
- **Status:** VERIFIED (code). NOT RUNTIME VERIFIED.

#### A14-5 — Orphan dashboard publish screen that can only fail in production
- **Severity:** P2
- **File:** `packages/dashboard/app/dashboard/sites/[id]/publish/page.tsx:30-43`
- **Symbol:** `publishMutation.mutate({ siteId })`
- **Evidence:**
  - It sends no `pages`.
  - The worker refuses page-less jobs unless `PUBLISH_ALLOW_SIMULATION` is set: "No page content to deploy. Open the site in the editor…" (`app/api/workers/publish/[jobId]/route.ts:100-104`). Its own comment at `:94-98` records that this exact dashboard button "shipped broken and stayed broken".
  - No link in `app/`, `components/`, `lib/` or the editor points at `/dashboard/sites/:id/publish`. I checked with a wider scan than `audit:links`. The site header's Publish button routes to the editor (`sites/[id]/layout.tsx:75`), and `tab-nav.tsx:8-15` has no Publish tab.
  - The page is therefore reachable only by typing the URL. There it creates a job, streams progress (`PublishProgress`, `use-publish-sse`), and ends FAILED.
  - The inventory's claim that "both [editor and dashboard] drive `usePublishJob`" is inaccurate. The dashboard page uses `usePublishSSE` and tRPC polling, and has no door.
- **Expected behavior:** either no reachable screen, or a working publish.
- **Root cause:** publishing moved to "the editor renders the pages", and the dashboard surface was de-linked but not removed.
- **Affected modules:** Publish (dashboard), `components/publish/*`.
- **Recommendation:** make the route redirect to the editor's Publish (the `partner/page.tsx` pattern), or delete the route and its three components.
- **Status:** VERIFIED (code). NOT RUNTIME VERIFIED.

#### A14-6 — UI copy says Redirects and Form capture are "not wired", but publish now wires both (and tests lock the stale copy)
- **Severity:** P2
- **File:**
  - `packages/dashboard/components/site-detail/redirects-tab.tsx:107-116`
  - `packages/dashboard/components/site-detail/submissions-panel.tsx:112-120`
  - `packages/editor/src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx:240-254`
- **Symbol:** Redirects header copy; Forms empty-state copy
- **Evidence:**
  - Redirects:
    - The dashboard copy says "Applying it to the published site isn't wired up yet; export the CSV for your host".
    - The publish worker reads `prisma.redirect` and passes the rules to `buildVercelConfig`, which emits `vercel.json` redirects (`workers/publish/[jobId]/route.ts:311-321,404`; `lib/publish-files.ts:122-155`). This landed in commit `a0963db` (2026-09-14).
  - Forms:
    - Both empty states say submissions "are not captured yet".
    - `planFormWiring` rewrites every action-less `<form>` to POST to `/api/public/forms/:siteId/:blockId` and upserts the FormBlock rows (`lib/publish-forms.ts:1-16,76-81`; worker `:357-362`).
  - `redirects-copy.test.ts:27` and `submissions-copy.test.ts:31` assert the stale sentences (7/7 pass).
- **Expected behavior:** the copy describes what the product does.
- **Root cause:** "honesty copy" written when the backend was missing, and never revisited when the backend landed. The tests pin the copy rather than the behaviour.
- **Affected modules:** Settings (dashboard + editor), Publish, Forms.
- **Recommendation:**
  - Update the three copy blocks and the two copy tests.
  - Replace them with a behaviour test (a publish payload containing a redirect produces `vercel.json` with it).
  - Verify on a real deploy first.
- **Status:** VERIFIED (code). Whether the redirects and forms work on a live Vercel deploy is NOT RUNTIME VERIFIED.

#### A14-7 — Localization exposes multi-locale controls that nothing downstream consumes
- **Severity:** P2
- **File:**
  - `packages/editor/src/editor/sidebar/tabs/settings/screens/LocalizationScreen.tsx:137-142`
  - `…/components/TranslationChecklistDialog.tsx:74`
- **Symbol:** `settings.update {defaultLocale, enabledLocales, localeAutoRedirect}`
- **Evidence:**
  - Save writes all three columns.
  - `defaultLocale` is used: it becomes the document `lang` (`:143-154`).
  - `enabledLocales` and `localeAutoRedirect` are not read by any publish code. I grepped `lib/publish-*.ts`, the publish worker and `publish.service.ts` and found no hits.
  - The Translation checklist dialog has a single "Back" button.
  - The translation endpoints `pages.getTranslation`, `setTranslation` and `removeTranslation` have no caller (allowlisted "FOUNDER DECISION").
  - Result: a user can "Add locale", see "n of N pages" progress, and has no way to translate, and no `/fr/…` pages are published.
- **Expected behavior:** either working locales, or a screen reduced to default-locale / `lang`.
- **Root cause:** the UI was shipped ahead of the S2 backend.
- **Affected modules:** Settings, Pages, Publish.
- **Recommendation:** PRODUCT DECISION. Gate "Add locale" behind a flag, or build the translation editor and locale emission.
- **Status:** PARTIAL / PRODUCT DECISION REQUIRED.

#### A14-8 — Collaboration inbound stream mis-wired: unhandled `resync`, ignored head seq, frozen reconnect cursor (flag-off)
- **Severity:** P2. **It becomes P0-class (data corruption) if `FEATURE_COLLAB` is ever enabled.**
- **File:**
  - `packages/editor/src/engine/collaboration/SSETransport.ts:42-76`
  - `packages/dashboard/app/api/sse/collab/[siteId]/route.ts:37-58`
  - `server/services/collab.service.ts` (`hasResyncGap`)
- **Symbol:** `SSETransport.connect`
- **Evidence (three separate wiring defects):**
  1. **`resync` is not handled.** The server sends `event: resync` and closes (`route.ts:42-44`). The client registers only `hello`, `op` and `onerror`.
  2. **The head seq is ignored.**
     - `hello` carries `{seq: latestCollabSeq}`, which the server comment calls the way a fresh client "gets head via hello, no replay gap". The client's `hello` handler never reads `e.data`, and `lastSeq` stays 0.
     - The server loop starts from `since=0` (`route.ts:26`), so `getCollabOpsSince(site, 0)` streams **every retained op of the last 24 h** (in batches of 200) into a client that has just loaded the current project. Those ops are re-applied through `messageHandler`.
  3. **The reconnect cursor is frozen.** The URL, including `?since=${this.lastSeq}`, is fixed when the `EventSource` is constructed (`:42-43`). EventSource's automatic reconnect reuses it, so after any drop the server replays everything since the original `since`.
- **Expected behavior:**
  - Seed `lastSeq` from `hello`.
  - Handle `resync` by reloading the project and reconnecting.
  - Reconnect manually with the current `lastSeq`.
- **Root cause:** a partial transport migration. The server protocol and the client handler were written to different contracts.
- **Affected modules:** Collaboration, Undo (`HistoryManager.applyRemoteOperation`), Autosave.
- **Recommendation:** fix in Agent D's collab batch, before any flag flip. Add a two-client integration test.
- **Status:** VERIFIED (code). NOT RUNTIME VERIFIED. Only reachable via `FEATURE_COLLAB`.

#### A14-9 — The only guard that Publish is ON in the production bundle runs nowhere
- **Severity:** P2
- **File:** `scripts/check-baked-flags.mjs:41-43`; `package.json:28`
- **Symbol:** `gate:baked-flags` (requires `NEXT_PUBLIC_FEATURE_PUBLISH="true"`)
- **Evidence:**
  - The editor Publish button and `onVercelPublish` are gated on `isFeatureEnabled("publish")` (`StudioHeader.tsx:220`, `TabRouter.tsx:210`), and the flag is baked in at build time.
  - The script's own header records that the flag was once `true` only by accident, because it came from a dev `.env.local`.
  - `grep` over `.github/`, `package.json` scripts, `packages/*/package.json`, `packages/editor/scripts/hooks` and `docs/cpanel-deploy.md` finds no invocation. This is the same shape as the `gate:figma` history in CLAUDE.md.
- **Expected behavior:** the check runs after every production `next build`.
- **Root cause:** the gate was written but never wired into a chain.
- **Affected modules:** Publish (editor), deploy.
- **Recommendation:** add it to the production build/deploy script or to `editor-dashboard-build.yml`, after `next build`.
- **Status:** VERIFIED (not wired). The production bundle value is NOT VERIFIED.

### P3

- **A14-11 — `StructurePopover`, `FourToolRail` and the legacy zone rail are unreachable in production.**
  - `editorViewMode.ts:70-75` returns `"figma"` when `!IS_DEV_BUILD`.
  - The footer Structure button renders only when `fourToolRail` is true (`StudioFooter.tsx:123,215`), yet `AquibraStudio.tsx:739` mounts the popover for everyone.
  - The inventory says these are "reachable by `?rail=`" and that the popover is "mounted"; that is true only in dev.
  - Recommendation: delete them, or give Structure a production door.
  - VERIFIED (code).
- **A14-12 — The Full Media "Trash" row is a stub.**
  - `FolderTree.tsx:446-453` renders "Trash" with `count={0}`. Its click is `addToast("Trash coming soon")` (`LibraryManager.tsx:864-866`).
  - Deletes are permanent (`media.service.ts:320-329`). The delete dialog says so honestly (`ConfirmDeleteModal.tsx:75-81`).
  - Recommendation: hide the row until soft-delete exists (PRODUCT DECISION).
  - VERIFIED.
- **A14-13 — ⌘⇧P "Export site" lands on the Settings Overview.**
  - It emits `UI_PANEL_OPEN {settings, screen:"export"}` (`useCanvasCommandPalette.ts:259-264`).
  - `SettingsTab` accepts only *screen* ids (`:78-81,318-324`), and `export` is a *door* (`constants.ts:102`), so `initialScreen` is ignored.
  - Recommendation: emit `UI_OPEN_EXPORTER` directly.
  - VERIFIED (code).
- **A14-14 — Dead or stale server and config halves.**
  - (a) `shared/constants/config.ts:227-246` is a second `FEATURES` / `isFeatureEnabled` registry with stale values (`VERSION_HISTORY: false // Not yet implemented` while History ships). It is re-exported and read nowhere.
  - (b) Scheduled publish has no UI (allowlisted), and its cron calls `startPublish(site, ws, user)` with no pages (`cron/scheduled-publish/route.ts:36`), which the worker refuses. If a UI is ever built on these endpoints, every scheduled publish will fail.
  - (c) `ai.getQuotaStatus`, `dashboard.quickActions` and `dashboard.recentSites` (NO-UI; `quickActions` hrefs rely on IA-v2 redirects).
  - VERIFIED.
- **A14-15 — The "Mentions" filter is mis-wired.**
  - The notifications "Mentions" tab (`notification-page.tsx:13`) filters on `MENTION_NOTIFICATION_TYPES` = SECURITY_* and PAYMENT_FAILED (`shared/schemas/notifications.ts:13-18`). @mentions do not exist.
  - The label points at a different destination than the one it names.
  - Owner: B/D.
  - VERIFIED.
- **A14-16 — Unreachable components and hooks: no importer by module path or symbol.**
  - Editor: `design-system/ui/ExportDropdown.tsx`, `shell/hooks/useDeviceZoom.ts`, `shell/hooks/useSaveState.ts` (referenced only by an e2e spec string), `shell/hooks/useTemplateManager.ts` (barrel-exported, never called, so its `deleteTemplate` is unreachable), `sidebar/tabs/media/data/mediaData.ts`.
  - Dashboard: `components/billing/limit-reached.tsx`, `components/comments/comment-preview.tsx`, `components/dashboard/recent-sites.tsx`, `components/dashboard/workspace-health.tsx`, `components/help/contextual-help.tsx`; also `agency/(tabs)/partner/partner-view.tsx` (deliberately closed).
  - VERIFIED (static scan plus a name grep).
- **A14-17 — Error events emitted with no listener, so failures are silent.**
  - Production paths:
    - `STORAGE_ERROR` (`StorageAdapter.ts:51`, local backup autosave)
    - `COMMAND_ERROR` (`CommandCenter.ts:126,141`, ⌘K registry commands)
    - `RUNTIME_FAULT_CAUGHT` (`RecoveryManager.ts:101`)
  - Behind the collab flag: `OT_DIVERGENCE_DETECTED` (`OTEngine.ts:144`), `COLLAB_SYNC_ERROR` (`CollaborationManager.ts:749`), `COLLAB_CONNECTION_LOST` (`:777`).
  - The remaining roughly 88 true orphans are lifecycle/telemetry notifications (DRAG_*, STYLE_*, PLUGIN_*, INTERACTION_*…). Those are acceptable, apart from the 81 declared-but-never-named constants, which are dead declarations.
  - VERIFIED.
- **A14-18 — 4 deterministic test failures are test drift, not product bugs.**
  - Confirmed by running them: 4 failed / 42 passed.
  - `CommandPalette.test.tsx`: it expects 21 commands and gets 23. The extra two are the v3-IA doors `templates-replace-layout` and `help-keyboard-shortcuts` (`CommandPalette.tsx:160-175`). The nav label is now "Open Add panel" because `tabsConfig.ts` says `label: "Add"`.
  - `CanvasEmptyCTA.test.tsx`: a source regex requires `label: "Insert"`.
  - The product wiring is correct: the UI_PANEL_OPEN chain is traced in row 3.
  - Recommendation: update the three assertions and the regex.
  - VERIFIED.
- **A14-19 — The verification tooling overstates or understates wiring health.**
  - (a) `event-graph.mjs:35-47` drops every file under `src/shared/` (`moduleOf` → null). Its listener regex (`:69`) matches only `EVENTS.X` or UPPER_CASE literals, so lowercase string listeners such as `"ui:toggle:templates"` (`useComposerInit.ts:452-455`) are missed. **29 of its 123 "strong orphans" do have listeners.**
  - (b) `check-trpc-orphans.mjs` counts any textual call as a caller. That includes callers in dead files (`dashboard.partner`, which is called only from the closed `partner-view.tsx`) and broken raw fetches (`ai.summarize`, `ai.milestoneSuggest`, A14-1).
  - (c) `link-audit.mjs:24` hard-codes `/Users/shahg/Desktop/pencil/buildrik`, so `pnpm run audit:links` crashes on any other machine or in CI. It also scans only `app/`.
  - VERIFIED.

---

## Good as-is

- **Rail → tab routing:** every `GROUPED_TABS_CONFIG` id has a `TabRouter` or `FullPageRouter` case, and `UI_PANEL_OPEN` validates against the same registry (`useEditorEventListeners.ts:145-160`). A former drift class has been fixed at the root.
- **Composer bus:** I found **no** event that is listened for but never emitted (scan plus a manual check).
- **Window events:** every window `CustomEvent` used by the app has both halves.
- **Editor → server contracts:** the editor publish, AI-action confirm and rollback all send or reuse a `pages` payload (`PublishService.ts:61-69`, `useAiActionGate.ts:68-71`, `publish.service.ts:591-599`).
- **Dashboard deep links:** all of them, from the site menu and from notification `actionUrl`s, resolve to real routes or anchors (`#site-health`, `#activity-log`, `?share=1`).
- **Wider link scan:** 0 dead internal links across the dashboard, lib, server, editor and emails (after the IA-v2 redirects).
- **Upgrade modal:** it has a real dispatcher (`openUpgrade`) and a real caller.
- **Honest stubs:** Integrations, Export Vue/Next.js, API tokens and AI credits "coming soon" are labelled as stubs and disabled.
- **Publish SSE:** there is an explicit fallback to tRPC polling after 3 failed reconnects (`use-publish-sse.ts:33-43`, `publish-progress.tsx:28-32`).
- **Issues panel:** it now has a real producer (DS lint) instead of an always-empty slot.

## Product decisions required

1. **Localization (A14-7):** ship translations and locale emission, or reduce the screen to the default language.
2. **Scheduled publish (A14-14b):** build the UI *and* make the cron supply pages, which means a server-side renderer or a stored last-published payload. Otherwise drop the three endpoints and the cron.
3. **Media Trash (A14-12):** add soft-delete plus Trash, or remove the row.
4. **Dashboard publish page (A14-5):** redirect to the editor, or delete it.
5. **Public API (row 36):** tokens can be minted but authenticate nothing. Launch `scopedProcedure` endpoints, or hide token creation.
6. **⌘K "Clear history" (A14-3):** keep it (with a confirm) or drop it.

## Overlaps with other audits

- **D (collab):** A14-8 and A14-17 collab events. Outbound `catch(()=>{})` op loss (row 40), the SSE permission re-check, and whole-project autosave vs the op log are theirs.
- **C / A12 (states):** silent AI-milestone failure (A14-1), and the silent `STORAGE_ERROR` / `COMMAND_ERROR` paths (A14-17).
- **B (IA):** the "Mentions" label (A14-15); two publish surfaces (now effectively one; A14-5); two command palettes.
- **E (architecture):** the dead-file list (A14-16), the duplicate flag registry (A14-14a), and raw fetch bypassing the typed client (A14-1).
- **F (security):** nothing new from wiring.
- **Prompt 20 (tests):** the mocks that encode the wrong wire format (A14-1), the copy tests that pin stale behaviour (A14-6), the emit-only assertions (A14-3, A14-4), and the scanner blind spots (A14-19).

---

## AUDIT HANDOFF

- **Agent / Prompt:** G, Verification & Test / Prompt 14: Functional Wiring & Application Integrity
- **Report:** `docs/audits/2026-09-25-full-audit/14-functional-wiring.md`
- **Counts:** P0 = 0 · P1 = 2 · P2 = 7 · P3 = 9
- **P0:** none.
- **P1:**
  - A14-1: the History AI Summary and milestone suggestions are dead, because a raw fetch bypasses superjson (always 400).
  - A14-2: 16 of 18 crons have no documented cPanel trigger, including account deletion and billing dunning.
- **P2:**
  - A14-3: ⌘K "Clear history" is a no-op.
  - A14-4: ⌘⇧P "Replace selected media" is a no-op unless Assets is active.
  - A14-5: an orphan dashboard publish page that always fails.
  - A14-6: stale "not wired" copy for Redirects and Forms, pinned by tests.
  - A14-7: the Localization controls have no downstream consumer.
  - A14-8: the collab SSE `resync`, head-seq and reconnect-cursor wiring (flag-off; P0-class if enabled).
  - A14-9: `gate:baked-flags` runs nowhere.
- **P3:** A14-11 to A14-19.
- **Runtime verified:**
  - The 4 failing unit tests (root cause confirmed).
  - The protocol-level 400 for A14-1, reproduced in-process with the repo's tRPC and superjson.
  - Unit tests pass over the A14-1, A14-4 and A14-6 defects.
  - The scanners were run.
- **NOT runtime verified:** everything in a live app or browser, which is every row of the wiring table. Also not verifiable from the repo: the production crontab, the baked value of `NEXT_PUBLIC_FEATURE_PUBLISH`, and whether a live Vercel deploy applies the redirects and form capture. Playwright was not run.
- **Blocking dependencies:**
  - A14-2 needs the owner to read the cPanel crontab.
  - A14-8 must be fixed before `FEATURE_COLLAB` is ever enabled.
  - A14-6 should be confirmed on one real deploy before the copy is changed.
- **Suggested fix batch:**
  - Wiring quick-fixes: A14-1, A14-3, A14-4, A14-13, A14-18.
  - Deploy hygiene: A14-2, A14-9, A14-19c.
  - Copy/honesty: A14-6, A14-12.
  - Collab transport: A14-8 (with D).
  - Product decisions: A14-5, A14-7, A14-14b.
