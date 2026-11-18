# Panel 08 — Assets area and pickers: functionality specification (FD-PNL-08)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by FI-03 persistence (P1-D18) · not VERIFIED** (independent `design-qa-critic` review: pass 1 PROPOSAL with 5 blocking, pass 2 three small fixes applied). Runtime NOT RUN; geometry NOT MEASURED. *(DS)* = designer-selected under owner standing instruction "apply recommended answers" (2026-10-17). Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2, C6, N5, V1, V2; gap rows D2-1, D2-10, D2-20, D2-22, D2-24, T2-36, T4-3, T4-4, T4-5, T4-6, T4-9, T4-19; CS-10, CS-11, CS-12, CS-13, CS-14. "workspace" → "area" and US spelling throughout (SC-11) *(R-1018)*. Round 2: Q10, Q13, Q14, Q15 (Topbar Publish opens in the tray here, SC-7) *(R-1018b)*.
Governing IA: BD-01 (Assets visible in rail), IA-01, GEO-01 (resource nav 240/200/280, detail 320, picker dialog 720, temporary left picker 284), IAF-09 (A–M), FI-03 (asset recovery), Panel 02 (rail; temporary Asset picker; contextual pick keeps CMS active), Panel 03 (media insert), Panel 06 B6/C8 (Inspector Replace and Fill › Image), Panel 07 (CMS image/file fields). Ownership (brief §6): library discovery is **per user per site**; site-associated writes need site EDITOR; no team-wide library.

---

## 1. Purpose and boundary

Assets answers: **find, upload, organize and improve my files, and put the right one in the right place** — without confusing "manage the file" with "use it here".

Job: **J1 Build** — put the right file in the right place while building the site (00-STRATEGY §3). *(R-1018, D2-1)*

| In Assets | Not here (owner) |
|---|---|
| Library management (upload, folders, tags, search, metadata, default alt, versions, image editor, replace across site, delete/recovery), stock / icons / fonts management, usage | Placement source + local alt override → **Inspector** / **CMS field**; applying fonts → **Inspector / Brand**; insertion position → canvas target rules (Panel 03) |

Two ways to *use* an asset, one way to *manage* it:
1. **Temporary left Asset picker** inside Editor (284w, replaces Add/Layers) — insert, place on canvas, replace a selected image (Panel 02 §5).
2. **Picker dialog** (720w) in areas without a canvas — CMS image/file field, Brand/Site settings images.
3. **Assets area** — management only; offers **Place on canvas** which hands off to (1).

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)

Files: `src/editor/media/LibraryManager.tsx` (+ `.css`), `components/FolderTree.tsx`, `AssetGrid.tsx`, `AssetDetailsPanel.tsx`, `SiteFontsModal.tsx`, `image-editor/*`, `sidebar/tabs/media/` (`MediaTab.tsx`, `components/SlimLauncher.tsx`, `components/AssetCell.tsx`, `components/AssetDetailOverlay.tsx`, `components/PickModePanel.tsx`, `UploadZone.tsx`, `UploadAssetModal.tsx`, `StockSourceModal.tsx`, `MediaContextMenu.tsx`, `data/assetPick.ts`, `hooks/*`), `engine/media/MediaManager.ts`, `services/BuildrikSyncProvider.ts`, `AssetUploadService.ts`; server `media.ts` router, `media.service.ts`, `media-folder.service.ts`, `stock.service.ts`, dashboard `app/api/asset-upload/route.ts`.

