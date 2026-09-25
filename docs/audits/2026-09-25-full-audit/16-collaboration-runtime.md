# 16 — Collaboration Runtime, Sync & Conflict (Prompt 16)

**Agent:** D, Collaboration & Realtime.
**Scope:** Prompt 16 only: the runtime that keeps two or more editors of one site consistent. That covers:
- the transport, auth, room join, presence publish and cleanup;
- local op generation, remote receipt, ordering, dedup and conflict handling;
- persistence, reconnect, resync, the offline queue and version reconciliation;
- the async multi-writer paths that are live in production (autosave optimistic concurrency, CMS and component mirrors, the site-settings mirror).

Product ownership (who owns comments, review, sharing and so on) is Prompt 7 (`07-collaboration-product-architecture.md`). It is referenced here, not repeated.
**Mode:** read-only. No production code, tests or config were changed. This file is the only file written in the repo. The proof-of-concept scripts ran from the session scratchpad, outside the repo.

---

## Method & runtime status

**Code read end to end** (file:line references are in the findings):
- **Transport and engine:**
  - `packages/editor/src/engine/collaboration/{SSETransport,CollaborationManager,OTEngine,OTTypes}.ts`
  - `engine/HistoryManager.ts` (record, `recordForCollaboration`, `applyRemoteOperation`, `undo`, `trimHistory`)
  - `engine/utils/JsonPatch.ts`
  - `engine/Composer.ts` (collab wiring at `:276-378`, `importProject` at `:600-662`, `exportProject`, `markDirty`)
  - `engine/elements/manager/PageManager.ts` (`importPage`, `clear`)
  - `engine/VersionTimelineManager.ts` (restore)
- **Editor shell:**
  - `editor/shell/StudioHeader.tsx` (`startCollab`)
  - `editor/canvas/hooks/{useCollaboration,useCursorSync,useCanvasCommandPalette}.ts`
  - `editor/shell/hooks/useComposerInit.ts` (autosave)
- **Sync services:** `services/{BuildrikSyncProvider,cmsSync,componentSync}.ts`.
- **Server:**
  - `packages/dashboard/app/api/collab/[siteId]/ops/route.ts`
  - `packages/dashboard/app/api/sse/{collab/[siteId],publish/[jobId],notifications}/route.ts`
  - `server/services/{collab,sites,cms,site-component,site-settings}.service.ts`
  - `server/trpc/routers/{sites,site-detail}.ts`
  - `prisma/schema.prisma` (`CollabOperation`, `Site.lastEditedAt`)

**What I ran**
1. `pnpm vitest run __tests__/collab-service.test.ts packages/editor/src/engine/collaboration/__tests__ packages/editor/src/editor/collaboration/__tests__`: **4 files, 24 tests, all passed.**
   - None of them exercises two clients, ordering, replay, reconnect, `SSETransport` (which has no test file), or the *remote* side of `OTEngine.transform`. The only two transform tests assert `bPrime`, the local side.
2. **Proof-of-concept 1:** `node --experimental-strip-types` on a scratch copy of `engine/utils/JsonPatch.ts`, the real diff/apply code, unmodified. It proved three things:
   - a `/__proto__/…` path pollutes `Object.prototype`, printing `polluted: yes` (A16-6);
   - delete-vs-edit writes B's edit into the wrong element (A16-2);
   - concurrent text edits swap between the two clients and never converge (A16-2).
3. **Proof-of-concept 2:** scratch copies of the real `OTEngine.ts`, `EventEmitter.ts` and `events.ts` (import specifiers rewritten only). `applyRemoteOperation` returns the remote patch **unchanged** (`/c/1/t`) when a pending local insert at `/c/0` means it should be `/c/2/t` (A16-2).
4. **Proof-of-concept 3:** a scratch vitest file in the scratchpad that imports the real `HistoryManager` and `OTEngine` against a stub composer. Both tests passed:
   - After 105 `recordForCollaboration` calls the stack has one checkpoint, and its snapshot is `{}`. `[HistoryManager] no checkpoint found at targetIndex 0` is logged (A16-7).
   - `applyRemoteOperation` erases an edit that was still in the 500 ms coalesce window: `children: []` after the remote op (A16-3).

**NOT RUNTIME VERIFIED**
- **Environment:** there was no Postgres and no browser, so nothing here was observed in a running app or with two real clients.
- **What the proofs cover:** the proofs above exercise the real pure functions and classes in isolation. The end-to-end chains (EventSource → manager → composer → canvas → autosave) are **statically traced**.
- **Not exercised at all:** DB commit-order races (A16-4), the save race (A07-6), and SSE stream lifetime on cPanel/LiteSpeed (A16-10).
- **Production flag:** the collab client is behind `NEXT_PUBLIC_FEATURE_COLLAB` (`runtimeEnv.ts:95-99`). "Off in production" comes from `CLAUDE.md`; I could not observe it. The two collab **server routes are not flag-gated**, so they are live in production.

**Inventory corrections (to `00-inventory.md §7`)**
1. The `OTEngine` "transforms incoming ops against pending local ones" is true **only for the local side**. `transform()` copies the remote patch into `aPrime` verbatim (`OTEngine.ts:262-265`), so incoming ops are never transformed (A16-2). This also corrects A07-5: a missing ACK does not cause wrong index shifts on *incoming* ops, because incoming ops are never shifted at all.
2. The cursor cost of "about 20 DB rows/s" is confirmed: `useCursorSync` throttles at 50 ms (`useCursorSync.ts:70,83`), and each tick is one POST and one `INSERT`. Those rows are also replayed to every later joiner for 24 h (A16-5).
3. A07-13 says remote ops never trigger the receiver's autosave. That holds: `importProject` sets `state.dirty = false` and emits only `project:loaded` (`Composer.ts:659-660`), which the autosave effect does not subscribe to (`useComposerInit.ts:673-676`). Remote edits therefore reach the server only through the author's own save.

---

## Collaboration tech (as built, from code)

| Layer | What it is | Evidence |
|---|---|---|
| Transport out | One `fetch POST /api/collab/:siteId/ops` per event, fire-and-forget, concurrent, `.catch(() => {})` | `SSETransport.ts:86-99` |
| Server log | `CollabOperation` row, `seq Int @default(autoincrement())` global across sites, opaque `op Json`, prune rows older than 24 h when `seq % 50 === 0` (that site only) | `schema.prisma:1515-1527`, `collab.service.ts:21-38` |
| Transport in | `EventSource /api/sse/collab/:siteId?since=<lastSeq at construction>`, server polls `seq > lastSeq` every 1500 ms, 200 per batch, events `hello` / `op` / `resync` | `SSETransport.ts:42-65`, `sse/collab route.ts:26-66` |
| Echo suppression | By `clientId` in the transport (`SSETransport.ts:60`) and by `userId` in the manager (`CollaborationManager.ts:560`) | — |
| Op model | Whole-document JSON Patch computed by diffing `exportProject()` snapshots. Arrays are diffed **by index** (`JsonPatch.ts:147-175`) | `HistoryManager.recordForCollaboration` `:298-330` |
| "OT" | Remote patch applied verbatim. Local pending ops are index-adjusted but never re-used for anything | `OTEngine.ts:197-316` |
| Apply | `applyPatch(currentStateCache, patch)` → `composer.importProject(newState)` (a full tree rebuild) | `HistoryManager.ts:332-348` |
| Presence | `join` / `leave` / `cursor` / `selection` / `editing` / `lock` events on the same durable op log. No heartbeat | `CollaborationManager.ts:145-221,255-397,597-719` |
| State sync | `sync_request` / `sync_response`, where the response is a full `exportProject()`. Every client is "host" | `CollaborationManager.ts:162-184,725-760` |
| Persistence | Independent of collab. Each client autosaves the **whole project** (`sites.saveProject`, `expectedLastEditedAt`) plus a parallel **site-columns** mirror (`siteDetail.settings.update`) | `BuildrikSyncProvider.ts:405-446`, `useComposerInit.ts:497-677` |
| Outside the op model | Component masters, CMS entries and collections are not in `ProjectData` (`Composer.exportProject` `:670-693`, `types/project.ts:30-60`). They sync through separate full-record upsert mirrors | `componentSync.ts`, `cmsSync.ts` |

