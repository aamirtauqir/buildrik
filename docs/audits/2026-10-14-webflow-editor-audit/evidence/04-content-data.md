# 04 — Area F: Content & data (elements, text, links, media, forms, CMS, ecommerce, Inspector content-vs-style)

Audit of `main @ df60cf9ec`, 2026-10-14. Read-only. Evidence levels: **CODE**, **REACH**, **PLANNED**. **LIVE** was not done — see §10. **DESIGN**: not assessed (owner instruction).
Paths are relative to `packages/editor/src/` unless they start with `server/`, `lib/`, `packages/`, or `prisma/`.

Method: four parallel code readers (F1 elements/text/links, F2 media, F3 forms/ecommerce/Inspector, F4 CMS). The lead then re-read the load-bearing claims. Rows marked **[lead-verified]** were re-read line by line by the lead at df60cf9ec. The other citations come from the readers and were not individually re-opened.

---

## 0. Re-checks of prior claims (10-08 and 10-10 audits)

| Claim | Verdict @df60cf9ec | Evidence |
|---|---|---|
| **10-08 L1-002 (Critical)**: export/publish drops an element's own text once it has a child (`ExportEngine.ts:486-494` either/or) | **No longer true in ExportEngine** (fix 7bf99a90f). **Still present in the React exporter.** [lead-verified] | `engine/export/ExportEngine.ts:505-513` (`elementToHTML`: "Own text first, then children") and `:1268-1278` (`renderPageElement`, the publish path) both write content and then children. `engine/export/ReactExporter.ts:240-247` is still either/or; it is reachable via Export → React. The input that triggers it is still reachable through **drag** (F-07). |
| **10-08 L4-001 / media P0-1 (Critical)**: media drop writes `src` onto the section/root | **No longer true** (fix 2cb6d3a43). [lead-verified] | `editor/canvas/hooks/drag/mediaDrop.ts:28-71`: `replaceTargetFor` only replaces a same-type image/video or an element with a `url()` background. Otherwise it runs `insertMediaAt` inside a transaction with no target. The lock is checked before replace (`:44`) and before the OS-file upload (`useDropExecution.ts:239-240`). Residual defects on the fixed path: F-10, F-11. |
| 10-08 media P1-1: every library drag re-uploads | **No longer true for library assets** | `useDropExecution.ts:149` + `isLibraryAsset` (`mediaDrop.ts:74-76`). Stock/remote images still auto-save a copy on every drag/click, and the element keeps the hotlinked provider URL (`useMediaState.ts:186-188`). |
| **RT-01**: local asset retained but document image missing after reload | **Confirmed. Root cause now isolated in code** [lead-verified for steps 1 and 4] | (1) `services/AssetUploadService.ts:153-185`: when `createAsset` throws, the catch returns `null` and discards `uploaded.url`, leaving an orphan Blob. (2) `MediaManager.uploadFile` keeps a `blob:` src and sets `localOnly` (`engine/media/MediaManager.ts:1119,1131,1233-1236`). (3) Insert places `<img src="blob:…">`. (4) Save: `services/BuildrikSyncProvider.ts:835-840` `dropSessionMediaUrls(root)` strips the `blob:` src with no remap, so the server copy has no src. (5) Reload: `LOCAL_URLS_REBUILT` remap (`MediaManager.ts:946-971` → `Composer.ts:561-568`) only re-points elements whose src *equals* the old blob URL. None match. (6) A later successful retry remaps the current blob → remote URL (`MediaManager.ts:733-735`); again nothing matches, and it uploads a second Blob. Element↔asset linkage is the URL string only (no `data-asset-id`). |
| **WS-01**: failed metadata/move writes look locally successful | **Confirmed in code** | `AssetUploadService.ts:224-233` (`moveAsset` → false) and `:236-251` (`updateAsset` → false). `MediaManager.ts:1388`, `:1435` ignore both booleans. `useLibraryState.ts:328-338`. `MoveFailedModal` (`LibraryManager.tsx:1235`) fires only on a local IndexedDB error. Compounding: `importServerAssets` skips ids already held (`MediaManager.ts:633`), contradicting its "server wins" docstring (`:520-523`). Remote changes and refusals never reconcile. |
| **WS-03**: component library read error renders as empty | **Confirmed in code** | `services/componentSync.ts:184-195`: `fetchComponentLibrary` catches the error, `console.warn`s, and returns `[]`. `useComponentList.ts:55` `.then(setLibrary)` has no error state; the hook's `error` covers only `getAllComponents()` (`:46-52`). `ComponentsTab.tsx:70,246`. |
| **UX-15**: CMS empty state leaves main area unused; two competing create doors | **Confirmed in code** | `editor/cms/CmsWorkspace.tsx:178-207`: an empty centre with a header "+ New collection" (`:192-196`), and the invitation in the right `HintColumn` (`:201-202`) with no button. The drawer's empty state has four link buttons, Create / Sources / Variables / Conditions (`ContentViews.tsx:159-230`, `:190-227`). |
| **UX-16**: "one page per row" vs "dynamic pages optional", toggle off | **Confirmed in code** | `ContentViews.tsx:183` vs `CMSCollectionSetupModal.tsx:295-297`; the toggle defaults off at `:133`, `:377-380`. |
| **UX-17**: create dialog opens at step 2 with step 1 checked | **Confirmed in code** | `CMSCollectionSetupModal.tsx:283-293`: the step bar is hard-coded (✓ "Name & Type", active "2 Fields") and `aria-hidden`, while the name starts at `""` (`:129`). The collection has no "Type" choice anywhere. |
| **IA-11**: inspector-width HintColumn reserved even when empty | **Confirmed, partly** | `CmsWorkspace.tsx:70-80`. The column is reserved for no-collection, empty Records, Fields with no selection, Dynamic pages and Settings (`:201-205`, `:319-330`, `:447`). It is not reserved for Records with rows or for a selected field. |
| **UX-20**: Upload is dark in the top bar and blue in the empty state; Grid/List followed by a second "Grid" | **Confirmed, and wider than reported** | Top bar `.mgr-upload-split` on `--bk-ink` (`editor/media/LibraryManager.css:95-116`). Empty library `.mgr-btn-primary` on `--bk-accent` (`:150-157`, `AssetGrid.tsx:1035-1045`). Empty folder: plain xs `Button` "Upload files" (`AssetGrid.tsx:1008-1009`). Drawer: gray-900 (`SlimLauncher.tsx:836`). That makes four Upload treatments. "Grid · List" (`AssetGrid.tsx:495-511`) is followed by "Grid ▾" for column count (`:513-555`). The header comment `AssetGrid.tsx:18-31` is stale. |

---

## 1. Module map

