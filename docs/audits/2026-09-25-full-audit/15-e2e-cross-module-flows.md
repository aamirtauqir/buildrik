# 15 — End-to-End Cross-Module Flows

Agent G (Verification & Test) · Prompt 15 · 2026-09-25 · READ-ONLY.
**Scope:** the 13 product flows and 11 collaboration flows named in PLAYBOOK Prompt 15. Each is traced UI → handler → hook/store → client service → tRPC/REST → service → Prisma → response → rendered state, then through failure, cancel and return. Code was checked in `packages/editor`, `packages/dashboard`, `server`, `prisma`, `packages/shared` and `lib`.

Path conventions: `E/` = `packages/editor/src/`, `D/` = `packages/dashboard/`, `S/` = `server/`.

---

## Method & runtime status

**What I ran** (read-only, on a shared 4-core box):

| Command | Result |
|---|---|
| `pnpm --filter @buildrik/editor exec vitest run` on `CommandPalette.test.tsx` and `CanvasEmptyCTA.test.tsx` | **4 failed / 42 passed.** Root-caused: the palette builds its nav rows from `tabsConfig`, and the `add` tab is now labelled "Add". The test looks for "Open Insert panel", but the rendered row is "Open Add panel" (`data-testid="cmdk-label-nav-add"`). The count is 23 against a hard-coded 21. This is test drift, not a product defect (A15-12). |
| Root `pnpm vitest run` on 13 flow files: `publish.service{,.approval,.rollback}`, `scheduled-publish.service`, `cms.service`, `review.service`, `publish-approval`, worker `route.buildSteps`, `usePublishJob`, `useExportHandlers{,.publishErrors}`, `useComposerInit{,.offline}` | **13 files, 165/165 passed** |
| Root `pnpm vitest run` on `E/editor/panels/__tests__/*` (VersionHistoryPanel ×3 and others), `VersionTimelineManager.test.ts`, `CMSCollectionSetupModal.dynamicPages.test.tsx` | **8 files, 67/67 passed** |
| Static tracing: Read/Grep over every file cited below | — |

**NOT RUNTIME VERIFIED.** There was no Postgres, no browser, no Vercel and no second client. Playwright was not run. The Playwright suites that exist cover none of the 24 flows end to end (A15-13):
- `E/../e2e`: `boot-clean`, `exit-guard`, `style-parity`, `target-size`, `visual-pins`
- `D/e2e`: `dashboard`, `onboarding`, `settings-drill-in`, `link-integrity`, `console-sweep`, `responsive-audit`, `a11y-states-audit`

Every row below marked "Static" was read from code. None of it was observed in a running app. The unit tests that pass mock the boundaries (tRPC client, Prisma, composer) that these flows cross, so they do not prove any flow works across modules.

---

## Flow table

Priority is the highest finding on the flow. It includes P0/P1 findings owned by other audits; the owner's ID is given.

### Core product flows

