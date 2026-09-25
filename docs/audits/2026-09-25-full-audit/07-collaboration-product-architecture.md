# 07 — Collaboration Product Architecture (Prompt 7)

**Agent:** D, Collaboration & Realtime.
**Scope:** Prompt 7 only. This covers what "collaboration" means in Buildrik and which module and UI owns each collaboration capability: presence, live editing, comments, review and approval, sharing, invitations, roles and permissions, activity, history, autosave, undo, publish, offline and reconnect, and conflicts. The collaboration *runtime* (Prompt 16) is covered only as far as it decides product ownership. Its failure modes are recorded here because the same code decides both.
**Mode:** read-only. No production code, tests or config were modified. This file is the only one written.

---

## Method & runtime status

**What I read** (file:line references are in the findings below):
- **Server:** `server/services/{collab,comment,review,client-review,permission,team,share-link,sites,activity-log,notification.trigger,publish,publish-approval}.service/ts`, `server/trpc/routers/{comments,reviews,client-review,team,sites,site-detail,site-version,auth,account}.ts`, `server/trpc/guards.ts`.
- **Collab routes:** `packages/dashboard/app/api/collab/[siteId]/ops/route.ts`, `packages/dashboard/app/api/sse/collab/[siteId]/route.ts`.
- **Editor:** `packages/editor/src/engine/collaboration/*`, `engine/HistoryManager.ts`, `engine/Composer.ts`, `services/{BuildrikSyncProvider,ReviewService}.ts`, `editor/shell/{StudioHeader,AquibraStudio,SendForReview}.tsx`, `editor/shell/hooks/{useComposerInit,useEditorShortcuts,useEditorRole}.ts`, `editor/canvas/{Canvas.tsx,comments/CommentLayer.tsx,hooks/useCursorSync.ts,hooks/useCollaboration.ts}`, `editor/sidebar/tabs/{review/ReviewTab,history/components/ActivityView}.tsx`, `editor/rail/tabsConfig.ts`.
- **Dashboard:** `settings/workspace`, `components/settings/workspace-form.tsx`, `sites/[id]/{access,feedback}`, `agency/(tabs)/{layout,reviews}`, `components/{reviews,comments,team}/*`, `app/edit/[siteId]/page.tsx`, `middleware.ts`.
- **Other:** `prisma/schema.prisma` (Comment, ReviewRequest, Reviewer, ShareLink, Invite, SitePermission, ActivityLog, CollabOperation, WorkspaceMember, WSSharingSettings, Notification), `scripts/check-baked-flags.mjs`.

**What I ran:**
- `pnpm vitest run __tests__/permission-service.test.ts __tests__/team-service.test.ts __tests__/collab-service.test.ts __tests__/client-review-service.test.ts server/services/__tests__/comment.service.test.ts packages/editor/src/engine/collaboration/__tests__ packages/editor/src/editor/collaboration/__tests__`
  - Result: **8 files, 75 tests, all passed.**
- None of those tests exercises:
  - a demoted member who still has a site override (A07-1),
  - replay from seq 0,
  - multi-client convergence,
  - `SSETransport`, which has no test file at all.

**NOT RUNTIME VERIFIED**
- No Postgres and no browser were available, so no finding here was observed in a running app. Every finding is **statically verified**: I read the code path end to end.
- The collaboration runtime is behind `NEXT_PUBLIC_FEATURE_COLLAB`, which is off in production according to `CLAUDE.md`. I cannot see the production environment, so "off in prod" is policy, not something I proved.
- `scripts/check-baked-flags.mjs:37-43` asserts only the flags that must be **on**. Nothing asserts that collab is off (A07-24).

**Inventory corrections**
- `00-inventory.md §7` says the unhandled `resync` makes the client loop, reconnecting with a stale `since`. In fact `EventSource` reconnects to the URL it was **built** with (`SSETransport.ts:42`), and on a first session that URL has `since=0`.
  - So auto-reconnect never reaches the resync branch (`hasResyncGap(0)` is false).
  - Instead it **replays the whole retained op log** each time (A07-2).
  - The resync loop only happens on a *second* `connect()` call (A07-10).
- `hello` is described as seeding the joiner's head. The client ignores the `hello` payload entirely (`SSETransport.ts:46`).

---

## What "collaboration" means in Buildrik (as built)

Buildrik has **two collaboration products**. Only one of them ships.

| Mode | What it is | Shipping? | Evidence |
|---|---|---|---|
| **Async / review collaboration** | Workspace members, per-site role overrides, invites, draft share links, canvas comment pins, client review rounds over a token link (approve or request changes), an approval gate on publish, email notifications, workspace activity log, per-site version history | **Yes** (review parts behind the `agency_layer` workspace flag) | `comments.ts`, `reviews.ts`, `client-review.ts`, `team.ts`, `site-detail.ts sharing.*`, `publish.service.ts:246-297` |
| **Live co-editing** | DB-backed op log (POST per op, SSE that polls every 1.5 s), JSON-Patch "OT", cursor and selection presence, soft locks | **No.** Build-time flag, demo only | `runtimeEnv.ts:95-99`, `StudioHeader.tsx:225,771-777,848`, `useCanvasCommandPalette.ts:326` |

In production, then, "collaboration" means **take turns on a site and hand it to a client for sign-off**.

The only thing that coordinates two people editing the same site at once is **optimistic concurrency on the whole-project save**: `SAVE_CONFLICT` opens `ConflictModal`, which offers "back up and reload" or "overwrite". Users get no presence and no warning that someone else is editing (A07-14). That concurrency check has a race of its own (A07-6).

### Live vs async classification

| Capability | Live (realtime) | Async | Production-reachable |
|---|---|---|---|
| Co-editing (ops) | ✔ | — | ✘ (flag) |
| Presence: avatars, cursors | ✔ | — | ✘ (flag) |
| Selection presence, "is editing", soft locks | ✔ (broadcast only, **no consumer**) | — | ✘ |
| Canvas comments | — | ✔ | ✔ (list and resolve need `agency_layer`, A07-7) |
| Client review and approval | — | ✔ | ✔ (`agency_layer`) |
| Draft share links | — | ✔ | ✔ |
| Invites, roles, site scope | — | ✔ | ✔ |
| Activity log | — | ✔ | ✔ (incomplete, A07-16) |
| Version history | — | ✔ (IndexedDB plus `SiteVersion`) | ✔ |
| Undo/redo | local only | — | ✔ (single user) |
| Autosave | — | ✔ (whole-project, optimistic concurrency) | ✔ |
| Notifications | SSE (dashboard) and polling (editor) | ✔ | ✔ (no collaboration events, A07-16) |
| Mentions | — | — | **Not implemented** (A07-18) |

