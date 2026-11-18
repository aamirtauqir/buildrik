# Panel 03 — Add (insertion panel): functionality specification (FD-PNL-03)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · not VERIFIED** (independent `design-qa-critic` review: pass 1 PROPOSAL with 8 blocking, pass 2 two small fixes, pass 3 passed). Runtime NOT RUN; geometry NOT MEASURED. *(DS)* = designer-selected under owner standing instruction "apply recommended answers" (2026-10-17). Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): N1, N2, P1, P5, P12, V1, V5, V6, V7; gap rows D2-16, D2-24, D2-32, T3-1, T3-10, T3-15, T3-20 (partly), T3-25, T4-11, T5-04; CS-03, CS-14, CS-19, CS-22; INTERACTION_AND_STATE_MATRIX §3 (offline, long content, many items). Not applied: T3-21, T3-20 (icon half).

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged.

Governing IA: BD-05 (rail Add), BD-16/17 (workspace component reuse; package import/export lives in Manage components), BD-22 / FD-DYN-01 §9–10 (Add → CMS fields, List of {collection}), IA-01 hierarchy (Add → Elements, Blocks (+ section templates, "Page templates…" link), Catalog components, Saved components → From Library / Manage components; Generate a block subview), GEO-01 (Add/Layers panel 284 / 260 / 360, bounded resize, header/search sticky, one list scroll), IAF-04, IAF-06, IAF-11, Panel 02 (rail: Add enters Editor; temporary Asset picker).

---

## 1. Purpose and boundary

Add answers one task: **put something new on the current page, exactly where I expect.** It is an insertion surface, not a manager.

Job: J1 Build (00-STRATEGY §3) *(R-1018)*
Visual: SC-27 (DESIGN_SYSTEM_SPECIFICATION §2–§4); sentences SC-28 *(R-1018)*

| In Add | Not in Add (owner) |
|---|---|
| Insert elements, sections, catalog components, saved components (own + Component library), CMS fields (contextual), Collection lists, AI-generated section (hidden in this version, SC-21), pasted HTML *(amended 2026-10-17 — source: Panel 15 / SC-11, SC-21)* | Managing main components, import/export packages → **Components area** (Panel 13) *(R-1018, SC-11 nouns)* |
| Links to Page templates and Manage components, plus the "Components ›" header link (§6.6a) *(R-1018, N1)* | Page templates browse/apply → **Templates area** (Pages primary entry; Panel 15) *(amended 2026-10-17 — source: Panel 15 / SC-11)* |
| Search, favourites, recents | Asset library management → **Assets** (Panel 08); picking media → temporary Asset picker (Panel 02 §5) |

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)

Files: `src/editor/sidebar/tabs/build/BuildTab.tsx`, `catalog/catalog.ts`, `catalog/groups.ts`, `components/GroupSection.tsx`, `SearchResults.tsx`, `BlockThumb.tsx`, `BlockPreviewCard.tsx`, `FirstUseTip.tsx`, `GenerateBlockScreen.tsx`, `PasteHtmlModal.tsx`, `hooks/useBuildTab.ts`, `shell/hooks/useBlockInsertion.ts`, `blocks/blockRegistry.ts`, `canvas/hooks/drag/dropOperations.tsx`, `component-library/*`.