| # | Flow | Files / functions | State changes | API / events | Success | Failure | Return / context | Issue | Runtime verified? | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Add element → select → edit → publish | `useBlockInsertion.ts:38-120` (transaction + `selection.select`) → Inspector → `useComposerInit.ts:489-716` autosave → `AquibraStudio.requestPublish:424` → `PublishConfirmModal` → `useExportHandlers.runPublish:82` → `exportPublishPages` → `usePublishJob.publish:180` → `sites.publish` → `publish.service.startPublish:185` → worker `api/workers/publish/[jobId]` | Composer tree; `Site`/`Page` rows via `saveProjectData`; `PublishBuildJob` (log = client HTML); `Site.status=PUBLISHING` | `project:changed` → `sites.saveProject` (+ `siteDetail.settings.update` mirror); `sites.publish`; 2 s `sites.publishStatus` poll | Toast "Published — site is live" with a View-live door (`useExportHandlers.ts:148`) | Approval block → `PublishGateModal`; Vercel errors get tailored toasts; other errors → "Try again" re-exports the canvas | Canvas and selection untouched | **A15-2:** publish ships the client canvas with no freshness check. **A15-1:** approval deadlock. A01-2/A12-1 (P0, owned there): the settings mirror in the same save reverts dashboard edits | Static + unit (165 pass) | **P1** (P0 via A01-2) |
| 2 | Layers → Inspector → AI → return | `LayersTab` → `useComposerSelection` → `ProInspector` → `UnifiedSelectionToolbar.tsx:72,305-318` → `AiPromptPopover.tsx:39-60` → `useStreamPrompt` (`ai.streamPrompt` SSE) → `applyAiEdit` (`applySetStyle.ts:625`, one transaction) | One undo step (`beginTransaction("ai-edit")`) | tRPC subscription `ai.streamPrompt` (intent `style-command`) | Popover closes; edit is one undo | Accept calls the async `applyAiEdit` without `await`, so a rejection escapes (A12-10) | Selection kept. The popover is **not keyed by element** (A15-10) | A15-10, A12-10 | Static | P3 |
| 3 | Pages → dynamic page → CMS records → edit → return | `CMSCollectionSetupModal.tsx:228-229,467` (pattern + template path) → `cmsSync.ts:170-182` → `cms.collections.upsert` → `CMSRecordsModal` → `cms.entries.upsert`; at publish `startPublish` → `cms.service.appendDynamicPagesToPublish:229` → `generateDynamicPages:187` | `CmsCollection.pageSlugPattern/pageTemplatePath`, `CmsEntry` | `cms.*`; queued retry on failure (`cmsSync.ts:185`) | One `slug/index.html` per PUBLISHED entry | Template path not in payload → `continue`, silently (`cms.service.ts:241`) | Records modal returns to Pages | **A15-7:** template-path format mismatch and two incompatible binding models | Static + unit (setup-modal test uses `blog/_t/index.html`) | P2 |
| 4 | Media Quick → Full Media → asset edit → return | `MediaTab` → `FullPageRouter.tsx:20` → `LibraryManager` / `MediaLibraryPanel`; `MediaCommandLayer.getUsages/replace` (`engine/media/MediaCommandLayer.ts:346-410`) → `media.*` | `MediaAsset`, versions; element `src` rewritten on replace | `media.*`, REST `api/asset-upload` | Usage-aware replace | — | **A04-1 (P0, owned there):** Delete/Backspace in the full-screen library deletes the hidden canvas selection | A04-1, A01-3 (media is user-scoped) | Static | **P0 (A04-1)** |
| 5 | Component → manage master → insert instance | `ComponentsTab` → `ComponentManager` (`engine/components/ComponentManager.ts:101` rehydrates instances on `PROJECT_LOADED`) → `componentSync` → `siteComponents.*` | IndexedDB component store plus server `SiteComponent`; instance data on elements | `siteComponents.upsert/list` | Instances rebuilt after load | Hydrate conflicts: local always wins, silently (A12-9) | — | A12-9 | Static, PARTIAL trace | P2 (A12-9) |
| 6 | Brand → advanced → import/export | `DesignSystemTab` → `ImportCard.tsx:214-238` (parse → diff → strategy → apply → toast) / `ExportSection.tsx` (Figma row is "Coming soon") | Design tokens | none server-side on import; project save persists | Diff preview before apply | Parse errors shown inline | — | A01-1 (P0, owned there): the agency theme push overwrites `projectStyles`. A12-8: staged edits ignored by exit guards | Static, PARTIAL | P0 via A01-1 (theme push only) |
| 7 | Review → comment → resolve | `CommentLayer` → `ReviewService` → `comments.create/list` (ungated, `comments.ts:34-49`) → `ReviewTab` → `reviews.currentRound/submit/resolve` (`reviews.ts:58-146`, `requireAgencyLayer`) → external `/review/[token]` → `clientReview.*` | `Comment`, `ReviewRequest`, `Reviewer` | `comments.*`, `reviews.*` | Round approved → publish gate opens | Flag off → dead end (A07-7) | Review tab | **A15-1** (publish deadlock), A07-7 | Static + unit | **P1** |
| 8 | Issues → fix | `IssuesPanel` (`AquibraStudio.tsx:618`) ← DS lint only (`AquibraStudio.tsx:~310-328`) | — | local | Auto-fix for lint rows | — | Rows only close the panel (A08-9) | A08-8/9 | Static | P2 (owned by A08) |
| 9 | History → restore | `HistoryTab` → `VersionHistoryPanel.handleRestoreConfirm:207` → `useVersionHistory.restoreVersion:100` → `VersionTimelineManager.restoreVersion:276` (safety version first, then `importProject`) → autosave listens to `version:restored` (`useComposerInit.ts:703-706`) | IndexedDB version plus server `SiteVersion` mirror (`useVersionSync`); project overwritten and autosaved | `version:*` events; `siteVersions.create`; `sites.saveProject` | "Restored to <time>" | **A `false` return (safety save failed / version missing) still toasts success** (A15-6) | Undo state re-read on `version:restored` | A15-6 | Static + unit (the false branch is untested) | P2 |
| 10 | Publish → checks → success/failure | Editor: `PublishTab` → `PublishWizard` → `sites.prePublishChecks` → flow 1. Dashboard: `D/app/dashboard/sites/[id]/publish/page.tsx:43` `publishMutation.mutate({ siteId })` with **no pages**. Worker `route.ts:101-104` | `PublishBuildJob` | `sites.publish`; SSE `api/sse/publish` (dashboard); 2 s poll (editor) | Editor path: toast plus `SITE_PUBLISHED` bus event | Dashboard path fails every time in prod: "No page content to deploy" (A15-5). Scheduled path the same (A15-4) | Dashboard "Try again" → back to checks | A15-1, A15-2, A15-4, A15-5, A12-3 | Static + unit | **P1** |
| 11 | Settings → save → editor | Editor `SettingsTab` screens → `siteDetail.*`; dashboard `sites/[id]/*` → `siteDetail.settings.update`; editor load `mergeSiteColumnsIntoSettings` (`BuildrikSyncProvider.ts:236`); editor autosave `extractSiteColumnPatch:190` → `siteDetail.settings.update` with no version check (`:416-421`) | `Site` columns | `siteDetail.settings.update` on **every** autosave | — | Dashboard edits reverted by an open editor tab | Editor does not refresh after a dashboard save | **A01-2 / A12-1 (P0, owned there)**, A12-2 | Static | **P0 (A01-2)** |
| 12 | Templates → preview → create/replace | `TemplatesTab.tsx:173-196` (ADMIN gate, premium gate, replace confirm with an optional "(backup)" page) → `TemplatePreviewModal` / `TemplateApplyModal` → `useTemplateApply` | Page tree | local; persisted by autosave | Success modal | Retry | Returns to drawer | — | Static, PARTIAL (undo of apply not traced) | P3 |
| 13 | Commands → destination → return | ⌘K `shell/modals/CommandPalette.tsx:46-63` (nav rows generated from `GROUPED_TABS_CONFIG`) → `UI_PANEL_OPEN` → `useEditorEventListeners.ts:157`; ⌘⇧P `canvas/controls/CommandPalette` | Panel state | bus | Destination opens | Pages ⌘K collision (A05-1) | Palette closes | A15-12 (tests red), A05-1, A03-2 | **Unit: 3 FAIL** (drift) | P3 |

