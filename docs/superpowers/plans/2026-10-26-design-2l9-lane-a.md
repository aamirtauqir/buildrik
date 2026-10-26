# Buildrick Editor · design-2l9 · Lane L-A sub-plan (Editor: canvas, Layers, Pages, Add — page 03)

> **For agentic workers:** executed by the L-A lane agent with THE LOOP, one commit per archetype.
> Parent plan: `docs/superpowers/plans/2026-10-22-implement-2l9-design.md`. Its header, **Global
> Constraints**, **Review Focus** and **Manifest schema** apply here unchanged and are not repeated;
> where this file and the parent disagree, the parent wins.

**Branch / worktree:** `feat/design-2l9-lane-a` in `~/Desktop/buildrik-worktrees/design-2l9-lane-a`, cut from
`feat/design-2l9` @ `59c9fdf67`. PR target: `feat/design-2l9`. Probe port 5171.

**Inventory:** `packages/editor/docs/design-2l9/inventory/03-editor.md` / `.json` — 363 rows
(140 drift, 13 match, 208 missing, 2 blocked fixtures). Board copy is read from the local dump
(`docs/design-2l9/dump/page-3-4.json`, `page-3-10.json`); zero Figma calls planned.

**Owned paths (under `packages/editor/src/editor/`):** `canvas/`, `sidebar/tabs/layers/`,
`sidebar/tabs/pages/` (incl. `page-settings/`), `sidebar/tabs/build/`, `panels/layers/`, and for the
OD-3 rail change `rail/` plus the rail block of `sidebar/LeftSidebar.tsx` (`FigmaRail` + the Help
button — the rail renders there, not in `rail/`).

**Verification honesty.** The dump carries texts, instance names and a few frame boxes, not pixels.
No board screenshots exist locally and the lane may not spend Figma calls on them. A row is
`drift-fixed` only when its on-screen copy and structure were compared against the dump AND the
result was looked at (probe or RTL DOM); geometry stays "not compared" in `verifiedNote` until the
lead's live walk. Rows built but not compared stay `drift-open` with "built, not compared".

## Slices (ordered by user impact)

