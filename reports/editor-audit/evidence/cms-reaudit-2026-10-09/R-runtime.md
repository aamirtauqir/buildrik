# R: CMS re-audit, runtime track (2026-10-09)

- **Commit:** `50ab12da6` (main). The worktree `~/Desktop/buildrik-worktrees/editor-live-audit` was clean, was moved from 7a50e34e1 to a detached checkout of 50ab12da6, and is left there, still clean. No install was needed.
- **CMS fix commits in range:** 56a31dbbc (L3-015 rename order), 4180deaca and 701c28522 (L3-016 canvas mirrors publish), a51581f6c (binding that resolves to nothing is still saved), 5dda5a9f4 (L5-070 auto-retry on reconnect), 2bc953a43 (L5-075 Restore saves), 9579895f2 and 53346a2ec (L5-074).
- **Server:** `next dev --turbopack -p 3610` from `packages/dashboard`, with `NEXT_PUBLIC_APP_URL`, `AUTH_URL` and `NEXTAUTH_URL` set to `http://localhost:3610`, against local Postgres. The `.env.local` symlink was already present. The server was stopped at the end and port 3610 is free.
- **Browser:** Playwright Chromium (from the dashboard's `@playwright/test`), headless, 1440×900. Two persistent profiles, A (CDP 9361) and B (CDP 9362), were driven by `launch.mjs` and `lib.mjs` (copied from the first audit). The profiles were deleted afterwards.
- **Publish safety:** the launcher aborts `sites.publish`, `rollback` and `schedulePublish` at the network layer. Both network logs contain **0** `sites.publish|rollback|schedulePublish?` requests and 0 ABORTED lines. The Publish confirm dialog was opened, then closed with Escape.
- **Account:** qa@buildrik.local (OWNER), workspace `cmpa9oi4n0001wrjuvh7j2h8m`. The password was read from `docs/plans/cms-c1-evidence/helpers.mjs` at runtime and is never written here.
- **Site:** `cmv0lbfbb000820ekh2imsp1o` "cms-reaudit-throwaway-063427", created with `sites.create` (blank). No duplicate was made.
  - Collection Posts `mv0lc77e-hxodqrj`.
  - Records: First `mv0ldzio-59yvjd0`, Second `mv0le467-b3e24j4` (deleted during the run), Third `mv0le7rr-w4f3fmq` (draft), Fourth `mv0lec9d-2vor7mh`.
  - Template page `page-mv0lizc9-vi7csx1dg3`.
- **Cleanup:** `sites.delete` with confirmName returned 200. The site is in `sites.listDeleted` and not in `sites.list` (`search:"cms-reaudit"` returns total 0). It is a soft delete. Details are in `cleanup.json`.
- **Setup:** the collection (wizard), the fields (+ Add field), the 4 records (record sheet with the Bold button), the template page and the dynamic-pages settings were all made through the UI.
- **Evidence:** `shots/*.png`, `net-profileA.log` / `net-profileB.log`, `console-profileA.log`, and the probe scripts `s*.mjs` and `r*.mjs`, all in this folder.

**Not tested, and why:**
- **VIEWER role (candidate d):** BLOCKED. An account exists: `qa-viewer@buildrik.local` is a VIEWER in the QA workspace, per `docs/plans/settings-phase-b-walk/README.md`. It has no password, and signing in needs a magic-link token minted by a direct DB write. This run's rules exclude that.
- **Real publish output:** not tested, for example whether the stale SEO pattern renders a literal `{subtitle}`, or what generated pages look like after the template slug changes.
- **URL-pattern rewrite on key rename (EDT-028 URL half):** the UI locks a key that the URL pattern uses, so a rename is not reachable from the UI.

**Harness incidents (not product defects):**
- `c.selection.select("<id string>")` in a probe threw `el.getId is not a function` and broke the Layers panel until reload. Selection was then done through Layers rows.
- In Turbopack dev, going offline before the Add panel's lazy chunk had loaded made that panel show "Something went wrong" (`ERR_INTERNET_DISCONNECTED` on `BuildTab` chunks). It is likely dev-only, because dev chunks are not immutably cached. To avoid it, the Add panel was preloaded online.
- `openCms()` toggled the CMS panel closed once. The script was switched to a direct rail click.
- The first r3 screenshot of the new typed-DELETE record dialog was overwritten by a later run. Its DOM text was captured: "Delete "Second post"? … Type DELETE to confirm … This can't be undone".

## Results

| Issue | Journey | Result | Evidence | Notes |
|---|---|---|---|---|
| EDT-001 / D-01 (P0) rich-text key rename strips formatting | 1 | **FIXED** | r1-body-renamed.png, r1-after-reload-sheet.png; net-profileA 06:41:23.897 `cms.collections.upsert` → 06:41:24.677 200 → 06:41:24.893 `entries.upsert ×4` (one batch) → 200, with `"content":"Hello <strong>bold</strong> world"` in the reply | All 4 records keep `<strong>` locally, on the server (`cms.entries.list`) and after reload. The sheet's innerHTML is `Hello <strong>bold</strong>&nbsp;world`. |
| D-01 side: required text key rename on a published record | 1 | **OK (unchanged)** | r1-subtitle-renamed.png; net 06:45:14.715 collection first, then the entries | `subtitle`→`tagline` (required) kept "Sub First post" on all 4 records, on the server and after reload. The server field is `tagline:text*`. |
| EDT-028 patterns follow a renamed key | 1 | **PARTLY FIXED** | s5-seo-only-subtitle.png, r1-dynamic-after-rename.png; r1b output | **URL pattern:** a key used by the URL pattern is locked in the field inspector ("Field keys … with active bindings must be kept"), so it cannot break. **SEO title and description patterns:** with the URL pattern at `{slug}`, the key unlocks; the rename leaves `pageSeoTitle "{subtitle} \| Blog"` and `pageSeoDescription "Read {subtitle}"` on the server. The pane shows "subtitle, subtitle are not a field of Posts." while the status still says **Ready**. |
| EDT-006 / D-03 binding-only re-pin not saved | 2 | **FIXED** | r2-repin-draft-before/after-reload.png; net 06:47:47.389 `saveProject` → 200 about 1.5 s after the select | Re-pinning from published "First post" to draft "Third post": the save fired and the pin survived reload. A fresh heading bound straight to the draft (r2c; the heading was added and saved 12 s earlier, so the bind was the only change) saved at 06:49:00.480 → 200 and survived reload. |
| EDT-011 / D-10 stale text after unpublish or delete | 3 | **FIXED (behaviour); placeholder missing** | r3-01…r3-05.png; r3 and r3d outputs | Measured on `[data-buildrick-id]`: <ul><li>published: "Second post", bound, h 43</li><li>**unpublished:** "" with `data-cms-bound=true`, h **0**</li><li>republished: "Second post", h 43</li><li>**deleted** (typed DELETE, `entries.delete` 200): "", bound, h 0</li><li>**after reload:** "", bound, h 0</li></ul>There is no dimmed "Empty · Title" placeholder; the element collapses to 0 px. See N-1. |
| EDT-018 / D-13 no auto-retry after reconnect; stale recovery toast | 4 | **PARTLY FIXED** | r4-01…r4-06.png; r4a and r4c outputs | <ul><li>Offline `saveProject` attempts failed at 06:57:43 and 06:57:47.</li><li>**Back online at 06:57:58.839, an automatic `saveProject` fired at 06:58:00.010 (1.17 s) → 200**, with no click. The topbar showed "Saved / Done" and no recovery toast appeared.</li><li>Reload after a failed save → "Some work never reached the server · Restore my edits" → click → `saveProject` 200 (06:59:25), and the restored element survived a second reload. **FIXED.**</li><li>**Still broken:** the "Some work never reached the server · Restore my edits" toast **remains visible after that successful restore-save** (still there 8 s later, topbar "Done"; r4-05). It is gone only after the next reload.</li></ul> |
| Regression: live record-title edit → bound heading | 5 | **OK** | r5-01-live-title-edit.png | The heading changed from "First post" to "First post EDITED" right after the record save. |
| Regression: cross-profile CONFLICT | 5 | **OK** | r5-02-crossprofile-B.png; net B 07:01:31.416 `400 CMS_CONFLICT:2026-10-09T07:01:28.310Z` | Profile B got "Someone else changed this record. Keep mine / Use theirs". |
| Regression: pre-publish dialog, no deploy | 5 | **OK** | r5-03-prepublish-dialog.png | "Publish to production? … Pages 2 pages … ⚠ 6 warnings — none block". Only `sites.publishHistory` and `prePublishChecks` requests were made, and 0 publish requests. |
| EDT-002 / D-02 (P0) two tabs, same profile | 6e | **STILL BROKEN** | r6-01-two-tabs-tab2.png; net-profileA 07:02:06.950 / 07:02:09.556 | <ul><li>Tab 1 saved "Fourth post TAB1" (`updatedAt` 07:02:07.007).</li><li>Tab 2 then saved a views edit with the stale title "Fourth post A-TITLE" and `expectedUpdatedAt: 07:02:07.007Z` (tab 1's fresh stamp, shared through localStorage) → **200**.</li><li>Server result: title "Fourth post A-TITLE", views 55. **Tab 1's title is lost silently.**</li></ul> |
| D-19 (side observation) record delete guard | 3 | **CHANGED** | DOM text captured in r3 | Record delete now needs typed DELETE ("This can't be undone") and the toast Undo is gone. D-19 looks addressed. **D-05 (undo gives a new id) is now moot**, because there is no undo path. |

## New findings

### N-1 A bound element that resolves to nothing collapses to 0 px, so it is invisible and cannot be clicked on the canvas
- Type: Usability / missing state · **Proposed P2**
- Repro: bind a heading to a record, then unpublish or delete the record, or pin it to a draft.
- Actual:
  - The element renders `textContent ""`, height 0, with no `::before` content (r2c `elHeight` = `{h:0, before:"none"}`).
  - The canvas looks empty (r2-repin-draft-after-reload.png), so the element can only be reached through Layers.
  - The Inspector says "This record isn't published — the page shows nothing here" even when the record was **deleted**. The Record picker shows "Newest published record" as the current value for a deleted id.
  - The Inspector offers "Open record" for that deleted record, and "Unbind keeps the text you see now", which is empty.
- Expected: a dimmed "Empty · Title" placeholder at normal height (the spec per the brief), and copy that distinguishes deleted from unpublished.
- Evidence: r3-04-after-reload.png, r3-05-inspector-deleted.png, err-1791528892417.png (Record = "Newest published r…" for the deleted pin).

### N-2 Changing the template page's slug silently disconnects the collection's dynamic pages
- Type: Integration · **Proposed P1** (generated pages stop publishing with only a non-blocking warning)
- Repro: Pages → "Post template" ⋯ → Page settings… → URL slug `post-template` → `article-template` → Done.
- Actual:
  - The collection keeps `pageTemplatePath: "post-template.html"`, because the template is referenced by file name.
  - CMS → Dynamic pages says "The saved template page is missing — choose one again, or publishing generates none of these." The template select reads "Choose a page…".
  - Pre-publish reports only a **warning**: "Collection Posts: the bound template page no longer exists — its generated pages won't be published."
  - The Pages panel footer still says "+2 from collections".
  - No warning appeared at the moment of the slug change.
  - Changing the slug back restores "Ready".
  - Renaming only the page title was not completed (the inline rename input was not driven), but the slug is what the reference keys on.
- Expected: the template is referenced by page id, or the slug change updates the collection, or it at least warns at the point of change.
- Evidence: r6-06-page-settings.png, r6-07-dp-after-slug-change.png; r6c2 output (prePublishChecks excerpt).

### N-3 Deleting the dynamic-page template page has no collection-aware warning
- Type: Destructive-action guard · **Proposed P2** (Undo exists)
- Repro: Pages → "Post template" (the Posts template) → ⋯ → Delete page.
- Actual:
  - The confirm says only "Delete "Post template"? This page and everything on it is removed. Undo (⌘Z) brings it back."
  - Nothing mentions that Posts uses it to generate 2 pages.
  - After delete the collection still holds `pageTemplatePath: "post-template.html"`.
  - Toast Undo restored the page (same id) and Dynamic pages went back to "Ready".
- Expected: the confirm names the collection(s) using the page and the pages that will stop generating.
- Evidence: r6-08-delete-template-dialog.png, r6-09-after-delete-template.png, r6-10-after-undo-delete.png.

### N-4 SEO title and description patterns are not migrated on a key rename, while the status says Ready
- This is EDT-028's remaining half, recorded here in case it needs its own row.
- Type: Integration · **Proposed P2**
- Actual:
  - After `subtitle`→`tagline`, the server keeps `{subtitle}` in both SEO patterns.
  - The pane's error line is "subtitle, subtitle are not a field of Posts." (duplicated key), and the status is still "Ready".
  - The key lock covers only the URL pattern, not the SEO patterns.
- Evidence: r1-dynamic-after-rename.png; r1b output (`srvCol.seoT`).

### N-5 Records and Fields table rows are 40 px (DESIGN.md: "32px standard list rows … Never 40px")
- Type: Visual / DS conformance · **Proposed P3**
- Actual: `getComputedStyle(row).height` = **40px** for every `cms-row-*` (Records) and `cms-field-*` (Fields) row. The header row is 36px and the workspace tabs are 40px.
- Caveat: the Figma board was not compared. The repo's precedence rule is that board beats doc for visuals.
- Evidence: r6-02-records-table.png, r6-03-fields-table.png; r6a output.

### N-6 After a reload with a failed save, a save fires again before the user acts
- Type: Recovery noise · **Proposed P3**, low confidence
- Actual: with `saveProject` still blocked, the freshly reloaded page (showing the server copy) attempted `saveProject` (06:58:45) and showed a second "Couldn't save … Retry save" toast stacked on the "Restore my edits" toast.
- Evidence: r4-04-reload-recovery-prompt.png; net 06:58:39 / 06:58:45.

### N-7 Labels go stale for bound elements in Layers and the status bar
- Type: Polish · **Proposed P3**
- Actual:
  - The Layers rows show the element's stored text, not the resolved value. The heading bound to draft "Third post" is labelled "First post"; a fresh one is labelled "Fourth post".
  - The canvas status bar says "Heading · Second post · 991 × 43" while the heading displays "First post EDITED".
- Evidence: r3l output, err-1791529471414.png.

### Unchanged console noise
- RecordsTable "unique key" warning (06:36:27). It is the same as D-27.