### Collaboration flows

| # | Flow | Files / functions | State changes | API / events | Success | Failure | Return / context | Issue | Runtime verified? | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 14 | Invite → accept → open site | `team.invite` → email → `D/app/auth/invite/page.tsx:78` → `auth.acceptInvite` (`S/trpc/routers/auth.ts:261-339`; email-bound, with `SitePermission` rows carrying `roleOverride = invite.role`) → "Go to dashboard" `router.push("/dashboard")` (`invite/page.tsx:144`) → `sites.list` (session workspace) → `/edit/[siteId]` (`userCanEditSite`) | `WorkspaceMember`, `SitePermission`, `Invite.status` | notification `MEMBER_JOINED`; activity | Invitee is a member | Mismatch, expired and conflict each have their own screen | **Session workspace is not switched to the joined workspace** (A15-8) | A15-8, **A15-3** (list ignores site scope), **A07-1 (P0)** | Static | **P0 (A07-1)** |
| 15 | Two users, same page | Prod (collab flag off): two editors, each autosaving the whole project with `expectedLastEditedAt` (`BuildrikSyncProvider.ts:411-416`) | Whole-project overwrite | `sites.saveProject` → `SAVE_CONFLICT` → `ConflictModal` | — | The second saver gets a conflict. No presence in prod | — | A07-6 (non-atomic check; a snapshot save can delete pages), A07 series | Static | P1 (A07-6) |
| 16 | A edits while B present | Flag on: `SSETransport` POST `/api/collab/:siteId/ops` + EventSource poll 1.5 s. Flag off: as in 15 | `CollabOperation` | ops, `resync` (unhandled) | — | Ops dropped on POST failure | — | Owned by Agent D (A07-2..5) | Static | Flag-off |
| 17 | Simultaneous edits, same element | `OTEngine` path transforms; in prod, save conflict | — | — | — | Non-convergence (A07-5) | — | Agent D | Static | Flag-off |
| 18 | Comment → mention → reply → resolve | `Comment` model (`prisma/schema.prisma:474-499`) has **no parent/thread field**; no mention parser; `comments.resolve` needs EDITOR | `Comment.status` | `comments.*` | Resolve only | "Mentions" filter maps to security/payment types (A08-11) | — | Mention and reply steps do not exist (PRODUCT DECISION) | Static | P2 (product decision) |
| 19 | Permission changed while online | `RoleService.fetchMyRole` caches once per page (`RoleService.ts:23-36`); the server re-checks every save (`sites.ts:273`) | — | Autosave → FORBIDDEN → toast (`useComposerInit.ts:627-634`) | Server enforcement holds | Editor stays editable. Each edit → refused save → toast; edits kept nowhere (A15-9) | — | A15-9, **A07-1 (P0):** a demoted site-scoped member keeps EDITOR | Static | **P0 (A07-1)** |
| 20 | Collaborator removed while connected | `resolveWorkspaceId` re-checks ACTIVE membership per request (`workspace-ctx.ts:52-71`); `checkSiteRole` on save and publish; collab SSE checks once (Agent D) | — | as in 19 | Saves refused | As in 19; the collab stream keeps delivering (flag-off, Agent D) | — | A15-9 | Static | P2 |
| 21 | Connection lost → offline change → reconnect | Autosave network branch → `keepUnsaved` (`useComposerInit.ts:585-603`); `online` listener only flips the flag (`AquibraStudio.tsx:333-339`); reload offers "Restore my edits" (`useComposerInit.ts:229-256`) | localStorage recovery copy | — | Recovery on reload | **No save is re-attempted on `online`** (A15-11) | Chip stays in error until the next edit or ⌘S | A15-11 | Static + unit (`useComposerInit.offline` passes) | P3 |
| 22 | Publish while another user edits | `startPublish` accepts client HTML with no baseline/`lastEditedAt` check (`packages/shared/schemas/publish.ts:37-45`); the editor Publish button is not gated on `saveStatus === "conflict"` (`StudioHeader.tsx:630-635`) | Live site replaced | `sites.publish` | Deploys the publisher's canvas | **A stale or conflicted tab publishes over newer saved content** | — | **A15-2** | Static | **P1** |
| 23 | Undo after remote edit | `HistoryManager.recordChange` → `OTEngine` when connected | — | — | — | Undo reverts remote edits, no broadcast (A07-4) | — | Agent D | Static | Flag-off |
| 24 | Restore history while collaborators present | `restoreVersion` → `importProject` (not an OT op) → autosave of the whole project | — | `sites.saveProject` | — | Peers are not told. Their next autosave conflicts (prod) or diverges (flag on) | — | A07-6, A15-6 | Static | P1 (A07-6) |

---

## Findings

### P0 — IMMEDIATE FIX REQUIRED

**No new P0 was raised by this audit.** The traced flows cross four P0s that other audits own. They are cited, not re-raised: A01-2 / A12-1 (flow 11), A04-1 (flow 4), A07-1 (flows 14 and 19) and A01-1 (flow 6, theme push). I re-read the code for A01-2 (`BuildrikSyncProvider.ts:398-445`: the mirror call has no `expectedLastEditedAt`) and for A07-1's `SitePermission.roleOverride` origin (`auth.ts:308-316`). Both are consistent with the owners' reports.