| ID | Capability | Today |
|---|---|---|
| AD-01 | Header | "Add" · ⋯ (Paste HTML… ⌘⇧V) · ✕ |
| AD-02 | Search | "Search elements…", `/` focuses (⌘F inside panel); query → flat results; no-results "Nothing matches '{q}'" + Clear; results inside `aria-live` |
| AD-03 | Favorites / Recents | Element rows only; favourites localStorage; recents max 8, **recorded at drag start even if cancelled** |
| AD-04 | ELEMENTS | 54 rows (53 unless Dark mode Auto shows Theme toggle) in 6 hidden categories; icon + hover description; drag note "Place the element in {path}…" |
| AD-05 | Generate a block with AI… | Row inside Elements; full subview: target band, prompt, 3 examples, quota line, Stop, Undo/Done, 4 error kinds; one undo step; no feature flag |
| AD-06 | BLOCKS | 8 section blocks (Hero, Features, Menu grid, Testimonials, CTA, Contact, Footer, Navbar); 2-col cards, SVG wireframe thumbs 65h; hover "Add" + 300ms preview card 320w; footnote "Blocks use your Brand colours and fonts." |
| AD-07 | BUILT-IN COMPONENTS | 14 click-only rows; **13 duplicate Elements rows**; only Contact Form unique; draggable in search only |
| AD-08 | SAVED COMPONENTS | This-page masters ("This page" tag, grip, draggable) + FROM LIBRARY sub-list (**not draggable, not searchable**) + "Manage components ›"; empty "No saved components yet. Select an element and choose Save as component." |
| AD-09 | Page templates › | Bottom button → Templates (section templates removed from Add 2026-04-23) |
| AD-10 | Collection list | Basic › Collection list (3-col grid, one `{{item.*}}` card) |
| AD-11 | Click insert | One transaction "Added {label}"; placement walk (text → after; Section → inner container; accepts → inside end; else after branch in nearest accepting ancestor; else page root end); select + flash; media without src → switches drawer to Assets; toasts incl. refusal "Can't add X — Y doesn't allow it…" + Undo |
| AD-12 | Drag insert | Elements/blocks `block` payload → `handleBlockDrop` (before/after, nesting check, one transaction, selects); saved → component payload |
| AD-13 | Paste HTML | Modal, clipboard prefill, strip report, sanitized insert via same path |
| AD-14 | Replace with block… | Context menu on sections; refused when locked |
| AD-15 | Gating | Viewer cannot open Add; **no lock check on click-insert or drop into a locked container** |
| AD-16 | Not reachable | Row, Column, 4 e-commerce blocks (registry only). ("3 Columns" = block `columns`, already in Elements › Layout › Columns, `catalog.ts:116-117`) |
| AD-20 | Insert routes | Add click (`useBlockInsertion.ts`), drag (`handleBlockDrop`), ⌘K quick-add (`ELEMENT_QUICK_ADD`, `useEditorEventListeners.ts:244-259`), saved/library component click/drop (`instantiate.ts`, `handleComponentDrop`), Paste HTML, Generate commit (`applyAiEdit`), Replace with block. **Only Replace checks locks** |
| AD-17 | Geometry | Drawer 280 token; expand 700 ignored by Add; headers 32, rows 28, search hits 32; block grid fixed 2 col |
| AD-18 | Keyboard | Rows `role=button`, Enter/Space; no arrow navigation; star `role=button` nested in row `role=button` |
| AD-19 | Dead code | `hooks/useBuildTab.ts` unused returns (`openCats`, `toggleCat`, `favOpen`, `clearFavs`, `favsInformed`); `BUILD_OPEN_CATS` session key written, never read; `BuildTab.css` `.bld-search-wrap`, `.bld-change-callout` unused |

Tests: ~30 files incl. `BuildTab.test.tsx` (32), `useBlockInsertion.test.tsx` (16), `GenerateBlockScreen*` (14), component-library suites (~67), blocks (69). No Playwright spec for Add.

## 3. Problems this design solves

1. **Duplicate catalog** — 13 of 14 built-in components use the *same block ids* as Elements rows (card, slider, testimonials, pricing, progress, countdown, accordion, social-icons, stack, switch, tabs, modal, table — `blockRegistry.ts:197-212` vs `catalog.ts`; both resolve through `getBlockById`, so output is identical); Navbar/Footer/CTA appear in Elements and Blocks. Users can't tell which to pick.
2. **Locked containers accept inserts** (AD-15/AD-20) — every route except Replace ignores locks.
3. **Library components are second-class** — not searchable, not draggable (BD-16 makes workspace library a primary reuse path).
4. **Recents lie** — cancelled drags count as use.
5. **CMS insertion is not contextual** — FD-DYN-01 Way 2/3 need a CMS fields group and List of {collection}.
6. **Media insert jumps away** — switching the drawer to Assets loses the Add context (Panel 02 replaces this with the temporary Asset picker).
7. **Keyboard**: no arrow navigation; nested interactive star.

