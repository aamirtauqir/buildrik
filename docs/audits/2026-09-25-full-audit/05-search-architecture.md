# 05: Search Architecture (Prompt 5)

**Agent:** B, Product Architecture · **Date:** 2026-09-25 · **Mode:** read-only.

**Scope:** every search in the product. Each one is classified as **Global**, **Module**, **Collection** or **Contextual**, and checked for:
- its dataset and scope;
- where its state lives;
- whether it runs locally or on the server;
- whether it is needed;
- how clear its placeholder and scope are;
- whether it duplicates another search;
- how it relates to filters and sort.

The code covered is `packages/editor`, `packages/dashboard`, `server`, `packages/shared` and `lib`.

Command-palette navigation doors were covered by A03, and palette ownership by A01-14. This report covers only the palettes as a *search* (their dataset and jump-to coverage), and cites those items instead of repeating them.

Path prefixes used below:
- `E/` = `packages/editor/src/editor/`
- `D/` = `packages/dashboard/`
- `S/` = `server/`

---

## Method & runtime status

**What I did:**
- I read Prompt 5 in the playbook and used `00-inventory.md` as a map.
- I grepped both apps for search state, search inputs, `placeholder="Search…"`, `.filter(...toLowerCase().includes(...))`, `contains`/`mode: "insensitive"` in services, and the key handlers (⌘K, ⌘⇧P, ⌘F, `/`).
- For each hit I traced input → state → dataset → filter function → (server procedure → Prisma `where`) → the rendered result and empty state. I also checked whether the component is reachable (a JSX consumer exists outside tests).

**Commands run (read-only):**

| Command | Result |
|---|---|
| `pnpm --filter @buildrik/editor exec vitest run` on 14 search test files: useLayerSearch, useBuildTab.search, SearchResults, settings searchIndex, SearchSettingsModal, PageList, pages keyboardShortcuts, useTemplateSelection, KeyboardCheatSheet.search, KeyboardShortcutsPanel.search, MediaLibraryPanel, MediaQA.regressions, useCanvasCommandPalette, shell CommandPalette | **172 passed, 3 failed.** All 3 failures are the known `shell/modals/__tests__/CommandPalette.test.tsx` label and count drift ("Open Insert panel" vs "Open Add panel"; 21 vs 23 commands). None of them is a search defect. |
| grep, rg, sed over editor, dashboard and server | Evidence is cited as file:line throughout |

**NOT RUNTIME VERIFIED:**
- There is no browser and no Postgres, so no search below was typed into a running app.
- None of the double-palette case (A05-1), the ⌘F hijack (A05-11) or the media false negatives (A05-3, A05-4) was reproduced live. Each is proven by reading the full code chain.
- No test covers any of them:
  - `PagesTab` has no ⌘K test.
  - `filterBySearch` has no test for alt text or file extensions.

---

## Output table: search inventory

**Classes:**
- **G** = Global: navigation, actions and jump-to.
- **M** = Module: find an item in the module's own list.
- **C** = Collection: records or assets that grow without bound.
- **X** = Contextual: a picker inside a control.

**Loc:**
- **L** = client-side filter.
- **S** = server query.
- **L+S** = hybrid.