### P1

#### A15-1 — With "Edits need approval" on and `agency_layer` off, only the OWNER can ever publish, and the editor says approval is not required
- **Finding:** The workspace setting and the flag that gates the only way to satisfy it are independent. Following the chain:
  - Settings › Workspace shows the toggle "Edits need approval before publishing" with no dependency on the agency flag (`D/components/settings/workspace-form.tsx:315-341`).
  - `startPublish` then requires an APPROVED, non-revoked `ReviewRequest` for everyone except OWNER (`S/services/publish.service.ts:248-299`; `APPROVAL_EXEMPT_ROLES = {"OWNER"}`, `publish-approval.ts:35`).
  - The only producer of a `ReviewRequest` is `reviews.submit`, which hard-fails `requireAgencyLayer` (`S/trpc/routers/reviews.ts:61-62`). The same is true of `reviews.resolve` (`:137`).
  - `agency_layer` defaults off (inventory §3).
  - So every ADMIN, EDITOR and DESIGNER gets `APPROVAL_NONE`, and the editor's `PublishGateModal` "no-review" door leads to Send-for-review, which fails with FORBIDDEN.
  - Meanwhile `reviews.status` returns `editsRequireApproval: false` whenever the flag is off (`reviews.ts:111-123`), so the editor's next-move chip tells the user publishing needs no approval right up to the refusal.
- **Secondary defect, same root:** `reviews.submit/status/resolve` evaluate the flag on the caller's **session** workspace (`resolveWorkspaceId`). The publish gate uses the **site's** workspace (`publish.service.ts:260`). For a member whose session resolves to another workspace, the two disagree. This is the same class of bug the publish gate itself fixed (comment at `publish.service.ts:249-259`).
- **Severity:** P1. It is a release-blocking dead end in the core publish flow for any workspace that turns on the toggle, which is offered to every workspace. It is not a security hole: it fails closed.
- **File:** `S/trpc/routers/reviews.ts:58-146`; `S/services/publish.service.ts:248-299`; `D/components/settings/workspace-form.tsx:315-341`
- **Symbol:** `reviewsRouter.submit`, `reviewsRouter.status`, `startPublish`, `publishApprovalBlock`
- **Evidence:** as above. `publish.service.approval.test.ts` passes. It exercises the gate with a review present and never with the flag off.
- **Expected behavior:** Approval-required should be offered only where reviews exist, or should work without the agency layer. `reviews.status` should report the real `editsRequireApproval`. The flag should be read from the site's workspace.
- **Root cause:** The approval policy (workspace column) and the review feature (workspace flag) were built as separate switches, with nothing enforcing the dependency. Feature gates are read from the session workspace instead of the target's.
- **Affected modules:** Publish (editor and dashboard), Review, Workspace settings, `PublishGateModal`.
- **Recommendation:** PRODUCT DECISION: either tie the toggle to `agency_layer` (disable or hide it, and ignore it server-side when the flag is off) or ungate `reviews.submit/resolve`. In either case, resolve the flag from `site.workspaceId`.
- **Status:** VERIFIED statically. NOT RUNTIME VERIFIED.

#### A15-2 — Publish deploys whatever HTML the calling tab holds, with no freshness check, so a stale or conflicted tab can publish over newer saved content
- **Finding:** Publishing does not tie the deployed HTML to anything stored on the server:
  - `runPublish` exports the in-memory canvas (`useExportHandlers.ts:95`) and sends it as `pages`.
  - `publishInputSchema` has no `expectedLastEditedAt` or version token (`packages/shared/schemas/publish.ts:37-45`).
  - `startPublish` stores the client HTML as the deploy payload (`publish.service.ts:333-339`) without comparing it to the stored site.
  - The editor keeps Publish enabled while its own save is in `conflict` state: `publish` depends only on `publishOutcome` and `nextMove.blockedReason` (`StudioHeader.tsx:630-635`), and `requestPublish` opens the confirm unconditionally (`AquibraStudio.tsx:424-430`).
- **Consequences:**
  - A second editor, or a stale second tab, whose autosave was refused with `SAVE_CONFLICT` can still publish its older canvas. The live site then silently loses the other editor's saved changes.
  - The approval gate compares the review against `Site.lastEditedAt` (server-saved state, `publish.service.ts:284-290`), but the payload is client state. Edits not yet saved (the 1 s debounce, a refused save) ship under an approval that never saw them. Separately, any EDITOR can already bypass a stale approval with `acknowledgeStale` by design.
- **Severity:** P1. The live site regresses, but no stored data is lost (the DB keeps the newer save, and rollback exists), so this is not P0.
- **File:** `E/editor/shell/hooks/useExportHandlers.ts:82-119`; `packages/shared/schemas/publish.ts:37-45`; `S/services/publish.service.ts:185-339`; `E/editor/shell/StudioHeader.tsx:630-635`
- **Symbol:** `runPublish`, `publishInputSchema`, `startPublish`
- **Evidence:** code as cited. No test covers publish after a save conflict.
- **Expected behavior:** Publish either flushes and confirms the save first, or sends the tab's `lastEditedAt` baseline and the server refuses a publish from a copy behind the stored site (the same `SAVE_CONFLICT` contract that `saveProject` uses). Publish is disabled while the save state is `conflict`.
- **Root cause:** Publish and persistence are two independent pipelines. The save path got optimistic concurrency (`61-conflict`); the publish path never did.
- **Affected modules:** Publish, Autosave, Review/approval, multi-user editing (flows 1, 10, 15, 22).
- **Recommendation:** Add `expectedLastEditedAt` to `publishInputSchema` and check it in `startPublish`. Gate the editor CTA on save status. Consider publishing from server-stored pages rendered server-side, which would also fix A15-4 and A15-5.
- **Status:** VERIFIED statically. NOT RUNTIME VERIFIED.