## 4. Target structure (284w panel)

```
┌─────────────────────────────────────┐
│ Add               Components ›  ⋯  ✕ │ header 44 (⋯: Paste HTML… ⌘⇧V)
│ [search] Search elements, sections, …│ search 32, sticky
├─────────────────────────────────────┤
│ Blog fields · this page's record  ▾ │ contextual only (FD-DYN-01 §9)
│ [star] Favorites                  ▾ │ only when non-empty
│ Recent                            ▾ │ only when non-empty
│ Elements                          ▾ │ primitives: Basic · Layout · Forms · Media (visible sub-headings)
│   Generate a section with AI…       │ hidden in this version (SC-21)
│ Sections                          ▾ │ the 8 sections (2-col cards; IA/code name "Blocks") · "Page templates…" footer link
│ Catalog components                ▾ │ composed widgets (14)
│ Saved components                  ▾ │ This page · This site · Component library · Manage components ›
└─────────────────────────────────────┘
```
*(R-1018: V6 — header title 14/20/600, group headers 12/16/600 sentence case, no uppercase; CS-22 — Lucide icons named in brackets, no emoji/✦; N1 — "Components ›" header link, §6.6a.)*

Group changes (IA-01 / IAF-04 E groups kept: Elements, Blocks, Catalog components, Saved components; the Blocks group is **labelled "Sections"** in the UI — SC-11 *(amended 2026-10-17 — source: Panel 15 §1 / SC-11)*):
- **De-duplication by moving, not deleting** *(DS)*: each item appears in exactly one group. The 13 composed widgets that today sit in both Elements and Built-in components live **only in Catalog components** (renamed from "Built-in components" to match IA). Contact Form stays in Catalog components (it is a `<form>` composition, category Forms). Navbar, Footer, CTA live **only in Sections**; **Elements › Navigation is removed** because it becomes empty. **Elements › Interactive is removed too**: after the move it would hold only Theme toggle, which joins **Basic** (still shown only when Dark mode is Auto). Elements = **37 primitives + Theme toggle** (54 rows today include Theme toggle; 54 − 13 − 3 = 38 = 37 + toggle). Every item stays insertable and searchable; output is identical (same block ids).
- **Sections = Blocks.** The separate section-template catalog was deleted 2026-04-23 (`BuildTab.tsx:9-13`); the 8 section blocks are what IA-01/IAF-06 call "section templates". UI noun is **Section** (SC-11 — never "section template" or "block"); IA note recorded: "Add → Blocks (Sections)". *(amended 2026-10-17 — source: Panel 15 §1 / SC-11)*
- **Elements categories become visible sub-headings** (non-interactive) so rows are scannable.
- **Collection list** stays in Elements › Basic and gains "List of {collection}" entries beneath it when collections exist (FD-DYN-01 §10.2).
- **Page templates…** moves from panel bottom into the Sections group footer (IA: Add → Blocks › Page templates…), opening the **Templates area** in Creating mode with header back "‹ Back to Add" (Add query and scroll restored — Panel 15 §5, T-TP-04). *(amended 2026-10-17 — source: Panel 15 / SC-1, SC-11)*

## 5. Insertion contract (shared by every insert route in AD-20)

Applies to: Add click/Enter, drag, ⌘K quick-add, saved/library component click and drop, Paste HTML, Generate commit, CMS field insert, List of {collection}, Replace with block.

