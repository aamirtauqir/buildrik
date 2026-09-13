# Assets · Clone Phase 1 — journeys and drift

Plan: `docs/plans/2026-09-13-assets-clone-phase1.md`. Source: Figma page
`Editor v1 Clone` (3397:13062), section `3695:19967` "CURRENT · Assets
selection and browsing · verified task states". Prototype edges cached in
`reactions-3695-19967.json` (deduped: control · trigger · action, with the
screen indices each edge appears on).

## Live env

_(filled in Task 3)_

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

## J-B per-type action table

_(filled in Task 2 Step 3 from the shots)_

## Drift table (filled during Tasks 3–9)

Verdict vocabulary = boards.json: `match` · `drift-fixed` · `drift-open` · `unreachable`.

| screen | journey | live shot | verdict | note |
|---|---|---|---|---|
| 3695:45155 | J-A | shots/live-3695-45155.png | | |
| 3695:20340 | J-B | shots/live-3695-20340.png | | |
| 3696:20326 | J-B | shots/live-3696-20326.png | | |
| 3696:20530 | J-B | shots/live-3696-20530.png | | |
| 3696:20734 | J-B | shots/live-3696-20734.png | | |
| 3696:20938 | J-B | shots/live-3696-20938.png | | |
| 3696:21142 | J-B | shots/live-3696-21142.png | | |
| 3696:21346 | J-B | shots/live-3696-21346.png | | |
| 3696:21550 | J-B | shots/live-3696-21550.png | | |
| 3696:21754 | J-B | shots/live-3696-21754.png | | |
| 3695:44543 | J-C | shots/live-3695-44543.png | | |
| 3695:44747 | J-C | shots/live-3695-44747.png | | |
| 3695:44339 | J-D | shots/live-3695-44339.png | | |
| 3695:44951 | J-E | shots/live-3695-44951.png | | |
| 3695:19968 | J-F | shots/live-3695-19968.png | | |
| 3695:20154 | J-F | shots/live-3695-20154.png | | |
| 3695:20614 | J-G | shots/live-3695-20614.png | | |
| 3695:43991 | J-G | shots/live-3695-43991.png | | |
| 3695:44165 | J-G | shots/live-3695-44165.png | | |