---

## COLLABORATION OWNERSHIP MAP

| Capability | Scope | Owner (module) | Primary Entry | Secondary Entry | State Source | Backend Source | Permission Boundary |
|---|---|---|---|---|---|---|---|
| Live co-editing | Site (room = siteId) | engine `collaboration/` (`CollaborationManager`, `OTEngine`, `SSETransport`) | StudioHeader site menu "Start collaboration" (`StudioHeader.tsx:542-553,848`) | ⌘⇧P `start-collab` (`useCanvasCommandPalette.ts:187-195,326`) | In-memory room/users; `HistoryManager` patches → `OTEngine.pendingOps` | `POST /api/collab/:siteId/ops` → `appendCollabOp` → `CollabOperation`; `GET /api/sse/collab/:siteId` polls `getCollabOpsSince` | Build flag `FEATURE_COLLAB`; `checkSiteRole(EDITOR)` per POST, **once** per SSE connect |
| Presence (avatars) | Site | editor `collaboration/PresenceIndicators.tsx` + `canvas/hooks/useCollaboration.ts` | Header presence cluster (`StudioHeader.tsx:771-777`) | — | `CollaborationManager.room.users` (grows from `join` events only) | Same op log (`join`/`leave` events) | Flag; no server identity (the client picks the id and name) |
| Cursor presence | Site | `useCursorSync.ts` → `RemoteCursorsOverlay` (`CanvasOverlayGroup.tsx:390`) | Canvas mousemove (`Canvas.tsx:444`) | — | `room.users[].cursor` | Op log, **one DB row per cursor move** (50 ms throttle) | Flag |
| Selection / editing / locks | Site | `CollaborationManager` (`updateSelection`, `notifyEditing`, `acquireLock`) | Composer selection events (`Composer.ts:354-376`) | — | `editingStates`, `elementLocks` | Op log | Flag; **no UI consumer** (A07-12) |
| Comments (pins) | Site (optionally page and element anchored) | editor `canvas/comments/CommentLayer.tsx` via `ReviewService` | Header comment toggle and `C` (`StudioHeader.tsx:708`, `useEditorShortcuts.ts:106`) | Review tab thread; dashboard `CommentQueue` (agency route) | Server fetch per mode entry | `comments.create/list/reattach/resolve` → `comment.service` → `Comment` | create/list: any site member incl. VIEWER (`assertSiteAccess`); resolve/reattach: EDITOR; workspaceList: ADMIN. **Not** `agency_layer`-gated |
| Review / approval (internal) | Site round, workspace gate | dashboard `components/reviews/*` + editor `ReviewTab` | Dashboard site header "Send for review" (`site-header.tsx:28-31,181`), no email or snapshot | Editor Review tab `SendForReview` (with snapshot and client email) | `ReviewRequest` (one PENDING per site) | `reviews.submit/resolve/revoke/...` → `review.service` | submit: EDITOR + `agency_layer`; resolve: workspace ADMIN, not the submitter |
| Review / approval (client) | Site round via token | dashboard `app/review/[token]` | Emailed `/review/<token>` link | Link copied from `ReviewSentModal` | `ReviewRequest.token/invitedEmail/reviewerId`, `Reviewer` | `clientReview.*` (public, rate-limited) → `client-review.service` | Token + identity must match `invitedEmail`; **not** `agency_layer`-gated (deliberate) |
| Approval gate on publish | Site, workspace setting | `publish.service.startPublish` + `publish-approval.ts` | Editor Publish → `PublishGateModal` | Dashboard `sites/[id]/publish` | `Workspace.editsRequireApproval`, latest non-revoked `ReviewRequest`, `Site.lastEditedAt` | `sites.publish` | EDITOR can publish; OWNER exempt; stale approval can be acknowledged (A07-17) |
| Sharing (draft preview links) | Site | dashboard `site-detail/share-draft-modal.tsx`, `sites/[id]/access` | Dashboard site Access tab | Editor site menu "Share preview link" → dashboard modal (`SiteMenu.tsx:97-103`) | `ShareLink` | `siteDetail.sharing.create/list/revoke` → `share-link.service` | create: EDITOR + `WSSharingSettings.allowEditors` (partially enforced, A07-8); revoke: ADMIN |
| Sharing policy | Workspace | dashboard `settings/workspace` → `workspace-form.tsx` | Settings › Workspace "Sharing" section | — | `WSSharingSettings` | `account.workspace.sharing` → `updateSharingSettings` | Only `allowEditors` is read (A07-8) |
| Invitations | Workspace (optional site list) | dashboard `components/team/invite-modal.tsx` | Settings › Team "Invite" | Clients detail "invite client" (`client-detail-view.tsx:343`) | `Invite` (+ `siteIds`) | `team.invite` → `team.service`; accept `auth.acceptInvite` (`auth.ts:303-318`) | ADMIN; accept is bound to the invited email |
| Roles | Workspace role + per-site `roleOverride` | `permission.service.ts` | Settings › Team role dropdown → `team.changeRole` | Site transfer (`sites.service.ts:266-286`) writes an override | `WorkspaceMember.role`, `SitePermission.roleOverride` | `getEffectiveSiteRole` (`permission.service.ts:95-116`) | **Override wins over role, and `changeRole` never touches overrides** (A07-1) |
| Site access scope | Site | `permission.service.resolveSiteScope` | Invite "Specific sites" | — (no editor UI after the invite; members table is read-only, `members-table.tsx:112`) | `SitePermission` rows | — | Any row makes the member site-scoped (A07-20) |
| Editor entry | Site | `app/edit/[siteId]/page.tsx` | Dashboard "Edit site" | — | — | `userCanEditSite` → `checkSiteRole(EDITOR)` | VIEWER cannot open the editor, so editor viewer branches are dead |
| Activity (server) | Workspace (+ siteId) | `activity-log.service.ts` | `/dashboard/activity` (`dashboard.activity`) | Team activity (`team.activity`) | `ActivityLog` | `record` / `recordForSite` from routers and the publish worker | Workspace member |
| "Activity" (editor) | Local session | `HistoryTab` → `ActivityView` (undo timeline) | History tab (`H`) | — | `HistoryManager.undoStack` | none | none. **Same word, different thing** (overlap B) |
| Version history | Site | `VersionTimelineManager` + `versionSync` | History tab | SavesChrome "Compare" | IndexedDB + `SiteVersion` | `siteVersions.*` | list/get: member; create/delete: EDITOR |
| Autosave / conflict | Site | `useComposerInit` (1000 ms debounce) → `BuildrikSyncProvider.saveProject` | Automatic | ⌘S | `_baselineLastEditedAt` | `sites.saveProject` → `saveProjectData` (`sites.service.ts:594-745`) | EDITOR; `expectedLastEditedAt` check is **not atomic** (A07-6) |
| Undo/redo | Local session | engine `HistoryManager` | ⌘Z/⇧⌘Z, footer | Palette | `undoStack`/`redoStack` | — (broadcast as an op when collab is connected) | — |
| Notifications | User | dashboard dropdown (SSE), editor `NotificationPanel` (polling) | Bell | `/dashboard/notifications` | `Notification` | `createNotification` (security, payment, member-joined, forms, publish) | Self. **No comment, review or mention producers** (A07-16/18) |