| Step | Rule |
|---|---|
| Target | Existing placement walk (AD-11) kept exactly. **NEW:** shown before commit — row hover/focus subtitle "Adds inside Section 2" / "Adds after Heading"; drag shows existing drop indicator + path note |
| Eligibility | Nesting check (existing). **NEW (Fix): lock check on every route** — if the computed parent or an ancestor on the path is locked, the click row shows **disabled with reason** "Can't add here — Section 2 is locked" (IAF-04 H); drag shows "Locked" at the drop point and refuses; ⌘K/Paste/Generate refuse with the same message. No write |
| Stale target | If the target element was deleted or became invalid between hover and commit (async adopt, Generate, Paste), **do not fall back silently** to page root: show "The place you chose no longer exists — choose another place" and keep the item ready (IAF-04 I) |
| Receipt | Success toast only after the engine transaction returns (no optimistic "added") |
| Commit | One transaction per insert (existing "Added {label}"); drag one transaction (existing) |
| After | New element selected + flash; Inspector opens the tab per INS-D03 and highlights the relevant row (CMS-field inserts: the bound row in Content — Panel 06 A7); focus stays in Add on the same row (so repeated inserts are quick) |
| Feedback | Existing toasts ("{X} added to {path}" + Undo; refusal 5s). One toast per insert |
| Media without source | Opens the **temporary Asset picker** in place of Add (Panel 02 §5) targeted at the new element. **Pick** → source applied, picker closes, **Add returns with the same query, scroll, open groups and focus on the inserting row**. **Cancel** → empty media block stays selected, Add returns the same way |
| Undo | One step removes the inserted element (+ its bindings for CMS fields) |
| Recents | **Fix:** recorded only after a successful insert (click or completed drop), not at drag start |
| Non-drag alternative | Click/Enter inserts at the shown target; drag is optional (WCAG 2.5.7) |

## 6. Group contracts

### 6.1 Search
- Placeholder "Search elements, sections, components…" *(amended 2026-10-17 — source: SC-11)*. Searches Elements, Sections, Saved (this page **and Component library — Fix**), CMS fields when shown. Results grouped by source with small headings; same row contracts (drag/click) as in groups.
- `/` focuses (outside inputs); ⌘F when focus is inside Add; Escape clears then blurs; closing the panel clears the query (existing). Results count announced once (replace whole-list `aria-live` with a single status line "12 results").
- No results: "No items match "{q}"" + Clear search (SC-28 pattern *(R-1018)* — was "Nothing matches '{q}'.") + **NEW** "Generate '{q}' with AI…" row (prefills Generate prompt) *(DS)* — shown only when AI is configured and has quota (otherwise omitted, no dead end). **Hidden in this version (SC-21).** *(amended 2026-10-17 — source: SC-21)*

### 6.2 Favorites and Recents
- **NEW:** star on Element, Block, Catalog and Saved rows *(DS)*. Storage keys migrate from element **name** (today, `useBuildTab.ts:138-142`) to `{source}:{id}` (e.g. `element:heading`, `block:navbar`, `catalog:tabs`, `saved:{componentId}`); old names map by lookup so Navbar/Footer/CTA favourites follow their move to Blocks — none orphaned. Star is a separate focusable button, not nested in the row button (Fix AD-18). Recents: max 8, any successful insert source (Fix).

### 6.3 Elements
- 37 primitives + Theme toggle (§4); visible sub-headings (Basic, Layout, Forms, Media); row: icon + label + favourite star (on hover/focus) + description on hover/focus (existing bubble, max 264). Theme toggle visibility rule unchanged.

### 6.3a Catalog components
- 14 composed widgets (card, slider, testimonials, pricing, progress, countdown, accordion, social-icons, stack, switch, tabs, modal, table, contact form). Rows like Elements; **NEW: draggable in the group** (today only in search).

### 6.4 Generate a section with AI (IAF-12) — **not in this version (SC-21)**; kept for the later AI Build tab
- Subview replaces the list (back "‹ Back to Add", SC-1). Keep target band, prompt, **Enter** generates (⌘/Ctrl+Enter kept as alias), examples, quota line (only when quota answers; plan quota per SC-20 — Pro limits during the trial), Stop (inserts nothing), footer **Keep · Undo** (Panel 20 class A; Undo removes the section and keeps the prompt), error kinds. *(amended 2026-10-17 — source: Panel 20 §10.2 / SC-10, SC-1, SC-21)* One undo step; new section selected. Behind `NEXT_PUBLIC_FEATURE_AI` (default off, SC-21). Additional doors kept (⌘K, AI tab, empty canvas).