#### A15-3 — `sites.list` ignores per-site scoping, so a site-scoped member sees every site in the workspace
- **Finding:**
  - `sites.list` calls `listSites(workspaceId, input)` (`S/trpc/routers/sites.ts:60-65`). The query filters on `workspaceId` and `deletedAt` only (`S/services/sites.service.ts:54-57`) and returns name, slug, status, `publishedUrl`, thumbnail, primary domain, client, creator and 30-day visitors (`:83-107`).
  - `resolveSiteScope` (`permission.service.ts:46-60`) is applied per site by `assertSiteAccess/checkSiteRole`, but not to the list.
  - A member invited to "Specific sites" (flow 14: `auth.ts:308-316`) therefore sees every workspace site, including analytics, and gets FORBIDDEN on opening one outside their grant.
- **Severity:** P1. It leaks metadata across a boundary the admin configured, within the same workspace. Routed to Agent F for final severity, since a scope bypass could be graded P0 there.
- **File:** `S/services/sites.service.ts:47-107`; `S/trpc/routers/sites.ts:60-65`
- **Symbol:** `listSites`, `resolveSiteScope`
- **Evidence:** No `sitePermission` or `resolveSiteScope` reference in `sites.service.ts` or `routers/sites.ts` apart from the transfer upsert (`sites.service.ts:273`).
- **Expected behavior:** For a scoped member (a non-ADMIN/OWNER member with ≥1 `SitePermission`), the list is restricted to the granted site ids. The same applies to the dashboard aggregates (`dashboard.recentSites`, stats), which I did not check.
- **Root cause:** Scoping was added at the single-site guard (the comment at `permission.service.ts:38-44` says it was previously unenforced) and was never carried to collection reads.
- **Affected modules:** Dashboard sites list, dashboard ⌘K site search (`sites.list{search}`), the invite → open-site flow.
- **Recommendation:** Add scope filtering to `listSites` (and to other workspace-wide site reads) and test it with a scoped member.
- **Status:** VERIFIED statically. NOT RUNTIME VERIFIED. Other list endpoints NOT VERIFIED.

### P2

#### A15-4 — A scheduled publish can never deploy: the sweep publishes with no pages, and the worker refuses a pageless job
- **Finding:**
  - The cron sweep calls `startPublish(s.siteId, s.workspaceId, s.createdBy)` with no pages, on purpose (`D/app/api/cron/scheduled-publish/route.ts:32-37`).
  - The worker throws "No page content to deploy. Open the site in the editor and publish from there." whenever the payload is empty and simulation is off (`D/app/api/workers/publish/[jobId]/route.ts:101-104`).
  - `markScheduleStarted` has already run by then, so the schedule reads as started while the job fails asynchronously.
  - There is also no UI: `sites.schedulePublish/getScheduledPublish/cancelScheduledPublish` are allowlisted orphans (`check-trpc-orphans.mjs:84-89`).
  - And on cPanel the cron is not in the documented list (`docs/cpanel-deploy.md:182-192` lists 2 of the 18 `vercel.json` crons).
- **Severity:** P2. The defect is latent because nothing can create a schedule today. It becomes P1 the moment the UI ships.
- **File:** `D/app/api/cron/scheduled-publish/route.ts:36`; `D/app/api/workers/publish/[jobId]/route.ts:101-104`
- **Symbol:** scheduled-publish `GET`, publish worker `POST`
- **Evidence:** as cited. `scheduled-publish.service.test.ts` passes (it tests the schedule store only). No test runs sweep → worker.
- **Expected behavior:** A scheduled publish renders pages server-side from stored `Page` rows at fire time, or is refused at schedule time until that exists.
- **Root cause:** Page HTML is produced only in the editor's browser (`ExportEngine`). Every server-initiated publish (scheduled or dashboard) has no renderer.
- **Affected modules:** Publish, cron, scheduled publish.
- **Recommendation:** Hold the scheduled-publish UI until there is a server-side renderer, and record the constraint next to the allowlist entry.
- **Status:** VERIFIED statically.

#### A15-5 — The dashboard publish page passes its checks, then fails every time in production
- **Finding:**
  - `D/app/dashboard/sites/[id]/publish/page.tsx:42-44` sends `publishMutation.mutate({ siteId })` with no pages, so the worker refuses it (see A15-4) after the user has seen a green checklist and a progress screen.
  - The page is not linked from the site tab nav (`D/components/site-detail/tab-nav.tsx:8-15` has no publish tab), so it is URL-only. It is still a shipped route, reachable from history, bookmarks or help links (`contextual-help.tsx:46` names it).
- **Severity:** P2. It is a dead end, but hard to reach.
- **File:** `D/app/dashboard/sites/[id]/publish/page.tsx:30-44`
- **Symbol:** `PublishPage.handlePublish`
- **Evidence:** as cited. The worker's own comment (`route.ts:94-100`) describes this exact shape.
- **Expected behavior:** Remove the route, redirect it to `/edit/[id]` with the publish panel open, or give it a server renderer.
- **Root cause:** Same as A15-4.
- **Affected modules:** Dashboard publish, publish worker.
- **Recommendation:** Redirect to the editor publish panel, and delete the orphaned `components/publish/*` UI if it becomes unused.
- **Status:** VERIFIED statically. NOT RUNTIME VERIFIED.