| Module | Purpose | Entry points | Main actions | Dependencies | Evidence |
|---|---|---|---|---|---|
| Element type union | 56 `ElementType`s; the nesting/capability source | `shared/types/element.ts:81-136` | — | `ELEMENT_RULES` (`shared/utils/nesting/rules.ts`), `ELEMENT_CAPABILITIES` (`shared/constants/elementCapabilities.ts:112-190`) | CODE |
| Block registry | 75 `BlockDefinition`s, one `insertBlock` door | `blocks/blockRegistry.ts:100-201`, `insertBlock :235-275`, `insertOne :363-402` | Build / sanitized HTML insert / createElement; `applyTypeDefaults` (`:285-338`); emits `ELEMENT_INSERTED` | `sanitizeHTML`, `canNestElement` | CODE |
| Add panel | ELEMENTS / BLOCKS (8 Sections) / BUILT-IN COMPONENTS (14) / SAVED / FROM LIBRARY / ★ / RECENT; search; ⋯ Paste HTML (⌘⇧V); "Generate a block with AI…" | Rail `add`, shortcut **A** (`editor/rail/tabsConfig.ts:57-69`) → `sidebar/TabRouter.tsx:145` → `sidebar/tabs/build/BuildTab.tsx`; `catalog/catalog.ts` (54 rows), `catalog/groups.ts:44-66`; search `/`, ⌘F | Click insert, drag insert, favourite, paste HTML | `useBuildTab.ts`, `shell/hooks/useBlockInsertion.ts`, `canvas/hooks/drag/dropOperations.tsx` | REACH |
| Templates | Whole-page HTML apply | `sidebar/tabs/templates/*`, `templatesData.ts` | `HTMLParser.importHTMLToActivePage` (`engine/elements/manager/HTMLParser.ts:98-145`) | — | REACH |
| S6 component catalogue | 27 schema-driven component types | `editor/components-catalog/catalog.ts`; drop handler `dropOperations.tsx:575+` | Used by AI edits only (`sidebar/tabs/ai/applySetStyle.ts`) | — | CODE, no UI drag source |
| Inline / rich text | Double-click edit; floating toolbar with 18 controls | `canvas/hooks/useCanvasInlineEdit.ts`; Inspector "Edit text on canvas" (`inspector/sections/typeBlock/EditTextRow.tsx`, `UI_INLINE_EDIT_REQUEST`); toolbar `canvas/overlays/CanvasOverlayGroup.tsx:303-325` → `editor/panels/RichTextEditor.tsx`; commands `canvas/hooks/useCanvasInlineCommands.ts` | Bold/italic/link/lists via `execCommand`; Enter/blur commit, Esc cancel | `sanitizeHTML`, `canWrite` | REACH (double-click withheld when read-only, `Canvas.tsx:751`) |
| Sanitizer SSOT | DOMPurify `sanitizeHTML`, `sanitizeElementTreeContent`, `sanitizeRichtext` | `shared/utils/html/sanitization.ts:153-246`; server `lib/sanitize-blocks` | — | DOMPurify | CODE |
| Links | Behaviour › Link: None / Page / URL / Email / Phone / Anchor, new tab, Rel; toolbar inline 🔗; "Add to site navigation" | `inspector/sections/LinkSection.tsx`; registry `inspector/sections/registry/behaviour.tsx:151-164`; `ElementManager.ts:264-290` | Writes `href` (`#page:<id>` for pages) via `writeElement` | `resolveHref` / `blockLinkPlan` (`engine/export/ExportHelpers.ts:467`) | REACH for link, button, container, section, card, cta. **Not** image or heading (`elementCapabilities.ts:112-136`) |
| Assets drawer (quick picker) | 280px insert/search/upload/pick panel | Rail `assets`, shortcut **M**, viewer-allowed (`rail/tabsConfig.ts:87-97,328-334`); ⌘K `nav-assets`, `tools-stock` (`CommandPalette.tsx:124,252-259`) → `sidebar/tabs/media/MediaTab.tsx` → `SlimLauncher.tsx` | Insert, replace, drag, upload, rename, delete, alt, versions | `useMediaState`/`useLibraryState`/`useUploadState`/`useDiscoveryState` → `composer.media`, `composer.mediaOps` | REACH |
| Pick mode | One picker for inspector / background / CMS / ⌘K | `data/assetPick.ts` `requestAssetPick`; `PickModePanel` (`MediaTab.tsx:241-255`) | `applyPick` (`useMediaState.ts:292-305`) | — | REACH |
| Full asset library | Folders + grid + details rail, about 15 modals | Drawer "Manage assets ›" (`SlimLauncher.tsx:281-293`) → `StudioPanels.tsx:769`; ⌘K `nav-asset-library` (`CommandPalette.tsx:125`) → `FullPageRouter.tsx:139-151` → `editor/media/LibraryManager.tsx`. No shortcut: the "J" in the `LibraryManager.tsx:7` comment is stale; ⌘J opens AI | Upload split (URL import, stock), folders, move, tags, versions, replace-across, alt | `AssetGrid`, `FolderTree`, `AssetDetailsPanel` | REACH |
| Media engine | Assets, folders, IndexedDB, upload, retry queue; insert/replace/grace delete/alt-follow | `engine/media/MediaManager.ts`, `MediaCommandLayer.ts` | `uploadFile :998`, `replaceAssetId`, `replaceMedia :246`, `followAssetAlt :280`, `deleteWithGrace :104-155` | `services/AssetUploadService.ts`, `MediaVersionService.ts` | CODE |
| Image editor | Crop / adjust / resize / optimise → new hidden "version" asset | `StudioModals.tsx:178` via library (`LibraryManager.tsx:620-658`) and drawer (`MediaTab.tsx:104-136`). The canvas door prop is never consumed (`StudioPanels.tsx:773-790,896`) | Save → `uploadFile({versionOf})` + `createAssetVersion` | `editor/media/ImageEditorModal.tsx`, `image-editor/*` | REACH (library/drawer only) |
| Stock / alt text | Unsplash photos, Pexels videos; OpenAI alt | Drawer discovery, `StockSourceModal`; `useAltTextAutoTrigger` mounted `StudioPanels.tsx:281`; Regenerate (`MediaTab.tsx:189-191`, `LibraryManager.tsx:988`) | — | `server/services/stock.service.ts`, `alt-text.service.ts` | REACH |
| Media server | 18 tRPC procedures; Blob token mint; favicon/OG upload | `server/trpc/routers/media.ts`, `upload.ts`; `packages/dashboard/app/api/asset-upload/route.ts`, `app/api/upload/[fileId]/route.ts` | — | Prisma `MediaAsset`, `MediaFolder`, `MediaAssetVersion` (`prisma/schema.prisma:1062-1137`) | CODE |
| Forms (editor) | Form + 15 field blocks + Contact Form; Fields list; After submit; type-block field bodies | Add › ELEMENTS › Forms (`sidebar/tabs/build/catalog/catalog.ts:189-316`); Behaviour `form-fields`/`form-settings` (`inspector/sections/registry/behaviour.tsx:101-119`); Style type block (`typeBlock/bodies/formBodies.tsx:52-148`); Attributes (`inspector/config/attributeFields.ts:68-99`) | Add/reorder fields, required, type, label(=placeholder), message/redirect, Send to, spam | `writeElement`; tRPC `forms.getBlock`/`updateBlock` (`FormAfterSubmitSection.tsx:98-99,147-148`) | REACH |
| Forms (publish/server) | Wire forms → public endpoint → DB → email/notification/webhook | `lib/publish-forms.ts:120-159,198-222` (called `packages/dashboard/app/api/workers/publish/[jobId]/route.ts:349-356`); `packages/dashboard/app/api/public/forms/[siteId]/[formBlockId]/route.ts:25-163`; `server/services/form-submission.service.ts:78-213`; `server/trpc/routers/forms.ts:21-101`; retention cron `app/api/cron/form-submission-purge/route.ts` | — | `email.service.ts:237-246`, `packages/dashboard/emails/form-submission.tsx` | CODE |
| Submissions inboxes | Editor: Settings › VISITORS › Form submissions. Dashboard: Site › Submissions | `sidebar/tabs/settings/constants.ts:135`, `SettingsTab.tsx:757`, `screens/FormsScreen.tsx`; `packages/dashboard/components/site-detail/tab-nav.tsx:12`, `submissions-panel.tsx`, `submission-drawer.tsx` | Read, spam, archive, delete, CSV export | tRPC `forms.*` | REACH |
| Dead form plumbing | Editor-side submit state machine; Formspree export | `engine/forms/FormHandler.ts` (constructed `Composer.ts:313`, no caller); `ExportEngine.ts:1054-1112` reads `data.formConfig` (no writer) | — | — | CODE, dead |
| CMS drawer | Collection list + Data rows | Rail `content` "CMS", shortcut **D** (`rail/tabsConfig.ts:231-245`); ⌘K "Open CMS" (`CommandPalette.tsx:126`), "Manage CMS records" (`defaultCommands.ts:685-690`), per-record rows (`CommandPalette.tsx:446-466`) → `TabRouter.tsx:253` | — | `useContentPanel` | REACH (not for viewers, `tabsConfig.ts:328-337`) |
| CMS workspace | Records / Fields / Dynamic pages / Settings / Import | Mounted when `!readOnlyView && leftOpen && railTab==="content"` (`StudioPanels.tsx:456`, `:929-937`); `ui:cms-open` (`:636-649`) | Create collection, add/edit records, fields, dynamic pages, CSV/JSON import | `editor/cms/*`, `cmsWorkspaceStore` | REACH |
| CMS engine/sync/server | IndexedDB `aquibra-cms`; bindings; repeater; persisted outbox; server tombstones; publish snapshot | `engine/cms/*`; `services/cmsSync.ts` (outbox `bk-cms-outbox-v1` `:116`), `services/syncRetryQueue.ts`; `shell/hooks/useCmsSync.ts`; `server/trpc/routers/cms.ts:56-145` (`collections.*`, `entries.*`, `dynamicPages`, `publishSnapshot`), `server/services/cms.service.ts` | — | Prisma `CmsCollection`/`CmsEntry` (`schema.prisma:447-492`) | CODE |
| CMS in Inspector | CMS binding (Static/From CMS, field, record pin, Unbind, Reconnect); Collection list (collection, limit) | `inspector/sections/CmsBindingSection.tsx`, `CollectionListSection.tsx`; capabilities `registry/behaviour.tsx:141-173` | — | `CMSBindingManager.bindToField`/`bindCollection` | REACH |
| Ecommerce | Product Card/Grid/Detail, Cart Button; product collection prompt; Stripe cart | `blocks/Ecommerce/*` registered (`blockRegistry.ts:184-188`) but in no Insert group/search (`catalog/groups.ts:44-46`, `useBuildTab.ts:273`); `editor/ecommerce/CollectionSetupModal.tsx` (mounted `StudioModals.tsx:204-214`, trigger `useComposerInit.ts:969-1008` unreachable); `StripeInjector` (`ExportEngine.ts:705-708`, no `config.stripe` writer, no `/api/checkout`) | — | `engine/cms/ProductCollectionService.ts` | **PLANNED / hidden** |
| Inspector shell | Tabs Style / Behaviour / Effects | `inspector/ProInspector.tsx:390`, `tabs/InspectorTabContent.tsx:75-84`, `config/sectionOrder.ts:15-54`, `sections/registry/_shared.tsx:46-50`, `config/typeBlocks.ts` | — | `capabilitiesFor` | REACH |
| Export / Preview | Single-file / ZIP / React export; publish via `exportAllPages`; Preview overlay | `engine/export/ExportEngine.ts`, `ReactExporter.ts`; `shell/exportPublishPages.ts:46`; Export modal (`StudioHeader.tsx:418`); `shell/PreviewOverlay.tsx` (html from `Composer.exportHTML` → `elements.toHTML`) | — | — | REACH |

There are no feature flags in Area F apart from ecommerce, which simply has no entry point. CMS, forms and media are always on.

---

## 2. Screen / flow inventory

**Add and insert**
- Add panel groups and rows: `BuildTab.tsx`, `catalog/catalog.ts`, `catalog/groups.ts`, `GroupSection.tsx`.
- Search results: `SearchResults`.
- Generate block: `GenerateBlockScreen`.
- Paste HTML modal: `PasteHtmlModal.tsx`. It inserts a pseudo-block `{id:"pasted-html"}` as a container (`useBlockInsertion.ts:63-71`).
- Template browser and apply: `sidebar/tabs/templates/*`.
- Insert paths: click (`useBlockInsertion.handleBlockClick`), drag (`dropOperations.handleBlockDrop`), "Replace with block…" (`takeReplaceTarget`), template apply.

**Catalogue matrix** (per F1)

| Block id | Element type | Palette placement | Type-block body | Export note |
|---|---|---|---|---|
| heading | heading | ELEMENTS "Heading" | Heading body: level, text style, edit text | escaped (F-01) |
| paragraph | paragraph | ELEMENTS "Text" | TextBody | escaped |
| text | text | **hidden** | TextBody | — |
| link | link | ELEMENTS | TextBody + Link section | ok |
| list | list | ELEMENTS | none | ok |
| button | button | ELEMENTS | ButtonBody + Link section | `<a><button>` (F-31) |
| icon, svg, lottie | same | ELEMENTS/Media | svg / svg / Lottie | — |
| divider, spacer | same | ELEMENTS | none | — |
| label | label | ELEMENTS/Basic, described as a "chip" | TextBody | semantic mismatch (form `<label>`) |
| progress, countdown | same | ELEMENTS and COMPONENTS | own bodies | countdown runtime only on publish |
| collection-list | collection-list | ELEMENTS | Collection behaviour | CMS |
| container, section, grid, columns, flex, stack | same | ELEMENTS/Layout | flex/grid bodies | — |
| row, column, columns3 | columns / container | **hidden** | — | — |
| card, table | card, table | ELEMENTS and COMPONENTS | none | — |
| 15 form fields + form | input / … / form | ELEMENTS/Forms | Input / Choice bodies | see forms |
| file | input | hidden by decision (`catalog.ts:313-315`) | — | — |
| contact-form | form | COMPONENTS only | — | — |
| image, video, audio, gallery | same | ELEMENTS/Media | image/video/audio; gallery **none** | — |
| video-embed | video-embed | "Embed" (copy promises Spotify/Figma) | VideoEmbed | only YouTube / Vimeo / Maps / Lottie (`parseEmbedUrl.ts:20`) |
| map-embed | map-embed | "Map" | MapEmbed | — |
| navbar, footer, cta | same | ELEMENTS/Navigation **and** BLOCKS | none | navbar has no mobile menu |
| hero, features, menu-grid, testimonials-section, contact | — | BLOCKS | none | the `contact` section contains no form (`blocks/Sections/Contact.tsx:13-17`) |
| theme-toggle | container | ELEMENTS/Interactive, only when dark mode = Auto | — | runtime |
| accordion | accordion | ELEMENTS and COMPONENTS | Accordion | runtime on publish only |
| tabs, modal | tabs / button | ELEMENTS and COMPONENTS | none | **no runtime anywhere (F-02)** |
| testimonials, pricing, social-icons, slider | — | ELEMENTS and COMPONENTS; a different BLOCKS row is also "Testimonials" | slider sections | slider runtime on publish only |
| product-card, product-grid, product-detail, cart-button | product-* | **hidden** | none (`typeBlock:"product"` reserved) | dead |

Union types with no block: `header`, `nav`, `list-item` (structural), `upload`, `custom`. `blocks/Navigation/index.ts` is an empty placeholder.

**Inline text**
- Edit session: `useCanvasInlineEdit.ts:66-207`.
- Toolbar: `RichTextEditor.tsx`.
- Inspector door: `EditTextRow.tsx`.

**Links**
- `LinkSection.tsx`.
- Toolbar link popover (inside `RichTextEditor`).
- Attributes › ID: the anchor target.