### 6.5 Sections (IA/code: Blocks)
- 8 section cards, 2 columns at 260–360 width; card width fluid per §8 (thumb + 24 label) *(R-1018, D2-32)*; hover/focus shows "Add" pill; preview card 320w after a 300 ms hover/focus **dwell** (an intent timer, not an animation) opens **to the right over the canvas**, never covering the panel; it appears with the base 160 fade (reduced motion: instant) *(R-1018, V5 / CS-19)*; Escape closes it. Footnote kept, US spelling: "Sections use your Brand colors and fonts." *(R-1018, SC-11)*. Footer link "Page templates…".
- Wireframe thumbs kept (no blocks ship images); future real thumbnails use the same slot.
- **Sample content** *(R-1018, T3-20 — partly)*: inserted sections use neutral placeholder copy — no product name ("Aquibra") and no hard-coded year ("© 2024 Buildrick"); the footer year, if shown, is the current year. Not applied: the emoji social icons in sample output (INV A42) need an icon-set choice for published sites.

### 6.6 Saved components (BD-16)
- **Three scopes, each main component listed exactly once** (vocabulary per Panel 13 and SC-11 *(R-1018, N2 / T3-1)*): **This page** (page-only main components for this page — BD-16), **This site** (main components made on this site **plus** library components already adopted here, each once — today untagged, `GroupSection.tsx:482`), **Component library** (accessible library components **not yet on this site**). An adopted item appears under This site only, never again under Component library; group counts derive from this rule. Rows in This page / This site are draggable, searchable (existing).
- **Component library** (not on this site): rows show name + small "Component library" tag + **Restricted** (no access — disabled with reason); inserting adopts the latest revision (pinned from then on) *(R-1018, D2-24 — never "Library" alone)*.
- **This site — adopted library copies:** after revisions ship (SC-9) these rows show the **pinned revision** ("Component library · v3") and **Update available** (opens the component in Components to review) — the same markers as Panel 13; until then no version or update state is shown (Panel 13 §7 fallback). Listing components that exist only on the current site needs the library-query change (SC-9). **NEW: draggable and searchable**. Click/drag: use existing local copy, else adopt from library then insert (existing logic, existing error toasts "no longer in the library" / "damaged" / "Couldn't add").
- **Manage components ›** → Components area (Panel 13) with "‹ Back to Add" (existing back row); Back restores Add's query, scroll, open groups, insertion target and focus on "Manage components ›" (IAF-06 / T-IAF04-5). Same restore rule for "Page templates…" → Templates area → "‹ Back to Add" *(amended 2026-10-17 — source: Panel 15 / SC-11)*. Import/Export packages live there (BD-17), not in Add.
- Empty state: "No saved components yet." + "Select an element, then choose **Save as component**" (existing action and copy; its entry points are specified in Panel 13). No create action inside Add (unchanged — creation needs a selection).

### 6.6a "Components ›" header link *(R-1018, N1)*
- The persistent door to the Components area (no rail item — N1). A 32h text link "Components ›" in the Add header, left of ⋯. Opens the Components area (Panel 13) with header back "‹ Back to Add"; Back restores Add exactly as "Manage components ›" does (query, scroll, open groups, insertion target, focus on the link). "Manage components ›" in Saved components stays (same destination, in-context).
- Viewer: Add is unavailable to viewers (Panel 02), so no viewer rule here.

### 6.6b Large and slow lists *(R-1018, INTERACTION_AND_STATE_MATRIX §3)*
- **Many items (Component library paging):** the Component library section loads 50 rows at a time with a final row "Show more · {n} left" (32, keyboard reachable); search queries the whole library, not only loaded rows. This page / This site lists are local and not paged. Recent stays max 8; Favorites unbounded (local).
- **Long names:** every row and card truncates with an ellipsis at one line; the full name is in the tooltip and the accessible name; cards keep one label line (no wrap that changes card height).
- **Loading:** the Component library section shows 3 skeleton rows (row height 32) while loading; other groups are local and render at once.

