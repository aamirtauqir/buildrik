# 05 · Build panels — Add · Components · Templates · Assets · Layers · Pages (2026-09-27)

Paths relative to `packages/editor/src/editor/`. Every live claim measured from the page. One state change: a single
asset click inserted an image; the save hit another auditor's conflict and was not kept (reload confirmed).

## 0. Where things live now

| Module | Rail? | Doors (live-verified) | Surface |
|---|---|---|---|
| Add | yes | rail, A | left drawer |
| Components | **no** | Add › Saved components › "Manage components ›" (bottom), `⇧A`, ⌘K | left drawer with "‹ Add" back row |
| Templates | **no** | Add › "Page templates ›" (last row, y=1780), `T`, ⌘K, Pages "From template", New page modal | full screen; hides topbar + rail |
| Assets | yes | rail, M, ⌘K, Inspector "Choose image" | drawer; "Manage assets ›" → full-screen library |
| Layers | yes | rail, L, ⌘K | drawer |
| Pages | yes | rail, P, ⌘K, page tab bar | drawer; page settings = centred modal |

While Components or Templates is open every rail button reports `aria-pressed=false`.

## 1. ADD
Header Add · ⋯ ("Paste HTML…") · ✕. Search takes over topbar field. Groups: ★ Favourites/Recent · ELEMENTS 54 (flat, open) ·
"✦ Generate a block with AI…" (only while ELEMENTS open) · BLOCKS 8 · BUILT-IN COMPONENTS 14 · SAVED COMPONENTS (own +
FROM LIBRARY) → "Manage components ›" · "Page templates ›".

**Scores (0–10):** Cohesion 6 · Misfit 7 · Duplicates **3** · Scope 8 · Discoverability **4** · Scent **4** · Bloat 5 · Surface 8 · Nav 6 · Cognitive **3**

| ID | Lens | Sev | Finding | Evidence | Prior |
|---|---|---|---|---|---|
| ADD-01 | Duplicates | **P1** | 13 of 14 built-in components = ELEMENTS rows (only `contact-form` unique). "card" → Card·Element + Card·Component, both insert `card`. | `build/catalog/groups.ts:40-41`; `src/blocks/blockRegistry.ts:195-210`; 13, 11 | NEW (G2-107 changed label only) |
| ADD-02 | Cognitive / discoverability | **P1** | 54 flat rows, no category headers (catalog has 6). List 1,718px in 800px panel; BLOCKS y=1676, AI y=1644, Page templates y=1780 below fold. | `BuildTab.tsx:73-75`; measured `s13` | STILL TRUE, measured |
| ADD-03 | Discoverability | **P1** | "Generate a block with AI…" exists only while ELEMENTS is expanded — collapse to reach BLOCKS and AI vanishes. | `BuildTab.tsx:300` | NEW |
| ADD-04 | Scent | P2 | One block, three names: `slider` = "Carousel" (Elements) / "Slider/Carousel" (components) while "Slider" = range input; Pricing vs Pricing Table; Progress vs Progress Bar; Testimonials ×3. | `catalog.ts:243-246, 483-487`; `src/blocks/Components/Slider.tsx:7-9` | NEW |
| ADD-05 | Duplicates / scent | P1 | "SAVED COMPONENTS 6" (1 own + 5 library) vs Components panel "2 found". 4 library masters insertable from Add but invisible in the manager. | `BuildTab.tsx:57-61,113`; `GroupSection.tsx:505-517`; `ComponentsTab.tsx:245-247` | A01-10 CHANGED |
| ADD-06 | Surface | P2 | Built-in component rows can't be dragged; element and saved rows can. | `GroupSection.tsx:467-474` vs `478-487` | NEW |
| ADD-07 | Scope | P3 | Generate shows "Target: Home · after Image" with nothing selected. | 15 | NEW |
| ADD-08 | — | — | Helper bands gone; Paste HTML moved to ⋯. | | A09-11 FIXED |
| ADD-09 | — | — | Search finds own saved components, not library masters. | `BuildTab.tsx:62` | A05-5 PARTIAL |

## 2. COMPONENTS
Drawer: "‹ Add", header ⛶ ✕, YOUR COMPONENTS / LINKED FROM LIBRARY, "+ Create component". Detail: "‹ Saved components";
Insert (link-styled), Update from selection…, Detach all, Duplicate, Delete; preview, STRUCTURE, USED ON; "‹ All saved components".

**Scores:** Cohesion 6 · Misfit 7 · Duplicates **4** · Scope 6 · Discoverability **3** · Scent 5 · Bloat 7 · Surface 7 · Nav 5 · Cognitive 7