**Media**
- Drawer: `SlimLauncher.tsx` with header ⋯ "Select assets…", search, Manage assets, type filter, folder menu, `AssetCell` tiles, `MediaContextMenu`, `StorageQuotaBar`, replacement banner, `ReplacementUploadModal`.
- Drawer hub: `AssetDetailOverlay.tsx`, with alt + Generate, Used-in, versions + restore, Edit / Optimize / Replace, and an in-use delete guard.
- Drawer modals: `ConfirmDeleteModal`, `ConfirmFolderDeleteModal`, `ReplaceAcrossDialog`, `RenameAssetModal`, `IconBrowserOverlay`, `StockSourceModal`, `PickModePanel` + `UploadAssetModal`.
- Library: `LibraryManager.tsx` with top bar, `FolderTree`, `AssetGrid`, `AssetDetailsPanel` and the footer sync pill (`:1017-1022`). Its modals are listed in the imports at `:17-37`: ImportUrl, ImportResult, StockSaved, Rename, DownloadPrepared, CreateFolder, MoveAssets, MoveFailed, ReplaceResult, UploadFiles, UploadComplete, Versions, ApplyVersion, deletes, ReplaceAcross, context menu.
- Image editor: `ImageEditorModal.tsx` with `SaveFailedModal` (`:486`), `DiscardEditsModal`, and `image-editor/ImageEditorTabs.tsx`.
- `IconPickerModal.tsx`. `SiteFontsModal`.
- Inspector media bodies: `mediaBodies.tsx`, `embedBodies.tsx`, `SourceRow.tsx`.
- Canvas OS-file drop and tile drop: `useDropExecution.ts`, `mediaDrop.ts`.

**Forms**
- Form › Fields list/drill-in: `FormFieldsSection.tsx:158-227`.
- After submit: `FormAfterSubmitSection.tsx:168-222`.
- Field type bodies: `formBodies.tsx`.
- Form Attributes: Action / Method / Encoding.
- Editor inbox: `FormsScreen.tsx`.
- Dashboard inbox: `/dashboard/sites/[id]/feedback`, `submissions-panel.tsx`, `submission-drawer.tsx`.
- Visitor 303 flow and error/thanks pages: `route.ts:17-23`.

**CMS**
- Drawer root (loading / error / empty / list): `ContentTab.tsx:160-220`, `ContentViews.tsx:134-273`.
- Workspace no-collection state: `CmsWorkspace.tsx:178-207`.
- New collection modal and name-clash dialog: `CMSCollectionSetupModal.tsx:243-415`.
- Records tab: no fields / no records / table / search / no results / pager (`CmsWorkspace.tsx:250-307`, `RecordsTable.tsx`).
- Record sheet: new, edit, conflict, gone, discard-confirm, typed delete, template preview (`RecordSheet.tsx`, `RecordTemplatePreviewDialog.tsx`, `RecordPreview.tsx`).
- Fields tab, `FieldInspector.tsx:88-281`, `AddFieldDialog.tsx:84-224`, `DeleteFieldDialog.tsx`, `OptionsEditor.tsx`.
- `DynamicPagesPane.tsx`. `CollectionSettingsPane.tsx` + `TypedDeleteDialog.tsx`.
- `CsvImportDialog.tsx` (upload → mapping → result). JSON import strip: `useImportRecords.tsx:77-113`.
- Inspector CMS binding (normal / source missing / reconnect): `CmsBindingSection.tsx:275-330`. Collection list: `CollectionListSection.tsx:62-100`.
- Shell sync toasts: `useCmsSync.ts`.

**Ecommerce:** no reachable screens.

---

## 3. Control traces

| # | Control | UI → state | Validation | Persistence | Rendered result | Break |
|---|---|---|---|---|---|---|
| T1 | Add row click | `useBuildTab.ts:207-219` → `handleBlockClick` → `beginTransaction("Added X")` → smart placement (selected container → section slot → sibling → root; text leaf never the target, `useBlockInsertion.ts:112-116`) → `insertBlock` → select, flash, Undo toast; media types open Assets + `element:needs-asset` (`:181-191`) | `canNestElement` | `endTransaction` → `PROJECT_CHANGED` → autosave → tRPC `sites.saveProject` (EDITOR, `server/trpc/routers/sites.ts:364-376`; server sanitize `sites.service.ts:1047`) | canvas / preview / export | none |
| T2 | Add row drag | `handleDragStart` adds to Recent at start (`useBuildTab.ts:194-198`) → `handleBlockDrop` transaction `"insert-block-drop"` → `findValidDropTargetWithFallback` (`shared/utils/dragDrop/dropTarget.ts:48-188`) → `insertBlock` | `canNestElement` | autosave | — | **No text-leaf guard (F-07)**; no asset-picker trigger; history label "insert-block-drop"; silent if `insertBlock` returns undefined |
| T3 | Inline edit commit | dblclick → `beginEdit` (`useCanvasInlineEdit.ts:66-104`; refuses nested ids; `canWrite`) → Enter/blur → `sanitizeHTML(el.innerHTML)` → transaction `"inline-edit"` → `Element.setContent` (`Element.ts:146-153`; records an instance override) [lead-verified `:160-172`] | DOMPurify | autosave | Canvas and Preview mount `content` as raw HTML (`shared/utils/html/generation.ts:160`, `Canvas.tsx:802`). **Export/publish escapes it**: `ExportEngine.renderContent` (`:1139-1150`) escapes unless `contentFormat==="html"` or (container + tag-shaped). Nothing in the editor ever sets `contentFormat` (grep: only the type at `shared/types/element.ts:62` and its readers) [lead-verified] | **F-01: the published result differs from canvas/preview** |
| T4 | Toolbar command | `RichTextEditor.onCommand` → `handleInlineCommand` (`useCanvasInlineCommands.ts:29-178`) mutates the live DOM; persisted at T3 | `isSafeUrl` for links | — | same as T3 | `removeFormat` has no case (F-24); `activeStyles` never passed (`CanvasOverlayGroup.tsx:324`) |
| T5 | Link › URL | `handleUrlChange` (bare domain → `https://`) → `writeElement(…,"link-change")` → `setAttribute("href")` | `https?://`, per keystroke | autosave | canvas `href` (`generation.ts:89-99` filters schemes); export `resolveHref` + container `display:contents <a>` wrapper unless it holds interactive descendants (`ExportHelpers.ts:467-478`) | stale state after undo / selection switch (F-22) |
| T6 | Link › Page | `href="#page:<id>"` | — | autosave | export resolves by page id using the slug at export time (`ExportEngine.ts:183-196,971-974`); a deleted page becomes `index.html` silently | Preview: `PreviewOverlay.tsx:137` returns on `#`, so page links are dead in Preview (F-23) |
| T7 | Upload (drawer/library/drop) | `MediaManager.uploadFile` (`:998`): `validateFile` (MIME + per-type size: image 10MB, video 100MB, audio 50MB, svg 1MB, `shared/constants/media.ts:19-34`); SVG sniff + DOMPurify (`:1050-1093`); non-SVG images converted to WebP (`:1096-1111`); IndexedDB first (`:1146`); `uploadAndCreate`: `media.uploadPrefix` → Blob `upload()` → `/api/asset-upload` (session, prefix, quota, plan cap, `assertMediaWrite`, folder owner) → `media.createAsset` (idempotent) → `replaceAssetId` | client + token route | IndexedDB, then Blob, then Postgres. **No confirm step; registration failure orphans the Blob** | tile / element | RT-01 (F-03); plan caps not client-aware (F-17); audio never syncs (F-16); GIF loses animation (F-18) |
| T8 | Drawer tile click | `useMediaState.insertToCanvas` (`:150-280`): with a selected image/video → `mediaOps.replaceMedia(…,{alt})` (`:220`), else `insertMediaAt(path:"click")` (`:249`) | none on replace | autosave | element | **Replace skips the lock (F-12)**; stock hotlinks + orphan copy (F-28) |
| T9 | Tile drag to canvas | `dropMedia` (`mediaDrop.ts`) replace or insert | lock on replace | autosave | absolute `left/top` on page root (`ElementManager.ts:500-519`) | alt never sent (F-10); coordinates unscaled at zoom ≠ 100% (F-11); drop indicator ignored |
| T10 | Inspector Image › Replace | `SourceRow` → `requestAssetPick` → `applyPick` → `writableElements` + `writeSrc` in one transaction | lock | autosave | — | keeps the **old** alt; no device-only warning |
| T11 | Alt: asset (drawer hub, blur) / asset (library rail, **every keystroke**) / element (Inspector) | asset: `MediaManager.updateAsset` → IndexedDB → `remoteSync.updateAsset` (result ignored) → `MEDIA_UPDATED` → `mediaOps.followAssetAlt` (`Composer.ts:647-656`, `MediaCommandLayer.ts:280-301`) rewrites unlocked placements whose alt is empty or equals the previous asset alt; element: `writeAttribute("alt")`, empty → attribute removed (`attributeWriter.ts:52-67,161-167`) | — | IndexedDB / tRPC best-effort / page autosave | `<img alt>` | WS-01; per-keystroke races (F-20); decorative `alt=""` impossible and overwritten (F-19) |
| T12 | Delete asset / folder | single: `deleteWithGrace` clears src on all loaded pages, 8s Undo, then server hard delete + Blob `del()`; folder with contents: `deleteAsset` per asset (`useLibraryState.ts:315-324`) | — | — | — | folder path: no grace, no undo, no src clearing (F-15); no published-usage check |
| T13 | Image editor save / version restore | save → new hidden version asset + `createAssetVersion`; Apply → `replaceAcross` (no lock); restore → `restoreAssetVersion` → `onUpdate({src})`, but `useLibraryState.updateItem` forwards only name / altText / tags (`:353-362`) | — | — | — | restore is a local no-op and likely P2002 on the server (F-14) |
| T14 | Form field Required / "Label" / Type / + Add field | `writeElement` → `setAttribute` (`FormFieldsSection.tsx:66-142`) | none | autosave | `required` in HTML, enforced by the browser only | "Label" writes `placeholder` (F-34); Type on `<select>` / Long text loses data (F-36, F-37); duplicate names (F-38) |
| T15 | Choice body (radio/checkbox) | `writeInner` Name / Checked / Required (`formBodies.tsx:106-143`) | — | — | — | **no Value control (F-05)** |
| T16 | Select › Options | `setContent("<option>…")` (`PropertyField.tsx:164-172`) while parsed options are child elements (`HTMLParser.ts:254-266`) | — | — | `content + childrenHTML` (`ElementSerialization.ts:71-80`) | likely duplicate options (F-35) |
| T17 | After submit (message / redirect / Send to / spam) | `forms.updateBlock` (EDITOR; ADMIN when `notifyEmail` changes, `server/trpc/routers/forms.ts:67-89`) | Zod `updateFormBlockSchema` (`packages/shared/schemas/forms.ts:50-68`) | Postgres `form_blocks` (new row `isActive:false`) | redirect and Send to apply at submit immediately; message and honeypot are **baked at the next publish** (`publish-forms.ts:133-141`) | panel says "Saved to your site straight away" (`FormAfterSubmitSection.tsx:216-218`); clearing the redirect never saves (F-39) |
| T18 | Form Attributes Method / Encoding / Action | `writeAttribute` | none | autosave | `wireForms` skips forms with `action=` and appends ` action=… method="POST"` after any existing `method` (`lib/publish-forms.ts:128-142`) [lead-verified] | GET → 405, multipart/plain → "Invalid JSON" 400 (F-04); custom action silently bypasses Buildrick (F-33) |
| T19 | Visitor submit | URL-encoded POST → rate limit 10/min (`route.ts:8-9,40-54`), 256KB, Zod → `submitForm` (honeypot, plan cap per site, store, email `notifyEmail` + OWNER, in-app notification, webhook) | **server never checks required fields** (`form-submission.service.ts:125-127`) | `form_submissions` (`sourceUrl`/`deviceInfo` never written) | 303 back + script swap, or redirect | — |
| T20 | CMS create collection | modal → `collectionSchemaFrom` (`fieldTypes.ts:68-98`) → `CollectionManager.createCollection` (`:126-154`, slug = `slugify(name)` `:140`) → IndexedDB → `CMS_COLLECTION_CREATED` → outbox → `cms.collections.upsert` | server `cmsFieldsSchema`, pattern, home refusal, cap 100, P2002 → `CONFLICT SLUG_TAKEN:<id>` (`cms.service.ts:213-236`) | IndexedDB, outbox (localStorage), Postgres | workspace opens | slug clash silently merges into the other collection (F-08) |
| T21 | CMS record save | `RecordSheet.save` → `useContentPanel.saveRecord` → `createContentItem`/`updateContentItem`; `assertPublishable` only when published (`CollectionManager.ts:396,545-560`) → `syncEntryUpsert` (`cmsSync.ts:881-954`) | shared `cmsValueError` + `cmsRecordClash`; server sanitize, 200k cap, `assertFresh` + `updateMany` precondition (`cms.service.ts:380-417`) | outbox → Postgres; `touchCmsEdited` | canvas via binding listeners (`CMSBindingManager.ts:113-118`); publish reads server PUBLISHED rows (`exportPublishPages.ts:87-90`) | CONFLICT → Keep mine / Use theirs; INVALID → reason; GONE → toast; offline → "Saved on this device only…" |
| T22 | CMS binding | Inspector Field → `bindToField` (`CmsBindingSection.tsx:198-213`, `CMSBindingManager.ts:172-203`) | allowlist; one property per type (image → src, link → href, else content `:50-54`) | project `cmsBindings.field` | canvas `applyBinding` writes content/trait **outside history** (`:259-299`); export `CMSExportResolver.resolveStatic` (`:96-150`) or `{{bk:slug}}` on template pages → server `fillCmsRecordTokens` + `sanitizeGeneratedPageHtml` | no alt/title/fallback UI |
| T23 | Collection list | `CollectionListSection` → `bindCollectionList` in a transaction (`:52-60`) → `bindCollection` (`:327-344`) `{limit, status:"published"}` | — | project | canvas expands **all statuses** (`RepeaterRenderer.ts:159`); export published only | **no sort / filter / offset at any layer** (binding type `:55-72`, renderer `:157-163`); order = `updatedAt desc` (F-09); nested lists likely wrong (F-46); rebinds per keystroke (F-49) |
| T24 | Dynamic pages | pane → `updateCollection({pageSlugPattern, pageTemplatePath, pageSeo*})` | shared `cmsPatternError`; `index.html` refusal (`cms.service.ts:240-242`) | Postgres | at **site publish only**: `appendDynamicPagesToPublish` (`:1033`) drops the template page and writes `<slug>/index.html` per PUBLISHED entry (`:931-932`) | duplicate/empty paths not refused (F-44) |
| T25 | CSV / JSON import | CSV: `importCsvPreview` (300KB / 500 rows / 100 cols) → mapping → `importCsv` → `upsertEntry` per row as DRAFT → `hydrateCmsFromServer`. JSON: client `createContentItem` per row, no cap | none (drafts) | Postgres / outbox | — | everything stored as strings (F-43); no bulk publish |
| T26 | Delete record → Undo | instant delete → server soft delete (`cms.service.ts:439-447`); Undo → `saveRecord(collection.id, null, …)` (`CmsWorkspace.tsx:486-488`) | — | — | — | **new id**, so pins and references break (F-41) |
| T27 | Product block | not insertable from UI; even if inserted, `data-bind` has no consumer (`DataBindResolver` barrel-only) | — | — | — | dead (PLANNED) |