### 6.7 CMS fields (contextual, FD-DYN-01 §9)
- Label copy per FD-DYN-01 §9: "**Blog fields · this page's record**" (collection page — SC-11 *(amended 2026-10-17 — source: SC-11)*) / "**Blog fields · list item**" (inside a list). Shown at the top only with a record context. Rows map field type → element (FD-DYN-01 §9 table); boolean rows "Use in a condition". Same insertion contract; Inspector opens Content with the bound row **highlighted**; keyboard focus stays in Add (Panel 06 A7).

### 6.8 Paste HTML (unchanged)
- ⋯ → Paste HTML… ⌘⇧V → modal (prefill, strip report) → insert via §5 contract (incl. lock fix).

## 7. Not exposed (preserved in registry, deliberate)

| Item | Decision (owner disposition under standing "apply recommended" instruction, 2026-10-17) | Revisit trigger |
|---|---|---|
| Row, Column (AD-16) | **Defer** — not added to Add; existing documents keep and render them; editable via Layers/Inspector (IAF-23 pattern) | When a Layout audit shows Section/Container/Columns/Grid cannot express a needed layout |
| E-commerce blocks (4) | **Defer** (P1-D15, **decided 2026-10-18 — P1** *(R-1018, T4-11 / T5-04)*): not in Add; **existing product blocks render**, their text and images stay editable (Inspector/inline), other commerce settings show "Commerce editing is planned" | E-commerce reachability discovery |
| 27-component design-system catalogue (INV E1) | **Stays in code, no UI** (P5 *(R-1018, T3-15)*) — reserved for the future AI Build tab; not the same set as Catalog components (14 block ids) | AI Build tab |

No document data is removed; nothing is deleted from the registry.

## 8. Geometry (GEO-01; NOT MEASURED)

| Region | Value |
|---|---|
| Panel | 284 default / 260 min / 360 max, bounded resize (keyboard splitter 16px steps, Home/End); personal preference; **expand-to-700 dropped for Add** (it never applied — AD-17) |
| Header | 44, sticky |
| Header type *(R-1018, V6 / CS-03)* | Title "Add" 14/20/600; "Components ›" link 32h (§6.6a); ⋯ and ✕ icon buttons 32 |
| Search | 32 field, 8 padding, sticky under header |
| Group header | 32, chevron, count; label 12/16/600 sentence case (no caps — V6) *(R-1018)* |
| Rows | **32** interactive rows (elements, catalog, saved, CMS fields, search hits) — tool lists (V1); sub-headings 24 (non-interactive text). The 40px row is for **resource lists with thumbnails** (Pages, Assets list, CMS records, Components, People — V1 / DS §2.7), not dense tool catalogs *(R-1018, V1 / D2-16 / T3-10 — settled; Pages are 40)*. Favorite star = in-row icon button 24 with ≥8 spacing (DS §2.8) |
| Block grid | 2 columns, gap 8; **card width is fluid** = (panel − 24 − 8)/2 (≈126 at 284, 114 at 260, 164 at 360); thumbnail keeps its aspect ratio at that width *(R-1018, D2-32 — the fixed "120" is dropped)* |
| Scroll | **One** scroll region below search (Generate subview has its own single body scroll) |
| Popovers | Description bubble max 264; preview card 320 to the right; both clamp to viewport |
| Short height (≥600) | Header + search = 84 sticky; list keeps ≥ 400 |

## 9. States, permissions

