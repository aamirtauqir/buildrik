# Gap inventory · 03-editor (page 03 · Editor)

Source: `docs/design-2l9/dump/page-3-4.json` (363 frames, 363 active). Code read at `feat/design-2l9` (c7920dd91). Read-only; zero Figma calls. Statuses judged from dump texts/instances/boxes vs code; no live screenshots.

Counts: drift 140 · match 13 · missing 208 · blocked:review-only-fixture 2

## Shell overlays (Phase 1)

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Page switcher overlay | 558:448976, 558:449032, 558:449088 | 3 | `packages/editor/src/editor/shell/PageTabBar.tsx:74` | missing | phase1 (Task 1.3): Shell/PageSwitcherMenu not built; PageTabBar tabs today. ⌘P copy → code:shortcut-cmd-p-is-preview |

## Review fixtures

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Review-only hub / outcome fixture | 265:119746, 423:100464 | 2 | `—` | blocked:review-only-fixture | Designer index/outcome board, not a product surface; no live state to compare |

## J-F1 journey (editor)

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Base editor · Layers + canvas + inspector | 7:18654, 7:19791 | 2 | `packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:20` | drift | Footer board: 'Home / Hero · 1440 px · 52% · View'; code: Undo/Redo·View▾·100%▾·readout. Undo removal is phase1 |
| Add panel · Insert into target | 7:18981, 7:19448 | 2 | `packages/editor/src/editor/sidebar/tabs/build/BuildTab.tsx:236` | drift | Board: Elements\|Blocks\|Components tabs, 'Insert into Hero · At end' target, 'Text added to Hero' receipt; code: collapsible groups + AI row |
| Edit/style selected text (inspector) | 7:20283, 7:20634 | 2 | `packages/editor/src/editor/inspector/ProInspector.tsx:158` | drift | Inspector body belongs to L-B (04); canvas/Layers context matches base editor archetype |
| Breakpoint inheritance / override row | 8:1282, 8:1705, 8:2272 | 5 | `packages/editor/src/editor/inspector/shared/controls/OverrideDot.tsx:2` | drift | Board copy 'Font size · 24px · inherited from Desktop' / 'Remove Tablet override' absent; code shows OverrideDot only (L-B) |
| Preview · current breakpoint | 8:3262 | 1 | `packages/editor/src/editor/shell/PreviewOverlay.tsx:72` | drift | Board: 'Back to editor · Home · Draft preview · Tablet · 768px' + fidelity notice; code: '‹ Back to canvas', opens at Desktop |

