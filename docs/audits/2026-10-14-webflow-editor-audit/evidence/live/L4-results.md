# L4 live results — Area F content & data (site audit1014-L4 = cmv7v81ss000ti7dbzhf170xf)

App http://localhost:3300 @ df60cf9ec, owner qa@buildrik.local, 1440×900, 2026-10-14. Evidence: `scratchpad/audit/live/L4/` (one JSON per script, PNGs, downloads in `export/<tag>/`, scripts in `L4/s/`).

**Publish-equivalent limit (applies to every "live page" claim):** nothing was published. Instead:
- The editor's own Export (ZIP / HTML / React) was downloaded, unzipped, and served from a local static server on a random port (stopped afterwards).
- For forms, the exported page was put through the real `lib/publish-forms.ts wireForms()` (run with tsx) to get the HTML publish would ship. That page was submitted in Chromium to the real `/api/public/forms/<site>/<block>` endpoint.
- The FormBlock row (created by the inspector, `isActive=false`) was set to `isActive=true` in the local DB to stand in for publish. It was reset to false afterwards.
- The server-side publish snapshot (`cms.publishSnapshot`) was NOT exercised. The ZIP does not run it.

**Users:**
- Owner session.
- Existing VIEWER `cmsn03n6e0000aa7lahci4zdf` (magic link).
- A temp EDITOR: user `audit1014-l4-editor-u1`, member `audit1014-l4-editor-m1`. Both were deleted afterwards by exact id.

## Summary

42 §10 checks plus the P0s (F-01, 02, 04, 05, 06, 47):

| Verdict | Count |
|---|---|
| CONFIRMED | 31 |
| PARTIAL | 6 |
| NOT REPRODUCED | 3 |
| BLOCKED / not run | 6 |

The two most important results:
- **F-47 executes script in the editor origin.** Proof: the flag was set, even though the paste dialog promised the handler would be removed.
- **Every formatted or `&`-containing text exports as escaped literal text (F-01).**

## Check table