#### A15-6 — A version restore that did not happen is reported as "Restored to …"
- **Finding:**
  - `VersionTimelineManager.restoreVersion` returns `false`, without throwing, when the version is not found or the safety "Before restoring …" version cannot be written (`E/engine/VersionTimelineManager.ts:276-297`, `return false` at `:278` and `:296`).
  - `useVersionHistory.restoreVersion` discards the boolean (`E/shared/hooks/useVersionHistory.ts:100-104`).
  - `VersionHistoryPanel.handleRestoreConfirm` then shows the success toast "Restored to <time>" (`E/editor/panels/VersionHistoryPanel.tsx:207-219`).
  - In the safety-save failure case, the `VERSION_LOAD_FAILED` it emits also flips the panel into its load-error state. The user sees a success toast over an error panel, and the canvas is unchanged.
- **Severity:** P2. Wrong feedback on a data-recovery action. No data is lost: the restore was aborted precisely to avoid loss.
- **File:** as cited
- **Symbol:** `restoreVersion` (×2), `handleRestoreConfirm`
- **Evidence:** `VersionHistoryPanel.branches.test.tsx:251-270` covers rejection and success (a mock resolving `undefined`) but never a `false` result. The 67 tests pass.
- **Expected behavior:** A `false` result gives an error toast naming the reason (IndexedDB unavailable or full, or the version is gone).
- **Root cause:** A boolean-return API consumed as if it threw.
- **Affected modules:** History, versions, autosave (no autosave fires, which is correct).
- **Recommendation:** Propagate the boolean, or throw typed errors, and add the missing branch test.
- **Status:** VERIFIED statically.

#### A15-7 — CMS dynamic pages: the template-path hint names a file the exporter never produces, and a miss is silent; the canvas binding model does not reach generated pages
- **Finding:**
  - **Path mismatch:**
    - The setup modal asks for a free-text "Template page path — blog/_template/index.html" (`E/editor/shell/modals/CMSCollectionSetupModal.tsx:467`).
    - The publish payload names pages `index.html` for home and `<slug>.html` otherwise (`E/engine/export/ExportEngine.ts:839-848`), so a slug `blog/_template` exports as `blog/_template.html`.
    - `appendDynamicPagesToPublish` does an exact `pages.find(p => p.path === col.pageTemplatePath)` and `continue`s on a miss (`S/services/cms.service.ts:240-241`). No page is generated and no error is raised; the publish reports success.
  - **Binding mismatch:**
    - The canvas previews CMS through element→field `cmsBindings` (`useCMSPreview.ts:57-63`).
    - Export resolves those in `"static"` mode, baking one value into the template HTML (`ExportEngine.ts:746-766`).
    - The server then varies generated pages only by literal `{field}` text substitution across the **whole document**, including `<script>` and `<style>` (`cms.service.ts:208-211`).
    - So a bound element shows the same value on every generated page, while a literal `{x}` inside custom code (for example `if(a){b}`) is blanked.
    - A second `<title>` is also injected alongside the page's own (`:212-215`).
- **Severity:** P2. A feature that silently produces nothing, or wrong pages, with no error. NOT RUNTIME VERIFIED against a real deploy.
- **File:** as cited
- **Symbol:** `appendDynamicPagesToPublish`, `generateDynamicPages`, `ExportEngine.buildPageHrefs`
- **Evidence:** as cited. The setup-modal unit test stores `pageTemplatePath: "blog/_t/index.html"` (`CMSCollectionSetupModal.dynamicPages.test.tsx:57`), a path that the exporter cannot emit. No test runs export → publish expansion.
- **Expected behavior:** The template is chosen from the site's pages (by id), not typed. A missing template fails the publish or pre-publish check. Generated pages resolve the same bindings the canvas shows, and substitution is limited to text nodes and attributes.
- **Root cause:** The server-side generator was built against an assumed path scheme and a placeholder syntax, not against the editor's export contract.
- **Affected modules:** CMS, Pages, Publish, Export.
- **Recommendation:** Store `pageTemplatePageId`, map it to the exported file name at publish time, and add a pre-publish check. Unify the binding models.
- **Status:** PARTIAL: static trace; not deployed.

#### A15-8 — Accepting an invite does not switch the session to the joined workspace
- **Finding:**
  - After `auth.acceptInvite` succeeds, the page offers "Go to dashboard" → `router.push("/dashboard")` (`D/app/auth/invite/page.tsx:79,144`).
  - The JWT's `workspaceId` changes only on sign-in or on `update({ workspaceId })` (`S/auth.config.ts:139-161`), and `acceptInvite` returns `workspaceId` without the client using it.
  - An invitee who already had an account (so a personal workspace) lands in their old workspace. `sites.list` is session-scoped (`sites.ts:60-65`), so the sites they were invited to are not listed until they find the workspace switcher.
  - `/auth/redirect`, which the auth config says sends multi-workspace users to the chooser, is bypassed.