| ID | Lens | Sev | Finding | Evidence | Prior |
|---|---|---|---|---|---|
| CMP-01 | Discoverability | **P1** | Only visible door = last row of a collapsed group at the bottom of Add; `⇧A`/⌘K not shown; no rail item active. | `GroupSection.tsx:520-533`; 20, 23 | A03-13 STILL TRUE |
| CMP-02 | Duplicates / cohesion | **P1** | Manager lists only this site's masters; workspace library only in Add → "Manage" opens a smaller set than the one you came from. | `ComponentsTab.tsx:245-247` | PD-19 CHANGED |
| CMP-03 | Nav | P2 | **Esc does not leave the detail screen live** (merged 2026-09-27; tests pass). Likely engine `deselect` bound to Escape marks the key handled first; detail handler bails on `defaultPrevented`. Unproven. | `ComponentDetailScreen.tsx:125-135`; `src/engine/commands/defaultCommands.ts:425-430`; 24 | **Recent merge — doesn't work live** |
| CMP-04 | Nav / scent | P2 | Two back controls, different labels, neither matches list title "Components". | 21 | NEW |
| CMP-05 | Scent | P2 | Insert looks like a link; Delete is a full-width wrapping red button; "Update from selection…" disabled with no reason. | 21 | NEW |
| CMP-06 | Discoverability | P3 | No search in panel. | `ComponentsTab.tsx:307-311` | A05-17 STILL TRUE |
| CMP-07 | — | — | One shared insert path with toast. | `component-library/instantiate.ts` | A-15 FIXED |

## 3. TEMPLATES
Full screen (`TemplatesTab.tsx`): "‹ Back to canvas", PAGE TEMPLATES (All 10 + one row each), help, "Reload catalogue";
grid of 10 cards each with blue "Preview template →", or in-place preview with Create page / Replace page… + devices.

**Scores:** Cohesion 8 · Misfit 8 · Duplicates 5 · Scope 7 · Discoverability **4** · Scent 7 · Bloat **5** · Surface 7 · Nav 7 · Cognitive 6

| ID | Lens | Sev | Finding | Evidence | Prior |
|---|---|---|---|---|---|
| TPL-01 | Discoverability | **P1** | Every visible door is a leaf (last row of Add y=1780; Pages/New page). `T`/⌘K not shown; no rail highlight. | `BuildTab.tsx:346-355`; 30 | still weak |
| TPL-02 | Duplicates | P2 | "Save page as template" only as a ⌘K Tools row — not in Templates, Pages row menu, or Add. | `defaultCommands.ts:606-611`; `PageContextMenu.tsx:111-146` | CHANGED |
| TPL-03 | Duplicates | P2 | Two catalogs: editor static list vs server `Template` table (dashboard). | `templatesData.ts:145` | PD-4 OPEN |
| TPL-04 | Bloat | P2 | Same 10 templates listed twice on one screen; sidebar filter has one category; help text twice; 10 identical primaries. | 30 | NEW |
| TPL-05 | Discoverability | P3 | No search though file header says there is. | `TemplatesTab.tsx:6-9` | A05-15 CHANGED |
| TPL-06 | — | — | Back to canvas returns to the originating drawer. | `StudioPanels.tsx:699-707` | A04-12 FIXED |
| TPL-07 | — | — | Real full-page view. | `tabsConfig.ts:79-83` | A04-16 FIXED |
| TPL-08 | Surface | P3 | Back to canvas top-left here, top-right in Asset library. | 30 vs 49 | NEW |

## 4. ASSETS
Drawer "Assets · 30" · ⋯ ("Select assets…") · "Manage assets ›" · Filter · grid · drop zone · Upload ▾ (Stock photos · Icons · Fonts).
Drill-in (double-click): alt + Regenerate; Used in, Versions, Edit, Optimise, Replace across site; Insert, Rename, Copy URL, Download, Delete.
Full library (`LibraryManager`): SMART filters, MY FOLDERS, Tags, Grid|List + "Grid ▾" columns, detail column.

**Scores:** Cohesion 5 · Misfit 6 · Duplicates **3** · Scope 6 · Discoverability **4** · Scent **4** · Bloat **4** · Surface 5 · Nav 6 · Cognitive 5