## Pages manager

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Pages manager · default list | 63:6393, 63:20585, 94:13447 | 7 | `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.tsx:358` | drift | No Pages\|Listings\|Structure switch (views in ⋯ menu); folders render before root pages; no 'Collection pages' block (Open page/Manage in CMS) |
| Page actions menu | 63:13820, 131:41791 | 2 | `packages/editor/src/editor/sidebar/tabs/pages/components/PageContextMenu.tsx:111` | drift | Code lacks Save as template…, Move to folder…, Move up/Move down; board order differs |
| Rename · URL choice | 63:14567 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/RenameUrlDecision.tsx:32` | match | URL: /old → /new? · Keep URL · Update URL · Cancel rename |
| Live URL change confirm | 63:15255 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:221` | missing | No 'Change this live page’s URL?' consequence dialog before Update URL on a live page |
| Delete page · Undo receipt | 63:19334 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | drift | Undo toast exists; board receipt adds 'Recently deleted' door (trash not built) |
| Listings view | 63:21262 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/SearchListingsTable.tsx:82` | drift | Code columns PAGE/TITLE/DESC; board 'Page and URL · SEO score · Visibility' at 720 wide |
| Structure view | 63:21939 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/SiteStructureTree.tsx:74` | drift | Route tree exists; board header 'URL structure · fieldwork.studio · Site root' + footnote absent |
| Pages search no results | 63:22616 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/PageList.tsx:229` | drift | Code 'No pages match your search.'; board 'No pages match “q”' + Clear search |
| Rename / URL receipts | 63:23182, 64:10927 | 2 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:227` | drift | Undo toast exists; board receipt copy 'Our story renamed · URL kept' + inline 'Page renamed. URL kept at /about.' differs |
| Settings saved receipt | 64:18356 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/page-settings/usePageSettings.ts:283` | match | 'Page settings saved' toast; exact-return to manager |
| Pages panel ⋯ menu | 65:17148 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.tsx:394` | drift | Code: Select pages·Listings·Show structure·Reload·Widen panel; board adds 'Recently deleted'. Widen panel = code-ahead |
| Manager closed · origin retained | 67:11915, 67:12583, 69:19044 | 13 | `packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:20` | drift | Base editor after manager closes; inherits base-editor footer drift |
| Other page opened · page inspector | 94:12846, 94:15445, 94:21526 | 8 | `packages/editor/src/editor/inspector/components/PagePanel.tsx:1` | drift | Board 'About · Page · Page appearance … SEO & social'; code PagePanel has ✦ AI chip (pr33) and different section copy |
| Pages offline | 94:14750, 94:35825, 109:44764 | 3 | `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.tsx:358` | missing | No 'Needs a connection · Loaded pages can still be opened.' band |
| Viewer · pages read-only | 94:20973 | 1 | `packages/editor/src/editor/shell/ViewerRoleNotice.tsx:27` | drift | Role notice exists (L-F); 'Managing pages needs Editor access' panel copy missing |
| Pages offline actions | 94:28891 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/PageContextMenu.tsx:111` | missing | Menu has no offline-disabled state |
| Restored page view only | 142:61405 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | missing | No view-only state for a page above plan limit |

## Page settings

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Page settings · SEO | 63:15939, 94:29621, 95:20851 | 5 | `packages/editor/src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx:135` | drift | Board 720×700 modal 'About · Page settings' + 'Home stays open' subtitle; code drawer 'Page settings — About'; SeoTab ✦ AI suggest (pr33) |
| Page settings · Social | 63:16507 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SocialTab.tsx:25` | drift | Modal vs drawer; board adds explainer + Social image URL field |
| Page settings · Advanced | 63:17061 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/page-settings/AdvancedTab.tsx:69` | drift | Board: Publish visibility Live, 'Search indexing: Indexed · Change in SEO', Head code · Pro; code has own indexing switch |
| URL changed · redirect offer | 63:17617 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx:271` | drift | Copy matches; container (modal) and 'Later' vs 'Not now' differ |
| Settings save failed | 63:18189, 101:23620 | 2 | `packages/editor/src/editor/sidebar/tabs/pages/page-settings/usePageSettings.ts:283` | missing | No 'Couldn’t save page settings. Your changes are still here.' + Retry save |
| Unsaved close guard | 63:18758, 101:24231, 101:29372 | 4 | `packages/editor/src/editor/sidebar/tabs/pages/page-settings/UnsavedWarningModal.tsx:95` | drift | Code Keep editing/Discard; board 'Leave without saving?' + Save and leave (+offline/invalid variants) |
| SEO score breakdown | 65:17860 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx:455` | drift | Code 4 checks (+30/+40 pts); board 6-row /100 breakdown dialog |
| Redirect repair (Site settings) | 65:18435, 65:18981 | 2 | `packages/editor/src/editor/sidebar/tabs/settings/components/RedirectRepairCard.tsx:109` | match | 'Redirect for <Page>' / 'Redirect saved' card exists (L-E owns); verify live |
| Redirect saved · SEO return | 67:11341 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx:260` | missing | No return receipt 'Redirect saved · /a → /b · Applies on next publish' inside SEO |
| Settings offline save unavailable | 94:30029 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx:135` | missing | No 'Needs a connection to save page settings' state |
| Draft retained / return pending | 101:22426, 101:23017, 101:24836 | 8 | `packages/editor/src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx:135` | missing | No navigation-pending/saving/offline/invalid-slug draft states |

## New page and template creation

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| New page dialog | 101:29978, 101:36828, 109:32916 | 3 | `packages/editor/src/editor/sidebar/tabs/pages/components/NewPageModal.tsx:113` | drift | Code Blank/From template cards; board 'Fieldwork Studio · Create a page', source select, 'Choose template', '6 of 10 pages on Free' |
| New page · missing name | 101:37542 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/NewPageModal.tsx:143` | drift | Validation copy 'Name the page' differs |
| New page · capacity reached | 101:38257 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/NewPageModal.tsx:113` | missing | No plan page-capacity readout/limit in editor |
| New page · checking capacity | 101:38980 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/NewPageModal.tsx:113` | missing | No capacity check state |
| New page · capacity unavailable | 101:39695 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/NewPageModal.tsx:113` | missing | No capacity error + Retry check |
| New page · creation rejected | 101:40412 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/NewPageModal.tsx:81` | drift | Code 'Couldn't add page right now. Try again.'; board 'Couldn’t create Services. Nothing was changed.' |
| New page · offline | 101:41127 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/NewPageModal.tsx:113` | missing | No offline state |
| New page · creating | 101:41858 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/NewPageModal.tsx:87` | missing | No in-dialog 'Creating…' progress; code closes + 'Page created' toast |
| Page created · empty page receipt | 101:42581, 107:30807 | 2 | `packages/editor/src/editor/canvas/CanvasEmptyCTA.tsx:1` | drift | Board 'Your page is ready · Use Add to insert…' + 'Services created · Added to site navigation' |
| Template gallery for new page | 104:28892 | 1 | `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx:461` | drift | Board '‹ Back to New page', 'Creating “Services”' strip; code back reads ‹ Back to canvas/Pages (L-C) |
| Template preview for new page | 105:29094 | 1 | `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx:498` | drift | Preview exists; board adds Desktop/Tablet/Mobile + 'Uses your brand colors' (L-C) |
| Template create operation dialog | 106:29182, 106:37032, 106:37213 | 7 | `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx:46` | missing | No confirm/progress/slow/partial/unconfirmed operation dialog (L-C) |
| Template created receipt | 106:37579, 122:34115 | 2 | `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx:46` | missing | No 'Services created from SaaS Landing' receipt / unconfirmed inspection (L-C) |
| Empty page deleted / restored | 107:30125, 109:42059 | 2 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | missing | No post-failure cleanup receipt / restore |
| Creation reconciliation | 118:33757, 118:33946, 118:34132 | 6 | `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx:46` | missing | No server reconciliation states (L-C; needs tRPC chain) |