| # | Search | File / component | Class · Loc | Scope | Dataset (matched fields) | Needed? | Duplicate? | Correct owner | Recommendation | Prio |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Editor ⌘K "Type a command or search…" | `E/shell/modals/CommandPalette.tsx:46-229`, opened by `shell/StudioHeader.tsx:257-272` | G · L | Editor | Rail panels plus hardcoded edit/view/history commands plus the registry commands, matched on label and group (`:291-297`). **No jump-to targets.** | Yes | Yes: #2, #3, and the unused primitive #29 | Shell | Make this the one editor palette, with jump-to for pages, layers, settings screens, CMS collections and components (A05-2) | P2 |
| 2 | Editor ⌘⇧P "Type a command or search..." | `E/canvas/controls/CommandPalette.tsx:98-165`, commands from `canvas/hooks/useCanvasCommandPalette.ts:80-330` | G · L | Editor | 27 canvas commands, matched on label, category and keywords. Recents live in its own `localStorage` key, `buildrik-recent-commands` (`:65`). | Only its unique commands | Yes: #1 (Undo, Redo, Delete, Zoom, Preview, Templates, Layers) | Shell ⌘K | Merge into #1, keeping CMS records and Save-as-template (A01-14, A03-6) | P2 |
| 3 | Pages ⌘K "go to page…" | `E/sidebar/tabs/pages/components/PageCommandPalette.tsx`, bound at `PagesTab.tsx:166-179` | G-like jump · L | Pages of the current site | Page name, fuzzy match | The jump is needed; a second ⌘K is not | Yes: it takes the same chord as #1 | Shell ⌘K "Go to" | Remove the ⌘K binding and fold page jump into #1 (**A05-1**) | **P1** |
| 4 | Dashboard ⌘K "Search or jump to..." | `D/components/search/command-palette.tsx`, mounted by `D/components/dashboard/shell/dashboard-shell.tsx:42` | G · L+S | Workspace | Static nav, settings, actions and moved-alias lists, plus `sites.list{search}` (name only, `S/services/sites.service.ts:60`), `team.list` filtered on the client, and `help.search`. Debounced, with `scope:` prefixes. | Yes | No | Dashboard shell | Keep. Fix the fake "Pages" scope (A05-7). | P2 |
| 5 | Add "Search elements" | `E/sidebar/tabs/build/BuildTab.tsx:127-148,176-185`, `hooks/useBuildTab.ts:233-237`, `utils/search.ts` | M · L | Insertable items | Elements (name, description, tags, category), blocks (label, id), registry components (label, id). **Not MINE.** | Yes | Partly: #6 | Add | Include MINE (A05-5). Unify with #6 (A05-6). | P2 |
| 6 | Selection toolbar "+" → BlockPicker "Search elements..." | `E/canvas/controls/BlockPickerModal.tsx:35,161-187` → `sidebar/tabs/ElementsTab` → `elements/useElementsState.ts:122-133` | M · L | Block registry | `getBlockDefinitions()` label and id only | The picker is; a separate engine is not | Yes: #5 | Add (shared search function) | Reuse `searchInsert` and its dataset (A05-6) | P2 |
| 7 | Layers "Search" | `E/sidebar/tabs/layers/LayersTab.tsx:108,161-172` → `panels/layers/hooks/useLayerSearch.ts`, `panels/layers/index.tsx:69-78,339-359` | M · L | The current page's tree | Display or custom name, type, tagName, id. Results are a flat list. | Yes | No | Layers | Keep. Remove the auto-expand side effect and trim consistently (A05-13). | P3 |
| 8 | Pages "Search" | `E/sidebar/tabs/pages/components/PageList.tsx:101-117,169-181`, `/` shortcut `utils/keyboardShortcuts.ts` | M · L | Pages | Page name only, not slug or path | Yes | Partly: #3 | Pages | Keep. Add slug matching. Label the scope. (A05-14) | P3 |
| 9 | Media quick "Search" (drawer) | `E/sidebar/tabs/media/components/SlimLauncher.tsx:193-200,312-321` plus `hooks/useLibraryState.ts:176-186,396-446` | C · L+S | The site's media library | Client: `name` without extension (`mediaUtils.ts:140-144`). Server leg: `filename` or `altText` (`S/services/media.service.ts:94-100`). | Yes | Shares its state with #10 | Media | Make the client match the server match (A05-3) | P2 |
| 10 | Full Media "Search across all folders…" | `E/media/LibraryManager.tsx:778-805` (same `useMediaState` library as #9) | C · L+S | Site library, every folder, with the tag token | Same as #9 | Yes | Same engine as #9 (fine) | Media | Same fix as A05-3 | P2 |
| 11 | Media picker "Search images…/library…" | `E/media/MediaLibraryPanel.tsx:94,125-137,225-246` → `engine/media/MediaManager.ts:1396-1399` | C · L only | Assets already loaded in the session | `name` or `originalName`. **No server leg.** | Yes | Yes: a third media search engine | Media (shared engine) | Route it through the #9 server leg (A05-4) | P2 |
| 12 | Dashboard Media "Search assets…" | `D/components/media/media-library.tsx:47,70-75,190-198` | C · S | All of the user's assets across all sites | `media.listAssets{search}` on filename or altText | Yes | Same backend as #9 | Dashboard media | Debounce it (A05-9) | P3 |
| 13 | Media stock (drawer) "Search free stock" | `E/sidebar/tabs/media/components/StockBrowserOverlay.tsx:180-218` | X · S | Pexels / Unsplash | `media.searchStockPhotos/Videos` | Yes | Yes: #14 | Media | One stock-search UI (A05-16) | P3 |
| 14 | Media stock (Full Media) "Search stock …" | `E/sidebar/tabs/media/components/StockSourceModal.tsx:225-299` | X · S | Same | Same handler (`discSearchAll`) | Yes | Yes: #13 | Media | Same as #13 | P3 |
| 15 | Icon picker "Search icons by name or keyword..." | `E/media/IconPickerModal.tsx:69,115-122,187` | X · L | Built-in icon set | `searchIcons()` | Yes | Yes: #16 has the same dataset and function | Media | One icon browser (A05-16) | P3 |
| 16 | Media icons "Search N icons" | `E/sidebar/tabs/media/components/IconBrowserOverlay.tsx:88,178` | X · L | Same | `searchIcons()` | Yes | Yes: #15 | Media | Same as #15 | P3 |
| 17 | Site fonts "Search fonts" | `E/media/components/SiteFontsModal.tsx:145,242` | X · L | Uploaded fonts | Family and originalName | Yes | No | Media | Keep | — |
| 18 | Inspector font / token pickers ("Search fonts...", "Search tokens…") | `E/inspector/sections/typography/FontPickerDropdown.tsx:57-63,162`, `inspector/shared/TokenPickerPopover.tsx:119,223` | X · L | Fonts; design tokens | Label; token name | Yes | No | Inspector | Keep | — |
| 19 | Inspector property search | `E/inspector/ProInspector.tsx:194-199` (`searchQuery: ""`), `inspector/hooks/useAdvancedSettings.ts:45-105` | — | — | Hardwired to an empty string. Dead. | Product decision | — | Inspector | Delete the branch, or build the feature (A05-12) | P3 |
| 20 | Brand "Search colors…" | `E/design-system/ui/colors/ColorTokenList.tsx:210,255-268,315-322` | M · L | Colour tokens | Name and value, combined with the all/issues filter | Yes | No | Brand | Keep | — |
| 21 | Components panel | `E/sidebar/tabs/ComponentsTab.tsx:234` ("no search"), `component-library/useComponentsState.ts:55-212` | — | The user's site components (up to 100, `:13`) | Search, filter and grouping are computed but **never rendered** | Low until volume grows | — | Components | Delete the dead state, or wire it up (A05-12, A05-17) | P3 |
| 22 | Templates (full tab) "Search templates..." | `E/sidebar/tabs/templates/TemplatesTab.tsx:59,423-470`, `hooks/useTemplateSelection.ts:62-77` | M · L | Static `SITE_TEMPLATES`, or My templates from `localStorage` | Name only, combined with the category, type and sub-category filters | Yes | Its catalog duplicates #24 (a different dataset) | Templates | See A05-15 | P3 |
| 23 | Templates (drawer) "Search templates…" | `E/sidebar/tabs/templates/components/DrawerGallery.tsx:96-118` | M · L | `SITE_TEMPLATES` only | Name | Yes | #22 | Templates | Include My templates (A05-15) | P3 |
| 24 | Dashboard templates / onboarding "Search templates…" | `D/app/dashboard/templates/page.tsx:46-81`, `D/app/onboarding/template/page.tsx:32-48` → `S/services/template.service.ts:55-63` | C · S | Server `Template` rows, workspace-scoped | Name and description | Yes | Its catalog duplicates #22 | Templates (server) | Debounce it (A05-9). Pick one catalog (A05-15). | P3 |
| 25 | History "Search saves… / changes…" | `E/sidebar/tabs/history/HistoryTab.tsx:51-53,174,298-318` → `panels/VersionHistoryPanel.tsx:265-270`, `history/components/ActivityView.tsx:153-165` | M · L | Saved versions (name) / undo stack (label, property, description) | One query shared by both lists | Yes | No | History | Clear the query when the filter changes (A05-14) | P3 |
| 26 | Settings "Search settings" | `E/sidebar/tabs/settings/components/SearchSettingsModal.tsx`, `settings/searchIndex.ts:242-248`, `SettingsTab.tsx:641-653,711-719` | G-within-module · L | Static index of 15 sections and their fields | Title, description, group. Scrolls to the field. | Yes | No | Settings | Keep. Reachable only from Overview (A05-14). | P3 |
| 27 | Keyboard shortcuts panel "Search shortcuts…" | `E/panels/KeyboardShortcutsPanel.tsx:26-33,165-191` (site menu, ⌘/) | X · L | Its own hardcoded `SHORTCUT_GROUPS` | Description and key | One is needed | Yes: #28 | Help | Keep one shortcut reference (A05-10) | P2 |
| 28 | Keyboard cheat sheet "Search shortcuts…" | `E/canvas/controls/KeyboardCheatSheet.tsx:30-110,180-188,281` (`?`, ⌘K row) | X · L | A different hardcoded `SHORTCUT_GROUPS` | Description, keys, group | See #27 | Yes: #27 | Help | See #27 | P2 |
| 29 | chrome-ui `CommandPalette` primitive | `E/chrome-ui/CommandPalette.tsx` (exported at `chrome-ui/index.ts:143`) | — | — | **No consumer** | — | It is the fourth palette implementation | chrome-ui | Adopt it in #1 during the merge, or delete it (A05-12) | P3 |
| 30 | `MyTemplates` "Search my templates..." | `E/../templates/MyTemplates.tsx:203-242` | — | — | **No consumer** outside its barrel | — | #22 | — | Delete it (A05-12) | P3 |
| 31 | `CatalogSection` search | `E/components-catalog/ui/CatalogSection.tsx:54-78` | — | — | Only its test renders it | — | — | — | Delete it (A05-12) | P3 |
| 32 | Dashboard Sites "Search sites…" (`/`) | `D/app/dashboard/projects/page.tsx:33,54-66,122,503` | C · S | Workspace sites | `sites.list{search}`, name only | Yes | No | Dashboard sites | Debounce it (A05-9) | P3 |
| 33 | Dashboard Help "Search help articles..." | `D/components/help/help-center.tsx:51-97`, `D/app/dashboard/help/page.tsx:45-51` → `S/services/help.service.ts:16-22` | M · S | Help articles | Title, excerpt, content. The query is kept in the URL. | Yes | Shares its backend with #4's help scope (fine) | Help | Keep | — |
| 34 | Marketplace "Search apps & integrations…" | `D/app/dashboard/marketplace/page.tsx:87-112` | M · L | Static catalog | Name and description, combined with category chips | Yes | No | Marketplace | Keep | — |
| — | CMS collections / records | `E/sidebar/tabs/content/ContentViews.tsx:326`, `E/shell/modals/CMSRecordsModal.tsx:395`, `S/services/cms.service.ts:78-81` | **Missing** | Records per collection, unbounded and unpaged | — | **Yes** | — | CMS | Add a record search (A05-8) | P2 |
| — | Review / comments, Issues, Notifications, dashboard Activity, presence users | `E/sidebar/tabs/review/ReviewTab.tsx:387-388`, `E/shell/IssuesPanel.tsx:49,112-141`, `D/app/dashboard/activity/page.tsx:9-36` | Filters only | — | Status, severity, page scope, mine/team | Search is not needed at current volumes | — | — | Keep filters only | — |

---

## Findings

### P1

#### A05-1: ⌘K in the Pages drawer opens two palettes, and can leave a hidden modal that turns off every editor shortcut

- **Severity:** P1
- **Files:**
  - `E/sidebar/tabs/pages/PagesTab.tsx:166-179, 403-410`
  - `E/sidebar/tabs/pages/components/PageCommandPalette.tsx:93-99`
  - `E/shell/StudioHeader.tsx:257-272`
  - `E/chrome-ui/focus.ts:111-113`
  - `E/shell/hooks/useEditorShortcuts.ts:85`
  - `E/canvas/CanvasFooterToolbar.tsx:226`
  - `E/canvas/comments/CommentLayer.tsx:246`
  - `E/sidebar/LeftSidebar.tsx:471-484, 684-699`
- **Symbols:** `PagesTab` keydown effect, `PageCommandPalette`, `StudioHeader` `onKey`, `isModalOpen`

**Evidence:**
1. `PagesTab` binds ⌘K on `window` and toggles `paletteOpen`. It has no `defaultPrevented` check and no drawer-visibility check.
2. `StudioHeader` binds the same chord on `document`.
3. A keydown bubbles to `document` before `window`, so one keystroke opens the shell palette and then the Pages palette.
4. `PageCommandPalette` renders `role="dialog" aria-modal="true"`.
5. `isModalOpen()` is just `document.querySelector('[role="dialog"][aria-modal="true"]')`.
6. The drawer's tree "stays mounted" while it is closed. It is only `inert`, width 0 and opacity 0 (`LeftSidebar.tsx:693-699`). Closing it by clicking the active rail icon keeps `activeTab` set to `pages` (`:476-480`).

**Resulting sequence**, with Pages as the last-used tab and the drawer closed:
1. ⌘K opens the shell palette and an **invisible** Pages palette.
2. The invisible palette cannot take focus because it is inert. Its Escape handler sits on that input, so it can never be dismissed.
3. The user runs a shell command with Enter. The shell palette closes through `onClose`.
4. The hidden `aria-modal` dialog is still in the DOM. From then on, `useEditorShortcuts` returns early on every key. Its own comment says that means "every global shortcut below — including F6, ⌘S and undo".
5. The canvas footer keys and the CommentLayer Escape also stand down. The next ⌘K is blocked by `isModalOpen()` in `StudioHeader` and only toggles the hidden palette closed.

With the drawer open, the user instead sees two palettes stacked on each other.

- **Expected:** one ⌘K and one palette. Page jump-to lives inside that palette.
- **Root cause:** a module-local palette took the global chord, and nothing arbitrates key ownership. The hidden-but-mounted drawer makes this worse.
- **Affected modules:** Pages, Shell, all global shortcuts, Comments.
- **Recommendation:**
  - Remove the ⌘K binding from `PagesTab`. Keep the header ⌘K chip as a button that opens the shell palette on its "Go to page" band.
  - As a stop-gap, gate the listener on the drawer being open and on `!e.defaultPrevented`.
  - Add a test: ⌘K with Pages mounted opens exactly one dialog.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

### P2

#### A05-2: The editor has no global jump-to search; ⌘K only offers panel navigation and actions

- **Severity:** P2
- **Files:**
  - `E/shell/modals/CommandPalette.tsx:46-229, 291-297`
  - `E/canvas/hooks/useCanvasCommandPalette.ts:80-330`
  - `E/chrome-ui/CommandPalette.tsx`
- **Symbols:** `buildCommands`, `useCanvasCommandPalette`

**Evidence:**
- ⌘K's dataset has four parts:
  - "Open <tab> panel" (from `GROUPED_TABS_CONFIG`);
  - hardcoded Edit, View and History rows;
  - two v3 doors;
  - registry commands.
- It has no pages, layers or elements, settings screens, CMS collections, components or assets. Its "Go to" band is only panels.
- Jumping to a page exists only inside the Pages drawer (#3).
- A second palette, ⌘⇧P, has a different command set. It uses the same placeholder ("Type a command or search…") and a separate recents store (`buildrik-recent-commands` vs `buildrik:command-recents` in `shell/modals/commandRecents.ts:12`).
- A fourth implementation, the chrome-ui primitive, has no consumer.
- Result: a user cannot tell which palette holds a given action, and no palette can find content.

- **Expected:** global search means navigation, actions **and** jump-to, from one palette.
- **Root cause:** each surface grew its own palette. There is no palette provider registry that modules can contribute to.
- **Affected modules:** Shell, Canvas, Pages, Layers, Settings, CMS, Components.
- **Recommendation:** have one ⌘K backed by the chrome-ui primitive, where modules register providers (commands plus jump-to results). Retire ⌘⇧P and the Pages ⌘K. This is the same batch as A01-14 and A03-6/12.
- **Status:** PRODUCT DECISION REQUIRED on the jump-to scope. The defect itself is VERIFIED in code.

#### A05-3: Media quick and Full Media searches say "Nothing matches" for files the server found

- **Severity:** P2
- **Files:**
  - `E/sidebar/tabs/media/data/mediaUtils.ts:140-144`
  - `E/sidebar/tabs/media/hooks/useLibraryState.ts:176-186, 407-446`
  - `E/sidebar/tabs/media/components/SlimLauncher.tsx:193-200`
  - `E/../engine/media/MediaManager.ts:621-622`
  - `S/services/media.service.ts:94-100`
- **Symbol:** `filterBySearch`

**Evidence:**
- When the library is not fully loaded, the drawer runs `media.listAssets{search}`. The server matches `filename` **or** `altText`. The results are imported into the store and then rendered through the client filter.
- `filterBySearch` matches only `i.name`. On the client, `name` is `filename.replace(/\.[^/.]+$/, "")` (`MediaManager.ts:621`). The grid shows `displayName`, which has the extension restored ("board 144:2 draws full filenames").
- Two cases fail:
  - **Extension:** a query of `hero.png`, or anything matched only by alt text, is found by the server, set to `searchState "whole"`, and then filtered out.
  - **Fully loaded library:** alt text is never searched at all.
- `SlimLauncher` filters by `name` a second time.

- **Expected:** the client and server match the same fields: name with extension, originalName and altText.
- **Root cause:** the match rules are written twice, once in SQL and once in JavaScript.
- **Affected modules:** Media quick, Full Media.
- **Recommendation:** have one match function used by `filterBySearch` and `MediaManager.getAssets`, over `originalName` and `altText`. Add a test for `hero.png` and for an alt-text-only match.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

#### A05-4: The Media picker searches only what is already loaded, the false negative the drawer fixed

- **Severity:** P2
- **Files:**
  - `E/media/MediaLibraryPanel.tsx:125-137, 245-246`
  - `E/../engine/media/MediaManager.ts:1383-1400`
- **Evidence:**
  - The picker calls `getAssets({ search })`, which filters the in-memory store on `name` and `originalName`.
  - The picker has no `loadServerMedia` or `listAssets` leg. `useLibraryState.ts:396-400` documents this exact bug for the drawer: "a query on a 412-asset library searched 200 of them and said 'Nothing matches' about a file that exists".
  - That makes three media search semantics:
    - the drawer and Full Media (hybrid);
    - the picker (local only);
    - the dashboard (server, across all sites).
- **Expected:** every surface over the media library uses the same search engine.
- **Root cause:** the server leg lives in the drawer's hook, not in the shared `MediaManager`.
- **Recommendation:** move the server-search leg into `MediaManager` (or a shared hook) and use it from the picker.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

#### A05-5: The Add search leaves out MINE (the user's own components)

- **Severity:** P2
- **Files:**
  - `E/sidebar/tabs/build/hooks/useBuildTab.ts:233-237`
  - `E/sidebar/tabs/build/catalog/groups.ts:40-53`
  - `E/sidebar/tabs/build/BuildTab.tsx:65-80`
  - `E/sidebar/tabs/build/utils/search.ts:21-63`
- **Evidence:**
  - `searchInsert(searchQuery, flatCatalog, blockRows, componentRows)`. Here `componentRows` is the built-in registry subset.
  - The MINE group (`composer.components.getAllComponents()`) is rendered while browsing, but it is never passed to search.
  - The file header says so: "COMPONENTS/TEMPLATES/MINE join here when their sources go async".
- **Expected:** a flat, cross-source search that includes what the panel lists.
- **Recommendation:** pass `mine` into `searchInsert` and tag it MINE. Its dependencies must include `mine`.
- **Status:** VERIFIED in code.

#### A05-6: Two insert searches use different datasets and match rules

- **Severity:** P2
- **Files:**
  - `E/canvas/controls/BlockPickerModal.tsx:35, 161-187`
  - `E/sidebar/tabs/elements/useElementsState.ts:58, 122-133`
  - `E/canvas/controls/UnifiedSelectionToolbar.tsx:186, 322-327`
- **Evidence:**
  - The selection toolbar "+" opens `BlockPickerModal`. Its placeholder, "Search elements...", sits over `ElementsTab`, which filters `getBlockDefinitions()` on label and id only.
  - The Add panel's "Search elements" (#5) matches elements by name, description, tags and category, plus blocks and components.
  - So the same query gives different results depending on which door the user took, and the picker labels blocks as "elements".
- **Expected:** one insert-search function and one dataset. The picker is a view onto Add.
- **Recommendation:** have `BlockPickerModal` reuse `searchInsert` and the Add catalog, or embed the Add results list.
- **Status:** VERIFIED in code.

#### A05-7: The dashboard palette's "Pages" scope does not search pages

- **Severity:** P2
- **File:** `D/components/search/command-palette.tsx:124-131, 272-287`
- **Evidence:**
  - `pages:` reuses `sitesQuery`, which searches **site names**. It emits rows labelled `"<site> — Pages"` that open the editor.
  - A page title never matches.
  - The code comment admits: "since pages.list requires a siteId".
- **Expected:** a scope searches what its name says, or the scope is not offered.
- **Recommendation:** drop the `pages:` scope, or back it with a workspace-wide page-title query. That needs a service function, which is a product decision.
- **Status:** VERIFIED in code.

#### A05-8: CMS has no record search, and record lists are unbounded

- **Severity:** P2
- **Files:**
  - `S/services/cms.service.ts:78-81` (`listEntries`: `findMany` with no `take`, ordered by `updatedAt desc`)
  - `E/sidebar/tabs/content/ContentViews.tsx:326`
  - `E/shell/modals/CMSRecordsModal.tsx:395`
- **Evidence:** both record lists render every entry. Neither has a search box or a sort control, and the server offers no search.
- **Expected:** CMS is the textbook case for a collection search (records grow without limit). Assets and Sites already have one.
- **Recommendation:** add a record search over the title or primary field, first on the client and then on the server with paging when volume demands it. This belongs to CMS, not to global ⌘K. Global ⌘K should only jump to collections.
- **Status:** VERIFIED in code. How urgent this is depends on expected record counts (PRODUCT DECISION).

#### A05-10: Two keyboard-shortcut references, each with its own search and its own hardcoded data

- **Severity:** P2
- **Files:**
  - `E/panels/KeyboardShortcutsPanel.tsx:26-33, 165-191`, opened by the site menu (`shell/SiteMenu.tsx:302-303`) and ⌘/ (`useEditorShortcuts.ts:10`)
  - `E/canvas/controls/KeyboardCheatSheet.tsx:30-110, 180-188, 390-409`, opened by `?` and the ⌘K "Keyboard shortcuts" row (`shell/modals/CommandPalette.tsx:170-175`)
- **Evidence:**
  - The two components each hold their own `SHORTCUT_GROUPS`, and they have different contents.
  - The same label ("Keyboard shortcuts") opens a different list depending on the door.
- **Expected:** one reference, with one data source derived from the real bindings.
- **Recommendation:** keep one and delete the other. Derive its rows from the command registry and `tabsConfig`.
- **Status:** VERIFIED in code.

#### A05-11: Search-focus shortcuts in a closed drawer swallow ⌘F and `/`

- **Severity:** P2
- **Files:**
  - `E/sidebar/tabs/build/BuildTab.tsx:127-148`
  - `E/sidebar/tabs/pages/components/PageList.tsx:104-113`
  - `E/sidebar/LeftSidebar.tsx:693-699`
- **Evidence:**
  - `BuildTab` registers a `document` keydown for ⌘F and `/`. It calls `e.preventDefault()` and then `input.focus()`.
  - When the drawer is closed and Add is still the active tab, the tree is mounted but `inert`. `focus()` does nothing, while the browser's find (⌘F) and the `/` keystroke have already been cancelled.
  - `PageList` does the same for `/`.
- **Expected:** a module's search shortcut is live only while its module is visible.
- **Recommendation:** gate these on `drawerOpen` (or on `!panel.closest('[inert]')`), and call `preventDefault` only after the focus succeeds.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

### P3

#### A05-9: Dashboard server searches fire on every keystroke

- **Severity:** P3
- **Files:**
  - `D/app/dashboard/projects/page.tsx:122`
  - `D/app/dashboard/templates/page.tsx:46-60, 79`: `router.replace` on every keystroke, then a query
  - `D/components/media/media-library.tsx:70-75`: `listAssets` also runs a `count` over the whole match set (`media.service.ts:120`)
  - `D/app/onboarding/template/page.tsx:34`
- **Evidence:** none of these has a debounce. Only the palette debounces (`command-palette.tsx:184-206`).
- **Recommendation:** add one shared `useDebouncedValue` for these four. Keep the previous data between queries.
- **Status:** VERIFIED in code.

#### A05-12: Dead or vestigial search code

- **Severity:** P3
- **Evidence:**
  - `useComponentsState.ts:55-212, 454-470` computes search, filter and grouping. `ComponentsTab` renders only `state.components`.
  - `ProInspector.tsx:196` passes `searchQuery: ""`, so the search branch in `useAdvancedSettings.ts:45-105` never runs.
  - `templates/MyTemplates.tsx` has no consumer.
  - `components-catalog/ui/CatalogSection.tsx` is rendered only by its test.
  - `chrome-ui/CommandPalette.tsx` has no consumer.
  - `MediaTab.tsx:15` imports `SearchBar` but never uses it.
- **Recommendation:** delete all of it, or in the case of the chrome-ui palette, adopt it under A05-2.
- **Status:** VERIFIED in code (consumer grep).

#### A05-13: Layers search has side effects and trims inconsistently

- **Severity:** P3
- **Files:**
  - `E/panels/layers/index.tsx:69-78, 343-359`
  - `E/panels/layers/hooks/useLayerSearch.ts:65-111`
  - `E/panels/layers/hooks/useLayerTree.ts:156`
- **Evidence:**
  - While searching, the effect expands the ancestors of every match on each keystroke. Yet the results render flat, so the expansion cannot be seen.
  - The expanded state is persisted. Typing "a" and clearing it leaves the whole tree expanded, even after a reload.
  - `isSearching` trims the query, but `filterTree` and `filteredLayers` lowercase it without trimming, so " hero" matches nothing.
- **Recommendation:** remove the auto-expand effect, or apply it only on "reveal". Use the trimmed query everywhere.
- **Status:** VERIFIED in code.

#### A05-14: Scope and placeholder clarity

- **Severity:** P3
- **Evidence:**
  - Layers, Pages and the Media drawer all use a bare "Search" placeholder, with no scope stated (`LayersTab.tsx:166`, `PageList.tsx:174`, `SlimLauncher.tsx:319`).
  - Pages search matches only names, not slugs.
  - History shares one query between Saves and Changes. The placeholder changes but the query carries over (`HistoryTab.tsx:51-53, 174`).
  - Settings search is reachable only from Overview (`SettingsTab.tsx:641`).
  - "Search" also means SEO in the same editor ("Search listings", `SearchListingsTable.tsx:88`).
- **Recommendation:**
  - Use scope-stating placeholders ("Search layers on this page", "Search pages").
  - Match slugs in Pages.
  - Reset the History query when the filter changes.
  - Expose Settings search in the Settings header on every screen, or through ⌘K jump-to.
- **Status:** VERIFIED in code.

#### A05-15: Two template catalogs with different search semantics

- **Severity:** P3
- **Evidence:**
  - Editor: static `SITE_TEMPLATES`, name match on the client (`useTemplateSelection.ts:62-77`). The drawer search leaves out My templates (`DrawerGallery.tsx:96-103`).
  - Dashboard and onboarding: server `Template` rows, name and description (`template.service.ts:55-63`).
- **Recommendation:** one catalog owner, which is part of the A01 ownership work. Until then, add description to the editor match and My templates to the drawer search.
- **Status:** VERIFIED in code. Which catalog wins is a PRODUCT DECISION.

#### A05-16: Duplicate stock and icon search UIs

- **Severity:** P3
- **Evidence:**
  - Stock search has two UIs: `StockBrowserOverlay` (drawer) and `StockSourceModal` (Full Media). Both call `discSearchAll`.
  - Icon search has two UIs: `IconPickerModal` and `IconBrowserOverlay`. Both use `searchIcons()`.
  - The engines are shared, so this is duplicated UI only.
- **Recommendation:** fold them together when the Media quick/full split is resolved (A01 / A04).
- **Status:** VERIFIED in code.

#### A05-17: The Components panel has no search

- **Severity:** P3
- **File:** `ComponentsTab.tsx:234` ("no search, no filter chips", board 641:2546)
- **Evidence:** the cap is 100 components.
- **Recommendation:** leave it until volume grows, then wire up the existing (dead) filter from A05-12. Reaching components through ⌘K jump-to (A05-2) covers most of the need.
- **Status:** PRODUCT DECISION REQUIRED.

#### A05-18: The "shared" SearchBar is used by 2 surfaces; the other drawers each draw their own field

- **Severity:** P3
- **Files:** `E/sidebar/shared/SearchBar.tsx:124-128` ("Shared by all seven drawers")
- **Evidence:**
  - Actual consumers: `BuildTab.tsx:176` and `StockSourceModal.tsx:225`.
  - Layers, Pages, Media, Templates, History, Brand, Settings and the pickers each have their own input, with different debounce, clear, Escape and telemetry behaviour. Only `SearchBar` fires `trackSidebar("search")`.
- **Recommendation:** hand this to Prompt 11 as a missing-primitive item.
- **Status:** VERIFIED in code.

---

## Good as-is

- **Media drawer server-search leg:** it stays honest about its state (`searchState` idle, searching, whole, truncated or failed), guards against races, and cites its scope (`useLibraryState.ts:396-446`). Only the match rule is wrong (A05-3).
- **Dashboard ⌘K:**
  - debounced;
  - `scope:` prefixes;
  - moved-alias rows ("where did X go");
  - agency-gated rows;
  - static destinations checked against the route table by a contract test.
- **Settings search:** a static index with tests (15 sections in nav order), scroll-to-field, and "a result that opens a screen to nothing" deliberately excluded.
- **Issues, Review/comments, Notifications and dashboard Activity** use **filters** (severity, page scope, status, mine/team), not search. That is correct at their volumes.
- **Contextual pickers** (tokens, fonts, site fonts, colours) are scoped to their control, and their empty states read "No X match 'q'".
- **Help search** is server-side over title, excerpt and content, and the query lives in the URL.
- **Template search** is AND-ed with the workspace scope, so it cannot leak another agency's templates (`template.service.ts:55-56`).

## Product decisions required

1. **Editor global search scope (A05-2):** which entities ⌘K should jump to (pages, layers, settings screens, CMS collections, components, assets), and whether ⌘⇧P survives.
2. **CMS record search (A05-8):** client-only now, or server-side with paging. This depends on the expected record counts.
3. **Dashboard "Pages" scope (A05-7):** drop it, or build a workspace page-title search.
4. **Template catalog owner (A05-15):** static `SITE_TEMPLATES` or the server `Template` table.
5. **Inspector property search and Components search (A05-12, A05-17):** build them or delete the leftover code.

## Overlaps with other audits

- **A01-14, A03-6, A03-12:** palette ownership and doors. A05-2 adds the missing jump-to and the recents split to that batch.
- **Prompt 6 (C):** A05-1 and A05-11 are key-ownership conflicts (global versus module listeners, and hidden drawers that stay mounted). A general key-arbitration layer belongs there.
- **Prompt 11 (C):** A05-18, one search-field primitive. A05-2, adopt the chrome-ui palette primitive.
- **Prompt 17/18 (E):** A05-3 and A05-4 are an SSOT problem (match logic written in SQL, in `mediaUtils` and in `MediaManager`). A05-9 is a performance problem (per-keystroke `count` queries). A05-12 is dead code.
- **Prompt 20 (G):**
  - no test for the ⌘K collision (A05-1);
  - no test for `filterBySearch` matching an alt-text or extension query (A05-3);
  - no test for the picker searching beyond the loaded page (A05-4).

---

## AUDIT HANDOFF

- **Agent / Prompt:** B, Product Architecture / Prompt 5: Search Architecture
- **Report:** `docs/audits/2026-09-25-full-audit/05-search-architecture.md`
- **Counts:** P0 = 0 · P1 = 1 · P2 = 9 · P3 = 8
- **P0:** none. No search path exposes data across tenants: the media, sites and templates services all scope by user or workspace.
- **P1:**
  - A05-1: the Pages ⌘K collides with the shell ⌘K. A hidden `aria-modal` Pages palette in a closed drawer turns off every global editor shortcut (⌘S, undo, F6).
- **P2:**
  - A05-2: no editor jump-to, plus three palettes.
  - A05-3: media client/server match mismatch.
  - A05-4: the picker searches only the loaded page.
  - A05-5: Add search leaves out MINE.
  - A05-6: two insert-search engines.
  - A05-7: the fake dashboard "Pages" scope.
  - A05-8: no CMS record search.
  - A05-10: two shortcut references.
  - A05-11: ⌘F and `/` swallowed by a closed drawer.
- **P3:**
  - A05-9: no debounce on dashboard searches.
  - A05-12: dead search code.
  - A05-13: Layers search side effects.
  - A05-14: scope and placeholder clarity.
  - A05-15: two template catalogs.
  - A05-16: duplicate stock and icon UIs.
  - A05-17: no Components search.
  - A05-18: the SearchBar primitive is barely used.
- **Runtime verified:** none. 14 search test files ran: 172 passed and 3 failed, all known `CommandPalette.test.tsx` label drift.
- **NOT RUNTIME VERIFIED:**
  - A05-1: the hidden-modal sequence;
  - A05-3 and A05-4: the false negatives;
  - A05-11: the ⌘F hijack;
  - all server searches (no DB).
- **Dependencies:**
  - A05-1, A05-2 and A05-11 form one "editor key ownership and palette" batch with A01-14, A03-2/3/4/6/12.
  - A05-3 and A05-4 share one fix: a single media match function and a single server leg.
  - A05-5 and A05-6 share `searchInsert`.
- **Inventory corrections:**
  - There are **three** editor palettes (⌘K shell, ⌘⇧P canvas, **⌘K Pages**), plus an unused chrome-ui palette primitive, not two.
  - Media has **four** search engines, not three UIs over one engine.
  - The dashboard palette's "Pages" scope searches sites.
- **Suggested next owners:**
  - **C (Prompt 6):** key arbitration (A05-1, A05-11).
  - **E:** a single match source for media (A05-3/4) and the dead-code sweep (A05-12).
  - **G:** regression tests for A05-1, A05-3 and A05-4.
  - **Orchestrator:** decide on the jump-to scope (A05-2) before the palette merge.