| ID | Capability | Today |
|---|---|---|
| AS-01 | Entry | Rail Assets (M) → 280 drawer; viewers allowed; "Manage assets ›" → full-page library (Portal over editor, **no `inert`** behind) |
| AS-02 | Drawer | "Assets · N" + ⋯ Select assets…; search with scope line; Filter ▾ TYPE (**font bucket mislabelled "Icons"**) + folder menu; 2-col grid; "Showing N of M" + Load more |
| AS-03 | Library | FolderTree: Recent / In use / Unused + "My folders · Only you see these", New folder, drag to folder, Tags ▾; sort Date/Name/Size; grid/list; 2/3/4 columns; layout 256 / 1fr / 320 (details hidden < 1320); **no Load more** (only loaded pages); no virtualization |
| AS-04 | Item actions | Drawer detail: alt + Generate, Used in, Versions, Edit image, Optimize, Replace across site, Insert/Rename/Copy URL/Download/Delete. Library details: meta, alt (≤125), versions (APPLIED), Used in, ⋯ Rename/Replace across site/Optimize/Delete. Context menu: Insert, Select, Rename, Edit image, Move to folder, Copy URL, Copy alt, Replace across pages, Delete. **No in-place "Replace file"**; no Download in library menu |
| AS-05 | Usage | page elements only (`findByMediaSrc`); CMS fields not scanned; "Unused" = "No current site references" |
| AS-06 | Image editor | 960×740 modal: Crop / Adjust / Resize / Optimize (+ filter presets); WebP q85 default; Save version → new asset |
| AS-07 | Upload | limits image 10MB, video 100MB, audio 50MB, SVG 1MB, font 5MB; client accepts video/ogg + audio, **server rejects them** (audio stays local); quota + plan checks on **declared** bytes (🐞 A55 — the server trusts `clientPayload.bytes`, §5 Limits); SVG sanitized; progress **synthetic** — fixed milestones 25/50/75, then no events during the network PUT, so it stalls at 75 (`MediaManager.ts:1002-1201`; `onUploadProgress` plumbed only when a caller passes it, `AssetUploadService.ts:128`) *(R-1018, T4-3 — was "75→99 real")*; failure → `localOnly` + retry on `online`; duplicate toast; **FI-03 (reported, reproduction pending — brief :185): `blob:` URLs are stripped on save (`BuildrikSyncProvider.ts:830-840`), which can lose an image whose registration failed** |
| AS-08 | Stock | Unsplash photos, Pexels videos (env keys; NOT_CONFIGURED error); placeholder "Search Pexels and Unsplash…" misleading; credit line; save keeps only `assetSource:"stock"` (author/alt lost; no Unsplash download ping) |
| AS-09 | Icons | modal from Upload ▾ |
| AS-10 | Fonts | upload then "Add" (siteFont) two-step; not placeable; doors: drawer Add from › Fonts, Inspector FontPicker, library "Manage font"; **no Brand door** |
| AS-11 | Picker | `PickModePanel`: "Choose {noun}", "For {label} · {Kind}", click selects then "Use selected"; Esc/Cancel; Upload / From URL; single choice; **after replace always switches to Add tab**; outside pick mode a drawer click **implicitly replaces** a selected same-kind element (with an "applied ✓" toast — a deliberate A03 fix, `useMediaState.ts:198-226`) |
| AS-12 | Permissions | client EDITOR+ for writes; server `assertMediaWrite`; scope user + site |
| AS-13 | States | skeleton, error "Couldn't load your media." (copy replaced in §9 *(R-1018)*), empty, no-match, quota bar, no project, picker empty, library status "N not on the server"; no offline banner |
| AS-14 | A11y | grids `role=listbox` with Button cells (`aria-pressed`) — invalid; library Esc closes, ⌘K focuses search; upload `progressbar` |

Tests: ~93 files / ~1,060 cases (editor + engine); server media service only 4 cases.

## 3. Problems this design solves
1. **Implicit replace** on drawer click (IAF-09 E requires an explicit Replace; the A03 toast reports it but the choice is still made for the user) and **wrong return** after picking (always Add).
2. **Two library UIs** (drawer + full page) with different features (Load more only in drawer).
3. **Usage under-reported** (page-only) → "Unused" can be wrong; deletes risk breaking CMS content.
4. **Upload type mismatch** (client accepts what server rejects) and **FI-03 image loss**.
5. **No simple way to update an image with a new file** (only Replace across site with a separate asset); Replace across site partial per source (IAF-09 G requires all-or-none).
6. Mislabelled bucket, misleading stock copy, lost stock attribution.
7. Full-page library leaves the editor focusable behind it; invalid listbox semantics.