---

## 4. State coverage

| State | Add panel | Inline text | Link section | Assets drawer | Asset library | Image editor | Form Fields / After submit | Form inboxes | CMS drawer / workspace | Record sheet | CMS Fields / Dyn. pages | CMS binding |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Empty | search empty + clear | **no placeholder; emptied heading collapses to 0 height** (`Canvas.css:120-161` covers containers only) | None | `med-no-project` (`MediaTab.tsx:57`), empty grid | library + folder empty (`AssetGrid.tsx:987-1046`) | – | zero fields shows only "+ Add field" | "No forms yet." (`FormsScreen.tsx:249-259`), empty inbox (`:297-301`) | ✓ (`ContentViews.tsx:159`; `CmsWorkspace.tsx:201,250,274`) | n/a | "Nothing is bound" (`FieldInspector.tsx:239`), "No pattern set" (`DynamicPagesPane.tsx:105`) | "No collections yet" (`:233`) |
| Loading | **none for FROM LIBRARY** | – | – | search searching/failed (`useLibraryState.ts:436-458`) | upload rows | – | After submit "Loading…" (`:172-173`) | LoadCard (`FormsScreen.tsx:235-246`) | skeleton **only when 0 collections** (`ContentTab.tsx:161`); records load silently | ✗ | ✗ | "…" (`:311`) |
| Hover / focus | tooltip, Enter/Space (`GroupSection.tsx:163,288-292`) | – | – | focus ring (`AssetCell.tsx:123-124`) | yes | – | row hover + focus ring (`FormFieldsSection.tsx:82-85`) | buttons | rows | inputs | – | – |
| Selected | – | editing | – | ring | select mode | – | drill-in | expanded (`:328-333`) | `aria-current` (`ContentViews.tsx:248`) | – | row | – |
| Disabled | rows never disabled for the selection (`ElEntry.disabled` unused) | – | – | viewer `aria-disabled` + reason (`useMediaWriteAccess.ts`) | viewer gate (`LibraryManager.tsx:108-114`) | – | lock gate; **Send to not pre-gated for EDITOR vs ADMIN** | no role-based disabling for viewers | "+ Add record" without fields (`:222`); Sheets/Airtable "Coming soon" (`:392-397`) | Save disabled (`:710`) | Key/Type locked when used (`FieldInspector.tsx:153,169`) | – |
| Read-only | – | double-click withheld; `EditTextRow` `aria-disabled` | lock refusal | viewer gate | viewer gate; **library alt textarea not gated (not verified)** | – | `readOnly` reaches rows | – | tab blocked for viewers; workspace not mounted in view mode | – | – | – |
| Validation error | nesting-refused toast (`useBlockInsertion.ts:213-224`) | – | per-field errors, per keystroke (`LinkSection.tsx:308-330`) | rejected row with limit (`MediaManager.ts:1014-1019`) | ImportResult failed | – | **none** on fields; Zod message on After submit (`:157-160`) | – | "Name required" (`RecordsTable.tsx:196-200`) | live + server reason (`:380-390`) | key / pattern errors | "No fields fit here" |
| Saving | – | **no indicator** | – | progress 25→99 | upload rows | – | "Saving…" (`:213-214`) | Exporting… | JSON import progress | `aria-busy` | `saving` | – |
| Saved | Undo toast | – | – | toast | UploadComplete | Saved → Done | **no "Saved"** | – | toasts | "Record saved" (`:264-271`) | "Dynamic pages saved" | – |
| Unsaved | – | – | – | – | – | – | **REDIRECT with empty URL held optimistically, no indicator** (`:138`) | – | – | leave guard + dirty registry (`:206-260`) | **✗ field edits commit on blur; no leave guard on Dynamic pages** | – |
| Failure | "Editor not ready", "No active page" toasts | lock toast | – | upload error row; **local-only toast only, no per-tile marker or retry** | MoveFailed (local errors only); sync pill not actionable (`:1017-1022`) | SaveFailed + Retry (`:486`) | revert + error; **load error has no retry** | error + Retry (`:289-296`) | error **only when 0 collections**; no header sync indicator | OFFLINE line (`:102,318`) | ✗ | ✗ |
| Conflict | – | – | – | **none** | **none** (`importServerAssets` skips held ids) | – | **none (last write wins)** | – | shell toast | inline Keep mine / Use theirs (`:612-640`) | collection conflict via toast | – |
| Recovery | Undo | Esc cancel | – | grace Undo (single delete only) | – | Discard modal | – | – | outbox replay on open | gone snapshot (`CmsWorkspace.tsx:94-104`; `RecordSheet.tsx:651`) | – | "Source missing" + Reconnect (`:284-298`) |

---

## 5. Ownership rows