| Condition | Behaviour |
|---|---|
| Viewer | Add disabled on rail (Panel 02); `A` key announces reason |
| Locked selection / locked target ancestor | Rows **disabled with reason** "Can't add here — {name} is locked" (§5, IAF-04 H); drag indicator shows "Locked" and refuses; other routes refuse with the same message |
| No page / project loading | Rows disabled with "Open a page first" (existing toast becomes inline disabled reason) |
| Catalogue unavailable (registry failed to load) | Distinct from no-results: "Couldn't load elements — Retry" (panel error boundary) |
| Selection target invalid for this item (nesting) | Row shows disabled reason "Can't go inside Heading — will add after it" only when the walk finds no valid place; otherwise shows the computed place |
| Component library fetch failed | Component library section shows "Couldn't load the component library — Retry" (server error); This page list unaffected *(R-1018, DS §3)* |
| Offline *(R-1018, INTERACTION_AND_STATE_MATRIX §3 / CS-10)* | Elements, Sections, Catalog components, This page / This site rows (local copies) and Paste HTML keep working. **Component library** rows not yet on this site (adopt needs the server) are disabled with "Needs a connection"; the section header says "You're offline" instead of a load error. No announcement of its own — Panel 22 owns the polite offline announcement |
| Component library empty | "Your component library is empty. Save a component to share it across sites." |
| Inactive in this version (SC-21) — AI not configured / quota | Existing Generate error cards; quota per plan (SC-20 — trial = Pro); a provider rate limit shows "Try again in a moment" |
| Panel collapsed | Search query cleared (existing) |

## 10. Keyboard and accessibility
- **NEW:** each group body uses the ARIA **grid** pattern: one row per item with two cells — insert button (name) and favourite toggle; Blocks is a 2-column grid of card cells. Roving focus: ArrowUp/Down between rows, ArrowLeft/Right between cells (and cards), Home/End, Enter/Space insert, F toggles favourite on the focused row *(DS)*. Group headers are buttons with `aria-expanded`. Tab moves search → each group header/grid in order.
- Star toggle is its own button (`aria-pressed`, "Add Heading to favorites").
- Each insert announces the toast text once (existing live region).
- First-use tip dialog kept (Esc closes). **One coach surface at a time** *(R-1018, T3-25)*: the tip waits while another coach surface is visible (RailCoach, a Getting-started achievement toast — Panel 16) and shows after it is dismissed, never stacked with it; it never covers the row being inserted.
- **Motion** *(R-1018, V5 / CS-19)*: group expand/collapse base 160 (reduced motion: instant); inserted-element flash on the canvas plays only without reduced motion (reduced motion: the selection outline alone confirms the insert); no other animation in Add.

## 11. Preservation map

| Old | New | Disposition |
|---|---|---|
| AD-01 header + Paste HTML | Same | Keep |
| AD-02 search | Extended to library + CMS fields; single status line | Keep + Fix |
| AD-03 favourites/recents | Favorites on blocks/saved too; recents on success only | Keep + Fix |
| AD-04 elements (54) | 37 primitives + Theme toggle (in Basic); 13 composed widgets only in Catalog; Navbar/Footer/CTA only in Sections; Navigation and Interactive sub-headings removed | Merge (move, no item lost) |
| AD-05 Generate | Hidden in this version (SC-21); design kept for the AI Build tab | Defer |
| AD-06 blocks (8) | Same 8, group labelled **Sections** (SC-11); Page templates link in footer | Keep + rename *(amended 2026-10-17 — source: Panel 15 / SC-11)* |
| AD-07 built-in components (14) | "Catalog components" (IA name), same 14, draggable | Keep + rename |
| AD-08 saved + library + Manage | Library draggable/searchable, IAF-11 revision/update/restricted states; exact Back restore | Keep + Fix + NEW |
| AD-20 insert routes | Lock check, stale-target and receipt rules on all routes | Fix |
| AD-09 Page templates › | Sections footer "Page templates…" → Templates area, "‹ Back to Add" | Move |
| AD-10 Collection list | + List of {collection} entries | Keep + extend |
| AD-11/12 insert mechanics | Same placement; target preview; lock check | Keep + Fix |
| AD-11 media → Assets drawer | Temporary Asset picker in place | Redesign |
| AD-13 Paste HTML | Same | Keep |
| AD-14 Replace with block… | Same (context menu) | Keep |
| AD-16 Row/Column/e-commerce | Deferred, documented | Defer |
| AD-17 expand 700 | Dropped for Add (never worked); resize 260–360 instead | Change |
| AD-18 keyboard | Roving focus; star separate | Fix |
| AD-19 dead code | Removed in implementation | Fix |
| — CMS fields group | New (FD-DYN-01) | New |
| — Components door | "Components ›" header link (§6.6a) | New door *(R-1018, N1)* |