## 4. Target layout

### 4.1 Assets area (rail Assets)
```
rail │ ASSETS NAV (240)             │ LIBRARY (flex)                                        │ DETAIL (320)
     │ All assets          1,024    │ [🔍 Search assets…]  Type ▾ Tag ▾  Sort ▾  ▦/☰  [Upload ▾]│ photo.webp
     │ Recent                       │ ☐ ▢ ▢ ▢ ▢ ▢                                           │ 1600×900 · 240 KB
     │ Used on this site            │   ▢ ▢ ▢ ▢ ▢                                           │ Default alt [    ]
     │ No known placements          │ Showing 200 of 1,024 · Load more                      │ Usage · Versions
     │ MY FOLDERS · Only you see…   │                                                       │ [Place on canvas]
     │   Brand shots                │                                                       │ ⋯
     │ FONTS                         │                                                       │
     │ ‹ Back to Editor · Home       │                                                       │
```
(Back slot per Panel 00 SC-1: left end of the 56px work-area header — not in the nav, so it survives the ≤1280 nav collapse.) Sketch position of the back link is illustrative.
- **One management surface** *(DS, Panel 02)*: the drawer list and the full-page library merge into this area. Area replaces canvas + Inspector (dedicated area, rail Assets active); editor behind is not rendered/focusable (fixes inert gap).
- Nav sections per IAF-09 E: **All · Recent · Used on this site · No known placements** (renamed from "Unused" — honest about scan limits) · **My folders** (personal) · **Fonts** (section, replaces fonts modal for management; modal kept as the quick door from Inspector) · **Recently deleted** (NEW, OD-U3 — 30 days with Restore, Panel 24 §4.8 row pattern; shown once U-4 server soft delete ships). *(amended 2026-10-17 — source: Panel 24 §4.8 / SC-10, SC-15)*
- Toolbar: search (server search, truncated state shown; **`/` focuses it**; ⌘K opens the command palette scoped "In Assets", no longer the area search *(amended 2026-10-17 — source: Panel 18 / SC-10, SC-12)*), Type (Images, Videos, SVG, Icons, **Fonts** — bucket label fixed; **Audio dropped** until the server accepts audio uploads, §5 *(R-1018, T4-5)*), Tag, Sort (Date added, Name A→Z/Z→A, Size), Grid/List, density 2/3/4 cols, **Upload ▾** (Upload files, From URL, Stock photos & videos, Icons).
- **Icons** *(R-1018b, owner Q13)*: the Icons door (Upload ▾ › Icons, Type › Icons) and the Inspector icon control open **one** icon picker (SC-33) — managed here, chosen from the Inspector; no second picker.
- **Topbar Publish here** *(R-1018b, owner Q15)*: opens the **Publish task in this area's task tray, in place** (SC-7) — the library, filters and open detail stay as they were.
- **Load more** in the area (Fix) with stable selection across pages.
- **URL** keeps the Assets area and the selected asset (owner N5; IA-07 fallback when the asset no longer exists) *(R-1018)*.

