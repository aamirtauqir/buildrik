# D — CMS runtime walkthrough (track D)

- **Commit:** `7a50e34e1`. Run from the worktree `~/Desktop/buildrik-worktrees/editor-live-audit`, which was clean, checked out detached at 7a50e34e1 and left there. No dependency changes between f9f79bc66 and 7a50e34e1, so no install was needed.
- **Server:** `next dev --turbopack -p 3610` from `packages/dashboard`, with `NEXT_PUBLIC_APP_URL`, `AUTH_URL` and `NEXTAUTH_URL` set to `http://localhost:3610`. Postgres is local. The server was stopped at the end.
- **Browser:** Playwright Chromium 1.61.1, headless, 1440×900. Two persistent profiles, A (CDP 9361) and B (CDP 9362), were driven by attach scripts (`launch.mjs` and `lib.mjs`).
  - The launcher aborts every `sites.publish`, `rollback` and `schedulePublish` request at the network layer. **No publish request was ever sent:** the network logs contain 0 `sites.publish?` lines.
  - The profiles were deleted afterwards.
- **Account:** qa@buildrik.local, role OWNER (`sites.myRole`), workspace `cmpa9oi4n0001wrjuvh7j2h8m`. That workspace has a real Vercel connection (pre-publish check "Vercel connected: pass"), and `PUBLISH_ALLOW_SIMULATION` is not set. **A simulation publish was therefore not allowed and not attempted.**
- **Sites:**
  - Main site: `cmuzvsl4g0008ax1oyiouzh89`, "cms-audit-throwaway-183957", created through `sites.create` (blank) from the logged-in page.
  - Duplicate: `cmuzzp94y0053ax1ofnj4przb`, created through the dashboard Sites card → ⋯ → Duplicate.
- **Cleanup:** both sites were deleted with `sites.delete` (with confirmName) → 200. Both now appear in `sites.listDeleted` and not in `sites.list`, as soft deletes ("Recently deleted"). Result: `cleanup.json`.
- **Evidence:** `shots/*.png`, network logs `net-profileA.log` / `net-profileB.log`, console logs `console-profile*.log`, and the probe scripts `j*.mjs` and `c*.mjs`, all in this folder.
- **Synthetic setup shortcut:** to get more than 50 *published* records, 59 CSV-imported drafts were published with direct `cms.entries.upsert` calls from the page (`setup-publish.mjs`). There is no bulk-publish action in the UI. Everything else was done through the UI.

**Not tested, and why:**
- Real publish and deploy output, so what the dynamic-page slug collisions do at deploy time is unknown. The brief forbids publishing, and no workspace without Vercel was available.
- L3-019 (collection-level INVALID): this needs a server refusal such as a 101st collection. Not attempted.
- Image field values: "Choose image" opens the media library, which is empty in this site.
- Google Sheets and Airtable are "Coming soon".

**Harness incidents, not counted as product defects:**
- An early `strip()` removed React-owned overlay nodes and caused `removeChild` runtime faults. It was rewritten to hide nodes instead.
- The launcher's dialog handler crashed once on a `beforeunload` race.
- The Agentation dev toolbar (development-only) overlaps the record Save button. It is excluded.

## Journey table