---

## Findings

### P0

#### A07-1 — P0 — IMMEDIATE FIX REQUIRED: demoting a site-scoped member keeps their old site role
- **Finding:** When an ADMIN changes the workspace role of a member who has `SitePermission` rows, the per-site `roleOverride` is left unchanged. Enforcement reads the override first. So a member demoted to VIEWER keeps EDITOR on every site in their scope:
  - opening the editor,
  - saving and overwriting content,
  - publishing,
  - creating share links,
  - posting collab ops.

  Meanwhile the Team UI shows them as "Viewer".
- **Severity:** P0 (permission bypass).
- **File:**
  - `server/services/team.service.ts:135-166` (`changeRole`)
  - `server/services/permission.service.ts:113-115` (`getEffectiveSiteRole`)
  - `server/trpc/routers/auth.ts:308-316` (invite accept writes `roleOverride: invite.role`)
  - `server/services/sites.service.ts:272-284` (transfer writes `roleOverride: "EDITOR"`)
- **Symbol:** `changeRole`, `getEffectiveSiteRole`, `resolveSiteScope`
- **Evidence:**
  - `changeRole` runs only `prisma.workspaceMember.update({ data: { role } })` (line 162-165). It contains no `sitePermission` write.
  - `getEffectiveSiteRole` returns `(row?.roleOverride ?? member.role)` (line 115).
  - The invite-accept path gives every "Specific sites" invitee overrides equal to the invite role (`auth.ts:310-315`).
  - `__tests__/permission-service.test.ts:66` asserts that a workspace **VIEWER** with an **EDITOR** override resolves as EDITOR. That passed in my run.
  - `sites.saveProject` (`sites.ts:273`), `sites.publish` (`sites.ts:330`) and the collab routes all gate on `checkSiteRole(…, "EDITOR")`.
  - The Team members table renders `member.role` plus a read-only "N of M" site count (`team.service.ts:63`, `members-table.tsx:112`). Nothing surfaces or edits the overrides.
- **Expected behavior:** Demotion lowers what the member can do everywhere. Overrides are either cleared or clamped to the new role, or the UI shows and edits them.
- **Root cause:** Two sources of truth for "role" (`WorkspaceMember.role` and `SitePermission.roleOverride`). The mutation path writes only one of them, and the resolver lets the other win.
- **Affected modules:** Team settings, invites, client invites (`client-detail-view.tsx:343`), site transfer, every site-write path (save, publish, share, versions, components, collab).
- **Recommendation:** In `changeRole`, inside one transaction, set `roleOverride` to at most the new role on that member's rows, or delete them if the product wants overrides to be only a scope marker. Add a test: VIEWER + EDITOR override after `changeRole(VIEWER)` must fail `checkSiteRole(EDITOR)`. Consider also letting a lower workspace role cap the override (`min(role, override)`) in `getEffectiveSiteRole`.
- **Status:** VERIFIED (static plus unit-test semantics). NOT RUNTIME VERIFIED against a database.

### P1

#### A07-2 — Joining or reconnecting to a collab session replays the whole retained op log from seq 0, including old full-project snapshots (data corruption; flag-off)
- **Severity:** P1. It becomes **P0 the moment `FEATURE_COLLAB` is enabled anywhere real users are**.
- **File:**
  - `packages/editor/src/engine/collaboration/SSETransport.ts:28,42,46-54`
  - `packages/dashboard/app/api/sse/collab/[siteId]/route.ts:26-27,37-46,56-66`
  - `server/services/collab.service.ts:41-48,79-83`
- **Symbol:** `SSETransport.connect`, `getCollabOpsSince`, `hasResyncGap`
- **Evidence:**
  - `lastSeq` starts at `0`, and the URL is built once with `?since=${this.lastSeq}`.
  - The `hello` listener ignores the head `seq` the server sends.
  - The server treats `since=0` as "no gap" (`hasResyncGap` returns false when `sinceSeq <= 0`). It then streams **every** retained row for the site, 200 per 1.5 s poll, which is up to 24 h of history.
  - `EventSource` auto-reconnect reuses the same `since=0` URL, and the server emits no `id:` for `Last-Event-ID`. So every reconnect replays everything again.
  - Replayed `operation` events are re-applied through `OTEngine.applyRemoteOperation` → `HistoryManager.applyRemoteOperation` → `composer.importProject`. A JSON-Patch `add` at an index duplicates an element, and a `remove` at an index removes whatever element now occupies it.
  - Replayed `sync_response` events call `composer.importProject(oldProject)` (`CollaborationManager.ts:743-760`), which rolls the canvas back to an older snapshot. The next local edit autosaves it.