| Property / action | Current editing location(s) | Value owner | Scope | Local / inherited / shared / bound / overridden | Who may change (cite) | Side effects | How source is shown | Reset / unlink | Applied vs saved vs published |
|---|---|---|---|---|---|---|---|---|---|
| Element text (`content`) | canvas inline edit; toolbar; CMS bind (`CMSBindingManager.ts:293`); "Add to site navigation" (page name) | `ElementData.content` | element; instance override inside components (`Element.ts:150`) | local / bound / overridden | client lock gate + read-only canvas; server EDITOR (`server/trpc/routers/sites.ts:368`) | `ELEMENT_EDIT_INLINE` | **not shown in Inspector** (by design) | Undo only | **applied (HTML on canvas/preview) ≠ published (escaped text)** (F-01) |
| Heading level | Style › type block › Level | `tagName` | element | local | lock gate | — | ButtonGroup | Undo | consistent |
| Link destination | Behaviour › Link; toolbar inline `<a>` (not editable in the Link section) | `attributes.href` / content markup | element | local | `writeElement` | toolbar forces `target=_blank` | select + field | Link to = None | inline links not published as links (F-01); a deleted page silently becomes `index.html` |
| Open in new tab / Rel | Link section only | `target`, `rel` | element | local | `writeElement` | adds/removes only its own rel tokens | checkbox | untick | container: moved onto wrapper `<a>` |
| Anchor target ID | Behaviour › Attributes › ID | `attributes.id` | element | local | not verified | — | field | clear | uniqueness not validated (not verified) |
| **Asset alt** | drawer hub (blur), library rail (per keystroke), AI auto/regenerate | `MediaAsset.altText` (IndexedDB + server) | asset, **per user** (`media.service.ts:153`) | shared default | server EDITOR+ (`assertMediaWrite`) | `followAssetAlt` rewrites non-overridden placements, in one transaction | "AI" chip (`AssetDetailsPanel.tsx:785-795`) | Regenerate | IndexedDB at once; server best-effort (WS-01); placements saved on autosave |
| **Element alt** | Inspector Image › Alt; seeded at insert; `replaceMedia` swaps it; inspector Replace keeps it; drag-replace strips it | `<img alt>` | element | overridden once hand-edited | lock gate | — | **asset alt not shown; no "use asset alt"** | clearing removes the attribute; `alt=""` impossible | as stored |
| Which alt wins | — | element always wins at render; asset seeds it and follows non-overridden placements | — | **ambiguous: `""` counts as not overridden** | — | silent overwrite | not shown | — | — |
| Element src | insert, drop, pick, `replaceMedia`, `replaceAcross`, version apply, delete (clears) | `<img src>` / background-image | element | linked to the asset **by URL string only** | lock on drop / pick / inspector; **not** on click-replace, replace-across, apply version | — | SourceRow thumbnail | — | `blob:` stripped on save/load; **reaches publish on the non-CMS path (F-21)** |
| Asset name / folder / tags | rename modal, drag-to-folder, Move modal, library rail | `MediaAsset.name` / `folderId` / `userMetadata` (whole JSON replaced) | per user; folder not checked against site | local + best-effort mirror | EDITOR+ server | — | card / tree | — | local at once; server may silently refuse (WS-01) |
| **Library visibility** | — | `listAssets` where `userId` (`server/services/media.service.ts:153-155`) [lead-verified] | **user, not site** | — | — | teammates don't see uploads; the empty state says "one library for the whole site" (`AssetGrid.tsx:1031`) | — | — | — |
| Field `required` | Form › Fields; Input body; Choice body | element attribute | element | local | lock gate | none server-side | readers disagree on `required="false"` (`FormFieldsSection.tsx:58` vs `blockRows.tsx:18-19`) | uncheck | browser-only; **never server-enforced** |
| Field label / placeholder | Fields "Label" (= `placeholder`); type block "Placeholder"; `<label>` on canvas | attribute vs separate element | element | local | lock gate | — | summary falls back to placeholder → name → aria-label | empty | **same value under two names** |
| Field name (submission key) | type block Name only (absent from Fields drill-in) | attribute | element | local | lock gate | clobbering names stripped at publish (`PropertyField.tsx:58-67`) | warning row | empty → nothing submitted | publish |
| Radio/checkbox `value` | **nowhere** | — | — | — | — | — | — | — | — |
| After-submit action / redirect | After submit | `FormBlock.successAction/redirectUrl` (DB) | site + element id | server row, **outside undo and drafts** | EDITOR+ (`routers/forms.ts:70`) | — | no live-vs-next-publish hint | "Show message" | **live at submit immediately, before publish** |
| Success message / spam protection | After submit | `FormBlock.successMessage/spamProtection` | same | server | EDITOR+ | honeypot markup | — | — | **next publish only**, while the copy claims "straight away" |
| Notification recipient | After submit › Send to (one address) | `FormBlock.notifyEmail` + **OWNER always added** (`form-submission.service.ts:146-163`) | same | server | **ADMIN** (`routers/forms.ts:81-87`), not pre-gated in UI | email per submission | owner inclusion not shown | empty | immediate |
| Form action / method / encoding | Attributes | attribute | element | local; **overrides Buildrick wiring** | lock gate | F-04 / F-33 | none (After submit still looks active) | empty | publish |
| Form display name | only `aria-label` | → `FormBlock.name` at **first** publish only (`service:368-375`) | — | — | — | — | inbox column | — | frozen at first publish |
| Submission read/spam/archive/delete | editor inbox (one-way), dashboard drawer (toggles) | `FormSubmission` | site | server | EDITOR+ (`routers/forms.ts:44,56`); **IP readable by VIEWER via export JSON** (`:91-99`) | — | pill | dashboard only | immediate |
| Submission cap | plan | `PLAN_LIMITS[plan].formSubmissions` | **enforced per site** (`service:116-123`), **shown per workspace** (`billing.service.ts:28-30`) | — | billing | visitor gets 402, owner not told | Billing meter | — | — |
| Collection name/slug | Settings pane, modal | `CmsCollection` + IndexedDB copy | site | local + mirror | EDITOR (`server/trpc/routers/cms.ts:47-54`) | slug clash → silent merge (F-08) | fields | none | no publish effect |
| Field type / key | FieldInspector (locked when used) | `fields[]` JSON | collection | local | EDITOR | type: **no conversion**; key: rewrites records, `pageSlugPattern`, `displayField`, **not SEO patterns** (`CollectionManager.ts:273-298`) | select / mono input | none | per-record re-mirror |
| Field validation (required/min/max) | FieldInspector, AddField | `fields[].validation` | collection | local | EDITOR | enforced only on PUBLISHED writes | "*" | chip "No" | published records not re-validated |
| Field help / default / placeholder | **no UI** | `CMSField.*` (`shared/types/cms.ts:23-37`) | — | — | — | `fieldDefault` reads it | — | — | model only |
| Record status | RecordSheet switch | `CmsEntry.status` DRAFT\|PUBLISHED (client also has `"archived"`, unreachable) | record | local | EDITOR | publish validation + clash | "· Draft" suffix | switch off | "Published" record ≠ live until the next **site** publish |
| Element CMS binding / record pin | Inspector CMS binding | `cmsBindings.field[elementId]` in the project | element | **bound** | `canWrite` + EDITOR save | writes content **outside undo** | Source = From CMS + preview line | Unbind keeps current text (`:214-219`) | canvas: first published; export: pinned/newest published, or `{{bk:x}}` |
| Collection list collection / limit | Inspector Collection | `cmsBindings.collection[elementId]` | element | bound | `canWrite` | retargets placeholders | select + "Show items" | "None" | **canvas shows drafts, publish shows published** |
| List sort / filter / offset | **none** | implicit `updatedAt desc` (`CollectionStorage.ts:198`) | — | — | — | any edit reorders the live list | not shown | — | — |
| Dynamic page pattern / template | Dynamic pages pane; modal toggle | `pageSlugPattern`, `pageTemplatePath` (by **file name**) | collection | local | EDITOR | template followed on page rename (`CollectionManager.ts:200-216`) | URL preview list | clear | generated at site publish only |
| Product price | ProductCard `data-bind="price"` text | canvas text / CMS `price` | — | binding never resolved | — | Stripe script would read the price from the DOM (client-supplied) | — | — | not exported (dead) |

**Flags from this table**
- Competing surfaces:
  - field label/placeholder (three places);
  - field required (three readers);
  - alt (asset vs element, four write paths with different alt policy);
  - inline link vs Link section.
- Silent global effects:
  - `followAssetAlt`;
  - asset delete clearing src site-wide;
  - folder delete leaving dead srcs;
  - the forced owner email.
- Applied ≠ published:
  - F-01 text;
  - collection list drafts;
  - After-submit message vs redirect timing.
- Misleading editability: Fields "Label", and After submit while a custom Action is set.

---

## 6. Gap candidates vs Webflow (the Webflow column is from memory; the doc agent should confirm)

| Area | Buildrik evidence | Webflow capability (memory) | Classification | User impact | Suggested change | P |
|---|---|---|---|---|---|---|
| Rich text fidelity | F-01 | Text and Rich Text publish exactly as designed | Inconsistent interaction (data-model ambiguity) | Live site shows `&amp;`, `<strong>` and template markup as text | One encoding: set `contentFormat:"html"` on inline commit and HTML import, or have `renderContent` sanitize text types instead of escaping | P0 |
| Rich Text element | No rich-text block; Enter commits (`useCanvasInlineEdit.ts:205-207`) | Rich Text block: paragraphs, H1–H6, lists, quotes, inline images, CMS rich text | Missing capability | No long-form authoring | Rich-text element with block-level Enter | P1 |
| Tabs / Lightbox / Dropdown / Navbar menu | Tabs and Modal have no runtime (F-02); Navbar has no mobile menu | Native interactive components with runtimes | Partial implementation | Dead widgets on live sites | Add runtimes next to `lib/publish-widgets.ts`, or hide the rows | P0/P1 |
| Inline text links | Toolbar is URL-only and always new tab | Link popover: page / section / email / phone / asset | Partial + Ownership ambiguity | Can't link words to pages | Reuse the Link section model in the popover | P1 |
| Link targets | No section picker, asset link, broken-link check; deleted page → `index.html`; image/heading not linkable | Page + section picker, asset link, Link Block wraps anything | Missing capability | Brittle anchors, misdirected navigation | Anchor list per target page; pre-publish unresolved-link issue; allow link on image | P2 |
| Shared site asset library | `listAssets` scoped by `userId` | Assets are per site, shared by collaborators | Ownership ambiguity | Teammates can't see uploads | Site-scoped read with a role check | P0 |
| Upload durability / asset identity | RT-01; URL-only linkage | Atomic upload; references survive | Missing state / Partial | Placed images lost | Keep `uploaded.url` and retry only `createAsset`; `data-asset-id` on elements | P0 |
| Responsive images | No srcset / sizes / width / height / decoding on export | Automatic responsive variants + lazy loading | Missing capability | Slow pages, layout shift | Variants at upload or publish; emit dimensions | P1 |
| Alt text model | No decorative toggle; asset alt not shown on the element; `""` overwritten | "Decorative" toggle; per-image alt with asset default | Missing capability + Ownership ambiguity | a11y conflicts, silent changes | Decorative toggle; "Use asset alt" vs custom | P1 |
| Replace file keeping identity / versions | Versions are sibling assets; restore broken | Replace image swaps the file under the same asset | Partial implementation | Restore does nothing | Server "replace file" keeping id | P1 |
| Media drop placement | Absolute on root, unscaled coordinates | In-flow at the drop indicator | Inconsistent interaction | Overlapping images | Use resolver target/position | P1 |
| Form choice values / options | No radio/checkbox value; select options duplicate | Choice value + option list editor | Missing capability / Partial | Radio answers lost | Value row; edit `<option>` children | P0 / P1 |
| Form success / error states | Full-page round trip; unbranded error page on app domain | Editable Success / Error state blocks, AJAX submit | Missing state | Visitor leaves the site on error | AJAX + designable states | P1 |
| Form server validation | Required not enforced server-side | Server validates | Missing capability | Junk submissions | Validate against the field list | P1 |
| Form notifications | One address + forced owner; no reply-to | Multiple recipients, reply-to, subject | Partial | Can't reply directly | Recipients list, reply-to | P2 |
| Spam | Honeypot + IP rate limit; `isSpam` never auto-set | reCAPTCHA option + filtering | Partial | Bot spam | Turnstile option (already used for login) | P2 |
| File upload field | `file` still offered in Input type; urlencoded only | File upload field (paid plans) | Inconsistent | Filename-only "uploads" | Remove until supported | P2 |
| CMS field types | UI offers 10 (`editor/cms/fieldTypes.ts:17`); shared/server accept 16 (`packages/shared/schemas/cms.ts:19-36`) | 15+ incl. link, email, phone, color, option, file, multi-image, video, multi-ref | Implemented but undiscoverable (6) + Missing (multi-ref, multi-image, video, phone) | No URL/email/option fields | Expose the 6; add multi-reference | P1 |
| Collection list sort / filter / offset | Limit only; engine `queryContent` supports more but nobody passes it (`CollectionManager.ts:475-513`) | Sort, filter, limit, offset; conditional visibility | Missing capability | Live list reorders on every edit | Add to binding + UI | P0 |
| Nested lists / filter by current item | Likely broken (F-46); no parent filter | Nested lists filtered by reference | Partial | No related-posts lists | Fix the expander; add a parent filter | P2 |
| Binding properties | One property per element; no alt/title/fallback UI; no conditional visibility | Bind any field, conditional visibility | Missing / undiscoverable | Bound images lack alt; empty fields can't be hidden | Alt/Title/Fallback rows; field-driven visibility | P1 |
| Record lifecycle / bulk | draft/published only; no archive, schedule, duplicate, bulk | Draft / Published / Archived / Scheduled, bulk actions | Missing capability | 500-row import → 500 manual publishes | Bulk publish first, then schedule | P0 (bulk) / P2 |
| CMS import / export | CSV stores strings; no export; Sheets/Airtable "Coming soon" | CSV import with mapping + export | Partial | Typed data corrupted, lock-in | Coerce per type; CSV export | P1 / P2 |
| CMS empty-state IA | UX-15/16/17, IA-11 confirmed | One clear start | Inconsistent interaction | First-run confusion | One centred CTA, one mental model, honest stepper | P1 |
| Ecommerce | Hidden, no binding/cart/checkout | Full ecommerce | Missing capability (PLANNED) | none today | Keep hidden; remove dead paths or label them | P3 (product call) |
| Settings vs Style split | Content (alt, src, input name/required, button type, countdown date) sits in the **Style** tab "type" block; Link / ID / Form / CMS in Behaviour; Fit and Text style also in the type block | Settings panel vs Style panel | Ownership ambiguity | Users hunt across tabs | Dedicated Settings/Content tab | P2 |
| Add-panel taxonomy | 13/14 BUILT-IN COMPONENTS duplicate ELEMENTS rows; Navbar/Footer/CTA in two groups; two "Testimonials" | One catalogue entry per element | Inconsistent interaction | Confusion | Dedupe | P2 |
| Embed / custom code | "Embed" promises Spotify/Figma; no `custom` code element | Code Embed + media embeds | Mislabelled + Missing | Failed expectations | Fix copy; sandboxed HTML embed | P2 |

