# Assets · Clone Phase 1 — journeys and drift

Plan: `docs/plans/2026-09-13-assets-clone-phase1.md`. Source: Figma page
`Editor v1 Clone` (3397:13062), section `3695:19967` "CURRENT · Assets
selection and browsing · verified task states". Prototype edges cached in
`reactions-3695-19967.json` (deduped: control · trigger · action, with the
screen indices each edge appears on).

## Live env

- Unified editor `http://localhost:3000/edit/scratchver0000000000000001` (site `scratch-ver`, workspace "E2E Blank WS"; the free plan's 3/3 site cap blocked a fresh site).
- Login: seeded e2e QA account via the magic-link `auth.setup.ts` path; cookies imported into gstack `/browse`. Viewport 1440×900.
- Library seeded through the UI's file input with the 10 fixtures in `packages/editor/e2e/fixtures/clone-assets/`. No `BLOB_READ_WRITE_TOKEN`, so all 10 are `localOnly` ("10 not on the server") — accepted env, Q5. Rasters are transcoded to `.webp` by the upload pipeline (code:auto-webp), so the on-screen names read `hero-dark.webp` etc.
- Figma calls spent today: 29 of the 40 agreed (9 before the plan, 18 screenshots, 1 dragging-frame lookup, 1 dragging-frame shot).
- **Second pass, same day, with a Blob token** (store `buildrick-media`): every upload reaches `public.blob.vercel-storage.com`, the pill is gone, the footer reads the server quota (`1 MB / 500 MB`), a server-hosted asset applies to a selected image with "applied ✓", and a library `.woff2` is a family the Typography picker offers ("Inter Var", renders, survives reload). The five defects that walk found — CSP connect-src and font-src, Blob overwrite 400, unapplied migrations, an undrained retry queue, a decimal quota formatter — are in `BLOCKERS.md` → "Assets · Clone Phase 1". Rows 3695:43991 → drift-fixed; 3696:21550 usable, `Manage font` still Phase 5.

## The 19 screens

| # | nodeId | name | journey |
|---|---|---|---|
| 0 | 3695:19968 | Assets · List · no selection | J-F bulk mode |
| 1 | 3695:20154 | Assets · List · hero selected | J-F bulk mode, 1 checked |
| 2 | 3695:20340 | Assets · Menu cover selected | J-B, J-G replace |
| 3 | 3695:20614 | Canvas · Menu preview image replaced | J-G |
| 4 | 3695:43991 | Canvas · uploaded image applied | J-G |
| 5 | 3695:44165 | Canvas · team image applied | J-G |
| 6 | 3695:44339 | Assets · Search menu | J-D |
| 7 | 3695:44543 | Assets · Grid 2 columns | J-C |
| 8 | 3695:44747 | Assets · Grid 4 columns | J-C |
| 9 | 3695:44951 | Assets · Name ascending | J-E |
| 10 | 3695:45155 | Assets · No selection | J-A |
| 11 | 3696:20326 | Assets · Selected · chef-intro.mp4 | J-B |
| 12 | 3696:20530 | Assets · Selected · team-photo.jpg | J-B |
| 13 | 3696:20734 | Assets · Selected · logo-mark.svg | J-B |
| 14 | 3696:20938 | Assets · Selected · pasta-closeup.jpg | J-B |
| 15 | 3696:21142 | Assets · Selected · grand-opening.mp4 | J-B |
| 16 | 3696:21346 | Assets · Selected · star-icon.svg | J-B |
| 17 | 3696:21550 | Assets · Selected · Inter-Var.woff2 | J-B (Manage font) |
| 18 | 3696:21754 | Assets · Selected · terrace-night.jpg | J-B |

## Journeys (the prototype's own edges)

- **J-A Library chrome** (screen 10): Close · Import URL → overlay · Upload → "Upload files" overlay · Add from stock → overlay · SMART rows Recent / In use / Unused → scope swap · FOLDERS rows All assets / Products / Hero shots / Icons → scope swap · New folder → overlay · TAGS menu / team / food → scope swap.
- **J-B Single selection per type** (screens 2, 11–18): click card → details rail for that file. Actions per type: Edit image (img/png/svg — sets "Editing context = `<file> · <dims>`"), Insert to canvas, Rename → overlay, Delete → per-file confirm overlay, Replace across site… (a `COND` on mp4 — expect disabled/hidden for video), Manage font (woff2 only → Site fonts overlay), versions row → versions overlay.
- **J-C View switch preserves selection** (screens 7, 8, 2, 9): `g/2` `g/3` `g/4` `List` set `Assets / Selected view / {view,width,height,thumbs}` — the selected asset STAYS selected (audit A01).
- **J-D Search scope preserved** (screen 6): search "menu" → filtered set; view switch inside search sets `Assets / Scope search / *` — the query survives; sort inside search is a `COND`.
- **J-E Sort** (screen 9): sort → Name ascending; sort again → Date added.
- **J-F Bulk mode** (screens 0, 1): `select-mode` → List · no selection (checkbox column, rail hint); click a list row → `List · <file> selected` (rail: "1 asset selected", Delete; bar: 1 selected · Move to folder… · Download · Delete · ✕ Clear); ☐ toggles; ✕ Clear → no selection; `select-mode` again → library.
- **J-G Insert / apply to canvas** (screens 3, 4, 5 + typed edges from 11/13/15/16): image element selected → src replaced (3); nothing selected → new element (4, 5); mp4 → Video element, svg → image element (type only verified here; visuals are Phase 4).
- **J-H Drag start** (every card / row `DRAG` → "Assets · dragging hero-…").
- **J-I Overlays return to caller** (audit A06): Cancel in any overlay opened from the library returns with folder / search / selection UNCHANGED and no second overlay.

## J-B per-type action table (read off the shots, Task 2 Step 3)

Rail order top→bottom: preview · filename · meta line · ALT TEXT · VERSIONS · USED IN · actions.

| type | meta line | ALT TEXT | VERSIONS | USED IN | actions (top→bottom) |
|---|---|---|---|---|---|
| jpg / png (img) | `1600 × 1200 · 220 KB · PNG · added Aug 4` when measured; else `Selected asset · JPG` | field + `AI Generate` (or `Regenerate` when filled) | list (`name_vNNNN current` / older `Aug 2`) only when versions exist | `1 place — Menu preview` / `3 places — Home hero, Home banner, Menu card` / `Not used on this site` | Insert to canvas · [Edit image \| Rename] · Replace across site… · Delete (danger outline) |
| svg (ico) | `Selected asset · SVG` | `Not provided` + `AI Regenerate` | — | `Used in 5 places` | Insert to canvas · [Edit image \| Rename] · Replace across site… · Delete |
| mp4 (vid) | `Selected asset · MP4` | `Not provided` + `AI Regenerate` | — | `Used in 1 places` | Insert to canvas · Rename (full width, NO Edit image) · Replace across site… · Delete |
| woff2 (fnt) | `Selected asset · WOFF2` | — (none) | — | `Used in 1 places` | Manage font · Rename · Delete (NO Insert, NO Replace across) |
| none | rail reads `Select an asset to see details.` | | | | |
| bulk mode, 0 checked | heading `No assets selected` + `Select a file to inspect it. Select checkboxes to manage multiple assets.` | | | | |
| bulk mode, 1 checked | heading `1 asset selected` + `hero-dark.jpg · Select another file to use bulk actions.` | | | | Delete (danger outline) |

Other shape facts from the shots:
- Header: `Asset library` · search field `Search across all folders… ⌘K` · `⭳ Import URL` · `↑ Upload` (primary) · `+ Add from stock` · `Close`.
- Toolbar: `24 files · All assets` · type chips `JPG PNG SVG MP4` · `Grid · 3 columns` `2 3 4` · `List` · sort select `Date added ▾` / `Name A–Z ▾` · select-mode checkbox icon.
- Grid card: thumb (type glyph top-left for vid/svg/font) · filename · `● used ×3` / `○ Unused` (dot + text).
- List (bulk) table: ☐ · Name · Type (`IMG VID SVG FONT`) · Size · Usage (`used ×3` / `unused`). Bulk bar above the table when ≥1 checked: `1 selected` · `Move to folder…` · `Download` · `Delete` · `✕ Clear`.
- Search active: field reads `Search: menu · Clear × · ⌘K`; count reads `1 result for "menu"`; the previously selected asset stays selected.
- Footer: `24 assets · 84 MB / 500 MB` left; quota bar + `⚠ 2 not on the server` pill right.
- Canvas after Insert (3695:20614): the selected Image element's src changes; inspector `Image source` block reads `Menu preview · Image · menu-cover.png` with a `Choose image` button.

## Drift table

Verdict vocabulary = boards.json: `match` · `drift-fixed` · `drift-open` · `unreachable`. Every row is also in `packages/editor/scripts/conformance/boards.json` (family `Assets · Clone`, `page: 3397:13062`) with the full note.

| screen | journey | live shot | verdict | note |
|---|---|---|---|---|
| 3695:45155 | J-A | shots/live-3695-45155.png | drift-fixed | full-viewport overlay; title/header/count line/view words/sort/cards/video tile/rail 378; 32px controls kept (founder:density-32); Trash row + .webp names + WEBP chip kept (code) |
| 3695:20340 | J-B | shots/live-3695-20340.png | drift-fixed | one-column rail, per-type actions, USED IN names pages, Replace across disabled at 0 |
| 3696:20326 | J-B | shots/live-3696-20326.png | drift-fixed | no Edit image for video; `<video>` preview replaces the broken `<img>` |
| 3696:20530 | J-B | shots/live-3696-20530.png | match | 'Selected asset · JPG' fallback |
| 3696:20734 | J-B | shots/live-3696-20734.png | match | |
| 3696:20938 | J-B | shots/live-3696-20938.png | match | |
| 3696:21142 | J-B | shots/live-3696-21142.png | match | |
| 3696:21346 | J-B | shots/live-3696-21346.png | match | |
| 3696:21550 | J-B | shots/live-3696-21550.png | drift-open | reachable now (font uploads were impossible); 'Manage font' waits for the Site fonts overlay (Phase 5) |
| 3696:21754 | J-B | shots/live-3696-21754.png | match | |
| 3695:44543 | J-C | shots/live-3695-44543.png | drift-fixed | '2' = two per row; selection preserved (A01) |
| 3695:44747 | J-C | shots/live-3695-44747.png | drift-fixed | same |
| 3695:44339 | J-D | shots/live-3695-44339.png | drift-fixed | '1 result for "menu"'; library-only search (no stock toast); input fills the field. Open, minor: the Clone's query chip in the field |
| 3695:44951 | J-E | shots/live-3695-44951.png | drift-fixed | 'Date added' / 'Name A–Z' |
| 3695:19968 | J-F | shots/live-3695-19968.png | drift-fixed | ☑ enters select mode; header select-all; rail copy; Clear stays in mode; IMG/VID/SVG/FONT |
| 3695:20154 | J-F | shots/live-3695-20154.png | drift-fixed | bar + '1 asset selected' rail + Delete |
| 3695:20614 | J-G | shots/live-3695-20614.png | drift-fixed | Insert replaces the selected image, library closes (A03); usage ×1 after (A04) |
| 3695:43991 | J-G | — | unreachable | needs a server-synced upload (no Blob token); the apply path is 44165's and passed |
| 3695:44165 | J-G | shots/live-3695-44165.png | drift-fixed | new Image inserted + selected, library closes; mp4 → Video, svg → Svg |
| (4207:26629) | J-H | shots/4207-26629.png | drift-open | drag state is "dragging over folders" — a move-to-folder journey, Phase 2 |
| — | J-I | — | match | Import URL · Stock · Rename · Delete · Edit image · Replace across all cancel back with selection + scope intact, one dialog at a time (A06) |

## Not verified in this phase

- Server-synced usage, stock search results, published-page usage — no `BLOB_READ_WRITE_TOKEN` / `PEXELS_API_KEY` (Q5).
- Placement of inserted elements on the page (Phase 4 boards).
- Selection persistence when the search filters the selected asset OUT: the rail empties while the query is active and the selection returns when it clears — left as the code's reading; the Clone only shows a matching selection.
