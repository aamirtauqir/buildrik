# R2 — re-baseline of 9 audit rows on origin/main cc95f3f7e

App http://localhost:3300 (worktree editor-live-audit @ **cc95f3f7e**, 64 commits after the audit baseline df60cf9ec), owner qa@buildrik.local, Chromium 1440×900, 2026-10-15.
Main site audit1014-V2 `cmv80er6z00imi7dby2dlatms`; "other site" audit1014-L6 `cmv7v827o0017i7dbmkni4fbu`. No site created, nothing published (a route guard aborted any publish mutation; none was sent). Scripts and evidence: `live/R2/` (`bkNN.mjs` → `bkNN.json` + PNG/HTML).

**Code context.** `git diff df60cf9ec origin/main` touches no file under `server/`, `lib/` or `packages/dashboard/` (only `DESIGN.md` and `types/` outside `packages/editor`). In the editor, the files behind these rows changed only by import-path codemods (DQ-006), except `PublishConfirmFacts.tsx` (DQ-001, 64c02cecc). `stylePeers.ts:79` on origin/main is still `` const selectorFor = (id: string) => `[data-buildrik-id="${id}"]`; `` (missing "c": the canvas attribute is `data-buildrick-id`).

## Summary

| Verdict | Rows |
|---|---|
| FIXED | none |
| PARTIAL | BK-21 (the confirm now blocks when the checks request fails. Loading state, retry path and server gate are unchanged) |
| OPEN | BK-08, BK-11, BK-12, BK-40, BK-42, BK-44, BK-51, D7 |
| BLOCKED | none |

## Results