---

## 7. Exists in code but hidden or poorly exposed

1. **CMS field types not offered.** Six already-validated types (datetime, select, file, color, url, email): accepted by `packages/shared/schemas/cms.ts:19-36` and rendered by `RecordSheet.tsx:468-481`, but missing from `editor/cms/fieldTypes.ts:17`.
2. **CMS field metadata with no editor.** `CMSField.defaultValue/helpText/placeholder` (`shared/types/cms.ts:28-35`).
3. **CMS query options nobody passes.** `CollectionManager.queryContent` filter/sort/offset (`:475-513`).
4. **CMS binding options with no UI.** Binding `fallback` (export + `findEmptyBindings` support it; the inspector passes `undefined`, `CmsBindingSection.tsx:207`). Alt/title binding properties.
5. **`"archived"` record status.** Typed but unreachable, and collapses to DRAFT on mirror (`cmsSync.ts:902`).
6. **CMS code with no caller.** `RepeaterRenderer.expandRepeaters` (`:98-128`), `DataBindResolver` (barrel-only), and `CMSExportResolver` template mode (`:152-215`, no UI caller found). `cms.dynamicPages` query: no editor caller found; dashboard use not verified.
7. **Hidden blocks.** `text`, `row`, `column`, `columns3`, `file` (intentional), and the four ecommerce blocks. Also `CollectionSetupModal` + `ProductCollectionService` (`useComposerInit.ts:961-1008`) and `StripeInjector`.
8. **S6 components-catalog.** 27 types, with `handleCatalogDrop` (`dropOperations.tsx:575+`) but no UI drag source.
9. **`RichTextEditor` `activeStyles`.** Implemented, never supplied.
10. **Media drag helpers.** `setMediaDragData` / `readMediaDragData` (`data/dragPayload.ts:40,55`) are the only alt-carrying drag helpers, and have no callers.
11. **Dead `ElementManager.insertMediaAt` branch.** The `targetElementId` branch (`:466-483`) has had no production caller since 2cb6d3a43.
12. **Image editor canvas door.** `StudioPanels.handleEditMedia` → `<Canvas onOpenImageEditor>` (`StudioPanels.tsx:773-790,896`) is never consumed.
13. **Media helpers and labels with no caller or provider.** `MediaCommandLayer.isInUse` (`:391`), `MediaOptimizer.previewCompression` and `ImageProcessor` have no callers. The Pixabay label (`StockSourceModal.tsx:189`) has no server provider.
14. **Unreachable `MoveFailedModal`.** Server failures never reach it (WS-01).
15. **Icon picker writes ignored.** It writes `data-icon-*` that nothing renders: "Change icon" is a no-op (`attributeWriter.ts:173-198`).
16. **Image Gallery has no inspector** (`elementCapabilities.ts:174`).
17. **Dead form plumbing.** `FormHandler`, `services/FormSubmissionService`, `shared/forms/FormStateOverlay`, the Formspree export (`ExportEngine.ts:1054-1112`) and the `FormBlock.webhookUrl` column all have no writer.
18. **Form name only via `aria-label`.** The aria editor in Attributes is the only way to name a form.
19. **Search row promises a missing picker.** The Settings search row says "Select a form to view its submissions inbox." (`searchIndex.ts:144`), but the screen has no form picker.

---

## 8. Preserve

- **One insert door.** `insertBlock` + `ELEMENT_INSERTED`, with sanitize on the HTML branch (`blockRegistry.ts:235-275,369-389`). Click-insert smart placement, the text-leaf guard and locked-replace refusal (`useBlockInsertion.ts:84-151`). One transaction per insert, with a named history row and an Undo toast. `applyTypeDefaults` skips site-owned font and colour.
- **Inline edit.** One transaction, sanitize on commit, lock gate, and no `setContent` mid-session.
- **Export correctness fixes.** The L1-002 fix in both ExportEngine writers. `resolveHref` by page id, so slug renames carry through. The `blockLinkPlan` nested-link rule. `isSafeAttrValue` in all HTML writers.
- **Link section.** `writeElement` lock gate. Rel tokens owned per toggle. Bare domain becomes `https://`.
- **Media drop.** Lock-checked drop-replace and transactional insert (`mediaDrop.ts`). `isLibraryAsset` de-dupe.
- **Media lifecycle.**
  - Grace delete restores element references, is untracked from history and is announced (`MediaCommandLayer.ts:104-155`).
  - The retry queue is rebuilt from persisted `localOnly` assets, with single-flight drain (`MediaManager.ts:341-358,421-447`).
  - In-flight delete tombstones.
  - SVG sniff + DOMPurify on upload.
  - Server search has a failure state distinct from no-match.
  - The embed iframe is rebuilt from parsed ids with a sandbox.
  - Viewer `aria-disabled` + reason pattern.
- **Alt-text AI.** Never overwrites user alt, with a server guard plus a client TOCTOU re-check (`useAltTextAutoTrigger.ts:57-61`).
- **Forms security and safety.**
  - Open-redirect hardening (`form-submission.service.ts:40-56,185,210`; `route.ts:104-111`).
  - Visitor-facing HTML error/thanks pages.
  - Repeated checkbox keys are joined.
  - Wiring safety, with no sweep when wiring could not run (`publish-forms.ts:198-212`).
  - Rows keyed by `(siteId, blockId)` and `isActive:false` until publish.
  - Diff-based ADMIN gate on `notifyEmail`.
  - CSV formula escaping (`service:408-420`).
  - Clobbering-name warning.
  - Delete-confirm copy.
- **CMS sync.**
  - Server-first publish snapshot (`exportPublishPages.ts:87-90`).
  - The publish gate counts in-flight and outbox ops (`cmsSyncBlocker`, `cmsSync.ts:459-482`).
  - The outbox is persisted per site, with a seq guard and `base` precondition (`:99-185`).
  - CONFLICT / GONE / INVALID discriminators (`translateCms.ts`, `classify` `:298-304`). NOT_FOUND on delete counts as done.
  - Race-safe `updateMany … deletedAt:null` (`cms.service.ts:284-293,406-417`).
  - Tombstones with slug rewrite (`:307-321`).
- **CMS validation and safety.**
  - One shared validator for sheet, engine and server (`packages/shared/schemas/cms.ts:145-197`).
  - Rich-text sanitize on input, store and output, plus `sanitizeGeneratedPageHtml`.
  - The "Used by" lock on field key/type/delete.
  - The record sheet's conflict, gone and leave-guard handling.
  - Typed-DELETE dialogs.
  - Home-page template refusal in both UI and server.

---

## 9. Defects found in code

Priority is the auditor's guess. "Lead" marks lines the lead re-read; every other entry is from one of the four code readers. All entries are CODE level; none was checked live.

**P0**

- **F-01. Text formatting and entities publish as visible text** [lead]
  - Inline edit stores `sanitizeHTML(el.innerHTML)` (`canvas/hooks/useCanvasInlineEdit.ts:164`), which is HTML.
  - The canvas and Preview mount content raw (`generation.ts:160`).
  - `ExportEngine.renderContent` (`engine/export/ExportEngine.ts:1139-1150`) escapes content unless `contentFormat==="html"`, or the element is a container whose content looks like a tag. `contentFormat` is never set anywhere in the editor.
  - Both the publish path (`exportPublishPages.ts:46` → `exportAllPages` → `renderPageElement :1273`) and file export go through it.
  - Scenarios:
    - (a) Heading text `Q&A` is stored as `Q&amp;A` and publishes as visible "Q&amp;A".
    - (b) Bold one word in a paragraph: the live page shows `<strong>word</strong>` as literal text.
    - (c) The SaaS template hero (`templatesData.ts:151`, inner HTML stored by `HTMLParser.ts:249-250`) publishes a literal `<br><span style=…>`.
  - Preview looks correct, which hides the bug. No export test covers formatted text (grep of `engine/export/__tests__` finds no `<strong>`).
- **F-02. Tabs and Modal blocks have no runtime** [lead]
  - Inactive panels and the modal overlay ship as `display:none` (`blocks/Components/Tabs.tsx:84`, `Modal.tsx:57`).
  - `lib/publish-widgets.ts:25-28` injects only the countdown and accordion runtimes (the slider has its own in `lib/publish-sliders.ts`), and ExportEngine adds only interaction and theme-toggle scripts.
  - On the live site, clicking tab 2 or "Open Modal" does nothing. ZIP/HTML downloads also lack the slider, accordion and countdown runtimes.
- **F-03. RT-01 image loss after a failed registration** (chain in §0)
  - `AssetUploadService.ts:182` discards `uploaded.url`. `BuildrikSyncProvider.ts:835-840` strips `blob:` with no remap. `Composer.ts:561-568` remaps only exact URLs.
  - Result: the placed image is permanently src-less, and the retry uploads a duplicate Blob.
- **F-04. Form Method = GET or Encoding = Multipart/Plain breaks the published form** [lead: `publish-forms.ts:128-142`]
  - GET: two `method` attributes are written, the first (GET) wins, and the endpoint's POST-only handler returns 405.
  - Multipart/plain: the endpoint treats the body as non-form and runs `JSON.parse` (`route.ts:36-38,80-84`), so the visitor gets a raw `{"error":"Invalid JSON"}` 400.
- **F-05. Radio and checkbox answers are recorded as "on"** [lead: `blocks/Forms/Radio.tsx:19`]
  - The blocks have no `value`. The Choice body offers only Name / Checked / Required (`formBodies.tsx:136-141`). The data-attribute editor forces a `data-`/`aria-` prefix (`DataAttributeEditor.tsx:9`).
  - A three-option radio group stores `{"radio-group":"on"}`.
- **F-06. Team members don't share a site's media library** [lead: `server/services/media.service.ts:153-155`]
  - `listAssets` always filters by `userId`. EDITOR B opening A's site sees none of A's uploads, despite the "one library for the whole site" copy.

**P1**

- **F-07. L1-002's input is still reachable via drag** [lead: ExportEngine side fixed]
  - The text-leaf guard exists only for click insert (`useBlockInsertion.ts:112`). The drag path (`dropOperations.tsx:416-535`) has none, and `findValidDropTarget` returns the heading (`dropTarget.ts:84-104`; BLOCK → VOID/MEDIA allowed in `derived.ts:80-87`).
  - Dropping a Divider on a Heading produces `<h2>Heading<hr></h2>`. After that, `beginEdit` refuses nested ids, so the heading text can no longer be edited.
  - `ReactExporter.ts:240-247` still drops the text in this case.
- **F-08. A new collection whose slug matches an existing one is silently merged into it and deleted**
  - The name check is name-only (`CMSCollectionSetupModal.tsx:159-166`).
  - The server returns `CONFLICT SLUG_TAKEN` (`cms.service.ts:224-229`), and the client then runs `adoptServerCollection` (`cmsSync.ts:802-805,844-856`), which moves records into the existing collection and deletes the local one without saying anything.
  - Example: "Menu items" exists, then the user creates "Menu-items".
  - The Settings rename path has the same gap (`CollectionSettingsPane.tsx:41`).