| # | ID | Verdict | Measured (steps → result) | Evidence |
|---|---|---|---|---|
| 1 | F-01a entities | CONFIRMED | Heading typed `audit1014 Q&A <b>x</b>` + Enter → canvas innerHTML `Q&amp;A &lt;b&gt;x&lt;/b&gt;`. ZIP and HTML export: `Q&amp;amp;A &amp;lt;b&amp;gt;`. The served export page shows literal `Q&amp;A <b>x</b>` (`hasAmp:true`) | t1.json, export/t2, t3-exported.json/.png |
| 2 | F-01b bold | CONFIRMED | Toolbar **B** on one word → canvas `<strong>bold</strong>`. Preview: strong fontWeight 700, which looks right and hides the bug. Export `&lt;strong&gt;`. Served page shows literal `<strong>bold</strong>` and has 0 `<strong>` elements. React export is the same | t1, t4.previewStrong, t3-exported |
| 3 | F-01c template | CONFIRMED | Pages › From template › SaaS Landing › Create page. Canvas h1 `Ship faster with<br><span style="color:#a5b4fc">…`. ZIP saas-landing.html h1 `&lt;br&gt;&lt;span style=…&gt;` | t6.json, export/t7 |
| 4 | F-02 Tabs/Modal | CONFIRMED (export) | Served ZIP: tabpanels `[block,none,none]` before and after clicking tab 2. `.modal-overlay` stays `none` after clicking Open Modal. 0 `<script>` tags in the page | t3-exported.json/.png |
| 5 | F-07 drag into heading | CONFIRMED | Dragged Add › Divider onto the heading's middle → `<h2>…<hr></h2>`. Double-click → `isContentEditable:false`. React export: `<h2><hr/></h2>`, heading text dropped | t5.json, export/t7/test-react/components/Home.tsx |
| 6 | F-47 paste XSS | **CONFIRMED** | Paste HTML `<p>…&lt;img src=x onerror="window.__audit1014=1"&gt;</p>`. The dialog said "1 event handler will be removed". After Insert, `window.__audit1014===1` and a live `<img src="x" onerror=…>` sits in the canvas. Export escapes it as text, so the export is safe | t2.json, t2-paste.png |
| 7 | F-22 link state | CONFIRMED | Part 1: A=URL https://a.com. On new Button B (no href), Link to=URL → B field shows `https://a.com` and B `href=https://a.com`. B shipped with a.com in the ZIP. Part 2: A set to b.com, Undo → field shows b.com, href is a.com | t4.json, export/t7 |
| 8 | F-23 Preview page link | PARTIAL | Button Link → Page › About. In Preview the button has `href="#page:<id>"` and no `<a>` wrapper. Clicking does nothing: frame stays `about:srcdoc`, body unchanged. `location.hash` stays `""` (the claim predicted `#page:<id>`) | t4.json |
| 9 | F-24 Clear formatting | CONFIRMED | Select all, click ✕ Clear formatting, click outside → innerHTML still `<strong>bold</strong>` | t1.json |
| 10 | Toolbar focus | CONFIRMED (worse) | Inline edit, select "word", 🔗, click the URL field, type `x`. `activeElement` stays `P`, the URL field stays `""`, and the paragraph's selected word was replaced by "x". The Text-style select was not found inside `.bd-inline-toolbar` (rendered elsewhere / not measured) | t5.json, t5-linkpopover.png |
| 11 | F-03 / RT-01 | CONFIRMED (worse) | Steps: route-abort `createAsset`, upload, click tile. Result: Blob PUT 200, no error toast; img `src=blob:…`; after reload the img has no src and the library still lists the asset. After reload the retry made 2 more Blob PUTs + 2 `createAsset` calls → 2 duplicate DB rows (3 Blob PUTs for 1 file). The image stays src-less | t9.json, DB media_assets |
| 12 | F-21 blob in output | CONFIRMED (ZIP) | Blocked createAsset, uploaded green.png, inserted, exported ZIP → index.html contains `src="blob:http://localhost:3300/…"` | t13.json, export/t13 |
| 13 | F-10 drag alt | CONFIRMED | Asset alt "Test alt", image alt "Old". Drawer card dragged onto the image → src replaced, alt=`null`. Dragged onto empty canvas → new img alt `null` | t14.json |
| 14 | F-11 zoom drop | CONFIRMED | At 50% zoom, dropped 300px right of the root's left edge → new img `left:310px`, which renders 145px from the root's left edge | t15.json, t15-zoom.png |
| 15 | F-12 lock bypass | CONFIRMED | Locked the image (⋯ › Lock), selected it via Layers, clicked another drawer tile → src changed, toast "applied ✓". Library "Apply latest saved version" also rewrote the locked image's src | t15b.json, t16b.json |
| 16 | WS-01 / F-13 | CONFIRMED (first half) | Route-abort `moveAsset`, drag card to folder → folder count 0→1, no toast/modal. DB `folderId` still null; after reload the count reconciles. Cross-device metadata not run | t11b.json |
| 17 | F-06 shared library | CONFIRMED | `media.listAssets({siteId})`: owner 3, VIEWER `total:0`, temp EDITOR `total:0`. The EDITOR's drawer reads "Assets · 0 · No images or files yet" while 5 Blob images sit on the canvas | f06.json, e1-editor.json |
| 18 | F-14 version restore | PARTIAL | Library › Edit image › Flip H › Save version → v2. Versions › "Apply latest saved version" → "Apply to 2 uses" changed the placements to the v2 .webp. No `media.restoreAssetVersion` call (client-side apply). The library tile src is unchanged. "2 uses" counted an image whose src had already moved to another asset (stale usage). There is no UI to restore v1. P2002 not observable | t16.json, t16b.json |
| 19 | F-15 folder delete | CONFIRMED | Moved the in-use asset into folder F, then Delete folder › "Delete folder with contents". `media.deleteAsset` 200, no Undo toast, the placed img keeps its src. The blob returned 200 at first (cache), then 404 a minute later. The canvas image is now broken | t12.json, t14-error.png |
| 20 | F-18 GIF / F-20 alt | CONFIRMED | GIF: a 2-frame GIF uploaded → stored blob is RIFF WebP with 1 frame (PIL), `mimeType image/webp`, URL ends in `.gif`. Alt: 10 keystrokes → 10 `media.updateAsset` requests, AND the value ended as `xdfj` (characters lost); see N-3 | t13.json, dl/anim, t10b.json |
| 21 | UX-20 | PARTIAL | Background colours: top split `rgb(17,24,39)`, empty-library `[mgr-empty-upload]` `rgb(26,86,219)`, empty-folder `rgb(26,86,219)`. That is 2 distinct values, not 3. `mgr-view-grid` and `mgr-gridn` both read "Grid": confirmed | t10.json, t11.json, e1-editor.json |
| 22 | F-05 radio value | CONFIRMED | 3 Radio blocks in the form, Name=size. No Value control in Style, Behaviour or Effects; `value` attr null. Picked radio 3 on the wired page and submitted → DB `data = {"size":"on",…}` | t20.json, f05-submit.json |
| 23 | F-04 GET/multipart/plain | CONFIRMED | Wired form: `method="GET" action=… method="POST"`. GET submit → visitor data goes in the query string, 405, blank page. Multipart → 400 `{"error":"Invalid JSON"}` shown raw. text/plain → same 400 | f04-*-submit.json, export/t23-* |
| 24 | F-33 custom action | CONFIRMED | Action URL `/submit` → `wireForms` returned `forms:[]`, 0 `_return` inputs. Submit → 404 on the static host | f33-submit.json |
| 25 | F-35 select options | CONFIRMED | Options field (label "Options (one per line)", no aria-label) reads `""`. Typed Red⏎Blue → `select.options.length === 4` (Red, Blue, Option 1, Option 2), still 4 after reload. The field then shows only "Red\nBlue" | t21.json, t22.json |
| 26 | F-36 / F-38 | CONFIRMED | Select row summary `choice · Text`. Type → Long text replaced it with a TEXTAREA and the options were lost. Add field ×2, delete field-3, Add → two `name="field-4"`. The submission joined them: `"field-4":"v3, v4"` | t19.json, t21.json, f05-submit.json |
| 27 | F-39 | CONFIRMED (part 1) | Then=Redirect, URL set → 1 `forms.updateBlock`. Clear + blur → no request; DB `redirectUrl` still `https://example.com/thanks`. Part 2 (message change after publish) BLOCKED: needs publish | t19.json |
| 28 | Form roles | PARTIAL | EDITOR: Send to reverts and the inspector shows "Only workspace Admins can change the notification email." (as designed); API → 403 for `notifyEmail`, 200 for `successMessage`. VIEWER: `forms.listSubmissions` 200 (no FORBIDDEN on listing). `forms.exportSubmissions({format:"json"})` 200 and includes `"ip":"::1"` → F-50 confirmed. The Settings › Form submissions UI banner was not opened | e1-editor.json, roles-viewer-api.json |
| 29 | UX-15 / IA-11 | CONFIRMED | `content-empty` has 4 buttons (x60, w279). `cms-ws-new-collection` is in the header (x992,y70). `cms-ws-empty` is the right column (x1140, w300, h844). The 800px centre (x340–1140) is empty | c1.json, c1-cms.png |
| 30 | UX-17 | CONFIRMED | Create a collection → `#cms-collection-name.value === ""` while the step-1 pill bg is `rgb(14,159,110)` = `--bk-success #0e9f6e`; steps `aria-hidden=true` | c2.json, c3.json, c2-modal.png |
| 31 | F-08 slug merge | CONFIRMED | "audit1014 Menu-items" + field `extra` → upsert 400 `CMS_CONFLICT:SLUG_TAKEN:mv7zd7g5-buuy7xc`. The new collection never appears, there is no toast, and the existing collection did not gain `extra`. The user's collection is silently discarded | c12.json |
| 32 | F-41 undo id | CONFIRMED (draft path) | Draft R2 `mv7zhv67-jryrraq` deleted → Undo → `cms.entries.upsert` with new id `mv7zvcqp-2tg6r9h`. A published record that owns a page gets the typed-DELETE dialog ("can't be undone", no Undo). A heading pinned to deleted R3 went blank with no warning. `cms-preview` text not found | c10.json |
| 33 | F-42 SEO pattern | CONFIRMED | SEO title `{price} · Menu` saved. Renamed key price→cost → upsert payload `pageSeoTitle:"{price} · Menu"` unchanged; `cms-dp-seo-error` "price is not a field…". The field panel says "Nothing is bound to this field". (The title key is disabled while it has bindings, so the test used price) | c11.json |
| 34 | F-43 CSV types | CONFIRMED | Imported `false,"a,b"` → table "Yes", `#cms-field-available=yes`, no tag chips. Publish + Save → "tags must be a list of options" | c7.json |
| 35 | F-09 list order | CONFIRMED | Canvas list [CSV1,R3,R2,R1] → edit R1 price → [R1,CSV1,R3,R2]. Canvas shows drafts (R2, CSV1). The Collection section offers only Collection / Show items / Open collection: no sort, filter or offset | c8.json, c9.json |
| 36 | F-46 nested list | CONFIRMED | Inner list (same collection) inside the outer card: outer clone R1 → inner [R1×4], R2 → [R2×2], CSV1 → [CSV1×2]. The outer item is substituted into the inner template. Export shows only 1 card (see N-5) | c14.json, export/c14 |
| 37 | CMS outbox | NOT REPRODUCED (works) | Offline, edit + save → "Saved on this device only. The server is offline…"; `bk-cms-outbox-v1` has `entryUpsert:mv7zh3qr…`. Back online → outbox `{}`, DB cost=12. The flush happened on reconnect, before the reload, so "upsert before list" ordering was not measured | c13b.json |
| 38 | F-52 hydrate failure | NOT REPRODUCED | Blocked `cms.collections.list` with collections cached, reloaded → `content-load-error` shown ("Couldn't load your collections… Try again", role=alert). The console also logs `[cms-sync] hydrate from server failed` | c13.json |
| 39 | WS-03 | CONFIRMED | Blocked `siteComponents.library` → Add › SAVED COMPONENTS reads "0 · No saved components yet" (24 normally). No `role=alert`, no retry. Console `[component-sync] library read failed` | c13.json, c13-blocked.png |
| 40 | CMS role | NOT REPRODUCED | VIEWER (lands at `?view=readonly`): D → toast "View only — … CMS … need an Editor role", no workspace. ⌘K "Manage CMS records" returns 0 hits, so the workspace does not mount | v1-viewer.json |
| 41 | Ecommerce | CONFIRMED | Add search: "cart" and "Product Card" → "Nothing matches". "product" → only the "Menu grid" block (no product element). No collection setup was reachable from these | explore2/3 |
| 42 | Inspector placement | CONFIRMED | Image: Source (Choose image/Replace) and Alt text in Style; Behaviour has no Link. Button: text ("Edit text on canvas") and Type in Style, Link in Behaviour. Input: Fields › Label set `placeholder` to "…LabelViaFields", Style › Placeholder then showed it and overwrote it | t8.json, explore4, t19b.json |

