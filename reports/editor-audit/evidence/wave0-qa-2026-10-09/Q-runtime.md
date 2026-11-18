# Q: CMS Wave 0 fixes, live QA (2026-10-09)

- **Commit:** `2a510f7c1` (branch `fix/cms-wave0`, merge of lanes a/b/c), in worktree `~/Desktop/buildrik-worktrees/cms-wave0`. No code was changed. `git status` stayed clean. `.env.local` and `packages/dashboard/.env.local` were created as symlinks to the main repo's root `.env.local`; they are gitignored and were left in place.
- **Server:** `npx next dev --turbopack -p 3620` from `packages/dashboard`, with `NEXT_PUBLIC_APP_URL`, `AUTH_URL` and `NEXTAUTH_URL` set to `http://localhost:3620`, against local Postgres. It was stopped at the end, and port 3620 is free.
- **Browser:** Playwright Chromium (from the dashboard's `@playwright/test`), headless, 1440×900.
  - Profile A (CDP 9461) and profile B (CDP 9462) were driven by `launch.mjs` and `lib.mjs` (adapted from the reaudit run). Both profiles were deleted afterwards.
  - The launcher aborts `sites.publish`, `rollback` and `schedulePublish` at the network layer. Both network logs have **0** publish/rollback/schedulePublish requests and 0 ABORTED-PUBLISH lines. The Publish confirm was opened 3 times and closed each time with Cancel or Escape.
- **Account:** qa@buildrik.local, workspace `cmpa9oi4n0001wrjuvh7j2h8m`. The password was read from `docs/plans/cms-c1-evidence/helpers.mjs` at runtime and is not written here.
- **Site:** `cmv0wohsf0008we4z1424ogua` "cms-wave0-qa-115232", created with `sites.create` (blank).
  - Collection Posts `mv0ws8fd-39hulke`, made in the wizard: title, views (number), body (rich text), slug.
  - 60 records came from a UI CSV import (`import60.csv`, synthetic data). All 60 were then published with direct `cms.entries.upsert` calls from the page, which is the accepted setup shortcut.
  - Template page "Post template" `page-mv0yaojc-2i3cx7reg5`. Dynamic pages use the pattern `{slug}`.
- **Cleanup:** `sites.delete` with confirmName returned 200. The site is in `sites.listDeleted` and not in `sites.list` (soft delete). See `cleanup.json`.
- **Evidence:** `shots/*.png`, `net-profileA.log`, `net-profileB.log`, `console-profile*.log`, `server.log`, and the scripts `s*.mjs`, `e*.mjs`, `reg*.mjs` and `n1.mjs`, all in this folder.

## Results

| Fix | Result | Evidence | Notes |
|---|---|---|---|
| **EDT-002** (P0) two tabs, one profile | **PASS** (see caveat in New-1) | e2-01-tab2-conflict.png, e2-02-tab2-keep-mine.png; net-profileA 12:45:58–12:46:04, 12:48:22 | <ul><li>Tab 1 saved "CSV post 58 TAB1" → 200, updatedAt 12:46:00.448.</li><li>Tab 2 (stale form, body edit) sent `expectedUpdatedAt: 11:57:48.492Z`, the **old** stamp → `400 CMS_CONFLICT:12:46:00.448Z`. The sheet showed "Someone else changed this record · Keep mine / Use theirs".</li><li>Server after the conflict: title "CSV post 58 TAB1", body unchanged.</li><li>Keep mine sent `expectedUpdatedAt` = the conflict's stamp (12:46:00.448) → 200. Server: body "…bold T2BODY", title = tab 2's copy. That is Keep-mine semantics.</li><li>**Caveat:** a page-level "This site changed somewhere else" modal sat over the sheet, so the Keep mine button had to be DOM-clicked. See New-1.</li></ul> |
| EDT-002 offline replay | **PASS** | e2-03-offline-save.png, e2-04-after-replay.png; net-profileA 12:49:11–12:49:55 | <ul><li>Offline save of "CSV post 57 OFFLINE" was queued: "Saved on this device only". The outbox entry carries `base`.</li><li>The page was reloaded with upserts still blocked (and failing), then unblocked.</li><li>The replay sent `expectedUpdatedAt: 11:57:47.736Z`, the version the edit was made against, on every attempt → **200**, no CMS_CONFLICT. The outbox emptied (`{}`) and the server has the OFFLINE title.</li></ul> |
| EDT-002 regression: cross-profile conflict | **PASS** | e2-06-crossprofile-B.png; net-profileB 13:00:21–13:00:23 | <ul><li>A saved "CSV post 55 PROFILE-A".</li><li>B (stale) sent the old stamp 11:57:46.069 → `400 CMS_CONFLICT:13:00:17.675Z`. B got the Keep mine / Use theirs bar.</li><li>The server kept A's title.</li></ul> |
| **EDT-021** `_skipTouchCmsEdited` | **PASS** | s2.mjs output | <ul><li>Raw `cms.entries.upsert` with `_skipTouchCmsEdited: true` → 200.</li><li>`sites.get.cmsEditedAt` moved from 11:56:11.555Z (after the CSV import) to **11:56:38.989Z**.</li><li>CSV import still works: "Imported 60 of 60 rows", and cmsEditedAt advanced on import (11:55:28 → 11:56:11).</li></ul> |
| **EDT-022** `cms.generateDynamicPages` | **PASS** | s2.mjs output | GET and POST both return `404 NOT_FOUND "No procedure found on path cms.generateDynamicPages"`. The control `cms.collections.list` returns 200. |
| **EDT-007** drawer close guard | **PASS** | e7-01-close-x-dialog.png, e7-02-after-keep.png, e7-03-rail-dialog.png, e7-04-after-discard.png, e7-05-after-rail-discard.png | <ul><li>Drawer ✕ "Close CMS" with a dirty title opens "Unsaved changes · Leave and lose changes / Keep editing". Keep editing keeps the sheet and "CSV post 59 DIRTY".</li><li>The active CMS rail icon gives the same dialog. Keep editing keeps the text there too.</li><li>Leave and lose changes, through either the ✕ or the rail icon, closes the drawer. Reopening shows "CSV post 59", and the server is unchanged.</li><li>A clean close shows no dialog.</li></ul> |
| **EDT-017** toast under modal | **PASS** | e17-01-publish-with-toast.png; e17/e17b output | <ul><li>"Some content changes didn't sync" toast visible, Publish confirm open.</li><li>`elementFromPoint` at Cancel's centre (782,559) = the Cancel BUTTON.</li><li>At the toast's centre the hit is `overlay-scrim`, so the toast sits under the scrim. The screenshot shows it dimmed.</li><li>At 1440×900 the toast and Cancel do not overlap geometrically, so the original covering is proven by stacking, not by an overlap.</li></ul> |
| **EDT-018** Restore / Retry closes the prompt | **PASS** (but see New-2) | e18-01-after-restore.png, e18-03-after-retry.png, e18-05-after-retry-banner.png; net-profileA 12:51:04, 12:53:04, 12:54:20 | <ul><li>Save failed, then reload → "Some work never reached the server · Restore my edits".</li><li>Clicking Restore closed the toast. The next `saveProject` → **200**, topbar "Saved", and no toast 8 s later.</li><li>The Retry path was tested twice, once with the topbar "Save failed — retry" and once with the banner "Retry save". Both closed the restore toast, the save → 200, and nothing remained 8 s later.</li></ul> |
| **EDT-003** pinned oldest of 60 | **PASS** | e3-01-pinned-oldest.png, e3-03-prepublish-loaded.png; ppc.mjs output | <ul><li>A heading pinned to CSV post 01, the oldest of 60 published records: the canvas shows "CSV post 01".</li><li>The Inspector shows "CSV post 01 (record 60 of 60)".</li><li>`prePublishChecks`: "pass: CMS bindings — Every bound element has a value".</li><li>The pre-publish dialog shows 3 warnings (SEO, domain, favicon) and no binding warning.</li></ul> |
| **EDT-056** template slug change | **PASS** | e56-01…04 png; e56.mjs output | <ul><li>Slug `post-template` → `article-template`:<ul><li>Dynamic pages stays "Ready · 60 complete records will get a page".</li><li>The template select reads "Post template".</li><li>"+60 from collections" is unchanged.</li><li>`cms.collections.list` pageTemplatePath = **article-template.html**.</li></ul></li><li>⌘Z: the page slug goes back to `post-template`, and both the local and the server collection are back to `post-template.html`. Still Ready, still +60.</li></ul> |
| **EDT-057** template delete confirm | **PASS** | e57-02-template-delete-dialog.png, e57-05-plain-delete-dialog.png, e57-04-after-undo.png | <ul><li>Template page: "Delete "Post template"? … It is the template for Posts — its 60 record pages stop publishing. Undo (⌘Z) brings it back."</li><li>Another page ("About QA"): the plain "This page and everything on it is removed. Undo (⌘Z) brings it back."</li><li>⌘Z restored the template page (same id). The collection kept `post-template.html`.</li><li>Home's Delete is disabled.</li></ul> |
| Regression: bind + live title | **PASS** | reg-01-live-title.png | Saving the record as "CSV post 01 LIVE" changed the bound heading to "CSV post 01 LIVE" right away. |
| Regression: EDT-001 rich-text key rename | **PASS** | reg-02-key-renamed.png; net 13:03:21 | <ul><li>Renaming `body` → `content` sent `collections.upsert` first, then 60 `entries.upsert` → all 200.</li><li>Server: 60 of 60 records have `<strong>` in `content`, and 0 still carry `body`.</li></ul> |
| Regression: EDT-006 bind-only autosave | **PASS** | reg-03-bind-only-after-reload.png; net 13:04:18 | Changing only the Record select (to CSV post 02) fired `saveProject` → 200. After reload the binding is `Posts.title@cmv0wt4g8…` (CSV post 02). |

**Blocked:** none. **Failed:** none of the 10 fixes.

## New problems noticed

### New-1: a record-only save also saves the project, so a second editor gets a site-wide conflict modal on top of the record conflict (proposed P1)
- **Repro:**
  1. Open the same record in two tabs, or in two profiles.
  2. In A, edit the title and save.
  3. In B, edit another field and save.
- **Actual:**
  - Every record save is followed by `sites.saveProject`; see net-profileA 13:00:19.685 right after the upsert at 13:00:17.
  - B's save is then followed by `saveProject → 409 SAVE_CONFLICT:13:00:19.719Z` (net-profileB 13:00:23.103).
  - B gets the blocking "This site changed somewhere else · Reload latest / Save a backup / Overwrite…" modal, with the topbar showing "Conflict — reload". Neither user touched a page.
  - The modal's scrim covers the record sheet's **Keep mine / Use theirs** bar. `elementFromPoint` on Keep mine returns `overlay-scrim`, and a real click times out. The user has to resolve a page-level conflict before the record conflict that actually happened can be reached.
  - Seen both same-profile (e2-01) and cross-profile (e2-06).
- **Expected:** a record save should not move the project version, or the page-level check should ignore a CMS-only change.

### New-2: "Retry save" after a reload silently throws away edits made after the reload (proposed P1, data loss)
- **Repro:**
  1. Block `sites.saveProject`, add a Divider and let the save fail.
  2. Reload, with the block still on. The "Restore my edits" toast and the "Couldn't save … Retry save" banner appear immediately, before any edit.
  3. Add a Button.
  4. Unblock and click **Retry save**.
- **Actual:**
  - The canvas is replaced with the off-screen copy. The Divider comes back and the **Button is gone** (`e3` → `e4` in `n1.mjs` output).
  - It is still gone after reload (`e5`; n1-after-retry.png, n1-after-reload.png).
  - No warning appears. The "Button selected" toast keeps referring to the removed element.
  - The same happened in the e18b/e18c runs: only the pre-reload paragraphs survived.
- **Note:** this follows from EDT-018's "a manual Retry restores it first". The banner says "Your changes are still here … retry saving", which promises the opposite of what happens.

### New-3 (minor): the "Couldn't save … Retry save" banner and "Save failed — retry" appear right after a reload when nothing on screen failed
- After a reload that follows a failed save, the banner shows with no save attempt in the network log (12:49:22 onwards and the t1 snapshots).
- After a successful CMS outbox replay (12:49:55) it stayed until Restore was clicked (e2-05-peek.png).

### New-4 (minor, dev only): React warning `Each child in a list should have a unique "key" prop … RecordsTable`
- Shows as the Next "1 Issue" badge (console-profileA 11:56:12, 12:37:54).

### Observations (not defects of these fixes)
- One transient `cms.publishSnapshot` 500 (Prisma `mediaAsset.findMany`) at 12:00:20, while the machine was under load and requests later failed with `ERR_NETWORK_IO_SUSPENDED`. The next call at 12:36 returned 200. Treated as environmental.
- The Publish confirm opens with CMS changes still unsynced (e17). It is not blocked, the same as before. Not in scope.

## Harness notes
- `openCms` and Playwright `isVisible()` report the closed CMS drawer as visible, because it stays mounted off-screen. Detection was switched to `elementFromPoint`.
- A failed first EDT-002 attempt left an extra tab open. It was found and closed. The EDT-002 result comes from the second, clean attempt.
- Keep mine in EDT-002 was triggered with a DOM click because of New-1. The network result (200, the conflict's stamp as precondition) is genuine.