- **F-09. Collection lists have no sort, filter or offset; order is `updatedAt desc`**
  - Fixing a typo in an old record moves it to the top of the live list.
  - Canvas lists show drafts (`RepeaterRenderer.ts:159`) while publish shows published records only.
- **F-10. Drag carries no alt**
  - `AssetCell.tsx:110-115` and `AssetGrid.tsx:801-805` never set `x-aquibra-media-alt`.
  - Drop-insert therefore has no alt, and drop-replace calls `replaceMedia({alt:undefined})`, which removes the existing alt (`MediaCommandLayer.ts:259-262`).
- **F-11. Media drop position is wrong at zoom ≠ 100%**
  - `x/y = clientX - canvasRect.left` (`useDropExecution.ts:96-98`) inside a `transform: scale()` frame (`Canvas.tsx:109-112,786`) is used as absolute `left/top` on the page root (`ElementManager.ts:500-519`).
  - At 50% zoom, an image lands twice as far from the edge as the drop point.
- **F-12. Lock bypass on media writes**
  - Click-replace (`useMediaState.ts:213-220`), Apply version (`LibraryManager.tsx:669`) and Replace across (`replaceAcrossSelective`) all skip the lock check, so a locked image's src changes.
  - ⌘K "Replace selected media" also writes `src` onto non-media elements.
- **F-13. Media metadata failures**
  - WS-01: server refusals are invisible.
  - `importServerAssets` skips assets already held (`MediaManager.ts:633`), so cross-device rename, alt and folder changes never arrive.
- **F-14. Version restore is a no-op locally and likely fails on the server**
  - `useLibraryState.ts:353-362` drops `src`.
  - The server copies the version URL onto the parent, which likely conflicts with `@@unique([userId,url])` (P2002). Not verified at runtime.
- **F-15. Deleting a folder with contents is irreversible**
  - `useLibraryState.ts:315-324` and `LibraryManager.tsx:1077-1091`: no grace period, no undo, and element srcs are not cleared, so placed images point at deleted Blobs.
- **F-16 (P2). Audio never syncs and is never flagged local-only**
  - `toServerAssetType` returns null for audio (`MediaManager.ts:65-66,1239-1240`).
  - The Audio element loses its src after reload with no "not on server" signal.
- **F-21. `blob:` src can reach published HTML**
  - The sanitizer allows `blob:` (`sanitizationConfig.ts:150`), and the non-CMS publish path exports the live composer (`exportPublishPages.ts:74-85`).
  - Reader claim; needs live confirmation.
- **F-33. A custom Action URL silently detaches the form from Buildrick**
  - With Action set (placeholder `/submit`, `attributeFields.ts:69`), `wireForms` skips the form (`publish-forms.ts:129`).
  - Result: no FormBlock row, After submit has no effect, nothing reaches the inbox, and `/submit` returns 404 on the static site.
- **F-35. Editing Select › Options likely duplicates options**
  - `setContent` adds new options while the old `<option>` child elements remain (`PropertyField.tsx:143-172`, `HTMLParser.ts:254-266`, `ElementSerialization.ts:71-80`).
  - The Options field also reads blank. Not verified live.
- **F-36. Fields › Type on a `<select>`**
  - The type shows as "Text" (`FormFieldsSection.tsx:50-51`).
  - Choosing "Long text" replaces the select with a textarea and loses all options.
- **F-41. Undo after deleting a CMS record restores it under a new id**
  - `CmsWorkspace.tsx:486-488` → `createContentItem`.
  - Pinned bindings show "isn't published", and Reference fields show "Deleted record".
- **F-42. Renaming a CMS field key doesn't update the SEO title/description patterns**
  - `CollectionManager.ts:273-279` doesn't follow them, and `fieldUsage.ts:39-68` doesn't count them as uses.
  - Example: a pattern `{title} · Menu` publishes empty titles after `title` is renamed to `name`.
- **F-43. CSV import stores every value as a string** (`cms.service.ts:569-572`)
  - Boolean "false" displays as Yes.
  - Multiselect "a,b" fails publish validation.
  - References given by name show "Deleted record".
  - With no bulk publish, 500 imported rows mean 500 manual publishes.
- **F-04b / F-44 (P2). Duplicate or empty dynamic-page paths overwrite each other at publish**
  - `DynamicPagesPane.tsx:67,228` still allows Save when paths collide.
  - The server doesn't dedupe; an empty path becomes `index` (`cms.service.ts:931-932`).
  - Changing the pattern later doesn't re-check records that are already published.
- **F-47 (security, needs live check). Decoded text can become HTML in the canvas session**
  - Text-only nodes store decoded `textContent` (`HTMLParser.ts:268-287`), and the canvas mounts content raw.
  - Pasting `<p>&lt;img src=x onerror=…&gt;</p>` via Paste HTML could therefore execute in the editor origin until reload. The load sanitizer (`Composer.ts:808`) and server `sanitizeBlocks` clean it later.
  - `Element.setContent` does not sanitize (`Element.ts:146`).

**P2**

- **F-17. Client size limits are not plan-aware.** Client allows video up to 100MB (`shared/constants/media.ts:23`) while FREE allows 10MB (`lib/constants/plan-limits.ts:36`), so the asset stays local-only forever with no reason shown.
- **F-18. Animated GIFs become a single-frame WebP** (`MediaManager.ts:1096-1111`).
- **F-19. `followAssetAlt` overwrites decorative alt.** It treats `alt=""` as "no alt" (`MediaCommandLayer.ts:283`), and the Inspector cannot set `alt=""` (`attributeWriter.ts:161-167`).
- **F-20. Library alt writes on every keystroke** (`AssetDetailsPanel.tsx:764`, `LibraryManager.tsx:979-985`). Un-awaited races can leave a truncated value on the server, or placements one character behind.
- **F-22. Link section shows stale state.**
  - The effect depends only on `[composer, selectedElement.id]` (`LinkSection.tsx:119-148`), and the section is not keyed by element.
  - After undo, the field shows the undone value.
  - After switching elements, choosing Link to = URL writes the previous element's URL onto the new one (`:191-193`).
- **F-23. Page links are dead in Preview** (`PreviewOverlay.tsx:137`). Linked containers also have no `<a>` wrapper in Preview.
- **F-24. "Clear formatting" does nothing.** `removeFormat` has no handler (`useCanvasInlineCommands.ts:174-175`, silent `devLog`).
- **F-31. Button with a link exports `<a style="display:contents"><button>`** (`ExportHelpers.ts:417,473`), which is invalid interactive nesting.
- **F-32. React export defects** (`ReactExporter.ts:219-247`): content/children either-or, no `#page:` resolution, duplicate `class`/`className` props, unescaped `{` and `}`.
- **F-37. `replaceField` drops field data** (`FormFieldsSection.tsx:71-74`). Classes, styles, `data-*`, `disabled`, `autocomplete`, `maxlength` and default text are lost.
- **F-38. "+ Add field" can mint duplicate names** (`n = fields.length + 1`, `:135`). The endpoint then joins both values into one key.
- **F-39. After submit save gaps** (`FormAfterSubmitSection.tsx:138,172-173,216-218`).
  - Clearing the redirect URL never saves, so visitors keep being redirected.
  - The "straight away" copy is wrong for message and spam settings.
  - A load error has no retry.
- **F-40. Form rows are recorded before the deploy succeeds** (`publish/[jobId]/route.ts:356`). If the deploy fails, the still-live form returns "isn't accepting submissions".
- **F-45. A collection slug rename can hit a raw P2002 that retries forever.** `cms.service.ts:284` is not translated, so the outbox retries forever and publish stays blocked.
- **F-46. Nested collection lists render wrong** (`RepeaterRenderer.ts:141-146,399-456`). The outer list substitutes `{{item.x}}` inside the inner template. Inferred from code.
- **F-48. Field type change keeps old data** with no conversion or warning (`FieldInspector.tsx:154`).
- **F-50. Form data privacy and caps.**
  - Submitter IPs are returned to all members, and a VIEWER can export them as JSON (`routers/forms.ts:91-99`, `service:228-234`).
  - Plan cap is enforced per site but shown per workspace, and the owner isn't told when it's hit (`service:116-123`, `billing.service.ts:28-30`).
- **F-51. Form fields drag-reorder** moves the bare input out of its Contact Form wrapper and leaves the label behind (`FormFieldsSection.tsx:144-152`).

**P3**

- **F-25.** Misleading copy:
  - The Embed row promises Spotify and Figma (`catalog.ts:376` vs `parseEmbedUrl.ts:20`).
  - The toolbar link is always new-tab.
  - Shift+Enter commits instead of inserting a line break.
- **F-26.** A cancelled drag still adds the block to Recent (`useBuildTab.ts:196`).
- **F-27.** OS multi-file drop uses only the first image (`useDropExecution.ts:245`).
- **F-28.** Clicking a stock image hotlinks it and also saves an unused library copy.
- **F-49.** The collection-list limit rebinds on every keystroke (`CollectionListSection.tsx:84-88`).
- **F-52.** CMS load failure is invisible once collections are cached (`ContentTab.tsx:161`). `cmsSyncBlocker` ignores `"error"`.
- **F-53.** Record search matches rich-text markup (`RecordsTable.tsx:79-84,112-115`).
- **F-54.** CMS copy promises "re-sync" and clickable generated pages, neither of which exists (`CmsWorkspace.tsx:325,329`).
- **F-55.** DynamicPagesPane's page list is memoised on `[composer]` only (`:43-54`).
- **F-56.** Deleting a referenced collection is guarded on the client only (`CollectionSettingsPane.tsx:142`).
- **F-57.** Success-message text containing `$&` corrupts the form tag. The replacement is a `String.replace` string (`publish-forms.ts:142`).
- **F-58.** `sourceUrl` is never stored for submissions (`form-submission.service.ts:125-127`).
- **F-59.** The editor inbox has no Spam or Archived view, so marking spam or archiving is one-way (`FormsScreen.tsx:149-155`).
- **F-60.** "Configure in Inspector" ignores the form's page; `pageId` is never set (`service:366-376`, `locate.ts:59-61`).
- **F-61.** `blocks/Forms/Form.tsx` and `ContactForm.tsx` have no linked `<label for>`.

---

## 10. Live checks needed

Run against `http://localhost:3300/edit/<siteId>` at 1440×900, logged in as OWNER of a site with Vercel connected unless a step says otherwise. Keep DevTools open: Network filtered to `trpc`, and Application → localStorage / IndexedDB.

1. **F-01: entities.**
   - Steps: Add › Heading. Double-click it, type `Q&A`, press Enter. Wait for `sites.saveProject`.
   - Measure: canvas `h2.innerHTML` is `Q&amp;A`. Export (header) → HTML → code: expect `Q&amp;amp;A`. Or publish and check `document.body.innerText.includes('&amp;')` on the live page.
2. **F-01: formatting.**
   - Steps: double-click a Text element, select a word, click toolbar **B**, click outside.
   - Measure: in Preview, `getComputedStyle(frame.querySelector('strong')).fontWeight === "700"`. Export HTML contains `&lt;strong&gt;`, and the live page shows the literal `<strong>`.