### 4.2 Detail (320)
Tabs *(IAF-09 E)*: **Details** (preview, name, meta, default alt (Generate — AI alt text — hidden in this version, SC-21; the **auto alt-text on upload toggle is deferred to the AI Build tab**, owner Q14 *(R-1018b)* — the manual **Default alt** field stays, and Publish keeps its **Missing alt** check, Panel 14 §5.2), tags, folder) · **Usage** (known placements: pages + **CMS records** (NEW scan, by URL like the page scan) with Open ›; banner "Usage outside this site isn't checked") · **Versions** (existing: version family list with the APPLIED marker; new versions come from Edit image → Save version or from **Upload new version…** below).
Actions (all existing unless marked): **Place on canvas** (NEW handoff → Editor + temporary picker with this asset preselected) · **Edit image** · **Optimize** · **Upload new version…** (NEW flow, Option A: uploads the file as a new version in the family — pages store images by URL (`MediaCommandLayer.ts:251-262`), so no in-place overwrite — then offers **Replace across site** for the old version's placements) · **Replace across site…** · Rename · Copy URL · Copy alt text · Download (added to every menu) · Move to folder · Delete. Context menu keeps Insert and Select (Select = add to multi-select).

### 4.3 Temporary left Asset picker (Editor, 284) — Panel 02 §5
Header (canonical copy for all panels) **"Insert image at {parent › position}"** or **"Replace image · {element} › {property}"** (target captured at open) · Cancel. Search + Type filter + Recent/All toggle + Upload/From URL; 2-col grid; single choice. **Click = choose (selected state) → "Insert" / "Replace" button applies**; double-click applies directly *(DS)*; drag to canvas starts only here (canvas drop validation; Escape cancels drag). After apply: **insert** → inserted element selected, prior Add/Layers restored; **replace** → original selection kept, prior panel restored (Fix AS-11 "always Add"). Target gone/locked meanwhile → keep chosen asset, ask for a new target; never mutate the current arbitrary selection (IAF-09 G).

### 4.4 Picker dialog (areas without canvas, 720 / 480 / 960)
Used by CMS image/file fields, Brand/Site settings image fields. File fields accept only server-allowed types (images, video, fonts) — PDFs and other documents can't be uploaded yet (stated in the picker and Panel 07). Same library query, header "Choose image for {record › field}", Choose / Cancel, Upload inside. Returns focus to the field; CMS stays the active rail item (Panel 02).

### 4.5 Implicit replace on click — removed (Change)
Outside a picker, clicking an asset in the area **selects it** (detail opens); it never changes canvas content. Replacing a selected image is done explicitly via Inspector **Replace…** or the detail's Place on canvas (IAF-09 E). This reverses the A03 shortcut deliberately.
- **Drop on an existing image** (from the picker or an OS file drop): dropping on an image **inserts** the asset next to it (canvas target rules); only the centre **"Replace image"** drop zone replaces — the explicit replace gesture. → Panel 05 (owner C6) owns the drop zones *(R-1018, T2-36)*.

## 5. Upload contract

| Step | Rule |
|---|---|
| Accept | Client accept list **= server allow-list** (Fix): images (incl. SVG ≤1MB), video mp4/webm/quicktime, fonts; **audio and video/ogg greyed out with reason "Not supported for upload yet"** until the server accepts them (no local-only dead assets) |
| Limits | existing per-type size limits (technical, kept); **plan storage quota per SC-20** (Pro quota during the trial; at the Free limit after the trial, SC-18 Upgrade); over-size → inline row error "Choose a smaller file" (existing). **Engineering dependency (T4-9, 🐞 A55, security/billing):** the quota gate and the stored size must use the bytes the server actually received (blob size), not the client-declared `clientPayload.bytes` (`asset-upload/route.ts:129-139, 234`); no UI change — register in SC-9 / backlog *(R-1018)* |
| Progress *(R-1018, T4-3)* | per-file row. **Fix:** real byte progress needs `onUploadProgress` wired through `MediaManager` → `AssetUploadService` (engineering dependency — SC-9 "Real upload progress"). **Until it ships** the row shows an **indeterminate "Uploading…"** with no percentage — the synthetic 25/50/75 milestones are removed, never shown as real progress. Cancel during upload deletes immediately (IAF-09 I); reduced motion = static bar with the label |
| Confirm | asset appears as confirmed only after registration receipt; row states use the SC-4 vocabulary: "Uploading…" (transfer) → "Saving…" (registration) → "Saved"; failed → "Couldn't save — Retry"; offline → "Offline — will save when back online" *(R-1018, CS-12 — replaces the "Uploading" / "Waiting to sync" chip)* |
| Failure (**FI-03 fix**, depends on the persistence spec P1-D18) | registration failure keeps the file as **"Not saved to Assets — Retry"** *(R-1018, D2-24 — SC-11 never "library" alone)* with the local preview. **Stored representation (proposed):** the placement saves a pending token `asset-pending:{localAssetId}` (allow-listed by the sanitizer instead of the `blob:` URL) and the bytes stay in the device's local store; on reopen on the same device the preview and Retry return; on another device the placement shows "Image wasn't uploaded from the device it was added on" + Replace. Never stripped silently on save; publish pre-check lists unresolved images. **Interim guard until P1-D18 ships (C-1, review 2026-10-17 — required):** while any placement holds an unregistered local image, the bottom status shows "Image not uploaded yet — Retry" (Save failed tier, SC-4) and the exit/close guard blocks with "1 image isn't saved yet — Retry upload / Remove image / Stay"; save never strips the reference without this prompt. T-AS-04 is **BLOCKED** on P1-D18 for the cross-device part. |
| Duplicates | existing duplicate notice; offer "Use existing" *(DS)* |
| Stock: one provider missing *(R-1018, T4-19)* | existing fallback shows the other provider's results (INV A32) with a neutral notice "Showing {Unsplash photos / Pexels videos} only — {other} isn't set up"; filters listed: Photos / Videos switch, Orientation ▾, Color ▾ (existing) |
| Stock save | keep author, source URL and alt suggestion in metadata; Unsplash download ping on save (provider requirement); placeholder copy fixed: "Search Unsplash photos and Pexels videos" |
| OS file drop on canvas | kept (IAF-09 E); uses the same contract and inserts at the drop target |

## 6. Delete, replace, versions
- **Delete asset** *(amended 2026-10-17 — source: Panel 24 §4.9 / SC-15 E-4)*: **with known placements, until U-4 ships** the confirm stays (declared exception **E-4**; it states "After 8 seconds this can't be undone"). **After U-4** delete has no confirm: Undo toast + Assets › Recently deleted (30 days). The confirm, while it exists, shows known usage (pages + CMS) and, until the site-wide scan ships (SC-9), "May be used as favicon, social image or brand image — check Site settings"; if used: "Used in 3 places — those images will break" + **8 s grace Undo** (then Recently deleted after U-4); distinct from in-flight cancel (immediate). With no known placements: no confirm; the grace Undo toast reads "{Name} deleted · Undo" plus "Usage outside the known scan may exist" (after U-4: "{Name} deleted · Undo · Recently deleted ›") *(R-1018, CS-13 / D2-10)*. **Folder delete** = SC-15 class (a) Undo only: no confirm (today it always confirms, INV A37); assets move to All assets (no asset deletion) *(DS)*; toast "{Folder} deleted · Undo" (≥8 s) and Undo restores the folder and its membership; folders have no Recently deleted *(R-1018, S2, T4-6)*.
- **Replace across site:** preflight all captured page placements → apply **all-or-none in one document transaction** (one Undo); any invalid target blocks the batch with a list (IAF-09 G — **Change**: the current per-source partial behaviour, `MediaCommandLayer.ts:367,496`, goes). CMS usages are **listed only, with Open ›** to edit each record in CMS — not written by this action.
- **Upload new version (NEW flow):** see §4.2 — a version, then optional Replace across site; no live-site change happens without the user replacing placements and publishing.
- **Edit image:** dedicated work-area subview (IAF-09 F; replaces the 960×740 modal) — controls per IAF-09 H (crop presets, rotate/flip/zoom, adjustments −100..100, blur 0..20, resize ≤8192, WebP/JPEG/PNG, quality 10–100), filter presets kept; **Save version** (new asset, history receipt) · then optional "Use on the pages that use the original…" (= Replace across site flow).

## 7. Fonts
- Scope differs from the library: **site fonts are site-wide** (`listSiteFontAssets`), uploads are per user. The Fonts section lists **Site fonts** (all collaborators' fonts added to this site; others' rows read-only with "Added by {name}" — **NEW (API):** `listSiteFontAssets` returns only filename and URL today, so the owner name needs a server field) and **My font files** (my uploads, add/remove). Section and the Inspector quick modal use **one shared list component** (one writer: `updateAsset({siteFont})`).
- Area **Fonts** section: my uploaded font files with status "Added to site" / "Not added"; **Add to site** / Remove from site; preview line; family/weight metadata. Two-step model kept (upload ≠ available ≠ applied). Applying fonts stays in Inspector/Brand; Brand typography gets a **"Manage site fonts ›"** door (NEW) to this section with return.

## 8. Permissions and scope
- Discovery: **my uploads for this site** (+ unassociated) — unchanged; folder label "Only you see these" kept. Collaborators' library files are not listed (no team library); site fonts are (§7).
- Viewer: area read-only over the same scope — usually empty unless the viewer uploaded files before; Fonts shows site fonts read-only; upload/edit/delete/move disabled with reason.
- Disabled-with-reason copy: "{Action} needs Editor access" (e.g. "Uploading needs Editor access") *(R-1018, CS-11)*.
- EDITOR+: full; server refusals show inline, never optimistic.

## 9. States
| State | Behaviour |
|---|---|
| Loading *(R-1018, D2-20 — restated)* | skeleton grid cells (or 40 px skeleton list rows in list view) in the library; nav and toolbar drawn; reduced motion = static skeleton. Load failure: "Couldn't load assets — Retry" (server) vs "You're offline" (network) — replaces "Couldn't load your media." (DS §3; SC-11 noun) |
| No assets | "Upload your first image" + drop zone + Stock link |
| Search: no results / truncated / failed | distinct: "Nothing matches" · "Showing first 200 matches — refine" · "Search failed — Retry" |
| Offline | the offline notice is Panel 22's (banner slot, one polite announcement — CS-08/CS-10), no own banner; queued upload rows "Offline — will save when back online"; controls that need the server (Stock, From URL) disabled with "Needs a connection" *(R-1018 — was own banner + "Waiting to sync")* |
| Quota | existing bar; near-limit warning at **80%** (SC-18 / Panel 23 line; existing code band ≥80%) *(R-1018, T4-4 — was 90%)* |
| Asset missing (deleted elsewhere) | placement fallback "Image unavailable — Replace" |
| Stock not configured | Stock row disabled "Stock search isn't set up" |

## 10. Geometry and accessibility
- Area: rail 56 + nav 240 (200–280) + library flex + detail 320; library footer 32 holds the storage quota bar and "N not on the server" status; remaining < 480 → detail becomes subview with Back; ≤1280 nav collapses to "Assets navigation" overlay button (GEO-01).
- Grid cells 120–160 px auto-fill; list rows 40 (thumbnail resource list, owner V1 *(R-1018)*); nav rows and Recently deleted rows 32 (tool rows).
- Visual: DS §2 — area header 20/600, detail/section headers 14/600 and 12/600 sentence case (V6); info banners (e.g. "Usage outside this site isn't checked") neutral grey + icon (V2) *(R-1018)*.
- Picker 284 (Editor) / dialog 720 (areas).
- **ARIA:** grid uses the **grid** pattern (cells = `gridcell` with a selectable button; `aria-selected`), not listbox-with-buttons (Fix AS-14); roving focus with arrows; Space selects, Enter opens detail (area) / applies (picker); multi-select with Shift/⌘ in area for bulk Move/Tag/Delete (existing "Select assets…" mode kept); while ≥ 1 asset is selected the **shared bulk bar → SC-32** replaces the toolbar: "{N} selected · Move to folder · Tag · Delete · Clear" (owner Q10) *(R-1018b)*.
- Esc per Panel 00 SC-2: picker → cancel; area → back out of detail subview, then clear search, otherwise no-op; never leaves the area (use Back/rail).

## 11. Preservation map

| Old | New | Disposition |
|---|---|---|
| AS-01 drawer + full page | One area; drawer pick use → temporary picker | Merge |
| AS-02 filter labels | Fonts bucket label fixed | Fix |
| AS-03 folders, smart folders, tags, sort, views | Same; "Unused" → "No known placements"; Load more in area | Keep + Fix |
| AS-04 item actions | All kept (Rename, Optimize, Copy alt, Insert, Select, Edit image, Replace across site, Move, Copy URL, Delete); + Upload new version flow (NEW), Download in all menus | Keep + NEW |
| Quota bar (drawer `UploadZone`) | Area footer + Upload ▾ menu | Move |
| From URL / paste URL | Upload ▾ "From URL" | Keep |
| Drawer click implicit replace (A03) | Explicit Replace only | Change |
| AS-05 usage | + CMS scan; honest scope banner | Fix |
| AS-06 image editor modal | Work-area subview, same controls + presets | Redesign |
| AS-07 upload | Accept list aligned; FI-03 unresolved state; receipts; synthetic progress → indeterminate "Uploading…" until real progress ships (T4-3) *(R-1018)* | Fix |
| AS-08 stock | Attribution kept; copy fixed; ping | Fix |
| AS-09 icons | Same door (Upload ▾); **Assets › Icons manages icons and the Inspector opens the same picker — one picker, two doors → SC-33** (owner Q13) *(R-1018b)* | Keep + merge |
| AS-10 fonts | Area section + modal quick door + Brand door | Keep + NEW |
| AS-11 picker | Temporary picker / dialog; explicit target; exact return; no implicit replace | Redesign + Fix |
| AS-12 permissions | Same | Keep |
| AS-13/14 states, a11y | Completed | Fix |
| Folder delete confirm (INV A37) | Undo toast, no confirm (SC-15 class (a)) | Change *(R-1018, T4-6)* |
| Type filter "Audio" | Removed until the server accepts audio | Change *(R-1018, T4-5)* |

**Change:** in-session audio insertion is removed — audio files were local-only and never reached the server; upload shows "Not supported for upload yet" until the server allow-list includes audio. No other capability removed.

## 12. Acceptance (specified, NOT RUN)
| ID | Pass condition |
|---|---|
| T-AS-01 | Clicking an asset in the area with an image selected on canvas does not change the canvas |
| T-AS-02 | Inspector Replace… → picker "Replace image · Hero › Source" → choose → Layers/Add restored, selection kept |
| T-AS-03 | Place on canvas from area → Editor with picker → Insert at shown target → inserted image selected |
| T-AS-04 | Registration failure → "Not saved to Assets — Retry" *(R-1018)*; page save then reopen on the same device keeps the pending image with Retry; on another device shows the unresolved state; publish pre-check lists it |
| T-AS-05 | Asset used in a CMS record shows that record in Usage; "No known placements" excludes it |
| T-AS-06 | Replace across site with one locked placement → batch blocked, nothing changed; valid batch → one Undo reverts all page placements |
| T-AS-07 | Upload new version → version appears in the family; placements unchanged until Replace across site is confirmed; then one Undo reverts all page placements |
| T-AS-08 | Audio file drop → refused with reason; no local-only asset created |
| T-AS-09 | Area Load more beyond 200; selection survives paging |
| T-AS-10 | Keyboard: grid arrows, Space select, Enter apply in picker; screen reader reads selected state |
| T-AS-11 | CMS image field → picker dialog → choose → focus back on the field; CMS stays active |
| T-AS-12 | Existing ~1,060 media tests updated with the change, not deleted |
| T-AS-13 *(R-1018, T4-3)* | Before real progress ships: an upload row shows "Uploading…" with no percentage for the whole transfer (never stalls at a fake 75%). After: the percentage tracks bytes sent |
| T-AS-14 *(R-1018, T4-6)* | Delete a folder with 3 assets → no confirm; assets in All assets; Undo restores the folder and all 3 memberships |
| T-AS-15 *(R-1018, T4-4)* | Storage at 80% of quota shows the near-limit warning; at 79% it does not |
| T-AS-16 *(R-1018, C6)* | Drop an asset on an existing image → inserted beside it; drop on the "Replace image" zone → replaced, one Undo |

## 13. Review and not verified
Independent `design-qa-critic` review done (see Status line; this footer was stale until 2026-10-17). Not verified: runtime, upload/registration/quota with a real server, real upload progress (`onUploadProgress`, T4-3) and server-measured quota bytes (T4-9) *(R-1018)*, Unsplash ping, CMS usage scan cost, measured geometry, screen-reader output.