## CMS record guard (L-C)

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| CMS record draft with Pages | 122:43331, 122:43815 | 2 | `packages/editor/src/editor/cms/RecordSheet.tsx:651` | drift | CMS record editor exists (L-C); opening Pages manager over a dirty record not drawn this way |
| CMS leave guard on page navigation | 122:44151, 122:44343, 125:35023 | 16 | `packages/editor/src/editor/cms/RecordSheet.tsx:651` | missing | No record-draft guard when opening a page (save/queued/failed/removed states) (L-C) |

## Pages folders and order

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Private folder create | 127:36696, 127:37393 | 2 | `packages/editor/src/editor/sidebar/tabs/pages/components/PageFolder.tsx:24` | drift | Folders are personal (tip copy); board inline name + 'Create folder' and receipt |
| Move page to folder dialog | 127:38098, 131:39598, 131:40341 | 3 | `packages/editor/src/editor/sidebar/tabs/pages/components/MovePagesDialog.tsx:50` | drift | Bulk dialog only; no per-page 'Move About to…' from row menu; 'already at top level' note missing |
| Folder move receipts | 127:38819, 127:40244, 131:41086 | 6 | `packages/editor/src/editor/sidebar/tabs/pages/useFolders.ts:1` | missing | No organization receipts ('About moved to Studio · /about unchanged') |
| In-folder member actions | 127:39528, 134:44345 | 2 | `packages/editor/src/editor/sidebar/tabs/pages/components/PageContextMenu.tsx:132` | missing | Only 'Remove from folder'; no disabled Move up/down with reason |
| Reorder via menu | 137:53911, 137:55343, 137:56060 | 5 | `packages/editor/src/editor/sidebar/tabs/pages/components/PageContextMenu.tsx:111` | missing | No Move up ⌥↑ / Move down ⌥↓ commands, boundaries or position receipts (drag only) |
| Folder actions menu | 137:57493 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/PageFolder.tsx:267` | drift | Code icon button 'Delete folder (pages kept)'; board menu 'Delete folder · keep page' |

## Pages bulk actions

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Bulk selection bar | 139:47668, 139:53653 | 2 | `packages/editor/src/editor/sidebar/tabs/pages/components/BulkToolbar.tsx:46` | drift | Board adds 'Clear' to the bar; code relies on header Done |
| Bulk delete partial / retry | 139:48427, 139:49184, 139:49899 | 5 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:331` | missing | Bulk delete is all-or-undo; no per-page result, retry or partial undo |
| Bulk duplicated receipt | 139:50620 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:331` | drift | Board '3 pages duplicated · Originals kept' |
| Bulk move dialog | 139:51389 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/MovePagesDialog.tsx:50` | drift | Board body names pages + URL-unchanged note; button 'Move 3 pages' |
| Homepage in bulk delete | 139:52895 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/components/BulkToolbar.tsx:46` | missing | No 'Home is the homepage' disabled reason in bulk bar |

## Recently deleted and restore

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Recently deleted list | 63:20001, 142:53229, 142:61796 | 4 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | missing | No page trash; delete is composer-local undo only. Server work needed (full tRPC chain) |
| Restore slug collision | 142:53954, 142:54521, 144:64089 | 3 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | missing | No restore-with-new-slug flow |
| Recently deleted · offline | 142:55231 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | missing | No page trash |
| Permanent delete typed confirm | 142:55781, 142:56347 | 2 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | missing | No permanent delete (Admin) |
| Recently deleted · empty | 142:56910 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | missing | No page trash |
| Recently deleted · restore failed | 142:57466 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | missing | No page trash |
| Recently deleted · loading | 142:58015 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | missing | No page trash |
| Restore over plan limit | 142:58571, 144:65617, 145:80116 | 3 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | missing | No plan-limit/view-only restore or plan options dialog |
| Restore receipt | 142:59972 | 1 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | missing | No restore receipt |
| Return · Pages recovery states | 142:62396, 142:63098, 142:63798 | 11 | `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:306` | missing | Return frames of the trash flow; origin restore depends on trash |

## Canvas view, grid, width and guides

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Canvas view menu | 145:64586 | 1 | `packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:130` | drift | Code toggles Snap guides·Spacing·Grid·Rulers·Badges·X-Ray; board Grid · 7 px ›, Rulers and guides…, Snap guides, Show outlines, Focus mode |
| Grid and snapping dialog | 145:65011, 145:65889 | 2 | `packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:153` | drift | Code grid submenu 4/8/16 + custom; board dialog with 'Show grid and snap' toggle + Apply |
| Grid invalid draft | 145:65448 | 1 | `packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:477` | drift | No 'Enter a whole number from 1 to 100 px' validation copy |
| Rulers and guides list | 145:66698, 145:68858, 145:69294 | 8 | `packages/editor/src/editor/canvas/overlays/GuidesOverlay.tsx:13` | missing | Guides are drag-only, unpersisted (GuideManager add/remove). No shared-site list, lock, undo removal |
| Add guide numeric | 145:67134, 153:82970, 153:83468 | 5 | `packages/editor/src/engine/canvas/indicators/GuideManager.ts:49` | missing | No numeric add-guide form |
| Guide detail edit/lock/remove | 145:67569, 145:67997, 145:68426 | 29 | `packages/editor/src/engine/canvas/indicators/GuideManager.ts:49` | missing | No guide detail panel, lock, apply, sync/conflict states |
| Page width presets | 145:71013 | 1 | `packages/editor/src/editor/canvas/controls/CustomWidthModal.tsx:13` | drift | Range 240–2560 matches; board popover with preset list vs code modal from breakpoint menu |
| Custom width invalid | 145:71444 | 1 | `packages/editor/src/editor/canvas/controls/CustomWidthModal.tsx:13` | drift | Validation copy 'The page stays at 1440 px' differs |
| Viewer inspects guides | 145:71878, 146:74844 | 2 | `packages/editor/src/editor/canvas/overlays/GuidesOverlay.tsx:13` | missing | No read-only guide inspection |
| Return · canvas view state | 145:72343, 145:72772, 145:73215 | 6 | `packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:20` | drift | Origin after closing view/grid/width; base footer drift |
| Return · canvas with shared guides | 145:74465, 145:74905, 145:75344 | 39 | `packages/editor/src/editor/canvas/overlays/GuidesOverlay.tsx:13` | missing | Origin shows retained shared guides; guide model missing |
| Guide sync failed / offline | 146:73094, 146:73969 | 2 | `packages/editor/src/engine/canvas/indicators/GuideManager.ts:49` | missing | Guides are not synced; no failure/offline states |

## Layers

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Layers base with selection footer | 147:75914, 152:78614, 152:79032 | 4 | `packages/editor/src/editor/sidebar/tabs/layers/LayersTab.tsx:302` | drift | Code footer 'N layers'/'N selected of M'; board 'N layers · 1 selected' (+ 'inside Hero') |
| Layer display preferences | 147:76329, 152:79864 | 2 | `packages/editor/src/editor/panels/layers/components/LayerDisplaySettings.tsx:27` | drift | Five toggles match; footnote 'Personal editor view. Live-site visibility is edited in the Inspector.' missing |
| Compact rows | 147:76773 | 1 | `packages/editor/src/editor/panels/layers/components/LayerDisplaySettings.tsx:29` | drift | Density exists; footer '8 layers · Compact rows' missing |
| Search results with parent paths | 147:77189, 147:79728 | 2 | `packages/editor/src/editor/panels/layers/hooks/useLayerSearch.ts:86` | drift | Code filtered tree w/ ancestors; board flat results 'Services › Card 1', '12 matches in 5,000 layers' |
| Locked by ancestor | 147:77668, 147:78110, 147:78484 | 3 | `packages/editor/src/editor/panels/layers/LayerTreeItem.tsx:94` | missing | Lock exists; no 'Locked by Hero' inheritance, reveal or unlock banner |
| Dimmed in editor only | 147:78900 | 1 | `packages/editor/src/editor/panels/layers/LayerTreeItem.tsx:128` | missing | Dimmed exists; no 'Dimmed in editor only · Show normally · Hide on live site…' banner |
| Layers no matches | 147:79328 | 1 | `packages/editor/src/editor/sidebar/tabs/layers/LayersTab.tsx:302` | drift | Board 'No layers match “q”' + hint + Clear search |
| Layers tree commands | 152:78185 | 1 | `packages/editor/src/editor/sidebar/tabs/layers/LayersTab.tsx:244` | drift | Code Expand/Collapse all·Display settings·Widen; board adds Collapse to selection, Select mode |

## Navigation, commands, help, preview, share

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Editor origin (base) | 263:249222, 263:258914 | 2 | `packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:20` | drift | Base editor as command origin |
| Site menu | 263:249638 | 1 | `packages/editor/src/editor/shell/SiteMenu.tsx:163` | drift | Board: Search ⌘K row, Pro plan, This site (4 rows), Help & tools; code-ahead: Duplicate, Issues, Activity, Copy live URL, Collaborate |
| Command palette | 263:250083, 263:250542, 263:250988 | 5 | `packages/editor/src/editor/shell/modals/CommandPalette.tsx:621` | drift | Placeholder/bands differ; no nested 'Go to page ›' scope or footer key legend; AI command row :239 (pr33) |
| Assets origin | 263:252230 | 1 | `packages/editor/src/editor/media/LibraryManager.tsx:357` | drift | Assets full view is L-C; palette origin only |
| Palette scoped to Assets | 263:252510, 263:252811, 263:253111 | 3 | `packages/editor/src/editor/shell/modals/CommandPalette.tsx:621` | missing | No scope chip / scoped-no-results states |
| Palette components loading | 263:253409 | 1 | `packages/editor/src/editor/shell/modals/CommandPalette.tsx:621` | missing | No components loading band |
| Palette components failed | 263:253840 | 1 | `packages/editor/src/editor/shell/modals/CommandPalette.tsx:621` | missing | No 'Couldn’t load components · Retry' |
| View mode origin / palette | 263:254275, 263:254659 | 2 | `packages/editor/src/editor/shell/SiteMenu.tsx:153` | drift | View mode exists; board read-only palette capabilities differ |
| Help menu | 263:255084, 263:255509 | 2 | `packages/editor/src/editor/shell/SiteMenu.tsx:163` | missing | No rail Help menu (Keyboard shortcuts · Getting started live in site menu) |
| Keyboard shortcuts sheet | 263:255899, 263:256463, 263:257027 | 6 | `packages/editor/src/editor/canvas/controls/KeyboardCheatSheet.tsx:123` | drift | Search exists; no macOS/Windows key toggle or single-key preference |
| Shortcuts no match | 263:258033 | 1 | `packages/editor/src/editor/canvas/controls/KeyboardCheatSheet.tsx:123` | drift | Board 'No shortcuts match “q”.' |
| Preview overlay | 263:259330, 263:259379 | 2 | `packages/editor/src/editor/shell/PreviewOverlay.tsx:72` | drift | '‹ Back to canvas' vs '‹ Back to Editor'; no page picker, fidelity notice or building state |
| Preview build failed | 263:259428 | 1 | `packages/editor/src/editor/shell/PreviewOverlay.tsx:72` | missing | No 'Couldn’t build the preview · Try again' |
| Share preview dialog | 263:259482, 263:259540, 263:259601 | 6 | `packages/editor/src/editor/shell/PreviewShareModal.tsx:147` | match | Title, explainer, Getting the link…, Open ↗, Copy link, Done, Link copied |
| Share preview copy failed | 263:259663 | 1 | `packages/editor/src/editor/shell/PreviewShareModal.tsx:129` | drift | Verify copy-failure keeps selectable URL |
| Share preview service error | 263:259725 | 1 | `packages/editor/src/editor/shell/PreviewShareModal.tsx:167` | drift | Verify link-service error state |
| Public preview unavailable | 263:261113, 263:261535, 263:261957 | 3 | `packages/dashboard/app/share/[token]/unavailable.tsx:11` | match | Copy matches all three reasons (dashboard route) |
| Public saved preview | 265:119612, 265:119657 | 2 | `packages/dashboard/app/share/[token]/draft-preview.tsx:90` | drift | Header 'Draft preview · the last saved design…' vs board 'Buildrick · Site · Home · Saved preview' + fidelity band |

## Inline text editing

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Text selected · Enter edits | 423:96903 | 1 | `packages/editor/src/editor/panels/RichTextEditor.tsx:22` | drift | Inspector 'Edit text' + explainer copy absent (L-B); breadcrumb readout |
| Inline text toolbar | 423:97218, 423:100171 | 2 | `packages/editor/src/editor/panels/RichTextEditor.tsx:43` | drift | Code full toolbar (sizes, align set, colours); board compact 'Heading ▾ B I U Lists Align Color Link … Done' |
| Text commit / undo | 423:97552, 423:97866 | 2 | `packages/editor/src/editor/panels/RichTextEditor.tsx:22` | drift | phase1 (Task 1.2 one history step on commit); board receipt copy |
| More formatting menu | 423:98182 | 1 | `packages/editor/src/editor/panels/RichTextEditor.tsx:64` | drift | Overflow menu 'Strikethrough · Indent · Outdent · Text highlight · Clear formatting' not a menu in code |
| Inline link | 423:98532, 423:98884, 423:99224 | 3 | `packages/editor/src/editor/panels/RichTextEditor.tsx:22` | drift | Link popover exists; board dialog 'Link selected text' + Apply link |
| Text save failed | 423:99545 | 1 | `packages/editor/src/editor/panels/RichTextEditor.tsx:22` | missing | No 'Retry site save' inline state |
| Locked text | 423:99859 | 1 | `packages/editor/src/editor/panels/layers/LayerTreeItem.tsx:94` | missing | No 'Locked — unlock … Enter and double-click do not start an edit' notice |

## Release guidance (H1, forms)

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| No H1 guidance | 425:98763, 425:99052 | 2 | `packages/editor/src/editor/shell/hooks/useContentIssueScanner.ts:54` | missing | No 'Home has no H1 · Make this H1' non-blocking inspector guidance |
| New form visible labels | 425:99342 | 1 | `packages/editor/src/blocks/Forms/index.ts:20` | missing | No form inspector note; verify new Form block inserts visible labels |

## Top drifts

1. **Pages manager layout** (`sidebar/tabs/pages/PagesTab.tsx:358`). The board puts a Pages | Listings | Structure switch under search, root pages first, then "My folders · Only visible to you", then a "Collection pages" block (Open page / Manage in CMS), and a "● marks a page with unsaved changes" legend. The code hides the views in the ⋯ menu, renders folders before root pages, and has no collection block. This affects about 20 boards directly and every board that keeps the manager open.
2. **Page settings is a drawer, not the 720×700 modal** (`page-settings/PageSettingsDrawer.tsx:135`). The board titles it "About · Page settings" with the subtitle "Editing About · Home stays open on the canvas". The code titles it "Page settings — About". The SEO tab also carries the "Write with AI" suggest at `SeoTab.tsx:315`, which is an AI surface for pr33.
3. **Add panel** (`sidebar/tabs/build/BuildTab.tsx:236`). The board shows Elements | Blocks | Components tabs, an "Insert into Hero · Home / Hero · At end" target strip and a "Text added to Hero · Selected on canvas" receipt. The code shows collapsible ELEMENTS/BLOCKS/… groups plus the "✦ Generate a block with AI…" row at `:303–317`, an AI surface for pr33.
4. **Canvas View menu** (`canvas/CanvasFooterToolbar.tsx:130`). The board menu is Grid · 7 px ›, Rulers and guides…, Snap guides, Show outlines and Focus mode. The code menu is Snap guides, Spacing, Grid, Rulers, Badges and X-Ray. The grid is a 4/8/16 submenu where the board has a dialog with Apply. The footer also differs: the board reads "Home / Hero · 1440 px · 52% · View", while the code has Undo/Redo, View▾, 100%▾ and a selection readout. Removing the undo controls is Phase 1 work.
5. **Page row menu** (`components/PageContextMenu.tsx:111`). The code is missing Save as template…, Move to folder… and Move up ⌥↑ / Move down ⌥↓. Reordering is drag-only, so every order board (P128–P136) is missing.
6. **New page dialog** (`components/NewPageModal.tsx:113`). The code uses Blank/From template radio cards. The board uses a source select with "Choose template", a "6 of 10 pages on Free" capacity line, and capacity, offline and creating states. The editor has no plan page-capacity source at all.
7. **Layers search** (`panels/layers/hooks/useLayerSearch.ts:86`). The code filters the tree and keeps ancestors. The board shows flat results with parent paths ("Services › Card 1") and "12 matches in 5,000 layers". The footer copy also differs (`LayersTab.tsx:302`).
8. **Command palette** (`shell/modals/CommandPalette.tsx:621`). The code is missing the board placeholder, the nested "Go to page ›" scope, the Assets scope chip, the loading and failed bands, and the key-legend footer. It also still registers "Generate a block with AI…" at `:239` (pr33).
9. **Preview overlay** (`shell/PreviewOverlay.tsx:72`). The code reads "‹ Back to canvas" where the board reads "‹ Back to Editor". Preview opens at Desktop instead of the current breakpoint. The code has no page picker ("Home ▾"), no fidelity notice, and no building or failed states.
10. **Inline text toolbar** (`panels/RichTextEditor.tsx:43`). The code toolbar is the full kitchen sink. The board toolbar is compact: "Heading ▾ B I U Lists Align Color Link … Done", with extra tools in a "More formatting" menu. The code has no save-failed or locked-text states.

## Largest missing capabilities (need server or engine work, not only visuals)

- **Page trash / Recently deleted** (P12, P148–P166, 11 Return frames). Deleting a page is a composer-local undo today. Restore, permanent delete, slug collision and plan-limit restore need a server model through the full tRPC chain.
- **Shared ruler guides** (B3-C05…C52 plus about 45 Return frames, the largest block on the page). `engine/canvas/indicators/GuideManager.ts:49` only adds and removes guides in memory. The board wants guides shared across the site, numeric add, lock, apply, sync/offline/conflict states, undo of a removal, and read-only inspection for Viewers.
- **CMS record leave guard when opening a page** (P90–P116), owned by L-C.
- **Template-create operation dialog and reconciliation** (P66–P94), owned by L-C (`sidebar/tabs/templates/`).
- **Page-settings draft guard with navigation pending / offline / save rejected** (P44–P53, P78–P82).

## Code-ahead dispositions

| capability (code) | where | board | disposition |
|---|---|---|---|
| "Widen panel / Narrow panel" | `PagesTab.tsx:412`, `LayersTab.tsx:256` | absent from both ⋯ menus | keep in the ⋯ menu (owner decision if the board should drop it) |
| Spacing / Badges / X-Ray overlay toggles + chords | `CanvasFooterToolbar.tsx:130` | View menu has Show outlines / Focus mode instead | owner decision: keep the chords in ⌘K + shortcuts sheet if the menu follows the board |
| Duplicate site, Issues, Activity log, Copy live URL, Collaborate group, Leaves-the-editor group | `shell/SiteMenu.tsx:163` | board site menu has 4 "This site" rows + Help & tools | owner decision (`open:site-menu-scope`); never drop silently |
| Paste HTML… (⌘⇧V) | `BuildTab.tsx:257` | Add panel has no ⋯ menu | keep in the Add ⋯ menu |
| Page row "Remove from folder" | `PageContextMenu.tsx:132` | board P125 "Remove from Studio" in the folder-scoped menu | kept: same capability in a different menu |
| Rail tabs beyond board's Add/Layers/Pages/Assets/CMS/Brand/Help (Templates, Components, Settings, Publish, History, Activity, Review) | `rail/tabsConfig.ts:58` | not on rail | Shell/Rail; owner decision for Phase 1 / lane leads |
| AI entry points: Add "Generate a block with AI…", ⌘K AI command, SEO "Write with AI", PagePanel ✦ AI | `BuildTab.tsx:317`, `CommandPalette.tsx:239`, `SeoTab.tsx:315`, `inspector/components/PagePanel.tsx:6` | none (no AI in UI) | `blocked:pr33-ai-removal`: removed by unmerged PR #33 |

## Notes and limits

- Phase 1 rows: the 3 "Overlay · Page switcher" frames (Task 1.3; the board's "⌘P to switch" becomes `code:shortcut-cmd-p-is-preview`), the topbar undo removal behind every footer drift, and TX03/TX04 commit-as-one-history-step (Task 1.2).
- Boards owned by other lanes but drawn on page 03 are tagged in notes: inspector bodies (L-B: J-F1.05–.10, PagePanel), templates (L-C: P64–P94), CMS guard (L-C), Redirect repair (L-E: P22/P23), ViewerRoleNotice (L-F: P34).
- Not live-verified. `match` here means the copy and controls found in code agree with the dump. Each match still needs THE LOOP comparison.
- `DE00` and `B3-N41` are designer hub/fixture boards, marked `blocked:review-only-fixture`.