| # | Journey | Passed / failed steps | Evidence |
|---|---|---|---|
| 1 | Entry points and empty state | 4/1 — CMS rail, ⌘K ("Open CMS", "Manage CMS records") and the left empty state all work; the Pages panel has no CMS entry (none expected); the empty workspace centre is blank grey | j1-01, j1-02, j1-03 |
| 2 | Collections and fields | 11/4 — wizard, name clash, every field type, reference, key clash and delete-field confirm work; rich-text key rename strips formatting; type change gives no warning; title is not required by default; the wizard creates multiselect with no options | j2-01 … j2-15 |
| 3 | Records | 12/5 — create, required-to-publish, auto-slug, unsaved guards, search, sort, pager, CSV import (63 rows in 11 s) and sanitising work; CSV types are not coerced; delete has no guard; Escape and focus problems; a draft dup slug blocks publishing the original | j3-01 … j3-21 |
| 4 | Binding and collection list | 3/6 — bind and live edit propagation work; the 50-record preview window; stale canvas after unpublish or delete; Undo gives a new id; the list shows drafts and `{{item.*}}`; a binding-only change is not saved | j4-01 … j4-11 |
| 5 | Dynamic pages | 3/1 — template and pattern save, template-context binding and record preview work; reserved or colliding slugs (`api`, `index`, `post-template`) are accepted with "Ready" | j5-03 … j5-07 |
| 6 | Persistence and concurrency | 4/4 — collections, fields, renames and bindings survive reload; context B hydrates identically; cross-context CONFLICT is detected; same-browser two tabs lose an update silently; Keep mine overwrites the other user's field blindly; Sources vanish; duplicate-site drops CMS | j6-*, j12-* |
| 7 | Offline and recovery | 3/3 — offline saves are queued and messaged, and replay on reconnect; an orphaned queue item never clears; project save is not auto-retried; publish is not blocked by unsynced CMS | j7-01 … j7-13 |
| 8 | Undo and keyboard | 3/4 — toolbar and ⌘Z undo restore a binding; Unbind takes 2 undo steps; record saves are not undoable; Enter on a row opens the sheet but focus stays on the row and Escape does nothing; focus goes to BODY after delete; closing the panel drops dirty edits | j8-01 … j8-04, j3h output |
| 9 | Pre-publish checks | 2/3 — empty bindings and unpublished template are flagged; dynamic-slug collisions are not flagged; pending CMS sync does not block; toasts cover the confirm dialog's Cancel button | j9-01, j7-07, j7-11 |