| ID | Lens | Sev | Finding | Evidence | Prior |
|---|---|---|---|---|---|
| AST-01 | Discoverability | **P1** | **No search in the drawer live.** Add/Layers/Pages take over topbar search; with Assets open it stays the generic ⌘K button though code intends "Search all N assets…". | `MediaTab.tsx:98-111`; 42a, `s6a` | NEW regression |
| AST-02 | Scent / surface | **P1** | **One click on a thumbnail inserts it into the page** (11→12 images, toast "picker-two added to page ✓"); double-click opens details. Same click in the full library only selects. ⌘Z didn't remove it in that session. | `SlimLauncher.tsx:628`; `AssetCell.tsx:95-107`; `LibraryManager.tsx:1107-1108`; 46 | NEW |
| AST-03 | Duplicates | **P1** | Two asset-detail editors with different layouts and version models (server restore points vs saved sibling versions). | `AssetDetailOverlay.tsx:1-30` vs `AssetDetailsPanel.tsx:400-415`, `VersionsModal.tsx` | FB-8 STILL TRUE; FC-6 PARTIAL |
| AST-04 | Surface | P2 | ADD FROM opens three surface kinds (Stock modal, Icons replaces drawer, Fonts modal); two icon browsers (drawer grid + Inspector `IconPickerModal`). | `SlimLauncher.tsx:802-870` | A05-16 icon half STILL TRUE |
| AST-05 | Scent | P2 | Counts disagree: drawer 30, library 29, ⌘K lists a hidden `-v2`. | 40 vs 49 | NEW |
| AST-06 | Bloat | P2 | Drawer drill-in ≈ full library inside 280px, one click from the real one. | 47 | STILL TRUE |
| AST-07 | Scent | P3 | "Grid" labels both the Grid/List toggle and a Columns menu. | 50 | NEW |
| AST-08 | Scope | P2 | Fonts managed in Assets and Brand, no link. | `SlimLauncher.tsx:869-880` | NEW |
| AST-09 | Ownership | P1 | Media owned per uploader; "MY FOLDERS" → teammates see different libraries. | 49 | A-11 NOT DONE |
| AST-10 | — | — | Esc in library search no longer closes library. | 52 | A04-15 FIXED |

## 5. LAYERS
Header Layers · ⋯ (Expand all, Collapse all, Display settings, Widen) · ✕. 28px rows with checkbox + hover "Dim in editor"/"Lock".
Footer "207 layers" ⓘ. Row menu: Cut, Copy, Paste, Duplicate, Delete, Rename, Group, Move to page…, Copy link.

**Scores:** Cohesion 8 · Misfit 9 · Duplicates 6 · Scope 7 · Discoverability 7 · Scent 6 · Bloat 7 · Surface 8 · Nav 7 · Cognitive 5

| ID | Lens | Sev | Finding | Evidence | Prior |
|---|---|---|---|---|---|
| LYR-01 | Duplicates | P2 | Canvas right-click vs Layers row menu differ for the same element (canvas: Save as component, Lock, Replace with block, Bind to CMS; Layers: Rename, Move to page, Copy link). | `panels/layers/components/LayerContextMenu.tsx:90-200`; `canvas/menus/actions/*` | NEW |
| LYR-02 | Cognitive | P2 | Permanent checkbox on every row (207), while Pages hides checkboxes behind select mode. | 63 | NEW |
| LYR-03 | Scent | P3 | Eye icon = "Dim in editor"; users read it as hide on site. | `s9` | NEW |
| LYR-04 | Search | P3 | " heading" (leading space) finds 0 of 207. | `panels/layers/index.tsx:423` | A05-13 trim part STILL TRUE |
| LYR-05 | Scope | P3 | Panel doesn't say which page it shows. | 60 | NEW |

## 6. PAGES
Header ⋯: Select pages…, Listings, Show structure, Reload, Widen. List + "+N from collections ›" + legend line. Footer Add page ·
From template · ⋯ (New folder). Row menu: Rename, Duplicate, Set as homepage, Replace layout…, Copy link, Page settings…,
Remove from folder, Delete. Select mode: dark bulk bar (Duplicate / Move to… / Delete) + Move dialog. Page settings = modal.

**Scores:** Cohesion 7 · Misfit 6 · Duplicates 5 · Scope 6 · Discoverability 7 · Scent 6 · Bloat 5 · Surface 7 · Nav 7 · Collab 5 (personal folders) · Cognitive 6