**NEW capabilities in this panel (not restorations):** target subtitle; lock refusal on all routes; stale-target message; library drag + search + revision/update/restricted states; catalog drag in group; favourites on blocks/catalog/saved with key migration; Generate-from-search row (inactive in this version, SC-21); `F` key; ARIA grid roving focus; resizable 260–360 panel; library error/empty states; catalogue-unavailable state; visible element sub-headings; search results grouped by source; single search status line; inline "Open a page first" reason; CMS fields group; List of {collection}.

## 12. Acceptance (specified, NOT RUN)

| ID | Pass condition |
|---|---|
| T-AD-01 | With Heading selected, Image row subtitle reads "Adds after Heading"; click inserts there; one Undo removes it |
| T-AD-02 | Select an element inside a locked Section → rows show disabled reason; drag refused; ⌘K quick-add, Paste HTML, Generate commit (inactive in this version, SC-21), saved/library insert and CMS-field insert all refused with the same message; no document change |
| T-AD-12 | Favorite "Navbar" from an old session appears under Favorites after migration and inserts the Navbar block |
| T-AD-13 | Delete the selected target while a library adopt is in flight → "place no longer exists" message; nothing inserted at page root |
| T-AD-14 | Manage components › then "‹ Back to Add" restores query, scroll, open groups and focus |
| T-AD-03 | Library component found by search and draggable to canvas; damaged/missing library item shows existing toast |
| T-AD-04 | Cancelled drag does not appear in Recent; completed drop does |
| T-AD-05 | Each block id appears in exactly one group; all 54 former Elements rows and 14 built-in rows remain insertable from their new group and by search with identical output |
| T-AD-06 | Image without source → Asset picker replaces Add; pick applies to the new image; Cancel returns to Add |
| T-AD-07 | On a Blog collection page (SC-11), CMS fields group appears; elsewhere absent |
| T-AD-08 | Keyboard only: search → arrow to Hero card → Enter inserts; favourite via F; preview card opens on focus and closes on Escape |
| T-AD-09 | Resize 260/284/360: block grid stays 2 columns, no horizontal scroll; one list scroll |
| T-AD-10 | Old documents containing Row/Column/e-commerce blocks open and render unchanged |
| T-AD-11 | Existing Add, insertion, Generate and component-library tests updated in the same change |
| T-AD-15 *(R-1018, N1)* | "Components ›" in the Add header opens the Components area; "‹ Back to Add" restores query, scroll, open groups and focus on the link |
| T-AD-16 *(R-1018, N2)* | A library component adopted on this site is listed once, under This site; it is absent from the Component library section and the counts agree |
| T-AD-17 *(R-1018)* | Offline: elements and sections insert; Component library rows not on this site are disabled with "Needs a connection" |
| T-AD-18 *(R-1018)* | With 120 library components: 50 rows + "Show more · 70 left"; search finds an unloaded one |
| T-AD-19 *(R-1018, D2-32)* | At 260/284/360 cards measure (panel − 32)/2 wide |

## 13. Review and not verified
Independent review: pass 1 PROPOSAL (8 blocking) — fixed above; passes 2 and 3 done (see Status line; this footer was stale until 2026-10-17). Not verified: runtime, measured geometry, screen-reader output. Same-id claims confirmed in source: 13 catalog ids, and Navbar/Footer/CTA (`catalog.ts` Navigation `blockId` navbar/footer/cta = `blocks/Sections/{Navbar,Footer,CTA}.tsx:13`).