**Counts (this track's findings, D-01…D-27):** P0: 2 · P1: 8 · P2: 9 · P3: 8.

**Prior L3 findings:**

| ID | Result |
|---|---|
| L3-015 | REPRODUCED |
| L3-016 | REPRODUCED |
| L3-017 | REPRODUCED |
| L3-018 | REPRODUCED (with caveat) |
| L3-019 | BLOCKED |
| L3-020 | REPRODUCED |
| L3-021 | REPRODUCED |
| L3-022 | REPRODUCED |
| L3-023 | Partly reproduced (6 sub-items reproduced, 1 not reproduced) |

**Coordinator targets:**

| Target | Result |
|---|---|
| 1 | REPRODUCED for rich text. NOT REPRODUCED for the required-field rename on a published record: the value moved to the new key and survived reload. |
| 2 | REPRODUCED |
| 3 | REPRODUCED for "never clears". The opposite of "blocked": publish is *not* blocked. |
| 4 | REPRODUCED |
| 5 | REPRODUCED (variant: re-pinning to a draft is not saved) |
| 6 | REPRODUCED |
| 7 | REPRODUCED |
| 8 | REPRODUCED |
| 9 | REPRODUCED |
| 10 | NOT REPRODUCED (the UI guard blocks it) |
| 11 | REPRODUCED |
| 12 | REPRODUCED |

---

## Findings

### D-01 Renaming a rich-text field key strips formatting from every record (L3-015)
- Type: Integration / data loss · **P0** · Confidence VERIFIED_RUNTIME · Status VERIFIED_BROKEN
- Preconditions: Posts has 65 records; "First post" content is `Hello <strong>bold</strong> world`.
- Repro: CMS → Posts → Fields → `body` → change Key to `content` → Enter.
- Actual: the client sends 65 `cms.entries.upsert` calls carrying the new key *before* `cms.collections.upsert` (the collection call is the 66th POST). The server does not yet know that `content` is rich text, so it sanitises it to plain text, and the stripped value is written back locally. `First post.content` = `"Hello bold world"`. This happens on every record.
- Expected: formatting is preserved; the collection schema is written before the records are migrated.
- Evidence: j2-11-key-renamed.png; net-profileA.log 18:56:2x (entry upserts, then the collections upsert at line 129); j2c output.
- Prior ID: L3-015. Coordinator target 1.
- Side-note: renaming a required text key (`subtitle`→`tagline`) on a published record kept its value after reload. That half of target 1 is NOT REPRODUCED.

### D-02 Two tabs of the same browser: the second save silently overwrites the first tab's edit
- Type: Data integrity · **P0** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Preconditions: the editor is open in two tabs of the same profile, with record "CSV post 12" open in both.
- Repro:
  1. Tab 1 changes the title to "CSV post 12 TAB1" → Save (200).
  2. Tab 2 appends body text → Save.
- Actual: tab 2 saves with 200 and shows no conflict. Its payload carries the stale title "CSV post 12" with `expectedUpdatedAt` = tab 1's fresh stamp (`19:51:26.596Z`; the sync stamps are shared in `localStorage`). The server copy is now title "CSV post 12" plus tab 2's body, so **tab 1's title is lost**. Tab 1 still displays "CSV post 12 TAB1" locally.
- Expected: tab 2 gets CONFLICT, because its form was based on the older version.
- Evidence: j6-10-same-context-tab2.png; net-profileA.log 19:51:26 / 19:51:31 (the two upserts and their stamps); j6c output.
- Coordinator target 6.

### D-03 Re-pinning a binding (a binding-only change) is never saved and reverts on reload
- Type: Persistence · **P1** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Preconditions: heading B is bound to Posts.title @ "CSV post 03" and the site is saved.
- Repro: select B → Behaviour → CMS binding → Record = "Temp undo" (a draft) → wait 15 s → reload.
- Actual:
  - No `sites.saveProject` fires within 15 s, and the topbar shows "Done".
  - No unload warning appears.
  - After reload the binding is back to `@cmuzway5e000hax1o98msk7r4` (CSV post 03).
  - Before the reload, the canvas still showed "[bound] CSV post 03".
- Expected: a binding change marks the project dirty and autosaves.
- Evidence: j4-05-rebind-to-draft.png, j4-06-after-reload.png; j4c and j6a outputs.
- Coordinator target 5. A fresh bind made alongside other edits did persist.

### D-04 Closing the CMS panel with unsaved record edits discards them without asking
- Type: Data loss (unsaved) · **P1** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Repro: open record "CSV post 13 X" → type into Subtitle (`#cms-field-tagline`) → click the CMS panel ✕ (top-left, 311,78).
- Actual: the sheet closes with no dialog, and the value stays "Sub 13" (the edit is gone).
- Contrast: the following all *do* guard:
  - Escape inside the sheet, the sheet ✕ and Cancel (`cms-discard` dialog);
  - switching collection;
  - switching rail panel. This one shows a different, generic "Unsaved changes" dialog.
- Expected: the same guard on every exit.
- Evidence: j8-03-panel-close-dirty.png; j8d output; guard contrast in j3-04-escape-guard.png, j3-05-switch-guard.png, j3-06-rail-switch.png.
- Coordinator target 9.

### D-05 Undo after deleting a record restores it under a new id, so bound elements stay broken
- Type: Integration · **P1** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Repro: heading D is bound to "CSV post 05" (`cmuzwayax000lax1o39omjado`). In the CMS workspace, record ⋯ → Delete record… → toast Undo.
- Actual:
  - The record comes back as `muzwwpx9-4l74aqw` (also seen with `muzw9lat` → `muzw9pi5`).
  - The binding still points at the old id, so the Inspector Record picker is blank and says "This record isn't published — the page shows nothing here".
  - The canvas keeps the stale "CSV post 05" with no bound marker.
  - `createdAt` resets.
- Expected: Undo restores the same id, so bindings and references survive.
- Evidence: j4-08-after-delete-undo.png; j3f and j4d outputs; net 18:53:15 (delete), then 18:53:17 (upsert with a new id).
- Coordinator target 8.

### D-06 CSV import stores numbers and booleans as strings, so `false` displays as Yes and number sort is lexicographic
- Type: Data integrity · **P1** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Repro: Posts ⋯ → Import CSV… → `import60.csv` (63 rows) → Import.
- Actual:
  - Every value is stored as a string: `views:"6"`, `featured:"false"`.
  - The table and the record sheet show **Featured = Yes** for rows imported as `false`.
  - A number field accepted `"abc"`.
  - Sorting VIEWS descending gives "Bad number row" (abc), then 99, 96… (string order).
  - The importer reported "Imported 63 of 63 rows" with no errors.
- Expected: values are coerced per field type, and invalid rows are rejected or reported.
- Evidence: j3-15-csv-preview.png, j3-16-csv-result.png, j3-18-search-csv02.png, j3-19-csv02-sheet.png, j3-20-page2.png; j3g and j3h outputs.

### D-07 Duplicating a site drops all CMS data but keeps bindings and stale canvas content
- Type: Integration · **P1** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Repro: Dashboard → Sites → card ⋯ → Duplicate → open the copy.
- Actual:
  - `cms.collections.list` on the copy returns `[]`.
  - The canvas still shows the original's bound text (including the "[bound]" marker) and a Collection list full of the original's records. Five bindings still point at the original collection ids.
  - Pre-publish is `ready:false` because "Collection lists: fail — isn't connected". "CMS bindings" lists only 2 of the 5 broken bindings.
- Expected: either the duplicate copies collections and records, or it clears the bindings and says so.
- Evidence: j12-03-site-menu.png, j12-07-copy-editor.png; j12d output; net-profileB 20:29:20 (`sites.duplicate`).
- Coordinator target 12.

### D-08 Inspector and canvas only see the first 50 published records
- Type: Functional · **P1** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Preconditions: 60 published Posts; "First post" (published, oldest) is at index 59.
- Repro: heading → From CMS → Posts / title → Record = "First post".
- Actual:
  - The Inspector says "This record isn't published — the page shows nothing here".
  - The default preview reads "record 1 of 50" while 60 are published.
  - The canvas keeps the previous record's text ("CSV post 02").
  - The server pre-publish check treats First post as fine, so the editor and the server disagree.
- Expected: the full published set is used, and the canvas shows "First post".
- Evidence: j4-02-bound-default.png, j4-03-pinned-first-post.png; j4a output.
- Coordinator target 2.

### D-09 Dynamic pages accept record slugs that collide with real or reserved paths
- Type: Validation · **P1** · VERIFIED_RUNTIME (the publish effect is not verified) · VERIFIED_BROKEN
- Preconditions: Posts has dynamic pages with template "Post template" and pattern `{slug}`.
- Repro: set the slugs of three published records to `api`, `index` and `post-template` (the real template page's slug).
- Actual:
  - All three save with no field error.
  - The Dynamic pages status says "Ready · 59 complete records will get a page".
  - Pre-publish says "CMS templates: pass" and nothing else flags it.
- Expected: reserved names and collisions with existing pages (especially `index`, the homepage file) are refused or flagged.
- Evidence: j5-05-dynamic-reserved-slugs.png, j9-01-publish-dialog.png; j5d and srv outputs.
- Coordinator target 11.

### D-10 Bound element keeps stale text after its record is unpublished or deleted, and loses its marker (L3-016)
- Type: Integration · **P2** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Repro: unpublish "CSV post 05" (heading D bound to it), then delete it.
- Actual:
  - The canvas still shows "[bound] CSV post 05" after both.
  - Elements whose binding does not resolve (A pinned beyond 50, C pinned to a draft) show another record's text ("CSV post 02") with **no** `data-cms-bound` marker, before and after reload.
  - Live title edits do propagate (VERIFIED_OK).
- Expected: the canvas mirrors publish (empty or placeholder) and keeps the bound marker.
- Evidence: j4-07-after-unpublish.png, j4-04-four-headings.png, j4-06-after-reload.png; CANVAS reads in j4d and j6a.
- Prior ID: L3-016 (REPRODUCED). Coordinator target 4.

### D-11 Collection list shows drafts and raw `{{item.*}}` (L3-017)
- Type: Missing state · **P2** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Actual:
  - Right after insert the list shows `{{item.name}}` / `{{item.description}}`.
  - Bound to Authors (0 records) it shows `{{item.title}}` / `{{item.bio}}`.
  - Bound to Posts, the first card is the **draft** "CSV post 05".
- Evidence: j4-09-collist-unbound.png, j4-10-collist-authors-empty.png, j4-11-collist-posts.png.
- Prior ID: L3-017 (REPRODUCED). Coordinator target 7.

### D-12 An offline-orphaned CMS change never clears, and publish is not gated on it
- Type: Recovery · **P2** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Repro: offline → create collection "Offline three" → add a record → delete the collection (typed DELETE) → back online → reload, and later relaunch the browser.
- Actual:
  - On replay the entry upsert and the collection delete both return 404 "Collection not found", because the create never reached the server.
  - The "Some content changes didn't sync · 1 CMS change…" toast comes back after every reload and relaunch (seen 25+ min later).
  - The Publish confirm says "⚠ 5 warnings — none block". Publish is **not** blocked by the unsynced change.
- Expected: dead queue items are dropped or explained after a 404, and the publish gate reflects real pending state.
- Evidence: j7-06-offline-delete-col.png, j7-11-publish-after-relaunch.png, j7-12-publish-after-45s.png; net-profileA 19:28:31–19:34:03 (404s).
- Coordinator target 3. It reproduces as "never clears"; "publish blocked" was not observed.

### D-13 After reconnecting, the project save is not retried automatically, and the recovery prompt outlives a successful save
- Type: Recovery · **P2** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Actual:
  - Offline `saveProject` attempts failed (19:24, 19:27, 19:28).
  - After coming back online, and through reload and relaunch, there was no `saveProject` until "Retry save" was clicked by hand (19:36:21 → 200).
  - The topbar showed "Save failed — retry" until then.
  - The "Some work never reached the server · Restore my edits" toast stayed visible after that successful save. That invites restoring an older local copy.
- Evidence: j7-05-after-reload.png, j7-13-after-retry.png; net-profileA.log saveProject lines.

### D-14 Toasts cover the Publish confirm dialog's Cancel button; offline and save banners cover the chrome
- Type: UX / safety · **P2** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Actual:
  - With the sync toasts visible, `elementFromPoint` at the centre of the confirm dialog's **Cancel** button returns the toast ("Some work never reached the server" / "Some content changes didn't sync"). The visible clickable buttons are effectively "Publish now" and ✕.
  - The offline banner covers the whole topbar, including Publish and Exit.
  - The "Couldn't save … Retry save / Keep editing" banner sits over the CMS workspace tabs and the ••• menu, so Settings and Dynamic pages are unreachable until it is dismissed.
- Evidence: err screenshot in j7-07 run (shots/err-1791487782341.png), j7-05b-banner-over-tabs.png, err-1791487653668.png; cancelHitTarget in j7d and j7e outputs.

### D-15 A draft with a duplicate slug blocks the original record from publishing
- Type: Validation · **P2** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Actual:
  - CSV import created the draft "Dup slug row" with slug `csv-post-01`.
  - Publishing the original "CSV post 01" then fails with 400 `CMS_INVALID: Another record already uses the Slug "csv-post-01"`, as does publishing the dup.
  - Manual "Add record" also lets a draft reuse a published slug (it saves as a draft with no warning).
- Expected: a duplicate slug is refused at draft save or import, or drafts are not counted against published uniqueness.
- Evidence: setup-publish output; j3-07-dupslug-before.png, j3-08-dupslug-after.png.

### D-16 Data Sources added from JSON vanish after the session ends (L3-018)
- Type: Persistence · **P2** · VERIFIED_RUNTIME · VERIFIED_BROKEN (with caveat)
- Actual: "products · array · 1 item · Watching for changes" was added, no `saveProject` followed, and after a browser relaunch Sources shows "No data source connected".
- Caveat: tab A was in a SAVE_CONFLICT state (409 at 19:51:36) at the time, which may also suppress autosave. Prior L3 reproduced this without that state.
- Evidence: j6-x-A / err-1791489294671.png (before), j6-14-sources-after-relaunch.png.
- Prior ID: L3-018 (REPRODUCED).

### D-17 "Keep mine" overwrites the other user's fields blindly; the conflict UI hides "theirs" (L3-021)
- Type: UX / data integrity · **P2** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Repro:
  1. Context A saves title "CSV post 11 — A title".
  2. Context B (separate profile) saves a body edit.
  3. B gets `CMS_CONFLICT` and the banner "Someone else changed this record. Keep mine / Use theirs", with no diff.
  4. B is also hit by a site-level "This site changed somewhere else" modal; it chooses Reload latest, then Keep mine.
- Actual: the server title is back to "CSV post 11". A's title is gone because the whole record was replaced.
- Evidence: j6-04-conflict-crossctx.png, j6-08-B-reload-latest.png, j6-09-B-keep-mine.png; srv2 output.
- Prior ID: L3-021 (REPRODUCED). The conflict *detection* is VERIFIED_OK.

### D-18 Record sheet keyboard and focus: focus stays on the row, so Escape does nothing
- Type: A11y · **P2** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Repro: Tab from search → header cells → first row → Enter.
- Actual:
  - The sheet opens, but `document.activeElement` stays on the `cms-row-*` element.
  - Escape does not close the sheet, because its handler only fires inside the sheet.
  - After a record delete, focus falls to `BODY`.
- Evidence: j3h output (tabSeq / focusInSheet / sheetClosedByEsc:false); j3e output (focusAfterDelete).

### D-19 Record delete has no guard and the table has no status column (L3-020)
- Type: UX · **P3** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Actual:
  - "Delete record…" deletes at once, with only a toast and Undo (about 30 s).
  - The table columns are TITLE, VIEWS, PUBLISHED_ON, FEATURED, UPDATED. Status shows only as a faint "· Draft" suffix, and there are no row actions.
  - Collection delete *does* require a typed DELETE.
- Evidence: j3-11-record-menu.png, j3-13-after-delete.png, j3-09-table-with-draft.png.
- Prior ID: L3-020 (REPRODUCED).

### D-20 The server accepts blind writes (L3-022)
- Type: Integration · **P3** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Actual: 59 `cms.entries.upsert` calls with no `expectedUpdatedAt` returned 200 and overwrote status.
- Evidence: setup-publish.mjs output; net-profileA 19:00:1x.
- Prior ID: L3-022 (REPRODUCED).

### D-21 Unbind is two undo steps; record saves are not undoable
- **P3** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Unbind took the undo count from 1 to 3. One ⌘Z left the element unbound; the second restored it. The toolbar Undo also works.
- ⌘Z after a record save does not change the record, and the undo count does not move. This may be by design, but it is undocumented in the UI.
- Evidence: j8c and j8d outputs, j8-02-undo-unbind.png.

### D-22 Field-type change and field delete leave data behind with no warning
- **P3** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Changing `notes` from Long text to Number applied instantly with no dialog.
- After "Delete field" on `notes`, 2 records still carry `notes` server-side after reload.
- Evidence: j2-12-type-change.png, j2-13-delete-field-guard.png; reload probe ("notesLeft": 2).

### D-23 Wizard defaults
- **P3** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- The wizard's `title` field is not required.
- A multiselect created in the wizard has no options, so the record sheet shows "No options yet".
- A typed `published_on` becomes key `published-on`, while the label keeps `published_on`.
- Evidence: j2-09-fields-after.png, j3-01-new-record.png.

### D-24 CMS polish (L3-023)
- **P3** · VERIFIED_RUNTIME · partly reproduced
- REPRODUCED:
  - The field picker lists keys (`published-on · Date`, not the name).
  - "Open affected record" shows while "Nothing is bound".
  - The stepper shows "Name & Type ✓" before any name is typed.
  - The title changes to "Fields for Posts" while typing.
  - The workspace centre is blank grey with "Select a collection" on the right.
  - The left empty-state links wrap word by word.
  - With Settings or Dynamic pages active, the tab strip shows only "Records Fields •••".
- NOT REPRODUCED: the new-record footer is now amber with a warning icon (j3-01), not green.
- Evidence: j1-01, j2-01, j2-02, j2-10, j8 err screenshot, j2e output.

### D-25 Duplicate-slug save error contradicts the eligibility line
- **P3** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- The footer error "Another record already uses the Slug…" and "Retry save" show alongside a green "Eligible for publishing", with no inline error on Slug.
- Evidence: j3-10-dupslug-published.png.

### D-26 Publish confirm says "2 pages" while dynamic pages generate 59
- **P3** · VERIFIED_RUNTIME · VERIFIED_BROKEN
- Evidence: j9-01-publish-dialog.png.

### D-27 Console errors
- **P3** · VERIFIED_RUNTIME
- React "unique key" warning from `RecordsTable.tsx:147` (header cells).
- `[EventEmitter] handler for "element:updated" threw: TypeError: el.getId is not a function` in `useCanvasEditorFlags` on bind.
- Evidence: console-profileA.log 18:46:26 and 19:05:14.

### L3-019 Server-refused collection (INVALID) dropped silently
- Status **BLOCKED**: it needs a server-side collection refusal (for example a 101st collection), which was not attempted in this run.

---

## VERIFIED_OK behaviours
- **Entry points:** CMS rail (shortcut D) and ⌘K "Open CMS" / "Manage CMS records".
- **Collection creation:** the setup wizard creates the collection and syncs it (`cms.collections.upsert` 200). A duplicate collection name shows the clash dialog with "Use Posts 2".
- **Fields:**
  - All 10 field types are offered in + Add field. Reference picks its target collection.
  - A field key clash shows inline in the inspector ("Posts already has the key views.").
  - Delete field shows a consequence dialog ("removes the value from all 65 records").
- **Collection settings and delete:**
  - A collection slug clash is refused locally ("Posts already uses the slug posts.") and no request is sent. **Coordinator target 10 NOT REPRODUCED**; the server path is untested.
  - Collection delete requires typed DELETE.
- **Record editing:**
  - Auto-slug from title works.
  - Required fields block publishing ("Subtitle is required to publish").
  - Publishing a duplicate slug is refused.
- **Unsaved-changes guards:** Escape inside the sheet, the sheet ✕, Cancel, switching collection and switching rail panel all ask first. The discard dialog takes focus on "Keep editing".
- **CSV import and table:**
  - 63 rows imported in 11 s. `<script>` and `onerror` were stripped server-side ("ok").
  - Pager shows 50 per page ("1–50 of 65", "51–65 of 65").
  - Search, including an empty-state message, works.
  - Sortable headers expose `aria-sort`.
- **Bindings:**
  - A record edit propagates live to a bound heading ("CSV post 03 EDITED").
  - Bindings, collections, fields and key renames persist across reload.
  - A second profile hydrates identical CMS data and bindings.
- **Dynamic pages:**
  - Template and pattern save ("Posts generates 59 pages on the next publish").
  - Template-context binding works ("Record · each generated page shows its own").
  - "Preview saved record" renders the template with the record's data.
- **Conflict and offline:**
  - A cross-profile concurrent edit is detected (400 `CMS_CONFLICT`) and surfaced.
  - Offline record edits are saved locally with clear messaging and replay on reconnect (the server got "CSV post 10 OFFLINE EDIT").
- **Pre-publish checks:** they flag empty bound elements and the unpublished template page.
- **Publish safety:** opening the Publish panel shows a confirm dialog first, and no publish request was sent in this run.