- **Severity:** P2. Friction on the first step of every collaboration. It is not a dead end: the switcher exists at `D/components/dashboard/shell/workspace-switcher.tsx:39`.
- **File:** `D/app/auth/invite/page.tsx:78-80,144`
- **Symbol:** `acceptMutation.onSuccess`
- **Evidence:** static.
- **Expected behavior:** On success, call `update({ workspaceId: data.workspaceId })` before navigating. For a site-scoped invite, land on the granted site.
- **Root cause:** Workspace context lives in the JWT, and this flow never refreshes it.
- **Affected modules:** Invitations, dashboard shell, sites list.
- **Recommendation:** As above. The same check applies to `auth/join-workspace/page.tsx:39`, which I did not trace.
- **Status:** PARTIAL. Static; the join-workspace variant is NOT VERIFIED.

#### A15-13 — None of the 24 flows has an end-to-end test
- **Finding:** The cross-module seams in these flows have no test that crosses them:
  - editor → tRPC → service → worker (publish)
  - review → approval gate → publish
  - invite → session → list → editor
  - restore → autosave → server
  - two clients against the same site

  The Playwright suites are boot, exit-guard, style/target-size parity, visual pins, dashboard smoke, onboarding and settings drill-in (listed in Method). Collab has no multi-client test (inventory §7). The unit tests for these areas pass (232 tests in the files I ran), and each one mocks the neighbouring module.
- **Severity:** P2 (test gap). CLAUDE.md's own rule ("Live app is the verifier… three suites went green over a broken feature") applies directly to A15-1, A15-2, A15-4 and A15-5, which all pass their unit suites today.
- **File:** `packages/editor/e2e/*`, `packages/dashboard/e2e/*`
- **Recommendation:** Add a DB-backed integration test for `sites.publish` → worker with an empty and a non-empty payload, and for approval ON with the agency flag OFF. Add one two-context Playwright test for save conflict → publish. → Agent G, Prompt 20.
- **Status:** VERIFIED (file listing).

### P3

#### A15-9 — A role demoted or removed mid-session leaves the editor fully editable, and every refused save is kept nowhere
- **Finding:**
  - The role is fetched once per page and cached (`E/services/RoleService.ts:23-36`).
  - After a demotion to VIEWER, or removal, each edit schedules an autosave. The server refuses it (`sites.ts:273`), and the autosave FORBIDDEN branch shows a toast and returns (`useComposerInit.ts:627-634`) without `keepUnsaved`, unlike the network branch at `:590`.
  - The editor does not switch to read-only. On reload, "Saved · just now" is seeded over the lost edits.
- **Severity:** P3. The server enforces correctly; only the UX and the local work are affected, and the user is told they lack access.
- **Recommendation:** On FORBIDDEN, invalidate the role cache, re-read `sites.myRole`, and switch the chrome to viewer mode. Optionally keep the recovery copy.
- **Status:** VERIFIED statically.

#### A15-10 — The inline AI popover survives a selection change
- **Finding:**
  - `UnifiedSelectionToolbar` is mounted once for "exactly one selected" (`CanvasOverlayGroup.tsx:294-297`) and is not keyed by `elementId`. `aiOpen` (`UnifiedSelectionToolbar.tsx:72`) and the popover's stream state therefore persist when the user picks another layer.
  - A diff streamed for element A is then shown under element B.
  - Accept applies to A, because the ops carry the scope id from submit time (`AiPromptPopover.tsx:39-60`).
- **Severity:** P3 (a confusing target; the edit is undoable).
- **Recommendation:** Key the toolbar or popover by `elementId`, or close the popover on selection change.
- **Status:** PARTIAL (static; the server op-id behaviour was inferred from the `scope` payload).

#### A15-11 — Reconnecting does not retry the failed autosave
- **Finding:** The `online` listener only clears `isOffline` (`AquibraStudio.tsx:333-339`). Autosave re-runs only on the next `project:changed`, undo, redo or restore (`useComposerInit.ts:703-706`). After reconnecting, the chip leaves "Offline" and shows the error state until the user edits again or presses ⌘S, although the edits are recoverable (`keepUnsaved`).
- **Severity:** P3.
- **Recommendation:** On `online`, if dirty, schedule the save.
- **Status:** VERIFIED statically. The `useComposerInit.offline` tests pass and do not cover reconnect.

#### A15-12 — Four red unit tests on flows 1 and 13 are drift from the Insert→Add relabel
- **Finding:** I ran the tests: `CommandPalette.test.tsx` fails ×3 and `CanvasEmptyCTA.test.tsx` ×1.
  - The palette derives its nav rows from `GROUPED_TABS_CONFIG` (`shell/modals/CommandPalette.tsx:49-62`).
  - The `add` tab is now labelled "Add", so the row reads "Open Add panel"; the test expects "Open Insert panel" (`CommandPalette.test.tsx:154`). The count is 23 against the hard-coded 21 (`:76,146`).
  - The product behaviour (nav row → `UI_PANEL_OPEN{panel:"add"}`) is intact in code.
- **Severity:** P3 (a red suite masks real regressions on the Commands flow).
- **Recommendation:** Update the assertions to the v3 IA labels and derive the count from config.
- **Status:** VERIFIED (test run).

---

## Good as-is

These were checked in code, not only in comments:
- **Publish approval uses the site's workspace:**
  - The gate reads `site.workspaceId`, not the session workspace (`publish.service.ts:260`).
  - Revoked review rounds are excluded (`:279-283`).
- **Publish concurrency and failure handling:**
  - One active job per site is enforced by a DB partial unique index, with P2002 mapped to `ALREADY_PUBLISHING` (`:334-347`).
  - Stranded jobs are cleaned up (`:221-233`).
  - A dispatch failure restores the site status (`:370-386`).