3. **F-01: template.**
   - Steps: Templates › Acme SaaS › Apply. Export HTML.
   - Measure: the `<h1>` contains `&lt;br&gt;&lt;span`. On the published page, `h1.textContent.includes('<br>')` is true.
4. **F-02: Tabs and Modal.**
   - Steps: Add › Tabs and Add › Modal. Publish.
   - Measure on the live page: click tab 2, then `getComputedStyle(document.querySelectorAll('[role=tabpanel]')[1]).display` is still `none`. Click "Open Modal", and the overlay's display is still `none`. No runtime `<script>` for either.
5. **F-07: drag into heading.**
   - Steps: Add › Heading. Drag Add › Divider and release over the vertical middle of the heading.
   - Measure: `document.querySelector('[data-buildrick-type=heading] hr')` is not null. Double-click the heading: `isContentEditable === false`. Export → React: the heading text is missing.
6. **F-47: paste XSS (local only).**
   - Steps: Add ⋯ › Paste HTML…, enter `<p>&lt;img src=x onerror="document.title='XSS'"&gt;</p>`, Insert.
   - Measure: `document.title === 'XSS'`. Reload, and the img is gone.
7. **F-22: link state.**
   - Steps: select Button A › Behaviour › Link › URL `https://a.com`. Select Button B (no link) and set Link to = URL.
   - Measure: B's field shows `https://a.com`, and `B.getAttribute('href') === 'https://a.com'`.
   - Then on A, set `https://b.com`, press ⌘Z. The field still shows b.com while `href` is a.com.
8. **F-23: Preview page link.**
   - Steps: create page "About". On a Link element choose Page › About. Open Preview and click it.
   - Measure: the iframe stays on the same document, and `location.hash` is `#page:<id>`.
9. **F-24: Clear formatting.**
   - Steps: bold a word, click ✕ Clear formatting, click outside.
   - Measure: `innerHTML` still contains `<strong>`.
10. **Toolbar focus (suspected).**
    - Steps: in inline edit, select a word, click 🔗, click into the URL field, type `x`.
    - Measure: `document.activeElement.tagName === "INPUT"`, and the heading text is unchanged. Also check that the Text style select opens.
11. **F-03 / RT-01.**
    - Steps: DevTools → block request pattern `*createAsset*`. Assets (M) › Upload a PNG. Expect the PUT to `*.blob.vercel-storage.com` to return 200 and `media.createAsset` to fail. Click the tile to insert it. Wait for `sites.saveProject`, unblock, reload.
    - Measure: before reload `img.src` starts with `blob:`. After reload, `img.hasAttribute('src') === false`. The library still lists the asset. Count Blob PUTs after the retry; expect 2.
12. **F-21: blob in publish.**
    - Steps: block `*createAsset*`, upload, use Inspector Image › Replace with the new asset, then publish (QA workspace deploys for real).
    - Measure: `curl <live-url> | grep -c 'blob:'` > 0.
13. **F-10: drag alt.**
    - Steps: library rail, set asset X alt "Test alt". On the canvas, set an image's alt "Old". Drag X from the drawer onto that image.
    - Measure: `img.getAttribute('alt') === null`. Drag X onto empty canvas: the new img also has no alt.
14. **F-11: zoom drop.**
    - Steps: footer zoom 50%. Drag a tile to about 300px right of the `.buildrick-canvas` left edge.
    - Measure: `getComputedStyle(newImg).left` ≈ `300px`, while `newImg.getBoundingClientRect().left - canvasRect.left` ≈ 150.
15. **F-12: lock bypass.**
    - Steps: select an image, ⋯ › Lock. Click a different drawer tile.
    - Measure: compare `src` before and after; a change is the defect. Repeat with library › Replace across site.
16. **WS-01 / F-13.**
    - Steps: library, block `*moveAsset*`. Drag a card onto folder F. Expect a success rail and no MoveFailed modal. Unblock, use a second browser profile, reload.
    - Measure: the `media.listAssets` response shows the old `folderId`.
17. **F-06: shared library.**
    - Steps: as a second EDITOR in the same workspace, open the site.
    - Measure: `media.listAssets` returns `total: 0` despite the OWNER's uploads.
18. **F-14: version restore.**
    - Steps: Edit image → Save. Drawer hub › Versions › Restore.
    - Measure: the `media.restoreAssetVersion` status (500 / P2002 predicted). If it returns 200, the tile src and placements are unchanged.
19. **F-15: folder delete.**
    - Steps: move an asset used on the page into folder F. Delete F and confirm.
    - Measure: there is no Undo toast, the placed `<img>` keeps its src, and `fetch(img.src)` returns 404.
20. **F-18 GIF; F-20 alt keystrokes.**
    - Upload an animated GIF: the library details show `image/webp` and the tile is static.
    - Type 10 characters into the library rail alt field: 10 `media.updateAsset` requests.
21. **UX-20.**
    - Measure `getComputedStyle(...).backgroundColor` of `.mgr-upload-split`, `[data-testid=mgr-empty-upload]` and `[data-testid=mgr-empty-folder-upload]`. Expect three different values.
    - Measure `textContent` of `[data-testid=mgr-view-grid]` and `[data-testid=mgr-gridn]`. Both contain "Grid".
22. **F-05: radio value.**
    - Steps: Add › Forms › Form. Add three Radio blocks and set Name `size` on each. Search every Inspector tab for a "Value" control (none expected). Publish, pick the third radio on the live page, submit.
    - Measure: `SELECT data FROM form_submissions ORDER BY "createdAt" DESC LIMIT 1` returns `{"size":"on"}`.
23. **F-04: GET and multipart.**
    - Steps: Form › Behaviour › Attributes › Method = GET. Publish.
    - Measure: live `form.outerHTML` has two `method=` attributes. Submitting gives a GET with 405.
    - Then set Encoding = Multipart, republish, submit: 400 with body `{"error":"Invalid JSON"}` and no DB row.
24. **F-33: custom action.**
    - Steps: Action URL `/submit`. Publish.
    - Measure: `document.querySelectorAll('input[name=_return]').length === 0`, the submit returns 404, and no `form_blocks` row for that blockId has `isActive=true`.
25. **F-35: select options.**
    - Steps: Add › Forms › Select › Style tab.
    - Measure: `[aria-label="Options (one per line)"]` has value `""`. Type `Red\nBlue`. The canvas `select.options.length === 4` is predicted. Reload and check again.
26. **F-36 / F-38.**
    - In Form › Fields, the select row summary reads `choice · Text`. Choose "Long text": the canvas node's `tagName === "TEXTAREA"` and the options are gone.
    - On a fresh form: Add field ×2, delete `field-3`, Add field. `form.querySelectorAll('[name="field-4"]').length === 2`.
27. **F-39 / T17 timing.**
    - Set Then = Redirect, `/thanks`, blur. Clear the field and blur.
    - Measure: no `forms.updateBlock` request is sent, and the DB `redirectUrl` is still `/thanks`.
    - After publish, change Message without republishing and submit: the live `.bk-form-success` shows the old text.
28. **Form roles.**
    - As EDITOR, change Send to: expect the error "Only workspace Admins…" and the value reverts.
    - As VIEWER, in Settings › Form submissions, open a row: expect a FORBIDDEN banner.
    - From the console call `forms.exportSubmissions({format:"json"})`: check whether the rows include `ip`.
29. **UX-15 / IA-11.**
    - Steps: on a site with no collections, press **D**.
    - Measure: `[data-testid=content-empty]` has four buttons; `[data-testid=cms-ws-new-collection]` is in the header; `[data-testid=cms-ws-empty]` is on the right. Take the `getBoundingClientRect()` of each and of the empty centre.
30. **UX-17.**
    - Steps: click `content-empty-cta`.
    - Measure: `#cms-collection-name.value === ""` while the step-1 dot shows ✓ (computed background equals the `--bk-success` value).
31. **F-08: slug merge.**
    - Steps: create "Menu items" with one record and wait for `cms.collections.upsert` 200. Create "Menu-items" with an extra field.
    - Measure: the second upsert returns 400 with `CMS_CONFLICT:SLUG_TAKEN:<id>`, and "Menu-items" disappears from `[data-testid^=content-collection-]`.
32. **F-41: undo id.**
    - Steps: pin a heading binding to record R. Delete R (`cms-sheet-more` → `cms-sheet-delete`), then click Undo in the toast.
    - Measure: the new `cms.entries.upsert` id differs from R's, and `[data-testid=cms-preview]` reads "This record isn't published…".
33. **F-42: SEO pattern.**
    - Steps: Dynamic pages › SEO title `{title} · Menu`, Save. In Fields, rename Title's key to `name`.
    - Measure: the `cms.collections.upsert` payload has `pageSeoTitle` unchanged, and `[data-testid=cms-dp-seo-error]` appears.
34. **F-43: CSV types.**
    - Steps: a collection with Boolean "available" and Multiselect "tags" (a, b). Import CSV `available,tags` / `false,"a,b"`.
    - Measure: the record shows Yes (`#cms-field-available` value `yes`) with no tag chips. Toggle Published and Save: "Tags must be a list of options".
35. **F-09: list order.**
    - Steps: a collection list showing three records. Edit the oldest record and save.
    - Measure: the order of `[data-cms-repeater-clone]` text changes, so the edited record moves first.
36. **F-46: nested list.**
    - Steps: collection list A (Authors) with a collection list B (Posts) inside its card.
    - Measure: compare B's clone text inside A's clone 1 vs clone 2, on the canvas and in the export HTML.
37. **CMS outbox.**
    - Steps: DevTools offline. Edit and save a record.
    - Measure: `cms-sheet-state` reads "Saved on this device only…", and `localStorage['bk-cms-outbox-v1']` contains the `entryUpsert` op. Reload offline, go online, reload: `cms.entries.upsert` fires before `cms.collections.list`, and the op is removed.
38. **F-52: hydrate failure.**
    - Steps: with collections cached, block `*cms.collections.list*` and reload.
    - Measure: there is no `content-load-error`. The console shows `[cms-sync] hydrate from server failed`.
39. **WS-03.**
    - Steps: block `*siteComponents.library*` and open Add › FROM LIBRARY / Components.
    - Measure: the group is empty, with no `role=alert` and no retry. The console shows `[component-sync] library read failed`.
40. **CMS role.**
    - As VIEWER, press **D**: expect the "View only…" toast.
    - Run ⌘K "Manage CMS records" (`CMS_MANAGE_RECORDS`): check whether `[data-testid=cms-workspace]` mounts. The gate on this path is not verified.
41. **Ecommerce reachability.**
    - Steps: in Add, search "product", "cart", "Product Card".
    - Measure: zero results, and the collection setup modal never opens.
42. **Inspector placement.**
    - Image selected: Source and Alt are in the **Style** tab, and there is no Link section anywhere.
    - Button selected: text and Type in Style, Link in Behaviour.
    - Input in a form: "Placeholder" (Style) and Form › Fields "Label" (Behaviour) both change `el.getAttribute('placeholder')`.

**Not verified in this round:**
- Anything at LIVE level.
- Conflict and recovery inside the Link and type-block sections.
- ID uniqueness enforcement.
- The CMS-bound text on the publish path (double-escape risk from `escapeHtmlText`, `CMSBindingManager.ts:293`).
- Navbar mobile behaviour.
- The email template body.
- Whether AI or template generators emit product blocks.
- Whether the Vercel-hosted `onUploadCompleted` webhook softens RT-01 in production.
- `DeleteFieldDialog` and `RecordTemplatePreviewDialog` internals.
- Whether the library rail alt textarea is gated for viewers.
