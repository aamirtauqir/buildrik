# R1 — Static feature map from the code graph (REA-based reverse-engineering audit, Part 1)

**Date:** 2026-10-20 · **Mode:** read-only static audit. Nothing in any repo was edited, staged, committed or stashed.
**Target:** worktree `~/Desktop/buildrik-worktrees/phase1-integration`, branch `feat/phase1-integration` (AI removed from the editor).

**Revision read.** Analysis started at `6dbe51b25`. The worktree moved mid-run to merge **`dc72314c2`** (BD-32..BD-37 plus 4177eccc3). What that means for each part of this report:
- **REA analyses** (`ev_cc6610f8…`, `ev_e1e8fed4…`, `ev_9d0372fe…`) were taken **before** the move. The editor tree digest is `b2d17728…` (pre-merge).
- **`server/`, `prisma/`, `packages/shared/`, `lib/`** have no diff between the two commits (`git diff --stat 6dbe51b25 HEAD -- server prisma packages/shared lib` is empty). The server procedure table therefore holds at `dc72314c2`.
- **The editor import graph** (§2.2) was re-run at `dc72314c2`. The unreachable set is identical.
- **The four surface inventories** (§4–§7) each re-checked, at `dc72314c2`, the rows that touch the 30 changed files, and say so in their own headers.

**Labels.** Every claim is **OBSERVED** (with an REA Evidence ID and/or a `file:line` that was read), **INFERRED** (the basis is stated) or **UNKNOWN**. In the surface inventories these are abbreviated O / I / U.
**Statuses.** WIRED = reachable from UI and does something · UNREACHABLE = code exists, no UI path · DEAD = no caller · STUB = renders but does nothing · FLAGGED-OFF = behind a flag that is off by default in production.
**Paths** are relative to `packages/editor/src/` unless they start with `packages/`, `server/`, `lib/` or `prisma/`.

---

## 1. Headline numbers

| Measure | Count | Basis |
|---|---|---|
| Editor source files (non-test `.ts/.tsx`) | 1,202 | §2.2 import graph, O |
| …reachable from the editor entry (`index.ts` → `AquibraStudio`) | 1,141 | O (script) |
| …unreachable (no production import path) | **61**: 36 barrel `index.ts` + 25 modules | O (script), spot-verified by grep |
| UI feature rows inventoried (§4–§7) | ~744 | sum of the four inventories. A few rows overlap (§7 also lists engine rows) |
| …WIRED / DEAD / STUB / FLAGGED-OFF / UNREACHABLE | 679 / 41 / 9 / 13 / 5 (+1 BROKEN, 3 partial or demo-only) | per-inventory totals |
| Composer managers | 31 fields: 22 WIRED (2 engine-internal), **4 DEAD** (plugins, forms, router, canvas.interactions), 1 FLAGGED-OFF (collab), 2 partial | §7.1 |
| tRPC procedures (35 routers, `server/trpc/router.ts`) | **317** | O (TypeScript-AST extraction, cross-checked against the `.query(`/`.mutation(` grep count = 317) |
| …with a production caller | 278 (13 of them through an `api()` / `sharing` indirection) | O (script + manual) |
| …with **no production caller** | **39** (2 of them referenced only by tests) | O (script, then a second looser grep) |
| Issues | **P0 0 · P1 46 · P2 146** | §9 (aggregated, de-duplicated where noted) |

No P0 is proven statically. The P1s closest to P0 are listed first in §9.1.

---

## 2. Method

### 2.1 REA runs (Evidence IDs)

| # | Operation | Input | Evidence ID | Result |
|---|---|---|---|---|
| E1 | `analyze_javascript_application` (directory, summary, record-and-continue) | `packages/editor/src` | parent **`ev_cc6610f86f9da17f382f8fda6a98fb40dd665503caeae72f5bce887412a41d98`**; summary view `ev_ad36b2f59138e8a746ecd19d5b626e1fd80a98ad3c2f1cf002f8eb387e4823d3` | 2,342 relevant files, 2,329 parsed, **0 parse failures**, 1,770,065 AST nodes. Graph 11,694 nodes / 13,730 edges. **Coverage partial**: 3,468 application unknowns, 52,675 semantic unknowns, parent result budget exhausted (O, from the summary) |
| E2 | `inspect_analysis_view` page modules | E1 | `ev_1630e23bf33360fc041e1fc160366bf1667da376767cb7c7a5268059db7afd42` | module identities, e.g. `engine/commands/stylePeers.ts` is recorded only as a `javascript-asset` (not analysed). O |
| E3 | `trace_application_feature` module `engine/styles/StyleManager.ts`, incoming | E1 | `ev_5516d921ced4c36a5528fc3abde8751a869bb17faa0f611a9b8b3734a28a1f4b` | **no-match**: REA itself says this is not evidence of absence. (No `StyleManager.ts` exists; the style manager is `engine/styles/StyleEngine.ts`, §7.1.) |
| E4 | `analyze_javascript_application` | `server/` | parent **`ev_e1e8fed44252a856d3705bdebac5cafbcb1915e10f5d196f33764eab54b9b701`**; summary `ev_ea3d141e5e20db6ba950a25ff3b6fcc61e0b88392f9571f58737c539d102ddfd` | 249 files parsed, 0 failures, 234,738 AST nodes; graph 3,020 nodes; semantic coverage partial (35,750 unknowns) |
| E5 | `trace_application_feature` module `trpc/router.ts`, outgoing | E4 | `ev_aac88bb1308f591f55e9fd3f2e0b470c86f3ca2b64f0aeafbbd70ee642e5bdcc` | 3 seed matches, 73 nodes. **All 70 import edges `resolution_status: not-found`** (O) |
| E6 | `analyze_javascript_application` | `packages/dashboard/app` | parent **`ev_9d0372feee2539b2259a51f061bc6e8e4b738395ea571136397d660a210af442`**; summary `ev_96a34ad0f2824c09eee6687e2a5ba3848841eb6347015932d1b07ac131b1fda2` | 185 files, 0 failures. **Application coverage complete**; semantic coverage unknown. 227 endpoint nodes |
| E7 | `trace_application_feature` module `edit/[id]` | E6 | `ev_5dc9b0dc78e8d5ffa9a7fc954a6d5f3a5bac1fed55a49ba8d08a31e9831a0706` | no-match (the route folder is `edit/[siteId]`) |
| E8 | `trace_application_feature` module `workers`, outgoing | E6 | `ev_f2f0fba9868ed3f855e92b1cb2ffc195cb831159eaab75349ab6a24ff657c372` | 17 seeds, 82 nodes, 94 edges; of 80 imports, 74 `external` (the `@server/*`/`@/` aliases) and 6 `not-found` (O) |
| E9 | `export_evidence_bundle` | session | `scratchpad/rea-editor-bundle.json`, `rea-bundle-2.json` (outside the repo) | used for the python counts in this section |

**REA findings used as evidence:**
- **(O, E6)** The dashboard graph holds **117 endpoint nodes whose literal equals a tRPC procedure path**. None of them is among the 39 procedures I found to have no caller, so REA independently agrees with §8.2.
- **(O, E1)** The editor graph has 35 `storage` nodes: localStorage keys such as `buildrik:ds-mode`, `ds-migration-backup-s1` and `buildrick-design-presets-…`, plus many `localStorage.clear` calls (test files). It also has 12 endpoint nodes, all string literals with no network meaning, e.g. `"Home › Hero"`.

### 2.2 REA limitations, recorded rather than hidden — and what replaced them

1. **TypeScript module resolution does not work (O, E1/E5/E8).** Of the editor's 6,226 import edges, 4,136 are `external`, **2,080 relative imports are `not-found`** (extensionless `.ts/.tsx` specifiers), and only **2 are `resolved`**. `@/…`, `@shared/…`, `@server/…` and `@buildrik/…` path aliases are classed as external packages (1,233 `@/` edges). The server trace shows the same thing (70/70 `not-found`). **The REA module graph therefore cannot answer reachability for this codebase.**
2. **Budget exhaustion (O, E1).** The parent result budget ran out partway through the editor. Only 905 of 2,329 parsed files have recorded import edges. Thousands of files (e.g. `engine/commands/stylePeers.ts`) are kept only as `javascript-asset` nodes, and their facts sit on the file node. Test files (≈1,100) consumed much of the budget.
3. **Semantic families partial.** call-flow has 13,081 unknowns, object-flow 13,558 and data-flow 10,178 (E1). No `trace_javascript_semantics` claim is made in this report.
4. **`modules: 0`** in every summary's statistics, i.e. REA did not recognise bundle modules. Expected for a source tree.
5. **Seeds are literal.** `trace_application_feature` matched nothing for StyleManager/`edit/[id]` (E3/E7), and REA states that this is not absence.

**Replacement (derived, reproducible).** Two scripts, kept outside the repo in the session scratchpad:
- **`scripts/graph.py`** — a TS-aware import graph. It handles static/dynamic `import`, `export … from` and `require`; resolves `@/`→`src`→root→dashboard (per `packages/editor/tsconfig.json` `paths`), `@shared/`, `@hooks/`, `@utils/` and `@buildrik/editor/src/`; and tries the `.ts/.tsx/index` extensions. BFS runs from `editor/shell/AquibraStudio.tsx` and `index.ts`, the only symbols the dashboard imports from the editor (O: `packages/dashboard/components/editor-route/EditorClient.tsx:9`, `app/share/[token]/draft-preview.tsx:63`). Runtime-only roots for `lib/publish-sliders.ts:24` and `lib/publish-widgets.ts:16-17` were added. 26 specifiers were unresolved, all `.css`.
- **`scripts/procs.cjs`** — walks every `router({...})` object with the TypeScript compiler API and gives the path, kind, base procedure and `file:line` of each of 317 procedures.
- **`scripts/callers.py`** — greps editor/dashboard/lib/shared/server (excluding the routers themselves) for `.<path>.(useQuery|useMutation|query|mutate|…)` and, separately, for `invalidate`/`fetch` refs and test-only references. Its 50 initial no-caller hits were then re-checked with a looser last-segment grep. That found the `const api = () => client.siteDetail.domains` / `.redirects` indirections (`DomainsScreen.tsx:182`, `RedirectsScreen.tsx:200`) and `PreviewShareModal.tsx:77` `sharing`, which reduced the count to 39.

### 2.3 Manual reading (read passes)
The UI inventories were produced by four read passes, each under the same labelling rule, reading code directly with grep/Read. Each one's `file:line` citations are its own. I re-verified the following §9 top items line by line myself at `dc72314c2`:
- cron `scheduled-publish/route.ts:30-45` and worker `[jobId]/route.ts:100,118-128`
- `useSectionReorder.ts:270-282` and `overlays/CanvasOverlayGroup.tsx:243,345-350`
- `useLibraryState.ts:310-322`
- the `getGlobalClasses` grep (one caller, no definition)
- `LintState.ts:37`
- `DataManager.ts:47`
- `useComposerInit.ts:36-46,770-840` (no `keepUnsaved` in the generic branch)

Prior work in `docs/audits/2026-10-20-webflow-reverse-audit/` was used only as leads; nothing was copied unverified. The 2026-10-14 docs were not used.

---

## 3. Entry points and surfaces (OBSERVED)

- **Route:** `packages/dashboard/app/edit/[siteId]/page.tsx`. It checks `auth()` and redirects to login with the deep link folded into `next`; calls `getEditorAccess` (**`@server/services` imported directly from a page**, which bypasses the tRPC layer the root CLAUDE.md requires: P2, O); forces `?view=readonly` for VIEWER; then renders `EditorClient`.
- **Client:** `EditorClient.tsx:8-11` dynamic-imports `@buildrik/editor` → `AquibraStudio` (`ssr:false`), with `key={siteId}` remount (:62).
- **Rail** (`editor/rail/tabsConfig.ts:248-250`, O): `RAIL_FIGMA = add, layers, pages, assets, content(CMS), design(Brand)`.
- **Off-rail panels** reached by shortcut, ⌘K or menus: templates (fullpage), components, settings (fullpage), publish, history, activity, review (agency-gated).
- **Routing:** `editor/sidebar/TabRouter.tsx:143-…` (panel tabs, lazy) and `FullPageRouter.tsx` (Templates, Brand, Settings).
- **Stale comment (P2, O):** `tabsConfig.ts:210-214` says `content` is "off-rail like review", but `RAIL_FIGMA` puts it on the rail at :249.

### Surface → inventory map

| Surface | Section | Rows | WIRED | DEAD | STUB | FLAGGED-OFF | UNREACHABLE |
|---|---|---|---|---|---|---|---|
| Topbar, site menu, shell hosts/banners/modals, global shortcuts, ⌘K palette, Add, Layers, Pages, Templates, Components | §4 (inv-A) | ~244 | 226 | 12 | 2 | 3 | 1 |
| Assets/Media, CMS, Brand, Settings, History/Versions, Review, Activity, Publish | §5 (inv-B) | 271 | 249 | 13 | 3 | 4 | 2 |
| Canvas (selection, drag ×4, resize, inline text, overlays, breakpoints, zoom, context menu, keyboard, comments) + Inspector (25 sections × element-type matrix) | §6 (inv-C) | 168 | 157 | 8 | 1 | 2 | 0 |
| Engine managers, persistence, export/publish pipeline, flags, export formats | §7 (inv-D) | 68 (overlaps) | 47 | 8 | 3 | 4 | 2 (+1 BROKEN, 3 partial) |

---



---

## 4. Feature inventory — topbar/shell, shortcuts, ⌘K, Add, Layers, Pages, Templates, Components

> Read pass output, included verbatim with headings demoted one level. Its labels (O/I/U, OBSERVED/INFERRED/UNKNOWN) and `file:line` citations are its own; its revision note is in its first lines.

### Inventory A — Topbar/shell, shortcuts, palette, left panels (static, read-only)

- Worktree: `~/Desktop/buildrik-worktrees/phase1-integration` (branch feat/phase1-integration).
- **Revision.** The audit started at `6dbe51b25`. HEAD moved to `dc72314c2` mid-run (merge BD-32..BD-37).
  - Re-checked at `dc72314c2`: PreviewOverlay.tsx, ConflictModal.tsx, useServerConflict.ts, defaultCommands.ts, Composer.ts, NewPageModal.tsx, ComponentDetailScreen.tsx.
  - Every other file in scope has no diff between the two commits (`git diff --stat 6dbe51b25 HEAD -- packages/editor/src`).
- Paths are relative to `packages/editor/src` unless stated.
- Every claim is labelled OBSERVED (I read that line), INFERRED (I say from what) or UNKNOWN.

#### Flag defaults (OBSERVED)

| Flag | Rule | Production status |
|---|---|---|
| `publish` | `shared/utils/featureFlags.ts:13-17` reads `runtimeEnv.ts`. A flag is true only when `VITE_FEATURE_X ?? NEXT_PUBLIC_FEATURE_X === "true"`, so the default is OFF. | `scripts/check-baked-flags.mjs:41-42` REQUIRES `NEXT_PUBLIC_FEATURE_PUBLISH="true"` in the prod bundle, so publish is INFERRED ON in prod. |
| `collab` | Same rule, default OFF. | `check-baked-flags.mjs:53-54` FORBIDS `"true"`, so it is OFF in prod: **FLAGGED-OFF**. |
| `dsAi` | Same rule, default OFF. | Not in scope here. |

Where the flags are read:
- `isFeatureEnabled` is called in StudioHeader.tsx:319 (collab), CommandPalette.tsx:285 (collab), useLifecycle.ts:111 (publish) and TabRouter.tsx:200 (publish).
- None of the five left panels call it.

---

#### 1. Topbar / shell

##### 1a. Topbar (StudioHeader → chrome-ui/Topbar)

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| ‹ Exit | Topbar.tsx:212; StudioHeader.tsx:880 | `exitToDashboard` StudioHeader.tsx:589 → `guardNavigation` :480 → `location.assign(DASHBOARD_URL/dashboard/projects)` | none | — | WIRED |
| ‹ Back to editing (view mode) | StudioHeader.tsx:880-881 | `toggleReadOnlyView` :594 (URL `?view=readonly`) | URL | role ≥ EDITOR (:313) | WIRED |
| Site crumb → Pages | Topbar.tsx:229-233; StudioHeader.tsx:875 | AquibraStudio.tsx:725 `guardedOpenLeftPanelToTab("pages")` | none | hidden in view mode | WIRED |
| Page crumb → close drawer | Topbar.tsx:248-252; StudioHeader.tsx:876 | AquibraStudio.tsx:726 `guardedCloseLeftPanel` | none | hidden in view mode | WIRED |
| Crumb shows "CMS" in the CMS workspace | StudioHeader.tsx:287-294 | `UI_CRUMB_CONTEXT` from cms/CmsWorkspace.tsx:139 | none | — | WIRED |
| Save pill click (by state) | StudioHeader.tsx:737-746 | saved, saving or unsaved → History tab (AquibraStudio.tsx:724). Error → `onSave` (useSaveCallback). Conflict → `serverConflict.reopenSaveConflict` (:730). Stalled → stall panel. Offline → no-op with hint (:747). | server (save) | hidden in view mode | WIRED |
| Stall panel "Save now" | StudioHeader.tsx:696-706 | `onSave()` | server | disabled while resizing (:682) | WIRED |
| Stall panel "Download a copy" | StudioHeader.tsx:707-721 | `downloadFile(composer.exportProject())` | local file | — | WIRED |
| Review chip → Review panel | StudioHeader.tsx:184-210, 858-859, 890 | AquibraStudio.tsx:729 opens tab "review" | none | null unless `reviewStatus.reviewsEnabled` (:188) | WIRED (server flag) |
| Comments toggle | Topbar.tsx:285; StudioHeader.tsx:829 | `composer.emit("ui:comment-mode")` | none | `reviewsEnabled` | WIRED |
| Preview (eye) | Topbar.tsx:316-320; StudioHeader.tsx:422-437 | `UI_TOGGLE_PREVIEW` → AquibraStudio.tsx:317-321 `buildPreview` → `renderPreviewHtml` | none | edit mode, plus VIEWER in view mode (:833-845) | WIRED |
| Presence avatars / connection pill | StudioHeader.tsx:892-915 | `useCollaboration` | — | `collab` flag | FLAGGED-OFF |
| Notifications bell + unread count | Topbar.tsx:298-300; StudioHeader.tsx:916-917 | `useUnreadCount` → NotificationService `fetchUnreadCount` (NotificationPanel.tsx:85-96) | server | — | WIRED |
| Publish CTA (Publish / Publish changes / … anyway / Send for review / Open feedback) | Topbar.tsx:330-381; StudioHeader.tsx:813-819, 924-931 | Review kinds → Review tab. Publish → AquibraStudio.tsx:569 `requestPublish` → door modal → `confirmPublish` :574 → `useExportHandlers.handleVercelPublish` | server (publish job) | `publish` flag via lifecycle.ts:237. Viewer, offline, conflict and save-failed block it (lifecycle.ts:236-243). Hidden when `nextMove===null` (live, clean). | WIRED (prod flag INFERRED on) |
| Blocked Publish (tooltip reason) | Topbar.tsx:348-372 | `onClick={() => {}}` with `aria-disabled` | — | — | WIRED (disabled by design) |
| Exit dialog: Stay / Leave anyway / Save & leave / Leave and lose changes | StudioHeader.tsx:1026-1093 | `saveAndLeave` :511 (3s race), `leaveAnyway` :552, `navigateBypassingUnloadGuard` | server | kinds dirty, risky, stranded (:488-505) | WIRED |
| beforeunload guard | StudioHeader.tsx:561-587 | native prompt when dirty, saving, shell-dirty or stranded mirrors | — | — | WIRED |
| Save-failed banner: Retry save / Retry save & leave / Keep editing | SaveFailedBanner.tsx:83-96; StudioHeader.tsx:1009-1022 | `retrySave` :541 | server | Retry hidden for a TOKENS_INVALID refusal | WIRED |
| Live announcement regions | StudioHeader.tsx:864-871, 781-804 | — | — | — | WIRED |
| ⌘K palette door, ⌘⇧P, site-menu row | StudioHeader.tsx:352-393 | see §2 | — | not in view mode, no modal open | WIRED |

##### 1b. Site menu (SiteMenu.tsx)

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Site settings ⌃, | SiteMenu.tsx:164-168 | AquibraStudio.tsx:722 opens tab "settings" | — | edit mode | WIRED |
| Export site… | :169-173 | StudioHeader.tsx:439 `handleExport` → `modals.openExporter` → ExportModal (StudioModals.tsx:165) | download | — | WIRED |
| Duplicate site → confirm | :174-178, 265-278 | StudioHeader.tsx:616 → `duplicateSite` (`sites.duplicate`), with a toast and an "Open" action | server | siteId present | WIRED (copy issue S-3) |
| Issues | :179-183 | AquibraStudio.tsx:728 `setIssuesOpen(true)` | — | — | WIRED |
| Activity log | :184-188 | opens tab "activity" (:727) | — | — | WIRED |
| Command palette ⌘K | :189-193 | `UI_TOGGLE_COMMAND_PALETTE` (StudioHeader.tsx:956) | — | — | WIRED |
| Enter view mode / Exit view mode | :194-196, 152-153 | `toggleReadOnlyView` | URL | role ≥ EDITOR. A VIEWER sees the explanatory label instead (:157). | WIRED |
| Keyboard shortcuts ⌘/ | :197-201 | `modals.toggleShortcuts` → KeyboardCheatSheet (StudioModals.tsx:169) | — | — | WIRED |
| Share preview link | :202-206, 264 | PreviewShareModal | server (`siteDetail.sharing`) | siteId | WIRED |
| Copy live URL | :207-211 | StudioHeader.tsx:847 `writeClipboardText`, with a toast on success or failure | clipboard | publishedUrl | WIRED |
| Getting started | :212-216 | `UI_ONBOARDING_REPLAY` (StudioHeader.tsx:973) | — | edit mode | WIRED |
| Start collaboration | :221-232 | `startCollab` StudioHeader.tsx:638 → `collab.manager.startSession` | — | `collab` flag. When off, a disabled "Planned" row is shown. | FLAGGED-OFF |
| Unpublish site… | :233-237 | StudioHeader.tsx:960-967 opens Publish tab and emits `UI_UNPUBLISH_REQUEST`. StudioPanels.tsx:402-413 latches it; PublishTab.tsx:241 handles it. | server | publishedUrl and role ≥ ADMIN (:310) | WIRED |
| View live site ↗ | :242-246 | `window.open` | — | publishedUrl | WIRED |
| Site health ↗ | :247-254 | dashboard `/dashboard/sites/:id#site-health` (anchor exists in dashboard components/site-detail/overview-tab.tsx) | — | siteId | WIRED |
| Invite teammates ↗ | :255-257 | `/dashboard/settings/team` | — | role ≥ ADMIN | WIRED |
| Account settings ↗ | :258 | `/dashboard/settings/account` | — | — | WIRED |

##### 1c. Shell hosts, banners and overlays

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| PageTabBar: tab click, Enter/Space, ←/→ focus | PageTabBar.tsx:86-111 | `elements.setActivePage` | none | pages > 0 | WIRED |
| PageTabBar "+" (label "Add page") | PageTabBar.tsx:124-129 | `UI_PANEL_OPEN {panel:"pages"}`. It does not create a page. | — | — | WIRED (copy issue S-4) |
| Preview overlay: ‹ Back to canvas, Esc | PreviewOverlay.tsx:237, 207-219, frame bridge :95 | `onDone` → AquibraStudio.tsx:306 `closePreview` | — | — | WIRED (re-checked at dc72314c2) |
| Preview: breakpoint switcher | PreviewOverlay.tsx:240 | local state | — | — | WIRED |
| Preview: page select; links to site pages | PreviewOverlay.tsx:243-256; postMessage bridge | `onShowPage` → `setActivePage` + `buildPreview` (AquibraStudio.tsx:845-848) | — | pages > 1 | WIRED |
| Preview: Share preview | PreviewOverlay.tsx:259 | PreviewShareModal | server | siteId | WIRED |
| Preview error: Try again / Copy error details / Back to editor | PreviewOverlay.tsx:281, 289, 294 | `buildPreview`; `navigator.clipboard.writeText` (no feedback) | — | Copy shown only when attempts > 1 | WIRED |
| PreviewShareModal: auto find-or-mint link on open | PreviewShareModal.tsx:76-83, 107-119 | tRPC `siteDetail.sharing.list` then `.create` | **server write on open** | — | WIRED |
| PreviewShareModal: Copy link / Open ↗ / Try again / Done | PreviewShareModal.tsx:151-156, 186-193, 176 | `writeClipboardText` + toast | — | — | WIRED |
| Notifications: row click | NotificationPanel.tsx:155-167, 298 | `markNotificationRead`, then `guardNavigation` to `actionUrl` | server | — | WIRED |
| Notifications: Mark all read | NotificationPanel.tsx:169-179, 216-218 | `markAllNotificationsRead`, error toast | server | rows > 0 | WIRED |
| Notifications: View all activity › | NotificationPanel.tsx:182-191, 361-368 | `onOpenActivity` opens the editor Activity tab. The `/dashboard/notifications` fallback is never used. | — | — | WIRED (issue S-9) |
| Notifications: Try again / Esc / ✕ | NotificationPanel.tsx:261-268, 147-153, 209 | `load()` | — | — | WIRED |
| Issues panel: Page/Site scope, filter chips | IssuesPanel.tsx:268-271, 287 | local state | — | — | WIRED |
| Issues: row → locate | IssuesPanel.tsx:357, 477 | AquibraStudio.tsx:622-639: `locateComment`, then publish-check fix pane, then token usage, then Brand | — | — | WIRED |
| Issues: Fix › (token) | IssuesPanel.tsx:401-409, 170-183 | AquibraStudio.tsx:644-661 `designSystem.applyAutoFix`, toast with Undo | engine (autosave) | `isFixable` | WIRED |
| Issues: Open Brand / Ignore for this token / Unignore | IssuesPanel.tsx:323-334, 532 | `requestBrandToken`; `lintState.suppress` / `unsuppress` | localStorage (LintState.ts:4-5) | — | WIRED |
| Issues: Rescan | IssuesPanel.tsx:243 | `issuesFeed.rescan` | — | — | WIRED |
| Issues: damage Fix › / Keep as written / unverified Open element / Dismiss | IssuesPanel.tsx:411-486 | `useLoadRepair.fix` / `.keep` | engine | hidden when `damageReadOnly` (view mode) | WIRED |
| Issues: ‹ Inspector back / ✕ close | IssuesPanel.tsx:213, 219 | `onBack` (StudioPanels) / `setIssuesOpen(false)` | — | — | WIRED |
| TimeTravel band: open | History tab button HistoryTab.tsx:199; ⌃⇧T TimeTravelHost.tsx:115-125 | `UI_TIME_TRAVEL_TOGGLE`. Composer is set read-only while active (:102-111). | — | — | WIRED |
| TimeTravel: ←/→ scrub, Enter confirm, Esc, Exit | TimeTravelHost.tsx:243-264, 295 | `history.getEntrySnapshot` + `renderProjectPages` | — | — | WIRED |
| TimeTravel: Restore… → Restore, discard N | TimeTravelHost.tsx:310-343, 207-241 | `versions.autoCheckpoint("Before restoring")`, then `history.restoreEntry`. If the checkpoint fails: error toast plus "Restore anyway". | engine + version | VIEWER sees aria-disabled with tooltip (:297-308) | WIRED |
| Compare overlay: open | `UI_COMPARE_OPEN` from HistoryTab.tsx:352/359, SavesChrome.tsx:137, ReviewTab.tsx:367 → CompareHost.tsx:61-76 | `loadSourcePages`, `fetchApprovedSnapshot`, `fetchPublishHistory` | server reads | — | WIRED |
| Compare: from/to pickers, Retry, mode (split/overlay/list), ✕ | CompareHost.tsx:133-170, 197, 222-224 | PublishDiffView / ApprovedCompareView | — | — | WIRED |
| Permissions modal | Settings SettingsTab.tsx:1076; ⌘K CommandPalette.tsx:154 → PermissionsHost.tsx:34-41 | — | — | role known | WIRED |
| Permissions → Delete site → typed confirm | PermissionsHost.tsx:52-71; DeleteSiteModal.tsx:55-69 | `deleteSite` (BuildrikSyncProvider), then SiteDeletedScreen | server | OWNER and siteId | WIRED |
| ViewerRoleNotice: View permission details | ViewerRoleNotice.tsx:34-43 | PermissionsModal | — | VIEWER right column (StudioPanels.tsx:901) | WIRED |
| RecoveryBanner: Discard & reload | RecoveryBanner.tsx:120-127, 136 | `localStorage.removeItem("buildrick-project")` + reload | localStorage | shown only when server known and older (:116) | WIRED |
| RecoveryBanner: Keep changes | RecoveryBanner.tsx:137 | `setDismissed(true)` only | none | — | WIRED (issue S-12) |
| LoadErrorBanner: Retry | LoadErrorBanner.tsx:108-121 | AquibraStudio.tsx:698 `location.reload()` | — | auth or network | WIRED |
| LoadErrorBanner: Sign in | LoadErrorBanner.tsx:103 | AquibraStudio.tsx:703 opens `/auth?reason=session-expired` in a new tab | — | auth | WIRED |
| LoadErrorBanner: Go to dashboard | LoadErrorBanner.tsx:105-106 | **calls `onSignIn`**, which opens `/auth?reason=session-expired` | — | missing or forbidden | WIRED (wrong target, S-1) |
| LoadErrorBanner: Dismiss | LoadErrorBanner.tsx:102 | `setLoadError(null)` | — | — | WIRED |

##### 1d. StudioModals and shell/modals

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| ExportModal: format chips, Download ZIP / React / HTML / CSS / All | export/ExportModal.tsx:436-450, 428-431 | `ExportEngine.generateZip`, `ReactExporter.exportZip`; failure goes to the `failed()` phase | download | — | WIRED |
| SaveTemplate | StudioModals.tsx:154-159; opened by ⌘K "Save page as template" (defaultCommands.ts:702 → useEditorEventListeners.ts:182) | `useStudioHandlers.handleSaveTemplate` :69; template sync queue with error toast | server (templateSync) + local | — | WIRED |
| KeyboardCheatSheet / KeyboardLegend | StudioModals.tsx:169-171 | — | — | — | WIRED |
| ImageEditorModal (lazy) | StudioModals.tsx:176-188; opened from LibraryManager / inspector | `imageEditorContext.onSave` | server (media) | — | WIRED |
| IconPickerModal | StudioModals.tsx:191-201 | `iconPickerContext.onSelect` | engine | — | WIRED |
| CollectionSetupModal (e-commerce) | StudioModals.tsx:204-214; opens once after the first product block insert (useComposerInit.ts:917-953) | `ProductCollectionService.createProductsCollection` | engine CMS | no products collection yet | WIRED |
| CreateComponentModal (one dialog, two triggers) | StudioModals.tsx:231-240; triggers `COMPONENT_CREATE_REQUESTED` (LeftSidebar.tsx:399), `COMPONENT_SAVE_AS_REQUESTED` (elementActions.ts:98) | `components.createComponent` + toast; then switches to Components (CreateComponentModal.tsx:85-112) | engine + server mirror | — | WIRED |
| CMSCollectionSetupModal | StudioModals.tsx:243-247; inspector CmsBindingSection.tsx:225 "New collection" | `collections.createCollection` → `UI_CMS_OPEN` (CMSCollectionSetupModal.tsx:213-222) | engine CMS + sync | — | WIRED |
| NewPageModal | StudioModals.tsx:162 (see §3 Pages) | — | — | — | WIRED |
| ConflictModal: Restore my edits / Save my edits to History / Keep the server version / show diff | ConflictModal.tsx:251-274, 230 | useServerConflict.ts:197-217 `versions.createVersion`, then reload after 1200ms (save variant); `onReplace`; `discardUnsaved` | local version + server | — | WIRED (re-checked at dc72314c2; S-13) |
| SessionExpiredModal: Keep editing / Retry save / Sign in | SessionExpiredModal.tsx:124-130, 72-84 | `saveProject`; `window.open(/auth?reason=session-expired)` | server | mid-session 401 | WIRED |
| UnsavedTabSwitchDialog: Leave anyway / Keep editing | UnsavedTabSwitchDialog.tsx:49, 59 | useTabSwitchGuard | — | Settings or CMS record dirty | WIRED |
| PublishErrorsConfirmModal: Fix first / Publish anyway | PublishErrorsConfirmModal.tsx:99-120; AquibraStudio.tsx:899-911 | Issues panel / next gate | — | gate `open-errors` | WIRED |
| PublishGateModal: primary (→ Review) / close | PublishGateModal.tsx:147-165 | `ui:switch-tab review` | — | `changes-requested` or a server reason | WIRED |
| StaleApprovalModal: Re-send / Publish anyway | StaleApprovalModal.tsx:242-248, 102-125 | `submitForReview`; `handlePublishAcknowledged` | server | gate `stale-approval` | WIRED (issue S-2) |
| PublishConfirmModal: Publish / Cancel | PublishConfirmModal.tsx:144-152 | `confirmPublish` → `handleVercelPublish` | server | gate `confirm` | WIRED |
| SendForReview + ReviewSentModal: Copy / Open / Try email again / Done | SendForReview.tsx:205, 263; ReviewSentModal.tsx:75-118 (inside ReviewTab, reachable via the review chip) | `submitForReview` (handles `inviteEmailSent===false`, SendForReview.tsx:124) | server | `reviewsEnabled` | WIRED |
| `handleExportHTML` (passed as `onExportHTML`) | useExportHandlers.ts:59; AquibraStudio.tsx:430, 733 | destructured at StudioHeader.tsx:270, never called | — | — | DEAD |
| `selectedElement` prop of StudioHeader | StudioHeader.tsx:104, 253 | destructured, never read | — | — | DEAD |

**Shell row counts (1a–1d):** 89 rows. 85 WIRED, 2 FLAGGED-OFF (presence, Start collaboration), 2 DEAD.

---

#### 2. Global keyboard shortcuts and ⌘K palette

##### How the listeners are layered (OBSERVED)

| Listener | Where | Behaviour |
|---|---|---|
| Registry | KeybindingManager.ts:56 | `window` capture phase, preventDefault, registered at Composer construction. |
| Registry gates | CommandCenter.ts:220-303 | In order: read-only blocks mutating commands; `[data-bk-owns-keys]`; a full-page surface allows only save; Escape carve-outs; text fields own the text chords; an aria-modal blocks ⌘ chords; bare keys stand down in fields and widget roles. |
| Shell | useEditorShortcuts.ts:220 | `window` bubble phase. Returns early on `isModalOpen()` (:98) and in editable fields (:110) except F6. Never checks `defaultPrevented`. |

##### Bindings

| # | Combo | Does | Handler | Conditions | Status |
|---|---|---|---|---|---|
| K-1 | ⌘S | `composer.saveProject()` | defaultCommands.ts:84 | works while typing; blocked in read-only and under an aria-modal | WIRED |
| K-2 | Del / ⌫ | delete (lock and instance guard, multi-delete confirm) | defaultCommands.ts:96-97; useCanvasKeyboard.ts:145 | bare key | WIRED |
| K-3 | ⌘G / ⌘⇧G | group / ungroup | :129 / :143 | — | WIRED |
| K-4 | ⌘D | duplicate | :157 | page rows own their ⌘D | WIRED |
| K-5 | ⌥⌘C / ⌥⌘V | copy / paste style (breakpoint and pseudo-state since dc72314c2) | :191 / :210 | text fields own them | WIRED |
| K-6 | ⌘C / ⌘X / ⌘V | element copy / cut / paste | :272 / :289 / :312 | text fields own them | WIRED |
| K-7 | ⌘] ⌘[ ⌘⇧] ⌘⇧[ | z-reorder | :466-490 | — | WIRED |
| K-8 | ⌘A | select all | :502 | — | WIRED |
| K-9 | Esc | deselect | :522 | escape-owner, popup and pick-mode carve-outs | WIRED (I-8) |
| K-10 | ⌘⇧E | toggle ExportModal | :563 → useComposerInit.ts:522/530 | — | WIRED |
| K-11 | ⌘\ | toggle inspector | :572 → StudioPanels.tsx:337 | — | WIRED |
| K-12 | ⌘⇧V | Paste HTML dialog | :580 → useEditorEventListeners.ts:143 | fires in text fields too (I-3) | WIRED |
| K-13 | ⌘Z / ⌘⇧Z / ⌘Y | undo / redo | useEditorShortcuts.ts:182-209 | not editable, not read-only, not a full-page surface | WIRED |
| K-14 | ⌘P | preview | useEditorShortcuts.ts:174 | — | WIRED |
| K-15 | ⌘⇧P | palette alias | useEditorShortcuts.ts:139 | — | WIRED |
| K-16 | ⌘K | toggle palette | StudioHeader.tsx:352-369 | not in view mode, no modal | WIRED (close via ⌘K is unreachable, I-6) |
| K-17 | ? | shortcuts sheet | useEditorShortcuts.ts:147 | — | WIRED |
| K-18 | ⌘/ | shortcuts sheet | :211 | — | WIRED (double-fire, I-5) |
| K-19 | Esc (shell) | close sheet | :215 | unreachable: the sheet is a modal and :98 returns first | DEAD branch |
| K-20 | F6 / ⇧F6 | cycle region focus | :104 → regionCycle.ts:83 | — | WIRED |
| K-21 | C | comment mode | :119 | `reviewsEnabled ?? true` (AquibraStudio.tsx:502) | WIRED (I-7) |
| K-22 | ⌘/Ctrl+, | Settings tab | :153 | macOS takes ⌘, | WIRED (I-4) |
| K-23 | ⌘/Ctrl+H | History tab | :158 | macOS takes ⌘H | WIRED (I-4) |
| K-24 | A T M L P ⇧A B S U H R D | rail and off-rail tabs | useSidebarKeyboard.ts:27-64; tabsConfig.ts:66-242 | no modifier, not in a field, no modal; R needs reviews; viewer gate | WIRED (U opens Publish even with the flag off; its CTA is disabled) |
| K-25 | ⌃⇧T | Time-travel | TimeTravelHost.tsx:115-125 | no guards | WIRED on macOS. INFERRED unreachable on Windows/Linux (browser reserves Ctrl+Shift+T). |
| K-26 | Esc / ← → / Enter (Time-travel active) | exit / scrub / confirm | TimeTravelHost.tsx:243-264 | — | WIRED |
| K-27 | ⌘1 / ⌘2 / ⌘0 / ⌘= / ⌘- | zoom | CanvasFooterToolbar.tsx:211-235 | — | WIRED |
| K-28 | ⌘; ⌘⇧; ⌘' ⌘B ⌘R ⌘⇧X | overlay toggles | CanvasFooterToolbar.tsx:237-246 | ⌘R overrides browser reload | WIRED |
| K-29 | Tab, arrows, ⌘/⇧/⌥+arrows, Home/End, ⇧F10 | canvas navigation, nudge, reorder, context menu | useCanvasKeyboard.ts:93-264 | canvas focused | WIRED |
| K-30 | / and ⌘F (Add panel) | focus Add search | BuildTab.tsx:178-201 | Add open | WIRED |
| P-1 | Esc (preview) | close preview | PreviewOverlay.tsx:207-219 + bridge | no modal | WIRED |

##### Palette rows (CommandPalette.tsx; recents in localStorage `buildrick:command-recents`, commandRecents.ts:11-30)

| Row(s) | Calls | Line | Status |
|---|---|---|---|
| Open Pages / Add / Layers / Assets / CMS / Brand / Publish / Templates / Review* / Activity / Site settings / Components | `UI_PANEL_OPEN` | 115-137 | WIRED (*Review only when `reviewsEnabled`) |
| Open Asset library | `UI_SWITCH_TAB` with `fullPage` | 119 | WIRED |
| New page | `UI_NEW_PAGE_REQUESTED` | 126 | WIRED |
| Replace layout with template… | `UI_BROWSE_TEMPLATES` | 128 | WIRED |
| Open Issues | `UI_OPEN_ISSUES` | 135 | WIRED |
| Keyboard shortcuts | `UI_TOGGLE_CHEAT_SHEET` | 138 | WIRED |
| Permissions | `UI_OPEN_PERMISSIONS` | 149-154 | WIRED |
| Undo / Redo / Clear history | `composer.history` directly | 193-201, 242-277 | WIRED (bypasses gates, I-1) |
| Duplicate, Replace media, Add text, Add container, Manage CMS records, Save page as template | `commands.run` | 203-226 | WIRED |
| Zoom rows | `setZoom` / `ZOOM_*` | 209, 251-260 | WIRED |
| Preview | `UI_TOGGLE_PREVIEW` | 210 | WIRED |
| Open History / Search stock photos | `UI_PANEL_OPEN` | 228 / 231 | WIRED |
| Start collaboration session | `startSession().catch(() => {})` | 285-296 | FLAGGED-OFF |
| Template / layer / asset / CMS-record search rows | various | 301-346, 443-472 | WIRED |
| Rest of the registry ("More" band) | `commands.run` | 353-371 | WIRED |
| Export HTML / Export JSON | `c.exportHTML()` / `c.exportJSON()`; the result is discarded | defaultCommands.ts:544-553 | STUB |
| Registry "Preview" (popup via `window.open` + `document.write`) | — | defaultCommands.ts:530 | WIRED (duplicate, I-9) |
| No-results "Search stock photos for '…'" | `UI_PANEL_OPEN` | 515 | WIRED |

**§2 counts:** bindings 31 rows (30 WIRED, 1 DEAD branch). Palette 19 rows (17 WIRED, 1 STUB, 1 FLAGGED-OFF).

---

#### 3. Left panels

##### Reachability

| Panel | Doors | Evidence | Status |
|---|---|---|---|
| Add | rail icon; `A` | tabsConfig.ts:293; LeftSidebar.tsx:209-245; useSidebarKeyboard.ts:56 | WIRED |
| Layers | rail icon; `L` | same | WIRED |
| Pages | rail icon; `P`; site crumb; tab-bar "+" | same; StudioHeader.tsx:875; PageTabBar.tsx:129 | WIRED |
| Templates (off-rail) | `T`; ⌘K (CommandPalette.tsx:123); Pages "From template" (PageList.tsx:143, 165 → LeftSidebar.tsx:507); Add "Page templates ›" (BuildTab.tsx:316); `UI_BROWSE_TEMPLATES` (StudioPanels.tsx:569-575, 618) | — | WIRED |
| Components (off-rail) | `⇧A`; ⌘K (CommandPalette.tsx:137); Add › Mine "Manage components ›" (BuildTab.tsx:307, GroupSection.tsx:512-525); after a create (CreateComponentModal.tsx:106); openMasterRequest.ts:29 | — | WIRED |
| Viewer role | only Layers of these five; others refused with a toast | tabsConfig.ts:316-326; StudioPanels.tsx:648-651 | WIRED |

No `isFeatureEnabled` in any of these panels. Gating is role (ADMIN to apply templates, VIEWER limited to Layers), Pro plan (premium templates) and view-mode read-only.

##### Add / Build

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Click element row to insert | GroupSection.tsx:301 | useBuildTab.ts:209 → useBlockInsertion.ts:35 (one transaction) | engine | — | WIRED |
| Drag element / block / saved component | GroupSection.tsx:295, 377, 477 | useBuildTab.ts:198, 204; dropOperations.tsx:286 | engine | — | WIRED |
| Block card click | GroupSection.tsx:374 | `onBlockClick` | engine | — | WIRED |
| Built-in component rows (click only) | GroupSection.tsx:458-465 | `onBlockInsert` | engine | — | WIRED |
| Insert own saved component | GroupSection.tsx:481 | BuildTab.tsx:105 `instantiateComponentAtSelection` | engine | — | WIRED |
| Insert from library | GroupSection.tsx:506 | BuildTab.tsx:113 → componentSync (tRPC `siteComponents.libraryGet`) | server + engine | siteId | WIRED |
| Favourite star | GroupSection.tsx:217-227 | useBuildTab.ts:157 | localStorage `BUILD_FAVORITES` | — | WIRED |
| Recents | useBuildTab.ts:139 | — | localStorage `BUILD_RECENT` | — | WIRED |
| Group expand / collapse | GroupSection.tsx:75 | BuildTab.tsx:152 | none | — | WIRED |
| Search; `/` and ⌘F | BuildTab.tsx:250, 177-203 | useBuildTab.ts:272 | none | — | WIRED |
| Search hit click / Enter / drag; Clear | SearchResults.tsx:133-140, 74 | same paths | engine | — | WIRED |
| Theme-toggle tile | SearchResults.tsx:116 | `onElClick` | engine | only while Dark mode is Auto (useBuildTab.ts:268) | WIRED |
| ⋯ › Paste HTML… | BuildTab.tsx:236-245; PasteHtmlModal.tsx:70 | sanitised inside `insertBlock` | engine | — | WIRED |
| Paste modal reads the clipboard on open | PasteHtmlModal.tsx:43-46 | `navigator.clipboard.readText` | — | browser permission | WIRED |
| Page templates › | BuildTab.tsx:316 | `UI_PANEL_OPEN` | — | — | WIRED |
| First-use tip OK / Esc | FirstUseTip.tsx:28, 45, 76 | — | localStorage `BUILD_TIPS_SEEN` | — | WIRED |
| Header close / help | BuildTab.tsx:213-216 | — | — | — | WIRED |

##### Layers

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Row click; ⇧/⌘ multi-select | LayerTreeItem.tsx:229 | useLayerSelection → `composer.selection` | none | — | WIRED |
| Expand chevron; ←/→ | LayerTreeItem.tsx:270, 177-182 | `toggleExpand` | localStorage `buildrick-layers-<page>-expanded` (useLayerTree.ts:175) | — | WIRED |
| ↑/↓ roving focus; Enter/Space select | LayerTreeItem.tsx:183-200, 169 | — | — | — | WIRED |
| Delete / ⌫ on row | LayerTreeItem.tsx:163-167 | `commands.run("delete")` | engine | read-only refused (CommandCenter.ts:152) | WIRED |
| F2 / double-click rename | LayerTreeItem.tsx:172, 241 | useLayerActions.ts:246, 256 → `renameElement` | engine | not locked, not read-only | WIRED |
| Eye "Dim in editor" | LayerTreeItem.tsx:359-370 | useLayerActions.ts:124 | localStorage `buildrick-layers-<page>-hidden` (editor-only) | hidden in read-only | WIRED |
| Lock | LayerTreeItem.tsx:390-399 | `lock-element` / `unlock-element` | engine | hidden in read-only | WIRED |
| Drag reorder / nest | LayerTreeItem.tsx:213-230; layers/index.tsx:113-188 | `moveElement` inside a transaction | engine | — | WIRED |
| Refused-drop alert | layers/index.tsx:134-162, 549 | — | — | — | WIRED |
| Context menu: Cut / Copy / Paste / Duplicate / Delete | LayerContextMenu.tsx:85-107 | useLayerContextActions.ts:46-96 `commands.run` | engine | not read-only | WIRED |
| Context menu: Delete (2+ rows, confirm) | layers/index.tsx:469, 375 | `delete {confirmed}` | engine | — | WIRED |
| Context menu: Rename / Group / Move to page… / Copy link | LayerContextMenu.tsx:112-135 | useLayerActions.ts:285, 317; useLayerContextActions.ts:61-75 (`?el=&page=` read by useDeepLink.ts:49) | engine / clipboard | locked refused | WIRED |
| ⋯ › Expand all / Collapse all / Display settings (5) / Widen | LayersTab.tsx:244-257 | useLayersState.ts:133 | localStorage | — | WIRED |
| Search; Search everywhere; Clear | LayersTab.tsx:266; layers/index.tsx:505-511 | palette | — | — | WIRED |
| Footer: Select mode / Select all / Deselect all / Done | LayersTab.tsx:318-352 | `layers:select-all`, `selection.clear` | — | — | WIRED |
| Escape ladder: select mode → deselect → close | LayersTab.tsx:178-202 | — | — | — | WIRED (collapses, I-8) |
| "Show normally in editor" | layers/index.tsx:566-575 | `toggleVisibility` | localStorage | — | WIRED |
| Tree-error Retry; hover sync | LayersTab.tsx:43-47, 204 | remount; `LAYER_HOVER` | — | — | WIRED |
| `panels/layers/hooks/index.ts` barrel | — | no importer (rg) | — | — | DEAD |

##### Pages

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Click / Enter switch page | PageRow.tsx:243, 252 | usePages.ts:202 | none | — | WIRED |
| + Add page / Create blank page / ⌘K New page | AddPageButton.tsx:44; PageList.tsx:161 | `UI_NEW_PAGE_REQUESTED` → NewPageModal.tsx:76-91 | engine | — | WIRED (dc72314c2) |
| NewPageModal "From template" → Choose template… | NewPageModal.tsx:78-82 | `UI_BROWSE_TEMPLATES` | — | — | WIRED (dc72314c2) |
| Footer From template | AddPageButton.tsx:57 | — | — | — | WIRED |
| ⋯ › New folder | AddPageButton.tsx:87 | useFolders | server `pages.folders.*` + localStorage `pg-folders-v1-<site>` | — | WIRED |
| Rename (F2, double-click, menu) + Keep / Update URL | PageRow.tsx:253, 354; RenameUrlDecision.tsx:35-38 | usePages.ts:215 | engine | — | WIRED |
| Duplicate (⌘D, menu) | PageRow.tsx:266 | usePages.ts:245 | engine | — | WIRED |
| Delete (⌫, menu) | PageRow.tsx:269; PagesTab.tsx:236 | usePages.ts:282, Undo toast | engine | not homepage, not only page | WIRED |
| Set as homepage / Replace layout / Copy link / Remove from folder | PageContextMenu; PagesTab.tsx:265; usePages.ts:342, 369 | — | engine / clipboard / server | — | WIRED |
| Page settings… drawer (Done, Cancel, ⌘S, ✕, scrim guard, SEO link) | PageSettingsDrawer.tsx:69-206; SearchListingsTable.tsx:96 | usePageSettings.ts:237 | engine | — | WIRED |
| Drag reorder; drag into folder | PageRow.tsx:146-180; PageFolder.tsx:107-318 | `reorderPage`; `movePageToFolder` | engine / server | — | WIRED |
| Folder: collapse, rename, delete (pages kept, no confirm), select all | PageFolder.tsx:164-272 | useFolders | server + localStorage | — | WIRED |
| Select mode; Space / ⌘ / ⇧-click; Select all; Done; Esc | PagesTab.tsx:399, 372, 253-260; PageList.tsx:183-200 | useBulkSelect | — | — | WIRED |
| Bulk Duplicate / Move / Delete | BulkToolbar.tsx:48-52; PagesTab.tsx:286-344 | — | engine / folders | — | WIRED |
| ⋯ › Listings / Show structure / Reload / Widen; Open full listings › | PagesTab.tsx:402-415, 454; SearchListingsTable.tsx:135 | `onExpandToggle` | — | — | WIRED (P-7) |
| Structure tree click; Search; Search everywhere; Dynamic-pages hint | SiteStructureTree.tsx:50; PagesTab.tsx:426, 470; PageList.tsx:360 | — | — | — | WIRED |
| `pages/utils/keyboardShortcuts.ts` | — | test-only import | — | — | DEAD |

##### Templates (full page)

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Card / sidebar row → preview | TemplatesTab.tsx:481, 534 | — | — | — | WIRED |
| Create page → confirm | TemplatesTab.tsx:500, 618-630 | `runApply` :318-326 (`createPage`, nav, `importHTMLToActivePage`) | engine; recents in localStorage; sessionStorage | ADMIN (:153); Pro for premium (:156) | WIRED |
| Replace page → ReplaceModal (backup on by default) | TemplatesTab.tsx:501, 167, 191 | `versions.autoCheckpoint` + import | engine + version | ADMIN / Pro | WIRED |
| Replace-mode Use for / Cancel; backup-failed Retry / Replace without / Cancel | :538, 526, 603-610 | — | — | — | WIRED |
| Success "Open page settings"; error Retry / Try again / dismiss; progress Cancel | :632-668, 548-563 | `UI_PAGES_OPEN_SETTINGS` | — | — | WIRED |
| Used-on page row; Back; Esc; Reload my templates; Undo toast | :506, 455-462, 432-440, 491, 367-381 | `captureUndo` | engine | — | WIRED |
| `useTemplateApply` exports (8: requestApply, confirmApply, cancelApply, completeApply, failApply, resetApply, progress, applyState) | hooks/useTemplateApply.ts:116-167 | no caller | — | — | DEAD |
| `clearAppliedId` import | TemplatesTab.tsx:20 | unused | — | — | DEAD |

##### Components

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Row click / Enter → detail; row drag | ComponentsTab.tsx:260-263, 261 | useComponentsState.ts:94 | engine | — | WIRED |
| + Create component (header, empty, footer) | ComponentsTab.tsx:215, 232, 363 | LeftSidebar.tsx:365 → `COMPONENT_CREATE_REQUESTED` | engine + server `siteComponents.upsert` (componentSync.ts:56) | — | WIRED |
| ‹ Add back row | ComponentsTab.tsx:63 | `UI_SWITCH_TAB add` | — | — | WIRED |
| Error Retry | ComponentsTab.tsx:128 | `setError(null)` only | — | — | STUB |
| Detail: Insert / Push to master… (+ Undo) / Detach all / Duplicate / Delete / inline rename / Used-on / Back / Esc | ComponentDetailScreen.tsx:145-438 | `instantiate`, `updateComponentMaster` / `revertComponentMaster`, `detachInstance`, `duplicateComponent`, `deleteComponentWithUndo`, `updateComponent` | engine + server mirror | Push only from the root of an instance (`canPush`) | WIRED (Push re-checked at dc72314c2) |
| List-level delete ConfirmDialog | ComponentsTab.tsx:370-382 | opener `handleDelete` (useComponentsState.ts:113) has no caller | — | — | UNREACHABLE |
| `handleInstantiate`, `handleDuplicate`, `handleDetailInsert` (empty body) | useComponentsState.ts:103, 142, 207 | — | — | — | DEAD |
| `compactMode` empty-state branch | ComponentsTab.tsx:158-178 | no caller passes it | — | — | DEAD |

**§3 counts (from the fork's fuller enumeration, ~105 rows):** 94 WIRED, 1 STUB, 1 UNREACHABLE, 9 DEAD, 0 FLAGGED-OFF. The tables above merge some of those rows.

---

#### 4. Issues

##### Shell (topbar, menu, hosts, modals)

| ID | Sev | Issue | Evidence | Label |
|---|---|---|---|---|
| S-1 | P1 | The banner's "Go to dashboard" button (site missing or forbidden) calls `onSignIn`, which opens `/auth?reason=session-expired` in a new tab. The copy and the destination disagree, and a user who lost access is told their session expired. | LoadErrorBanner.tsx:105-106; AquibraStudio.tsx:703 | OBSERVED |
| S-2 | P1 | The stale-approval Re-send ignores `SubmitOutcome.inviteEmailSent`. It always toasts "A fresh review round is on its way to {email}", even when the server reports that the mail did not go. SendForReview handles this case (SendForReview.tsx:124). Also, AquibraStudio's `resendReview` emits `REVIEW_SENT` without checking the outcome; whether its consumer surfaces the outcome is UNKNOWN. | StaleApprovalModal.tsx:105-118; ReviewService.ts:104-110, 118-137; AquibraStudio.tsx:561-563 | OBSERVED |
| S-3 | P2 | The Duplicate-site confirm says "The copy opens in a new tab once it's ready". The code only shows a toast with an "Open" action; nothing opens on its own. | SiteMenu.tsx:274; StudioHeader.tsx:618-628 | OBSERVED |
| S-4 | P2 | The page tab bar's "+" is labelled "Add page" but only opens the Pages panel. | PageTabBar.tsx:124-129 | OBSERVED |
| S-5 | P2 | Dead props. `onExportHTML` (the `handleExportHTML` zip path) is passed but never called. `selectedElement` is destructured and never read. | StudioHeader.tsx:104, 141, 253, 270; AquibraStudio.tsx:430, 716, 733; useExportHandlers.ts:59 | OBSERVED |
| S-6 | P2 | A comment says "the live chip below carries the status" when the CTA is withheld. Topbar removed the Live chip in C3. A live site with no changes therefore shows no publish state in the bar at all. | StudioHeader.tsx:920-923; Topbar.tsx:15; lifecycle.ts:416 | OBSERVED |
| S-7 | P2 | `SaveTemplate html={composer?.exportHTML().combined}` runs a full export on every StudioModals render, even while closed. `handleSaveTemplate` re-exports on save anyway. | StudioModals.tsx:157; useStudioHandlers.ts:72 | OBSERVED (cost INFERRED) |
| S-8 | P2 | Two copy actions fail silently. Preview "Copy error details" uses `void navigator.clipboard?.writeText` with no feedback. ReviewSentModal's copy failure only resets `copied`. | PreviewOverlay.tsx:289; ReviewSentModal.tsx:62-65 | OBSERVED |
| S-9 | P2 | "View all activity ›" in Notifications opens the editor Activity tab. The `/dashboard/notifications` fallback, which the comment says is the full list, is unreachable because StudioHeader always passes `onOpenActivity`. The bell counts every unread notification, but the panel lists only 5. | NotificationPanel.tsx:182-191, 354-358; StudioHeader.tsx:992 | OBSERVED (that Activity does not list notifications is INFERRED) |
| S-10 | P2 | Notification reads fail silently. A failed `markNotificationRead` is swallowed by an empty catch. An unread-count fetch error shows 0, which reads as "all caught up". | NotificationPanel.tsx:157-161, 88-90 | OBSERVED |
| S-11 | P2 | The share dialog is titled "Share preview of {page}" and its toast names the page, but the token is site-level (`/share/<token>`). Opening the dialog also creates a server ShareLink as a side effect. | PreviewShareModal.tsx:76-83, 129-131, 147 | OBSERVED (page vs site scope of `/share` INFERRED) |
| S-12 | P2 | RecoveryBanner's "Keep changes" only hides the banner. Nothing pushes the recovered local draft to the server, while the banner says it "may not be on the server yet". | RecoveryBanner.tsx:132-137 | OBSERVED (whether autosave later writes it is INFERRED) |
| S-13 | P2 | The conflict dialog's "Save my edits to History" (save variant) writes a local version and then reloads after 1.2 s. The server mirror goes through the version-sync retry queue, which StudioHeader itself documents is dropped by navigation, so the version may exist on this device only. | useServerConflict.ts:67, 197-217; VersionTimelineManager.ts:157-181; StudioHeader.tsx:497-505 | INFERRED |
| S-14 | P2 | The session-expired sign-in URL is built in two places with the same literal. | AquibraStudio.tsx:703; SessionExpiredModal.tsx:66 | OBSERVED |
| S-15 | P2 | Fake loading: `handleExport` flips `exportLoading` for a fixed 500 ms, unrelated to any work. | StudioHeader.tsx:439-443 | OBSERVED |

##### Shortcuts and palette

| ID | Sev | Issue | Evidence | Label |
|---|---|---|---|---|
| I-1 | P1 | Palette Undo, Redo and Clear history call `composer.history` directly, and Add text / Add container are not in `MUTATING_COMMANDS`. They skip the read-only, full-page and Time-travel gates that ⌘Z respects. During Time-travel (a non-modal `role=region`), ⌘K → Undo can mutate the live document. | CommandPalette.tsx:193-201, 242-277; CommandCenter.ts:67-73, 152; TimeTravelHost.tsx:102-111, 284 | OBSERVED code; reachability INFERRED |
| I-2 | P1 | The palette's Export HTML / Export JSON rows compute the export and discard it. | defaultCommands.ts:544-553 | OBSERVED |
| I-3 | P1 | ⌘⇧V is not text-owned. Inside text fields and canvas inline edit it opens Paste HTML and kills the browser's paste-as-plain-text. | CommandCenter.ts:45, 272-291; defaultCommands.ts:580 | OBSERVED; effect INFERRED |
| I-4 | P1 | On macOS the cheat sheet prints ⌘, and ⌘H, which the browser owns (⌘H hides the browser). The site menu prints ⌃, for the same action. | keyboardSheetRows.ts:57, 154-155; useEditorShortcuts.ts:27-30; SiteMenu.tsx:79-85 | OBSERVED |
| I-5 | P2 | With Add open, ⌘/ both focuses the Add search and opens the sheet. | BuildTab.tsx:182-201; useEditorShortcuts.ts:211 | OBSERVED; INFERRED double-fire |
| I-6 | P2 | ⌘K and ⌘⇧P cannot close the palette, because the palette is itself a modal and the `isModalOpen` guard returns first. | StudioHeader.tsx:362-366; CommandPalette.tsx:575-577 | OBSERVED |
| I-7 | P2 | The C shortcut treats an unknown `reviewsEnabled` as on, while the button and the palette treat it as off. | AquibraStudio.tsx:502; StudioHeader.tsx:829; CommandPalette.tsx:133 | OBSERVED |
| I-8 | P2 | The registry's window-capture Esc `deselect` still runs under every layered Escape, because those use stopPropagation, not stopImmediatePropagation. Preview has no key ownership, so Del / ⌘D act on the hidden canvas. | PreviewOverlay.tsx:207-219; LayersTab.tsx:180-200; CommandCenter.ts:256-302 | OBSERVED; ordering INFERRED |
| I-9 | P2 | Duplicate implementations: Preview (shell overlay vs registry popup); Open exporter vs Open export settings; Undo/Redo as registry commands and as palette rows. | defaultCommands.ts:530, 563, 729-738; CommandPalette.tsx:193-250 | OBSERVED |
| I-10 | P2 | Collaboration start and CMS record loads in the palette swallow their errors. | CommandPalette.tsx:293, 450 | OBSERVED |
| I-11 | P2 | Undocumented bindings (⌃⇧T, /, ⌘F). The legend misdescribes ⌘K as focusing the shell search. | keyboardSheetRows.ts:109-160; KeyboardLegend.tsx:23 | OBSERVED |
| I-12 | P2 | Dead Escape branch in useEditorShortcuts. | useEditorShortcuts.ts:98, 215-217 | OBSERVED |
| I-13 | P2 | Stale comments: "⌘J → AI tab" (AI removed); palette page rows; Ctrl+D claim. | useEditorShortcuts.ts:15, 27; CommandPalette.tsx:11-12; useCanvasKeyboard.ts:5 | OBSERVED |
| I-14 | P2 | When a modal is open or the editor is read-only, ⌘S and ⌘P skip preventDefault, so the browser's Save and Print dialogs open. | KeybindingManager.ts:50-52; useEditorShortcuts.ts:98, 169-177 | OBSERVED; browser effect INFERRED |
| I-15 | P2 | Rail letters fire inside a `<select>`, in widget roles, and on `defaultPrevented` events. | useSidebarKeyboard.ts:29-38 | OBSERVED |
| I-16 | P2 | Palette recents are global across sites, and CMS-record recents never re-match. | commandRecents.ts:11; CommandPalette.tsx:474-492 | OBSERVED |
| I-17 | P2 | ⌃⇧T has no modal, typing or role guard. | TimeTravelHost.tsx:115-125 | OBSERVED |

##### Left panels

| ID | Sev | Issue | Evidence | Label |
|---|---|---|---|---|
| P-1 | P1 | "+ Add page" is enabled in the loading skeleton and NewPageModal has no load guard. A page created before load is wiped by `importProject` with no undo, as the code's own comments say. | PageList.tsx:130-145; NewPageModal.tsx:51-91; usePages.ts:105-114 | OBSERVED code; loss INFERRED |
| P-2 | P1 | A failed Templates "Create page" leaves the new page behind, while the toast says "nothing was changed". Retry then creates a second page. | TemplatesTab.tsx:318-337, 219-221, 362-363, 653 | OBSERVED; Retry duplicate INFERRED |
| P-3 | P1 | Components Retry only clears the error, so the user lands on an empty list. | ComponentsTab.tsx:128; useComponentList.ts:45-61 | OBSERVED; effect INFERRED |
| P-4 | P2 | Component Duplicate gives no feedback and has no catch. Detach all and Push to master also lack a catch, so failures become unhandled rejections. | ComponentDetailScreen.tsx:153-159, 180, 268; ComponentsTab.tsx:139-151 | OBSERVED |
| P-5 | P2 | A failed library read goes to `console.warn` and returns `[]`. The "From library" group silently vanishes. | componentSync.ts:190-193 | OBSERVED |
| P-6 | P2 | The list-level component delete dialog is unreachable, and its handlers are dead or empty. | ComponentsTab.tsx:370; useComponentsState.ts:103, 142, 207-209 | OBSERVED |
| P-7 | P2 | "Open full listings ›" toggles width, so it narrows a drawer that is already wide. | PagesTab.tsx:454; SearchListingsTable.tsx:135 | INFERRED |
| P-8 | P2 | The replace banner promises a backup first, but the backup can be unticked or skipped. | TemplatesTab.tsx:525, 194, 605 | OBSERVED |
| P-9 | P2 | ⌘S in the page-settings drawer does not stop propagation, so the registry's project save also fires. | PageSettingsDrawer.tsx:70-79; useSaveCallback.ts:428 | OBSERVED; double-fire INFERRED |
| P-10 | P2 | Stale comment: it says single-page delete raises no toast, but `deletePage` raises an Undo toast. | PagesTab.tsx:527-530; usePages.ts:308-318 | OBSERVED |
| P-11 | P2 | `localStorage` writes are not wrapped in try/catch. | useLayersState.ts:136; useBuildTab.ts:42 | OBSERVED |
| P-12 | P2 | begin/endTransaction blocks have no try/finally. | layers/index.tsx:180-182; useLayerActions.ts:302-310, 330-332 | OBSERVED |
| P-13 | P2 | Dead code: layers hooks barrel; `useLayerDrag` wrapper; `pages/utils/keyboardShortcuts.ts`; 8 unused `useBuildTab` returns; 8 unused `useTemplateApply` exports; `clearAppliedId` import. | useLayerDrag.ts:16-27; TemplatesTab.tsx:20; hooks/useTemplateApply.ts:116-167 | OBSERVED |
| P-14 | P2 | Pass-through `handleHelpClick` (CLAUDE.md rule 1). | useComponentsState.ts:223 | OBSERVED |
| P-15 | P2 | Side effects inside `setState` updaters (unsafe under StrictMode). | useLayerActions.ts:126-133, 154-160 | OBSERVED |
| P-U1 | — | Whether a looped bulk page delete lands as one undo step. | usePages.ts:330; PagesTab.tsx:541-547 | UNKNOWN |

#### 5. Totals

**Rows (about 247 in all):**

| Section | Rows | WIRED | Other |
|---|---|---|---|
| Shell | 89 | 85 | 2 FLAGGED-OFF, 2 DEAD |
| Shortcuts | 31 | 30 | 1 DEAD |
| Palette | 19 | 17 | 1 STUB, 1 FLAGGED-OFF |
| Left panels | ~105 | 94 | 1 STUB, 1 UNREACHABLE, 9 DEAD |

By status: WIRED 226 · FLAGGED-OFF 3 · STUB 2 · UNREACHABLE 1 · DEAD 12.

**Issues:** P0 0 · P1 9 (S-1, S-2, I-1 to I-4, P-1 to P-3) · P2 38 · UNKNOWN 1.


---

## 5. Feature inventory — Assets, CMS, Brand, Settings, History, Review, Activity, Publish

> Read pass output, included verbatim with headings demoted one level. Its labels (O/I/U, OBSERVED/INFERRED/UNKNOWN) and `file:line` citations are its own; its revision note is in its first lines.

### Inventory B — Assets · CMS · Brand · Settings · History · Review · Activity · Publish

Static, read-only audit. Worktree `/Users/shahg/Desktop/buildrik-worktrees/phase1-integration` (branch feat/phase1-integration).
**Revision read:** started on `6dbe51b25`; worktree moved mid-run to `dc72314c2` (merge BD-32..BD-37). `git diff --stat 6dbe51b25 dc72314c2` over every directory in this inventory (sidebar/tabs/{media,content,settings,history,review,activity,publish}, services/, design-system/, media/, cms/, panels/, shell/PublishHistory.tsx) touches only `sidebar/tabs/component-library/*` and `sidebar/tabs/pages/components/NewPageModal.tsx`, which are outside these surfaces. So no row here needed re-checking. The listed `engine/Composer.ts` change was not re-read: rows citing `Composer.ts` line numbers (CMS §2) may have shifted. OBSERVED (diff stat).

Paths are relative to `packages/editor/src` unless they start with `packages/` or `server/`.
Labels: OBSERVED = I (or a forked sub-reader of this same audit) read the line. INFERRED = derived, and the basis is stated. UNKNOWN = not determined.
Method note: §1–§4 were read by forked sub-readers working under the same rules. §5–§8 were read directly.

#### Flag baseline (OBSERVED)
- `shared/utils/featureFlags.ts:13-17`: there are only three client flags, `publish`, `dsAi` and `collab`. Each comes from `runtimeEnv.ts` as `VITE_X ?? NEXT_PUBLIC_X === "true"`, so it defaults OFF.
- `publish`: root CLAUDE.md says `gate:baked-flags` requires `NEXT_PUBLIC_FEATURE_PUBLISH="true"` in the prod bundle. So publish is treated as **ON in prod** (INFERRED from the CLAUDE.md gate description; the bundle was not checked).
- `dsAi`: OFF unless set. Per CLAUDE.md the server's `theme.extractBrandFromUrl` also returns NOT_FOUND unless the flag is set, so this is **FLAGGED-OFF** (INFERRED: not set in prod per the "No AI this version" memory; not verified on the server env).
- `reviewsEnabled` is a server flag (agency_layer) from `reviews.status`. When it is false or null, `TabRouter.tsx:241` renders nothing for `review`, and `LeftSidebar.tsx:227,350` removes the rail button and the R shortcut. OBSERVED.

#### 5. History / Versions (OBSERVED unless marked)

Route: rail `history` (`rail/tabsConfig.ts:187-196`, shortcut H). It renders through `sidebar/TabRouter.tsx:209-235` into `sidebar/tabs/history/HistoryTab.tsx`. It has three views: Session, Saves and Published (`HistoryTab.tsx:225`).
Persistence model:
- **Session** is the engine undo stack, in memory only. It is cleared on reload, and the copy says so (`SavesChrome.tsx:178`).
- **Saves** are `VersionTimelineManager` versions, stored in IndexedDB `aquibra-versions` (`services/versionSync.ts:2-4`). Create, rename and delete are mirrored best-effort to `siteVersions.*` through a `SyncRetryQueue`. On open, `hydrateVersionsFromServer` pulls down up to 20 missing versions (`versionSync.ts:118`). A failed mirror raises a sticky toast with "Retry now" (`shell/hooks/useVersionSync.ts:67-90`).
- **Published** is server data (`sites.publishHistory`).

| Feature | Entry file:line | Calls file:line | Persistence | Gating | Status |
|---|---|---|---|---|---|
| View tabs Session / Saves / Published | HistoryTab.tsx:225-240 | local state; the last view is stored in `buildrick-history-view-<site>` (:101,147-155) | localStorage | — | WIRED |
| Deep link to a view (`from-activity:*`, `published`) | TabRouter.tsx:37-40,214-215 | `initialView` | none | — | WIRED |
| "‹ Activity" back row | HistoryTab.tsx:242-244 | emits `UI_PANEL_OPEN {panel:"activity"}` | none | — | WIRED |
| ⋯ menu › Search changes/saves | HistoryTab.tsx:183-192, 247-281 | local filter | none | Session/Saves only | WIRED |
| Search result band + "Clear search" | HistoryTab.tsx:292-309 | local | none | Saves only | WIRED |
| ⋯ › Time-Travel (⌃⇧T) | HistoryTab.tsx:193-203 | emits `UI_TIME_TRAVEL_TOGGLE`, handled by `shell/TimeTravelHost.tsx:130` | none | — | WIRED |
| Time-Travel band › Restore… › confirm | TimeTravelHost.tsx:314,341,207-235 | `versions.autoCheckpoint("Before restoring")` then `history.restoreEntry` | engine (+ a version in IndexedDB/server) | — | WIRED |
| Time-Travel failure toast "Restore anyway" | TimeTravelHost.tsx:229-238 | `history.restoreEntry` | engine | — | WIRED |
| ⋯ › Clear undo history… + ConfirmDialog | HistoryTab.tsx:204-214, 389-399 | `useHistoryState().clear` | engine (memory) | disabled for VIEWER or when nothing to undo (:206) | WIRED |
| Session row timestamp › "Restore to hh:mm?" confirm | components/ActivityView.tsx:466-474, 347-380 | `composer.history.restoreEntry` (:294,300,309), with a crossfade | engine (memory) | VIEWER sees a disabled control (:446-460) | WIRED |
| Session row expand / "Show all N changes" | ActivityView.tsx:439, 514-523 | local | none | — | WIRED |
| Session error state + Retry | ActivityView.tsx:547-557 | `onRetry` prop | — | — | DEAD (HistoryTab.tsx:326-330 never passes `error` or `onRetry`) |
| Session "+ Save a version" footer → SaveVersionModal | HistoryTab.tsx:381-386; version-history/SaveVersionFooter.tsx:69-74; SaveVersionModal.tsx:33-44 | `versions.createVersion(name,"")` (SaveVersionFooter.tsx:28), then `VERSION_CREATED` → `mirrorVersionCreate` → `siteVersions.create` (versionSync.ts:63) | IndexedDB + server mirror | disabled with tooltip for VIEWER (:51-65) | WIRED |
| SaveVersionModal suggestion chips / clear | SaveVersionModal.tsx:72,76 | local | none | — | WIRED |
| Saves list (VersionHistoryPanel) + skeleton + load-error Retry | panels/VersionHistoryPanel.tsx:331-352 | `useVersionHistory` → `versions.getVersions` / `reloadVersions` (shared/hooks/useVersionHistory.ts:76,144-149) | IndexedDB | — | WIRED |
| Saves filter (Named / Auto / author) | version-history/SavesFilter.tsx:90-115; VersionHistoryPanel.tsx:287-297 | local | none | — | WIRED |
| Saves row ⋯ › View details → details modal | VersionList.tsx:291-299; VersionHistoryPanel.tsx:481-526 | local | none | — | WIRED |
| Row ⋯ › Name this version… (inline rename) | VersionList.tsx:300-311; VersionHistoryPanel.tsx:242-250 | `versions.updateVersion` + `mirrorVersionRename` → `siteVersions.rename` (versionSync.ts:87) | IndexedDB + server | VIEWER disabled | WIRED |
| Row ⋯ › Restore to draft… → centred confirm | VersionList.tsx:312-323; VersionHistoryPanel.tsx:386-405, 189-216 | `versions.restoreVersion`, which runs a safety `createVersion` and then `composer.importProject` (engine/VersionTimelineManager.ts:283-325) | engine; the draft reaches the server through autosave (INFERRED: importProject → dirty → `sites.saveProject`) | VIEWER disabled | WIRED |
| Restore banner + "Undo restore" / dismiss | VersionHistoryPanel.tsx:407-440 | `restoreVersion(safetyId)` | as above | — | WIRED |
| "Older auto-saves were removed" notice | VersionHistoryPanel.tsx:443-450 | listens to `VERSION_PRUNED` | none | — | WIRED |
| Row ⋯ › Compare with current (inline) | VersionList.tsx:324-332; VersionHistoryPanel.tsx:253-268, 534-541 | `versions.compareWithDraft`, rendered by inline `CompareView` | none | — | WIRED |
| Details modal › Compare with current / Restore this save… | VersionHistoryPanel.tsx:491-519 | same handlers | — | VIEWER disabled | WIRED |
| Row ⋯ › Delete… + inline confirm | VersionList.tsx:333-345, 255-265; VersionHistoryPanel.tsx:227-236 | `versions.deleteVersion` → `VERSION_DELETED` → `mirrorVersionDelete` → `siteVersions.delete` (versionSync.ts:106) | IndexedDB + server | VIEWER disabled | WIRED |
| Hover snapshot preview | VersionList.tsx:349-355 | `version.visualSnapshot` | — | — | WIRED |
| APPROVED band + "Compare with current" | components/SavesChrome.tsx:117-147 | emits `UI_COMPARE_OPEN {approved,current}`, rendered by `shell/CompareHost.tsx` → `reviews.approvedSnapshot` (ReviewService.ts:252) | server read | only when an approved review exists | WIRED |
| Retention note (session cap / version cap) | SavesChrome.tsx:170-182 | reads `history.maxHistory` / `versions.maxVersions` | — | — | WIRED |
| Published list (PublishHistory) + Retry | HistoryTab.tsx:344-366; shell/PublishHistory.tsx:186-205, 284 | `sites.publishHistory` (PublishService.ts:273), `sites.get` (:230) | server | — | WIRED |
| Published row ⋯ › View details / Compare with current / Compare with v(n-1) | PublishHistory.tsx:386-420 | emits `UI_COMPARE_OPEN` → CompareHost → `PublishDiffView` → `sites.publishDiff` (:334) / `sites.publishedSnapshot` (:341) | server read | — | WIRED |
| Published row ⋯ › Republish vN… → confirm → progress → outcome modals | PublishHistory.tsx:421-437, 652-690, 238-262, 529-640 | `sites.rollback` (PublishService.ts:290), then `publishJob.track(jobId)` (TabRouter.tsx:232) | server | ADMIN only, shown disabled with a reason otherwise (:144) | WIRED |
| Version-sync failure toast "Retry now" | shell/hooks/useVersionSync.ts:67-90 | `retryVersionSync` | server | — | WIRED |
| Cross-device hydrate on open | useVersionSync.ts:38-43; versionSync.ts:118-226 | `siteVersions.list` (:139), `siteVersions.get` (:191) | IndexedDB ← server | — | WIRED |

#### 6. Review (agency layer) (OBSERVED unless marked)

Route: `TabRouter.tsx:237-249`. The panel renders only when `reviewsEnabled` is true; the rail button below the divider is `LeftSidebar.tsx:227`, and the shortcut is R. The `useEditorShortcuts` C-shortcut treats an unknown flag as ON (`shell/AquibraStudio.tsx:502`), while the panel treats unknown as OFF (TabRouter.tsx:241).

| Feature | Entry file:line | Calls file:line | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Load round + comments; loading skeleton; error + Retry | ReviewTab.tsx:224-234, 613 | `reviews.currentRound` (ReviewService.ts:218), `comments.list` (:192) | server | reviewsEnabled | WIRED |
| Send for review (empty state / no round) | ReviewTab.tsx:842-857, 1212; shell/SendForReview | `reviews.submit` (ReviewService.ts:126), with `exportPublishPages` as the snapshot | server | VIEWER disabled | WIRED |
| ⋯ › Compare rounds | ReviewTab.tsx:405-412, 366-371 | emits `UI_COMPARE_OPEN {approved, current}` | server read | needs a round | WIRED (label mismatch, see issue R-3) |
| ⋯ › Round history › modal (lazy, retry) | ReviewTab.tsx:414-421, 211-227; RoundHistoryModal.tsx | `reviews.rounds` (ReviewService.ts:240) | server | — | WIRED |
| ⋯ › Open current review link | ReviewTab.tsx:426-429, 380-383 | `window.open(DASHBOARD_URL/review/<token>)` | — | only while the token is live | WIRED |
| ⋯ › Re-send / Send a new link / Send for review again → confirm | ReviewTab.tsx:433-452, 1176-1190, 342-361 | `onResend` → `AquibraStudio.resendReview` (:544-562) → `reviews.submit` | server | VIEWER disabled | WIRED |
| ⋯ › Revoke link / Withdraw request → confirm | ReviewTab.tsx:453-466, 1041-1044, 323-340 | `reviews.revoke` (ReviewService.ts:267) | server | VIEWER disabled | WIRED |
| Banner "Next ›" (walk open comments) | ReviewTab.tsx:985-997 | `locateComment` (locate.ts): page switch + select | engine selection | — | WIRED |
| Row click / "Locate ›" → "Comment located" block / Edit / Back | ReviewTab.tsx:698-712, 1029-1032 | `locateComment`; `onClose` | — | — | WIRED |
| Row Resolve / Reopen; failure line + Retry | ReviewTab.tsx:660-676, 285-303, 586-589 | `comments.resolve` (ReviewService.ts:318) | server | VIEWER disabled | WIRED |
| Row "Copy link" | ReviewTab.tsx:729, 513-521 | clipboard (`elementDeepLink`) | — | — | WIRED |
| Detached group › Reattach comment → ReattachModal (list or pick on canvas) | ReviewTab.tsx:770-787, 1139-1172 | `comments.reattach` (ReviewService.ts:311); emits `comments:reattach-start` | server | VIEWER disabled | WIRED |
| Resolved group expand / "Earlier resolved" | ReviewTab.tsx:826 | local | — | — | WIRED |
| Page comment composer + Send / "Retry send" | ReviewTab.tsx:1099-1129, 269-283 | `comments.create` (ReviewService.ts:286) | server | VIEWER disabled | WIRED |
| "‹ Activity" back row | ReviewTab.tsx:479 | emits `UI_PANEL_OPEN` | — | — | WIRED |
| Notice line (revoke/resend/email-failed/copied) | ReviewTab.tsx:323-361 | — | — | — | WIRED |

#### 7. Activity (OBSERVED unless marked)

Route: `TabRouter.tsx:206-207`. It is off-rail. The ways in are ⌘K "Open Activity" (`shell/modals/CommandPalette.tsx:134`), `onOpenActivity` from the site menu / notifications (`shell/AquibraStudio.tsx:727`) and the back rows in History and Review.

| Feature | Entry file:line | Calls file:line | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Activity list (loading / empty / error / permission) | tabs/activity/ActivityLogView.tsx:105-146, 200-245 | `activity.recent` (services/ActivityService.ts:57), which throws a typed `ActivityReadError` | server | — | WIRED |
| Filter chips All / Edits / Comments / Publish | ActivityLogView.tsx:173-184 | refetches with the server-side filter | server | — | WIRED |
| Retry | ActivityLogView.tsx:221 | `load(filter)` | — | — | WIRED |
| "Open in dashboard" (permission state) | ActivityLogView.tsx:238 | opens `DASHBOARD_URL/dashboard/sites/<id>#activity-log`; the route exists (`packages/dashboard/app/dashboard/sites/[id]/page.tsx`), and so does the anchor (`components/site-detail/overview-tab.tsx`, grep) | — | — | WIRED |
| Row click → comment opens Review; publish opens History›Published; edit opens History›Session | ActivityLogView.tsx:252-256; ActivityTab.tsx:31-38 | emits `UI_PANEL_OPEN` | — | — | WIRED (opens the panel, not the specific item; INFERRED from the payload, which carries only `kind`) |

#### 8. Publish panel (OBSERVED unless marked)

Route: rail `publish` (`tabsConfig.ts:173-186`, shortcut U), rendered by `TabRouter.tsx:190-204`. The CTA and the topbar share ONE door, `requestPublish` (`shell/AquibraStudio.tsx:569,788`). That door opens `PublishConfirmModal` (:925), whose confirm runs `useExportHandlers.runPublish` → `exportPublishPages` (CMS gate + `cms.publishSnapshot`) → `usePublishJob.publish` → `sites.publish`. Status is then polled with `sites.publishStatus`.

| Feature | Entry file:line | Calls file:line | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Pre-publish checks list + Retry | PublishTab.tsx:388-430, 945-955; PrePublishChecks.tsx | `sites.prePublishChecks` (PublishService.ts:308) | server | — | WIRED |
| Check row "Fix ›" doors | PublishTab.tsx:516-530, 118-124 | emits `UI_SETTINGS_OPEN` / `ui:switch-tab` | — | — | WIRED |
| Vercel row "Connect" | PublishTab.tsx:509-519 | opens `DASHBOARD_URL/dashboard/settings/integrations` (route exists) | — | — | WIRED |
| Client approval row / gate banner "Open ›" | PublishGateBanner.tsx:60-121, 27-34 | emits `UI_OPEN_ISSUES` / `REVIEW_STATUS_RETRY` / `ui:switch-tab review` | — | review gate | WIRED |
| "Release to" › Production row (open Domains) | PublishTab.tsx:964-969 | emits `UI_SETTINGS_OPEN {domains}` | — | — | WIRED |
| "Release to" › Preview deployment row | PublishTab.tsx:970-975; usePublishSnapshot.ts:183 | value hard-coded `null`, so it always shows "None" | — | — | STUB |
| "Changes in this session" collapsible | PublishTab.tsx:985-1024; usePublishSnapshot.ts:159-168 | undo stack entries after the last deploy | memory | — | WIRED (misleading after reload, issue P-2) |
| "Last deploy" collapsible + "All versions ›" | PublishTab.tsx:1028-1050 | `sites.publishHistory` (usePublishSnapshot.ts:111) | server | — | WIRED |
| Publish to production CTA → PublishConfirmModal → publish | PublishTab.tsx:1107-1122; shell/modals/PublishConfirmModal.tsx; useExportHandlers.ts:82-121 | `sites.publish` (PublishService.ts:94), `cms.publishSnapshot` (cmsSync.ts:492), thumbnail POST `${DASHBOARD_URL}/api/site-thumbnail/<id>` (shell/captureThumbnail.ts:79) | server | `isFeatureEnabled("publish")` (TabRouter.tsx:200); without it the footer shows "Connect Vercel" | WIRED (flag ON in prod, INFERRED) |
| Approval-gate modal (pending / changes-requested / stale) + "Publish anyway" | shell/AquibraStudio.tsx:884; modals/PublishGateModal.tsx; modals/StaleApprovalModal.tsx | `publishSite(...,true)` acknowledge (usePublishJob.ts:312) | server | review flag | WIRED |
| Progress + Cancel | PublishTab.tsx:760-800 | `sites.cancelPublish` (PublishService.ts:183) | server | — | WIRED |
| Cancelled state + restart | PublishTab.tsx:823-840 | — | — | — | WIRED |
| Failure block: "Check status" (poll lost) / Repair / build log modal / Back to Publish | PublishTab.tsx:570-640, 1100-1104 | `publishJob.track`, `publishJob.reset` | — | — | WIRED |
| Result: View live site / "Compare v(n-1) → v(n)" | PublishTab.tsx:876-891 | the compare button emits `ui:switch-tab {history}` only | — | — | WIRED (copy mismatch, issue P-1) |
| Post-deploy follow-up: Retry forms / Retry post-deploy | PublishTab.tsx:900-933 | `sites.retryFormsActivation` (:158), `sites.retryPostDeploy` (:163) | server | — | WIRED |
| ⋯ › All versions › | PublishTab.tsx:480-488 | emits `UI_PANEL_OPEN history/published` | — | — | WIRED |
| ⋯ › Unpublish site… → typed UNPUBLISH confirm (also from the site menu) | PublishTab.tsx:489-500, 237-276, 1183-1190; UnpublishConfirmModal.tsx:27-95 | `sites.unpublish` (PublishService.ts:319) | server | only when live (:458); **no client role gate** (INFERRED: no role read in PublishTab; server authz UNKNOWN) | WIRED |
| No-publish-path footer "Connect Vercel" | PublishTab.tsx:443-453, 1085-1089 | opens integrations | — | shown when the flag is off | WIRED (copy issue P-3) |
| Topbar publish-state hydrate on mount | usePublishJob.ts:384-405 | `sites.get` (PublishService.ts:230) | server | — | WIRED (silent fallback, issue P-5) |
| Completion / failure toasts + "Try again" | useExportHandlers.ts:150-192 | — | — | — | WIRED |

##### Issues — History / Review / Activity / Publish

**History (H)**
- **[P1] H-1: Session restore and Time-Travel restore do the same action with different safety.** Time-Travel saves a "Before restoring" auto-checkpoint before `restoreEntry` (`shell/TimeTravelHost.tsx:224-238`). The Session list's restore calls `composer.history.restoreEntry` directly, with no checkpoint (`sidebar/tabs/history/components/ActivityView.tsx:285-318`). The confirm copy at `ActivityView.tsx:366-368` does say the later steps are permanently discarded, so the copy is honest. OBSERVED.
- **[P2] H-2: Inline Compare duplicates the CompareHost.** Saves-row "Compare with current" expands an inline `CompareView` (`panels/VersionHistoryPanel.tsx:253-268, 534-541`), while every other Compare door goes through the shell's "one Compare", `CompareHost`, via `UI_COMPARE_OPEN` (`HistoryTab.tsx:351-363`, `SavesChrome.tsx:137`, `ReviewTab.tsx:367`). That is two compare implementations. OBSERVED.
- **[P2] H-3: A failed safety save shows a load error.** When the safety save fails, `restoreVersion` emits `VERSION_LOAD_FAILED` (`engine/VersionTimelineManager.ts:304-306`). `useVersionHistory` maps that event to `loadError`, so the Saves panel swaps to "Couldn't load version history" (`useVersionHistory.ts:62-65`, `VersionHistoryPanel.tsx:331`) on top of the correct restore-failed toast. OBSERVED.
- **[P2] H-4: Dead error branch in ActivityView.** Its `error` / `onRetry` props and error UI (`ActivityView.tsx:84-85, 547-557`) are never passed by `HistoryTab.tsx:326-330`. OBSERVED.
- **[P2] H-5: Stale comment about who embeds PublishHistory.** The comment says PublishHistory is the "Same component the Publish panel embeds" (`HistoryTab.tsx:342-343`), but PublishTab does not import PublishHistory; its only importer is HistoryTab (grep). OBSERVED.
- **[P2] H-6: Save toast names a tab that does not exist.** The save toast says "It is available in Saved versions." (`version-history/SaveVersionFooter.tsx:34`), but the tab is labelled "Saves" (`HistoryTab.tsx:33`). OBSERVED.
- **[P2] H-7: Version-mirror failures are console-only.** Mirror failures go to `console.warn` (`services/versionSync.ts:71,97,108`), but they surface through the queue's onError toast (`useVersionSync.ts:67`), so this is OK. The hydrate failure is console-only with no UI (`versionSync.ts:222-224`), so a teammate's versions silently do not appear. OBSERVED.
- **[P2] H-8: Locally pruned auto-saves can be re-hydrated from the server.** Local prune (`VersionTimelineManager.ts:1002-1016`) emits only `VERSION_PRUNED`, never `VERSION_DELETED`, so no server delete is mirrored. The server prunes on its own (`server/services/site-version.service.ts:105-118`). If the local and server caps or ordering differ, `hydrateVersionsFromServer` can re-insert auto-saves that were pruned locally (`versionSync.ts:194`). INFERRED (from those lines; caps not compared).

**Review (R)**
- **[P1] R-1: A failed re-send gives no message.** `doResend` is try/finally with no catch (`ReviewTab.tsx:342-361`). A rejected `reviews.submit` (`AquibraStudio.tsx:560`) becomes an unhandled rejection: no notice, and the confirm is already closed. OBSERVED.
- **[P2] R-2: Post-mutation refresh failures are swallowed.** `reload()` swallows every error (`ReviewTab.tsx:266-275`), so after a successful resolve or reply a failed refresh leaves a stale list with no signal. OBSERVED.
- **[P2] R-3: "Compare rounds" does not compare rounds.** The menu item (`ReviewTab.tsx:405-412`) opens approved-vs-current (`:366-371`). OBSERVED.
- **[P2] R-4: Panel and C shortcut disagree on an unknown flag.** While the status is loading, `reviewsEnabled` null means panel off (`TabRouter.tsx:241`) but C-shortcut on (`AquibraStudio.tsx:502`). OBSERVED.
- **[P2] R-5: Failed snapshot on re-send sends without a preview, and the user is not told.** The failure is console-only (`AquibraStudio.tsx:548-551`). OBSERVED.

**Activity (A)**
- **[P2] A-1: Rows open a panel, not the item.** Rows open only the panel kind. `onOpenRow(kind)` drops the row's id and `actionUrl` (`ActivityTab.tsx:31-38`, `ActivityLogView.tsx:255`), so "Open in …" lands on the list, not the item. OBSERVED.

**Publish (P)**
- **[P1] P-1: The Compare button does not open a compare.** "Compare v(n-1) → v(n)" only emits `ui:switch-tab {tab:"history"}` (`PublishTab.tsx:882-889`). History then opens on its stored or default view, Session (`HistoryTab.tsx:121-128`), with no compare. OBSERVED.
- **[P1] P-2: "Nothing has changed since the last deploy" can be false.** That line (`PublishTab.tsx:1011-1013`) and the "No new changes" CTA come from the in-memory undo stack (`usePublishSnapshot.ts:159-168`). The panel's own comment says the stack "is 0 on every load because HistoryManager empties the undo stack when a project opens" (`PublishTab.tsx:~283`). After a reload with unpublished saved edits, the section says nothing changed. (The CTA itself is guarded by `jobId`, :287; the section copy is not.) OBSERVED.
- **[P1] P-3: The "Connect Vercel" footer gives the wrong reason when the flag is off.** If `NEXT_PUBLIC_FEATURE_PUBLISH` is off, `onRequestPublish` is undefined (`TabRouter.tsx:200`), and the panel shows "Connect Vercel" (`PublishTab.tsx:443-453, 1085-1089`) even for a workspace that is connected. The real cause is the build flag. OBSERVED (prod impact INFERRED to be none if the baked-flags gate holds).
- **[P2] P-4: Preview row is a stub.** "Preview deployment" always reads "None" (`usePublishSnapshot.ts:183`). OBSERVED.
- **[P2] P-5: A failed hydrate on mount looks like a draft.** Topbar hydrate failure is swallowed into draft UI (`usePublishJob.ts:394-396`). A live site can then read "Publish" (draft) after a network blip. The comment admits it. OBSERVED.
- **[P2] P-6: Unpublish is offered to roles that cannot use it.** It is offered to every role that can open the panel (`PublishTab.tsx:458,489-500`; no role read), while the server requires ADMIN (`server/trpc/routers/sites.ts:694`). A non-admin gets a server error toast instead of a disabled control. Republish, by contrast, is admin-gated in the UI (`PublishHistory.tsx:144`). OBSERVED.
- **[P2] P-7: Raw event strings instead of the constant.** `"ui:switch-tab"` is used as a raw string (`PublishTab.tsx:122,886`; `PublishGateBanner.tsx:33`) instead of `EVENTS.UI_SWITCH_TAB` (`shared/constants/events.ts:341`). It works (same string), but it is hygiene. OBSERVED.
- **[P2] P-8: Publish sends the browser's in-memory project, not the server copy.** The HTML is rendered from the local composer (`shell/exportPublishPages.ts:66-90`), with no save or flush before `sites.publish` in `useExportHandlers.ts:82-110`. INFERRED from the absence of a save call; whether the server requires a saved revision is UNKNOWN (there is a stale-approval / revision gate, `usePublishJob.ts:310-314`).

#### 4. Settings (fullpage) — sub-reader, OBSERVED unless marked

Route: rail `settings` (mode fullpage; `rail/tabsConfig.ts:157-172`) → `sidebar/FullPageRouter.tsx:152-163` → lazy `SettingsTab` (:63). The nav list is `SETTINGS_NAV` (`tabs/settings/constants.ts:126-141`) and the switch is `SettingsTab.tsx:691-765`. The current screen is persisted through `usePanelNavigation` (key `settings-panel-<siteId>`, `SettingsTab.tsx:213`); the storage medium is INFERRED to be localStorage (the hook was not read). Gating: role via `SCREEN_MIN_ROLE` (constants.ts:162-174), plan via `SCREEN_PLAN_REQUIREMENTS` (types.ts:215-217; custom-code and access need Pro). No client feature flag gates Settings.

**Screen inventory**

| Screen | File (screens/) | Nav | Reachable |
|---|---|---|---|
| Overview (default) | OverviewScreen.tsx | default SettingsTab.tsx:216,697 | yes |
| General | SiteSettingsScreen.tsx | constants.ts:127; :743 | yes |
| Languages | LocalizationScreen.tsx | :128; :745 | yes |
| Brand ↗ (door to BrandWorkspace) | — | :129; performNav :377 | yes (leaves Settings) |
| SEO | SeoScreen.tsx | :130; :747 | yes |
| Domains | DomainsScreen.tsx | :131; :749 | yes |
| Redirects | RedirectsScreen.tsx | :132; :751 | yes |
| Access (password) | AccessScreen.tsx | :133; :753 | yes (Pro) |
| Analytics | AnalyticsScreen.tsx | :134; :755 | yes |
| Form submissions | FormsScreen.tsx | :135; :757 | yes |
| Custom code | AdvancedScreen.tsx | :136; :759 | yes (Pro, else LockedScreen) |
| Security headers | HeadersScreen.tsx | :137; :761 | yes |
| Danger zone | DangerZoneScreen.tsx | :138; :763 | yes |
| Members / Billing / Integrations & webhooks | WorkspaceDoorScreen.tsx | :139-141; :694 | yes (a door card that opens the dashboard) |
| LockedScreen | LockedScreen.tsx | :700 | plan gate |

**Not present:** Export, Backups, in-editor Members/Permissions and in-editor Integrations. The last two are dashboard doors only (constants.ts:3-9,139-141). No screen is unreachable; every screen and component has a non-test importer (grep).

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Settings search | SettingsTab.tsx:887-950; searchIndex.ts:184-215 | local | none | — | WIRED |
| Footer Save / Discard | SettingsTab.tsx:591-654 | flush → persistSettings :566-590 → `saveSiteSettings` BuildrikSyncProvider.ts:537 | server | role per screen | WIRED |
| Unsaved guard | SettingsTab.tsx:390-410,659-668,1165 | — | — | — | WIRED |
| Role footer › Permissions | SettingsTab.tsx:1068-1084 | emits `UI_OPEN_PERMISSIONS` | — | — | WIRED |
| Upgrade (locked) | SettingsTab.tsx:670-672,700 | opens `/dashboard/settings/billing` | — | plan | WIRED |
| Overview attention items / cards | OverviewScreen.tsx:~256-330 | `siteDetail.settingsOverview` :35 | read | — | WIRED |
| Overview Unarchive | OverviewScreen.tsx:219-228,240 | `sites.unarchive` :226 | server | server-side | WIRED |
| General: name / author | SiteSettingsScreen.tsx:402-430; flush :291-346 | `siteDetail.settings.update`; `siteDetail.projectSettings.update` (seo.author) via planSettingsSave BuildrikSyncProvider.ts:509-529 | server | ADMIN | WIRED |
| General: favicon / touch-icon upload | SiteSettingsScreen.tsx:160-180,357-372 | `upload.presign` :86 → PUT :92 → `upload.confirm` :102 | server | ADMIN | WIRED |
| General: favicon URL | SiteSettingsScreen.tsx:463 | settings.update | server | ADMIN | WIRED |
| General: "Manage in Languages ›" | SiteSettingsScreen.tsx:488-494 | nav | — | — | WIRED |
| General: slug + SlugChangeDialog | SiteSettingsScreen.tsx:499-525,320-345 | settings.update {slug}; CONFLICT → field (BuildrikSyncProvider.ts:458-463) | server | ADMIN | WIRED |
| Languages: default locale | LocalizationScreen.tsx:239-260,134-146 | settings.update | server | ADMIN | WIRED |
| Languages: Add locale | LocalizationScreen.tsx:271,166-170 | settings.update {enabledLocales} | server | ADMIN | WIRED |
| Languages: Remove locale | LocalizationScreen.tsx:315,172-184 | settings.update | server | ADMIN | WIRED |
| Languages: translation checklist | LocalizationScreen.tsx:296 | `siteDetail.locales` :94,117 | read | — | WIRED (read-only) |
| SEO: meta title/desc/OG image | SeoScreen.tsx:293-330 | settings.update | server | ADMIN | WIRED |
| SEO: social profiles (6) | SocialProfilesCard via SeoScreen.tsx:~335 | settings.update socialLinks | server | ADMIN | WIRED |
| SEO: allow indexing | SeoScreen.tsx:~379-387 | settings.update | server | ADMIN | WIRED |
| SEO: canonical URL | SeoScreen.tsx:390,238-247 | settings.update | server | ADMIN | WIRED |
| SEO: robots.txt + Reset | SeoScreen.tsx:~411-440 | settings.update | server | ADMIN | WIRED |
| SEO: per-page overrides link | SeoScreen.tsx:~347-357 | emit → Pages | — | — | WIRED |
| Domains: list | DomainsScreen.tsx:175-180 | `siteDetail.domains.list` | read | — | WIRED |
| Domains: Vercel probe | :184-198 | `siteDetail.domains.usesVercel` | read | — | WIRED |
| Domains: Add (availability + connect) | :318-330,284-290; AddDomainDialog.tsx:170-199 | `.checkAvailability`, `.connect` | server | ADMIN | WIRED |
| Domains: Force HTTPS | :221-232 | `.update` | server | ADMIN | WIRED |
| Domains: Check DNS | :234-247 | `.check` | server | ADMIN | WIRED |
| Domains: Make primary | :267-281 | `.setPrimary` | server | ADMIN, VERIFIED only | WIRED |
| Domains: Remove | :249-265 | `.remove` | server | ADMIN | WIRED |
| Domains: DNS records view | ~:363-490 | none (expected records only; no record CRUD) | — | — | WIRED (view only) |
| Redirects: list + 404 suggestions | RedirectsScreen.tsx:184-197 | `siteDetail.redirects.list/.suggestions` | read | — | WIRED |
| Redirects: Add/Edit | :336-342 | `.create`/`.update` | server | EDITOR | WIRED |
| Redirects: Delete + Undo | :288-329 | `.delete`; Undo `.create` | server | EDITOR | WIRED |
| Redirects: Accept suggestion | :351-364 | `.create` | server | EDITOR | WIRED |
| Redirects: Import CSV | :276-284 | `.import_csv` | server | EDITOR | WIRED |
| Redirects: Export CSV | :226-238 | `.export_csv` | download | — | WIRED |
| Redirects: suggest-from-404s switch | :146-166 | `siteDetail.projectSettings.update {redirects}` | server | EDITOR | WIRED |
| Redirects: repair card | :375-381 | `.create` | server | EDITOR | WIRED |
| Access: password protect set/change/toggle | AccessScreen.tsx:~200-290,120-133 | settings.update {publishedPassword} | server | ADMIN + Pro | WIRED |
| Access: Share links | AccessScreen.tsx:~144 | opens `/dashboard/sites/<id>/access` | — | — | WIRED |
| Access: Upgrade | AccessScreen.tsx:171 | billing | — | plan | WIRED |
| Analytics: GA enable/ID | AnalyticsScreen.tsx:338-375; flush :292-313 | projectSettings.update {analytics} | server | EDITOR | WIRED |
| Analytics: "Check data is arriving" | :245-260,395 | `siteDetail.analyticsStatus`; stamps verifiedAt | server on Save | EDITOR | WIRED (issue S-7) |
| Analytics: GTM / Meta Pixel / Clarity | :410-510 | projectSettings.update | server | EDITOR | WIRED |
| Analytics: cookie consent | flush :310 only | passthrough, no control | — | — | DEAD (no UI control; value carried through) |
| Forms: list blocks | FormsScreen.tsx:113-138 | `forms.listBlocks` | read | — | WIRED |
| Forms: submissions + paging | :140-162,405-418 | `forms.listSubmissions` | read | — | WIRED |
| Forms: read/spam/archive | :164-172,329,384-387 | `forms.updateSubmission` | server | EDITOR | WIRED |
| Forms: delete submission | :174-187,352 | `forms.deleteSubmission` | server | EDITOR | WIRED |
| Forms: Export CSV | :189-212,275 | `forms.exportSubmissions` | download | — | WIRED |
| Forms: Configure in Inspector › | :365 (emits UI_SWITCH_TAB layers :224) | — | — | — | WIRED |
| Custom code: head/body | AdvancedScreen.tsx:279-315,243-257 | settings.update headCode/bodyCode | server | ADMIN + Pro | WIRED |
| Custom code: global CSS | AdvancedScreen.tsx:317 | projectSettings.update customCode.globalCss | server | ADMIN + Pro | WIRED |
| Security headers: CSP/X-Frame/Referrer/HSTS/Permissions | HeadersScreen.tsx:231-340,175-189 | settings.update | server | ADMIN | WIRED |
| Danger: Archive | DangerZoneScreen.tsx:149-164,278 | `sites.archive` | server | OWNER | WIRED |
| Danger: Unarchive | :166-179,265 | `sites.unarchive` | server | OWNER | WIRED |
| Danger: Transfer | :181-211,300 | `team.list`, `sites.transfer` | server | canTransfer from `sites.myRole` | WIRED |
| Danger: Delete | :213-218,322 | `sites.delete` (BuildrikSyncProvider.ts:647) → redirect `/dashboard/projects?status=deleted` | server | OWNER | WIRED |
| Workspace doors | WorkspaceDoorScreen.tsx:~49-55 | opens `/dashboard/settings/{team,billing,integrations}` (routes exist) | — | — | WIRED |
| Demo-mode Save (no projectId) | SettingsTab.tsx:570-575 | `composer.setProjectSettings` + saveProject | engine | — | WIRED (demo only) |

##### Issues — Settings (S)
- **[P1] S-1: A failed role lookup silently disables Transfer.** `sites.myRole…catch(() => null)` (DangerZoneScreen.tsx:132) leaves Transfer disabled (:139-140) with no error. OBSERVED.
- **[P1] S-2: A failed member load looks like an empty team.** `team.list` failure becomes `setMembers([])` (DangerZoneScreen.tsx:192-194). It also loads only `perPage: 50` with no paging (:185), so members after the first 50 can never be picked. OBSERVED.
- **[P1] S-4: Languages implies multi-language publish.** The subtitle says "the languages the site is published in" (constants.ts:128), but `shared/types/project.ts:318-322` says only the default locale ships, and engine/export has no `enabledLocales`/`translations` reference (grep). INFERRED.
- **[P2] S-3: A failed domain lookup changes the address shown.** `domains.list…catch(() => [])` (DangerZoneScreen.tsx:131; SeoScreen.tsx:146) falls back to the publishedUrl host, so the delete copy can name the `.vercel.app` host. OBSERVED.
- **[P2] S-5: "Saved" toast can fire before unrouted keys reach the server.** They go only to the composer and then autosave (SettingsTab.tsx:581,620-624). OBSERVED path; whether any key still takes it is INFERRED rare.
- **[P2] S-6: Site name shows before the save succeeds.** The name is applied to the composer before the server save (SiteSettingsScreen.tsx:299 vs SettingsTab.tsx:580), so a refused save leaves the topbar showing the unsaved name. OBSERVED order.
- **[P2] S-7: "Verified" stamp contradicts the dialog.** Analytics stamps `gaVerifiedAt` even with zero events (AnalyticsScreen.tsx:252-253), and the row then says "verified on …" (:386), while the dialog says "no events yet" (ConnectionVerifiedDialog.tsx:42). OBSERVED.
- **[P2] S-8: Domain and redirect error copy reads as a form error.** Action failures show "Domain changes were not saved… Review the values" (DomainsScreen.tsx:234-246 → constants.ts:252; Redirects constants.ts:256). OBSERVED.
- **[P2] S-9: Demo Access screen shows a false "Saved" toast.** It registers no save handler, but `succeeded()` still fires (AccessScreen.tsx:120-122; SettingsTab.tsx:641-646). OBSERVED, demo only.
- **[P2] S-10: Two `localeLabel` implementations.** constants.ts:66-68 and OverviewScreen.tsx:44-54 give different output. OBSERVED.
- **[P2] S-11: Unarchive is implemented twice.** OverviewScreen.tsx:219-228 and DangerZoneScreen.tsx:166-179. The dashboard also has its own per-site settings routes (`packages/dashboard/app/dashboard/sites/[id]/{seo,domains,redirects,analytics,access,settings}`), which look like a second Settings UI (INFERRED from directory names).
- **[P2] S-12: Dead barrel.** `tabs/settings/index.ts` has no non-test importer. OBSERVED.
- **[P2] S-13: Pro users can briefly be treated as starter.** The plan tier defaults to `"starter"` until load (BuildrikSyncProvider.ts:616,761). INFERRED timing.
- **[P2] S-14: Two writers of the same Site columns.** The autosave mirror writes `siteDetail.settings.update` (BuildrikSyncProvider.ts:893-899) beside the Settings Save. OBSERVED.
- **[P2] S-15: Silent stale data after failures.** FormsScreen.tsx:131-135 logs nothing (it does show an error state); LocalizationScreen.tsx:118-120 reports with devError only. OBSERVED.

#### 1. Assets / Media — sub-reader, OBSERVED unless marked

Routes:
- **Drawer:** `TabRouter.tsx:180` → `sidebar/tabs/media/MediaTab.tsx` → `components/SlimLauncher.tsx`.
- **Full page:** `FullPageRouter.tsx:138` → `editor/media/LibraryManager.tsx`, opened by `StudioPanels.tsx:721`.

Gating: there is no feature flag. Writes are gated in the UI by `useMediaWriteAccess` (role ≥ EDITOR; an unknown role counts as writable; `hooks/useMediaWriteAccess.ts:36-41`), and only for upload, delete and rename. On the server, `media.*` are `protectedProcedure` (`server/trpc/routers/media.ts:109-385`).

Persistence: assets live in IndexedDB through `MediaManager`. Uploads go to Vercel Blob (`POST ${DASHBOARD_URL}/api/asset-upload`, `services/AssetUploadService.ts:118`) plus `media.createAsset`. Other mutations are mirrored best-effort.

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Drawer ⋯ › Select assets… | SlimLauncher.tsx:255 | useSelectionState | — | — | WIRED |
| Drawer search | SlimLauncher.tsx:273 | useMediaState.ts:317 → filter + stock search + `media.listAssets{search}` useLibraryState.ts:444-470 | — | — | WIRED |
| Manage assets › | SlimLauncher.tsx:289 | StudioPanels.tsx:721 | — | — | WIRED |
| Replacement banner › full library | SlimLauncher.tsx:327 | `media.selectAssets` :196; LibraryManager.tsx:145-150 | — | — | WIRED |
| Filter popover type / folder | SlimLauncher.tsx:404-461 | useLibraryState.ts:249 | localStorage | — | WIRED |
| Retry library load | SlimLauncher.tsx:495 | `media.retryInit` useLibraryState.ts:476 | — | — | WIRED |
| Empty "Browse stock" / clear search / clear filters | SlimLauncher.tsx:504,566,589,610 | StockSourceModal; local | — | — | WIRED |
| Card click = insert or replace selected media | AssetCell.tsx:97-103 | `mediaOps.replaceMedia` useMediaState.ts:220 / `insertMediaAt` :249 | engine | — | WIRED |
| Card dbl-click detail hub / right-click select / hover checkbox | AssetCell.tsx:105,191; SlimLauncher.tsx:645,651 | local | — | — | WIRED |
| Card drag to canvas | AssetCell.tsx:110-117 | useDropExecution.ts:79-110 | engine | — | WIRED (alt text dropped, M-8) |
| Load more (server paging) | SlimLauncher.tsx:690 | `media.listAssets`/`listFolders` BuildrikSyncProvider.ts:975,994 | IndexedDB | — | WIRED |
| Bulk Move to… | SlimLauncher.tsx:725-739; MediaTab.tsx:293 | `media.moveAsset` AssetUploadService.ts:247 | IndexedDB + server best effort | none | WIRED |
| Bulk Move fallback branch | SlimLauncher.tsx:752 | onOpenLibrary | — | — | UNREACHABLE (MediaTab always passes onBulkMoveTo) |
| Bulk Delete | SlimLauncher.tsx:765 | `mediaOps.deleteWithGrace` useSelectionState.ts:228 → `media.deleteAsset` :211 | IndexedDB + server (retry, MediaManager.ts:1307) | EDITOR | WIRED |
| Bulk Done | SlimLauncher.tsx:790 | local | — | — | WIRED |
| Upload (drawer) | SlimLauncher.tsx:840 | useUploadState.ts:195 → `media.uploadPrefix` :115 + Blob `/api/asset-upload` :118 + `media.createAsset` :156 | IndexedDB + server | EDITOR; client quota :199 | WIRED |
| Upload retry / dismiss / replacement modal | SlimLauncher.tsx:796-806 | confirmReplacement :180 | as upload | EDITOR | WIRED |
| Upload "Optimize" | SlimLauncher.tsx:802 | only opens the library | — | — | WIRED (navigation only) |
| Add from › Stock / Icons / Fonts | SlimLauncher.tsx:871,879,889 | StockSourceModal; IconBrowserOverlay → `mediaOps.insertMedia(...,"icon")` MediaTab.tsx:338; `ui:site-fonts` | engine | — | WIRED |
| Storage quota bar | UploadZone → StorageQuotaBar | `media.checkStorageQuota` useServerStorageQuota.ts:61 | — | — | WIRED |
| Pick mode (inspector Choose image) + search/filter/cancel/Use/Upload/From URL | MediaTab.tsx:232; PickModePanel.tsx:115-222; UploadAssetModal.tsx:148,158 | applyPick useMediaState.ts:292; uploadFile; fetchUrlAsFile | engine / IndexedDB + server | — | WIRED |
| Detail hub: back | AssetDetailOverlay.tsx:285 | — | — | — | WIRED |
| Detail hub: alt text (blur commit) | AssetDetailOverlay.tsx:355-366 | `media.updateAsset` :259 | IndexedDB + server best effort | none | WIRED |
| Detail hub: Used in › Jump | AssetDetailOverlay.tsx:373,608 | setActivePage + select | — | — | WIRED |
| Detail hub: Versions list | AssetDetailOverlay.tsx:381,134-146 | `media.listAssetVersions` MediaVersionService.ts:39 | server | — | WIRED |
| Detail hub: Restore version | AssetDetailOverlay.tsx:497,542 | `media.restoreAssetVersion` :54 → onUpdate({src}) :161 | server only | none | WIRED, locally no-op (M-1) |
| Detail hub: Edit image / Optimize | AssetDetailOverlay.tsx:391,401 | MediaTab.tsx:99 → ImageEditorModal → uploadFile({versionOf}) :109 + `media.createAssetVersion` :117 | IndexedDB + server | none | WIRED |
| Detail hub: Replace across site | AssetDetailOverlay.tsx:411 | MediaTab.tsx:139 → ReplaceAcrossDialog → `mediaOps.replaceAcross` | engine | — | WIRED |
| Detail hub: Insert / Rename / Copy URL / Download / Delete / Expand | AssetDetailOverlay.tsx:424-435 | insert; RenameAssetModal → updateAsset; clipboard; downloadAssets; requestDelete | engine / IndexedDB + server | rename and delete EDITOR | WIRED |
| Stock modal: tabs / search / retry / load more | StockSourceModal.tsx:138-454 | `media.searchStockPhotos` / `searchStockVideos` StockService.ts:111,125 | — | server keys (UNKNOWN) | WIRED |
| Stock modal: select / save | StockSourceModal.tsx:225,480 | useDiscoveryState.ts:270-279 uploadFile + updateAsset | IndexedDB + server (assetSource local only) | none | WIRED |
| Stock auto-save on insert | useMediaState.ts:140-187 | upload | IndexedDB + server | — | WIRED (console-only error, M-9) |
| Icon browser (drawer) | IconBrowserOverlay.tsx:139-263 | insertMedia | localStorage recents | — | WIRED |
| Icon picker modal (inspector) | media/IconPickerModal.tsx:189-350 | iconPickerContext.onSelect StudioModals.tsx:195 | localStorage recents | — | WIRED |
| Site fonts search / add / remove | media/components/SiteFontsModal.tsx:240,298,308 | `media.updateAsset{userMetadata}` | IndexedDB + server | none | WIRED |
| Image editor crop/adjust/resize/format, Reset, Cancel, Save, Retry | media/image-editor/ImageEditorTabs.tsx:163-417; ImageEditorModal.tsx:225-259 | host onSave | via host | — | WIRED |
| Library: search, tag clear, ⌘K, Esc | LibraryManager.tsx:785,772,166-178 | local | — | — | WIRED |
| Library: Upload / drop files | LibraryManager.tsx:796,1037,747 | runUploadBatch :545 | IndexedDB + server | EDITOR | WIRED |
| Library: Import from URL | LibraryManager.tsx:825,474 | fetchUrlAsFile + uploadFile | IndexedDB + server | EDITOR | WIRED |
| Library: Stock | LibraryManager.tsx:836 | StockSourceModal | — | — | WIRED |
| Library: Close | LibraryManager.tsx:846 | StudioPanels.tsx:711 | — | — | WIRED |
| Folder tree: Recent / In use / Unused / All / folder / collapse | FolderTree.tsx:332-415 | client filter | — | — | WIRED |
| Folder tree: New folder | FolderTree.tsx:442,451 | `media.createFolder` AssetUploadService.ts:223 | IndexedDB + server (retry) | write-gated | WIRED |
| Folder tree: Delete folder (+ "Move files…") | FolderTree.tsx:337; LibraryManager.tsx:1090 | useLibraryState.ts:297 → per-file `deleteAsset` + `media.deleteFolder` :236 | IndexedDB + server best effort | write-gated | WIRED (M-2) |
| Folder tree: drop asset on folder | FolderTree.tsx:181,272 | runMove LibraryManager.tsx:378 → `media.moveAsset` | IndexedDB + server | — | WIRED |
| Folder tree: Tags | FolderTree.tsx:481-504 | setTagFilter | — | — | WIRED |
| Media folder rename | useLibraryState.ts:347 → MediaManager.ts:1632 → `media.renameFolder` :277 | — | — | — | UNREACHABLE (no UI calls it) |
| Grid: type/format filter, select chip, grid/list, columns, sort | AssetGrid.tsx:427-745 | local | localStorage | — | WIRED |
| Grid card click / dbl-click insert / ⋯ / right-click / drag | AssetGrid.tsx:800-927 | insertAndReturn LibraryManager.tsx:278 | engine | — | WIRED |
| Library bulk Move / Download / Delete / Clear | AssetGrid.tsx:647-686 | runMove; downloadAssets; requestBulkDelete | IndexedDB + server | delete EDITOR | WIRED |
| Empty-state Upload / stock CTAs | AssetGrid.tsx:1008,1035 | — | — | EDITOR | WIRED |
| Context menu: Insert / Select / Rename / Edit / Move / Copy URL / Copy alt / Replace across / Delete | MediaContextMenu.tsx:163-250 | as above | engine / IndexedDB + server | rename/delete EDITOR; Move none | WIRED |
| Details rail: toggle / Versions (local `versionOf` family) / Apply latest + Retry | AssetDetailsPanel.tsx:440,472; LibraryManager.tsx:262,666,1130-1168 | `mediaOps.replaceAcross` | engine / userMetadata | — | WIRED (M-5) |
| Details rail: Used in / Insert / Manage font / Edit image / ⋯ Rename/Replace/Optimize/Delete | AssetDetailsPanel.tsx:530-615 | as above | — | — | WIRED |
| Details rail: inline replaceAcross fallback | AssetDetailsPanel.tsx:644-666 | — | — | — | DEAD |
| Details rail: alt text | AssetDetailsPanel.tsx:713 → LibraryManager.tsx:1018 | `media.updateAsset` per keystroke | IndexedDB + server | none | WIRED (M-4) |
| Details rail: tags add/remove | AssetDetailsPanel.tsx:783,802 | `media.updateAsset{userMetadata}` | IndexedDB + server | none | WIRED |
| Status bar: count, quota, "N not on the server" | LibraryManager.tsx:1001-1031 | checkStorageQuota | — | — | WIRED |
| Canvas edit-image handler | StudioPanels.tsx:725-742,847 | — | — | — | DEAD (Canvas never reads `onOpenImageEditor`) |
| dragPayload helpers | sidebar/tabs/media/data/dragPayload.ts:20,40,55 | — | — | — | DEAD (test-only) |
| MediaTab props onOpenIconPicker/isExpanded/onExpandToggle/onHelpClick | MediaTab.tsx:31-43 vs 65-71 | — | — | — | DEAD props |
| "J shortcut" | LibraryManager.tsx:7 (doc) | none | — | — | DEAD (stale doc) |

Server `media.*` with no editor caller: `media.moveFolder` (:141) and `media.generateAltText` (:324; AI was removed). OBSERVED.

##### Issues — Assets (M)
- **[P1] M-1: Restoring a version in the drawer changes nothing locally.** It calls `onUpdate({src})` (AssetDetailOverlay.tsx:161), but `updateItem` copies only name, alt text and tags (useLibraryState.ts:354-361), so `src` is dropped. The server repoints the URL (server/services/media.service.ts:579), so the library row and the canvas stay stale until reload. OBSERVED.
- **[P1] M-2: Deleting a non-empty folder hard-deletes each file.** It calls `media.deleteAsset` per file (useLibraryState.ts:316-319) and skips the in-use check, the grace window and undo used by asset delete (useSelectionState.ts:200-228). OBSERVED.
- **[P1] M-3: move / update / deleteFolder / renameFolder mirrors swallow failures.** Each does `catch → return false` (AssetUploadService.ts:246-284) with no retry queue (only deletes have one, MediaManager.ts:1308), and MediaManager ignores the result (:1341,1388,1615,1646). The "Moved N files" toast always shows (MediaTab.tsx:296), and MoveFailedModal can never fire (LibraryManager.tsx:388). OBSERVED; drift on the next import is INFERRED.
- **[P1] M-4: Alt text writes to the server on every keystroke.** The library rail sends a server mutation per keystroke (AssetDetailsPanel.tsx:713 → MediaManager.ts:1388), while the drawer commits on blur (AssetDetailOverlay.tsx:363): two commit models for one field. Out-of-order writes are INFERRED.
- **[P1] M-5: Two asset-version systems.** One is server `MediaAssetVersion` restore (AssetDetailOverlay.tsx:134-170). The other is local `versionOf` families applied with `replaceAcross` (LibraryManager.tsx:262,666). OBSERVED.
- **[P1] M-6: Drawer edit-save uses the wrong asset for history.** It uses `item.assetId` and `item.name` (MediaTab.tsx:116-117), while LibraryManager uses the parent asset (:633-646). Editing a version from the drawer therefore links history to the version. INFERRED (the two paths compared).
- **[P2] M-7: Dead canvas edit-image path.** StudioPanels.tsx:725-742 forces webp, logs errors to the console only, and is unused. OBSERVED.
- **[P2] M-8: Drag drops alt text.** The drag payload never sets `application/x-aquibra-media-alt` (AssetCell.tsx:110-117, AssetGrid.tsx:800-806), though useDropExecution.ts:84 reads it. OBSERVED.
- **[P2] M-9: Stock auto-save failure goes only to the console.** useMediaState.ts:146-147 logs it, and the save forces `.webp` / `image/webp` (:144). OBSERVED.
- **[P2] M-10: Drawer search fires stock searches with no debounce.** Every keystroke after 3 characters fires stock photo and video searches (useMediaState.ts:317-325; useDiscoveryState.ts:124-150). OBSERVED.
- **[P2] M-11: Some media writes are not role-gated in the UI.** Move, alt text, tags and site-fonts have no role gate (MediaContextMenu.tsx:208; AssetDetailsPanel.tsx:713,783,802). OBSERVED.
- **[P2] M-12: Two icon pickers.** IconBrowserOverlay vs IconPickerModal (MediaTab.tsx:334; StudioModals.tsx:192). OBSERVED.
- **[P2] M-13: Drawer uploads ignore the folder scope.** Drawer and stock saves ignore the current folder (useDiscoveryState.ts:277; SlimLauncher.tsx:190), and `assetSource:"stock"` is never sent to the server (MediaManager.ts:1366-1386). OBSERVED.
- **[P2] M-14: Copy that contradicts behaviour.**
  - "Stock image saved" also shows for video (MediaTab.tsx:329).
  - "Swapped atomically (one undo)" is wrong: it is one `replaceAcross` per source (AssetDetailsPanel.tsx:637 vs LibraryManager.tsx:663).
  - The "J shortcut" doc does not match anything (LibraryManager.tsx:7).
  - AI "Regenerate" comments remain (LibraryManager.tsx:1015-1021).

  OBSERVED.
- **[P2] M-15: Failures that read as empty or default.**
  - A failed versions read shows "no versions" (AssetDetailOverlay.tsx:144).
  - A failed "Copy alt text" is silent (MediaContextMenu.tsx:228).
  - A failed quota read falls back silently to a hard-coded cap (useServerStorageQuota.ts:65).

  OBSERVED.
- **[P2] M-16: Unguarded localStorage reads at hook init.** useLibraryState.ts:47-61 and :228-240 have no try/catch. A crash in private mode is INFERRED.
- **[P2] M-17: Four tRPC client singletons.** AssetUploadService.ts:28, MediaVersionService.ts:17, useServerStorageQuota.ts:43 and BuildrikSyncProvider.ts:48 each create their own client instead of using `getBuildrikClient`. OBSERVED.
- **[P2] M-18: Dead code.** dragPayload.ts, the dead MediaTab props, the AssetDetailsPanel fallback, the SlimLauncher fallback, and the media renameFolder chain. OBSERVED.

#### 2. CMS / Content — sub-reader, OBSERVED unless marked

**Route correction:** CMS **is** a rail item. `rail/tabsConfig.ts:295` puts `content` in `RAIL_FIGMA` and `LeftSidebar.tsx:222` renders it, so the comment at tabsConfig.ts:225-229 ("off-rail") is stale.

Other ways in:
- Shortcut D (tabsConfig.ts:242; useSidebarKeyboard.ts:59).
- ⌘K "Open CMS" (CommandPalette.tsx:120) and record jump `UI_CMS_OPEN` (:459).
- The "Manage CMS records" command (engine/commands/defaultCommands.ts:697 → useEditorEventListeners.ts:171).
- Inspector "Open record ›" (CmsBindingSection.tsx:222) and "Open collection ›" (CollectionListSection.tsx:91).
- The Pages tab dynamic-pages row (PagesTab.tsx:99), and the setup modal when it finishes (CMSCollectionSetupModal.tsx:222).

`UI_CMS_OPEN` is handled at StudioPanels.tsx:604-618. The workspace takes over the canvas (StudioPanels.tsx:426,879-889). VIEWER is excluded (tabsConfig.ts:328-334).

Persistence:
- Collections and records are written to the engine first, then IndexedDB.
- The event mirror (shell/hooks/useCmsSync.ts:170-195) sends them on through services/cmsSync.ts.
- **The localStorage outbox `bk-cms-outbox-v1` is IMPLEMENTED** (cmsSync.ts:116,148,380). It is replayed on open by `flushCmsOutbox` (:986, called at useCmsSync.ts:50), and there is an in-memory SyncRetryQueue with an online replay (syncRetryQueue.ts:57,65). The memory note saying it is pending is stale.

There are no feature flags on this surface (grep).

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Panel header | content/ContentTab.tsx:266 | — | — | — | WIRED |
| Loading skeleton / load error + Try again | ContentTab.tsx:164-187 | getCmsHydrationStatus / `retryCmsHydration` cmsSync.ts:540-555 → `cms.collections.list`, `cms.entries.list` | — | only at 0 local collections | WIRED |
| Empty "Create a collection" / "New collection" row | ContentViews.tsx:191-199,258 | onCreateCollection → setup modal | — | — | WIRED |
| Collection rows → workspace | ContentViews.tsx:244-250 | cmsWorkspace.openCollection ContentTab.tsx:213 | — | — | WIRED |
| Sources / Variables / Conditions rows | ContentViews.tsx:268-270 | setView | — | — | WIRED |
| Sources: + Connect a source (paste JSON) | ContentViews.tsx:398; DataRowDialogs.tsx:160-188 | `data.importSampleData` ContentTab.tsx:106; DataManager.ts:315 | **memory only** (DataManager.ts:47; not in exportProject, Composer.ts:801-826) | — | WIRED (lost on reload, C-1) |
| Sources: Google Sheets / Airtable | DataRowDialogs.tsx:213-227 | — | — | — | STUB ("Coming soon") |
| Source ⋯ Rename / Re-sync / Delete | ContentViews.tsx:372-441,325-327 | `data.renameSource` / `refreshSource` (false for JSON → ResyncJsonDialog `updateSourceData`) / `unregisterSource` | memory | — | WIRED |
| "Watching for changes" pill | ContentViews.tsx:335-339 | DataManager events useContentPanel.ts:207-213 | — | — | WIRED |
| Variables: new / inline edit / ⋯ Edit / Rename / Delete | ContentViews.tsx:507-640 | `setProjectSettings({siteVariables})` useContentPanel.ts:298 → markDirty (Composer.ts:1008) → `sites.saveProject` (INFERRED) | server through project save; one-time localStorage migration :157-160 | — | WIRED |
| `{{site.*}}` live source | useContentPanel.ts:101-117 | data.registerSource("site") | memory, rebuilt | — | WIRED |
| Conditions ⋯ Select element / Remove | ContentViews.tsx:703,706 | selection.select; removeDataBinding + markDirty useContentPanel.ts:311 | project | — | WIRED |
| + New condition (pick on canvas → path/op/value) | ContentViews.tsx:715-771 | `inspector:pick-start`; `data.bindCondition` useContentPanel.ts:323 | project | — | WIRED |
| Setup modal: name, fields, add/remove/undo, page-per-entry, Create, name clash | shell/modals/CMSCollectionSetupModal.tsx:192-406 | `cms.collections.createCollection` :213 → mirror `cms.collections.upsert` | IndexedDB + server | — | WIRED |
| Workspace: + New collection / ‹ Back to canvas / Records-Fields tabs / ⋯ Dynamic pages, Settings | cms/CmsWorkspace.tsx:171-379 | local / onBackToCanvas | — | — | WIRED |
| ⋯ Import CSV… | CmsWorkspace.tsx:382,436-444; cms/CsvImportDialog.tsx:72-117 | `cms.entries.importCsvPreview` :79, `cms.entries.importCsv` :104, then hydrate :111 | server first | siteId | WIRED |
| ⋯ Import JSON… | CmsWorkspace.tsx:385; useImportRecords.tsx:36-128 | createContentItem per row → mirror `cms.entries.upsert` | IndexedDB first | — | WIRED |
| ⋯ Google Sheets / Airtable | CmsWorkspace.tsx:392-397 | — | — | — | STUB |
| Records: + New record / search / sort / pager / open row | CmsWorkspace.tsx:223,281,402-406; RecordsTable.tsx:152-233 | local | — | — | WIRED |
| Record sheet editors (text, rich text, image, reference, multiselect) | RecordSheet.tsx:405-452; RichTextField.tsx:68-96; ReferenceField.tsx:48-67 | form state; media picker | — | image needs picker | WIRED |
| Record Published toggle + Save | RecordSheet.tsx:670,710,298-330 | create/updateContentItem + direct `syncEntryUpsert` → `cms.entries.upsert` (useContentPanel.ts:240-250) | IndexedDB + server | — | WIRED |
| Conflict Keep mine / Use theirs | RecordSheet.tsx:277-296,628-634; useCmsSync.ts:110-133 | claimCmsConflict / takeServerCopy cmsSync.ts:826-833 | server | — | WIRED |
| Record ⋯ Preview saved record | RecordSheet.tsx:539-546; RecordTemplatePreviewDialog.tsx:45-121 | local render | — | — | WIRED |
| Record ⋯ Delete (plain / typed DELETE) + Undo toast | RecordSheet.tsx:337-352,548,748-761; TypedDeleteDialog.tsx:35-41 | deleteContentItem → `cms.entries.delete`; Undo = saveRecord(null) | IndexedDB + server | — | WIRED (C-3) |
| Unsaved guard | RecordSheet.tsx:206,732-741 | — | — | — | WIRED |
| Record preview pane Delete | cms/RecordPreview.tsx:88 | as delete | — | — | WIRED |
| Fields: + Add field (types, key clash) | CmsWorkspace.tsx:228; AddFieldDialog.tsx:62-160 | `cms.collections.addField` useContentPanel.ts:279 → upsert | IndexedDB + server | — | WIRED |
| Field inspector edits / Open record / Delete (locked "Open") | FieldsTable.tsx:61; FieldInspector.tsx:107-254; DeleteFieldDialog.tsx:84-115 | updateField / deleteField → upsert | IndexedDB + server | bound field locks type/key | WIRED |
| Dynamic pages: slug pattern, template page, SEO, Save | cms/DynamicPagesPane.tsx:80-230 | updateCollection → upsert | IndexedDB + server | home excluded | WIRED |
| Collection settings: rename, source label, typed Delete | cms/CollectionSettingsPane.tsx:75-150 | updateCollection; unbind + deleteCollection → `cms.collections.delete` | IndexedDB + server | blocked while referenced | WIRED |
| Sync toasts: not-synced + Retry now / GONE / invalid | useCmsSync.ts:71-168 | retryCmsSync | — | — | WIRED |
| Publish gate | shell/exportPublishPages.ts:87-89 | cmsSyncBlocker cmsSync.ts:459 → `cms.publishSnapshot` :492 | server | only when bindings exist (:74) | WIRED |
| Pages tab dynamic pages count | useDynamicPagesSummary.ts:52-80; PagesTab.tsx:96-99 | `cms.dynamicPages` :66 | server read | — | WIRED |

##### Issues — CMS (C)
- **[P1] C-1: Data sources vanish on reload.** They are kept in memory only (DataManager.ts:47; absent from exportProject at Composer.ts:801-826), yet the UI says "Watching for changes" and "A source feeds a collection" (ContentViews.tsx:337,404). OBSERVED.
- **[P1] C-2: Connect-source mislabels a key collision and imports partially.** A duplicate key, or a top-level `"site"` key, makes `registerSource` throw mid-loop (DataManager.ts:61-63,320-329). The catch says "Not valid JSON" (ContentTab.tsx:109-110), and the keys registered before the throw stay. OBSERVED.
- **[P1] C-3: Undo after delete gives the record a new id.** Undo calls `saveRecord(collection.id, null, …)` (CmsWorkspace.tsx:487 → `cms.nextId()`, useContentPanel.ts:241), so references and bindings to the old id stay broken. OBSERVED code; breakage INFERRED.
- **[P1] C-4: Delete failures give no message.** The delete paths have no catch: `void remove()` (RecordSheet.tsx:548,343), TypedDeleteDialog.tsx:37-41 and CollectionSettingsPane.tsx:86-97. OBSERVED.
- **[P1] C-5: Collection delete is not atomic.** Bindings are removed before `deleteCollection` (CollectionSettingsPane.tsx:88-93), so a failed delete has already stripped the bindings, silently. OBSERVED.
- **[P1] C-6: Several editors swallow rejections.** Rename, dynamic-pages Save and Add field are try/finally with no catch (CollectionSettingsPane.tsx:77-83; DynamicPagesPane.tsx:82-99; AddFieldDialog.tsx:69-80). FieldInspector uses `void updateField` (:108). OBSERVED.
- **[P1] C-7: Merging a duplicate collection leaves stale bindings.** Bindings still name the local id, and the code admits it (cmsSync.ts:840-841). OBSERVED.
- **[P2] C-8: Hydration failure is silent once collections exist.** The error UI shows only at 0 collections (ContentTab.tsx:161); otherwise there is only a `console.warn` (cmsSync.ts:747). OBSERVED.
- **[P2] C-9: Dynamic-pages count shows 0 on error.** A server error becomes `count: 0` (useDynamicPagesSummary.ts:70). OBSERVED.
- **[P2] C-10: Variable rename/delete leaves old references.** `{{site.old}}` references are not rewritten (ContentViews.tsx:627,638). INFERRED (no rewrite code found).
- **[P2] C-11: CSV and JSON import have opposite authority.** CSV is server-first; JSON is local-first, and its "Imported N of M" counts local writes (useImportRecords.tsx:49,100). OBSERVED.
- **[P2] C-12: Settings hint promises a missing control.** It says "Rename, re-sync or delete" (CmsWorkspace.tsx:329), but there is no re-sync control. OBSERVED.
- **[P2] C-13: Stale "off-rail" comment.** tabsConfig.ts:225-229. OBSERVED.
- **[P2] C-14: Storage re-read 2–3× after a hydrate.** cmsSync.ts:742; useCmsSync.ts:52; CmsWorkspace.tsx:443. OBSERVED.
- **[P2] C-15: Two useContentPanel instances.** ContentTab.tsx:80 and CmsWorkspace each run one, giving duplicate subscriptions and reloads. OBSERVED.
- **[P2] C-16: Sync-error toast undercounts pending changes.** `queue.size` excludes outbox-only entries and conflicts (syncRetryQueue.ts:126; cmsSync.ts:189-191). OBSERVED.
- **[P2] C-17: Test-only / internal-only exports.** `getCmsSyncPendingCount` (cmsSync.ts:434) is test-only, and `UNCLAIMED_SITE` (:574) is used only internally. OBSERVED.
- **[P2] C-18: Copy implies an automatic rebuild.** "Published pages … will refresh on next build" (RecordSheet.tsx:269), but there is no automatic build, only the next publish. INFERRED.
- **[P2] C-19: Unguarded CSV read.** `await file.text()` has no catch (CsvImportDialog.tsx:89-92). OBSERVED.

#### 3. Brand / Design system — sub-reader, OBSERVED unless marked

Route: rail "Brand" (`design`, shortcut B, fullpage; tabsConfig.ts:143-156) → FullPageRouter.tsx:171-183 → lazy `design-system/ui/BrandWorkspace.tsx`.

Write path: every edit goes through `composer.designSystem.setTokens` / `setDarkMode` (engine/designSystem/facade.ts:76,88) into `projectSettings.designTokens`, and autosave sends that with `sites.saveProject` (BuildrikSyncProvider.ts:874). Tokens that fail validation are sent as `designTokens: undefined` (:866-868). Persistence below means "engine→saveProject" unless stated otherwise.

| Feature | Entry | Calls | Persistence | Gating | Status |
|---|---|---|---|---|---|
| Open Brand / Back to canvas / Esc | FullPageRouter.tsx:171-183; BrandWorkspace.tsx:920-929,396-415 | — | — | — | WIRED |
| Nav rows (11 pages incl. Styles) + counts | BrandWorkspace.tsx:125-137,946-948,893-897 | openPage; useDSLint | — | — | WIRED |
| Read-only banner + EditLock | BrandWorkspace.tsx:1008-1016,237-243 | store.readOnly | — | designSystem.readOnly | WIRED |
| First-run "No brand set" › Browse starters / Import | BrandWorkspace.tsx:1022-1042 | openPage | — | no tokens | WIRED |
| Review changes popover + Revert | BrandWorkspace.tsx:974-979; SessionEditsPopover.tsx:98,131 | revert → setTokens | engine→saveProject | — | WIRED |
| Restore points header action | BrandWorkspace.tsx:986-996 | openPage | — | — | WIRED |
| + Add token (colours, spacing, 11 kinds) | BrandWorkspace.tsx:594,640; TokenAddDialog.tsx:96 | registry.addToken → setTokens | engine→saveProject | — | WIRED |
| Kind switch | BrandWorkspace.tsx:626-639 | openPage | — | — | WIRED |
| Spacing ⋯ Apply preset / Reset to defaults | BrandWorkspace.tsx:660-683 | spacing.applyPreset / resetToDefaults | engine→saveProject | — | WIRED |
| Token tables, row select, "Used by N" highlight | ColorTokenList.tsx:177,201-209; KindTokenList.tsx:78; UsageHighlight.tsx:164,168 | — | — | — | WIRED |
| Token card: light value / font popover / dark value | TokenDetailView.tsx:434-570; BrandFontPopover.tsx:90-122 | changeToken BrandWorkspace.tsx:521-532 | engine→saveProject | — | WIRED |
| Token card ⋯ Generate scale / Rename / Reset / Delete (replace-with) | TokenDetailView.tsx:295-405; TokenRenameDialog.tsx:121; TokenDeleteDialog.tsx:136,224 | renameToken :557, resetToken :548, deleteToken :533 | engine→saveProject | rename limited by kind | WIRED |
| Token card lint Auto-fix / Ignore | TokenDetailView.tsx:271-281,663 | computeAutoFix + lintState.suppress | localStorage `buildrik:ds:lintSuppressions` (LintState.ts:37,133-143) | — | WIRED (B-1, B-2) |
| Token card Used-by → select element | TokenDetailView.tsx:623-626 | selection.select | — | — | WIRED |
| Scale generator (input/Generate/Preview/Cancel/Confirm) | BrandWorkspace.tsx:724-733; ScaleGenerator.tsx:95-225 | `theme.createBrandRestorePoint` + setTokens | server restore point + engine→saveProject | siteId | WIRED |
| Connect to tokens (Change/Preview/Cancel/Apply) | BrandWorkspace.tsx:734; LintSection.tsx:54; ConnectTokensCheck.tsx:93-223 | designSystem.connectSuggestions / applyConnect | engine→saveProject | — | WIRED |
| From logo or URL (button + starters row) | BrandWorkspace.tsx:737-741,834; StartersSection.tsx:58-69 | openPage | — | dsAi | FLAGGED-OFF |
| Logo drop / file | BrandFromSource.tsx:240-262 | decodeLogoColors (client) | — | dsAi | FLAGGED-OFF |
| Website URL Read / Retry | BrandFromSource.tsx:178-205,277-289 | `theme.extractBrandFromUrl` :188 | — | dsAi (+ server) | FLAGGED-OFF |
| Pick brand colour / Cancel / Confirm | BrandFromSource.tsx:213-229,300-306,380-398 | restore point + setTokens | server + engine | dsAi | FLAGGED-OFF |
| Dark mode Auto (proposal Preview/Cancel/Confirm/Retry) | DarkModeCard.tsx:72-99,162-180 | restore point "dark-auto" + setDarkMode | server + engine | siteId | WIRED |
| Dark mode Off | DarkModeCard.tsx:100-105 | setDarkMode("off") | engine | — | WIRED |
| Light/Dark preview (card + preview column) | DarkModeCard.tsx:183-232; BrandWorkspace.tsx:901-903,316-325 | setPreviewTheme | — | — | WIRED |
| Colour mode list › Set dark value | ColourModeSection.tsx:77-191 | store.commit | engine | — | WIRED |
| Fonts & type styles rows / + Add a font | TypographySection.tsx:233,257; BrandWorkspace.tsx:692-699 | select; openSiteFonts | — | — | WIRED |
| Styles page | ReusableStylesSection.tsx:87,98 | select / openPage | — | — | WIRED |
| Component styles rows | ComponentsSection.tsx:35; BrandWorkspace.tsx:387-392 | leaves to Add › Blocks | — | — | WIRED (navigation only; B-11) |
| Classes list / + Add class | ClassesSection.tsx:37-49; ClassAddDialog.tsx:41-71 | el.addClass on the prior canvas selection | engine | needs a selection | WIRED |
| Presets list → detail → variants | StylesRouter.tsx:110-155; PresetDetailPane.tsx:163 | view only | localStorage seed `buildrick-design-presets-<id>-v1`, never written | — | WIRED read-only (B-3) |
| Brand checks Run / Fix / Open token | BrandWorkspace.tsx:604-618,794-805; LintSection.tsx:145,155 | BRAND_CHECKS_RUN; changeToken | engine | — | WIRED |
| Starters apply (6) | StartersSection.tsx:80-83; useApplyStarter.ts:51-59 | store.commit | engine + localStorage "seen" | — | WIRED |
| Restore points list / Retry / Restore | RestorePointsSection.tsx:83-115; useBrandRestorePoints.ts:42-68 | `theme.brandRestorePoints`, `theme.brandRestorePoint` → setDarkMode/setTokens | server + engine | siteId | WIRED |
| Export: close / dark strategy / Copy / Download (CSS/JSON/Tailwind) / preview select | ExportSection.tsx:228-399; exportUtils.ts:160-168 | buildExport / downloadFile | local file | — | WIRED |
| Import JSON: drop / paste / Replace / Merge / Apply / Cancel | ImportCard.tsx:203-403; useImportTokens.ts:77-85 | commit | engine | JSON only | WIRED |
| Canvas theme-toggle preview | ThemeTogglePreview.tsx:27-39 (StudioPanels.tsx:780) | useBrandPreview | — | darkMode auto | WIRED |
| Migration progress Retry / Restore snapshot | MigrationProgressModal.tsx:159,168; MigrationProgressMount.tsx:204-261 | importMigratedProject | localStorage `ds-migration-backup-<siteId>` | migration:failed | WIRED |
| Canvas token `<style>` | ProjectTokensApplier.tsx:40 | tokensForEmit | — | brandTokensV2 | WIRED |
| DSModeToggle (Beginner/Pro) | ui/DSModeToggle.tsx:27 | — | — | — | DEAD |
| useResetAllPresets | StylePresetRegistryContext.tsx:146 | — | — | — | DEAD |
| useTokenUsageMap / extractElementIdFromSelector | state/useTokenUsageMap.ts:51,66 | — | — | — | DEAD |
| cssPropertyKinds | utils/cssPropertyKinds.ts:25,85 | — | — | — | DEAD (test-only) |
| engine ColorMode (`composer.colorMode`) | engine/colorMode/ColorMode.ts; Composer.ts:214 | localStorage `buildrik:colorMode` | — | — | DEAD (no reader) |
| design-tokens.css classes | design-system/styles/design-tokens.css (imported LeftSidebar.css:4) | — | — | — | DEAD CSS |

##### Issues — Brand (B)
- **[P1] B-1: "Ignore" leaks across sites.** The lint suppression key in localStorage is global, with no siteId (LintState.ts:37,133-148), so ignoring a warning on one site hides it on every site in that browser. OBSERVED.
- **[P1] B-2: Auto-fix suppresses the warning even when the write was refused.** It suppresses regardless of the result (TokenDetailView.tsx:277-279). OBSERVED.
- **[P1] B-3: Presets read a second store.** They come from a per-browser localStorage cache or `DEFAULT_PRESETS` (StylePresetRegistryContext.tsx:5-8,51-72), while the engine and restore points use `projectSettings.designPresets` (Composer.ts:247; useBrandRestorePoints.ts:28). OBSERVED code; divergence INFERRED.
- **[P2] B-4: Beginner mode is unreachable.** The provider is forced to "pro" (BrandWorkspace.tsx:1193) and the toggle is dead, so the beginner branches in BrandWorkspace.tsx:264,418 and TokenDetailView.tsx:298,401-404 are dead. OBSERVED.
- **[P2] B-5: Restore points spin forever without a siteId.** Status starts at "loading" and the early return never clears it (useBrandRestorePoints.ts:40-44). OBSERVED.
- **[P2] B-6: Restore-point empty-state copy over-claims.** It promises points "before a theme push / dark-mode switch…" (RestorePointsSection.tsx:90), but Dark Off takes none (DarkModeCard.tsx:100-105) and no theme-push point exists. OBSERVED.
- **[P2] B-7: Wrong reason in the BrandFromSource refusal toast.** It always blames "in use" (:221-223), but the facade refuses for other reasons too (facade.ts:65-75). OBSERVED.
- **[P2] B-8: Silent no-ops.** Connect Apply with 0 writes (ConnectTokensCheck.tsx:103-106), Dark Off ignoring its result (DarkModeCard.tsx:104), and applyStarter returning false (StartersSection.tsx:80-83) all give no feedback. OBSERVED.
- **[P2] B-9: Restore-point errors are swallowed with generic copy.** useBrandRestorePoints.ts:32-34,56-58. OBSERVED.
- **[P2] B-10: Starter "seen" flag is written but never read.** useApplyStarter.ts:20-32. OBSERVED.
- **[P2] B-11: "Component styles" has no style editor.** It is navigation only, and the docs name a non-existent "✦ Generate with AI" action (ComponentsSection.tsx:8-10). This is an AI leftover. OBSERVED.
- **[P2] B-12: AI leftovers.** The flag name `dsAi` gates a logo path that runs entirely in the browser (brandColors.ts:6), and AI comments remain (useProjectTokens.ts:6; facade.ts:69; StylePresetRegistryContext.tsx:120). OBSERVED.
- **[P2] B-13: Header doc contradicts the nav.** The header says Styles "is not a nav row" (BrandWorkspace.tsx:25-26), but it is one (:129). OBSERVED.
- **[P2] B-14: Duplicate token aggregation.** ExportSection.tsx:146-178 rebuilds from 14 hooks instead of `useProjectTokenStore().all`, and the same goes for the preset hooks (BrandWorkspace.tsx:348-362). OBSERVED.
- **[P2] B-15: Two controls drive one preview state on the Colour mode page.** DarkModeCard.tsx:183-185 and BrandWorkspace.tsx:901-903. OBSERVED.
- **[P2] B-16: Tailwind export promises an import that does not exist.** It says "banner surfaces this before commit", but import accepts JSON only (ExportSection.tsx:376-377; ImportCard.tsx:24-31). OBSERVED.
- **[P2] B-17: Dead code (table above).** Note that ColorMode still reads localStorage when it is constructed (ColorMode.ts:7-17). OBSERVED.
- **[P2] B-18: Hygiene.** Inline style objects (StylesRouter.tsx:110-123), a no-op onChange (ColourModeSection.tsx:135), and a middle-man re-export (constants.ts:8). OBSERVED.
- **[P2] B-19: Add class targets a selection made before Brand opened.** Brand covers the canvas (ClassAddDialog.tsx:33,41-52). OBSERVED code; UX impact INFERRED.

Duplication check: TokenRegistryContext and useProjectTokens are views over a single `projectSettings.designTokens` commit, so they are **not** a duplicate store (TokenRegistryContext.tsx:1-13; useProjectTokens.ts:40-55). OBSERVED. The parallel stores are the dead engine ColorMode, the preset localStorage cache (B-3) and the global lint suppressions (B-1).

#### Cross-surface duplication (concept → implementations)
- **Restore / version systems: five.**
  - Editor undo stack (History Session; Time-Travel)
  - Site versions (History Saves; IndexedDB + `siteVersions.*`)
  - Publish rollback (`sites.rollback`)
  - Brand restore points (`theme.createBrandRestorePoint` / `brandRestorePoints`)
  - Media asset versions, which is itself split in two (M-5)

  Each has its own restore semantics and UI. OBSERVED (files cited in §1, §3, §5).
- **Compare: two.** CompareHost (approved / published / current) vs the inline Saves CompareView (H-2). OBSERVED.
- **Site-column writers: two.** Settings Save vs the autosave mirror (S-14). The dashboard has per-site settings pages too (INFERRED, S-11).
- **Icon pickers: two** (M-12).
- **Alt-text commit models: two** (M-4).
- **CMS import paths with opposite authority: two** (C-11).
- **tRPC client singletons: separate `createBuildrikApiClient` calls** (M-17).

#### tRPC procedures called by these surfaces (router.procedure → caller file:line)
Settings and Activity are called directly; the others mostly through `services/*`. Cross-check against `server/trpc/routers/`.

**Activity**
- `activity.recent` → services/ActivityService.ts:57

**CMS**
- `cms.collections.list` → services/cmsSync.ts:604
- `cms.entries.list` → cmsSync.ts:672
- `cms.collections.upsert` → cmsSync.ts:765
- `cms.collections.delete` → cmsSync.ts:868
- `cms.entries.upsert` → cmsSync.ts:897
- `cms.entries.delete` → cmsSync.ts:964
- `cms.publishSnapshot` → cmsSync.ts:492 (from shell/exportPublishPages.ts:89)
- `cms.entries.importCsvPreview` → editor/cms/CsvImportDialog.tsx:79
- `cms.entries.importCsv` → CsvImportDialog.tsx:104
- `cms.dynamicPages` → editor/sidebar/tabs/pages/useDynamicPagesSummary.ts:66

**Comments**
- `comments.list` → services/ReviewService.ts:192
- `comments.create` → ReviewService.ts:286, 301
- `comments.reattach` → ReviewService.ts:311
- `comments.resolve` → ReviewService.ts:318

**Forms**
- `forms.listBlocks` → editor/sidebar/tabs/settings/screens/FormsScreen.tsx:124
- `forms.listSubmissions` → FormsScreen.tsx:149
- `forms.updateSubmission` → FormsScreen.tsx:171
- `forms.deleteSubmission` → FormsScreen.tsx:181
- `forms.exportSubmissions` → FormsScreen.tsx:197

**Media**
- `media.uploadPrefix` → services/AssetUploadService.ts:115
- `media.createAsset` → AssetUploadService.ts:156
- `media.deleteAsset` → AssetUploadService.ts:211
- `media.createFolder` → AssetUploadService.ts:223
- `media.deleteFolder` → AssetUploadService.ts:236
- `media.moveAsset` → AssetUploadService.ts:247
- `media.updateAsset` → AssetUploadService.ts:259
- `media.renameFolder` → AssetUploadService.ts:277 (no UI)
- `media.listAssets` → services/BuildrikSyncProvider.ts:975
- `media.listFolders` → BuildrikSyncProvider.ts:994
- `media.checkStorageQuota` → editor/sidebar/tabs/media/hooks/useServerStorageQuota.ts:61
- `media.searchStockPhotos` → services/stock/StockService.ts:111
- `media.searchStockVideos` → StockService.ts:125
- `media.listAssetVersions` → services/MediaVersionService.ts:39
- `media.createAssetVersion` → MediaVersionService.ts:49
- `media.restoreAssetVersion` → MediaVersionService.ts:54

**Reviews**
- `reviews.status` → services/ReviewService.ts:62, 79
- `reviews.submit` → ReviewService.ts:126
- `reviews.currentRound` → ReviewService.ts:218
- `reviews.rounds` → ReviewService.ts:240
- `reviews.approvedSnapshot` → ReviewService.ts:252
- `reviews.revoke` → ReviewService.ts:267

**Site detail**
- `siteDetail.settings.get` → settings/screens/SiteSettingsScreen.tsx:229, SeoScreen.tsx:145, LocalizationScreen.tsx:93, AccessScreen.tsx:88, AdvancedScreen.tsx:231, HeadersScreen.tsx:139; editor/shared/useSiteOrigin.ts:34
- `siteDetail.settings.update` → services/BuildrikSyncProvider.ts:454, 895
- `siteDetail.projectSettings.update` → BuildrikSyncProvider.ts:470
- `siteDetail.settingsOverview` → settings/screens/OverviewScreen.tsx:35
- `siteDetail.locales` → LocalizationScreen.tsx:94, 117
- `siteDetail.analyticsStatus` → AnalyticsScreen.tsx:221, 252
- `siteDetail.domains.list` → DomainsScreen.tsx:177, 207; SeoScreen.tsx:146; DangerZoneScreen.tsx:131; editor/shared/useSiteOrigin.ts:35
- `siteDetail.domains.usesVercel` → DomainsScreen.tsx:188
- `siteDetail.domains.update` → DomainsScreen.tsx:226
- `siteDetail.domains.check` → DomainsScreen.tsx:240
- `siteDetail.domains.remove` → DomainsScreen.tsx:255
- `siteDetail.domains.setPrimary` → DomainsScreen.tsx:274
- `siteDetail.domains.connect` → DomainsScreen.tsx:286
- `siteDetail.domains.checkAvailability` → DomainsScreen.tsx:339
- `siteDetail.redirects.list` → RedirectsScreen.tsx:188, 210
- `siteDetail.redirects.suggestions` → RedirectsScreen.tsx:189, 211
- `siteDetail.redirects.export_csv` → RedirectsScreen.tsx:231
- `siteDetail.redirects.import_csv` → RedirectsScreen.tsx:277
- `siteDetail.redirects.delete` → RedirectsScreen.tsx:290
- `siteDetail.redirects.create` → RedirectsScreen.tsx:306, 339, 357, 381
- `siteDetail.redirects.update` → RedirectsScreen.tsx:338

**Site versions**
- `siteVersions.create` → services/versionSync.ts:63
- `siteVersions.rename` → versionSync.ts:87
- `siteVersions.delete` → versionSync.ts:106
- `siteVersions.list` → versionSync.ts:139
- `siteVersions.get` → versionSync.ts:191

**Sites**
- `sites.publish` → services/PublishService.ts:94
- `sites.publishStatus` → PublishService.ts:120
- `sites.get` → PublishService.ts:136, 230; settings/screens/DangerZoneScreen.tsx:130
- `sites.retryFormsActivation` → PublishService.ts:158
- `sites.retryPostDeploy` → PublishService.ts:163
- `sites.cancelPublish` → PublishService.ts:183
- `sites.publishHistory` → PublishService.ts:273
- `sites.rollback` → PublishService.ts:290
- `sites.prePublishChecks` → PublishService.ts:308
- `sites.unpublish` → PublishService.ts:319
- `sites.publishDiff` → PublishService.ts:334
- `sites.publishedSnapshot` → PublishService.ts:341
- `sites.myRole` → DangerZoneScreen.tsx:132; services/RoleService.ts:34
- `sites.archive` → DangerZoneScreen.tsx:155
- `sites.unarchive` → DangerZoneScreen.tsx:171; OverviewScreen.tsx:226
- `sites.transfer` → DangerZoneScreen.tsx:200
- `sites.delete` → BuildrikSyncProvider.ts:647
- `sites.saveProject` → BuildrikSyncProvider.ts:874 (carries Brand tokens, siteVariables, conditions)
- `sites.loadForEditor` → BuildrikSyncProvider.ts:754, 791

**Team**
- `team.list` → DangerZoneScreen.tsx:185

**Theme (Brand)**
- `theme.createBrandRestorePoint` → editor/design-system/state/useBrandRestorePoints.ts:24
- `theme.brandRestorePoints` → useBrandRestorePoints.ts:45
- `theme.brandRestorePoint` → useBrandRestorePoints.ts:55
- `theme.extractBrandFromUrl` → editor/design-system/ui/sections/BrandFromSource.tsx:188 (dsAi)

**Upload**
- `upload.presign` → settings/screens/SiteSettingsScreen.tsx:86
- `upload.confirm` → SiteSettingsScreen.tsx:102

**Non-tRPC fetches**
- `POST ${DASHBOARD_URL}/api/asset-upload` (AssetUploadService.ts:118, through @vercel/blob)
- PUT to the presigned uploadUrl (SiteSettingsScreen.tsx:92)
- `POST ${DASHBOARD_URL}/api/site-thumbnail/<id>` (shell/captureThumbnail.ts:79)

#### Counts
**Feature rows by status**

Machine count over the condensed tables in this file.

| Surface | WIRED | UNREACHABLE | DEAD | STUB | FLAGGED-OFF |
|---|---|---|---|---|---|
| Assets | 55 | 2 | 5 | 0 | 0 |
| CMS | 31 | 0 | 0 | 2 | 0 |
| Brand | 33 | 0 | 6 | 0 | 4 |
| Settings | 59 | 0 | 1 | 0 | 0 |
| History | 31 | 0 | 1 | 0 | 0 |
| Review | 16 | 0 | 0 | 0 | 0 |
| Activity | 5 | 0 | 0 | 0 | 0 |
| Publish | 19 | 0 | 0 | 1 | 0 |
| **Total** | **249** | **2** | **13** | **3** | **4** |

The sub-readers' finer-grained rows were Assets 87 WIRED, CMS 57 WIRED / 3 STUB, Brand 52 WIRED / 6 FLAGGED-OFF / 6 DEAD, and Settings 64 WIRED.

**Issues by severity**

| Severity | Count | IDs |
|---|---|---|
| P0 | 0 | — |
| P1 | 24 | M-1..6, C-1..7, B-1..3, S-1, S-2, S-4, H-1, R-1, P-1..3 |
| P2 | 69 | — |

Total: 93 issues.

No P0 was proven statically. The closest candidates are:
- **M-2:** a folder delete hard-deletes in-use images, with no grace period or undo.
- **C-5:** a collection delete strips bindings before a delete that can fail.
- **C-1:** sources are lost on reload.

All three are rated P1 because each needs a specific user action or a failure before it does damage.


---

## 6. Feature inventory — Canvas and Inspector

> Read pass output, included verbatim with headings demoted one level. Its labels (O/I/U, OBSERVED/INFERRED/UNKNOWN) and `file:line` citations are its own; its revision note is in its first lines.

### Inventory C — Canvas + Inspector (static, read-only)

**Revision read:** worktree `~/Desktop/buildrik-worktrees/phase1-integration`, branch `feat/phase1-integration`.
Reading started at `6dbe51b25`; the worktree moved mid-run to **`dc72314c2`** (merge BD-32..BD-37). Every row touching the files that merge changed was re-checked against `dc72314c2` (`git diff 6dbe51b25 dc72314c2`): `ProInspector.tsx`, `useInspectorState.ts`, `useStyleHandlers.ts`, `ComponentRow.tsx`, `registry/behaviour.tsx`, `commandOperations.ts`, `defaultCommands.ts`, `Composer.ts`. Line numbers below are from `dc72314c2`. `Canvas.tsx` line numbers marked `~` are ±2 lines.
Paths are relative to `packages/editor/src/`.

**Labels.** **O** = OBSERVED (I read the line). **I** = INFERRED (from what is stated). **U** = UNKNOWN.
**Persistence.** "Autosave" means the write mutates engine project state (element tree / StyleManager rules / projectSettings) inside a transaction. That emits `project:changed`, which schedules the autosave (I, from the `useCanvasInlineEdit.ts:179-182` comment; I did not trace the autosave scheduler). "Server" means a direct tRPC/REST call. "None" means local UI state only.
**Flags** (O `shared/utils/featureFlags.ts`, `runtimeEnv.ts:43-58`): `publish`, `dsAi` and `collab` are true only when `VITE_*` / `NEXT_PUBLIC_*` equals `"true"`. The default is off. Nothing in the canvas or inspector reads a flag directly. Collab gating is in `shell/StudioHeader.tsx:319` (O).

---

#### 1. Canvas — feature rows

##### 1a. Mount, content, rendering

| Feature | Entry point | Engine/server path | Persistence | Flag | Status |
|---|---|---|---|---|---|
| Canvas HTML mount | `editor/canvas/Canvas.tsx:~812` (`dangerouslySetInnerHTML`) | `useCanvasSync.ts:33` → `composer.elements.toHTML()`; content is sanitised per element by `contentToHTML` (`shared/utils/html/sanitization.ts:206`) | n/a | – | WIRED (O) |
| CMS binding preview on canvas | `hooks/useCanvasContent.ts:31` → `useCMSPreview.ts:51-102` | `engine/cms/RepeaterRenderer.ts:42-55` `writeBoundValue` (richtext → `sanitizeRichtext`, otherwise `textContent`/`setAttribute` after `isSafeCmsBoundValue`) | none (display only) | – | WIRED (O) |
| Collection-list repeater preview | `useCMSPreview.ts:62` | `RepeaterRenderer.expandCollectionLists` | none | – | WIRED (O) |
| Animation keyframes on canvas | `Canvas.tsx:~791` `<style>{keyframesStyleSheet()}` | `shared/constants/animationKeyframes` | n/a | – | WIRED (O) |
| Global custom CSS live | `Canvas.tsx:~793` + `hooks/useGlobalCustomCss.ts` | project settings (Settings → Advanced) | autosave (I) | – | WIRED (O for mount) |
| Slider / countdown / accordion runtimes | `Canvas.tsx:~477-481` | `useSliderRuntime`, `useCountdownRuntime`, `useAccordionRuntime` | none | – | WIRED (O) |
| Lock / hidden editor DOM flags | `Canvas.tsx:~484` `useCanvasEditorFlags` | DOM-only flags | none | – | WIRED (O) |
| Link/form navigation guard | `Canvas.tsx:~119-125` `useCanvasNavigationGuard` | DOM listeners | none | – | WIRED (O) |
| Loading skeleton | `Canvas.tsx:~814` | `useProjectLoading` | none | – | WIRED (O) |
| Empty-page CTA: Browse templates | `Canvas.tsx:~831` emits `ui:browse-templates` | listener at `shell/StudioPanels.tsx:348` | none | – | WIRED (O) |
| Empty-page CTA: Add a block | `Canvas.tsx:~835-839` emits `ui:switch-tab` + `requestInsertGroup` | StudioPanels tab seam | none | – | WIRED (O) |
| Empty-page CTA: Start blank | `Canvas.tsx:~840-843` | `ui:switch-tab {tab:"add"}` | none | – | WIRED (O) |
| Project-unavailable suppression | `Canvas.tsx:~508-516` | `EVENTS.PROJECT_UNAVAILABLE` | none | – | WIRED (O) |
| Multi-delete confirm | `Canvas.tsx:~846` `DeleteSelectionConfirm` | `inspector/components/DeleteConfirmModal` | – | – | WIRED (I, from mount; body not read) |
| Width label under the page | `Canvas.tsx:~898-905` | – | none | – | WIRED (O) |
| Single aria-live region | `Canvas.tsx:~975-977` | – | none | – | WIRED (O) |
| Imperative ref (undo/redo/getHTML/getCSS) | `Canvas.tsx:~581-590` | `composer.history.*`, `composer.exportHTML()`, `composer.styles.toCSS()` | – | – | WIRED (O) |
| `onOpenImageEditor` prop | passed at `shell/StudioPanels.tsx:846`; declared at `Canvas.types.ts:43` | **not destructured or used in `Canvas.tsx:79-97`** | – | – | DEAD (O) |

##### 1b. Selection, hover, multi-select

| Feature | Entry point | Engine path | Persistence | Flag | Status |
|---|---|---|---|---|---|
| Click select (+ locked refusal) | `Canvas.tsx:~632` → `hooks/useSelectionBehavior.ts` (locked checks at :94,112,140) | `composer.selection.*` | none | – | WIRED (O) |
| Cmd/Ctrl click-through | `useSelectionBehavior.ts:247` | selection | none | – | WIRED (O) |
| Shift additive select | `useSelectionBehavior.ts:248` | selection | none | – | WIRED (O) |
| Marquee select | `Canvas.tsx:~439` `useCanvasMarquee` | selection | none | – | WIRED (O, mount) |
| Background click → deselect | `Canvas.tsx:~641-648` | `composer.selection.clear()` + `UI_CANVAS_BACKGROUND_CLICK` (listener `StudioPanels.tsx:396`) | none | – | WIRED (O) |
| Select all (⌘A) | `hooks/useCanvasKeyboard.ts:93-96` | `composer.selection.selectAll()` | none | – | WIRED (O) |
| Tab cycles elements | `useCanvasKeyboard.ts:101` | selection | none | – | WIRED (O) |
| Shift+F10 opens the context menu | `useCanvasKeyboard.ts:123` | `setContextMenu` | none | – | WIRED (O) |
| Hover overlay (minimal/box-model, Alt/Shift/Ctrl levels) | `overlays/ElementHoverOverlay.tsx`, from `CanvasOverlayGroup.tsx:~200` | DOM read | none | – | WIRED (O, mount) |
| Hover → Layers sync event | `Canvas.tsx:~452` emits `EVENTS.CANVAS_HOVER` | listener `shell/StudioPanels.tsx:673` | none | – | WIRED (O) |
| Spacing labels on hover | `ElementHoverOverlay.tsx:399` `SpacingLabels` | DOM read | none | – | WIRED (O) |
| Selection box + label | `CanvasOverlayGroup.tsx:~250-265` `SelectionBoxOverlay`, `SelectionLabel` | – | none | – | WIRED (O) |
| Selection a11y announcement | `Canvas.tsx:~603-610` `useSelectionAnnouncement` | – | none | – | WIRED (O) |
| Selection readout in footer | `Canvas.tsx:~180-185` `useSelectionReadout` | – | none | – | WIRED (O) |
| Inspector/Content "pick element" mode | `Canvas.tsx:~212-238` + `~616-631` | emitter is `sidebar/tabs/content/ContentTab.tsx:97`; result listener at `:91` | none | – | WIRED (O) |
| Multi-select bar Align ×6 (Inspector) | `inspector/components/MultiSelectBar.tsx:47-53` | `engine/canvas/AlignmentHandler.ts:84-126` → `setStyleAt` left/top (:225-236) | autosave | – | WIRED, but in-flow elements see no effect (see ISS-C08) (O) |
| Multi-select Distribute H/V | `MultiSelectBar.tsx:93,102` | `AlignmentHandler.distribute` (:185) | autosave | – | WIRED, same caveat (O) |
| Multi-select Group | `MultiSelectBar.tsx:109` `commands.run("group")` | `engine/commands/defaultCommands.ts:126-137` → `ElementManager.groupElements` (:221) | autosave | – | WIRED, no lock gate (ISS-C05) (O) |

##### 1c. Selection toolbar (on-canvas pill)

| Feature | Entry point | Engine path | Persistence | Flag | Status |
|---|---|---|---|---|---|
| Duplicate | `controls/UnifiedSelectionToolbar.tsx:182` → `hooks/useCanvasToolbarActions.ts` | `commands.run("duplicate")` (`defaultCommands.ts:154`) | autosave | – | WIRED (O) |
| Delete | `UnifiedSelectionToolbar.tsx:185` | `commands.run("delete")` (`defaultCommands.ts:88`) | autosave | – | WIRED (O) |
| ⋯ More → element menu | `UnifiedSelectionToolbar.tsx:195-198` | `setContextMenu` | none | – | WIRED (O) |

##### 1d. Context menu — every item (`menus/contextMenuRegistry.ts:46-69`)

The visibility filter is at `contextMenuRegistry.ts:71-96`. The enabled state and disabled reason render at `menus/ElementContextMenu.tsx:67,132`. Readonly mode withholds `onContextMenu` (`Canvas.tsx:~762`). A locked element is refused with a toast (`Canvas.tsx:~666-674`).

| Item (group) | Defined | Handler → engine | Visible / enabled rule | Persistence | Status |
|---|---|---|---|---|---|
| Duplicate (top) | `menus/actions/editActions.ts:100` via `standaloneActions.ts:18` | `editor/shared/elementActions.ts:112` → `commands.run("duplicate")` | – | autosave | WIRED (O) |
| Delete (top) | `editActions.ts:101` | `elementActions.ts:186` → `commands.run("delete")` | not root (:183) | autosave | WIRED (O) |
| Arrange › Bring to front | `actions/layoutActions.ts:12-22` | `commands.run("bring-to-front")` (`defaultCommands.ts:479`) | not root | autosave | WIRED (O) |
| Arrange › Bring forward | `layoutActions.ts:23-33` | `defaultCommands.ts:463` | not root | autosave | WIRED (O) |
| Arrange › Send backward | `layoutActions.ts:34-44` | `defaultCommands.ts:471` | not root | autosave | WIRED (O) |
| Arrange › Send to back | `layoutActions.ts:45-55` | `defaultCommands.ts:487` | not root | autosave | WIRED (O) |
| Style › Copy style | `actions/styleActions.ts:13` | `elementActions.ts:120` → `commands.run("copy-style")` (`defaultCommands.ts:188`) | – | composer.styleClipboard (none) | WIRED (O) |
| Style › Paste style | `styleActions.ts:14` | `elementActions.ts:130` → `defaultCommands.ts:207` → `pasteStyles` (`commandOperations.ts:352`), written at active breakpoint + Inspector pseudo-state (BD-36) | enabled when clipboard has styles (:128) | autosave | WIRED (O, re-checked @dc72314c2) |
| Structure › Wrap in container | `actions/insertActions.ts:14-23` | `canvas/utils/wrapInContainer.ts` | not root | autosave | WIRED (O) |
| Structure › Unwrap element | `insertActions.ts:24-39` | `writeElement(... el.unwrap())` | enabled when unwrappable and has children | autosave | WIRED (O) |
| Structure › Copy | `editActions.ts:12-36` | `commands.run("copy")` (`defaultCommands.ts:269`) + OS clipboard | – | none | WIRED (O) |
| Structure › Cut | `editActions.ts:37-68` | `commands.run("cut")` (`defaultCommands.ts:286`); OS clipboard gets `element.getData()` | not root | autosave | WIRED; OS-clipboard payload stale (ISS-C17) (O) |
| Structure › Paste | `editActions.ts:69-96` | `commands.run("paste")` (`defaultCommands.ts:309`) | enabled when clipboard has content | autosave | WIRED (O) |
| Structure › Replace with block… | `standaloneActions.ts:35` | `elementActions.ts:222-225` → `UI_SWITCH_TAB` + `requestReplaceWithBlock` (`sidebar/tabs/build/insertGroupRequest.ts:37`) | section types only; disabled when locked | autosave (on pick) | WIRED (O) |
| Structure › Save as component | `standaloneActions.ts:38` | `elementActions.ts:158` → `COMPONENT_SAVE_AS_REQUESTED` (listener `shell/hooks/useEditorEventListeners.ts:161`) | not root | autosave (I) | WIRED (O) |
| Lock | `standaloneActions.ts:81` | `commands.run("lock-element")` (`defaultCommands.ts:233`) | unlocked, not root | autosave | WIRED (O) |
| Unlock | `standaloneActions.ts:82` | `defaultCommands.ts:247` | locked (unreachable from the canvas: a locked right-click is refused at `Canvas.tsx:~666`) | autosave | WIRED via ⋯ More / Inspector only (O) |
| Group | `standaloneActions.ts:40-56` | **`composer.elements.groupElements` directly**, not `commands.run("group")` | ≥2 selected | autosave | WIRED; duplicate path, no lock gate (ISS-C05, C16) (O) |
| Ungroup | `standaloneActions.ts:57-79` | `writableElements` + `ungroupElement` (lock refused at `ElementManager.ts:252`) | container with children | autosave | WIRED (O) |
| Bind to CMS field… | `standaloneActions.ts:36` | `elementActions.ts:198-201` → select + `UI_INSPECTOR_FOCUS_SECTION {cms-binding}` (listeners `StudioPanels.tsx:513`, `inspector/hooks/usePropertyJump.ts:121`) | `BINDABLE_TYPES` | none | WIRED (O) |
| Add interaction | `standaloneActions.ts:37` | `elementActions.ts:209-212` → `UI_INSPECTOR_FOCUS_SECTION {interactions}` | not root | none | WIRED (O) |

The `INSPECTOR_MENU` rows (`elementActions.ts:229-241`: duplicate, copy-style, paste-style, apply-style-to-page, reset-style, save-as-component, lock/unlock, delete) render from `inspector/components/InspectorElementMenu.tsx`. "Apply style to all…" → `UI_APPLY_STYLE_REQUESTED` → `ProInspector.tsx:114-121` → `components/ApplyStyleDialog.tsx:50` `applyStyleToPeers`. Status WIRED (O). "Reset style" → `commands.run("reset-style")` (`defaultCommands.ts:222`). Status WIRED (O).

##### 1e. Canvas keyboard (`hooks/useCanvasKeyboard.ts`, frame `onKeyDown` withheld in readOnly at `Canvas.tsx:~746`)

| Key | Line | Engine path | Persistence | Status |
|---|---|---|---|---|
| Delete / Backspace | :145-153 | `commands.run("delete")` | autosave | WIRED (O) |
| Escape → deselect | :188-192 | `clear()` | none | WIRED (O) |
| ↑↓←→ navigate prev/next/parent/child | :194-240 | selection | none | WIRED (O) |
| ⌘+arrow nudge 1px / ⇧+arrow 10px | :173-185, :196-238 | `keyboard/keyboardHelpers.ts:103-123` `moveElementPosition` → `writeCanvasStyles` (lock gate + active breakpoint). Refuses static position with a toast | autosave | WIRED (O) |
| ⌥↑/⌥↓, ⌥Home/⌥End reorder | :200,213,244,256 → `keyboardHelpers.ts:127-176` | `writableElements` + `moveElement` in a transaction | autosave | WIRED (O) |
| Home / End → first/last sibling | :242-264 | selection | none | WIRED (O) |
| ⌘C/⌘V/⌘X/⌘D, ⌥⌘C/⌥⌘V | comment :266-277 | owned by CommandCenter (window-wide) | autosave | WIRED (I, from comment; CommandCenter not traced) |

##### 1f. Drag and drop (four separate mechanisms — see ISS-C10)

| Feature | Entry point | Engine path | Persistence | Flag | Status |
|---|---|---|---|---|---|
| Drop from Add panel (block/template/component/element) | `Canvas.tsx:~757-759` → `hooks/useCanvasDragDrop.ts` → `drag/useDropExecution.ts` → `drag/dropOperations.tsx:292,349,443` | `instantiate-component-drop`, `insert-template-drop`, `insert-block-drop` transactions | autosave | – | WIRED (O) |
| Add-row insert announcement | `CanvasOverlayGroup.tsx:~172-182` `useInsertDrag` | – | none | – | WIRED (O) |
| OS file / media drop | `drag/mediaDrop.ts` | upload, then insert | server upload + autosave (I) | – | WIRED (I, file not read in full) |
| Drop success toast + Undo | `Canvas.tsx:~151-167` | `composer.history.captureUndo()` | – | – | WIRED (O) |
| Move existing element (HTML5 drag) | `hooks/useCanvasElementDrag.ts:171-245` (dragstart), drop via `useCanvasDragDrop` → `dropOperations.tsx:252-262` | `moveElement` in a `move-element` transaction; lock gate at :195 | autosave | – | WIRED (O) |
| Multi-element move | `dropOperations.tsx:106-137` | `multi-element-move` | autosave | – | WIRED (O) |
| Ctrl/Cmd+drag clone | `useCanvasElementDrag.ts:215-237` | `duplicateElement` at **dragstart** | autosave | – | WIRED; runs in readOnly (ISS-C03) (O) |
| Drag auto-scroll | `useElementDragAutoScroll`, `useDragAutoScroll` | – | none | – | WIRED (O, imports) |
| Smart guides / snap lines while dragging | `useCanvasElementDrag.ts:427-466`, `useCanvasSnapping` | `composer.canvas.indicators` | none | – | WIRED (O) |
| Drop feedback (slot, breadcrumb, invalid reason) | `CanvasOverlayGroup.tsx:~330` `DropFeedbackOverlay` | – | none | – | WIRED (O) |
| Hover drag handle "Drag to move element" | `overlays/DragHandle.tsx:60-78` | dispatches a **synthetic** `dragstart` | none | – | STUB (I — ISS-C09) |
| Section reorder handles | `CanvasOverlayGroup.tsx:346` `SectionReorderHandles` → `hooks/useSectionReorder.ts:259-298` | `moveElement(section, root, toIndex)` | autosave | – | WIRED; no lock gate, no readOnly gate (ISS-C02) (O) |

##### 1g. Resize, spacing, rulers, grid, snapping

| Feature | Entry point | Engine path | Persistence | Flag | Status |
|---|---|---|---|---|---|
| Resize handles | `overlays/SelectionHandles.tsx` → `hooks/useCanvasResize.ts` → `engine/canvas/ResizeHandler.ts` | `engine/canvas/resize/DOMUpdater.ts:212,254` → `writeCanvasStyles` (lock + active breakpoint) | autosave | – | WIRED (O) |
| Resize snapping / constraints | `resize/SnapManager.ts`, `ConstraintManager.ts` | – | none | – | WIRED (I, from imports) |
| Spacing spots (click a value, type, Enter) | `spots/CanvasSpotSpacing.tsx:40-55`, shown when Spacing overlay is on (`CanvasOverlayGroup.tsx:~246`) | `writeCanvasStyles` `{type}-{side}` | autosave | – | WIRED (O) |
| Rulers overlay + create guide | `CanvasOverlayGroup.tsx:~215` `RulersOverlay` | `useCanvasGuides.ts:73` → `composer.setProjectSettings({canvasGuides})` | autosave (projectSettings) (I) | – | WIRED (O) |
| Drag / remove guide | `GuidesOverlay` | same | autosave (I) | – | WIRED (O) |
| Grid overlay + size | `GridOverlay`, footer `composer.setGridSize` (`Canvas.tsx:~883`) | composer state; `GRID_CHANGED` | U (whether gridSize persists) | – | WIRED (O) |
| Snap-to-grid follows the Grid switch | `Canvas.tsx:~407-409` `composer.setSnapToGrid(showGrid)` | – | none | – | WIRED (O) |
| X-Ray / Badges | `data-xray-mode` / `data-badges` attributes on the content (`Canvas.tsx:~806-807`) | CSS | none | – | WIRED (I, CSS rule not verified) |

##### 1h. Inline text editing + rich-text toolbar

| Feature | Entry point | Engine path | Persistence | Flag | Status |
|---|---|---|---|---|---|
| Double-click to edit | `Canvas.tsx:~761` → `hooks/useCanvasInlineEdit.ts:68-114` (tags `:33`; containers refused `:77`; locked refused at begin `:86`) | – | – | – | WIRED (O) |
| Inspector "Edit text on canvas" | `inspector/sections/typeBlock/EditTextRow.tsx:37` emits `UI_INLINE_EDIT_REQUEST` | `useCanvasInlineEdit.ts:117-127` | – | – | WIRED (O) |
| Commit on blur / Enter / Esc / outside click | `useCanvasInlineEdit.ts:156-239` | `sanitizeHTML(el.innerHTML)` → `element.setContent(html,"html")` in an `inline-edit` transaction | autosave | – | WIRED (O) |
| `ELEMENT_EDIT_INLINE` event | `useCanvasInlineEdit.ts:176` | **no listener** (grep of `ELEMENT_EDIT_INLINE` and `"element:edit-inline"`) | – | – | DEAD emit (O) |
| Toolbar: bold/italic/underline/strike | `editor/panels/RichTextEditor.tsx:41-62` → `hooks/useCanvasInlineCommands.ts:79-110` | DOM Range wrapping | persisted at commit | – | WIRED (O) |
| Toolbar: link / unlink | `RichTextEditor.tsx:30,301` → `useCanvasInlineCommands.ts:123-150` (`isSafeUrl` checked, forces `target=_blank`) | DOM | at commit | – | WIRED (O) |
| Toolbar: lists, justify ×4, indent/outdent, fontSize | `RichTextEditor.tsx:73-92,155` → `useCanvasInlineCommands.ts:173-185` `document.execCommand` | DOM | at commit | – | WIRED (O) |
| Toolbar: formatBlock | `RichTextEditor.tsx:133` → `:152` | DOM | at commit | – | WIRED (O); nesting risk (ISS-C19) |
| Toolbar: fore / highlight colour | `RichTextEditor.tsx:230,251` → `:186-197` (execCommand styleWithCSS) | DOM | at commit | – | WIRED (O) |
| Toolbar: remove format | `RichTextEditor.tsx:315` → `:198` | DOM | at commit | – | WIRED (O) |

##### 1i. Breakpoints, zoom, view menu (footer toolbar `CanvasFooterToolbar.tsx`)

| Feature | Entry point | Engine path | Persistence | Flag | Status |
|---|---|---|---|---|---|
| Breakpoint switch Desktop/Tablet/Mobile | `CanvasFooterToolbar.tsx:418-419`, rows `:146-150` | `onDeviceChange` → shell → `composer.device` (read by `activeBreakpoint`, `commandOperations.ts:248`) | none | – | WIRED (O) |
| Custom width… | `CanvasFooterToolbar.tsx:429-430` → `controls/CustomWidthModal.tsx` → `Canvas.tsx:~696-702` | `getBreakpointForWidth` | none (session) | – | WIRED (O) |
| Auto-fit on load and on device switch | `Canvas.tsx:~551-576` | `composer.setZoom` | none | – | WIRED (O) |
| Zoom presets / menu | `CanvasFooterToolbar.tsx:290-291,517` | `onZoomChange` | none | – | WIRED (O) |
| Zoom in/out/100% (⌘= ⌘- ⌘0) | `CanvasFooterToolbar.tsx:222-235` | `stepZoom` | none | – | WIRED (O) |
| Zoom to fit (⌘1) | `CanvasFooterToolbar.tsx:213-216,274` → `Canvas.tsx:~304-322` | `composer.setZoom(%)` | none | – | WIRED (O) |
| Zoom to selection (⌘2) | `CanvasFooterToolbar.tsx:218` → `Canvas.tsx:~327-346` | – | none | – | WIRED (O) |
| ⌘K Zoom in/out events | `Canvas.tsx:~414-427` (`EVENTS.ZOOM_IN/OUT`) | `composer.setZoom` | none | – | WIRED (O) |
| ⌘K zoom-in/out/reset commands | `defaultCommands.ts:589-605` | `c.setZoom` | none | – | WIRED (O); third zoom implementation (ISS-C15) |
| Overlay toggles: guides/spacing/grid/rulers/badges/xray (menu + ⌘; ⌘⇧; ⌘' ⌘R ⌘B ⌘⇧X) | `CanvasFooterToolbar.tsx:130-137,238-248,377-383` | `onOverlayChange` | U | – | WIRED (O) |
| Undo / Redo buttons | `CanvasFooterToolbar.tsx:313,327` | `composer.history.undo/redo` (`Canvas.tsx:~906-907`) | – | – | WIRED (O) |
| Device frame toggle | `DeviceFramePreview.tsx:244-246` | – | none | – | WIRED (O) |
| Keyboard cheat sheet / legend | `controls/KeyboardCheatSheet.tsx`, `KeyboardLegend.tsx` mounted in `shell/StudioModals.tsx` | – | none | – | WIRED (O, import) |

##### 1j. Comments and collaboration

| Feature | Entry point | Engine/server path | Persistence | Flag | Status |
|---|---|---|---|---|---|
| Comment mode + pins + click-to-pin | `Canvas.tsx:~901` → `comments/CommentLayer.tsx`; toggled by `StudioHeader.tsx:829` and `useEditorShortcuts.ts:125` | `services/ReviewService` `createPinnedComment`, `fetchReviewComments` | server | gated on `reviewsEnabled` (workspace agency layer, `StudioHeader.tsx:829`) | WIRED (O) |
| Orphan recovery / re-attach | `CommentLayer.tsx:184,315,413` | `reattachReviewComment` | server | same | WIRED (O) |
| Remote cursors | `overlays/RemoteCursorsOverlay.tsx:116-155` | `composer.collab.manager` | none | collab (`StudioHeader.tsx:319`) | FLAGGED-OFF (I) |
| Local cursor broadcast | `hooks/useCursorSync.ts:80-92` (no-op unless connected) | `collab.manager.updateCursor` | none | collab | FLAGGED-OFF (I) |

##### 1k. Engine-side canvas modules (`engine/canvas/**`)

| Module | Consumer | Status |
|---|---|---|
| `ResizeHandler.ts` + `resize/*` | `Composer.ts`, `SelectionBoxOverlay`, `useCanvasResize` | WIRED (O, imports) |
| `AlignmentHandler.ts` | `MultiSelectBar.tsx:39` only | WIRED (O) |
| `indicators/CanvasIndicators.ts` (+ SelectionIndicator, Guide, Measurement, AutoLayout, Snap, Spacing managers) | `Composer.ts` (`composer.canvas.indicators`); used for smart guides at `useCanvasElementDrag.ts:427` and in `useCanvasIndicators` | WIRED (O, imports); whether every sub-manager has a live caller is U |
| `canvasGeometry.ts` | `SelectionManager.ts`, `ResizeHandler.ts`, `SnapManager.ts` | WIRED (O) |

##### 1l. Barrel-only canvas hooks (no caller outside `hooks/index.ts`)

These are exported from `editor/canvas/hooks/index.ts`, but grep finds no use outside their own file and the barrel (tests excluded):

| Hook | Status |
|---|---|
| `useSelectionRect` | DEAD (O) |
| `useCanvasFloatingPanel` | DEAD (O) |
| `useEventListener` | DEAD (O) |
| `useElementRect` | DEAD (O) |
| `editor/canvas/shared/useCanvasDOM` (only `shared/index.ts`) | DEAD (O) |

---

#### 2. Inspector

##### 2a. Chassis (`editor/inspector/ProInspector.tsx`)

| Feature | Entry point | Engine path | Persistence | Flag | Status |
|---|---|---|---|---|---|
| Page panel when nothing or the root is selected | `ProInspector.tsx:300` → `components/PagePanel.tsx:111-172` (registry `page:true`: typography, size, spacing, fill → page root) | `useStyleHandlers` | autosave | – | WIRED (O) |
| Theme-toggle element inspector | `ProInspector.tsx:303-309` → `ThemeToggleInspector` | – | – | – | WIRED (O) |
| Loading state | `ProInspector.tsx:299` | – | – | – | WIRED (O) |
| Header: breadcrumb, name, ⋯, close | `components/InspectorHeader.tsx:38-110` (breadcrumb → `selection.select/clear`; close → `UI_TOGGLE_INSPECTOR`) | – | – | – | WIRED (O) |
| Rename element | `components/ElementNameField.tsx` | layer name | autosave (I) | – | WIRED (I, body not read) |
| Status marks (component / CMS / locked) | `components/StatusMarks.tsx:47-66` | `UI_INSPECTOR_FOCUS_SECTION` | – | – | WIRED (O) |
| Status line: Unlock | `components/StatusLine.tsx:48` | `commands.run("unlock-element")` | autosave | – | WIRED (O) |
| Read-only on lock / save conflict | `ProInspector.tsx:222-234` | `InspectorFieldContext` | – | – | WIRED (O) |
| Tabs Style · Behaviour · Effects | `ProInspector.tsx:333-342`, `registry/_shared.tsx:46-50` | – | none | – | WIRED (O) |
| Context row: State (hover/focus/…) | `ProInspector.tsx:344-353`, `useInspectorState(selectedElement, composer)` | publishes `composer.stylePseudoState` (BD-36) | none | – | WIRED (O, re-checked @dc72314c2) |
| Context row: Reset state / Revert breakpoint | `ProInspector.tsx:349,352` → `hooks/useFieldOverrides.ts:150-183` | `writeElement` + `styles.removeBreakpointStyleProperty` / `setRule(replace)` | autosave | – | WIRED (O) |
| Override dots: reset per field (breakpoint/pseudo/master) | `useFieldOverrides.ts:150-183` | as above; master → `components.resetInstanceOverride` | autosave | – | WIRED (O) |
| Section open/closed memory | `hooks/useInspectorSections.ts:40-84` | localStorage `buildrick-inspector-sections-v3` | browser only | – | WIRED (O) |
| ⌥-click toggle all | `tabs/InspectorTabContent.tsx:142` | – | browser | – | WIRED (O) |
| Scroll position per element | `ProInspector.tsx:241-284` | – | none | – | WIRED (O) |
| ⌘K "Jump to property" | `hooks/usePropertyJump.ts:87-123` | `commands.register` | none | – | WIRED (O) |
| Mixed values (multi-select) | `ProInspector.tsx:208-212` `detectMixedValues` | – | – | – | WIRED (O) |

##### 2b. Style write path (all Style and Effects controls)

- Single property: `onChange(property, value)` → `hooks/useStyleHandlers.ts:236-313` (O @dc72314c2).
  - Lock: `canWrite(primary)` at :241, then `writableElements` across the whole selection inside the flush.
  - Rate-limited to 50 ms (`WRITE_INTERVAL_MS`). One `style-change` transaction.
  - Each target → `setStyleAt(composer, el, bp, prop, value, pseudo)` (`commandOperations.ts:290`):
    - **desktop + normal** → `el.setStyle` / `el.removeStyle` (element-local base styles);
    - **tablet/mobile** → `styles.setBreakpointStyle(id, bp, …)` / `removeBreakpointStyleProperty`;
    - **pseudo ≠ normal** → `styles.setRule("#id-selector", …, {pseudo, mediaQuery})`.
  - `--hide-*` is forced to desktop/normal (:273-275).
- Batch: `onBatchChange(changes)` → `useStyleHandlers.ts:316-397`. It **re-implements** the same three branches inline (:347-378) and does not call `setStyleAt` (ISS-C14).
- **Class vs element-local:** every Inspector style write is element-local (`elementSelector(id)` rules or the element's own style map). No Inspector style control writes to a class rule. The CSS classes section only adds and removes class names (ISS-C07). The class-first model is not implemented in this surface (O, from the write path above; INFERRED absence across the whole tree only for `editor/inspector/**`).
- Per-breakpoint: yes (O). Per-state: yes, for Style and Effects. The context row is hidden on Behaviour (`ProInspector.tsx:311`), but the chosen state persists there (I).

##### 2c. Section × element-type matrix

Presence = `capability(caps)` over every selected type (intersection) + `shouldRender`. Order is `config/sectionOrder.ts:15-48` and the gate is `tabs/InspectorTabContent.tsx:75-84` (O). Capabilities come from `shared/constants/elementCapabilities.ts:118-185` (O). Type-block bodies come from `config/typeBlocks.ts:38-45`. Every `TypeBlockId` except `product` has a body (O).

Legend: ● shown · ○ "Text inside" (closed) · – absent · `I` = only on a component-instance root.

| Type group (types) | component | type block | layout | typography | text-inside | size·spacing·fill·border | form-fields·form-settings | slides·slider-settings | collection | link | cms-binding | visibility·interactions·css-classes·attributes | Effects ×5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| heading | I | ● heading | – | ● | – | ● | – | – | – | – | ● | ● | ● |
| text, paragraph | I | ● text | – | ● | – | ● | – | – | – | – | ● | ● | ● |
| label | I | ● text | – | ● | – | ● | – | – | – | – | – | ● | ● |
| link | I | ● text | – | ● | – | ● | – | – | – | ● | ● | ● | ● |
| button | I | ● button | – | – | ○ | ● | – | – | – | ● | ● | ● | ● |
| input, textarea, select, upload | I | ● input | – | – | ○ | ● | – | – | – | – | – | ● | ● |
| checkbox, radio, switch | I | ● choice | – | – | ○ | ● | – | – | – | – | – | ● | ● |
| image | I | ● image | – | – | – | ● | – | – | – | – | ● | ● | ● |
| video, audio | I | ● | – | – | – | ● | – | – | – | – | – | ● | ● |
| svg, icon | I | ● svg | – | – | – | ● | – | – | – | – | – | ● | ● |
| lottie, video-embed, map-embed | I | ● embed | – | – | – | ● | – | – | – | – | – | ● | ● |
| spacer, divider | I | **–** | – | – | – | ● | – | – | – | – | – | ● | ● |
| countdown, progress | I | ● widget | – | – | ○ | ● | – | – | – | – | – | ● | ● |
| accordion | I | ● accordion | – | – | ○ | ● | – | – | – | – | – | ● | ● |
| flex, stack | I | ● flex | – | – | ○ | ● | – | – | – | – | – | ● | ● |
| grid, columns | I | ● grid | – | – | ○ | ● | – | – | – | – | – | ● | ● |
| container, section, card, cta | I | – | ● | – | ○ | ● | – | – | – | ● | – | ● | ● |
| hero, features, header, footer, nav, navbar, pricing, social, testimonials, tabs, list, table, gallery, custom, product-card/grid/detail, unknown types (FALLBACK) | I | – | ● | – | ○ | ● | – | – | – | – | – | ● | ● |
| list-item (structural child) | I | – | ● | – | ○ | ● | – | – | – | – | – | ● | ● |
| form | I | – | ● | – | ○ | ● | ● | – | – | – | – | ● | ● |
| slider | I | – | ● | – | ○ | ● | – | ● | – | – | – | ● | ● |
| collection-list | I | – | ● | – | ○ | ● | – | – | ● | – | – | ● | ● |

Notes:
- Layout and text-inside are also hidden on an instance root unless overridden (`registry/_shared.tsx:170-174`, `box.tsx:50`, `text.tsx:123`).
- Multi-select of mixed types shows the type block only when every element shares the typeBlock (`InspectorTabContent.tsx:81`).

##### 2d. Section rows (controls → property → engine)

Unless stated, Style and Effects controls write through §2b (autosave, element-local, per breakpoint and state).

| Section | Registry | Controls → properties (O, from `onChange("…")` grep) | Engine path | Status |
|---|---|---|---|---|
| Component row | `registry/component.tsx:12-17` | Variant → `components.updateInstanceVariant`; Detach → `detachInstance`; Reset → `resetInstance`; "Push to master ↗" (renamed BD-32) → navigation | `sections/ComponentRow.tsx:78-105` (gated by `canWrite`) | WIRED (O, re-checked @dc72314c2) |
| Type block | `registry/type.tsx:15-21` → `typeBlock/TypeBlockSection.tsx` | per body: text/heading (`bodies/textBodies.tsx:50`), form (`formBodies.tsx:53-63,107`: type, name, placeholder, default, rows, options, required/disabled/multiple), media (`mediaBodies.tsx:98,140`; `SourceRow.tsx:101-129` src/alt/poster), embed (`embedBodies.tsx:41-96`: URL, ratio, autoplay, muted, controls, lottie src), widget (`widgetBodies.tsx:122-159`: countdown, progress value/max/label, accordion), layout flex/grid (`layoutBodies.tsx`) | attributes via `typeBlock/attributeWriter.ts:35-183` (`writableElements` + one transaction); styles via onChange | WIRED (O) |
| Layout › Display | `box.tsx:45-51`, `layout/DisplayControls.tsx` | display | §2b | WIRED (O) |
| Layout › Flex | `layout/FlexControls.tsx` | flex-direction, flex-wrap, justify-content, align-items, align-content | §2b | WIRED (O) |
| Layout › Grid | `layout/GridControls.tsx` | grid-template-columns/rows, grid-auto-flow, justify/align-content | §2b | WIRED (O) |
| Layout › Gap | `layout/GapRow.tsx` | gap, row-gap, column-gap | §2b | WIRED (O) |
| Layout › Item | `layout/ItemControls.tsx` | align-self, justify-self, order, flex-basis/grow/shrink, grid-column/row | §2b | WIRED (O) |
| Layout › Position | `layout/PositionControls.tsx` | position, top/right/bottom/left, z-index | §2b | WIRED (O) |
| Layout › Overflow/visibility | `layout/OverflowVisibilityControls.tsx` | overflow(-x/-y), visibility, float, clear, box-sizing | §2b | WIRED (O) |
| Typography | `text.tsx:105-125` → `typography/index.tsx`, `FontControls.tsx`, `TypographyControls.tsx`, `FontPicker.tsx` | font-family, color, font-size, font-weight, line-height, text-align, font-style, letter-spacing, text-decoration, text-indent, text-transform, vertical-align, white-space, word-break, word-spacing; "Site fonts" → `ui:site-fonts` (`FontPicker.tsx:45`) | §2b | WIRED (O) |
| Text inside | `text.tsx:118-125` (same component) | same keys, on the container (inherited) | §2b | WIRED (O) |
| Size | `box.tsx:64-69`, `SizeSection.tsx` | width, height, min/max-width, min/max-height | §2b | WIRED (O) |
| Spacing | `box.tsx:84-89`, `SpacingSection.tsx:64-79` | margin-*/padding-* (linked → `onBatchChange`) | §2b single + batch | WIRED (O) |
| Fill | `box.tsx:98-103`, `BackgroundSection.tsx` | background, background-color/image/size/position/repeat/attachment/blend-mode; token chips → `UI_OPEN_DESIGN_PANEL` (`shared/controls/ColorInput.tsx:335-341`) | §2b | WIRED (O) |
| Border | `box.tsx:117-121`, `BorderSection.tsx` | border-width/style/color/radius, outline-width/style/color/offset | §2b | WIRED (O) |
| Opacity | `effects.tsx:20-24` | opacity | §2b | WIRED (O) |
| Shadow | `effects.tsx:29-34` | box-shadow | §2b | WIRED (O) |
| Filters | `effects.tsx:39-44` | filter | §2b | WIRED (O) |
| Transform & motion | `effects.tsx:49-55` | transform, transition-property/duration/delay/timing-function | §2b | WIRED (O) |
| Effects advanced | `effects.tsx:60-66` | cursor, mix-blend-mode, text-shadow, will-change | §2b | WIRED (O) |
| Form fields | `behaviour.tsx:101-106`, `FormFieldsSection.tsx:76-154` | field type (replace element), label→placeholder, required, add, reorder | `writeElement(form, …)` + elements create/remove/move/setAttribute | autosave | WIRED (O) |
| Form settings (after submit) | `behaviour.tsx:111-116`, `FormAfterSubmitSection.tsx:97-150` | successAction, redirectUrl, notify, spam protection | **server** `forms.getBlock` / `forms.updateBlock` (tRPC), optimistic with revert | WIRED (O); not lock-gated (ISS-C20) |
| Slides | `behaviour.tsx:121-126`, `SlidesSection.tsx:94-146` | add, move, duplicate, delete slide | `writeElement(slider, …)` | autosave | WIRED (O) |
| Slider settings | `behaviour.tsx:131-136`, `SliderPlaybackSection.tsx:71` | autoplay/arrows/dots etc. as attributes | `writeElement(slider, setAttribute)` | autosave | WIRED (O) |
| Collection list | `behaviour.tsx:141-146`, `CollectionListSection.tsx:51-91` | collection, limit, unbind, open in CMS | `cms.bindings.bindCollectionList` / `unbindCollection` (`canWrite`) | autosave (I) | WIRED (O) |
| Link | `behaviour.tsx:151-156`, `LinkSection.tsx:151-271` | type (none/page/url/email/phone/anchor), page, URL (https-only), email, phone, anchor, target, rel | `writeElement` + `setAttribute href/target/rel` | autosave | WIRED (O) |
| CMS binding | `behaviour.tsx:166-171`, `CmsBindingSection.tsx:197-263` | collection, field, record, unbind, open record, create collection | `cms.bindings.bindToField` / `unbindAll` (`canWrite`); `UI_CMS_OPEN` | autosave (I) | WIRED (O) |
| Visibility | `behaviour.tsx:176-184`, `VisibilitySection.tsx:52-67` | show on Desktop/Tablet/Mobile → `--hide-{bp}` | §2b (forced base); read by `engine/styles/cascadeCSS.ts` + `ExportEngine.ts` (`hideRulesFor`) | WIRED (O) |
| Interactions | `behaviour.tsx:187-192` → `sections/interactions/*` | add / edit / delete interaction, element animation, preview | `writeElement(... "interactions-change" / "animation-change")` (`behaviour.tsx:47,72`); preview via WAAPI with runtime keyframes (BD, `behaviour.tsx` @dc72314c2) | autosave | WIRED (O, re-checked) |
| CSS classes | `behaviour.tsx:196-207`, `CSSClassesSection.tsx:115-130` | add class(es), remove class | `writeElement` `addClass` / `removeClass` | autosave | WIRED (O) |
| CSS classes › global-class suggestions | `CSSClassesSection.tsx:111-114` | `composer.styles.getGlobalClasses?.()` | **method does not exist in `engine/`** (grep empty) | – | DEAD / always empty (O) |
| Attributes | `behaviour.tsx:210-224`, `attributes/AttributesSection.tsx:38-47` | id, title, tabindex + per-type rows (`config/attributeFields.ts`) via `typeBlock/PropertyField.tsx:181-197`; add data-/aria- (`DataAttributeEditor.tsx:64-76`) | `writableElements` / `writeElement` + `setAttribute` | autosave | WIRED (O); no list/remove for custom attrs (ISS-C06) |

##### 2e. Inspector modules with no live caller

| Module | Status |
|---|---|
| `inspector/config/contextEvaluator.ts` | Only `buildInspectorContext` is used (`cssContext.ts`); the header describes `showIf` over "groups.json", which no longer exists. Partly stale (O for usage; I for groups.json absence — not grepped) |

---

#### 3. ISSUES

| ID | Sev | Issue | Evidence | Label |
|---|---|---|---|---|
| ISS-C01 | P1 | **Inline edit does not re-check the lock at commit**, and it writes `setContent` directly rather than through `writeElement`. A lock applied mid-edit (another door, or a collaborator) is overwritten. | `useCanvasInlineEdit.ts:86` (check at begin only), `:165-171` (direct `setContent`) | O (code); I (scenario) |
| ISS-C02 | P1 | **Section reorder bypasses the lock gate and readOnly.** `completeDrag` calls `moveElement` with no `writableElements`. The `SectionReorderHandles` mount sits outside the `!readOnly` block, so in `?view=readonly` a viewer can reorder sections (the engine's readOnly guard covers commands only). | `useSectionReorder.ts:277-279`; `CanvasOverlayGroup.tsx:346` (outside the `selectedId && !readOnly` block at :244); `engine/commands/CommandCenter.ts:152` (readOnly applies only to `MUTATING_COMMANDS`) | O |
| ISS-C03 | P1 | **Element drag is not readOnly-gated.** `useCanvasElementDrag` gets no `readOnly`. Ctrl/Cmd+drag runs `duplicateElement` at dragstart, so it mutates even in read-only view and even if the drop is abandoned. | `Canvas.tsx:~275` (no readOnly arg); `useCanvasElementDrag.ts:215-231` | O (code); I (clone survives a cancelled drop — dragend body not fully read) |
| ISS-C04 | P1 | Drop / move into a **locked container** is not refused. Only the replace target is lock-checked in drop execution. | `drag/useDropExecution.ts:241` is the only lock check; `dropOperations.tsx:106-137,252-262` have none | O (absence in those files); I (lock semantics for children) |
| ISS-C05 | P1 | **Group ignores locks**, on all three doors (canvas menu, Multi-select bar, ⌘G command). `groupElements` reparents locked elements into a new container. Ungroup is guarded; Group is not. | `standaloneActions.ts:48-55`; `defaultCommands.ts:130-136`; `ElementManager.ts:221-241` (no `isLocked`) vs `:252` | O |
| ISS-C06 | P1 | **Attributes:** custom data-/aria- attributes can be added but **never listed, edited or removed** in the UI. The summary counts them (`attributesSummary`). Users can also write `data-buildrick-*` names: `buildrick-id` becomes `data-buildrick-id`, an internal attribute, with no guard. | `DataAttributeEditor.tsx:64-76` (add only); `AttributesSection.tsx:27-36,38-47` | O (no remove UI); I (effect of overriding `data-buildrick-id` depends on serializer order — U) |
| ISS-C07 | P1 | **Global-class suggestions always empty.** `CSSClassesSection` calls `composer.styles.getGlobalClasses?.()`, which no engine module defines. More broadly, classes are names only: no Inspector control styles a class (no class-first write path), so a class added here carries no styles unless custom CSS defines it. | `CSSClassesSection.tsx:111-114`; grep `getGlobalClasses` in `engine/` → no hits; `design-system/ui/sections/ClassesSection.tsx:18` comment confirms | O |
| ISS-C08 | P1 | **Align / Distribute compute from authored CSS, not rendered geometry.** Missing left/width default to `0`/`100`. They write `left`/`top` without setting `position`, so for in-flow (static) elements the buttons change stored styles and nothing visible. (Keyboard nudge refuses static with a toast; Align does not.) | `AlignmentHandler.ts:62-66` (stylesAt + defaults), `:225-236` (writes left/top only); contrast `keyboardHelpers.ts:115-116` | O |
| ISS-C09 | P1 | **Hover DragHandle "Drag to move element" is a stub.** It dispatches a synthetic `DragEvent("dragstart")`. Untrusted synthetic drag events do not start a browser drag session, so no drag/drop follows, and the dragstart listener may still fade/clone the element. Keyboard Enter only toggles `aria-pressed`. | `overlays/DragHandle.tsx:60-78,99-105`; listener `useCanvasElementDrag.ts:171` | O (code); I (browser behaviour per HTML DnD spec) |
| ISS-C10 | P2 | **Four drag mechanisms** for moving content: HTML5 element drag (`useCanvasElementDrag`), drop pipeline (`useCanvasDragDrop` + `drag/*`), section reorder (`useSectionReorder` + handles), synthetic DragHandle. Lock/readOnly rules differ between them (C02–C04, C09). | files listed | O |
| ISS-C11 | P2 | Inline edit commit can **persist CMS-resolved text as stored content.** The canvas DOM for a bound element holds the resolved CMS value (`useCMSPreview` → `writeBoundValue`), and inline edit reads `innerHTML` from that DOM. | `useCMSPreview.ts:79-92`; `useCanvasInlineEdit.ts:88,163-168` | I |
| ISS-C12 | P2 | `ELEMENT_EDIT_INLINE` is emitted to no listener. The comment claims the onboarding step listens for it. | `useCanvasInlineEdit.ts:173-176`; grep (constant + string) → only the emitter | O |
| ISS-C13 | P2 | Dead `onOpenImageEditor` prop: the shell passes it, Canvas never reads it. Five canvas hooks are exported from barrels with no caller (§1l). | `StudioPanels.tsx:846`; `Canvas.tsx:79-97`; `hooks/index.ts` | O |
| ISS-C14 | P2 | **Two Inspector style write paths.** The single handler uses `setStyleAt`. The batch handler re-implements pseudo/breakpoint/base branches inline. It also lacks the `--hide-*` base-only rule, and its lock policy differs: single refuses all when the primary is locked; batch filters. | `useStyleHandlers.ts:241,273-279` vs `:316-378`; `commandOperations.ts:290` | O |
| ISS-C15 | P2 | Three zoom-step implementations (footer chords, Canvas `ZOOM_IN/OUT` listener, `zoom-in/out` commands). Two zoom sources of truth (React prop vs composer state), reconciled by an effect. | `CanvasFooterToolbar.tsx:226-235`; `Canvas.tsx:~390-393,414-427`; `defaultCommands.ts:589-605` | O |
| ISS-C16 | P2 | Canvas-menu Group calls `composer.elements.groupElements` directly while the Multi-select bar runs `commands.run("group")`. This re-implements a registry action, which `editor/AGENTS.md` calls a defect. | `standaloneActions.ts:40-56` vs `MultiSelectBar.tsx:109` | O |
| ISS-C17 | P2 | Cut writes `element.getData()` to the OS clipboard. The Copy row's own comment says `getData()` carries stale children, and Copy was fixed while Cut was not. Cut also copies only the right-clicked element, though the command cuts the whole selection. | `editActions.ts:18-24` vs `:56-67` | O |
| ISS-C18 | P2 | Disabled reasons from the shared registry are dropped on the canvas. `fromElementAction` maps `isEnabled` to a boolean and never sets `disabledReason`, so "Replace with block…" on a locked section shows greyed with no "Unlock it to replace it". | `standaloneActions.ts:18-31`; `elementActions.ts:221` | O |
| ISS-C19 | P2 | The rich-text toolbar offers `formatBlock` / lists / indent inside inline tags (`span`, `a`, `button`, headings). execCommand can create block elements inside them. The output is sanitised but can nest invalidly. | `RichTextEditor.tsx:73-92,133`; `useCanvasInlineCommands.ts:152-185`; editable tags `useCanvasInlineEdit.ts:33` | I |
| ISS-C20 | P2 | Form after-submit settings save straight to the server with no lock or readOnly check. The section is mounted only in the Inspector, so view mode is not exposed (I). | `FormAfterSubmitSection.tsx:111-150` | O (no gate); I (exposure) |
| ISS-C21 | P2 | Swallowed errors: section reorder `catch { rollbackTransaction() }` with no toast; clone-drag `catch { rollback }` silent. CMS preview errors are logged and fall back to raw stored content (shows stale text with no signal). | `useSectionReorder.ts:295`; `useCanvasElementDrag.ts:232`; `useCMSPreview.ts:103-107` | O |
| ISS-C22 | P2 | Stale copy: Canvas says pick mode is "emitted by the ProInspector Crosshair button", but the emitter is `ContentTab`. `contextEvaluator.ts` header documents a groups.json `showIf` system that the registry replaced. `useCanvasToolbarActions` is a pass-through wrapper (CLAUDE.md rule). | `Canvas.tsx:~212-215`; `ContentTab.tsx:97`; `config/contextEvaluator.ts:1-12`; `useCanvasToolbarActions.ts:16-22` | O |
| ISS-C23 | P2 | `spacer` / `divider` get no type block (only box sections), so a divider's line style and a spacer's size have no dedicated control. | `elementCapabilities.ts:156-157` (`media(null)`) | O (code); I (UX gap) |

##### Sanitisation review (XSS) — no P0 found

- **Canvas HTML.** Mounted via `dangerouslySetInnerHTML` (`Canvas.tsx:~812`). The source is `elements.toHTML()`, whose content goes through `contentToHTML` (escape for text, DOMPurify for markup; `sanitization.ts:206-216`). Attributes are filtered by `isSafeAttrValue` (no `on*`, no `srcdoc`, scheme-checked URL attributes; `:114-134`). Ingest runs `sanitizeElementTreeContent` (`:242`). O.
- **Inline edit** sanitises at commit (`useCanvasInlineEdit.ts:163`). Link creation is `isSafeUrl`-checked (`useCanvasInlineCommands.ts:126`). O.
- **CMS preview.** Values go through `isSafeCmsBoundValue`, richtext through `sanitizeRichtext`, everything else through `textContent`/`setAttribute` (`RepeaterRenderer.ts:42-55`). O.
- **Custom attributes** are restricted to `data-`/`aria-` (`DataAttributeEditor.tsx:67-68`) and filtered again at serialisation (I, from the `sanitization.ts:224-232` comment). The Link URL field accepts only `https?://` (`LinkSection.tsx:222-227`). O.
- **Global custom CSS** is injected as `<style>` text (`Canvas.tsx:~793`). It is CSS-only in the editor origin and allows `url()` exfiltration in principle. P2, I.

---

#### 4. Counts

Feature rows (all §1/§2 tables except the §1k module table; counted by grep of the status cell): **WIRED 157 · DEAD 8 · STUB 1 · FLAGGED-OFF 2 · UNREACHABLE 0.**
- DEAD = `onOpenImageEditor`, `ELEMENT_EDIT_INLINE` emit, global-class suggestions, and 5 barrel-only hooks (`useSelectionRect`, `useCanvasFloatingPanel`, `useEventListener`, `useElementRect`, `useCanvasDOM`).
- STUB = DragHandle.
- FLAGGED-OFF = remote cursors, cursor broadcast.

Rows marked WIRED that carry a defect: Group (C05), Align/Distribute (C08), section reorder (C02), clone-drag (C03), Cut (C17), Attributes (C06).

Issues: **P0 0 · P1 9 · P2 14.**

**Not verified:** autosave scheduling end to end; the CommandCenter shortcut map; `mediaDrop.ts` and `ElementNameField` bodies; whether gridSize and overlay toggles persist; serializer attribute order for `data-buildrick-id`. Nothing was checked in a running app.


---

## 7. Feature inventory — Engine managers, persistence, export/publish pipeline, flags

> Read pass output, included verbatim with headings demoted one level. Its labels (O/I/U, OBSERVED/INFERRED/UNKNOWN) and `file:line` citations are its own; its revision note is in its first lines.

### inv-D — Engine managers, persistence, export/publish, flags (static, read-only)

**Revision read:** worktree `~/Desktop/buildrik-worktrees/phase1-integration`, started at `6dbe51b25`, which moved mid-run to **`dc72314c2`** (Merge feat/flow-decisions BD-32..BD-37). Changed files I re-checked after the move: `engine/Composer.ts` (+5 lines at :127, the `stylePseudoState` field, so every Composer line number below is post-merge), `shell/PreviewOverlay.tsx` (interaction runtime injection still at :44/:103, still `sandbox="allow-scripts"` :308), `shell/hooks/useServerConflict.ts` (re-read :195-268). I did not re-check `commandOperations.ts`, `defaultCommands.ts`, `ConflictModal.tsx`, dashboard `projects/page.tsx` or `quick-actions.tsx`; no row below relies on them. No server/ or prisma files changed.

Paths are relative to `packages/editor/src/` unless they start with `server/`, `lib/`, `packages/` or `scripts/`.
How I labelled claims: **O** = OBSERVED (I read the line), **I** = INFERRED (and from what), **U** = UNKNOWN.

How callers were counted: a script matched `(composer|instance|c|editor|this.composer|…Composer)?.<field>?.<method>` in non-test `.ts/.tsx` files. It misses aliasing (`const r = composer.aliasResolver; r.x()`) and a class calling its own methods. So "no external caller" is **I** (grep), not proof of death. Spot checks: `aliasResolver` is reached through an alias (TokenDetailView.tsx:200-203), so it is WIRED even though the script found nothing.

---

#### 1. Composer managers (constructed at engine/Composer.ts:200-260; O)

| Field (Composer.ts) | Class / file | Public methods | Callers outside engine (non-test) | Status |
|---|---|---|---|---|
| elements :200 | ElementManager — engine/elements/ElementManager.ts | 39 | 137 files. No external caller: recordAppliedTemplate, importPage, previewUpdate/clearPreview/getPreview/hasPreview, registerElement, insertMedia, clear (I) | WIRED (about 10 dead methods, I) |
| styles :201 | StyleEngine — engine/styles/StyleEngine.ts | 27 | 6 files, 8 methods. No external caller: generateCSS, optimizeCSS, minifyCSS, generateScopedCSS, computeStyles, getEffectiveStyles, inheritStyles, importStyles, removeRule, setProperty… (18) (I) | WIRED (18 methods dead or internal, I) |
| commands :202 | CommandCenter (+KeybindingManager) — engine/commands/CommandCenter.ts | 8 | 16 files (useCanvasKeyboard, menus, MultiSelectBar…) | WIRED |
| selection :203 | SelectionManager — engine/SelectionManager.ts | 21 | 36 files. Unused: selectParent / selectFirstChild / selectNext / PrevSibling, getSelectedBounds, isMultiSelect (I) | WIRED |
| history :204 | HistoryManager — engine/HistoryManager.ts | 29 | 23 files. Unused: recordForCollaboration, applyRemoteOperation, forceCheckpoint, runWithoutTracking, pause/resume, setMaxHistory/… (13) (I) | WIRED |
| versions :205 | VersionTimelineManager — engine/VersionTimelineManager.ts (IndexedDB `aquibra-versions`, engine/storage/VersionHistoryStorage.ts:18) | 23 | 11 files (VersionHistoryPanel, useServerConflict, useVersionSync…) | WIRED |
| storage :206 | StorageAdapter — engine/storage/StorageAdapter.ts | 8 | none outside. Composer uses it at :617 (load) and :670 (save). Site-bound editors pass `{type:"none",autoSave:false}` (editor/shell/hooks/useComposerInit.ts:207) | WIRED only in the standalone demo; bypassed for real sites (O) |
| viewport :207 | Viewport — engine/Viewport.ts | 14 | none outside. Reached through Composer.setDevice/setZoom wrappers (Composer.ts ~1268-1289) and StyleEngine.ts:681 | engine-internal |
| plugins :208 | PluginManager — engine/PluginManager.ts | 16 | none. The only use is `destroy` (Composer.ts ~1351). No `register` caller anywhere (O, grep) | **DEAD** |
| data :209 | DataManager — engine/data/DataManager.ts | 21 | 2 files (sidebar/tabs/content/useContentPanel.ts:105,147, ContentTab.tsx) | WIRED (11 methods unused, I) |
| fonts :210 | FontManager — engine/fonts/FontManager.ts | 12 | none outside. Composer.ts ~513-550 registers library fonts; ExportEngine.ts:299,312 reads them | engine-internal WIRED |
| components :211 | ComponentManager — engine/components/ComponentManager.ts (IndexedDB ComponentStorage.ts:32) | 37 | 19 files. Variant API unused: addVariant / updateVariant / removeVariant / setVariantProperties / syncInstance (I) | WIRED (variants DEAD, I) |
| media :212 | MediaManager — engine/media/MediaManager.ts (IndexedDBAdapter.ts:44) | 34 | 17 files | WIRED |
| mediaOps :213 | MediaCommandLayer — engine/media/MediaCommandLayer.ts | 10 | 9 files | WIRED |
| forms :214 | FormHandler — engine/forms/FormHandler.ts | 16 | none. Only `destroy`. Publish forms are wired server-side instead (lib/publish-forms.ts:205) | **DEAD** |
| router :215 | PageRouter — engine/routing/PageRouter.ts | 6 | `register` has no caller (O, grep). `getPath` is read at editor/sidebar/tabs/pages/usePages.ts:133, so `route` is always undefined (I, from the empty route table) | **DEAD / STUB** |
| recovery :216 | RecoveryManager — engine/recovery/RecoveryManager.ts | 6 | Constructor installs visibilitychange, error and unhandledrejection listeners (:60-80). Static `consumeLastCrash` is used at editor/shell/RecoveryBanner.tsx:81. Instance methods (validateAllPages, ensurePageRootExists…) have no external caller (I) | WIRED (partly) |
| migration :217 | MigrationManager — engine/migration/MigrationManager.ts | 1 | editor/design-system/migrations/importMigratedProject.ts | WIRED |
| aliasResolver :218 | AliasResolver — engine/aliasResolver/AliasResolver.ts | 6 | TokenDetailView.tsx:200-203 (`findAliasesOf`) | WIRED (1 of 6) |
| colorMode :219 | ColorMode | 3 | design-system/ui/ColorModeToggle.tsx | WIRED |
| dsLinter :220 | DSLinter | 3 | design-system/state/useDSLint.ts | WIRED |
| cms.collections :223 | CollectionManager — engine/cms/CollectionManager.ts (IndexedDB CollectionStorage.ts:32) | 25 | 15 files (editor/cms/*, useCMSPreview…) | WIRED |
| cms.bindings | CMSBindingManager | 12 | 8 files | WIRED |
| collab.manager | CollaborationManager (+OTEngine, SSETransport) | 24 | useCollaboration.ts, useCursorSync.ts, CommandPalette.tsx:285 (flag-gated) | **FLAGGED-OFF** (NEXT_PUBLIC_FEATURE_COLLAB). engine/AGENTS.md calls it demo-only |
| canvas.indicators | CanvasIndicators — engine/canvas/indicators/CanvasIndicators.ts | 60 | 3 files, 3 methods. 57 methods have no external caller (I) | WIRED (mostly dead surface, I) |
| canvas.resize | ResizeHandler | 16 | 3 files | WIRED |
| canvas.drag | DragManager | 9 | 4 files | WIRED |
| canvas.interactions | InteractionManager — engine/interactions/InteractionManager.ts (+InteractionRuntime.ts) | 16 | none. The only use is Composer.setPreviewMode (:1322-1330), which itself has **no caller** (O, grep). The UI edits interactions through element data (inspector/sections/interactions/index.tsx:87-106) | **DEAD** |
| designSystem.tokenUsage | TokenUsageTracker | 7 | 6 files | WIRED |
| designSystem.lintState | LintState | 10 | 3 files | WIRED |
| designSystem.tokenBindingResolver | TokenBindingResolver | 1 | 2 files | WIRED |
| engine/history/index.ts | type re-exports only, marked `@deprecated DEAD/SIMULATED` (O) | — | — | DEAD module |

**Counts (managers):** WIRED 22 (2 of them engine-internal), DEAD 4 (plugins, forms, router, canvas.interactions; the engine/history module is a fifth dead item but not a manager), FLAGGED-OFF 1 (collab), partial or demo-only 2 (storage, recovery).

---

#### 2. Persistence

##### Pages / project (site-bound editor, `?siteId=` or `/edit/:id`)
- **Load (O):** useComposerInit.ts:251 `loadProject(siteId)` → services/BuildrikSyncProvider.ts:746 → `sites.loadForEditor.query` (:754, retried once through `.catch(readSnapshot)`) → server/trpc/routers/sites.ts:96. Then DS migration and `instance.importProject` (useComposerInit.ts:266-290), then `loadServerMedia` (:354). On failure it falls back to `loadFromLocalStorage` (:417) through `Composer.loadProject` → StorageAdapter. For a site-bound editor that adapter is type `none` (:207), so the fallback returns nothing (I).
- **Autosave (O):** useComposerInit.ts:555-860. Listens to `project:changed`, `history:undo/redo` and `version:restored` (:852-855). Debounce `THRESHOLDS.AUTOSAVE_DEBOUNCE` = 1000 ms (shared/constants/config.ts:112, used at :835). Then `saveProject(siteId, snapshot)` → BuildrikSyncProvider.ts:807 (serial `_saveChain`) → `saveProjectNow` :842 → `sites.saveProject.mutate` with `expectedLastEditedAt` (:874) → sites.ts:383 (checks EDITOR) → server/services/sites.service.ts:786 → `saveProjectData` :1044 (sanitizeBlocks per page, then a transaction with a CAS `updateMany` on lastEditedAt, :1104-1117). After the save it sends a separate `siteDetail.settings.update` mirror for ADMIN+ (BuildrikSyncProvider.ts:892-899).
- **Manual save (O):** `composer.saveProject()` (Composer.ts:653) → `saveHandler` installed by editor/shell/hooks/useSaveCallback.ts:434.
- **Conflict (O):** the server returns `SAVE_CONFLICT:<iso>` → `raiseSaveConflict` (BuildrikSyncProvider.ts:210) → SaveConflictError, held as `_conflictToken`. Autosave holds the edit with keepUnsaved (useComposerInit.ts:631-640, keepUnsaved at :639). Resolution happens in useServerConflict.ts (Keep / History :197 / Replace :222).
- **Offline / retry (O):** a network error calls keepUnsaved (:743) plus scheduleRetry (5 s × 2^n, capped at 60 s, :132-133, :589-610). Retry runs immediately on `online` (:603).
- **Recovery copy (O):** services/unsavedRecovery.ts:121 writes localStorage `bk-unsaved-v1-<siteId>`. RecoveryBanner compares it with the server.
- **Standalone demo (O):** StorageAdapter autosave debounced at 5000 ms on PROJECT_CHANGED (StorageAdapter.ts:37-56). Backends: localStorage / sessionStorage / IndexedDB `aquibra-storage` / remote.

##### Other domains (O, file heads)
| Domain | Local store | Server mirror |
|---|---|---|
| Components | IndexedDB (ComponentStorage.ts) | services/componentSync.ts:62 `siteComponents.upsert` |
| CMS | IndexedDB (CollectionStorage.ts) + outbox in localStorage `bk-cms-outbox-v1` (cmsSync.ts:116) | cmsSync + syncRetryQueue |
| Media | IndexedDB | AssetUploadService.ts:156 `media.createAsset`, plus Vercel Blob |
| Versions | IndexedDB `aquibra-versions` | versionSync.ts:63 `siteVersions.create` (best-effort) |
| User templates | localStorage MY_TEMPLATES | templateSync.ts:73 |

---

#### 3. Export / publish pipeline (O unless marked)

1. **Trigger:** Publish button → useExportHandlers.ts:80 `runPublish`. The button is gated by `isFeatureEnabled("publish")` (useLifecycle.ts:111, TabRouter.tsx:200). Before that the lifecycle gate decides: `publishBlocker` (lifecycle.ts:236-243) blocks on flag off, viewer, offline, saveConflict or saveFailed. It does **not** block when there are unsaved edits that have not yet failed to save.
2. **Export:** `exportPublishPages(composer)` (shell/exportPublishPages.ts:66) → `composer.exportProject()` (**the live tab state**, :68) plus `cmsSyncBlocker()` (:87) plus `fetchPublishSnapshot` (server CMS rows and fonts, :89) → `renderProjectPages` (:113) on a scratch Composer → `ExportEngine.exportAllPages({format:"html",minify:true})` (:46; ExportEngine.ts:740). styles.css is inlined into each page (:29-43).
3. **Sanitisation in the export (editor-side only):** element text goes through `contentToHTML` (DOMPurify) at ExportEngine.ts:1095. Attributes are escapeHTML'd and filtered by `isSafeAttrValue` (:1134-1198). Head/body custom code goes through `sanitizeHeadCode` (:646, :677, :985, :1009), which allows `<script src>` and blocks inline `<script>` (sanitizeHeadCode.ts header). Global CSS goes through `escapeStyleText` (:637). Embeds go through `embedFrameHTML` (:466, :1218).
4. **RPC:** services/PublishService.ts:73 `publishSite` → `sites.publish.mutate({siteId,pages,expectedLastEditedAt})` (:94) → server/trpc/routers/sites.ts:475 (EDITOR; ADMIN for acknowledgeStale) → server/services/publish.service.ts:344 `startPublish`:
   - single-active-job guard (:363) and stranded-row sweep;
   - freshness check against lastEditedAt, applied only if the token was sent (:411-416);
   - approval gate, enforced only when `editsRequireApproval && agency_layer` (:432-492);
   - Vercel connection required unless `PUBLISH_ALLOW_SIMULATION` (:506);
   - `runPrePublishChecks` (:516);
   - `appendDynamicPagesToPublish` builds CMS dynamic pages server-side (:534);
   - writes the job with `log:{pages}` (:541);
   - `dispatchWorker` POSTs with `x-worker-secret` = CRON_SECRET (:294-328).
   - Page schema: `publishPathError` limits paths to `.html`, with no `api/` and no dot-segments (packages/shared/schemas/publish.ts). **The HTML is size-capped only and never re-sanitised on the server** (I: no sanitizer call in the startPublish or worker path I read).
5. **Worker:** packages/dashboard/app/api/workers/publish/[jobId]/route.ts:68 → `checkWorkerAuth` (lib/cron-auth.ts:33, timing-safe, fails closed when CRON_SECRET is unset) → conditional claim to BUILDING (:133) → DEPLOYING (:154) → `runVercelDeployJob` (:381):
   - `planFormWiring` (lib/publish-forms.ts:205);
   - `wireSliders` and `wireWidgetRuntimes` (lib/publish-sliders.ts, lib/publish-widgets.ts; they serialise editor runtimes with `fn.toString()`);
   - `buildDeployFiles` (lib/publish-files.ts) with app scripts, badge, redirects and headers;
   - `checkBundle`;
   - `runVercelDeploy` (publish.service.ts:1063 → lib/vercel.ts createVercelDeployment / waitForDeploymentReady);
   - post-deploy steps.
   - The interaction and theme-toggle runtimes are already inlined by ExportEngine (:671-674, :997-1000).
6. **Simulation:** worker :122 — with no pages and no `PUBLISH_ALLOW_SIMULATION`, it throws "No page content". `runVercelDeploy` returns null, which leads to `runSimulation` (:568), only when the flag is `"true"` (:1074); otherwise it throws VERCEL_NOT_CONNECTED. The fake URL is `*.dev-simulated.invalid` (:600). Production guard: scripts/check-prod-env.mjs:217 fails the env check if the flag is set, but **nothing guards it at runtime** (I).
7. **ZIP / HTML export (download):** ExportModal (editor/export/ExportModal.tsx) is opened by StudioHeader.tsx:439 `handleExport` → `onShowExporter`, by `UI_OPEN_EXPORTER` (StudioHeader.tsx:454) and by the palette command (defaultCommands.ts:738). It reads local state, which is by design.

##### Export formats offered (O, editor/export/ExportOptions.tsx:26-29)
| Format | Entry | Engine | Status |
|---|---|---|---|
| Single HTML file | ExportModal → downloadFile (:180) | ExportEngine.export (:203) | WIRED |
| ZIP (pages + styles.css + assets) | ExportModal.handleDownloadZip (:188) | ExportEngine.generateZip + AssetBundler | WIRED |
| React | ExportModal.handleDownloadReact (:213) | ReactExporter.ts | WIRED |
| Vue, Next.js | "coming soon" pills (:29) | Vue throws "not implemented" (ExportEngine.ts:756) | STUB |
| JSON | label only (ExportModal.tsx:256); not in AVAILABLE_FORMATS | Composer.exportJSON (:933), palette | UNREACHABLE from the modal (I) |
| `handleExportHTML` (quick zip) | useExportHandlers.ts:59, passed as `onExportHTML` (AquibraStudio.tsx:733) | ExportEngine.downloadZip | **UNREACHABLE**: StudioHeader.tsx destructures it at :270 and never calls it (O, 2 occurrences only) |

---

#### 4. Feature flags

| Flag | Default | Read at | Gates | Status |
|---|---|---|---|---|
| `VITE_FEATURE_PUBLISH ?? NEXT_PUBLIC_FEATURE_PUBLISH` | false (runtimeEnv.ts:95-96) | featureFlags.ts → useLifecycle.ts:111, TabRouter.tsx:200 | Publish button and flow (client only; the server does not check it, I) | depends on env |
| `…FEATURE_DS_AI` | false (runtimeEnv.ts:98) | BrandWorkspace.tsx:737,834; **server** theme.ts:228 (`extractBrandFromUrl` returns NOT_FOUND unless `"true"`) | Brand AI entry points | FLAGGED-OFF by default |
| `…FEATURE_COLLAB` | false (runtimeEnv.ts:107) | StudioHeader.tsx:319, CommandPalette.tsx:285; **server** collab.service.ts:29 `isCollabEnabled` → routes api/collab/[siteId]/ops:20, api/sse/collab/[siteId]:32 return 404 | Collaboration UI and op channel | FLAGGED-OFF |
| `IS_DEV_BUILD` | MODE / NODE_ENV (runtimeEnv.ts:102) | Composer.ts:10, useComposerInit dirty-source trace | dev diagnostics | — |
| `NEXT_PUBLIC_UNIFIED_EDITOR` | unset = legacy URL | packages/dashboard/components/editor-route/unified-flag.server.ts:14 | `/edit/:id` vs the port-5050 demo | env |
| `BRAND_TOKENS_V2` / `_WORKSPACES` | off | server/services/brand-tokens.ts:18-20; editor gets it through loadForEditor (BuildrikSyncProvider.ts:732 → useComposerInit.ts:266). Engine default `true` (Composer.ts:258) applies to the demo only | v6 token migration | env |
| `PUBLISH_ALLOW_SIMULATION` | unset | publish.service.ts:72,506,1074; worker :122 | skips the Vercel check and allows a fake deploy | dev only (guarded by env:check, not at runtime) |
| Workspace `agency_layer` (DB `workspaceFeature`, default false: feature-flag.service.ts:17-26; keys packages/shared/schemas/feature-flags.ts:8) | false | reviews.ts (`requireAgencyLayer` and `isFeatureEnabled`, ~10 sites), **theme.ts (13 procedures)**, clients.ts, dashboard.ts:94, handover.ts:17, publish.service.ts:451 | reviews/approval, shared theme, clients, handover. Approval is enforced only when this is on | FLAGGED-OFF by default |
| Workspace `client_mode` | false | key declared; consumers not traced (U) | E4 client mode | U |
| `reviewsEnabled` / `editsRequireApproval` (editor) | null = unknown | lifecycle.ts:85-96 (from `reviews.status`) | next-move button | WIRED |

---

#### 5. Feature rows

| Feature | Entry point | Engine / server path | Persistence | Flag | Status |
|---|---|---|---|---|---|
| Page autosave | useComposerInit.ts:611 | BuildrikSyncProvider.ts:807 → sites.ts:383 → sites.service.ts:1044 | Postgres (CAS on lastEditedAt) | — | WIRED |
| Manual save ⌘S | useSaveCallback.ts:434 | Composer.ts:653 → same RPC | Postgres | — | WIRED |
| Save-conflict dialog | useServerConflict.ts:75 | BuildrikSyncProvider.ts:210 | versions IndexedDB + server | — | WIRED |
| Offline / unsaved recovery | useComposerInit.ts:725 | unsavedRecovery.ts:121 | localStorage | — | WIRED |
| Standalone storage autosave | StorageAdapter.ts:37 | — | localStorage / IndexedDB | no siteId | WIRED (demo only) |
| Undo / redo | useComposerInit.ts:867 | HistoryManager.ts | in-memory | — | WIRED |
| Version history | VersionHistoryPanel.tsx | VersionTimelineManager + versionSync.ts:63 | IndexedDB + server | — | WIRED |
| Components | inspector/sections/ComponentRow.tsx | ComponentManager + componentSync.ts:62 | IndexedDB + server | — | WIRED (variants DEAD, I) |
| CMS | editor/cms/CmsWorkspace.tsx | CollectionManager + cmsSync | IndexedDB + outbox + server | — | WIRED |
| Media | editor/media/LibraryManager.tsx | MediaManager + AssetUploadService.ts:156 | IndexedDB + Blob + server | — | WIRED |
| Interactions (authoring) | inspector/sections/interactions/index.tsx:87 | element data → ExportEngine.ts:1206 | page tree | — | WIRED |
| Interactions (runtime: preview + publish) | PreviewOverlay.tsx:103, ExportEngine.ts:671 | export/interactionRuntime.ts | — | — | WIRED |
| InteractionManager / InteractionRuntime | Composer.setPreviewMode :1322 (no caller) | engine/interactions/* | — | — | DEAD |
| Plugins | — | PluginManager.ts | — | — | DEAD |
| Engine forms | — | FormHandler.ts | — | — | DEAD |
| Published forms | worker route | lib/publish-forms.ts:205, api/public/forms (rate-limited) | Postgres | — | WIRED |
| Page routing | usePages.ts:133 | PageRouter.ts (never registered) | — | — | DEAD / STUB |
| Data sources / site variables | sidebar/tabs/content/useContentPanel.ts:105 | DataManager.ts | project settings (I) | — | WIRED |
| Collaboration | StudioHeader.tsx:280 | CollaborationManager, api/collab, api/sse/collab | collab ops table (I) | COLLAB | FLAGGED-OFF |
| Commands / keybindings | useCanvasKeyboard.ts, CommandPalette | CommandCenter + KeybindingManager | — | — | WIRED |
| Publish (editor) | useExportHandlers.ts:80 | PublishService.ts:94 → publish.service.ts:344 → worker → lib/vercel.ts | PublishBuildJob.log / bundle | PUBLISH | WIRED |
| Scheduled publish | api/cron/scheduled-publish/route.ts:38 | startPublish **with no pages** → worker throws at :123 | — | — | **BROKEN** (see P1-1) |
| AI-action / API-token publish | server/services/ai-actions.service.ts:66 | startPublish with optional pages | — | — | WIRED only when pages are supplied; otherwise fails like the scheduled one (I) |
| Rollback | PublishService.ts:290 | publish.service.ts:856 (stored bundle) | job.bundle | — | WIRED |
| Simulation publish | worker :568 | — | — | PUBLISH_ALLOW_SIMULATION | dev only |
| ZIP / HTML / React export | ExportModal | ExportEngine / ReactExporter | download | — | WIRED |
| Vue / Next.js export | ExportOptions.tsx:29 | — | — | — | STUB |
| Quick zip `onExportHTML` | AquibraStudio.tsx:733 | ExportEngine.downloadZip | — | — | UNREACHABLE |
| DS AI brand extract | BrandWorkspace.tsx:834 | theme.ts:228 | — | DS_AI | FLAGGED-OFF |
| Crash recovery banner | RecoveryBanner.tsx:81 | RecoveryManager (sessionStorage) | sessionStorage | — | WIRED |

**Status counts (sections 1, 3 and 5 together; a row can appear in more than one section, so these are row counts, not a deduplicated feature count):** WIRED 47, DEAD 8, FLAGGED-OFF 4, UNREACHABLE 2, STUB 3, BROKEN 1, dev-only / partial 3.

---

#### 6. Issues

##### P0
None proven statically. (Biggest candidates: P1-2 publishes HTML the server never re-validates; P1-3 a 5xx autosave writes no recovery copy.)

##### P1
1. **Scheduled publish always fails in production.** The cron calls `startPublish(siteId, createdBy)` with no pages (packages/dashboard/app/api/cron/scheduled-publish/route.ts:38, O). The job is created with `log: undefined` (publish.service.ts:541, O). The worker computes `useVercel = pages.length>0 || storedBundle` = false and throws "No page content to deploy" unless simulation is on (worker route :112, :122-126, O). The dispatch reports `claimed` because the worker answered 500 (publish.service.ts:320, O), so the schedule is marked *started* (cron :39) while its job is FAILED. Nothing renders pages on the server. The same applies to an AI-action publish without a payload (ai-actions.service.ts:66) and to any API-token publish. **O (chain read).**
2. **The published HTML is trusted from the client and is not tied to the reviewed or saved content.** `sites.publish` takes `pages[].html` from the caller (sites.ts:475-509). The schema caps size and path only (packages/shared/schemas/publish.ts). startPublish and the worker never sanitise the HTML (O: no sanitizer in publish.service.ts:344-605 or the worker :381-560). The approval gate checks review status against `latestEditAt(site)` only (publish.service.ts:478-485). So an EDITOR can call the RPC directly and ship arbitrary HTML, including inline `<script>` that the editor's sanitizeHeadCode would strip, under an approval given for different content. Server-side sanitisation exists for stored trees (lib/sanitize-blocks.ts via sites.service.ts:1102) but not here. **I (from the code paths read).** Severity depends on the trust model; it matters most where `editsRequireApproval` is used.
3. **Autosave keeps no recovery copy on server/5xx errors.** In useComposerInit.ts the catch calls `keepUnsaved` only for conflict-pending (:639), refused-tokens hold (:655), TOKENS_INVALID (:714) and network errors (:743). The generic branch (:775-834) only schedules a retry. If the tab closes while the server is down, the edit is lost, except for whatever unload guard exists (U: not traced). **O for the branches; the loss is I.**
4. **Publish ships the unsaved live canvas.** `exportPublishPages` reads `composer.exportProject()` (exportPublishPages.ts:68). runPublish never saves or flushes first (useExportHandlers.ts:80-108, O). The lifecycle gate blocks only `saveFailed` or `saveConflict` (lifecycle.ts:240-241), so edits inside the 1 s debounce or a save in flight are published without being on the server. The freshness token covers only *other* writers (publish.service.ts:411). **I (from these lines).** The job.log copy survives for rollback, so this is not data loss, but the live site differs from the stored project.

##### P2
5. Dead managers still constructed on every Composer: PluginManager (Composer.ts:208), FormHandler (:214), PageRouter (:215), and InteractionManager plus InteractionRuntime (via the uncalled `setPreviewMode` :1322). Also the dead module engine/history/index.ts. O/I as in §1.
6. `usePages.ts:133` reads `router.getPath`, which always returns undefined because nothing calls `register`. **I.**
7. Two interaction runtimes: engine/interactions/InteractionRuntime.ts (dead) and engine/export/interactionRuntime.ts (live). **O.**
8. Three HTML document builders: `Composer.exportHTML` (Composer.ts:846, used by Preview, Canvas.tsx:621, Viewport.ts:210), `ExportEngine.export` / generateHTML (single file, ExportEngine.ts:203, attribute writer :414-442), and `exportAllPages` (per page, attribute writer :1134-1198). The attribute-emission code is duplicated within ExportEngine. **O.**
9. Widget runtimes are split across two layers: slider, countdown and accordion are injected only by the publish worker (lib/publish-sliders.ts, lib/publish-widgets.ts), while interaction and theme toggle are injected by ExportEngine. ExportEngine has no slider/countdown/accordion reference (O, grep), so **ZIP/HTML downloads ship those widgets without behaviour** (I).
10. Save-error classification is duplicated between autosave (useComposerInit.ts:666-834) and manual save (useSaveCallback.ts). The code comments there admit "one rule lived in two copies". **O.**
11. Save CAS is opt-in: the server skips the lastEditedAt check when `expectedLastEditedAt` is omitted (sites.service.ts ~1113-1118, comment "skipped when omitted"), and publish freshness is likewise optional (publish.service.ts:411). **O.**
12. Swallowed persistence failures: keepUnsaved ignores quota errors silently, so the user is not told the recovery copy failed (unsavedRecovery.ts:126-129). The CMS outbox write is swallowed (cmsSync.ts:142). The template cache write is swallowed (templateSync.ts:116). **O.**
13. useServerConflict `onReplace` awaits `composer.versions.createVersion` without try/catch (useServerConflict.ts:227, :252). An IndexedDB failure becomes an unhandled rejection with no toast, though nothing is replaced. **O.**
14. Simulation path has no runtime production guard; only `env:check:prod` checks it (scripts/check-prod-env.mjs:217). Setting the env var in cPanel makes every publish report "live" with a `.invalid` URL. **O/I.**
15. The publish worker route touches Prisma directly (about 25 `prisma.` calls in packages/dashboard/app/api/workers/publish/[jobId]/route.ts), which violates Route→Service→Prisma. **O.**
16. The engine imports a service: `engine/Composer.ts:9 import { emailService } from "../services/EmailService"` violates the "engine → shared only" rule. **O.**
17. Publish feature flag is client-only: the server `sites.publish` does not read FEATURE_PUBLISH (I: no reference in server/), so the flag hides UI but does not disable publishing.
18. The Vercel OAuth callback (api/integrations/vercel/callback/route.ts:28-80) has no session check; it relies on the signed state. Whether the team-picker step re-binds the pending cookie to the session user was not traced (U). It also derives `redirectUri` from the request host (:45; documented design).
19. Large dead method surface (I, grep): CanvasIndicators 57 of 60 methods, StyleEngine 18 of 27, ComponentManager variant API, HistoryManager collaboration and tuning API.

##### Authz sweep of packages/dashboard/app/api/** (O)
- All 19 `cron/*` routes call `checkCronAuth` (timing-safe; fails closed with 500 when the secret is unset; lib/cron-auth.ts).
- Both `workers/*` call `checkWorkerAuth`.
- `webhooks/stripe` verifies an HMAC with a replay window.
- Session-checked: asset-upload (inside onBeforeGenerateToken), site-thumbnail, upload/[fileId] (plus owner check), sse/*, collab/* (plus flag), integrations/vercel/authorize (plus ADMIN).
- Public by design, rate-limited: public/forms, public/track, share/verify-password.
- auth/create-session uses a one-time token.
- **No route found without some auth, signature, rate limit or one-time-token gate.**

##### Issue counts
P0 0 · P1 4 · P2 15


---

## 8. Server procedures (tRPC)

### 8.1 Authentication base (O, `server/trpc/trpc.ts:125-197`)
- `protectedProcedure` requires a session and **refuses bearer tokens**. `scopedProcedure(scope)` allows a token only with that scope.
- Rate-limited public bases: `normalRateLimit`, `strictRateLimit`, `strictClientLimit`, `commentLimit`, and `rateLimitedAction` (a protected base, 20/min).

Distribution over the 317 procedures (O): protectedProcedure 291 · publicProcedure 10 · normalRateLimit 5 · strictRateLimit 5 · strictClientLimit 3 · rateLimitedAction 2 · commentLimit 1.

**Authorisation (resource-level).**
- Of the protected handlers, 278 pass `ctx` or `ctx.session.user.id` to a helper or service. Examples:
  - `cms.ts:36-53` `requireRead` → `assertSiteAccess`, and `requireWrite` → `checkSiteRole(…,"EDITOR")`
  - `theme.ts:70-130` `resolveWorkspaceId` + `requireAgencyLayer` + `requireAdmin`
  - `marketplace.ts:42-90` `requireWorkspace` + `requireAdmin`
- **Whether each service actually scopes by workspace/site was not verified per procedure: UNKNOWN.** I spot-checked theme/marketplace/clients/cms only.
- Handlers that never touch `ctx` (O) are all deliberately public or token-based:
  - `auth.*`
  - `help.*`
  - `clientReview.*`, authenticated by review token
  - `billing.plans`, `upload.limits`, `sites.checkSlug`, `siteDetail.domains.checkAvailability`, `media.searchStock*`

### 8.2 Procedures with no production caller (39)
Production caller = non-test code in `packages/editor/src`, `packages/dashboard`, `lib/`, `packages/shared`, or `server/` outside the routers. All 39 are OBSERVED by the script and the second looser grep; "no caller" is still INFERRED with respect to callers built from computed property names, of which none were found.

| Router | Procedures with no caller | Note |
|---|---|---|
| `ai` | **all 9**: content, page, layout, summarize\*, milestoneSuggest\*, quota, streamPrompt (subscription), componentSchema, logAdoption | The AI-removal decision left the whole router live. Each is an authenticated endpoint that reserves AI quota and calls a provider (`ai.ts:200-215`, O). P2 |
| `actions` | propose, confirm | grant-minting endpoints (`actions.ts:20-40`), no UI. P2 |
| `pages` | get, create, update, delete, getTranslation, setTranslation, removeTranslation | Only `pages.list` (dashboard onboarding preview) and `pages.folders.*` (`services/PageFolderService.ts:26-33`) are used. Pages live in the project blob saved by `sites.*`, so a second, unused write path to pages exists on the server. P2 |
| `sites` | schedulePublish, cancelScheduledPublish, getScheduledPublish, getProjectData | **Scheduled publish has server + cron but no UI.** The cron would also fail (§9.1 #10) |
| `theme.presets` | list, save, delete, applyPreset | The editor's presets use a localStorage registry instead (§5 B-3). P2 |
| `siteDetail` | — | all wired (domains/redirects through `api()` indirection) |
| other | auth.logout, dashboard.recentSites, dashboard.quickActions, templates.cloneFromSite, team.auditLog, billing.usage, help.categories, onboarding.completeStep, upload.limits, media.moveFolder, media.generateAltText, siteComponents.usage, userTemplates.delete | `media.moveFolder` has no caller even though the Assets panel has folders (§5 notes folder rename is UNREACHABLE). `userTemplates.delete`: user templates can be uploaded (`templateSync.ts:73`) but never deleted server-side. P2 |

\* referenced only by tests (`ai.summarize`, `ai.milestoneSuggest`).

### 8.3 Full table
Columns: path · kind · base (authn) · definition · consumers · first production caller · number of call sites · status. "editor" means `packages/editor/src`; "dashboard" means `packages/dashboard`.
Consumer split (O): dashboard only 159 · editor only 82 · dashboard+editor 36 · dashboard+editor+lib 1 · none 39. The editor calls 119 distinct procedures.


| # | Procedure | Kind | Procedure base (authn) | Defined at | Consumers | First caller (file:line) | # call sites | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | `auth.login` | mutation | publicProcedure | routers/auth.ts:49 | dashboard | packages/dashboard/app/auth/page.tsx:42 | 2 | WIRED |
| 2 | `auth.signup` | mutation | normalRateLimit | routers/auth.ts:84 | dashboard | packages/dashboard/app/auth/signup/page.tsx:55 | 2 | WIRED |
| 3 | `auth.verifyEmail` | mutation | normalRateLimit | routers/auth.ts:107 | dashboard | packages/dashboard/app/auth/verify-email/page.tsx:25 | 1 | WIRED |
| 4 | `auth.resendVerification` | mutation | normalRateLimit | routers/auth.ts:118 | dashboard | packages/dashboard/app/auth/invite/page.tsx:106 | 3 | WIRED |
| 5 | `auth.forgotPassword` | mutation | normalRateLimit | routers/auth.ts:125 | dashboard | packages/dashboard/app/auth/forgot-password/page.tsx:22 | 2 | WIRED |
| 6 | `auth.resetPassword` | mutation | strictRateLimit | routers/auth.ts:132 | dashboard | packages/dashboard/app/auth/reset-password/page.tsx:28 | 1 | WIRED |
| 7 | `auth.magicLink` | mutation | normalRateLimit | routers/auth.ts:143 | dashboard | packages/dashboard/app/auth/magic-link/page.tsx:22 | 2 | WIRED |
| 8 | `auth.verifyMagicLink` | mutation | strictRateLimit | routers/auth.ts:150 | dashboard | packages/dashboard/app/auth/callback/page.tsx:19 | 1 | WIRED |
| 9 | `auth.verify2FA` | mutation | strictRateLimit | routers/auth.ts:166 | dashboard | packages/dashboard/app/auth/2fa/page.tsx:24 | 1 | WIRED |
| 10 | `auth.verifyBackupCode` | mutation | strictRateLimit | routers/auth.ts:178 | dashboard | packages/dashboard/app/auth/2fa/backup/page.tsx:25 | 1 | WIRED |
| 11 | `auth.checkEmail` | mutation | strictRateLimit | routers/auth.ts:199 | dashboard | packages/dashboard/app/auth/signup/page.tsx:41 | 1 | WIRED |
| 12 | `auth.logout` | mutation | protectedProcedure | routers/auth.ts:221 | — | — | 0 | NO CALLER |
| 13 | `auth.getInviteDetails` | query | publicProcedure | routers/auth.ts:229 | dashboard | packages/dashboard/app/auth/invite/page.tsx:79 | 2 | WIRED |
| 14 | `auth.acceptInvite` | mutation | protectedProcedure | routers/auth.ts:260 | dashboard | packages/dashboard/app/auth/invite/page.tsx:82 | 2 | WIRED |
| 15 | `auth.declineInvite` | mutation | publicProcedure | routers/auth.ts:358 | dashboard | packages/dashboard/app/auth/invite/page.tsx:108 | 1 | WIRED |
| 16 | `dashboard.stats` | query | protectedProcedure | routers/dashboard.ts:45 | dashboard | packages/dashboard/app/dashboard/page.tsx:25 | 3 | WIRED |
| 17 | `dashboard.recentSites` | query | protectedProcedure | routers/dashboard.ts:50 | — | — | 0 | NO CALLER |
| 18 | `dashboard.attentionQueue` | query | protectedProcedure | routers/dashboard.ts:55 | dashboard | packages/dashboard/components/dashboard/needs-attention.tsx:17 | 1 | WIRED |
| 19 | `dashboard.activity` | query | protectedProcedure | routers/dashboard.ts:60 | dashboard | packages/dashboard/app/dashboard/page.tsx:26 | 2 | WIRED |
| 20 | `dashboard.health` | query | protectedProcedure | routers/dashboard.ts:77 | dashboard | packages/dashboard/app/dashboard/settings/billing/page.tsx:144 | 10 | WIRED |
| 21 | `dashboard.usage` | query | protectedProcedure | routers/dashboard.ts:82 | dashboard | packages/dashboard/app/dashboard/settings/usage/page.tsx:17 | 2 | WIRED |
| 22 | `dashboard.partner` | query | protectedProcedure | routers/dashboard.ts:87 | dashboard | packages/dashboard/app/dashboard/agency/(tabs)/partner/partner-view.tsx:17 | 1 | WIRED |
| 23 | `dashboard.quickActions` | query | protectedProcedure | routers/dashboard.ts:98 | — | — | 0 | NO CALLER |
| 24 | `sites.list` | query | protectedProcedure | routers/sites.ts:73 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:125 | 8 | WIRED |
| 25 | `sites.get` | query | protectedProcedure | routers/sites.ts:80 | dashboard+editor | packages/editor/src/services/PublishService.ts:136 | 4 | WIRED |
| 26 | `sites.loadForEditor` | query | protectedProcedure | routers/sites.ts:96 | editor | packages/editor/src/services/BuildrikSyncProvider.ts:754 | 2 | WIRED |
| 27 | `sites.create` | mutation | protectedProcedure | routers/sites.ts:110 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:177 | 4 | WIRED |
| 28 | `sites.rename` | mutation | protectedProcedure | routers/sites.ts:138 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:186 | 1 | WIRED |
| 29 | `sites.duplicate` | mutation | protectedProcedure | routers/sites.ts:150 | dashboard+editor | packages/editor/src/services/BuildrikSyncProvider.ts:639 | 2 | WIRED |
| 30 | `sites.archive` | mutation | protectedProcedure | routers/sites.ts:180 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/DangerZoneScreen.tsx:155 | 2 | WIRED |
| 31 | `sites.unarchive` | mutation | protectedProcedure | routers/sites.ts:192 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/OverviewScreen.tsx:226 | 3 | WIRED |
| 32 | `sites.delete` | mutation | protectedProcedure | routers/sites.ts:204 | dashboard+editor | packages/editor/src/services/BuildrikSyncProvider.ts:647 | 2 | WIRED |
| 33 | `sites.listDeleted` | query | protectedProcedure | routers/sites.ts:238 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:152 | 1 | WIRED |
| 34 | `sites.restore` | mutation | protectedProcedure | routers/sites.ts:246 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:154 | 1 | WIRED |
| 35 | `sites.bulk` | mutation | protectedProcedure | routers/sites.ts:280 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:236 | 1 | WIRED |
| 36 | `sites.myRole` | query | protectedProcedure | routers/sites.ts:324 | dashboard+editor | packages/editor/src/services/RoleService.ts:34 | 3 | WIRED |
| 37 | `sites.checkSlug` | query | protectedProcedure | routers/sites.ts:350 | dashboard | packages/dashboard/components/sites/create-site-modal.tsx:45 | 1 | WIRED |
| 38 | `sites.transfer` | mutation | protectedProcedure | routers/sites.ts:359 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/DangerZoneScreen.tsx:200 | 2 | WIRED |
| 39 | `sites.saveProject` | mutation | protectedProcedure | routers/sites.ts:383 | editor | packages/editor/src/services/BuildrikSyncProvider.ts:874 | 1 | WIRED |
| 40 | `sites.prePublishChecks` | query | protectedProcedure | routers/sites.ts:463 | editor | packages/editor/src/services/PublishService.ts:308 | 1 | WIRED |
| 41 | `sites.publish` | mutation | protectedProcedure | routers/sites.ts:475 | editor | packages/editor/src/services/PublishService.ts:94 | 1 | WIRED |
| 42 | `sites.publishStatus` | query | protectedProcedure | routers/sites.ts:578 | editor | packages/editor/src/services/PublishService.ts:120 | 1 | WIRED |
| 43 | `sites.cancelPublish` | mutation | protectedProcedure | routers/sites.ts:594 | editor | packages/editor/src/services/PublishService.ts:183 | 1 | WIRED |
| 44 | `sites.schedulePublish` | mutation | protectedProcedure | routers/sites.ts:627 | — | — | 0 | NO CALLER |
| 45 | `sites.cancelScheduledPublish` | mutation | protectedProcedure | routers/sites.ts:654 | — | — | 0 | NO CALLER |
| 46 | `sites.getScheduledPublish` | query | protectedProcedure | routers/sites.ts:673 | — | — | 0 | NO CALLER |
| 47 | `sites.unpublish` | mutation | protectedProcedure | routers/sites.ts:690 | dashboard+editor | packages/editor/src/services/PublishService.ts:319 | 2 | WIRED |
| 48 | `sites.publishHistory` | query | protectedProcedure | routers/sites.ts:713 | editor | packages/editor/src/services/PublishService.ts:273 | 1 | WIRED |
| 49 | `sites.publishDiff` | query | protectedProcedure | routers/sites.ts:728 | editor | packages/editor/src/services/PublishService.ts:334 | 1 | WIRED |
| 50 | `sites.publishedSnapshot` | query | protectedProcedure | routers/sites.ts:743 | editor | packages/editor/src/services/PublishService.ts:341 | 1 | WIRED |
| 51 | `sites.retryFormsActivation` | mutation | protectedProcedure | routers/sites.ts:763 | editor | packages/editor/src/services/PublishService.ts:158 | 1 | WIRED |
| 52 | `sites.retryPostDeploy` | mutation | protectedProcedure | routers/sites.ts:783 | editor | packages/editor/src/services/PublishService.ts:163 | 1 | WIRED |
| 53 | `sites.rollback` | mutation | protectedProcedure | routers/sites.ts:805 | editor | packages/editor/src/services/PublishService.ts:290 | 1 | WIRED |
| 54 | `sites.getProjectData` | query | protectedProcedure | routers/sites.ts:841 | — | — | 0 | NO CALLER |
| 55 | `sites.folders.list` | query | protectedProcedure | routers/sites.ts:860 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:166 | 1 | WIRED |
| 56 | `sites.folders.create` | mutation | protectedProcedure | routers/sites.ts:865 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:254 | 1 | WIRED |
| 57 | `sites.folders.delete` | mutation | protectedProcedure | routers/sites.ts:888 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:273 | 1 | WIRED |
| 58 | `sites.folders.rename` | mutation | protectedProcedure | routers/sites.ts:905 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:264 | 1 | WIRED |
| 59 | `sites.folders.moveSite` | mutation | protectedProcedure | routers/sites.ts:922 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:246 | 1 | WIRED |
| 60 | `siteDetail.overview` | query | protectedProcedure | routers/site-detail.ts:41 | dashboard | packages/dashboard/app/dashboard/sites/[id]/page.tsx:11 | 1 | WIRED |
| 61 | `siteDetail.settingsOverview` | query | protectedProcedure | routers/site-detail.ts:55 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/OverviewScreen.tsx:35 | 1 | WIRED |
| 62 | `siteDetail.locales` | query | protectedProcedure | routers/site-detail.ts:69 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/LocalizationScreen.tsx:94 | 2 | WIRED |
| 63 | `siteDetail.settings.get` | query | protectedProcedure | routers/site-detail.ts:88 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/AdvancedScreen.tsx:231 | 11 | WIRED |
| 64 | `siteDetail.settings.update` | mutation | protectedProcedure | routers/site-detail.ts:106 | editor | packages/editor/src/services/BuildrikSyncProvider.ts:454 | 2 | WIRED |
| 65 | `siteDetail.projectSettings.update` | mutation | protectedProcedure | routers/site-detail.ts:157 | editor | packages/editor/src/services/BuildrikSyncProvider.ts:470 | 1 | WIRED |
| 66 | `siteDetail.redirects.list` | query | protectedProcedure | routers/site-detail.ts:190 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/RedirectsScreen.tsx:188 | 3 | WIRED (indirect) |
| 67 | `siteDetail.redirects.suggestions` | query | protectedProcedure | routers/site-detail.ts:205 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/RedirectsScreen.tsx:189 | 2 | WIRED (indirect) |
| 68 | `siteDetail.redirects.create` | mutation | protectedProcedure | routers/site-detail.ts:217 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/RedirectsScreen.tsx:306 | 4 | WIRED (indirect) |
| 69 | `siteDetail.redirects.update` | mutation | protectedProcedure | routers/site-detail.ts:260 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/RedirectsScreen.tsx:338 | 1 | WIRED (indirect) |
| 70 | `siteDetail.redirects.delete` | mutation | protectedProcedure | routers/site-detail.ts:289 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/RedirectsScreen.tsx:290 | 1 | WIRED (indirect) |
| 71 | `siteDetail.redirects.import_csv` | mutation | protectedProcedure | routers/site-detail.ts:315 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/RedirectsScreen.tsx:277 | 1 | WIRED (indirect) |
| 72 | `siteDetail.redirects.export_csv` | query | protectedProcedure | routers/site-detail.ts:349 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/RedirectsScreen.tsx:231 | 1 | WIRED |
| 73 | `siteDetail.domains.list` | query | protectedProcedure | routers/site-detail.ts:363 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/DomainsScreen.tsx:177 | 6 | WIRED |
| 74 | `siteDetail.domains.usesVercel` | query | protectedProcedure | routers/site-detail.ts:376 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/DomainsScreen.tsx:188 | 1 | WIRED |
| 75 | `siteDetail.domains.listForWorkspace` | query | protectedProcedure | routers/site-detail.ts:389 | dashboard | packages/dashboard/app/dashboard/settings/domains/page.tsx:15 | 2 | WIRED |
| 76 | `siteDetail.domains.checkAvailability` | query | protectedProcedure | routers/site-detail.ts:397 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/DomainsScreen.tsx:339 | 1 | WIRED (indirect) |
| 77 | `siteDetail.domains.check` | mutation | protectedProcedure | routers/site-detail.ts:401 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/DomainsScreen.tsx:240 | 1 | WIRED (indirect) |
| 78 | `siteDetail.domains.connect` | mutation | protectedProcedure | routers/site-detail.ts:416 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/DomainsScreen.tsx:286 | 1 | WIRED (indirect) |
| 79 | `siteDetail.domains.update` | mutation | protectedProcedure | routers/site-detail.ts:458 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/DomainsScreen.tsx:226 | 1 | WIRED (indirect) |
| 80 | `siteDetail.domains.remove` | mutation | protectedProcedure | routers/site-detail.ts:475 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/DomainsScreen.tsx:255 | 1 | WIRED (indirect) |
| 81 | `siteDetail.domains.setPrimary` | mutation | protectedProcedure | routers/site-detail.ts:502 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/DomainsScreen.tsx:274 | 1 | WIRED (indirect) |
| 82 | `siteDetail.sharing.list` | query | protectedProcedure | routers/site-detail.ts:524 | dashboard+editor | packages/dashboard/app/dashboard/sites/[id]/access/page.tsx:16 | 2 | WIRED (indirect) |
| 83 | `siteDetail.sharing.create` | mutation | protectedProcedure | routers/site-detail.ts:545 | dashboard+editor | packages/dashboard/app/dashboard/sites/[id]/access/page.tsx:31 | 3 | WIRED (indirect) |
| 84 | `siteDetail.sharing.revoke` | mutation | protectedProcedure | routers/site-detail.ts:595 | dashboard | packages/dashboard/app/dashboard/sites/[id]/access/page.tsx:39 | 1 | WIRED |
| 85 | `siteDetail.analytics` | query | protectedProcedure | routers/site-detail.ts:623 | dashboard | packages/dashboard/app/dashboard/sites/[id]/analytics/page.tsx:14 | 1 | WIRED |
| 86 | `siteDetail.analyticsStatus` | query | protectedProcedure | routers/site-detail.ts:639 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/AnalyticsScreen.tsx:221 | 2 | WIRED |
| 87 | `templates.list` | query | protectedProcedure | routers/templates.ts:13 | dashboard | packages/dashboard/app/dashboard/templates/page.tsx:67 | 4 | WIRED |
| 88 | `templates.cloneFromSite` | mutation | protectedProcedure | routers/templates.ts:18 | — | — | 0 | NO CALLER |
| 89 | `templates.get` | query | protectedProcedure | routers/templates.ts:38 | dashboard | packages/dashboard/app/dashboard/templates/[id]/page.tsx:17 | 3 | WIRED |
| 90 | `templates.use` | mutation | protectedProcedure | routers/templates.ts:47 | dashboard | packages/dashboard/components/templates/use-template-modal.tsx:74 | 1 | WIRED |
| 91 | `templates.applyToSite` | mutation | protectedProcedure | routers/templates.ts:70 | dashboard | packages/dashboard/components/templates/use-template-modal.tsx:79 | 1 | WIRED |
| 92 | `templates.generate.create` | mutation | protectedProcedure | routers/templates.ts:95 | dashboard | packages/dashboard/app/dashboard/sites/new/page.tsx:66 | 2 | WIRED |
| 93 | `templates.generate.status` | query | protectedProcedure | routers/templates.ts:118 | dashboard | packages/dashboard/app/dashboard/sites/new/page.tsx:51 | 2 | WIRED |
| 94 | `templates.generate.cancel` | mutation | protectedProcedure | routers/templates.ts:127 | dashboard | packages/dashboard/app/dashboard/sites/new/page.tsx:84 | 2 | WIRED |
| 95 | `team.stats` | query | protectedProcedure | routers/team.ts:53 | dashboard | packages/dashboard/app/dashboard/settings/team/page.tsx:28 | 1 | WIRED |
| 96 | `team.list` | query | protectedProcedure | routers/team.ts:57 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/DangerZoneScreen.tsx:185 | 5 | WIRED |
| 97 | `team.auditLog` | query | protectedProcedure | routers/team.ts:63 | — | — | 0 | NO CALLER |
| 98 | `team.invite` | mutation | protectedProcedure | routers/team.ts:76 | dashboard | packages/dashboard/app/dashboard/settings/team/page.tsx:34 | 2 | WIRED |
| 99 | `team.changeRole` | mutation | protectedProcedure | routers/team.ts:92 | dashboard | packages/dashboard/app/dashboard/settings/team/page.tsx:62 | 1 | WIRED |
| 100 | `team.revoke` | mutation | protectedProcedure | routers/team.ts:114 | dashboard | packages/dashboard/app/dashboard/settings/team/page.tsx:70 | 1 | WIRED |
| 101 | `team.reactivate` | mutation | protectedProcedure | routers/team.ts:131 | dashboard | packages/dashboard/app/dashboard/settings/team/page.tsx:88 | 1 | WIRED |
| 102 | `team.delete` | mutation | protectedProcedure | routers/team.ts:148 | dashboard | packages/dashboard/app/dashboard/settings/team/page.tsx:79 | 1 | WIRED |
| 103 | `team.pendingInvites` | query | protectedProcedure | routers/team.ts:164 | dashboard | packages/dashboard/app/dashboard/settings/team/page.tsx:30 | 1 | WIRED |
| 104 | `team.revokeInvite` | mutation | protectedProcedure | routers/team.ts:168 | dashboard | packages/dashboard/app/dashboard/settings/team/page.tsx:97 | 1 | WIRED |
| 105 | `team.resendInvite` | mutation | protectedProcedure | routers/team.ts:172 | dashboard | packages/dashboard/app/dashboard/settings/team/page.tsx:106 | 1 | WIRED |
| 106 | `team.activity` | query | protectedProcedure | routers/team.ts:183 | dashboard | packages/dashboard/app/dashboard/settings/team/page.tsx:31 | 1 | WIRED |
| 107 | `billing.overview` | query | protectedProcedure | routers/billing.ts:57 | dashboard | packages/dashboard/app/dashboard/page.tsx:36 | 3 | WIRED |
| 108 | `billing.plans` | query | protectedProcedure | routers/billing.ts:61 | dashboard | packages/dashboard/app/dashboard/settings/plans/page.tsx:89 | 1 | WIRED |
| 109 | `billing.usage` | query | protectedProcedure | routers/billing.ts:62 | — | — | 0 | NO CALLER |
| 110 | `billing.invoices` | query | protectedProcedure | routers/billing.ts:67 | dashboard | packages/dashboard/app/dashboard/settings/billing/page.tsx:88 | 1 | WIRED |
| 111 | `billing.createCheckoutSession` | mutation | protectedProcedure | routers/billing.ts:73 | dashboard | packages/dashboard/app/dashboard/settings/plans/page.tsx:97 | 2 | WIRED |
| 112 | `billing.createPortalSession` | mutation | protectedProcedure | routers/billing.ts:79 | dashboard | packages/dashboard/app/dashboard/settings/plans/page.tsx:101 | 3 | WIRED |
| 113 | `billing.cancel` | mutation | protectedProcedure | routers/billing.ts:85 | dashboard | packages/dashboard/app/dashboard/settings/billing/page.tsx:104 | 1 | WIRED |
| 114 | `billing.reactivate` | mutation | protectedProcedure | routers/billing.ts:96 | dashboard | packages/dashboard/app/dashboard/settings/billing/page.tsx:113 | 1 | WIRED |
| 115 | `account.profile.get` | query | protectedProcedure | routers/account.ts:70 | dashboard+editor | packages/editor/src/services/BuildrikSyncProvider.ts:919 | 4 | WIRED |
| 116 | `account.profile.update` | mutation | protectedProcedure | routers/account.ts:71 | dashboard | packages/dashboard/app/dashboard/settings/profile/page.tsx:13 | 1 | WIRED |
| 117 | `account.changeEmail` | mutation | protectedProcedure | routers/account.ts:73 | dashboard | packages/dashboard/app/dashboard/settings/account/page.tsx:23 | 1 | WIRED |
| 118 | `account.changePassword` | mutation | protectedProcedure | routers/account.ts:83 | dashboard | packages/dashboard/app/dashboard/settings/account/page.tsx:13 | 1 | WIRED |
| 119 | `account.setPassword` | mutation | protectedProcedure | routers/account.ts:93 | dashboard | packages/dashboard/app/dashboard/settings/account/page.tsx:18 | 1 | WIRED |
| 120 | `account.disconnectProvider` | mutation | protectedProcedure | routers/account.ts:102 | dashboard | packages/dashboard/app/dashboard/settings/account/page.tsx:28 | 1 | WIRED |
| 121 | `account.twoFactor.enable` | mutation | protectedProcedure | routers/account.ts:117 | dashboard | packages/dashboard/components/settings/security-tab.tsx:70 | 1 | WIRED |
| 122 | `account.twoFactor.confirm` | mutation | protectedProcedure | routers/account.ts:126 | dashboard | packages/dashboard/components/settings/security-tab.tsx:81 | 1 | WIRED |
| 123 | `account.twoFactor.disable` | mutation | protectedProcedure | routers/account.ts:138 | dashboard | packages/dashboard/components/settings/security-tab.tsx:94 | 1 | WIRED |
| 124 | `account.sessions.list` | query | protectedProcedure | routers/account.ts:154 | dashboard | packages/dashboard/components/settings/security-tab.tsx:59 | 1 | WIRED |
| 125 | `account.sessions.revoke` | mutation | protectedProcedure | routers/account.ts:160 | dashboard | packages/dashboard/components/settings/security-tab.tsx:106 | 1 | WIRED |
| 126 | `account.sessions.revokeAll` | mutation | protectedProcedure | routers/account.ts:161 | dashboard | packages/dashboard/components/settings/security-tab.tsx:112 | 1 | WIRED |
| 127 | `account.loginHistory` | query | protectedProcedure | routers/account.ts:163 | dashboard | packages/dashboard/components/settings/security-tab.tsx:60 | 1 | WIRED |
| 128 | `account.notifications.list` | query | protectedProcedure | routers/account.ts:165 | dashboard | packages/dashboard/components/settings/notification-prefs.tsx:45 | 1 | WIRED |
| 129 | `account.notifications.update` | mutation | protectedProcedure | routers/account.ts:166 | dashboard | packages/dashboard/components/settings/notification-prefs.tsx:56 | 1 | WIRED |
| 130 | `account.preferences.get` | query | protectedProcedure | routers/account.ts:169 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:37 | 1 | WIRED |
| 131 | `account.preferences.update` | mutation | protectedProcedure | routers/account.ts:170 | dashboard | packages/dashboard/app/dashboard/projects/page.tsx:38 | 1 | WIRED |
| 132 | `account.workspace.get` | query | protectedProcedure | routers/account.ts:175 | dashboard | packages/dashboard/app/dashboard/page.tsx:27 | 7 | WIRED |
| 133 | `account.workspace.listMine` | query | protectedProcedure | routers/account.ts:180 | dashboard | packages/dashboard/app/auth/redirect/page.tsx:15 | 3 | WIRED |
| 134 | `account.workspace.create` | mutation | protectedProcedure | routers/account.ts:184 | dashboard | packages/dashboard/app/auth/workspace-setup/page.tsx:20 | 1 | WIRED |
| 135 | `account.workspace.update` | mutation | protectedProcedure | routers/account.ts:199 | dashboard | packages/dashboard/app/dashboard/settings/workspace/page.tsx:18 | 2 | WIRED |
| 136 | `account.workspace.sharing` | mutation | protectedProcedure | routers/account.ts:216 | dashboard | packages/dashboard/app/dashboard/settings/workspace/page.tsx:30 | 1 | WIRED |
| 137 | `account.workspace.delete` | mutation | protectedProcedure | routers/account.ts:221 | dashboard | packages/dashboard/app/dashboard/settings/danger/page.tsx:25 | 1 | WIRED |
| 138 | `account.workspace.cancelDelete` | mutation | protectedProcedure | routers/account.ts:230 | dashboard | packages/dashboard/app/dashboard/page.tsx:30 | 1 | WIRED |
| 139 | `account.workspace.transfer.pending` | query | protectedProcedure | routers/account.ts:240 | dashboard | packages/dashboard/app/dashboard/settings/danger/page.tsx:168 | 1 | WIRED |
| 140 | `account.workspace.transfer.initiate` | mutation | protectedProcedure | routers/account.ts:244 | dashboard | packages/dashboard/app/dashboard/settings/danger/page.tsx:170 | 1 | WIRED |
| 141 | `account.workspace.transfer.accept` | mutation | protectedProcedure | routers/account.ts:256 | dashboard | packages/dashboard/app/transfer/accept/page.tsx:25 | 1 | WIRED |
| 142 | `account.workspace.transfer.cancel` | mutation | protectedProcedure | routers/account.ts:269 | dashboard | packages/dashboard/app/dashboard/settings/danger/page.tsx:179 | 1 | WIRED |
| 143 | `account.integrations.list` | query | protectedProcedure | routers/account.ts:281 | dashboard | packages/dashboard/components/settings/integrations-content.tsx:119 | 1 | WIRED |
| 144 | `account.integrations.add` | mutation | protectedProcedure | routers/account.ts:294 | dashboard | packages/dashboard/components/settings/integrations-content.tsx:125 | 1 | WIRED |
| 145 | `account.integrations.remove` | mutation | protectedProcedure | routers/account.ts:307 | dashboard | packages/dashboard/components/settings/integrations-content.tsx:129 | 1 | WIRED |
| 146 | `account.integrations.update` | mutation | protectedProcedure | routers/account.ts:308 | dashboard | packages/dashboard/components/settings/integrations-content.tsx:132 | 1 | WIRED |
| 147 | `account.integrations.testEvent` | mutation | protectedProcedure | routers/account.ts:318 | dashboard | packages/dashboard/components/settings/integrations-content.tsx:136 | 1 | WIRED |
| 148 | `account.aiCredits` | query | protectedProcedure | routers/account.ts:331 | dashboard | packages/dashboard/app/dashboard/settings/usage/page.tsx:139 | 2 | WIRED |
| 149 | `account.dangerZone.pendingDeletion` | query | protectedProcedure | routers/account.ts:336 | dashboard | packages/dashboard/app/dashboard/page.tsx:28 | 1 | WIRED |
| 150 | `account.dangerZone.deletionEligibility` | query | protectedProcedure | routers/account.ts:342 | dashboard | packages/dashboard/app/dashboard/settings/danger/page.tsx:42 | 1 | WIRED |
| 151 | `account.dangerZone.exportData` | query | protectedProcedure | routers/account.ts:345 | dashboard | packages/dashboard/app/dashboard/settings/danger/page.tsx:50 | 1 | WIRED |
| 152 | `account.dangerZone.deleteAccount` | mutation | protectedProcedure | routers/account.ts:346 | dashboard | packages/dashboard/app/dashboard/settings/danger/page.tsx:66 | 1 | WIRED |
| 153 | `account.dangerZone.cancelAccountDeletion` | mutation | protectedProcedure | routers/account.ts:361 | dashboard | packages/dashboard/app/dashboard/page.tsx:35 | 1 | WIRED |
| 154 | `help.categories` | query | publicProcedure | routers/help.ts:15 | — | — | 0 | NO CALLER |
| 155 | `help.search` | query | publicProcedure | routers/help.ts:17 | dashboard | packages/dashboard/app/dashboard/help/page.tsx:49 | 2 | WIRED |
| 156 | `help.byCategory` | query | publicProcedure | routers/help.ts:21 | dashboard | packages/dashboard/app/dashboard/help/page.tsx:54 | 1 | WIRED |
| 157 | `help.article` | query | publicProcedure | routers/help.ts:25 | dashboard | packages/dashboard/app/dashboard/help/[slug]/page.tsx:15 | 1 | WIRED |
| 158 | `help.feedback` | mutation | publicProcedure | routers/help.ts:33 | dashboard | packages/dashboard/app/dashboard/help/[slug]/page.tsx:20 | 1 | WIRED |
| 159 | `help.createTicket` | mutation | protectedProcedure | routers/help.ts:40 | dashboard | packages/dashboard/components/help/ticket-form.tsx:49 | 1 | WIRED |
| 160 | `learn.list` | query | protectedProcedure | routers/learn.ts:9 | dashboard | packages/dashboard/app/dashboard/learn/page.tsx:153 | 1 | WIRED |
| 161 | `learn.complete` | mutation | protectedProcedure | routers/learn.ts:11 | dashboard | packages/dashboard/app/dashboard/learn/page.tsx:155 | 1 | WIRED |
| 162 | `notifications.list` | query | protectedProcedure | routers/notifications.ts:11 | dashboard | packages/dashboard/components/settings/notification-prefs.tsx:45 | 1 | WIRED |
| 163 | `notifications.unreadCount` | query | protectedProcedure | routers/notifications.ts:17 | dashboard+editor | packages/editor/src/services/NotificationService.ts:55 | 2 | WIRED |
| 164 | `notifications.markRead` | mutation | protectedProcedure | routers/notifications.ts:20 | dashboard+editor | packages/editor/src/services/NotificationService.ts:63 | 3 | WIRED |
| 165 | `notifications.markAllRead` | mutation | protectedProcedure | routers/notifications.ts:25 | dashboard+editor | packages/editor/src/services/NotificationService.ts:68 | 3 | WIRED |
| 166 | `notifications.delete` | mutation | protectedProcedure | routers/notifications.ts:28 | dashboard | packages/dashboard/components/notifications/notification-page.tsx:44 | 1 | WIRED |
| 167 | `notifications.muteType` | mutation | protectedProcedure | routers/notifications.ts:33 | dashboard | packages/dashboard/components/notifications/notification-page.tsx:50 | 1 | WIRED |
| 168 | `notifications.recent` | query | protectedProcedure | routers/notifications.ts:44 | dashboard+editor | packages/editor/src/services/NotificationService.ts:40 | 2 | WIRED |
| 169 | `notifications.listGrouped` | query | protectedProcedure | routers/notifications.ts:47 | dashboard | packages/dashboard/components/notifications/notification-page.tsx:27 | 1 | WIRED |
| 170 | `onboarding.getState` | query | protectedProcedure | routers/onboarding.ts:20 | dashboard+editor+lib | packages/editor/src/editor/onboarding/useOnboardingOrchestrator.ts:137 | 5 | WIRED |
| 171 | `onboarding.completeStep` | mutation | protectedProcedure | routers/onboarding.ts:28 | — | — | 0 | NO CALLER |
| 172 | `onboarding.completeDashboardTask` | mutation | protectedProcedure | routers/onboarding.ts:40 | dashboard | packages/dashboard/components/onboarding/dashboard-checklist.tsx:105 | 1 | WIRED |
| 173 | `onboarding.completeEditorTask` | mutation | protectedProcedure | routers/onboarding.ts:50 | editor | packages/editor/src/editor/onboarding/useOnboardingOrchestrator.ts:119 | 1 | WIRED |
| 174 | `onboarding.saveWizard` | mutation | protectedProcedure | routers/onboarding.ts:60 | dashboard | packages/dashboard/components/onboarding/wizard/wizard-context.tsx:38 | 1 | WIRED |
| 175 | `onboarding.completeWizard` | mutation | protectedProcedure | routers/onboarding.ts:70 | dashboard | packages/dashboard/components/onboarding/wizard/use-onboarding-complete.ts:24 | 1 | WIRED |
| 176 | `onboarding.dismiss` | mutation | protectedProcedure | routers/onboarding.ts:78 | dashboard | packages/dashboard/app/dashboard/page.tsx:38 | 2 | WIRED |
| 177 | `pages.list` | query | protectedProcedure | routers/pages.ts:49 | dashboard | packages/dashboard/app/onboarding/ai/preview/page.tsx:57 | 1 | WIRED |
| 178 | `pages.get` | query | protectedProcedure | routers/pages.ts:53 | — | — | 0 | NO CALLER |
| 179 | `pages.create` | mutation | protectedProcedure | routers/pages.ts:59 | — | — | 0 | NO CALLER |
| 180 | `pages.update` | mutation | protectedProcedure | routers/pages.ts:67 | — | — | 0 | NO CALLER |
| 181 | `pages.delete` | mutation | protectedProcedure | routers/pages.ts:76 | — | — | 0 | NO CALLER |
| 182 | `pages.getTranslation` | query | protectedProcedure | routers/pages.ts:85 | — | — | 0 | NO CALLER |
| 183 | `pages.setTranslation` | mutation | protectedProcedure | routers/pages.ts:91 | — | — | 0 | NO CALLER |
| 184 | `pages.removeTranslation` | mutation | protectedProcedure | routers/pages.ts:104 | — | — | 0 | NO CALLER |
| 185 | `pages.folders.list` | query | protectedProcedure | routers/pages.ts:118 | editor | packages/editor/src/services/PageFolderService.ts:26 | 1 | WIRED |
| 186 | `pages.folders.create` | mutation | protectedProcedure | routers/pages.ts:121 | editor | packages/editor/src/services/PageFolderService.ts:28 | 1 | WIRED |
| 187 | `pages.folders.update` | mutation | protectedProcedure | routers/pages.ts:124 | editor | packages/editor/src/services/PageFolderService.ts:30 | 1 | WIRED |
| 188 | `pages.folders.delete` | mutation | protectedProcedure | routers/pages.ts:127 | editor | packages/editor/src/services/PageFolderService.ts:31 | 1 | WIRED |
| 189 | `pages.folders.movePage` | mutation | protectedProcedure | routers/pages.ts:130 | editor | packages/editor/src/services/PageFolderService.ts:33 | 1 | WIRED |
| 190 | `forms.listBlocks` | query | protectedProcedure | routers/forms.ts:34 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx:124 | 2 | WIRED |
| 191 | `forms.listSubmissions` | query | protectedProcedure | routers/forms.ts:41 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx:149 | 2 | WIRED |
| 192 | `forms.updateSubmission` | mutation | protectedProcedure | routers/forms.ts:48 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx:171 | 2 | WIRED |
| 193 | `forms.deleteSubmission` | mutation | protectedProcedure | routers/forms.ts:60 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx:181 | 2 | WIRED |
| 194 | `forms.getBlock` | query | protectedProcedure | routers/forms.ts:72 | editor | packages/editor/src/editor/inspector/sections/FormAfterSubmitSection.tsx:99 | 1 | WIRED |
| 195 | `forms.updateBlock` | mutation | protectedProcedure | routers/forms.ts:79 | editor | packages/editor/src/editor/inspector/sections/FormAfterSubmitSection.tsx:148 | 1 | WIRED |
| 196 | `forms.exportSubmissions` | query | protectedProcedure | routers/forms.ts:103 | editor | packages/editor/src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx:197 | 1 | WIRED |
| 197 | `upload.presign` | mutation | protectedProcedure | routers/upload.ts:9 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/SiteSettingsScreen.tsx:86 | 4 | WIRED |
| 198 | `upload.confirm` | mutation | protectedProcedure | routers/upload.ts:22 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/settings/screens/SiteSettingsScreen.tsx:102 | 4 | WIRED |
| 199 | `upload.limits` | query | protectedProcedure | routers/upload.ts:31 | — | — | 0 | NO CALLER |
| 200 | `ai.content` | mutation | protectedProcedure | routers/ai.ts:200 | — | — | 0 | NO CALLER |
| 201 | `ai.page` | mutation | protectedProcedure | routers/ai.ts:226 | — | — | 0 | NO CALLER |
| 202 | `ai.layout` | mutation | protectedProcedure | routers/ai.ts:252 | — | — | 0 | NO CALLER |
| 203 | `ai.summarize` | mutation | protectedProcedure | routers/ai.ts:278 | — | — | 0 | NO PROD CALLER (tests only) |
| 204 | `ai.milestoneSuggest` | mutation | protectedProcedure | routers/ai.ts:303 | — | — | 0 | NO PROD CALLER (tests only) |
| 205 | `ai.quota` | query | protectedProcedure | routers/ai.ts:329 | — | — | 0 | NO CALLER |
| 206 | `ai.streamPrompt` | subscription | protectedProcedure | routers/ai.ts:334 | — | — | 0 | NO CALLER |
| 207 | `ai.componentSchema` | mutation | protectedProcedure | routers/ai.ts:444 | — | — | 0 | NO CALLER |
| 208 | `ai.logAdoption` | mutation | protectedProcedure | routers/ai.ts:484 | — | — | 0 | NO CALLER |
| 209 | `media.listFolders` | query | protectedProcedure | routers/media.ts:109 | dashboard+editor | packages/editor/src/services/BuildrikSyncProvider.ts:994 | 2 | WIRED |
| 210 | `media.createFolder` | mutation | protectedProcedure | routers/media.ts:115 | dashboard+editor | packages/editor/src/services/AssetUploadService.ts:223 | 2 | WIRED |
| 211 | `media.renameFolder` | mutation | protectedProcedure | routers/media.ts:128 | dashboard+editor | packages/editor/src/services/AssetUploadService.ts:277 | 2 | WIRED |
| 212 | `media.moveFolder` | mutation | protectedProcedure | routers/media.ts:141 | — | — | 0 | NO CALLER |
| 213 | `media.deleteFolder` | mutation | protectedProcedure | routers/media.ts:164 | dashboard+editor | packages/editor/src/services/AssetUploadService.ts:236 | 2 | WIRED |
| 214 | `media.listAssets` | query | protectedProcedure | routers/media.ts:179 | dashboard+editor | packages/editor/src/services/BuildrikSyncProvider.ts:975 | 2 | WIRED |
| 215 | `media.createAsset` | mutation | protectedProcedure | routers/media.ts:185 | dashboard+editor | packages/editor/src/services/AssetUploadService.ts:156 | 2 | WIRED |
| 216 | `media.updateAsset` | mutation | protectedProcedure | routers/media.ts:213 | editor | packages/editor/src/services/AssetUploadService.ts:259 | 1 | WIRED |
| 217 | `media.deleteAsset` | mutation | protectedProcedure | routers/media.ts:229 | dashboard+editor | packages/editor/src/services/AssetUploadService.ts:211 | 2 | WIRED |
| 218 | `media.moveAsset` | mutation | protectedProcedure | routers/media.ts:242 | dashboard+editor | packages/editor/src/services/AssetUploadService.ts:247 | 2 | WIRED |
| 219 | `media.listAssetVersions` | query | protectedProcedure | routers/media.ts:260 | editor | packages/editor/src/services/MediaVersionService.ts:39 | 1 | WIRED |
| 220 | `media.createAssetVersion` | mutation | protectedProcedure | routers/media.ts:273 | editor | packages/editor/src/services/MediaVersionService.ts:49 | 1 | WIRED |
| 221 | `media.restoreAssetVersion` | mutation | protectedProcedure | routers/media.ts:294 | editor | packages/editor/src/services/MediaVersionService.ts:54 | 1 | WIRED |
| 222 | `media.generateAltText` | mutation | protectedProcedure | routers/media.ts:324 | — | — | 0 | NO CALLER |
| 223 | `media.checkStorageQuota` | query | protectedProcedure | routers/media.ts:352 | dashboard+editor | packages/editor/src/editor/sidebar/tabs/media/hooks/useServerStorageQuota.ts:61 | 2 | WIRED |
| 224 | `media.uploadPrefix` | query | protectedProcedure | routers/media.ts:360 | editor | packages/editor/src/services/AssetUploadService.ts:115 | 1 | WIRED |
| 225 | `media.searchStockPhotos` | query | protectedProcedure | routers/media.ts:368 | editor | packages/editor/src/services/stock/StockService.ts:111 | 1 | WIRED |
| 226 | `media.searchStockVideos` | query | protectedProcedure | routers/media.ts:385 | editor | packages/editor/src/services/stock/StockService.ts:125 | 1 | WIRED |
| 227 | `apiTokens.list` | query | protectedProcedure | routers/api-tokens.ts:50 | dashboard | packages/dashboard/components/settings/api-tokens-tab.tsx:50 | 1 | WIRED |
| 228 | `apiTokens.create` | mutation | protectedProcedure | routers/api-tokens.ts:57 | dashboard | packages/dashboard/components/settings/api-tokens-tab.tsx:62 | 1 | WIRED |
| 229 | `apiTokens.revoke` | mutation | protectedProcedure | routers/api-tokens.ts:79 | dashboard | packages/dashboard/components/settings/api-tokens-tab.tsx:70 | 1 | WIRED |
| 230 | `apiTokens.delete` | mutation | protectedProcedure | routers/api-tokens.ts:104 | dashboard | packages/dashboard/components/settings/api-tokens-tab.tsx:75 | 1 | WIRED |
| 231 | `integrations.vercel.getConnection` | query | protectedProcedure | routers/integrations.ts:23 | dashboard | packages/dashboard/components/settings/integrations-content.tsx:25 | 1 | WIRED |
| 232 | `integrations.vercel.finishConnect` | mutation | protectedProcedure | routers/integrations.ts:50 | dashboard | packages/dashboard/app/dashboard/settings/integrations/vercel-team-picker/vercel-team-picker-form.tsx:20 | 1 | WIRED |
| 233 | `integrations.vercel.disconnect` | mutation | protectedProcedure | routers/integrations.ts:121 | dashboard | packages/dashboard/components/settings/integrations-content.tsx:29 | 1 | WIRED |
| 234 | `actions.propose` | mutation | rateLimitedAction | routers/actions.ts:36 | — | — | 0 | NO CALLER |
| 235 | `actions.confirm` | mutation | rateLimitedAction | routers/actions.ts:70 | — | — | 0 | NO CALLER |
| 236 | `features.list` | query | protectedProcedure | routers/features.ts:14 | dashboard | packages/dashboard/app/dashboard/settings/page.tsx:32 | 9 | WIRED |
| 237 | `features.set` | mutation | protectedProcedure | routers/features.ts:20 | dashboard | packages/dashboard/components/settings/agency-layer-toggle.tsx:19 | 1 | WIRED |
| 238 | `clients.list` | query | protectedProcedure | routers/clients.ts:50 | dashboard | packages/dashboard/app/onboarding/site/page.tsx:44 | 2 | WIRED |
| 239 | `clients.get` | query | protectedProcedure | routers/clients.ts:57 | dashboard | packages/dashboard/components/clients/client-detail-view.tsx:196 | 1 | WIRED |
| 240 | `clients.create` | mutation | protectedProcedure | routers/clients.ts:69 | dashboard | packages/dashboard/components/clients/clients-view.tsx:131 | 2 | WIRED |
| 241 | `clients.assignSite` | mutation | protectedProcedure | routers/clients.ts:79 | dashboard | packages/dashboard/components/clients/client-detail-view.tsx:226 | 2 | WIRED |
| 242 | `clients.update` | mutation | protectedProcedure | routers/clients.ts:93 | dashboard | packages/dashboard/components/clients/client-detail-view.tsx:209 | 2 | WIRED |
| 243 | `clients.delete` | mutation | protectedProcedure | routers/clients.ts:106 | dashboard | packages/dashboard/components/clients/clients-view.tsx:147 | 1 | WIRED |
| 244 | `reviews.submit` | mutation | protectedProcedure | routers/reviews.ts:66 | dashboard+editor | packages/editor/src/services/ReviewService.ts:126 | 2 | WIRED |
| 245 | `reviews.list` | query | protectedProcedure | routers/reviews.ts:120 | dashboard | packages/dashboard/components/reviews/review-queue.tsx:34 | 1 | WIRED |
| 246 | `reviews.status` | query | protectedProcedure | routers/reviews.ts:147 | editor | packages/editor/src/services/ReviewService.ts:62 | 2 | WIRED |
| 247 | `reviews.resolve` | mutation | protectedProcedure | routers/reviews.ts:181 | dashboard | packages/dashboard/components/reviews/review-queue.tsx:56 | 1 | WIRED |
| 248 | `reviews.currentRound` | query | protectedProcedure | routers/reviews.ts:210 | editor | packages/editor/src/services/ReviewService.ts:218 | 1 | WIRED |
| 249 | `reviews.rounds` | query | protectedProcedure | routers/reviews.ts:234 | editor | packages/editor/src/services/ReviewService.ts:240 | 1 | WIRED |
| 250 | `reviews.approvedSnapshot` | query | protectedProcedure | routers/reviews.ts:255 | editor | packages/editor/src/services/ReviewService.ts:252 | 1 | WIRED |
| 251 | `reviews.revoke` | mutation | protectedProcedure | routers/reviews.ts:275 | dashboard+editor | packages/editor/src/services/ReviewService.ts:267 | 2 | WIRED |
| 252 | `handover.rollup` | query | protectedProcedure | routers/handover.ts:15 | dashboard | packages/dashboard/components/handover/handover-panel.tsx:81 | 1 | WIRED |
| 253 | `clientReview.get` | query | publicProcedure | routers/client-review.ts:89 | dashboard | packages/dashboard/app/review/[token]/review-client.tsx:129 | 1 | WIRED |
| 254 | `clientReview.identify` | mutation | strictClientLimit | routers/client-review.ts:98 | dashboard | packages/dashboard/app/review/[token]/review-client.tsx:130 | 1 | WIRED |
| 255 | `clientReview.comments` | query | publicProcedure | routers/client-review.ts:106 | dashboard | packages/dashboard/app/review/[token]/review-client.tsx:145 | 1 | WIRED |
| 256 | `clientReview.comment` | mutation | commentLimit | routers/client-review.ts:114 | dashboard | packages/dashboard/app/review/[token]/review-client.tsx:138 | 1 | WIRED |
| 257 | `clientReview.requestNewLink` | mutation | strictClientLimit | routers/client-review.ts:125 | dashboard | packages/dashboard/app/review/[token]/review-client.tsx:142 | 1 | WIRED |
| 258 | `clientReview.resolve` | mutation | strictClientLimit | routers/client-review.ts:134 | dashboard | packages/dashboard/app/review/[token]/review-client.tsx:139 | 1 | WIRED |
| 259 | `comments.create` | mutation | protectedProcedure | routers/comments.ts:40 | editor | packages/editor/src/services/ReviewService.ts:286 | 2 | WIRED |
| 260 | `comments.list` | query | protectedProcedure | routers/comments.ts:59 | editor | packages/editor/src/services/ReviewService.ts:192 | 1 | WIRED |
| 261 | `comments.workspaceList` | query | protectedProcedure | routers/comments.ts:71 | dashboard | packages/dashboard/components/comments/comment-queue.tsx:27 | 1 | WIRED |
| 262 | `comments.reattach` | mutation | protectedProcedure | routers/comments.ts:84 | editor | packages/editor/src/services/ReviewService.ts:311 | 1 | WIRED |
| 263 | `comments.resolve` | mutation | protectedProcedure | routers/comments.ts:101 | editor | packages/editor/src/services/ReviewService.ts:318 | 1 | WIRED |
| 264 | `webhooks.status` | query | protectedProcedure | routers/webhooks.ts:20 | dashboard | packages/dashboard/components/settings/webhooks-card.tsx:44 | 1 | WIRED |
| 265 | `webhooks.connect` | mutation | protectedProcedure | routers/webhooks.ts:31 | dashboard | packages/dashboard/components/settings/webhooks-card.tsx:57 | 1 | WIRED |
| 266 | `webhooks.disconnect` | mutation | protectedProcedure | routers/webhooks.ts:51 | dashboard | packages/dashboard/components/settings/webhooks-card.tsx:60 | 1 | WIRED |
| 267 | `webhooks.regenerateSecret` | mutation | protectedProcedure | routers/webhooks.ts:63 | dashboard | packages/dashboard/components/settings/webhooks-card.tsx:63 | 1 | WIRED |
| 268 | `cms.collections.list` | query | protectedProcedure | routers/cms.ts:57 | editor | packages/editor/src/services/cmsSync.ts:604 | 1 | WIRED |
| 269 | `cms.collections.upsert` | mutation | protectedProcedure | routers/cms.ts:61 | editor | packages/editor/src/services/cmsSync.ts:765 | 1 | WIRED |
| 270 | `cms.collections.delete` | mutation | protectedProcedure | routers/cms.ts:69 | editor | packages/editor/src/services/cmsSync.ts:868 | 1 | WIRED |
| 271 | `cms.dynamicPages` | query | protectedProcedure | routers/cms.ts:81 | editor | packages/editor/src/editor/sidebar/tabs/pages/useDynamicPagesSummary.ts:66 | 1 | WIRED |
| 272 | `cms.entries.list` | query | protectedProcedure | routers/cms.ts:90 | editor | packages/editor/src/services/cmsSync.ts:672 | 1 | WIRED |
| 273 | `cms.entries.upsert` | mutation | protectedProcedure | routers/cms.ts:98 | editor | packages/editor/src/services/cmsSync.ts:897 | 1 | WIRED |
| 274 | `cms.entries.delete` | mutation | protectedProcedure | routers/cms.ts:106 | editor | packages/editor/src/services/cmsSync.ts:964 | 1 | WIRED |
| 275 | `cms.entries.importCsvPreview` | mutation | protectedProcedure | routers/cms.ts:118 | editor | packages/editor/src/editor/cms/CsvImportDialog.tsx:79 | 1 | WIRED |
| 276 | `cms.entries.importCsv` | mutation | protectedProcedure | routers/cms.ts:126 | editor | packages/editor/src/editor/cms/CsvImportDialog.tsx:104 | 1 | WIRED |
| 277 | `cms.publishSnapshot` | mutation | protectedProcedure | routers/cms.ts:138 | editor | packages/editor/src/services/cmsSync.ts:492 | 1 | WIRED |
| 278 | `theme.getShared` | query | protectedProcedure | routers/theme.ts:71 | dashboard | packages/dashboard/components/theme/theme-manager.tsx:66 | 1 | WIRED |
| 279 | `theme.targets` | query | protectedProcedure | routers/theme.ts:78 | dashboard | packages/dashboard/components/theme/theme-manager.tsx:67 | 1 | WIRED |
| 280 | `theme.capture` | mutation | protectedProcedure | routers/theme.ts:85 | dashboard | packages/dashboard/components/theme/theme-manager.tsx:84 | 1 | WIRED |
| 281 | `theme.setLock` | mutation | protectedProcedure | routers/theme.ts:99 | dashboard | packages/dashboard/components/theme/theme-manager.tsx:92 | 1 | WIRED |
| 282 | `theme.push` | mutation | protectedProcedure | routers/theme.ts:115 | dashboard | packages/dashboard/components/theme/theme-manager.tsx:111 | 1 | WIRED |
| 283 | `theme.previewPush` | mutation | protectedProcedure | routers/theme.ts:129 | dashboard | packages/dashboard/components/theme/theme-manager.tsx:99 | 1 | WIRED |
| 284 | `theme.rollback` | mutation | protectedProcedure | routers/theme.ts:143 | dashboard | packages/dashboard/components/theme/theme-manager.tsx:127 | 1 | WIRED |
| 285 | `theme.snapshots` | query | protectedProcedure | routers/theme.ts:157 | dashboard | packages/dashboard/components/theme/theme-manager.tsx:39 | 1 | WIRED |
| 286 | `theme.brandRestorePoints` | query | protectedProcedure | routers/theme.ts:178 | editor | packages/editor/src/editor/design-system/state/useBrandRestorePoints.ts:45 | 1 | WIRED |
| 287 | `theme.createBrandRestorePoint` | mutation | protectedProcedure | routers/theme.ts:191 | editor | packages/editor/src/editor/design-system/state/useBrandRestorePoints.ts:24 | 1 | WIRED |
| 288 | `theme.brandRestorePoint` | query | protectedProcedure | routers/theme.ts:208 | editor | packages/editor/src/editor/design-system/state/useBrandRestorePoints.ts:55 | 1 | WIRED |
| 289 | `theme.extractBrandFromUrl` | mutation | protectedProcedure | routers/theme.ts:225 | editor | packages/editor/src/editor/design-system/ui/sections/BrandFromSource.tsx:188 | 1 | WIRED |
| 290 | `theme.presets.list` | query | protectedProcedure | routers/theme.ts:254 | — | — | 0 | NO CALLER |
| 291 | `theme.presets.save` | mutation | protectedProcedure | routers/theme.ts:259 | — | — | 0 | NO CALLER |
| 292 | `theme.presets.delete` | mutation | protectedProcedure | routers/theme.ts:271 | — | — | 0 | NO CALLER |
| 293 | `theme.presets.applyPreset` | mutation | protectedProcedure | routers/theme.ts:279 | — | — | 0 | NO CALLER |
| 294 | `siteVersions.create` | mutation | protectedProcedure | routers/site-version.ts:26 | editor | packages/editor/src/services/versionSync.ts:63 | 1 | WIRED |
| 295 | `siteVersions.list` | query | protectedProcedure | routers/site-version.ts:35 | editor | packages/editor/src/services/versionSync.ts:139 | 1 | WIRED |
| 296 | `siteVersions.get` | query | protectedProcedure | routers/site-version.ts:42 | editor | packages/editor/src/services/versionSync.ts:191 | 1 | WIRED |
| 297 | `siteVersions.rename` | mutation | protectedProcedure | routers/site-version.ts:49 | editor | packages/editor/src/services/versionSync.ts:87 | 1 | WIRED |
| 298 | `siteVersions.delete` | mutation | protectedProcedure | routers/site-version.ts:56 | editor | packages/editor/src/services/versionSync.ts:106 | 1 | WIRED |
| 299 | `siteComponents.upsert` | mutation | protectedProcedure | routers/site-component.ts:53 | editor | packages/editor/src/services/componentSync.ts:62 | 1 | WIRED |
| 300 | `siteComponents.list` | query | protectedProcedure | routers/site-component.ts:67 | editor | packages/editor/src/services/componentSync.ts:126 | 1 | WIRED |
| 301 | `siteComponents.get` | query | protectedProcedure | routers/site-component.ts:74 | editor | packages/editor/src/services/componentSync.ts:136 | 1 | WIRED |
| 302 | `siteComponents.delete` | mutation | protectedProcedure | routers/site-component.ts:81 | editor | packages/editor/src/services/componentSync.ts:88 | 1 | WIRED |
| 303 | `siteComponents.library` | query | protectedProcedure | routers/site-component.ts:91 | editor | packages/editor/src/services/componentSync.ts:188 | 1 | WIRED |
| 304 | `siteComponents.libraryGet` | query | protectedProcedure | routers/site-component.ts:98 | editor | packages/editor/src/services/componentSync.ts:201 | 1 | WIRED |
| 305 | `siteComponents.workspaceList` | query | protectedProcedure | routers/site-component.ts:107 | dashboard | packages/dashboard/components/library/library-panel.tsx:24 | 1 | WIRED |
| 306 | `siteComponents.usage` | query | protectedProcedure | routers/site-component.ts:113 | — | — | 0 | NO CALLER |
| 307 | `siteComponents.workspaceRename` | mutation | protectedProcedure | routers/site-component.ts:121 | dashboard | packages/dashboard/components/library/library-panel.tsx:37 | 1 | WIRED |
| 308 | `siteComponents.workspaceDelete` | mutation | protectedProcedure | routers/site-component.ts:130 | dashboard | packages/dashboard/components/library/library-panel.tsx:46 | 1 | WIRED |
| 309 | `userTemplates.upsert` | mutation | protectedProcedure | routers/user-template.ts:22 | editor | packages/editor/src/services/templateSync.ts:73 | 1 | WIRED |
| 310 | `userTemplates.list` | query | protectedProcedure | routers/user-template.ts:30 | editor | packages/editor/src/services/templateSync.ts:98 | 1 | WIRED |
| 311 | `userTemplates.delete` | mutation | protectedProcedure | routers/user-template.ts:37 | — | — | 0 | NO CALLER |
| 312 | `marketplace.listInstalled` | query | protectedProcedure | routers/marketplace.ts:43 | dashboard | packages/dashboard/app/dashboard/marketplace/page.tsx:43 | 1 | WIRED |
| 313 | `marketplace.install` | mutation | protectedProcedure | routers/marketplace.ts:48 | dashboard | packages/dashboard/app/dashboard/marketplace/page.tsx:57 | 1 | WIRED |
| 314 | `marketplace.uninstall` | mutation | protectedProcedure | routers/marketplace.ts:60 | dashboard | packages/dashboard/app/dashboard/marketplace/page.tsx:58 | 1 | WIRED |
| 315 | `marketplace.getConfig` | query | protectedProcedure | routers/marketplace.ts:74 | dashboard | packages/dashboard/app/dashboard/marketplace/page.tsx:68 | 1 | WIRED |
| 316 | `marketplace.configure` | mutation | protectedProcedure | routers/marketplace.ts:81 | dashboard | packages/dashboard/app/dashboard/marketplace/page.tsx:59 | 1 | WIRED |
| 317 | `activity.recent` | query | protectedProcedure | routers/activity.ts:10 | editor | packages/editor/src/services/ActivityService.ts:57 | 1 | WIRED |

---

## 9. Issues, ranked

### 9.1 Top P1 issues (closest to P0 first)
The surface ID points to the full row in §4–§7. A ✔ marks items I re-read myself at `dc72314c2`.

| # | Sev | Issue | Evidence | Label |
|---|---|---|---|---|
| 1 | P1 | **An autosave that fails on a server/5xx error keeps no recovery copy.** `keepUnsaved` is called for conflict (:639), refused tokens (:655), invalid tokens (:714) and network errors (:743). The generic branch (:790-834) only schedules a retry and toasts "Changes are unsaved". If the tab closes while the server is failing, the edits exist nowhere. Unload-guard coverage is UNKNOWN. (§7 P1-3) | `editor/shell/hooks/useComposerInit.ts:36-46` (imports), `:770-834` ✔ | O branches; loss I |
| 2 | P1 | **Publish ships the live, unsaved tab state, and the server never re-validates or binds it.** `exportPublishPages` reads `composer.exportProject()` and nothing saves first. The lifecycle gate blocks only `saveFailed`/`saveConflict`. `sites.publish` accepts caller-supplied `pages[].html`, size- and path-checked only. The approval gate does not tie the HTML to the reviewed content. (§7 P1-2, P1-4; §5 P-8) | `shell/exportPublishPages.ts:68`; `shell/hooks/useExportHandlers.ts:80-108`; `shell/lifecycle.ts:240-241`; `server/trpc/routers/sites.ts:475-509`; `server/services/publish.service.ts:344-605` | I (absence of save/sanitiser call) |
| 3 | P1 | **Deleting a non-empty media folder hard-deletes every asset in it.** It skips the in-use check, grace window and undo that single-asset delete has. (§5 M-2) | `sidebar/tabs/media/hooks/useLibraryState.ts:316-322` ✔ vs `useSelectionState.ts:200-228` | O |
| 4 | P1 | **CMS delete paths are non-atomic and silent.** Collection delete strips bindings before a delete that can fail. Record and collection deletes have no catch (`void remove()`). Undo after delete re-creates the record under a new id, which breaks references. (§5 C-3, C-4, C-5) | `CollectionSettingsPane.tsx:86-97`; `RecordSheet.tsx:343,548`; `CmsWorkspace.tsx:487`; `useContentPanel.ts:241` | O code; breakage I |
| 5 | P1 | **CMS data sources live only in memory.** `DataManager.sources` is a `Map` absent from `exportProject`, so sources vanish on reload while the UI says "Watching for changes". (§5 C-1) | `engine/data/DataManager.ts:47` ✔; `Composer.ts:801-826`; `ContentViews.tsx:337,404` | O |
| 6 | P1 | **Read-only and lock gates are bypassed on four canvas doors:** section reorder (handles render outside the `!readOnly` block), Ctrl/⌘-drag clone, Group (all 3 doors), and an inline-edit commit after a mid-edit lock. (§6 ISS-C01..C05) | `canvas/hooks/useSectionReorder.ts:277-279` ✔; `canvas/overlays/CanvasOverlayGroup.tsx:243` vs `:346` ✔; `useCanvasElementDrag.ts:215-231`; `ElementManager.ts:221-241`; `useCanvasInlineEdit.ts:86,165-171` | O |
| 7 | P1 | **⌘K palette Undo / Redo / Clear history / Add text / Add container skip the read-only, full-page and Time-travel gates** that ⌘Z respects. Undo can change the live document while Time-travel claims nothing is written. (§4 I-1) | `shell/modals/CommandPalette.tsx:193-277`; `shell/TimeTravelHost.tsx:102-111` | O |
| 8 | P1 | **"+ Add page" is enabled while the project is loading.** A page created then is wiped by `importProject` with no undo (the code's own comments say so). (§4 P-1) | `PageList.tsx:130-145`; `NewPageModal.tsx:51-91` (re-checked @dc72314c2); `usePages.ts:105-114` | O code; loss I |
| 9 | P1 | **Media mirror writes fail silently.** move/update/folder-delete/rename return `false` with no retry, and the result is ignored, so the "Moved N files" toast always shows. A version restored in the drawer changes nothing locally (`src` dropped). (§5 M-1, M-3) | `services/AssetUploadService.ts:246-284`; `MediaManager.ts:1341,1388,1615,1646`; `useLibraryState.ts:354-361` | O |
| 10 | P1 | **Scheduled publish is half-built and cannot work.** The server procedures `sites.schedulePublish/getScheduledPublish/cancelScheduledPublish` have **no UI caller** (§8.2). The cron calls `startPublish(siteId, createdBy)` with no pages, and the worker computes `useVercel = pages.length>0 \|\| storedBundle` and throws "No page content to deploy" unless simulation is on, while the schedule is marked started. Latent until a UI is added. (§7 P1-1) | `packages/dashboard/app/api/cron/scheduled-publish/route.ts:33-39` ✔; `app/api/workers/publish/[jobId]/route.ts:100,122-126` ✔; `server/trpc/routers/sites.ts:627,654,673` | O |

### 9.2 Other P1s (28; the 10 rows above cover 18 P1 IDs)
Full rows are in the cited section.
- **§4 Shell / shortcuts / panels:**
  - S-1: "Go to dashboard" opens sign-in with "session expired".
  - S-2: stale-approval Re-send always says "on its way".
  - I-2: palette Export HTML/JSON discards its output.
  - I-3: ⌘⇧V hijacks paste in text fields.
  - I-4: the cheat sheet shows browser-owned ⌘, / ⌘H.
  - P-2: a failed Templates "Create page" leaves the page behind and Retry duplicates it.
  - P-3: Components Retry does not reload.
- **§5 Assets:** M-4 (alt text written per keystroke; two commit models), M-5 (two asset-version systems), M-6 (drawer edit links history to the wrong asset).
- **§5 CMS:**
  - C-2: source key collision is reported as "Not valid JSON" and leaves a partial import.
  - C-6: rename, dynamic-pages Save and Add field swallow rejections.
  - C-7: merging a duplicate collection leaves stale bindings.
- **§5 Brand:**
  - B-1: lint "Ignore" key `buildrik:ds:lintSuppressions` has no site id, so it leaks across sites (✔ `engine/designSystem/LintState.ts:37`).
  - B-2: Auto-fix suppresses the warning even when the write was refused.
  - B-3: presets read a per-browser localStorage store, not `projectSettings.designPresets`.
- **§5 Settings:**
  - S-1: a failed role lookup silently disables Transfer.
  - S-2: a failed member load looks like an empty team, and only the first 50 members are loaded.
  - S-4: the Languages copy implies multi-language publish, but only the default locale ships.
- **§5 History / Review / Publish:**
  - H-1: Session restore has no safety checkpoint, while Time-travel restore has one.
  - R-1: a failed review re-send is an unhandled rejection with no message.
  - P-1: Publish "Compare" does not open a compare.
  - P-2: "Nothing has changed since the last deploy" comes from the undo stack, which is empty after reload.
  - P-3: "Connect Vercel" is shown when the real cause is the build flag.
- **§6 Canvas / Inspector:**
  - ISS-C06: custom attributes can be added but never listed, edited or removed, and `data-buildrick-*` names are not reserved.
  - ISS-C07: global-class suggestions call `composer.styles.getGlobalClasses`, which no engine module defines (✔ grep: one caller, no definition). No inspector control writes a class, so classes carry no styles.
  - ISS-C08: Align/Distribute use authored CSS, not rendered geometry, and are a no-op for static elements.
  - ISS-C09: the hover DragHandle dispatches a synthetic `dragstart` (STUB).

### 9.3 P2 (146), by theme
- **Dead or unreachable code (O):**
  - 61 unreachable editor files (§10.2), of which 36 are barrels with no importer. The CLAUDE.md "no middle-man files" rule is violated.
  - 4 dead Composer managers, still constructed on every load (`Composer.ts:208,214,215`, plus InteractionManager via the uncalled `setPreviewMode` :1322).
  - The dead module `engine/history/index.ts`.
  - Large dead method surfaces (CanvasIndicators 57/60, StyleEngine 18/27, the ComponentManager variant API).
  - 39 procedures without callers (§8.2), including the whole `ai` router despite the no-AI decision. `dsAi` flag and AI comments remain (§5 B-11, B-12).
- **Duplicated implementations (O):**
  - five restore/version systems and two Compare UIs (§5)
  - four drag mechanisms with different lock rules (§6 ISS-C10)
  - two inspector style write paths (ISS-C14)
  - three zoom paths (ISS-C15)
  - two interaction runtimes and three HTML document builders (§7 #7, #8)
  - save-error classification in two copies (§7 #10)
  - server `pages.*` CRUD unused beside the project blob (§8.2)
  - `shared/types/config.ts` `ComposerConfig` duplicating `shared/types/index.ts` and admitted in a comment (`shared/types/index.ts:46-50`); the copy is unreachable
  - editor-local `shared/utils/tokens.ts` unused, since the engine imports `@buildrik/shared/tokens` (`Composer.ts:42`)
- **Swallowed errors on persistence paths (O):**
  - `unsavedRecovery.ts:126-129` (quota failure is silent)
  - `cmsSync.ts:142`
  - `templateSync.ts:116`
  - `versionSync.ts:222-224`
  - `useServerConflict.ts:227,252` (re-checked @dc72314c2)
  - review refresh (§5 R-2)
  - section-reorder/clone rollback with no toast (ISS-C21)
- **Copy vs behaviour (O):** see §4 and §5 P2 rows. Examples: the "Saved versions" tab is named "Saves"; "Compare rounds" is not a round compare; the "verified" analytics stamp contradicts its dialog; the Tailwind export promises an import that does not exist.
- **Layering (O):**
  - `app/edit/[siteId]/page.tsx:3` imports `@server/services/sites.service` directly
  - the publish worker route makes about 25 direct Prisma calls
  - `engine/Composer.ts:9` imports `services/EmailService`, breaking "engine → shared only"
- **Security-adjacent (P2):**
  - The simulation publish path has no runtime production guard (`publish.service.ts:72,506,1074`; only `scripts/check-prod-env.mjs:217`). O
  - The publish flag is client-only, so the server publishes regardless of it. I
  - `help.feedback` is a **public, un-rate-limited mutation** (`server/trpc/routers/help.ts:33`). O
  - Global custom CSS is injected as `<style>` (CSS-only, `url()` exfiltration possible in principle). I
  - Vercel OAuth callback team-picker re-binding not traced. U
- **Stale documentation in code (O):** `tabsConfig.ts:210-214` (CMS "off-rail"); `HistoryTab.tsx:342-343`; `Canvas.tsx` pick-mode comment; `contextEvaluator.ts:1-12`.

### 9.4 Counts
| Source | P0 | P1 | P2 |
|---|---|---|---|
| §4 shell/panels | 0 | 9 | 38 (+1 UNKNOWN) |
| §5 data/config panels | 0 | 24 | 69 |
| §6 canvas/inspector | 0 | 9 | 14 |
| §7 engine/publish | 0 | 4 | 15 |
| this section (server table, import graph, cross-cutting) | 0 | 0 (scheduled-publish no-UI folded into §7 P1-1) | 10 |
| **Total** | **0** | **46** | **146** |

Totals are summed per surface and are not fully de-duplicated. Known overlaps: publish-unsaved (§5 P-8 = §7 P1-4) and duplication themes repeated across §5 and §7. Net unique P1 is ≈45.

---

## 10. Coverage

### 10.1 What REA could not parse or trace
- **Parse:** nothing failed. `parse_failures: 0` for all three inputs (E1, E4, E6).
- **Module resolution:** effectively none for TypeScript (§2.2 #1). Every reachability claim in this report comes from `graph.py`, not REA.
- **Editor graph incomplete:** the budget was exhausted (§2.2 #2). REA's own `trace_application_feature` for StyleManager / ElementCRUD / ExportEngine / ComponentManager / CollectionManager / interactionRuntime seeds was not run beyond E3: E3 showed a module seed returns no-match or alias-severed graphs. Those engine paths were traced by reading instead (§6, §7).
- **Semantic (data-flow / call-flow):** partial; not used.
- **Dashboard (E6):** coverage complete, but `@server/…` imports are external, so routes→services links are not in the graph.

### 10.2 Unreachable editor files (O, `graph.py`, re-run @dc72314c2)
**Barrels with no production importer (36):**
- `blocks/Navigation/index.ts`
- `editor/{animation,canvas,canvas/hooks/drag,canvas/utils,collaboration,inspector,inspector/components,inspector/styles,inspector/tabs,onboarding,panels,panels/layers/hooks,rail,shell,shell/AquibraStudio,sidebar,sidebar/tabs/component-library,sidebar/tabs/history,sidebar/tabs/media,sidebar/tabs/pages,sidebar/tabs/templates}/index.ts`
- `engine/{canvas,canvas/resize,collaboration,commands,components,data,elements/manager,history,interactions,media,routing,styles,utils}/index.ts`
- `shared/utils/index.ts`

**Modules (25):**
- **Test-only:** `editor/components-catalog/useCatalog.ts`, `editor/design-system/utils/cssPropertyKinds.ts`, `editor/sidebar/shared/DrillInHeader.tsx` (+`headerIcons.tsx`, `headerStyles.ts`), `editor/sidebar/shared/SearchBar.tsx`, `editor/sidebar/tabs/media/data/dragPayload.ts`, `editor/sidebar/tabs/pages/utils/keyboardShortcuts.ts`, `shared/types/modals.ts`.
- **Barrel-only:** `editor/sidebar/tabs/history/components/DiffRow.tsx`, `engine/media/ImageProcessor.ts` (+`ImageProcessorHelpers.ts`), `shared/utils/html/{dom,domManipulation,domQuery}.ts`.
- **Orphaned type/constant modules:** `shared/constants/layout.ts`, `shared/types/{block,command,config,media-image-editor,ui}.ts`, `shared/utils/{tokens,token-names}.ts`.
- **Test infrastructure:** `test-setup.ts`, `test-stubs/server-only.ts`.

### 10.3 Read manually
- Surface code: every file cited in §4–§7.
- My own reads: `server/trpc/trpc.ts:100-197`, `router.ts`, `routers/{cms,theme,marketplace,clients,ai,actions}.ts` (partial), `app/edit/[siteId]/page.tsx`, `EditorClient.tsx`, `rail/tabsConfig.ts`, `sidebar/TabRouter.tsx:1-200`, `shared/utils/featureFlags.ts`, `runtimeEnv.ts:80-100`, `services/api-client.ts`, and the ✔ lines in §9.1.

### 10.4 Not covered
- The service layer behind each of the 278 wired procedures: resource-scoping per procedure (UNKNOWN, §8.1).
- The dashboard's own pages beyond the editor route; they appear only as procedure callers.
- `prisma/schema.prisma`: not audited for model/field orphaning in this part.
- `packages/shared` schemas: read only where cited.
- Nothing was run. No runtime or browser verification (that is Part 2).

---

## 11. UNKNOWN list
1. Whether each protected procedure's service scopes by the caller's workspace or site (§8.1). Only cms/theme/marketplace/clients were spot-checked.
2. Whether an unload guard (`beforeunload`) covers the 5xx-autosave case (§9.1 #1).
3. Whether the server requires a saved revision before publish beyond the optional `expectedLastEditedAt` (§9.1 #2; `publish.service.ts:411`).
4. Whether the production bundle has `NEXT_PUBLIC_FEATURE_PUBLISH="true"`. The inventories INFER "on" from the `check-baked-flags.mjs` gate; the bundle was not inspected.
5. Workspace `client_mode` flag consumers (§7 flags).
6. Vercel OAuth callback team-picker re-binding to the session user (§7 #18).
7. Serializer order when a user writes `data-buildrick-id` as a custom attribute (§6 ISS-C06).
8. The end-to-end autosave scheduler and CommandCenter shortcut map (§6 "Not verified").
9. Callers built from computed property names (`client[x]`): none found by grep, so §8.2 "no caller" stays INFERRED for that case.
10. Whether a Ctrl/⌘-drag clone survives a cancelled drop (§6 ISS-C03).