- **Expected behavior:** The joiner seeds `lastSeq` from `hello.seq` (the project it loaded is its baseline), replays only ops after that seq, dedups by op id, and reconnects with the latest `since`.
- **Root cause:** The transport does not use the server head. The replay cursor is fixed at construction time. Ops are not idempotent.
- **Affected modules:** Live co-editing, autosave (which persists the corrupted state), version history.
- **Recommendation:** Seed from `hello`. Rebuild the `EventSource` URL on reconnect, or honour `Last-Event-ID` with `id: seq`. Never replay `sync_*` events. Store only content ops in `CollabOperation`.
- **Status:** VERIFIED statically. NOT RUNTIME VERIFIED.

#### A07-3 — Every collaborator is "host" and answers every `sync_request` with a full project snapshot, which peers then import (flag-off)
- **Severity:** P1 (flag-off; data overwrite).
- **File:** `CollaborationManager.ts:145-185` (`joinRoom` sets `host: userId` for every client), `:244-246` (`isHost`), `:725-737` (`handleSyncRequest`), `:743-760` (`handleSyncResponse`)
- **Evidence:**
  - Each `joinRoom` makes the joiner its own host, so `isHost()` is true on every client.
  - Every client that receives a `sync_request` sends `sync_response` with `composer.exportProject()`. That is a whole project per responder, stored as a `CollabOperation` row.
  - Every receiver imports every response, and the last one to arrive wins. A response carries no addressee, so *all* clients import it, not only the joiner (only the sender's own echo is dropped, at `SSETransport.ts:60`). An in-flight local edit on any client can be overwritten by a peer's snapshot.
- **Expected behavior:** One authority answers (the server-persisted project or an elected host), addressed to the requester only. Alternatively, drop peer snapshot sync: the joiner has already loaded the project from `sites.getProject`.
- **Root cause:** The host-based design of the original in-memory/WebSocket transport was carried over to a DB fan-out where "host" has no meaning. The code comment at lines 157-161 says as much.
- **Affected modules:** Live co-editing, autosave, DB size.
- **Recommendation:** Remove `sync_request`/`sync_response` from the DB transport, or scope them to a requester id and a single responder.
- **Status:** VERIFIED statically.

#### A07-4 — Local undo silently reverts remote collaborators' edits and is never broadcast (flag-off)
- **Severity:** P1 (flag-off; divergence then persisted loss).
- **File:** `engine/HistoryManager.ts:332-348` (`applyRemoteOperation`), `:386-418` (`reconstructState`), `:459-503` (`undo`), `:242-249` (`recordAndMaybeBroadcast`)
- **Evidence:**
  - A remote op is applied by `importProject` with recording off. It adds **no** entry to `undoStack`; only `currentStateCache` moves.
  - `undo()` restores `reconstructState(n-1)`, which is rebuilt from the local checkpoint plus local patches, so it never contains remote edits. `restoreSnapshot` runs with `isRestoringFromHistory = true` and no broadcast.
  - Result: A undoes a local step, and every remote edit since the last checkpoint disappears on A only. A's next autosave persists that.
- **Expected behavior:** Undo inverts only the user's own op, transformed against the remote ops that happened since, and broadcasts the inverse.
- **Root cause:** A single-user snapshot undo model under a multi-writer document.
- **Affected modules:** Undo/redo, live co-editing, autosave.
- **Recommendation:** Treat "undo with remote ops" as a Prompt 16 blocker for enabling collab. At minimum, disable undo across a remote op, or record remote ops as non-undoable checkpoints.
- **Status:** VERIFIED statically.

#### A07-5 — The client never ACKs its own ops, so for 30 s every remote op is transformed against local ops that were already applied (flag-off)
- **Severity:** P1 (flag-off; wrong index shifts cause wrong-element edits).
- **File:** `SSETransport.ts:60` (own echo dropped before the manager), `OTEngine.ts:169-192` (`createOperation` pushes to `pendingOps`), `:197-227` (the ACK path runs only when a remote op carries our userId, which never happens), `:233-244` (transform against every pending op), `:24-25,59-93` (30 s timeout cleanup)
- **Evidence:**
  - Own echoes are filtered by `clientId` in the transport, so `applyRemoteOperation`'s ACK branch is dead code.
  - Local ops stay "pending" until the 30 s sweep. Each incoming remote op is index-shifted against them even though the server has already ordered them first (lower seq).
- **Expected behavior:** Treat the server seq order as authoritative. ACK own ops on echo, and transform only against ops the server has *not* sequenced yet.
- **Root cause:** Echo suppression sits in the wrong layer.
- **Affected modules:** OT engine.
- **Recommendation:** Pass the echo to the manager as an ACK (or return the POST's `seq` to ACK), then drop it.
- **Status:** VERIFIED statically.

#### A07-6 — The whole-project save's conflict check is outside the write transaction; a concurrent save can pass it and then delete another editor's pages (production)
- **Finding:** This is the **only** production concurrency control for two people editing one site. It is a check-then-act: the `lastEditedAt` compare runs on a plain read, and the writes run later in a separate interactive transaction with no conditional `where`. Two saves carrying the same baseline can both pass.
  - The later full-snapshot save deletes every page absent from its snapshot, **including a page the other editor just created** (the `tx.page.findMany` at line 618 sees the other commit).
  - It then overwrites `projectStyles`/`projectSettings`.
- **Severity:** P1. Data loss is reachable in production, but only inside the window between the check and the commit (one request's duration), so it is not rated P0.
- **File:** `server/services/sites.service.ts:594-607` (check), `:612-641` (full-snapshot delete), `:724-744` (unconditional `site.update` of `lastEditedAt`)
- **Symbol:** `saveProjectData`
- **Evidence:**
  - `findUnique` at 595, then compare at 603-607, then `$transaction` at 612.
  - The final `tx.site.update({ where: { id } })` has no `lastEditedAt` predicate.
  - The default Postgres isolation (READ COMMITTED) does not serialise the two.
- **Expected behavior:** The compare-and-swap is atomic: `updateMany({ where: { id, lastEditedAt: expected } })` inside the transaction, with `count === 0` → `SAVE_CONFLICT` and a rollback, or `SELECT … FOR UPDATE` on the site row first.
- **Root cause:** The optimistic-lock token is read outside the unit of work.
- **Affected modules:** Autosave, multi-member editing, Pages (deletion), version history.
- **Recommendation:** Move the check into the transaction as a conditional update on the site row, performed **first**. Add a concurrency test that fires two saves with the same baseline.
- **Status:** PARTIAL (static; the race window was not exercised). NOT RUNTIME VERIFIED.

#### A07-7 — When `agency_layer` is off (the default), canvas comments are a dead end, and the Review panel offers a "Send for review" that always fails
- **Finding:**
  - Comment mode is always on offer: the header toggle (`StudioHeader.tsx:708-716`) and the `C` key (`useEditorShortcuts.ts:106`).
  - `comments.create/list` are not flag-gated, so pins are created and drawn.
  - Clicking a pin or "Open Review panel" switches to the Review tab (`CommentLayer.tsx:456,582`). There, `reviews.currentRound` returns `null` when the flag is off (`reviews.ts:152`), so `ReviewTab` renders "No review yet" with **no comment list and no resolve** (`ReviewTab.tsx:499-535`).
  - That state renders `SendForReview`, whose `reviews.submit` hard-fails `requireAgencyLayer` (`reviews.ts:62`). The server's own comment at `reviews.ts:113-117` names exactly this "door into a mutation that hard-fails". `ReviewTab` does not read `reviewsEnabled`, and neither does `SendForReview`.
  - The dashboard comment queue sits on `/dashboard/agency/reviews`, whose layout redirects when the flag is off (`agency/(tabs)/layout.tsx:38`).
  - Comments have no delete endpoint at all.
- **Severity:** P1 (release-blocking dead end in an async collaboration flow for every non-agency workspace).
- **Symbol:** `ReviewTab` (never-sent branch), `commentsRouter`, `reviews.currentRound`
- **Expected behavior:** Either comments are part of the agency layer (hide comment mode when it is off), or comments stand alone with their own list and resolve surface independent of review rounds. "Send for review" should appear only when `reviewsEnabled`.
- **Root cause:** Comments and Review are merged in the UI (the Review tab is the only comment list) but split in gating (comments ungated, review gated).
- **Affected modules:** CommentLayer, Review tab, dashboard agency reviews, ⌘K (which lists "Open Review panel" from `tabsConfig.ts:238-248`).
- **Recommendation:** PRODUCT DECISION on where comments belong, then gate consistently. Pass `reviewsEnabled` from `reviews.status` into `ReviewTab`/`SendForReview`.
- **Status:** VERIFIED statically. NOT RUNTIME VERIFIED.

#### A07-8 — The workspace sharing policy shown in Settings is mostly not enforced, and the one enforced toggle is bypassable and displayed inverted
- **Finding:** Settings › Workspace offers four switches, each described as a policy: "Link expiration: default expiration for new shared links", "Require password on shared links", "Allow editors to share", and "notify".
  - `defaultExpiration`, `requirePw` and `notify` are written (`workspace-settings.service.ts:168-170`) and **never read**. `createShareLink` and `share-draft-modal.tsx` take password and expiry only from the dialog.
  - `allowEditors` is checked only for `member.role === "EDITOR"` (`share-link.service.ts:27`):
    - a **DESIGNER** (the same rank, `permission.service.ts:8`) bypasses it;
    - it reads the workspace role, not the effective site role.
  - The settings page shows `allowEditors ?? false` (`settings/workspace/page.tsx:71`) while the server treats a missing row as *allowed* (`settings?.allowEditors === false`) and the Prisma default is `true`. A new workspace's admin sees "Allow editors to share: off" while editors can share.
- **Severity:** P1 (an admin-configured access policy that is silently not applied; draft previews go out unprotected contrary to the displayed policy). Not P0: every link is still created by an authorised site EDITOR.
- **File:** `server/services/share-link.service.ts:12-77`, `packages/dashboard/app/dashboard/settings/workspace/page.tsx:69-72`, `components/settings/workspace-form.tsx:340-420`, `prisma/schema.prisma` (`WSSharingSettings`)
- **Expected behavior:** Policies are enforced server-side at link creation (password required, expiry defaulted and capped, role check on effective rank ≥ EDITOR and below ADMIN), and the UI shows the effective value.
- **Root cause:** The settings UI was built ahead of enforcement.
- **Affected modules:** Sharing, workspace settings, roles.
- **Recommendation:** Enforce all four or remove the switches. Fix the default display.
- **Status:** VERIFIED statically.

#### A07-20 — Transferring a site turns the previous owner into a member scoped to that one site, locking them out of every other site in the workspace
- **Finding:** `transferSite` upserts a `SitePermission` (`roleOverride: "EDITOR"`) for the previous owner (`sites.service.ts:272-284`). `resolveSiteScope` treats **any** row as "scoped" and throws FORBIDDEN on every site without a row (`permission.service.ts:55-58`). A non-admin creator who transfers one site therefore loses access to all the others. No UI can edit site scope afterwards (the members table is read-only), so the only fix is to remove and re-invite the member.
- **Severity:** P1 (unexpected loss of access; the admin UI cannot recover it).
- **Symbol:** `transferSite` (the transfer function at `sites.service.ts:~250`), `resolveSiteScope`
- **Expected behavior:** Transfer changes the owner and leaves the previous owner's workspace-wide access intact.
- **Root cause:** `SitePermission` carries two meanings, "role override" and "scope marker".
- **Affected modules:** Site transfer, roles, the site list.
- **Recommendation:** Do not write an override on transfer (EDITOR is already the default for a member), or split scope from override.
- **Status:** VERIFIED statically.

### P2

#### A07-9 — The collab endpoints are live in production regardless of the flag; the SSE stream authorises once, and the op POST accepts unbounded, unvalidated JSON with no rate limit
- **Evidence:**
  - `ops/route.ts:13-35`: session, then `checkSiteRole(EDITOR)`, then `body.op` stored verbatim with no size cap or schema.
  - `sse/collab/route.ts:17-24`: role checked at connect only, then `setInterval(poll, 1500)` until abort.
  - `middleware.ts:129` matches `/api/*` but applies no limiter.
  - Consequences:
    - a removed or demoted member keeps receiving op payloads, including whole-project `sync_response` snapshots, until the connection drops;
    - any EDITOR can fill `collab_operations` without limit, and nothing prunes a site that stops appending (A07-24).
- **Severity:** P2 (the client is flag-off, so in production the streams carry nothing unless someone posts directly). Overlap F.
- **Recommendation:** Return 404 from both routes when the server-side flag is off. Re-check the role every N polls. Validate `op` against `CollaborationEvent` and cap its size. Rate-limit per user.
- **Status:** VERIFIED statically.

#### A07-10 — The `resync` event has no handler, and a second `startSession` opens a second EventSource without closing the first
- **Evidence:**
  - The server emits `event: resync` and closes (`sse/collab/route.ts:43-46`). `SSETransport` listens only to `hello`/`op`/`onerror` (`:46-75`).
  - `connect()` overwrites `this.es` without closing the old one (`:43-44`). The header shows "Start collaboration" again whenever `!isConnected` (`StudioHeader.tsx:848`), which includes a transient disconnect.
  - Two streams mean every op is applied twice.
  - The resync loop the inventory describes happens only on this second connect, when `lastSeq > 0` and older ops have been pruned.
- **Severity:** P2 (flag-off).
- **Recommendation:** Handle `resync` by reloading the project and setting `lastSeq` to the head. Make `connect` idempotent (close any previous stream).
- **Status:** VERIFIED statically.

#### A07-11 — A failed op send is silently dropped
- **Evidence:** `SSETransport.ts:95-98`: `.catch(() => {})`. The comment's claim that "SSE resync on reconnect covers gaps" is false. Outbound ops that never reached the server cannot be replayed, and non-2xx responses (403 after demotion, 500) are not even caught, because `fetch` resolves for them. The local user sees their edit; peers never do. Nothing surfaces the divergence.
- **Severity:** P2 (flag-off).
- **Recommendation:** Keep an outbox with retries, check `res.ok`, and show a "not synced" state.
- **Status:** VERIFIED statically.

#### A07-12 — Presence is structurally unreliable: ghost users, joiners who can't see existing users, selection and lock broadcasts nobody consumes, cursors stored as DB rows
- **Evidence:**
  - **Ghost users:** users are added only by `join` events (`CollaborationManager.ts:597-608`) and removed only by `leave`, which is sent from `leaveRoom` via `destroy()` (`:201-221,814-822`). A tab close, crash or network loss sends no leave. There is no heartbeat, and `lastActive` is never used to expire users (`useCollaboration.ts`).
  - **Joiners can't see existing users:** existing users do not re-announce themselves to a joiner. With a correct `since`, a joiner would see nobody. With the current since=0 it sees *everyone who joined in the last 24 h*, ghosts included (A07-2).
  - **No consumers:** `updateSelection` is broadcast on every selection change (`Composer.ts:354-376`), but no UI subscribes to `selection:update`, `editing:update` or `lock:*`. `notifyEditing`/`acquireLock` have no callers.
  - **Cursors as rows:** `useCursorSync` (50 ms throttle) produces up to about 20 inserts/s per moving user. They are delivered in 1.5 s batches, and the positions are canvas-pixel coordinates, not document coordinates (`useCursorSync.ts:95-101`).
- **Severity:** P2 (flag-off). The performance part overlaps E.
- **Recommendation:** Keep presence ephemeral (not in the durable op log), add a heartbeat and a TTL, and remove dead lock/editing code or wire it.
- **Status:** VERIFIED statically.

#### A07-13 — Two live collaborators trip each other's SAVE_CONFLICT dialog
- **Evidence:**
  - Autosave listens only to `project:changed`, `history:undo/redo` and `version:restored` (`useComposerInit.ts`, the handler around lines 502-530).
  - Remote ops go through `importProject`, which emits `project:loaded` (per `useComposerInit.ts:694-700`; not independently traced), so remote ops never autosave.
  - Each client saves its whole project against its own stale `_baselineLastEditedAt`. After A saves, B's next edit hits `SAVE_CONFLICT`, and "Overwrite" wins last-write-wins, deleting any pages B lacks (A07-6).
- **Severity:** P2 (flag-off). This confirms the inventory's claim.
- **Recommendation:** While a collab session is live, a single persistence authority (server-side op application or an elected saver) must own saves.
- **Status:** VERIFIED statically (event chain partly from comments). NOT RUNTIME VERIFIED.

#### A07-14 — In production, users get no awareness that another member is editing the same site
- **Evidence:** Presence exists only behind `FEATURE_COLLAB` (`StudioHeader.tsx:225,771-777`). The only signal is `ConflictModal` *after* a rejected save (`AquibraStudio.tsx:344-357,680-708`), whose options are "download backup and reload" or "overwrite".
- **Severity:** P2. PRODUCT DECISION REQUIRED.
- **Recommendation:** Decide between a lightweight "X is also editing" (heartbeat on the site) and a soft lock, independent of the live-editing arc.
- **Status:** VERIFIED statically.

#### A07-15 — "Review" is two approval products on one row, with two "Send for review" buttons that do different things
- **Evidence:**
  - **Dashboard "Send for review"** (`send-review-modal.tsx:52`): `{ siteId, note }` only. No client email, no snapshot. It lands in the ADMIN queue.
  - **Editor `SendForReview`:** client email plus a frozen snapshot (`SendForReview.tsx:105-117`).
  - Both write the single PENDING `ReviewRequest` (`review.service.ts:53-84`). An internal submit on top of a pending client round rewrites its `note`/`requestedById`.
  - A workspace ADMIN can approve a client-invited round (`resolveReview`, `review.service.ts:456-482`, has no `invitedEmail` check). That pre-empts the client's signature, which the client page then reports as "already answered" (`client-review.service.ts:279-280`).
- **Severity:** P2. PRODUCT DECISION REQUIRED.
- **Recommendation:** Split "internal approval" from "client sign-off", or make one explicit precedence rule, and label the two buttons differently.
- **Status:** VERIFIED statically.

#### A07-16 — Collaboration events do not reach Activity or Notifications
- **Evidence:**
  - `ActivityAction` (`activity-log.service.ts:3-23`) has no `comment.*`, `review.submitted`, `review.approved` or `review.changes_requested`. Only `review.revoked` is recorded (`reviews.ts:212`).
  - `resolveReviewByToken` (a client approves or requests changes, `client-review.service.ts:273-293`) and `createClientComment` (`:227-245`) write no activity, no notification and no email. The agency learns a client signed off only by opening the editor pill or the agency queue.
  - `createNotification` producers are limited to security, payment, member-joined, forms and publish (`notification.trigger.ts`; callers `account.service.ts`, `auth.ts:323`, `form-submission.service.ts`, `publish.service.ts`).
  - Declared actions `site.redirect.created/deleted` are never recorded.
- **Severity:** P2.
- **Recommendation:** On client resolve and client comment, record activity for the site and notify the round's `requestedById` (and admins). Add comment events.
- **Status:** VERIFIED statically.

#### A07-17 — The approval gate is advisory for content: a stale approval can be acknowledged, and the published HTML is supplied by the caller rather than being the approved snapshot
- **Evidence:**
  - `publishApprovalBlock` returns `null` for APPROVED + stale + `acknowledgeStale` (`publish-approval.ts:97`).
  - `sites.publish` passes the client's `input.pages` to `startPublish` (`sites.ts:337-343`). The gate compares timestamps, not content, against `ReviewRequest.snapshotPages`.
  - Unsaved edits made inside the 1000 ms autosave window are published without bumping `lastEditedAt`.
- **Severity:** P2. PRODUCT DECISION REQUIRED ("approved" means "someone approved *a* version" versus "*this* version").
- **Recommendation:** If approval must bind content, either publish the approved snapshot or hash-compare it. At minimum, flush the save before the gate check.
- **Status:** VERIFIED statically.

#### A07-18 — Mentions are not implemented, but the UI has a "Mentions" tab
- **Evidence:**
  - `notification-page.tsx:13` defines the tab.
  - `MENTION_NOTIFICATION_TYPES` is `SECURITY_*` plus `PAYMENT_FAILED` (`packages/shared/schemas/notifications.ts:13-18`).
  - `Comment` has no mention or parent fields, and no `@` parser exists anywhere.
- **Severity:** P2. PRODUCT DECISION REQUIRED (overlap B, which already has the naming half).
- **Recommendation:** Rename the tab (for example "For you") or implement mentions in comments.
- **Status:** VERIFIED statically.

#### A07-19 — The VIEWER role has commenting rights and no surface to use them; editor viewer branches are dead
- **Evidence:**
  - `comments.create`/`list` allow any site member, VIEWER included (`comments.ts:33-54`).
  - Viewers cannot open the editor (`app/edit/[siteId]/page.tsx:20-21` → `checkSiteRole(EDITOR)`), and the share and client-review pages don't take member comments.
  - So `ReviewTab`'s `isViewer` disabled reason (`ReviewTab.tsx` → `SendForReview disabledReason`) and similar editor viewer branches can never render for a real viewer.
- **Severity:** P2. PRODUCT DECISION REQUIRED (should a viewer have a comment-only editor mode?).
- **Status:** VERIFIED statically.

### P3

#### A07-21 — The editor's "Activity" (undo timeline) attributes rows by raw user id
- **Evidence:** `ActivityView.tsx:64-67,573-636` renders `getInitial(entry.userId)` and "Change by <cuid>". `useComposerInit.ts:172-176` stamps `profile.id`. Every row in a local undo stack is the current user anyway.
- **Severity:** P3. Overlap B (the "Activity" naming).
- **Status:** VERIFIED statically.

#### A07-22 — Presence identity is client-invented, and every user colours themselves the same
- **Evidence:**
  - `generateUserId()` is random per session (`CollaborationManager.ts:806-808`), and the name is the client-supplied `currentUser?.name ?? "Editor"` (`StudioHeader.tsx:549`; the ⌘⇧P path always sends "Editor", `useCanvasCommandPalette.ts:194`). The server's `authorId` on each op is sent (`sse/collab/route.ts:60`) but ignored by the client.
  - `colorIndex` starts at 0 on every client, so every user picks `USER_COLORS[0]` (`#f87171`) for themselves.
  - The palette includes `#818cf8` (indigo, banned by DESIGN.md; overlap C).
- **Severity:** P3.
- **Status:** VERIFIED statically.

#### A07-23 — Comments are flat and can't be edited or deleted
- **Evidence:**
  - `Comment` has no `parentId`. `postReply` creates a new unanchored top-level comment (`ReviewService.ts:277-281`).
  - The router has `create/list/workspaceList/reattach/resolve` only (`comments.ts`).
  - The Prompt 7 "threads" capability does not exist.
- **Severity:** P3. PRODUCT DECISION REQUIRED.
- **Status:** VERIFIED statically.

#### A07-24 — Collab data hygiene and guardrails
- **Evidence:**
  - `CollabOperation` has no relation to `Site` (`schema.prisma`, `model CollabOperation`), so rows outlive a deleted site.
  - Pruning runs only on an append whose global `seq % 50 === 0`, and only for *that* site (`collab.service.ts:32-37`). A site that stops appending keeps its rows indefinitely.
  - `check-baked-flags.mjs:37-43` asserts only that flags which should be on are on. Nothing fails a production build that carries `NEXT_PUBLIC_FEATURE_COLLAB=true`.
- **Severity:** P3.
- **Recommendation:** Add an "assert OFF" set to `check-baked-flags.mjs`, a cascading relation or a time-based cron prune.
- **Status:** VERIFIED statically.

#### A07-25 — Collaboration machinery runs in every editor session even when the flag is off
- **Evidence:** `Composer.ts:276-278` always constructs `CollaborationManager`. Its constructor starts a 10 s interval (`CollaborationManager.ts:80,86-91`), and `OTEngine` starts another (`OTEngine.ts:43-55`). Selection listeners run on every selection (`Composer.ts:354-376`); they are cheap because `isConnected()` is false.
- **Severity:** P3.
- **Status:** VERIFIED statically.

---

## Good as-is
- **Client review token model** (`client-review.ts` header, `client-review.service.ts`):
  - the token resolves everything server-side;
  - revoked and expired links fail closed with distinct codes;
  - identity must match `invitedEmail` (`:184-202`);
  - `listClientComments` filters by a concrete `reviewerId`, and the prior leak is documented as fixed (`:248-265`);
  - public mutations are rate-limited.
- **Invite acceptance** is bound to the invited email and writes membership, scope and status in one transaction (`auth.ts:291-318`).
- **`getEffectiveSiteRole`** is a single resolver used by both `sites.myRole` and every `checkSiteRole` path (`sites.ts:212-220`). The chrome and the server agree, apart from the stale-override defect in A07-1.
- **The publish approval gate** reads the **site's** workspace, not the session's (`publish.service.ts:248-270`), ignores revoked rounds, and blocks a submitter from self-approving (`review.service.ts:473-475`).
- **Comment mutations** are site-scoped IDOR-safe (`comment.service.ts:80-86,136-141`).
- **Collab op POST** re-checks EDITOR on every op.
- **Both collab entry points** (header and ⌘⇧P) are gated on the same flag (`StudioHeader.tsx:225,848`, `useCanvasCommandPalette.ts:326`).
- **`saveProjectData`** refuses an empty full snapshot that would delete every page (`EMPTY_SNAPSHOT`, `sites.service.ts:620-634`).
- **Review submit** converges concurrent submits onto one PENDING row using a partial unique index (`review.service.ts:63-83`), and supersedes older client links only on a genuinely new round.

## Product decisions required
1. **Comments:** part of the agency Review layer, or a standalone collaboration feature (A07-7, A07-19, A07-23)? This decides gating, the list surface, threads and viewer access.
2. **Internal approval versus client sign-off:** two products or one? What is the precedence rule when both exist (A07-15)?
3. **Approval binding:** does approval bind *content* (the snapshot is published or hash-checked) or only *timing* (A07-17)?
4. **Concurrent-editor awareness** in production without live co-editing: heartbeat presence, soft lock, or nothing (A07-14)?
5. **Mentions:** build or rename (A07-18)?
6. **`SitePermission` meaning:** a scope marker, a role override, or both? Does a workspace role change cascade (A07-1, A07-20)?
7. **Live co-editing roadmap:** the DB op log plus JSON-Patch "OT" has at least 5 independent correctness defects (A07-2 to A07-5, A07-13). Continue it, or replace it with a CRDT or a server-authoritative model before any flag flip?

## Overlaps with other audits
- **F (security):**
  - A07-1 (demotion bypass; F should confirm).
  - A07-8 (unenforced share policy).
  - A07-9 (collab endpoints live in prod, unbounded op JSON, SSE authorisation only at connect).
  - A07-22 (spoofable presence identity).
- **E (architecture/performance):**
  - A07-12 (cursor rows).
  - A07-24/25 (prune, intervals).
  - `CollaborationManager.ts` is 825 lines.
  - `SSETransport` has no tests.
- **G (verification):**
  - No multi-client or realtime tests.
  - Needed tests: A07-1 demotion, A07-6 concurrent saves, A07-2 seq seeding.
- **B (IA):**
  - "Activity" naming collision.
  - The Mentions tab.
  - Review/Comments IA (A07-7, A07-15).
- **C (UX):**
  - The indigo presence colour.
  - `ConflictModal` wording for an overwrite that deletes pages.

---

## AUDIT HANDOFF
- **Agent / Prompt:** D, Collaboration & Realtime / Prompt 7: Collaboration Product Architecture
- **Report:** `docs/audits/2026-09-25-full-audit/07-collaboration-product-architecture.md`
- **Counts:** P0 = 1 · P1 = 8 · P2 = 11 · P3 = 5
- **P0:**
  - A07-1: `team.changeRole` does not update `SitePermission.roleOverride`, and the override wins in `getEffectiveSiteRole`. A site-scoped member demoted to VIEWER keeps EDITOR (edit, save, publish, share) on their sites. IMMEDIATE FIX REQUIRED.
- **P1:**
  - A07-2: replay from seq 0 on join and reconnect (flag-off).
  - A07-3: every client is host, and peers import each other's snapshots (flag-off).
  - A07-4: undo reverts remote edits, with no broadcast (flag-off).
  - A07-5: own ops are never ACKed, so the transform is wrong (flag-off).
  - A07-6: the save-conflict check is non-atomic, and a full-snapshot save can delete another editor's pages (prod).
  - A07-7: with `agency_layer` off, comments are a dead end and Send-for-review always fails (prod).
  - A07-8: the sharing policy is not enforced or displayed correctly (prod).
  - A07-20: site transfer locks the previous owner out of every other site (prod).
- **P2:** A07-9 to A07-19.
  - Collab endpoints live in prod and unbounded.
  - Resync unhandled, plus a double EventSource.
  - Silent op drops.
  - Presence ghosts and dead broadcasts.
  - Collaborators conflict on save.
  - No concurrent-editor awareness.
  - Two review products.
  - No activity or notifications for review and comment events.
  - Advisory approval gate.
  - Mentions missing.
  - Viewer role has no comment surface.
- **P3:** A07-21 to A07-25.
- **Runtime verified:** none. 8 targeted test files ran: 75 of 75 passed. None covers the P0 or the P1 runtime paths.
- **NOT RUNTIME VERIFIED:**
  - Every finding (no DB, no browser).
  - Production flag values.
  - The race window in A07-6.
  - The `importProject` → `project:loaded`-only emit relied on in A07-13 (taken from a code comment).
- **Dependencies:**
  - A07-1 and A07-20 share one fix (decide what `SitePermission` means).
  - A07-2, A07-3, A07-10 and A07-12 share one transport redesign, which Prompt 16 owns.
  - A07-4, A07-5 and A07-13 need a persistence/undo model decision before collab can ship.
  - A07-7 depends on product decision 1.
  - A07-6 should land before any work that increases concurrent editing.
- **Inventory corrections:**
  - Auto-reconnect replays from the original `since` (0) instead of looping on `resync`. `resync` fires only on a second `connect()`.
  - `hello.seq` is ignored by the client.
  - Remote selection, editing and locks have no consumers.
  - Comments are not `agency_layer`-gated, but their only list is.
- **Suggested next owners:**
  - **F:** confirm A07-1 and A07-8 (and fix them in the fix batch).
  - **D/Prompt 16:** transport and OT (A07-2 to A07-5, A07-9 to A07-13).
  - **G:** tests for A07-1, A07-6 and A07-2.
  - **Orchestrator:** product decisions 1 to 7.