| ID | Lens | Sev | Finding | Evidence | Prior |
|---|---|---|---|---|---|
| PGS-01 | Surface | **P1** | **Bulk bar Delete overflows the panel** (x 298–350, panel ends 340; content 290px in a 279px bar) — reads "Delet". | `BulkToolbar.tsx:37-52`; 74; `s13` | **Recent merge — defect** |
| PGS-02 | Nav | P2 | With no folders the Move dialog's only option/action is "Top level", no "New folder". Says folders are personal. | `MovePagesDialog.tsx`; 75 | FC-4 PARTIAL |
| PGS-03 | Duplicates | P2 | Single page can't be moved to a folder from its own row menu. | `PageContextMenu.tsx:111-146` | NEW |
| PGS-04 | Surface / scent | P2 | In select mode, clicking a row name switches the canvas page; only the 16px checkbox selects. | `s11`; 80 | NEW |
| PGS-05 | Scent | P2 | No visible current page (active row has transparent bg; only screen-reader mark). | `PageRow.tsx:233` | NEW |
| PGS-06 | Duplicates | P2 | Page create/switch/delete in drawer AND page tab bar (visible while drawer open). | 70 | A09-13 STILL TRUE |
| PGS-07 | Scope | P2 | Pages holds site-level SEO (Listings scorecard, "Site SEO defaults ›", "Add redirect" → Settings). | `PagesTab.tsx:392-440`; `SeoTab.tsx:189-211` | related FB-1 |
| PGS-08 | Bloat | P3 | Permanent legend line explains icons the list barely shows. | `PageList.tsx:368` | NEW |
| PGS-09 | Scent | P3 | Show structure: "/ (no page)" at root, Home at "/home" — no homepage, or tree ignores homepage flag. | `SiteStructureTree.tsx:56-59`; 77 | NEW, unverified which |
| PGS-10 | Surface | P3 | Comment says "580px slide-over"; live it's a centred modal. | `PageSettingsDrawer.tsx:2` | doc drift |
| PGS-11 | — | — | "+2 from collections ›" door exists. | 70 | FC-1 FIXED |
| PGS-12 | — | — | One ⌘K Templates row; New page modal offers "From template". | 81 | A03-12 FIXED |

## 7. Cross-module overlaps

| # | Overlap | Sev | Recommendation |
|---|---|---|---|
| X-1 | Same block as Element, Block and Component (ADD-01/04) | P1 | One name per source; don't list registry blocks twice |
| X-2 | Components counted three ways (Add own+library, panel own+linked, Brand summary) | P1 | Components panel manages both scopes; Add only inserts; one count |
| X-3 | Components + Templates reachable only from bottom of Add, no rail highlight | P1 | Doors under Add header, or collapse ELEMENTS into categories |
| X-4 | Four click meanings (Add inserts, Assets drawer inserts, Library selects, Components opens detail) | P1 | Click previews/opens; explicit "+ Add" or drag inserts |
| X-5 | Search coverage uneven (Assets bug; Components/Templates none) | P1/P2 | Every drawer takes over topbar search, or none |
| X-6 | Two full-screen views with Back on opposite sides | P3 | One shared full-screen header |
| X-7 | "Move to page…" (element, Layers) vs "Move to…" (pages → folder) | P3 | Name what moves and where |
| X-8 | Icons in three places | P2 | Assets › Icons opens the Inspector picker |
| X-9 | Three multi-select patterns (Layers, Pages, Assets) | P2 | One select-mode pattern |

## 8. Prior-audit reconciliation
- **FIXED:** A09-11, A-15 / A02-7, A04-12, A04-16, A04-15, A03-12, FC-1 / A02-14, stock half of A05-16.
- **PARTIAL:** A05-5 (library masters not searched), FC-6 (two detail editors remain), FC-4 (folders personal, labelled only in Move dialog), G2-107 (label only; content duplication = ADD-01).
- **STILL TRUE:** A03-13, A05-17, PD-4 / A01-11, FB-8, icon half of A05-16, A09-13, trim half of A05-13, A-11.
- **CHANGED:** A01-10 / PD-19 (library in Add, not in manager); Save-as-template (none → ⌘K only).
- **2026-09-27 merges:** Move dialog present but Delete overflows (PGS-01) and dialog dead-ends without folders (PGS-02); component detail "used on" renders but Esc fails live (CMP-03); action toasts not exercised.

## 9. Not verified
Mutating flows (Templates Create/Replace; Components Create/Update/Detach/Delete + "used on" click; Layers Move/Group/Delete;
Pages Duplicate/Delete/New folder/drag/Set homepage + toasts; Assets Upload/Replace/Versions/Optimise/Rename/Delete);
Paste HTML modal; AI "Generate a block" output; saved templates (none on account); Inspector "Choose image" picker;
non-OWNER roles; widened drawers; keyboard-only; root causes of AST-01 and CMP-03; ⌘Z of thumbnail insert in a clean
session; homepage state behind PGS-09.