- **Publish does not leak the page HTML:** `getPublishStatus` never returns the `log` HTML (`:392-410`).
- **Pre-job publish failures are visible:** these, including approval blocks, reach the UI as a failed or blocked state rather than silence (`usePublishJob.ts:204-213,299-311`). The editor's failure toast offers a retry that re-exports the current canvas (`useExportHandlers.ts:178-186`).
- **Restore saves the current work first:** a "Before restoring …" version is written, and the restore is aborted if that write fails (`VersionTimelineManager.ts:280-297`). The restore is then autosaved (`useComposerInit.ts:703-706`). Only the feedback is wrong (A15-6).
- **Autosave is careful about failures:**
  - It distinguishes conflict, offline/network, auth, forbidden and not-loaded, and ignores out-of-order completions (`changeSeq`).
  - Offline edits survive a reload with an explicit restore choice, never applied automatically (`useComposerInit.ts:229-256`).
- **Invites are bound to the invited email,** with audit logging on a mismatch (`auth.ts:294-302`). Workspace membership is re-validated per request (`workspace-ctx.ts:52-71`).
- **Template replace is guarded:** it is ADMIN-gated with a reason toast, confirms before replacing, and offers an optional numbered "(backup)" page (`TemplatesTab.tsx:163-196,640-660`).
- **Block insertion is one step:** a single transaction, smart placement, then select (`useBlockInsertion.ts:38-120`).
- **Brand import previews before applying:** it diffs and offers a strategy choice (`ImportCard.tsx:180-238`).

## Product decisions required

1. **Approval vs agency layer (A15-1).** Is "Edits need approval" an agency-layer feature, or do reviews work without the agency layer?
2. **Publish source of truth (A15-2, A15-4, A15-5).** Should publish ship the tab's canvas, or server-stored pages rendered server-side? This decides scheduled publish, dashboard publish and stale-tab safety together.
3. **Comments: replies and mentions (flow 18).** Should they exist? The `Comment` model has no thread field, and the "Mentions" filter is mislabelled (A08-11). This overlaps A07's comments decision.
4. **`acknowledgeStale` for EDITORs (A15-2 note).** Should a non-admin be able to override a stale approval, or only an ADMIN?

## Overlaps with other audits

- **Agent D (Prompt 16):** flows 15–17, 23 and 24 with the collab flag on (unhandled `resync`, ops dropped on POST failure, undo reverting remote ops, restore not broadcast). I did not re-audit them. Flow 24 in production turns into A07-6.
- **Agent F (Prompt 19):**
  - A15-3 (list scope) needs a severity call; check the `dashboard.*` site aggregates the same way.
  - The session-workspace flag check in `reviews.*` (A15-1, secondary).
  - A07-1 on flows 14 and 19.
- **Agent B / C:** A15-1's editor chip telling users approval is off (`reviews.status`); A15-6 and A15-11 feedback copy.
- **Agent E:**
  - Page HTML is rendered only in the browser. That root cause sits under A15-2, A15-4 and A15-5.
  - The `cpanel-deploy.md` cron list shows 2 of 18.
- **Agent G, Prompt 20:** A15-12 and A15-13; the untested `false` branch in A15-6.

---

## AUDIT HANDOFF

- **Agent / Prompt:** G, Verification & Test / Prompt 15: End-to-End Cross-Module Flows
- **Report:** `docs/audits/2026-09-25-full-audit/15-e2e-cross-module-flows.md`
- **Counts:** P0 = 0 new · P1 = 3 · P2 = 6 · P3 = 4
- **P0 (IMMEDIATE FIX REQUIRED):** none raised here. These P0s owned by other audits sit on traced flows and were re-read in code:
  - A01-2 / A12-1 on flow 11
  - A04-1 on flow 4
  - A07-1 on flows 14 and 19
  - A01-1 on flow 6
- **P1:**
  - A15-1: approval ON + `agency_layer` OFF → only the OWNER can publish, and the editor says approval is off.
  - A15-2: publish ships the tab's canvas with no freshness check, and Publish stays enabled during a save conflict.
  - A15-3: `sites.list` ignores site scope.
- **P2:**
  - A15-4: scheduled publish can never deploy.
  - A15-5: the dashboard publish page always fails.
  - A15-6: a failed restore toasts success.
  - A15-7: CMS dynamic pages: path and binding mismatch.
  - A15-8: an accepted invite does not switch workspace.
  - A15-13: no end-to-end tests for any flow.
- **P3:**
  - A15-9: stale role after a mid-session demotion.
  - A15-10: AI popover survives a selection change.
  - A15-11: no retry on reconnect.
  - A15-12: 4 drifted tests.
- **Runtime verified:**
  - Unit runs only: 13 files / 165 tests and 8 files / 67 tests passed.
  - 2 files / 4 tests failed; root cause is test drift (A15-12).
- **NOT RUNTIME VERIFIED:**
  - all 24 flows in a live app
  - the Vercel deploy of dynamic pages
  - two-client conflict → publish
  - invite → session in a browser
  - production cron scheduling on cPanel
  - dashboard site aggregates under site scope
  - the undo semantics of template apply
- **Dependencies:**
  - Settle product decision 2 (publish source of truth) before fixing A15-2, A15-4 and A15-5 together.
  - Settle decision 1 before A15-1.
  - A15-3 is independent and can be fixed first.
  - Fixing A07-1 does not change A15-3.