Play steps first (F1.02–F1.04, F3.08/F3.13 — the parts of F1/F3 that live in L-A paths; F1.03's
Content tab and F3.03–F3.11's captured target are L-B / L-C), then the largest drift clusters.

### S0 · REQUESTS #9 — readout double-escape (canvas footer + Layers names)
- Files: `panels/layers/data/layerUtils.ts` (`getLayerPreview`), test `layerUtils.test.ts`.
- Failing test: `getLayerPreview › decodes HTML entities once` ("Tom &amp; Jerry" → "Tom & Jerry").
- Board copy: none (bug). Closes REQUESTS.md #9.

### S1 · Add panel — Elements | Blocks | Components + insert target (F1.02, C01, C02, C09)
Rows: 7:18981, 7:19448, 302:3965, 302:4542 (panel half), 10:2, 10:370, 10:3787 (page 08/09 rows
named in the play inventory).
- Files: `sidebar/tabs/build/BuildTab.tsx`, new `sidebar/tabs/build/insertTarget.ts` (pure target
  resolver), `catalog/groups.ts`, tests `__tests__/BuildTab.test.tsx`, `insertTarget.test.ts`.
- Board copy: "Search elements…", segmented **Elements · Blocks · Components**; strip
  "Insert into {Parent}" / "{Page} / {Path} · At end" (or "· after {Sibling}"); locked:
  "{Parent} is locked" / "Unlock the parent to insert here." / "Unlock {Parent}"; stale:
  "Target no longer exists" / "Choose another container." / "Select target". Elements tab groups
  "Basic elements" and "Layout".
- Behaviour (code contract): insertion stays `useBlockInsertion` (lead-owned). The strip resolver
  mirrors its placement rule; REQUEST #10 asks the lead to make `useBlockInsertion` call
  `resolveInsertTarget` so there is one rule. The receipt "Text added to Hero · Selected on canvas ·
  Focus stays here" is a toast raised in `useBlockInsertion` → REQUEST #11.
- Code-ahead kept: ★ Favourites / Recent groups (inside Elements, above its groups), Saved
  components + From library (inside Components, below built-ins), "Page templates ›" (foot of Blocks),
  ⋯ › Paste HTML… (header ⋯). "✦ Generate a block with AI…" is `blocked:pr33-ai-removal` and is not
  touched (PR #33 deletes it).

### S2 · Layers footer, no-matches, display footnote, tree commands (F1.04, F3.08, F3.13)
Rows: 147:75914, 152:78614, 152:79032, 147:79328, 147:76329, 152:79864, 152:78185, 147:76773.
- Files: `sidebar/tabs/layers/LayersTab.tsx`, `panels/layers/` (no-results block,
  `LayerDisplaySettings.tsx`), tests `LayersNoResults.test.tsx`, `LayerDisplaySettings.options.test.tsx`,
  new `LayersTab.footer.test.tsx`.
- Board copy: "{N} layers · {K} selected", "… · 1 selected inside {Ancestor}" when the selected row is
  inside a collapsed branch, "{N} layers · No matches" while a search finds nothing; no-matches body
  "No layers match “{q}”" / "Search by name, type, tag or ID." / "Clear search"; display footnote
  "Personal editor view. Live-site visibility is edited in the Inspector."; ⋯ adds
  "Collapse to selection" and "Select mode".
- Conflict noted, not resolved by the lane: B3-L03 prints "8 layers · Compact rows" in place of the
  selection count, and the F1 play boards print "8 elements · Home". The L-family (Layers spec) wins;
  147:76773 stays `drift-open` with that note.

### S3 · Canvas footer bar — "Parent / Element · 1440 px · 52% · View" (base editor, ~30 rows)
Rows: 7:18654, 7:19791, 263:249222, 263:258914, the 13 "Manager closed" and 6 "Return · canvas view
state" rows (inheritsFrom 7:18654), 145:71013, 145:71444.
- Files: `canvas/CanvasFooterToolbar.tsx`, `canvas/hooks/useSelectionReadout.ts`, `canvas/Canvas.tsx`,
  `canvas/controls/CustomWidthModal.tsx`, tests `__tests__/CanvasFooterToolbar*.test.tsx`.
- Board copy: left a two-level path "{Parent} / {Element}" ("Home / Hero" for a section on the page,
  "{Page}" when nothing is selected); right "{width} px" (opens the page-width presets popover with
  Custom width…), "{zoom}%" (zoom menu), "View" (View menu).
- Code-ahead: W × H dimensions and the "{Type} ·" prefix → kept in the path's tooltip; "Inserting X →
  path" drag readout stays (board 4418:100890, still the only drag feedback).

### S4 · Canvas View menu + Grid and snapping dialog
Rows: 145:64586, 145:65011, 145:65889, 145:65448.
- Files: `canvas/CanvasFooterToolbar.tsx`, new `canvas/controls/GridSnapDialog.tsx`, tests.
- Board copy: "Canvas view" menu: "Grid · {n} px ›", "Rulers and guides…", "Snap guides",
  "Show outlines", "Focus mode". Dialog "Grid and snapping" / "Personal editor view. Existing element
  values stay unchanged." / toggle "Show grid and snap" / "Grid size" + 4/8/16 px presets /
  "Whole number · 1–100 px" / Cancel · Apply; invalid: "Enter a whole number from 1 to 100 px. Current
  grid stays {n} px."
- "Rulers and guides…" opens the rulers toggle in this wave (the shared-guides list is S11).
  "Show outlines" and "Focus mode" have no engine/shell state today → REQUEST #12 (shell overlay
  state is lead-owned); until then they are not drawn and 145:64586 stays `drift-open`.
- Code-ahead kept: Spacing (⌘⇧;), Badges (⌘B), X-Ray (⌘⇧X) stay as rows under a rule below the
  board's rows, chords unchanged; Breakpoint ▸ moves to the "1440 px" control (S3), Zoom ▸ to the
  "52%" control (already there).

### S5 · Pages manager layout (7 + 13 + 8 rows that keep the manager open)
Rows: 63:6393, 63:20585, 94:13447 (+ siblings), 65:17148, 63:22616, 63:21262, 63:21939.
- Files: `sidebar/tabs/pages/PagesTab.tsx`, `components/PageList.tsx`, `components/PageFolder.tsx`,
  `PagesTab.css`, tests `__tests__/PageList.test.tsx`, `PagesTab*.test.tsx`.
- Board copy: header "Pages · {n}"; segmented **Pages · Listings · Structure** under the search;
  root pages first, then "My folders" / "Only visible to you", then "Collection pages" with each
  generating collection ("Blog post", "/blog/{slug}", "{n} pages", "Open page", "Manage in CMS");
  legend "● marks a page with unsaved changes"; no results "No pages match “{q}”" + "Clear search";
  ⋯: "Select pages…", "Listings", "Show structure", "Reload" ("Recently deleted" is S12).
- Code-ahead kept: "Widen panel" (⋯), "Search everywhere" (no-results, below Clear search).

### S6 · Page row menu — Save as template…, Move to folder…, Move up / Move down
Rows: 63:13820, 131:41791, 127:38098, 131:39598, 131:40341, 127:38819, 127:40244, 131:41086,
127:39528, 134:44345, 137:53911, 137:55343, 137:56060, 137:56781, 137:59625.
- Files: `components/PageContextMenu.tsx`, `components/MovePagesDialog.tsx`, `PagesTab.tsx`,
  `useFolders.ts` (receipt only), tests `__tests__/PageContextMenu.test.tsx`, `MovePagesDialog.test.tsx`.
- Board order: Rename… · Duplicate · Set as homepage · Replace layout with template… · Save as
  template… · Move to folder… · Move up ⌥↑ · Move down ⌥↓ · Copy link · Page settings · Delete page.
  Boundaries: "{Page} is the first top-level page." / "… last top-level page."; in a folder:
  "Pages in a folder can’t be reordered." Receipts (toast + Undo): "{Page} moved to position {n}",
  "… · Still the homepage", "{Page} moved to {Folder} · {url} unchanged". Dialog "Move {Page} to…",
  "Choose where to organize {Page}. Folders are personal; only you see them. The page URL {url}
  stays unchanged.", "Top level (no folder)", "Move to {Folder}", "{Page} is already at the top
  level. No change is needed." / "Already at top level".
- Behaviour: Move up/down = `composer.elements.reorderPage` (one history step, undoable with ⌘Z).
  Save as template… = make the page active, then `TEMPLATE_SAVE_REQUESTED` (the existing modal).

### S7 · Rail Help menu (OD-3)
Rows: 263:255084, 263:255509.
- Files: `sidebar/LeftSidebar.tsx` (Help button only), `rail/tabsConfig.ts` (comment of record), test
  `rail/__tests__/`.
- Board copy: menu "Help" → "Keyboard shortcuts ?" (the sheet) · "Getting started" (hidden in view
  mode / for a viewer).
- OD-3 dispositions (rail = the board's 7: Add, Layers, Pages, Assets, CMS, Brand, Help — already
  the code's 6 + Help). Off-rail homes, all existing and unchanged: Templates → Pages "From
  template", Add "Page templates ›", ⌘K, T; Components → Add › Components, ⇧A, ⌘K; Settings →
  topbar "Site settings" + ⌘,; Publish → topbar Publish; History → save pill + H + ⌘K; Activity →
  site menu "Activity log" + ⌘K; Review → topbar review chip + R. The Keyboard legend card
  (4418:126882) loses the rail door → kept behind ⌘K "Keyboard legend" if that row exists, else
  REQUEST #13 (palette is lead-owned).

### S8 · Pages bulk bar + folder menu copy
Rows: 139:47668, 139:53653, 139:50620, 139:51389, 139:52895, 137:57493, 127:36696, 127:37393.
- Files: `components/BulkToolbar.tsx`, `components/MovePagesDialog.tsx`, `components/PageFolder.tsx`,
  `usePages.ts` (receipt copy).
- Board copy: bulk bar adds "Clear"; "Home is the homepage" disabled reason; "{n} pages duplicated ·
  Originals kept"; bulk move "Move {n} pages"; folder menu "Delete folder · keep page".

### S9 · Page settings copy and guards (drawer stays — see code-ahead)
Rows: 63:15939 (+4), 63:16507, 63:17061, 63:17617, 63:18758 (+3), 63:18189, 101:23620.
- Files: `page-settings/PageSettingsDrawer.tsx`, `UnsavedWarningModal.tsx`, `usePageSettings.ts`.
- Board copy: title "{Page} · Page settings", subtitle "Editing {Page} · {Active} stays open on the
  canvas"; guard "Leave without saving?" + "Save and leave"; save failure "Couldn’t save page
  settings. Your changes are still here." + "Retry save"; redirect offer "Later".
- `blocked:owner-page-settings-container`: the board draws a 720×700 modal, the code a 580 slide-over
  drawer (owner decision 2026-09 era). The lane changes copy and states only.

### S10 · New page dialog copy
Rows: 101:29978, 101:37542, 101:40412, 101:42581.
- Files: `components/NewPageModal.tsx`. Copy: "Create a page", "Name the page", "Couldn’t create
  {Page}. Nothing was changed." Capacity readout/limits (101:38257–39695) need a plan-capacity
  source → later slice S13 (server).

### Later slices (written here, NOT started in this wave)
- **S11 · Shared ruler guides** (~120 rows: 145:66698…, 145:67134…, 145:67569…, 146:73094…, the 39
  "Return · canvas with shared guides"). Needs an engine guide model with persistence on the project
  document, site-wide scope, lock, numeric add, undo of removal, sync/offline/conflict states and
  viewer read-only inspection. Engine is lead-owned → REQUEST, then the panel in `canvas/overlays/`.
- **S12 · Page trash / Recently deleted** (~30 rows: 63:20001, 142:53229…, 142:62396…). Needs a
  server model through the full chain (`packages/shared/schemas` → service → router → client) for
  soft-deleted pages, restore with slug collision, permanent delete (Admin, typed confirm),
  plan-limit restore, plus the ⋯ "Recently deleted" door and the delete receipt's door.
- **S13 · Plan page capacity** in New page (101:38257, 101:38980, 101:39695) — server read.
- **S14 · Offline states** for Pages / Page settings / page menu (94:14750, 94:28891, 94:30029,
  101:41127) — needs a connectivity source shared with L-F.

### Not L-A (tagged on page 03, owned elsewhere)
Inspector bodies / PagePanel / override rows (L-B); templates create/gallery/reconciliation and the
CMS leave guard (L-C); Redirect repair (L-E); ViewerRoleNotice (L-F); site menu, ⌘K palette,
shortcuts sheet, preview, share preview, page switcher (lead / Phase 1); inline text toolbar
(`panels/RichTextEditor.tsx`, unowned → lead); H1 guidance (`shell/hooks`, lead).

## Code-ahead rows — dispositions

| Capability | Where | Disposition |
|---|---|---|
| Widen / Narrow panel | Pages ⋯, Layers ⋯ | kept in the ⋯ menu |
| Spacing / Badges / X-Ray toggles + chords | canvas View menu | kept as rows under a rule below the board's rows |
| Breakpoint ▸ / Custom width… | canvas View menu | kept at the footer "{width} px" control |
| Zoom ▸ | canvas View menu | kept at the footer "{zoom}%" control (already there) |
| W × H + type in the readout | canvas footer | kept in the path tooltip |
| Paste HTML… (⌘⇧V) | Add ⋯ | kept in the Add ⋯ menu |
| Favourites / Recent / Saved / From library / Page templates › | Add | kept inside the tab they belong to (S1) |
| Remove from folder | page row menu | kept (board P125 has it in the folder member menu) |
| Search everywhere | Pages no-results | kept below "Clear search" |
| Keyboard legend card | rail Help | kept behind ⌘K (S7) |
| Rail panels beyond the 7 | `rail/tabsConfig.ts` | kept off-rail at the homes listed in S7 |
| AI rows (Add "Generate a block…", SEO "Write with AI") | Add, Page settings | `blocked:pr33-ai-removal` |

## Owner decisions raised
- `blocked:owner-page-settings-container` — modal (board) vs drawer (code). S9.
- `blocked:owner-layers-footer-variant` — compact-rows footer and "N elements · Page" variants vs the
  L-family "N layers · K selected". S2 applies the L family.

## Requests filed (in `packages/editor/docs/design-2l9/REQUESTS.md`)
- #10 `useBlockInsertion` uses `resolveInsertTarget` (one placement rule).
- #11 insert receipt copy "{Element} added to {Parent} · Selected on canvas · Focus stays here".
- #12 shell overlay state for "Show outlines" and "Focus mode".
- #13 (if needed) ⌘K row for the Keyboard legend.

## Acceptance for this wave
Each slice: targeted vitest green; `npx tsc --noEmit` exit 0; `pnpm run verify:ds` green before
each commit batch; manifest rows updated in the same commit. Play F1/F3 live walk and every-03-row
done are the lead's integration checks (the lane does not start a Next dev server).