No WebSocket, Yjs, Automerge or Liveblocks is used. There is no CRDT.

---

## OUTPUT TABLE — runtime failure modes

| # | Subsystem | File / function | Protocol / state | Failure mode | Repro path | Data-loss risk | Recommendation | Priority | Runtime verified? |
|---|---|---|---|---|---|---|---|---|---|
| A16-1 | Autosave → site-columns mirror (**prod**) | `BuildrikSyncProvider.saveProject` `:411-421`, `extractSiteColumnPatch` `:192-229`; `siteDetail.settings.update` `site-detail.ts:94-127`; `updateSiteSettings` | Full-record column write on every ADMIN/OWNER autosave, sent in parallel with (not after) the conflict-checked project save. No version check, and it does not bump `lastEditedAt` | A stale editor tab silently reverts site name, meta, OG image, favicon, robots.txt, social links, head/body code and published password edited elsewhere. It still writes when its own project save is refused with `SAVE_CONFLICT` | Open `/edit/S` as owner → dashboard tab: rename S or change its meta description → back in the editor, nudge anything → 1 s later the old values are written back | **High** (silent overwrite of user config, including custom code) | Send only changed keys; put the columns under the same `expectedLastEditedAt` check (same transaction), or drop the mirror and make the Site row the single writer | **P0** | No (static) |
| A16-2 | OT / apply | `OTEngine.transform` `:256-316`, `applyRemoteOperation` `:197-250`; `JsonPatch.createArrayPatch` `:147-175` | Positional JSON Patch; remote patch never transformed | Concurrent delete-vs-edit writes the edit into the **wrong element**. Concurrent text edits **swap** and never converge. Moves and inserts are cascades of field `replace`s by index | A deletes child 0 while B edits child 1's text: A ends with B's text in *z*; B loses its edit | **High** (wrong-element corruption, persisted by autosave) | Replace with id-addressed ops (element-id + field) and server-sequenced LWW per field, or a CRDT | P1 (P0 on flag flip) | **Yes, unit PoC** |
| A16-3 | Apply → canvas | `HistoryManager.applyRemoteOperation` `:332-348`; `Composer.importProject` `:600-662`; `PageManager.clear/importPage` | Rebuilds from the last *recorded* state and does a full tree import | Local edits in the 500 ms coalesce window are erased and never broadcast. Every remote op resets the receiver to the **first page** and rebuilds the tree under inline editing and selection | B types, and A's op lands within 500 ms: B's keystrokes vanish. B is on page 3 and is yanked to page 1 every 1.5 s batch | **High** (local lost update) | `flushPending()` before apply, apply to the live tree (not a snapshot), preserve the active page and selection | P1 | **Yes (erase), unit PoC.** Page reset is static |
| A16-4 | Ordering / delivery | `collab.service.getCollabOpsSince` `:41-48`, `sse route poll` `:52-63`; `SSETransport.send` `:91-98` | `seq > lastSeq` over a Postgres sequence; concurrent autocommit inserts; unordered client POSTs | An op whose `seq` commits after a higher `seq` is **skipped forever** for every live stream. Two quick local ops can be sequenced in reverse | Two clients POST in the same ms (cursor traffic makes this common): the lower seq commits last and is never streamed | High (silent divergence) | Deliver by commit order (e.g. `xid`/`txid_current` watermark, or a per-site counter row updated in the insert transaction, or re-read a trailing window), and serialise sends per client | P1 (flag-off) | No (static) |
| A16-5 | Join / reconnect / state sync | `SSETransport.connect` `:28,42,46`; `hasResyncGap` `:79-83`; `CollaborationManager.handleSyncRequest/Response` `:725-760` | `since=0` baked into the URL, `hello.seq` ignored, every client is host | Each join or auto-reconnect replays 24 h of ops onto an already-loaded project (duplicates). Replayed **historic** `sync_request`s are each answered with a new full-project POST (amplification). Every client imports every `sync_response` (rollback) | Start a session on a site with ≥1 earlier session today → duplicated inserts. N earlier joins give N snapshot rows per join | High | Seed `lastSeq` from `hello`, rebuild the URL on reconnect, remove peer snapshot sync | P1 (confirms and extends A07-2/3) | No (static) |
| A16-6 | Op validation / client safety | `ops/route.ts:28-35` (opaque op); `JsonPatch.applySingleOperation` `:199-259`, `parseJsonPointer` `:329-338` | No schema, no size cap, no key guard | Any site EDITOR can POST a patch with a `/__proto__/…` path and **pollute `Object.prototype` in every connected collaborator's browser**. They can also forge another user's `leave`/`cursor` (client-chosen `userId`) or broadcast a `sync_response` that all peers import | `POST /api/collab/S/ops {clientId:"x",op:{type:"operation",userId:"x",payload:{id:{userId:"x",seq:1},patch:[{op:"add",path:"/__proto__/p",value:1}]}}}` | Medium (client integrity; XSS gadget surface) | Validate `op` against a Zod `CollaborationEvent` schema server-side, reject `__proto__`/`constructor`/`prototype` segments in `applyPatch`, bind `userId` to `authorId` | P1 (P0 on flag flip) | **Yes (pollution), unit PoC** |
| A16-7 | Undo / redo with remote ops | `HistoryManager.recordForCollaboration` `:298-330` (no checkpoint), `trimHistory` `:613-630`, `undo` `:459-503` | Snapshot undo on a multi-writer doc | Undo reverts peers' edits locally and is never broadcast (A07-4). In collab mode no checkpoint is ever written. After 100 ops the trimmed base becomes `{}`, and every deep undo bails ("state shape diverged") | Connected session, 101+ edits, then ⌘Z repeatedly | Medium (divergence and a dead undo) | Per-user inverse ops transformed against later remote ops, broadcast; keep checkpointing in collab mode; fix `trimHistory` | P1 | **Yes (checkpoint → `{}`), unit PoC** |
| A16-8 | CMS entries and component masters (**prod**) | `cmsSync.hydrateCmsFromServer` `:105-167`, `syncEntryUpsert` `:201-219`; `componentSync.hydrateComponentsFromServer` `:84-100`; `cms.service.upsertEntry` `:83-102`; `site-component.service.upsertSiteComponent` `:13-31` | Additive hydrate that skips anything already in local IndexedDB. Full-record upsert-by-id with no version check | A collaborator's server-side changes never reach a browser that already has that collection or component. Editing the stale local copy overwrites their changes wholesale and **resurrects** rows they deleted (the upsert creates it again). The retry queue replays stale payloads on reconnect | Users A and B both open S. A edits entry E's price and deletes entry F. B edits E's title → A's price is reverted. B edits F → F is back | **High** (lost update and deletion undone) | Hydrate *all* rows, diffing with `updatedAt`. Send `expectedUpdatedAt` and reject stale writes. Tombstones for deletes | P1 | No (static) |
| A16-9 | Live session scope | `Composer.exportProject` `:670-693`; `VersionTimelineManager.restore` `:280-313`; `HistoryManager` `PROJECT_LOADED` handler `:135-162` | Components, CMS, site columns and version restore are outside the op log | A restore (and ConflictModal's reload) resets the local baseline and is not broadcast. The restorer's next patches are relative to a document peers don't have (A16-2 then corrupts them). Master and CMS edits never reach peers live | A restores v3 while B is connected: B keeps the old doc, and A's following ops land on B's tree at wrong indices | High (flag-off) | Treat restore as a server-side op (force peers to reload). Put masters and CMS behind the same channel or an invalidation event | P2 | No (static) |
| A16-10 | SSE stream lifetime | `sse/collab/[siteId]/route.ts:51-72` vs `sse/publish/[jobId]/route.ts:13,63-100` | No lifetime cap, no heartbeat, errors swallowed, no `cancel()`, no `X-Accel-Buffering: no` | If `req.signal` never aborts (proxy and adapter dependent), `enqueue` on the dead stream throws, the error is swallowed, and **the 1.5 s DB poll runs forever**. Idle streams are cut by proxies, and each reconnect replays from 0 (A16-5) | Client disappears behind cPanel/LiteSpeed without a clean abort | Low (DB load, leak) | Mirror the publish route: cap the lifetime, clear on error, heartbeat, `cancel()`, `X-Accel-Buffering` | P2 | No |
| A16-11 | Authz after role change | `sse/collab route.ts:17-24` (once); `ops/route.ts:13-19` (per POST) | Connect-time role check | A removed or demoted member keeps receiving every op, including full-project snapshots, until the connection drops. The client has no "access revoked" state: an EventSource 403 closes it permanently, and the UI just re-offers "Start collaboration". A07-1 (stale `roleOverride`) means a demotion may not even fail the check | Remove member M while M's tab is connected: M still receives ops | Medium (read exposure) | Re-check the role every N polls, close with an `event: revoked`, flag-gate both routes | P2 (confirms A07-9) | No |
| A16-12 | Reconnect / resync | `SSETransport` `:42-78`; server `resync` `:41-45`; `CollaborationManager.handleReconnect` `:780-783` | `resync` unhandled; `connect()` not idempotent | On a second `connect()` with a pruned `lastSeq`: resync → close → EventSource reconnects to the same URL → resync, looping about every 3 s with the "connected" state flickering. A second `connect()` leaks the first EventSource, so every op is applied twice. A reconnect does not re-announce presence | Transient drop → header re-offers "Start collaboration" (`StudioHeader.tsx:848`) → click | Medium | Handle `resync` (reload the project, set `lastSeq` to head); close the old stream; re-join on reconnect | P2 (confirms A07-10) | No |
| A16-13 | Outbound durability / offline | `SSETransport.send` `:86-99` | Fire-and-forget; no `res.ok` check; no outbox | A failed or non-2xx POST (offline, 403, 500) drops the op. The author sees the edit and peers never do. Nothing reports the divergence. There is no offline queue for ops (unlike `cmsSync`'s `SyncRetryQueue`) | Go offline for 5 s while editing | Medium | Per-client ordered outbox with retry and a "not synced" state | P2 (confirms A07-11) | No |
| A16-14 | Presence | `CollaborationManager.joinRoom/leaveRoom` `:145-221`; `useCursorSync` `:67-129` | Durable-log presence, no heartbeat or TTL, no `pagehide` leave, client-random identity | Ghost users (a crash or tab close sends no leave, and the leave `fetch` is not `keepalive`). Joiners see replayed ghosts from 24 h. Cursors are canvas-pixel coordinates in 1.5 s batches. Selection, editing and lock broadcasts have no consumer | Close a tab: its avatar never leaves | Low | Ephemeral presence channel with heartbeat and TTL; `sendBeacon` leave; drop or wire the locks | P2 (confirms A07-12) | No |
| A16-15 | Autosave with live collaborators | `useComposerInit` autosave `:497-677`; `BuildrikSyncProvider` baseline `:334,415,445` | Each client saves the whole project against its own baseline | After A saves, B's next save is a `SAVE_CONFLICT`. "Overwrite" deletes any page B lacks (full snapshot). The check itself is non-atomic (A07-6) | Two connected editors, both editing | High (flag-off); the prod race is A07-6 | One persistence authority per live session (server applies ops), or suppress per-client saves while connected | P2 (confirms A07-13) | No |
| A16-16 | Save bypass | `sites.saveProjectData` `sites.ts:585-600` → `saveProjectData(input)` with no `expectedLastEditedAt` | Full-project write with no conflict check | A second full-snapshot write door with no optimistic check. No UI caller was found by grep, so it is latent | Direct tRPC call as an EDITOR | Medium if ever wired | Delete the procedure, or require `expectedLastEditedAt` | P3 | No |
| A16-17 | Tests | `engine/collaboration/__tests__/*`, `__tests__/collab-service.test.ts` | — | No test for `SSETransport`, replay, ordering, multi-client convergence, remote-side transform, remote-apply vs coalesce window, or the settings mirror under conflict | — | — | See "Required tests" in the handoff | P3 | Ran 24/24 |

### Case matrix (Prompt 16 cases)

| Case | Live collab (flag-off) | Production (no live collab) | Findings |
|---|---|---|---|
| Concurrent text edits | Diverges: each side ends with the *other's* text (PoC) | Whole-project save: `SAVE_CONFLICT` → keep one copy | A16-2, A07-6 |
| Element moves | A move is a cascade of by-index field `replace`s. A concurrent move or edit mixes fields across elements | Same as above | A16-2 |
| Delete vs edit | The edit lands in the element that slid into the index (PoC) | A full-snapshot overwrite deletes the other editor's pages | A16-2, A07-6 |
| Page deletion while viewed | Every remote op already resets the viewer to page 1. A remote page delete arrives as positional page-field replaces | A later full save deletes the page, and the other tab conflicts | A16-3, A16-2 |
| Component master edit during instance edit | Masters are not in the op log, so peers never see the edit live | Stale local master, whole-record upsert (LWW), deleted masters resurrected | A16-9, A16-8 |
| CMS record concurrent edit | CMS is not in the op log | Additive hydrate plus full-record upsert: lost update and resurrection | A16-8 |
| Publish during editing | Publisher publishes its own local pages. Peers' unsaved or unsynced ops are not included | `sites.publish` takes client `input.pages`; the approval gate compares timestamps, not content | A07-17 |
| Undo/redo with remote ops | Undo reverts peers' edits locally, is not broadcast, and dies after 100 ops | Single user only | A16-7, A07-4 |
| Autosave with remote ops | Receivers never autosave remote ops. Authors conflict with each other | Conflict check non-atomic; the site-columns mirror ignores conflicts | A16-15, A16-1, A07-6 |
| History restore with live collaborators | Not broadcast. Later ops are relative to a different base, so peers corrupt | Restore autosaves a full snapshot; the other tab conflicts | A16-9 |

---

## Findings

### P0

#### A16-1 — P0 — IMMEDIATE FIX REQUIRED: every editor autosave rewrites all site-settings columns from the tab's stale copy, even when the project save is refused as a conflict
- **Finding:** Every autosave that has a `siteId` fires two mutations in the same tick:
  - `sites.saveProject`, which is protected by `expectedLastEditedAt`;
  - `siteDetail.settings.update`, which carries **every** site column the editor has in memory, whether it changed or not. This includes name, favicon, locale, meta title and description, title template, OG image, indexing, robots.txt, touch icon, social links, head and body code, and published password.

  The second call has no version check. It is not in the conflict transaction, and it does not bump `lastEditedAt`. It is dispatched **before** the first call's result is known, so it also runs when the project save is rejected with `SAVE_CONFLICT`. That happens while the conflict modal tells the user "nothing is lost without your choice".
  - The editor loads these columns once (`loadProject` → `mergeSiteColumnsIntoSettings`, `BuildrikSyncProvider.ts:297-334`) and never re-reads them into the composer.
  - So any later change made on the dashboard (`components/site-detail/seo-tab.tsx`, `sites/[id]/settings/page.tsx`, a rename), or by another admin, is silently reverted by the next autosave of any open editor tab owned by an ADMIN or OWNER.
- **Severity:** P0 — IMMEDIATE FIX REQUIRED. This is silent data loss in production. It needs no race window: one user with two tabs is enough. It is the async-collaboration path every multi-admin workspace uses.
- **File:**
  - `packages/editor/src/services/BuildrikSyncProvider.ts:405-446` (parallel dispatch at `:411-421`)
  - `:192-229` (`extractSiteColumnPatch`: every defined field is sent, no diff)
  - `server/trpc/routers/site-detail.ts:94-127` (`settings.update`, ADMIN)
  - `server/services/site-settings.service.ts:130+` (`updateSiteSettings`, which does not touch `lastEditedAt`)
  - `server/services/sites.service.ts:312-316` (`renameSite` bumps `lastEditedAt`, which trips the project conflict, while the mirror still writes the old name)
- **Symbol:** `saveProject` (BuildrikSyncProvider), `extractSiteColumnPatch`, `updateSiteSettings`
- **Evidence:**
  - `const primaryCall = client.sites.saveProject.mutate({... expectedLastEditedAt: _baselineLastEditedAt })` and `const settingsCall = hasSiteColumnChanges ? client.siteDetail.settings.update.mutate({ id: siteId, ...siteColumnPatch })…` are created back to back.
  - `primaryCall` is awaited first, and it throws on conflict. By then `settingsCall` is already in flight.
  - `hasSiteColumnChanges = Object.keys(siteColumnPatch).length > 0` is true whenever `seo.siteName` is set, and the load merge always sets it from the row (`mergeSiteColumnsIntoSettings`: `if (siteCols.name != null) seo.siteName = siteCols.name`).
- **Expected behavior:** Concurrent edits to site settings are either detected (the same optimistic token) or merged per field. A refused save writes nothing.
- **Root cause:** Site settings have two writers, the dashboard tabs and the editor's `projectSettings`, with no shared concurrency token. The editor mirror is a full-record push, not a diff.
- **Affected modules:** Editor autosave; dashboard Site Settings, SEO and rename; publish output (head/body code, password); ConflictModal's promise.
- **Recommendation:**
  - Send only the keys that changed since load or last save.
  - Chain the settings call **after** a successful project save, and skip it on conflict.
  - Better: include the column patch inside `saveProjectData`'s transaction under the same `expectedLastEditedAt` check. Make `updateSiteSettings` bump `lastEditedAt` so dashboard edits are visible to the editor's conflict check.
  - Add a test: a conflicting save must not call `settings.update`.
- **Status:** VERIFIED statically (full call chain read). NOT RUNTIME VERIFIED: no DB or browser.

### P1

#### A16-2 — The "OT" never transforms incoming ops; positional JSON Patch corrupts the wrong element and does not converge (flag-off)
- **Severity:** P1. It becomes **P0 the moment `FEATURE_COLLAB` is on for real users**, because it corrupts documents and autosave persists the corruption.
- **File:** `packages/editor/src/engine/collaboration/OTEngine.ts:197-250` (`applyRemoteOperation`), `:256-316` (`transform`); `packages/editor/src/engine/utils/JsonPatch.ts:147-175` (`createArrayPatch`); `HistoryManager.ts:298-330`
- **Symbol:** `OTEngine.transform`, `OTEngine.applyRemoteOperation`, `createArrayPatch`
- **Evidence:**
  - `transform` builds `aPrime` as `for (const opA of patchA) aPrime.push({ ...opA })`. Only `bPrime`, the already-applied local ops, is adjusted, and `bPrime` is only stored back into `pendingOps`. It is never re-applied.
  - PoC 2 shows this with the real `OTEngine`: pending local `add /c/0`, then remote `replace /c/1/t` is returned unchanged as `/c/1/t`, where the correct path is `/c/2/t`.
  - `createArrayPatch` diffs arrays **by index**. PoC 1 used the real `createPatch`/`applyPatch`:
    - "A deletes x" becomes `replace /c/0/id x→y, replace /c/0/t, replace /c/1/id y→z, replace /c/1/t, remove /c/2`.
    - Applying B's concurrent `replace /c/1/t` on A gives `[{id:y},{id:z,t:"Y-edited-by-B"}]`, so B's text lands in **z**.
    - Applying A's patch on B gives `[{id:y,t:"Y"},{id:z}]`, so B's own edit is erased by A's stale copy of y.
  - Concurrent text replaces on one path finish as A = "Hello B" and B = "Hello A". They swap and never converge, because server `seq` order is never consulted.
- **Expected behavior:** The same ops applied in server order yield the same document on every client, and an edit always targets the same element id.
- **Root cause:** Undo-history snapshot diffs (positional and whole-document) are reused as the replication format. The server seq is a transport detail, not the ordering authority.
- **Affected modules:** Live co-editing, autosave, version history, publish (it publishes the corrupted pages).
- **Recommendation:** Do not patch this engine. Move to id-addressed operations (`{elementId, field, value}`, `insertChild(parentId, afterId, node)`, `move(id, parentId, afterId)`) with server-seq LWW per field, or adopt a CRDT such as Yjs. At minimum, make the server seq order authoritative (rebase local pending ops on top of confirmed remote ops) before any flag flip.
- **Status:** VERIFIED (unit PoC on the real functions and class). Multi-client NOT RUNTIME VERIFIED.

#### A16-3 — Applying a remote op erases the receiver's un-recorded local edits and resets its page and element tree every batch (flag-off)
- **Severity:** P1 (flag-off; local lost update that is never broadcast).
- **File:** `packages/editor/src/engine/HistoryManager.ts:332-348` (`applyRemoteOperation`), `:93-127` (coalesce chain), `:379-384` (`getCurrentState` returns `currentStateCache`); `engine/Composer.ts:600-662` (`importProject`); `engine/elements/manager/PageManager.ts:362-376,395-401`
- **Symbol:** `HistoryManager.applyRemoteOperation`, `Composer.importProject`
- **Evidence:**
  - `applyRemoteOperation` computes `applyPatch(this.getCurrentState(), patch)`. That is the last **recorded** state, but local edits are recorded only after `setTimeout(0)` plus the 500 ms coalesce.
  - `importProject(newState)` then clears and rebuilds the whole tree.
  - The pending record timer later diffs the live state against the cache, both of which now equal cache + remote, so it finds an empty patch. The local edit is gone and was never broadcast.
  - PoC 3 used the real `HistoryManager`: an un-recorded local child followed by a remote op leaves `children: []`.
  - `importProject` → `elements.clear()` → `PageManager.clear()` sets `setActivePageId(null)`, and `importPage` then activates the **first** page. Every remote batch (1.5 s) therefore moves the receiver to page 1 and rebuilds the canvas under any inline text editor or selection. Unlike `undo`, `applyRemoteOperation` does not call `validateSelectionAfterRestore`.
- **Expected behavior:** A remote op applies to the live document without dropping local work, and the viewer stays on their page.
- **Root cause:** Remote apply reuses the undo-restore path (a snapshot import) instead of mutating the live tree.
- **Affected modules:** Live co-editing, inline text editing, selection and inspector, page navigation.
- **Recommendation:** Call `flushPending()` (broadcasting the local op) before applying. Apply element-level mutations instead of `importProject`. Preserve the active page and selection.
- **Status:** VERIFIED (lost edit by unit PoC; page reset statically). NOT RUNTIME VERIFIED in a browser.

#### A16-4 — Ops can be skipped forever or applied out of causal order: sequence-gap polling plus unordered client sends (flag-off)
- **Severity:** P1 (flag-off; silent permanent divergence).
- **File:** `server/services/collab.service.ts:21-48`; `prisma/schema.prisma:1518` (`seq Int @default(autoincrement())`); `packages/dashboard/app/api/sse/collab/[siteId]/route.ts:52-63`; `packages/editor/src/engine/collaboration/SSETransport.ts:86-99`
- **Symbol:** `getCollabOpsSince`, the SSE `poll`, `SSETransport.send`
- **Evidence:**
  - Each op is a separate autocommit `INSERT` that draws from a global sequence.
  - The poll reads `seq > lastSeq` and then sets `lastSeq = o.seq`. If insert #101 commits after #102, a poll between the two commits delivers 102 and advances past 101, which is never streamed to that client.
  - Cursor events alone are about 20 inserts/s per moving user, so concurrent inserts are routine.
  - On the client, each `send` is an independent `fetch`, not awaited or chained. Two quick local ops can reach the server, and be sequenced, in reverse. Their positional patches (A16-2) then apply to the wrong base on peers.
- **Expected behavior:** Every op is delivered exactly once, in an order consistent with each author's causal order.
- **Root cause:** A DB sequence is treated as a commit-ordered log.
- **Affected modules:** Live co-editing.
- **Recommendation:**
  - Stream by a commit-safe watermark. Options: only deliver `seq` below the oldest in-flight transaction's position; allocate `seq` from a per-site counter row updated in the same transaction (serialised per site); or re-scan a trailing window and dedup by id.
  - Serialise sends per client, and have the server reject a per-client sequence out of order.
- **Status:** PARTIAL (static; race not exercised). NOT RUNTIME VERIFIED.

#### A16-5 — Join and every auto-reconnect replay the full 24 h log, and replayed historic `sync_request`s trigger a snapshot storm (flag-off)
- **Severity:** P1 (flag-off). Confirms A07-2 and A07-3 and extends them with the amplification.
- **File:** `SSETransport.ts:28,42,46-54`; `sse/collab route.ts:26-27,37-45`; `collab.service.ts:79-83` (`hasResyncGap` returns false for `since<=0`); `CollaborationManager.ts:145-185,560-594,725-760`
- **Symbol:** `SSETransport.connect`, `CollaborationManager.handleSyncRequest`
- **Evidence:**
  - `lastSeq` starts at 0, and the URL is fixed when the `EventSource` is constructed. The `hello` payload `seq` is ignored, and EventSource auto-reconnect reuses the URL.
  - The server replays every retained row for the site.
  - Replayed `sync_request` events come from *older* session userIds, so the "ignore own events" check (`:560`) does not filter them. `isHost()` is true on every client (`joinRoom` sets `host: userId`), so the joiner answers **each** historic `sync_request` with a fresh `exportProject()` POST. Every connected peer imports every one of those `sync_response`s (`:743-760`).
  - K earlier joins today therefore cost K full-project rows per join, plus K imports on every peer.
  - Replayed `operation`s re-apply onto a project that already contains them (duplicate `add`s, wrong `remove`s). Replayed `join`s resurrect ghosts.
- **Expected behavior:** The joiner's baseline is the project it loaded, and replay starts at `hello.seq`. State sync is never peer-to-peer.
- **Root cause:** The design of the earlier in-memory, host-based transport was carried over to a durable, replaying DB log.
- **Affected modules:** Live co-editing, DB size, autosave (the corrupted state is saved on the next local edit).
- **Recommendation:** Seed `lastSeq` from `hello`. Emit `id: <seq>` and honour `Last-Event-ID`, or rebuild the URL on reconnect. Delete `sync_request`/`sync_response` from the DB transport. Keep presence out of the durable log.
- **Status:** VERIFIED statically. NOT RUNTIME VERIFIED.

#### A16-6 — The collab op channel lets any site EDITOR pollute `Object.prototype` in every connected collaborator's browser and forge presence or state (flag-off client; server route live)
- **Severity:** P1. It becomes **P0 — IMMEDIATE FIX REQUIRED on flag flip**: a cross-user client-integrity attack reachable by a lower-trust collaborator, including a client-role invitee with EDITOR. It is P1 today because a production client never connects, so there is no victim.
- **File:** `packages/dashboard/app/api/collab/[siteId]/ops/route.ts:22-33`; `packages/editor/src/engine/utils/JsonPatch.ts:199-259,329-338`; `CollaborationManager.ts:558-594`
- **Symbol:** `POST /api/collab/:siteId/ops`, `applySingleOperation`, `handleTransportMessage`
- **Evidence:**
  - The route stores `body.op` verbatim. The only checks are `clientId` and `op != null`: no schema, no size cap, no binding between the event's `userId` and the session.
  - On receivers, `applyPatch` walks path segments with plain property access and no key guard.
  - PoC 1 used the real `applyPatch`: `add /__proto__/polluted` leaves `({}).polluted === "yes"`.
  - The same channel lets any EDITOR post `leave` or `cursor` events under another user's id, or a `sync_response` that every peer imports. It passes `ProjectDataSchema` and `sanitizeElementTreeContent`, so the injected HTML is sanitised, but the whole canvas is replaced.
- **Expected behavior:** The server validates events against a strict schema and binds identity to the session. The client patcher rejects prototype keys.
- **Root cause:** The op is treated as "opaque to the server", with a hand-rolled JSON-pointer walker.
- **Affected modules:** Live co-editing and every editor module running in the polluted realm.
- **Recommendation:**
  - Validate with a Zod discriminated union (`packages/shared/schemas`), cap the size, and set `userId := authorId` server-side.
  - Reject the `__proto__`, `constructor` and `prototype` segments in `parseJsonPointer`/`applySingleOperation`.
  - Rate-limit the POST.
  - Return 404 from both collab routes unless a server-side flag is on (overlap F).
- **Status:** VERIFIED (pollution by unit PoC on real code; forging statically). NOT RUNTIME VERIFIED end to end.

#### A16-7 — In collab mode undo reverts peers' edits, is never broadcast, and stops working after 100 ops (flag-off)
- **Severity:** P1 (flag-off).
- **File:** `engine/HistoryManager.ts:298-330` (`recordForCollaboration`: no `patchesSinceCheckpoint`, never checkpoints), `:613-630` (`trimHistory`), `:386-418` (`reconstructState`), `:459-503` (`undo`)
- **Symbol:** `recordForCollaboration`, `trimHistory`, `undo`
- **Evidence:**
  - This confirms A07-4. Remote ops add no undo entry, and `undo()` restores `reconstructState(n-1)`, which is built only from local entries. Peers' edits vanish locally, and the restore is not broadcast.
  - It adds a defect: `recordForCollaboration` pushes patches but never checkpoints. When the stack exceeds `HISTORY_MAX_SIZE` (100, `config.ts:108`), `trimHistory` shifts the "loaded" checkpoint off and calls `reconstructState(0)` on a stack with no checkpoint. That returns `{}` (or the tail), which becomes the new base.
  - PoC 3 used the real class: after 105 ops, `checkpoints: 1`, the base snapshot is `{}`, and `no checkpoint found at targetIndex 0` is logged.
  - Every later undo reconstructs from `{}`. Applying `/pages/0/…` then throws, so `undo` bails with "state shape diverged" and ⌘Z silently does nothing.
- **Expected behavior:** Undo inverts only the user's own op, transformed against later remote ops, and broadcasts the inverse. History remains reconstructible.
- **Root cause:** A single-user snapshot undo on a multi-writer document; the collab record path skipped the checkpoint cadence.
- **Affected modules:** Undo/redo, live co-editing.
- **Recommendation:** Keep the checkpoint cadence in `recordForCollaboration`, and fix `trimHistory` to snapshot *before* shifting. Before enabling collab, implement per-user selective undo, or disable undo across remote ops.
- **Status:** VERIFIED (unit PoC for the checkpoint loss; revert statically).

#### A16-8 — CMS entries and component masters: collaborators' edits never arrive in an already-hydrated browser, and stale full-record upserts silently revert them and resurrect deleted rows (production)
- **Severity:** P1. This is a production lost update and deletion reversal across users and devices. It is not rated P0 because it needs two users (or devices) working on the same collection or component, and the loss is per record.
- **File:**
  - `packages/editor/src/services/cmsSync.ts:105-167` (`hydrateCmsFromServer`: `if (localIds.has(rc.id)) continue;`), `:201-230` (`syncEntryUpsert`/`syncEntryDelete`)
  - `packages/editor/src/services/componentSync.ts:84-100` (same skip)
  - `server/services/cms.service.ts:34-60,83-102` (upsert by id, full `data`/`fields`, no version)
  - `server/services/site-component.service.ts:13-31` (upsert, full payload)
- **Symbol:** `hydrateCmsFromServer`, `hydrateComponentsFromServer`, `upsertEntry`, `upsertCollection`, `upsertSiteComponent`
- **Evidence:**
  - Hydrate is "ADDITIVE — only collections whose id isn't already local are written" (the docblock at `:60-64`, confirmed by the `continue`). Entries of an existing local collection are never re-read, so a browser that has opened the site before never sees another member's new or changed entries or collection-field changes.
  - Each local change mirrors the **entire** record (`data: item.data`, `fields: c.fields`, `payload`) through `upsert({ where: { id } , create…, update… })`. Nothing compares `updatedAt`, so a stale local copy overwrites the other member's fields wholesale.
  - Because it is an upsert, editing a locally cached entry or component that the other member **deleted** re-creates it.
  - `SyncRetryQueue` keeps the latest payload per target and replays it on `online`, which extends the overwrite window.
  - Neither CMS nor component masters are part of `ProjectData` (`Composer.exportProject` `:670-693`), so even live collab would not carry them.
- **Expected behavior:** Server rows are the source of truth, and a write based on a stale copy is rejected or merged per field. Deletes are tombstoned.
- **Root cause:** IndexedDB-first design with a best-effort mirror, built for one user across devices rather than several writers.
- **Affected modules:** CMS panel and records modal, dynamic CMS pages at publish (`appendDynamicPagesToPublish` reads server entries), Components library, instances on canvas.
- **Recommendation:** Hydrate every row with `updatedAt` reconciliation, where the newer copy wins locally. Send `expectedUpdatedAt` and return a conflict on mismatch. Use `update` rather than `upsert` for ids that already existed (so a server delete wins), or add tombstones. Surface conflicts in the Content tab.
- **Status:** VERIFIED statically. NOT RUNTIME VERIFIED.

### P2

#### A16-9 — Live-session scope gaps: version restore, conflict reload, component, CMS and site-column changes are not replicated, so later ops apply to a different base (flag-off)
- **File:** `engine/VersionTimelineManager.ts:280-313`; `HistoryManager.ts:135-162` (the `PROJECT_LOADED` reset); `Composer.exportProject` `:670-693`
- **Evidence:**
  - Restore calls `importProject(snapshot)` outside `isRestoringFromHistory`, so HistoryManager resets to a new "loaded" checkpoint and broadcasts nothing.
  - The restorer's next `recordForCollaboration` diffs against the restored document. Its paths are meaningless on peers who never restored, and A16-2 applies them verbatim.
  - The same happens after ConflictModal's "reload" path and after an incoming `sync_response`.
- **Severity:** P2 (flag-off).
- **Recommendation:** Model restore and reload as a server-side "reset to version V at seq S" event that forces every peer to reload. Keep masters, CMS and site columns out of the live claim, or give them invalidation events.
- **Status:** VERIFIED statically.

#### A16-10 — The collab SSE route can poll the DB forever and has no heartbeat or buffering control
- **File:** `packages/dashboard/app/api/sse/collab/[siteId]/route.ts:51-83`, compared with `sse/publish/[jobId]/route.ts:13,63-100,108` and `sse/notifications/route.ts:37-58`
- **Evidence:**
  - The poll's `catch { /* transient DB error — keep polling */ }` also swallows the `enqueue` TypeError thrown after the client has gone. The interval is cleared **only** on `req.signal` `abort`. There is no `cancel()` on the `ReadableStream`, no lifetime cap and no heartbeat.
  - The publish route has a 10-min cap, clears on any error and sets `X-Accel-Buffering: no`. The notifications route sends a heartbeat.
  - Production is cPanel/LiteSpeed. If `abort` is not delivered, each abandoned tab keeps a 1.5 s query loop alive. Without a heartbeat, idle proxies cut the stream, and each reconnect replays from 0 (A16-5).
- **Severity:** P2 (the route is live in production regardless of the flag). Overlap E.
- **Recommendation:** Copy the publish route's lifecycle: cap, clear on error, `cancel()`, heartbeat comment, `X-Accel-Buffering: no`.
- **Status:** PARTIAL (static; the abort behaviour under the production adapter is NOT VERIFIED).

#### A16-11 — Access revocation is not enforced on a live stream, and the client cannot tell "revoked" from "dropped"
- **File:** `sse/collab/[siteId]/route.ts:16-24`; `SSETransport.ts:67-75`; `StudioHeader.tsx:848`
- **Evidence:**
  - The role is checked once, before the stream opens. The poll never re-checks.
  - A removed or demoted member keeps receiving ops, including whole-project `sync_response` payloads, until the connection ends.
  - On reconnect, the 403 makes the EventSource close for good. The client maps that to a generic disconnect and re-offers "Start collaboration".
  - POSTs *are* re-checked per op (`ops/route.ts:13-19`), so revoked users can read but not write.
  - Combined with A07-1 (the stale `roleOverride` P0), a demotion may not revoke anything at all.
- **Severity:** P2 (flag-off client). Overlap F.
- **Recommendation:** Re-check `checkSiteRole` every N polls (or on a membership-version bump), send `event: revoked` and close, and show a revoked state client-side.
- **Status:** VERIFIED statically.

#### A16-12 — Reconnect and resync lifecycle: `resync` has no handler (so the stream loops), `connect()` leaks a second stream, and reconnect does not re-announce presence
- **File:** `SSETransport.ts:36-78`; `sse/collab route.ts:41-45`; `CollaborationManager.ts:780-783`; `StudioHeader.tsx:848`
- **Evidence:**
  - This confirms A07-10. The transport has only `hello`/`op`/`onerror` listeners.
  - A server `resync` followed by `close()` makes the EventSource reconnect to the same URL, which resyncs again. The loop repeats about every 3 s, and `hello` flips the state to "connected" each time without any op flowing.
  - `connect()` assigns `this.es` without closing the previous stream.
  - `handleReconnect` only sets the state. It sends no `join`, so peers who joined meanwhile never learn this user exists.
- **Severity:** P2 (flag-off).
- **Recommendation:** Handle `resync` (reload the project, then set `lastSeq` to head). Make `connect` idempotent. Re-join on reconnect.
- **Status:** VERIFIED statically.

#### A16-13 — There is no outbound durability or offline queue for ops
- **File:** `SSETransport.ts:86-99`
- **Evidence:**
  - This confirms A07-11. `void fetch(...).catch(() => {})` catches only network failures. A 403 or 500 resolves the promise and is never inspected.
  - The comment "SSE resync on reconnect covers gaps" is false for outbound ops. They were never stored, so no replay can recover them.
  - `cmsSync`/`componentSync` use `SyncRetryQueue`; the op channel has nothing equivalent.
- **Severity:** P2 (flag-off).
- **Recommendation:** Use an ordered per-client outbox with retry and backoff, check `res.ok`, and show a "changes not synced" state.
- **Status:** VERIFIED statically.

#### A16-14 — Presence is durable, un-expiring and client-asserted
- **File:** `CollaborationManager.ts:145-221,255-284,597-620,806-808`; `useCursorSync.ts:67-129`; `Composer.ts:354-376`
- **Evidence:**
  - This confirms A07-12 and A07-22. There is no heartbeat, and `lastActive` is never used to expire a user.
  - `leave` is sent only from `leaveRoom` (on `destroy`), using a normal `fetch` rather than `keepalive`/`sendBeacon`. There is no `pagehide` hook.
  - Cursor positions are canvas-pixel coordinates, not document coordinates.
  - Selection is broadcast on every selection change. No consumer exists for selection, editing or lock events, and `notifyEditing`/`acquireLock` have no callers.
- **Severity:** P2 (flag-off). Performance overlap E.
- **Recommendation:** An ephemeral presence channel (not the durable log) with a heartbeat and a TTL, server-assigned identity, and document-space cursors.
- **Status:** VERIFIED statically.

#### A16-15 — Two live collaborators trip each other's `SAVE_CONFLICT`, and "Overwrite" is a full-snapshot LWW that deletes pages
- **File:** `useComposerInit.ts:497-677`; `BuildrikSyncProvider.ts:334,405-446`; `sites.service.ts:594-744`
- **Evidence:**
  - This confirms A07-13. Receivers never autosave remote ops: `importProject` sets `dirty=false` and emits only `project:loaded`, which autosave does not subscribe to.
  - Authors save the whole project against their own `_baselineLastEditedAt`, so once A saves, B's next save conflicts.
  - Overwriting deletes pages absent from B's snapshot. The underlying check is non-atomic (A07-6, production).
- **Severity:** P2 (flag-off). The production race is A07-6 (P1).
- **Recommendation:** While a session is live, have a single persistence authority: the server applies ops and saves, or one elected saver.
- **Status:** VERIFIED statically.

### P3

#### A16-16 — `sites.saveProjectData` is a second full-project write door with no optimistic check
- **File:** `server/trpc/routers/sites.ts:585-600` → `saveProjectData(input)` (no `expectedLastEditedAt`), `sites.service.ts:603` (`if (expectedLastEditedAt && …)` skips the check)
- **Evidence:** Grep finds no caller in `packages/dashboard`, `packages/editor/src` or `packages/shared`, only comments. Any EDITOR can call it directly and replace every page with no conflict detection.
- **Severity:** P3 (latent).
- **Recommendation:** Delete it, or make `expectedLastEditedAt` required.
- **Status:** VERIFIED statically.

#### A16-17 — The collab tests cover none of the runtime failure modes
- **File:** `packages/editor/src/engine/collaboration/__tests__/{OTEngine,CollaborationManager}.test.ts`, `__tests__/collab-service.test.ts`
- **Evidence:**
  - 24 of 24 pass.
  - `OTEngine.test.ts` asserts only `bPrime`, so the untransformed `aPrime` (A16-2) is invisible to it.
  - `SSETransport` has no test.
  - No test covers two-client convergence, replay or seeding, ordering, reconnect, revocation, remote-apply against the coalesce window, or the settings mirror under conflict.
- **Severity:** P3. Overlap G.
- **Status:** VERIFIED (ran).

---

## Good as-is
- **Op POST authorisation** re-checks `checkSiteRole(EDITOR)` on every op (`ops/route.ts:13-19`). A revoked user cannot write through the collab channel.
- **Remote content is sanitised:** every remote apply and `sync_response` goes through `importProject`, which runs `sanitizeElementTreeContent` on every page tree (`Composer.ts:609-617`). `sync_response` is also `ProjectDataSchema`-validated (`CollaborationManager.ts:746-751`).
- **Prune and resync logic** is sound as far as it goes. `hasResyncGap` correctly tells a pruned checkpoint from an intact one (`collab.service.ts:79-83`), the prune cadence is deterministic, and both are unit-tested. The client simply never uses them (A16-5, A16-12).
- **Autosave single-user hygiene:**
  - The `changeSeq` guard prevents a stale in-flight save from clearing the dirty state (`useComposerInit.ts:503-560`).
  - A refused save is not reported as a failed one.
  - `undo()` flushes the coalesce window first (`HistoryManager.ts:459-465`).
- **CMS and component mirrors** at least queue failed writes for retry and surface them. It is not a silent drop (`cmsSync.ts:28-55`).
- **Flag discipline on the client:** both collab entry points are behind the same flag (`StudioHeader.tsx:225,848`, `useCanvasCommandPalette.ts:326`).

## Product decisions required
1. **Live co-editing strategy.** A16-2 to A16-7 show that the op format (positional snapshot diffs), the ordering (DB sequence without commit order), the transform (none on the remote side) and the undo model are each individually incorrect. Decide whether to continue the custom log or move to a CRDT or server-authoritative model **before** any work on the existing engine. Patching it is not recommended.
2. **Single writer for site settings.** Is the Site row (dashboard) or the editor's `projectSettings` authoritative for the site columns (A16-1)? Today both write whole records.
3. **Multi-user CMS and components.** Are they multi-user resources (which needs server-first reads and conflict detection) or per-user local libraries (which should then be labelled as such)? (A16-8)
4. **Presence without live editing.** Should production get an ephemeral "someone else is editing" heartbeat, independent of the op log? (Links to A07-14.)

## Overlaps with other audits
- **F (security):**
  - A16-6 (prototype pollution and forged events through an unvalidated op channel).
  - A16-11 (read after revocation).
  - A16-10 (routes live in production despite the flag).
  - A07-1 (a stale `roleOverride` means demotion may not revoke collab access).
- **E (architecture/performance):**
  - A16-10 (polling-loop leak).
  - Cursor rows in the durable log (A16-14).
  - Every recorded op carries a `/metadata/updatedAt` replace, because `exportProject` stamps `new Date()` (`Composer.ts:675-678`), so there are no truly empty patches.
  - Full-project `importProject` on every remote batch.
- **G (tests):** A16-17. Minimum tests are listed in the handoff.
- **Single-user undo (E/G):** `trimHistory` (`HistoryManager.ts:613-630`) rebuilds a replacement checkpoint with `reconstructState(0)` *after* shifting, when no checkpoint precedes index 0. In single-user mode this happens whenever the shifted checkpoint is followed by a patch. The base then becomes `{}` or the tail snapshot. It is not collab-specific, so it was not rated here.
- **Publish (G/B):** publish during editing publishes the caller's `input.pages` (A07-17).

---

## AUDIT HANDOFF
- **Agent / Prompt:** D, Collaboration & Realtime / Prompt 16: Collaboration Runtime, Sync & Conflict
- **Report:** `docs/audits/2026-09-25-full-audit/16-collaboration-runtime.md`
- **Counts:** P0 = 1 · P1 = 7 · P2 = 7 · P3 = 2
- **P0:**
  - **A16-1:** the autosave site-columns mirror (`siteDetail.settings.update`) is a full-record, unversioned write. It is dispatched in parallel with the conflict-checked project save and also runs when that save is refused. Any open editor tab silently reverts site name, SEO, OG, custom code and password edits made elsewhere. Production, IMMEDIATE FIX REQUIRED.
- **P1:**
  - A16-2: no remote transform, and positional patches cause wrong-element corruption and non-convergence (PoC). Flag-off.
  - A16-3: remote apply erases the coalesce-window edits (PoC) and resets the page and tree. Flag-off.
  - A16-4: sequence-gap polling plus unordered sends skip or reorder ops. Flag-off.
  - A16-5: replay from 0 plus the historic `sync_request` snapshot storm. Flag-off.
  - A16-6: prototype pollution and forged events through the unvalidated op channel (PoC). Flag-off; P0 on flip.
  - A16-7: collab undo reverts peers and dies after 100 ops (PoC). Flag-off.
  - A16-8: CMS and component mirrors give lost updates and resurrect deletions. **Production.**
- **P2:** A16-9 to A16-15.
  - A16-9: restore and reload are not replicated.
  - A16-10: SSE poll leak, no heartbeat.
  - A16-11: no revocation on a live stream.
  - A16-12: resync loop, leaked stream.
  - A16-13: no outbox.
  - A16-14: presence ghosts.
  - A16-15: collaborators conflict on save.
- **P3:**
  - A16-16: `sites.saveProjectData` has no conflict check.
  - A16-17: no runtime-mode tests.
- **Runtime verified:**
  - Unit level only, against real functions and classes: A16-2 (JsonPatch and OTEngine), A16-3 (lost coalesced edit), A16-6 (pollution), A16-7 (checkpoint → `{}`).
  - Collab unit suite: 24 of 24 pass.
  - No DB, browser or multi-client run.
- **NOT RUNTIME VERIFIED:**
  - A16-1 end to end.
  - A16-4 commit-order race.
  - A16-5 replay and storm.
  - A16-8.
  - A16-10 stream lifetime on cPanel/LiteSpeed.
  - A16-11 to A16-15.
  - The production value of `NEXT_PUBLIC_FEATURE_COLLAB`.
- **Dependencies:**
  - A16-1 needs product decision 2. Fix it before any work that increases multi-admin editing.
  - A16-2 to A16-7 and A16-9, A16-12 to A16-15 share one redesign (product decision 1). Fixing them piecemeal is not advised.
  - A16-6's server-side validation and flag-gating of the routes should land now, independent of the redesign, because the routes are live in production.
  - A16-8 needs product decision 3.
  - A07-1 (P0, Prompt 7) affects A16-11.
- **Required tests (for G):**
  - A conflicting save must not call `settings.update` (A16-1).
  - Two-client convergence for delete-vs-edit and concurrent text (A16-2).
  - Remote apply inside the coalesce window keeps the local edit (A16-3).
  - An `SSETransport` seed from `hello`, and reconnect with the latest `since` (A16-5).
  - `applyPatch` rejects `__proto__` (A16-6).
  - Collab-mode undo after more than 100 ops (A16-7).
  - A stale CMS entry upsert is rejected (A16-8).
  - The SSE route clears its interval on an enqueue failure (A16-10).
- **Inventory corrections:**
  - `OTEngine` does not transform incoming ops at all (this also corrects A07-5's mechanism).
  - Auto-reconnect replays from `since=0` instead of looping on `resync` (as A07 already noted). The resync loop needs a second `connect()`.
- **Suggested next owners:**
  - **F:** A16-6, A16-11, collab route flag-gating.
  - **E:** A16-10, A16-14 performance.
  - **G:** the tests above.
  - **Orchestrator:** product decisions 1 to 4. Merge A16-1 into the fix batch with A07-6 (same save path).