Not run from §10:
- #12 real publish `curl` (replaced by the ZIP check).
- #16 second-profile metadata.
- #27 part 2.
- #28 Settings UI banner.
- #4 / #22–24 on a live Vercel page (replaced by export + wireForms).

## Journeys

**1. Update content**
- Inline edit works and persists (`sites.saveProject` 200 ×6).
- Rich formatting looks right on canvas and in Preview, but exports as escaped text (F-01).
- Clear formatting is dead (F-24).
- The toolbar link popover steals focus and corrupts text (#10).
- Link to URL, Page and Anchor options exist. Page links are dead in Preview (F-23); B inherits A's URL (F-22).
- The ZIP exports a Button with a link as `<a href="about.html" style="display:contents"><button>` (F-31 confirmed).
- Export file is named `test.zip` (the page title), not the site name (minor).

**2. Assets**
- Normal path works:
  - Upload → `/api/asset-upload` → Blob PUT → `createAsset`. AI alt is auto-generated and applied to the element.
  - Click-replace, alt via Inspector, and reload persistence all work (t8).
- Failure path: RT-01 (F-03) confirmed.
- Library vs quick picker: the drawer and library share data. Header count "Assets · 1" disagreed with 2 listed tiles after the RT-01 retry.
- Folders: create works. Silent move failure (WS-01). Delete-with-contents has no undo (F-15).
- Versions: works client-side (F-14 partial).
- Lock bypass: F-12.

**3. Forms**
- Form inserted with Name/Email.
- Fields section, After submit, and Attributes (Action / Method / Encoding) all exist.
- Submission reached the DB through the wired export: data recorded with `size:"on"`, duplicate `field-4` joined, `sourceUrl` null (F-58 observed).
- Submissions inbox in the editor not opened; the API list returns the row.

**4. CMS**
- Collection created with Text / Boolean / Multi-select / Number fields and a page per entry.
- Records: 3 created (2 published, 1 draft) plus 1 CSV row.
- Collection-list binding works and shows drafts. Limit is the only control.
- Dynamic pages: template Page 4 → "Ready · 1 complete record will get a page · 2 unpublished drafts are skipped".
- Draft vs published: correct in the dynamic-pages count. The canvas list includes drafts.
- Delete + undo: changes the id (F-41).
- CSV import: types broken (F-43).
- Slug clash: silent discard (F-08).

## New findings (not in the code map)

- **N-1 (P0-adjacent):** The F-47 paste dialog's own note says "1 event handler will be removed" while the handler runs. The guarantee shown to the user is false.
- **N-2:** The inline toolbar link field cannot receive focus. Typing into it overwrites the selected text in the element being edited (#10).
- **N-3:** In the library, clearing the Alt textarea remounts it (the empty and filled branches differ), so focus is lost and later keystrokes are dropped. The DB was saved as `""`. While typing, the controlled value drops characters: 10 typed chars ended as `xdfj` in both the DB and the UI. (AssetDetailsPanel.tsx:752-765)
- **N-4:** The RT-01 retry creates duplicate asset rows. The library then shows two identical "audit1014-rt01" assets. The `media_assets.mimeType` is `image/webp` for PNG/GIF files whose blob URL keeps the original extension.
- **N-5:** ZIP/HTML export does not expand CMS collection lists. Only the template card (first record) is written: page-4.html has 1 card where the canvas shows 3–4. The server publish path was not tested.
- **N-6:** The React export uses `styles.heading_el-mv7x28xf-…` (hyphenated keys via dot access), which is invalid JS (`export/t7/test-react/components/Home.tsx:106`).
- **N-7:** A GET-method form leaks the visitor's name and email into the URL query string, which also lands in logs.
- **N-8:** Collection-list clones reuse the template's `data-buildrick-id` values, so the canvas DOM has duplicate ids.
- **N-9:** The "used in 2 places" usage counter in the library is stale after an image's src moved to another asset. "Apply version" then rewrote that image anyway.
- **N-10:** The ZIP blurb says "…and your media". The ZIP has no media folder; images point at remote Blob URLs, and broken `blob:` URLs can ship.
- **N-11:** The radio input's Inspector shows a text-input Type list and a Placeholder field. There is no Value or Radio type option.

## States seen
- empty (CMS, assets, folder)
- loading skeleton (Layers/Pages)
- error (CMS load error with Try again)
- disabled (key field bound; DELETE confirm until typed)
- saving / saved / offline-local ("Saved on this device only")
- validation (tags list error, SEO pattern error)
- read-only (viewer toast)
- conflict not reached

## Not verified (and why)
- Real publish or live Vercel pages for F-01, F-02, F-04, F-05, F-21 and F-39 part 2. Not authorized to publish; the export and wireForms stand-in is stated above.
- F-13 cross-device reconcile; F-16 audio; F-17 plan limits; F-19; F-25–F-28; F-37; F-40; F-44/45; F-48; F-51; F-53–F-61. Not in §10, or time.
- #28 Settings › Form submissions UI as VIEWER (API only).
- CMS-bound text double-escape on the publish path. Server snapshot not exercised.
- 1280×720 viewport not re-run.

## Data left on the site
- Pages: SaaS Landing.
- Home: test elements.
- Page 3: form (Action cleared, enctype text/plain).
- Page 4: collection lists and a heading.
- Collection "audit1014 Menu items": 3 records.
- Media: rt01 ×2, anim, local-only green.
- 1 form submission.
- FormBlock row reset to `isActive=false`.
- Temp EDITOR user deleted.