| Row | Verdict | Old measurement (df60cf9ec) | New measurement (cc95f3f7e) | Evidence (live/R2/) |
|---|---|---|---|---|
| BK-08a cross-site revoke | OPEN | Site-scoped EDITOR: `reviews.revoke({siteId:<granted>, reviewId:<other site's review>})` → 200 `{revoked:true}`, DB `revokedAt` set | Same. Temp EDITOR scoped to V2. Controls on L6: `sites.myRole`, `siteComponents.list` and `reviews.revoke({siteId:L6})` all **403**. Attack `revoke({siteId:V2, reviewId:<L6 review>})` → **200 `{revoked:true}`**, L6 review `revokedAt` set. The activity row was written with **siteId = V2** for the L6 review | bk08.json, bk08.mjs |
| BK-08b library / libraryGet | OPEN | `library(V2)` 200, 27 masters from other sites; `libraryGet` 200 with the master tree | `library(V2)` → 200, **27 items from 25 other sites** (32 foreign rows, incl. fixture `cmrsur1fp…`, `scratchver…`); `libraryGet(V2, HeroBlock@scratchver…)` → **200** with the tree | bk08.json |
| BK-08c theme.targets | OPEN | 200, 49 sites | 200, **50 sites**, including L6, which the member has no access to | bk08.json |
| BK-08d capped ADMIN resolves | OPEN | (L6 #11) ADMIN with roleOverride VIEWER → `reviews.resolve` 200, APPROVED | Temp ADMIN with SitePermission `roleOverride=VIEWER` on V2; `sites.myRole` = **VIEWER**; `reviews.resolve({id, status:"APPROVED"})` → **200**, DB `status APPROVED`, `resolvedById` = the capped admin | bk08.json |
| BK-11a ⌘S in an input | OPEN | 0 saveProject requests, `dirty` true → false, status stayed error | saveProject aborted; engine edit → autosave fails ("Couldn't save audit1014-V2 · Home"). Focus Add-panel search input, ⌘S: **0 requests**, `composer.isDirty()` **true → false** | bk11.json |
| BK-11b double save | OPEN | 2 saveProject per ⌘S outside inputs | Outside inputs, saves blocked: **2 requests** (0 ms and +374 ms), dirty true → false although both were aborted. Saves unblocked: **2 requests, both 200** (+0 / +555 ms) for one ⌘S. No automatic retry after unblocking | bk11.json |
| BK-12a Paste style on Mobile | OPEN | Mobile ⌘⌥V wrote the P's Desktop base; no Mobile rule | Desktop H3 → Element actions › Copy style ("1 style copied", clipboard `{margin:"0 0 8px"}`). Mobile (chip "Mobile" visible) P → Paste style → "1 style applied · Undo". P **base** `margin: "0"` → **`"0 0 8px"`**, Mobile breakpoint styles **`{}`** | bk12.json, bk12-paste-mobile.png |
| BK-12b Reset style on Mobile | OPEN | Base wiped to `cursor: grab`, the Mobile 22px rule survived | Mobile P with Mobile font-size 22px (setup via engine). Reset style → "Styles reset · Undo". Base **`{margin:"0"}` → `{}`** (style attr `cursor: grab;`), Mobile **`{font-size:22px}` kept**, computed **22px** | bk12.json, bk12-reset-mobile.png |
| BK-12c Apply-to-all on :hover | OPEN | Dialog closes, no toast, no peer `:hover` rules | Desktop H3 Margherita, State chip → ":hover", hover colour red (engine `setRule`, the inspector's call). ⋯ › Apply style to all → dialog "Apply this style to 2 H3 headings on Home?" → "Apply to 2". **No toast**; `:hover` rules on peers: **none** (also none under the typo selector). Cause unchanged at stylePeers.ts:79 (above) | bk12.json, bk12-apply-hover.png |
| BK-21a confirm while checks load | OPEN | "Publish now" had no `disabled` while checks pending | prePublishChecks delayed 8 s. Confirm shows "Pages Preparing… / Checking review status…" and **Publish now `disabled`=false**. After load: "⚠ 7 warnings — none block", enabled (expected). `PublishConfirmModal.tsx:149` still gates only on `submitting \|\| pageCount===0 \|\| blockers.length>0` | bk21.json, bk21-pending.png |
| BK-21b confirm after checks fail | **FIXED** | (D-P1) a failed checks call cleared the blockers and enabled Publish | prePublishChecks aborted: band "Pre-publish checks: Couldn't run the pre-publish checks, so this publish stays blocked…", Target "Vercel connection not checked", **Publish now disabled=true** (DQ-001) | bk21.json, bk21-failed.png |
| BK-21c failure-toast "Try again" | OPEN (code) | Retry skips every gate | `useExportHandlers.ts:188` `action: { label: "Try again", onClick: () => void runPublishRef.current(false) }` → `runPublish` → `publishJob.publish(siteId, pages, …)` directly. No confirm and no checks. Not exercised live (no publish allowed) | code |
| BK-21d server runs checks | OPEN (code) | `startPublish` never calls `runPrePublishChecks` | On origin/main `runPrePublishChecks` (publish.service.ts:25) is called only from the `sites.prePublishChecks` router (sites.ts:453). `startPublish` (publish.service.ts:330-) checks in-flight, site/workspace state, save conflict and approval, but not the pre-publish checks | code |
| BK-40 formatted text / `&` in export | OPEN | Served export H2 text `Q&amp;A <strong>bold</strong> word`, 0 `<strong>` | V2 H2, typed "audit1014-r2 Q&A bold word", "bold" + inline Bold. Model `audit1014-r2 Q&amp;A <strong>bold</strong> word`. Export: `Q&amp;amp;A &lt;strong&gt;bold&lt;/strong&gt;`. Served H2 text **`audit1014-r2 Q&amp;A <strong>bold</strong> word`**, **0 `<strong>`** | bk40.json, bk40-served.png, bk40-export-index.html |
| BK-42 image after blocked createAsset | OPEN | After reload `attributes:{}`. One file → 3 Blob PUTs, 2 `media_assets` rows | First createAsset aborted; upload `audit1014-r2-amber.png`; tile click → `src="blob:…"` + toast "…is only on this device…". After reload: **`attributes:{}`, no src**. Reload retry → **3 Blob PUTs, 3 createAsset requests (1 aborted, 2×200), 2 rows** (`cmv8k7xy1001kfathz227g9w8`, `cmv8k7xy1001mfathv0ijc8q6`). The retry also re-fetched V's teal/orange assets | bk42.json, bk42-after-*.png |
| BK-44a GET | OPEN | GET → visitor data in the query string, 405 | Form `method="GET"` (engine setAttribute; restored afterwards) → export → `wireForms` → served. Wired open tag carries **both `method="GET"` and `method="POST"`**; browser sends **GET** with `fullname=…&email=…` in the URL → **405**, blank page, no row | bk44.json, bk44-GET-*.html/png |
| BK-44b multipart | OPEN | 400 `{"error":"Invalid JSON"}` shown raw | `enctype="multipart/form-data"` → **400 `{"error":"Invalid JSON"}`** rendered as the page, no row | bk44.json |
| BK-44c text/plain | OPEN | same 400 | `enctype="text/plain"` → **400 `{"error":"Invalid JSON"}`**, no row | bk44.json |
| BK-44d radio default value | OPEN | Default radios store `"on"` | Default urlencoded POST (303), radio 1 picked → DB **`{"radio-group":"on"}`**. All three radios share `name="radio-group"`. Radio 3 (value set earlier via "Default") → `"large"` | bk44.json |
| BK-44e "Default" field | OPEN | Value is set only through a field labelled "Default" on the inner input; the choice block has none | Choice (label) inspector: Name, Checked by default, Required. **No Value**. Inner `<input>` inspector: Input type, Name, Placeholder, **Default**, Required, Disabled | bk44.json, bk44-label-inspector.png, bk44-input-inspector.png |
| BK-51 Paste HTML XSS | OPEN | `window.__audit1014===1`, live `<img onerror>` in canvas | Add › ⋯ › Paste HTML, payload `<p>&lt;img src=x onerror="window.__audit1014=1"&gt;</p>`. Dialog: "…scripts and event handlers are stripped… **1 event handler will be removed**". After Insert: **`window.__audit1014 === 1`**, canvas DOM has `<img src="x" onerror="window.__audit1014=1">`, and the model content holds the onerror. The element was removed afterwards | bk51.json, bk51-dialog.png, bk51-after.png |
| D7 VIEWER export includes IP | OPEN | `forms.exportSubmissions({format:"json"})` 200 with `"ip":"::1"` | Temp VIEWER (`myRole` VIEWER on V2): `exportSubmissions json` → **200, each row `"ip": "::1"`** (plus email/name). CSV → 200 with no ip column | bk44.json (`D7`) |

## Notes

- **BK-44 new observation:** a successful wired submit returns 303 to the site's old Vercel URL (`buildrik-site-e2e-blank-full-…-copy-….vercel.app/?submitted=1…`), which shows Vercel **404 DEPLOYMENT_NOT_FOUND**, not `_return`. Seen here only with the local stand-in; not checked against a real deploy.
- BK-11: there is no visible save pill text while saves fail (`pill:null`); the toasts carried the failure.
- BK-08: `reviews.revoke` logs the activity row under the caller's `siteId` (V2), not the review's site (L6).

## Not verified

- BK-21c/d live: "Try again" needs a failed real publish, and a server check needs a publish call. Both were code reads only, because of the no-publish rule.
- BK-12 through keyboard chords: copy and paste went through Element actions menu rows. Those rows run the same `copy-style`/`paste-style` commands as ⌘⌥C/V.
- BK-44 against a real published deploy: the export + `wireForms()` + temporary FormBlock stand-in was used, as in the L4/V runs.
- BK-42 `blob:` in export.

## Data created and cleaned (exact ids)

- Users deleted: `cmv8k28jf000014eumj4aco5u` (scoped EDITOR), `cmv8k2cwr000514eul9kecr0y` (capped ADMIN), `cmv8kbdwq0002meixxjqdslbc` (VIEWER). Memberships and SitePermissions went with them by cascade, and none remain.
- Reviews deleted: `cmv8k2835000mfath049ssuyq` (L6), `cmv8k2cw8000zfathpyx79bxr` (V2).
- AuditLog rows deleted: `cmv8k2bg6000pfathom6tucyy`, `cmv8k2big000sfathhkagsjkl`, `cmv8k2exe0012fathb2f3v52b`, `cmv8k2ez70015fathwy8f8y23`, `cmv8kbg3b0028fath5iv8qruz`, `cmv8kbgbi002bfathp852f7l4`. ActivityLog deleted: `cmv8k2cr4000xfathol3gb37u`.
- FormBlock `cmv8ka82f0001meixfad4q1qa` and submissions `cmv8kaffs001tfathm0dmpnth`, `cmv8kaixd001yfath3uh8lvgh` deleted, plus notifications `cmv8kafgs001ufath2jb4ceva`, `cmv8kaixu0021fathjgussefk`.
- Left on V2 (test content, by design): H2 text now "audit1014-r2 Q&A **bold** word"; image element `el-mv8k7m8a-1pkqcnskfnl` with no src; media_assets `cmv8k7xy1001kfathz227g9w8`, `cmv8k7xy1001mfathv0ijc8q6` and their Vercel Blob objects `audit1014-r2-amber*`. The Paste-HTML element, the BK-12 paste/reset (undone), the H3 `:hover` rule, the P Mobile rule and the form method/enctype were all reverted.
