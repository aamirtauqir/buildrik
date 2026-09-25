# 18 — Frontend and Realtime Performance

**Scope:** Prompt 18, Frontend + Realtime Performance, run by Agent E (Engineering Architecture). The audit covered:
- **Editor:** re-renders, subscriptions, the Layers tree, CMS tables, media grids, History and Activity, search, images, code splitting.
- **Network, caching and realtime:** SSE, polling, collab ops, presence and cursor traffic.
- **Server work each of these triggers:** autosave, hydration, list queries.

It spans `packages/editor`, `packages/dashboard`, `server`, `prisma`, `lib` and `packages/shared`. This run is READ-ONLY. The only file written is this report.

---

## Method & runtime status

**What was run**

1. **Code tracing.** Each hot path was traced by hand from the UI event through the hook, the engine emit, the React state and the DOM write, and on to the tRPC call, the router, the service and Prisma.
2. **Static scans** (scratch scripts outside the repo):
   - every `findMany` without `take` in `server/services`, `server/trpc/routers` and `packages/dashboard/app/api` (93 hits, triaged by hand);
   - every awaited Prisma call inside a `for…of` loop;
   - every `setInterval`, `refetchInterval` and `EventSource` in both frontends.
3. **Engine micro-probe.** A throwaway vitest file in the session scratchpad ran under the editor's own vitest config (jsdom), against a real `Composer` (no mocks). It built one page and measured one `setStyle`. The repo was not touched.

   | Page | `PROJECT_CHANGED` per `setStyle` | `elements.toHTML()` | `deepClone(exportProject())` | Canvas HTML | Autosave payload |
   |---|---|---|---|---|---|
   | 301 elements | 1 | **1.62 ms** | 1.11 ms | 50.6 KB | 75.7 KB |
   | 1,501 elements | 1 | **8.26 ms** | 5.49 ms | 252.6 KB | **376.4 KB** |

   jsdom's `DOMParser` measured 44 ms and 114 ms per parse-and-serialize. A browser is much faster, so those two numbers are **not** quoted as browser truth. They only show that parsing grows with page size.

4. **Bundle measurement.** Ran `vite build --outDir <scratchpad>` for the standalone editor, with output outside the repo; `git status` was clean afterwards.
   - Main chunk: **2,223.71 kB minified / 652.30 kB gzip**.
   - Second eager chunk: 448.59 kB / 148.64 kB gzip (Sentry, loaded dynamically).
   - A string grep of the main chunk found `JSZip`, `gsap` and `react-easy-crop`.
   - `html2canvas` is a separate lazy chunk (201 kB).

**NOT RUNTIME VERIFIED**
- No browser profiling: React Profiler, Performance panel, Long Tasks and memory snapshots were all unavailable.
- **Frame cost and re-render counts in the browser.** Every "jank" or "re-render" impact below is inferred from code plus the jsdom probe.
- The Next.js production bundle for `/edit/[siteId]`. Only the Vite standalone build was measured. Both bundle the same `AquibraStudio` graph, but the chunking differs.
- No Postgres, so none of the following was measured:
  - how long `saveProjectData` takes for N pages, or whether it hits the interactive-transaction timeout;
  - the load from SSE polling;
  - the insert rate of collab ops.
- **SSE behaviour on the cPanel/LiteSpeed host:** connection limits and proxy buffering.
- Collaboration (`FEATURE_COLLAB`) is off in production, so the collab findings describe flag-on behaviour.

---

## Output table

| ID | Area | File / function | Cause | Impact | Recommendation | Priority | Needs profiling? |
|---|---|---|---|---|---|---|---|
| A18-1 | Canvas render pipeline | `canvas/hooks/useCanvasSync.ts:31-34,75` → `useCMSPreview.ts:45-97` → `useCanvasContent.ts:46-49` → `Canvas.tsx:503,720` | Every `PROJECT_CHANGED` re-serializes the whole page. It then parses that page twice and replaces the entire canvas `innerHTML`. | Per frame during slider or colour scrubs, per keystroke in inspector fields. The cost grows with page size (8 ms for `toHTML` alone at 1.5k elements, before 2 parses and a full DOM rebuild). Embeds, video and iframes reload, and a second render follows on every mutation. | Patch the DOM for each changed element (the engine already emits `ELEMENT_UPDATED` with the element). Drop the redundant `useCanvasContent` parse. Resolve CMS only when bindings exist. | **P1** | Yes |
| A18-2 | Autosave / network / DB | `useComposerInit.ts:517-527`, `BuildrikSyncProvider.saveProject:398`, `sites.service.saveProjectData:612-744` | Each autosave sends all pages. The server upserts every page one at a time inside one interactive transaction with the default timeout. | 376 KB per save for one 1.5k-element page. N pages means N round-trips and N full JSONB rewrites every ~1 s of editing. A large site risks a transaction timeout, which shows up as a failed save. | Track dirty pages on the client and send only those. On the server, skip unchanged pages by hash or `updatedAt`. Set an explicit `$transaction` timeout. | **P2** | Yes (DB) |
| A18-3 | Global subscription / re-renders | `StudioPanels.tsx:211,357-367,486`; `Canvas.tsx:437-441`; `useLayerTree.ts:176-190` | Canvas hover is lifted into shell state, and there are no `React.memo` boundaries. Layers auto-expand allocates a new `Set` on every hover. | Each change of hovered element re-renders the whole shell: Canvas, ProInspector, LeftSidebar and the Layers tree. With Layers open it also writes to `localStorage` on every hover. | Keep hover in a ref or store with a narrow subscriber (Layers only). Return `prev` when every ancestor is already expanded. Memoize the shell children. | **P2** | Yes |
| A18-4 | Layers tree | `useLayerTree.ts:54-107,140-156`; `panels/layers/index.tsx:440-470`; `LayerTreeItem.tsx:49` | The whole tree is rebuilt from the engine twice per mutation (on `ELEMENT_UPDATED` and on `PROJECT_CHANGED`), with fresh node objects. Rows render recursively, without memo or virtualization, and each row gets global props. | Every keystroke or style tick re-renders every visible row. The cost grows with element count. | Coalesce the rebuilds to one per frame. Keep node identity for unchanged subtrees. Memo rows on their own slice of state. Virtualize the flattened visible list (`react-window` is already a dependency). | **P2** | Yes |
| A18-5 | Realtime payload size | `app/api/sse/publish/[jobId]/route.ts:37,54,71,84` | The route reads the full `PublishBuildJob` row every second and sends the whole row, including `log`, which holds the entire deploy HTML payload. | Several MB can go out per progress event on a large site, plus a heavy DB read every second. The tRPC twin, `getPublishStatus`, deliberately leaves `log` out (`publish.service.ts:393-394`). | Use the same explicit `select` as `getPublishStatus`. | **P2** | No |
| A18-6 | Media grid | `MediaManager.importServerAssets:566-644`; `AssetCell.tsx:145-150`; `AssetGrid.tsx:149-169`; `useLibraryState.ts:73-104`; `useMediaManager.ts:44-55` | Assets loaded from the server have no thumbnail, so the grid draws the full-size original. Hydration emits `MEDIA_ADDED` once per asset, between awaited IndexedDB writes, and each listener copies and sorts the whole list. | The grid downloads full-resolution images for small tiles. Up to 200 separate re-renders per page of 200 assets while the Media tab is open (O(n² log n) list work). | Serve a resized thumbnail URL (server-side resize or blob transform). Hydrate in bulk: one write batch, one emit. | **P2** | Yes |
| A18-7 | History / versions network | `versionSync.hydrateVersionsFromServer:88-124`, called on every editor open (`useVersionSync.ts:38`) | N+1: for each server version not in local IndexedDB, one sequential `siteVersions.get` of a full project snapshot. | On a new device or after cleared storage, up to 50 or more full-project downloads run one after another at boot and compete with the project load. | Hydrate lazily when History opens, or fetch payloads on demand when a version is previewed or restored. | **P2** | No |
| A18-8 | Bundle / code splitting | `useExportHandlers.ts:27` → `engine/export` (jszip); `Composer.ts:45` → `InteractionManager` → `InteractionRuntime` → `GSAPEngine` (gsap); `StudioModals.tsx:15` → `ImageEditorModal` (react-easy-crop) | Features used rarely are imported statically into the always-loaded graph. | Main editor chunk measured at 2.22 MB min / 652 kB gzip. Part of that is jszip, gsap and react-easy-crop, which only export, preview interactions and image editing need. | Lazy-load `ExportEngine`/`ReactExporter` on export, `GSAPEngine` on preview or interaction start, and modals on open. | **P2** | Yes (bundle analyzer on the Next build) |
| A18-9 | Collab realtime (flag-off) | `HistoryManager.applyRemoteOperation:331-346`; `useCursorSync.ts` → `CollaborationManager.updateCursor:255` → `SSETransport.send:86-99` → `api/collab/[siteId]/ops` POST → `appendCollabOp` | Each remote op runs a full `importProject` plus `deepClone`, which rebuilds the whole canvas, Layers and Pages. Cursor moves are POSTed and stored as DB rows. No size cap on op bodies. The replay batch is 200 ops per 1.5 s poll. | With the flag on: a full editor rebuild for every peer edit. About 20 HTTP requests per second per moving cursor, each running `auth()`, a role check and an INSERT. Cursors jump every 1.5 s. Oversized ops persist. | Apply the patch to the tree instead of re-importing it. Send presence through an ephemeral channel with no DB write. Cap op size on the server. | P2 (P1 if collab ships) | Yes |
| A18-10 | CMS | `cmsSync.ts:115-160`; `cms.service.listEntries:78-81`; `CMSRecordsModal.tsx:104-141,395` | Hydration is N+1: one entries request per collection, one after another, then one IndexedDB write per entry. `listEntries` has no limit. The records table renders every row with no virtualization or paging. | Slow boot and a heavy modal on large collections. | Fetch entries for all collections in one call, or lazily per collection. Page the list server-side. Virtualize the table. | P3 | Yes |
| A18-11 | Root-level state churn | `useStudioState.ts:257` (saveState, at the AquibraStudio root); `useExportHandlers.ts:57` (`usePublishJob` at the root, polling every 2 s, `usePublishJob.ts:177`) | State that changes often lives at the top of the tree, and nothing below it is memoized. | Two full editor renders per autosave. One full render every 2 s for the whole length of a publish. | Move save and publish status into a small store with selector subscribers (the topbar and the Publish tab). | P3 | Yes |
| A18-12 | Dashboard network / caching | `lib/trpc/client.tsx:88-107`; `components/media/media-library.tsx:70-75,196,356` | `staleTime` is 0 by default, so every mount or focus refetches. Media search has no debounce, so each keystroke sends a request. "Load more" grows `limit` and refetches the whole list. | Duplicate requests on every navigation and window focus. O(n) refetch on each "load more". | Set a sensible default `staleTime`. Debounce search. Use cursor pagination (`listAssets` already supports `cursor`). | P3 | No |
| A18-13 | Reconnect storm | `lib/hooks/use-notification-sse.ts:13-25`; `app/api/sse/notifications/route.ts:37-52` | A fixed 5 s manual reconnect, with no backoff, no jitter and no stop on 401. Each open dashboard tab holds one stream and runs a count query every 5 s. | An expired session or a server restart makes every open tab reconnect every 5 s indefinitely. Long-lived connections add up per tab on cPanel. | Use exponential backoff with jitter. Stop on 401. Consider one shared stream per browser (BroadcastChannel). | P3 | Yes (host) |
| A18-14 | Per-mutation listener work | `LinkSection.tsx:83-96` (setPages per mutation); `useTemplateUsageMap.ts:40-50` (rebuild per mutation); `CommentLayer.tsx:187` (orphan-scan `querySelectorAll` 150 ms after every mutation, even with comment mode off); `Composer.beginTransaction` (`deepClone(exportProject())` per transaction); `useCursorSync.handleMouseMove` (`getBoundingClientRect` on every mousemove before the collab-connected check) | Small listeners that each do O(n) work, or cause a re-render, on every edit. | Individually small, but they add to the per-edit cost from A18-1 and A18-4. | Filter by `payload.type` the way `usePages` does. Check `isConnected()` before the rect read. Gate the orphan scan on having comments. | P3 | Yes |
| A18-15 | Server list query | `sites.service.listSites:73-105` | `sort=traffic` or `hasTraffic` loads every site in the workspace with 30 days of analytics rows, then paginates in memory. | O(sites × 30) rows per request for big agency workspaces. | Pre-aggregate `visitors30d` (the analytics cron already exists), or use a SQL aggregate. | P3 | No |

---

## Findings

### P0

None in this concern. A18-5 has a possible authorization side that is handed to Agent F in **Overlaps** rather than ruled on here.

### P1

#### A18-1: Every edit rebuilds the whole canvas DOM, with two extra full-HTML parses
- **Severity:** P1
- **File:line:**
  - `packages/editor/src/editor/canvas/hooks/useCanvasSync.ts:31-34, 51-57, 75`
  - `packages/editor/src/editor/canvas/hooks/useCMSPreview.ts:45-97`
  - `packages/editor/src/editor/canvas/hooks/useCanvasContent.ts:33-50`
  - `packages/editor/src/editor/canvas/Canvas.tsx:490, 503, 720`
- **Symbol:** `useCanvasSync.syncFromComposer`, `useCMSPreview`, `useCanvasContent`, `Canvas.canvasInnerHtml`
- **Evidence:**
  1. `Composer.markDirty` (`Composer.ts:979-1004`) emits `PROJECT_CHANGED` on every logical change. The probe measured exactly one per `setStyle`.
  2. `useCanvasSync` subscribes to that event. Once per frame it calls `composer.elements.toHTML()` for the **whole page** and `setContent(html)`.
  3. `useCMSPreview` re-runs whenever `content` changes. `composer.cms.bindings` is always constructed (`Composer.ts:272-274`), so its early exit never fires. It runs `new DOMParser().parseFromString(content)` and `querySelectorAll("[data-buildrick-id]")`, awaits `Promise.all` even when there are no bindings, and calls `setResolvedContent(doc.body.innerHTML)`. That is a second parse-and-serialize and a **second Canvas render, one microtask later**.
  4. `useCanvasContent` parses `resolvedContent` a third time (`parser.parseFromString(...)`, then `doc.body.innerHTML`). This round-trip does nothing useful.
  5. `canvasInnerHtml` is memoized on the string. That stops re-writes when nothing changed, but every real change still replaces the entire canvas subtree through `dangerouslySetInnerHTML` (`Canvas.tsx:720`).
  6. Probe, with a real Composer: `toHTML` took 1.62 ms at 301 elements and 8.26 ms at 1,501 elements, and the canvas HTML was 50.6 KB and 252.6 KB. On top of that the browser has to parse the page twice more and rebuild the whole DOM (not measured).
- **Expected behavior:** a style or text edit on one element changes only that element's DOM node. The cost of each edit should not grow with page size.
- **Root cause:** the canvas treats the engine as an HTML-string producer (the documented AGENTS.md invariant "Canvas mounts engine HTML, not React JSX"), and it has no incremental patch path. CMS resolution was layered on as another full-string transform.
- **Affected modules:** Canvas, Inspector (every style control), CMS preview, overlays that read DOM rects after the rebuild, and embedded media (iframes, video and `<canvas>` elements are recreated, so they reload or lose state).
- **Recommendation:**
  1. Remove the no-op re-parse in `useCanvasContent`.
  2. Skip `useCMSPreview` unless `bindings.count() > 0`, and resolve synchronously when values are cached.
  3. Add an incremental path. On `ELEMENT_UPDATED` or `ELEMENT_STYLE_UPDATED` for element X, replace only `[data-buildrick-id=X]` with `X.toHTML()`, or diff attributes and styles. Keep the full rebuild for structural changes and page switches.
  4. Add a perf regression test that counts `toHTML()` calls per `setStyle`.
- **Status:** PARTIAL. The code path was traced and the engine-side cost measured in jsdom. **Browser frame cost is NOT RUNTIME VERIFIED.**

### P2

#### A18-2: Autosave writes every page every time
- **Severity:** P2
- **File:line:**
  - `packages/editor/src/editor/shell/hooks/useComposerInit.ts:517-527` (sends `composer.exportProject()`)
  - `packages/editor/src/services/BuildrikSyncProvider.ts:398-420`
  - `server/services/sites.service.ts:489-540` (`saveProjectFromEditor` maps every page with `position`)
  - `server/services/sites.service.ts:612-744`
- **Symbol:** autosave handler, `saveProject`, `saveProjectData`
- **Evidence:**
  - The client always sends the whole project.
  - `saveProjectFromEditor` gives every page a `position`, so the save counts as a full snapshot (`isFullSnapshot`). The server then:
    - runs `findMany` over the pages;
    - for each page, in sequence inside `prisma.$transaction(async (tx) => …)` with no timeout option (Prisma's default is 5 s): runs `sanitizeBlocks(page.blocks)`, then `tx.page.upsert` with the full `blocks` JSON;
    - finally runs `site.update`.
  - The probe measured a 376 KB payload for one page of 1,501 elements.
  - The debounce is 1000 ms (`config.ts:113`), so a user who pauses often saves about once a second.
- **Expected behavior:** a save costs roughly the size of what changed. Pages that did not change are neither sent nor rewritten.
- **Root cause:** no dirty-page tracking. The server uses the snapshot shape both to detect deletions and to write every page.
- **Affected modules:** Autosave, Pages, DB write volume and WAL, SiteVersion and conflict detection (the same path).
- **Recommendation:**
  - Track dirty page ids in the engine (the per-page dirty dots in `useDirtyPages` already exist).
  - Send the full page list (ids and positions) for deletion detection, but `blocks` only for dirty pages.
  - Skip the `upsert` when a hash of `blocks` is unchanged.
  - Pass `{ timeout }` to `$transaction`.
- **Status:** VERIFIED in code. Payload size measured. **DB latency and timeout risk NOT RUNTIME VERIFIED.**

#### A18-3: Canvas hover re-renders the whole editor shell
- **Severity:** P2
- **File:line:**
  - `packages/editor/src/editor/canvas/Canvas.tsx:437-441` (emits `CANVAS_HOVER` on every change of `hoveredElementId`)
  - `packages/editor/src/editor/shell/StudioPanels.tsx:211, 357-367` (`setCanvasHoveredId`), `:486` (passed to `LeftSidebar`)
  - `packages/editor/src/editor/panels/layers/hooks/useLayerTree.ts:176-190`
- **Symbol:** `StudioPanels.canvasHoveredId`, `useLayerTree` auto-expand effect
- **Evidence:**
  - The hovered element id is stored as state in `StudioPanels`, which renders Canvas, ProInspector, AITab, PageTabBar, LeftSidebar, FullPageView and modals.
  - None of `Canvas` (only `forwardRef`), `ProInspector`, `PageTabBar`, `LeftSidebar`, `TabRouter`, the Layers `index` or `LayerTreeItem` is wrapped in `React.memo`. This was checked by grep.
  - In `useLayerTree`, every hover change calls `setExpandedIds(prev => new Set(prev)+ancestors)`. It never returns `prev`, so every hover re-renders the tree even when nothing new was expanded. The persistence effect (`:160-163`) then writes the Set to `localStorage`.
- **Expected behavior:** hovering the canvas re-renders only the hover overlay and the one Layers row that is highlighted.
- **Root cause:** transient pointer state is lifted to the shell root. There are no memo boundaries and no equality bail-out.
- **Affected modules:** the whole editor shell, Layers, Inspector.
- **Recommendation:**
  - Keep hover in a ref-backed store read with `useSyncExternalStore` by Layers only.
  - Bail out in the expand updater when every ancestor is already present.
  - Add `React.memo` to `ProInspector`, `LeftSidebar` and `PageTabBar`.
- **Status:** VERIFIED in code. **Re-render count NOT RUNTIME VERIFIED.**

#### A18-4: The Layers tree is fully rebuilt and re-rendered on every mutation
- **Severity:** P2
- **File:line:**
  - `packages/editor/src/editor/panels/layers/hooks/useLayerTree.ts:54-107` (`buildLayersFromEngine`), `:136-156` (7 events, including both `PROJECT_CHANGED` and `ELEMENT_UPDATED`)
  - `packages/editor/src/editor/panels/layers/index.tsx:440-470`
  - `packages/editor/src/editor/panels/layers/LayerTreeItem.tsx:49`
- **Symbol:** `buildLayersFromEngine`, `LayerTreeItem`
- **Evidence:**
  - Each mutation emits `ELEMENT_UPDATED` and then `PROJECT_CHANGED` (probe: 1 each per `setStyle`). Both call `buildLayersFromEngine`, which walks the whole page. For text nodes it also runs two regexes over the content (`previewOf`). It creates new `LayerItem` objects for every node.
  - `LayerTreeItem` is a plain `React.FC`, rendered recursively. It takes `expandedIds`, `dragState`, `selectedIds`, `canvasHoveredId` and more than 20 callbacks. Even with memo, those global props would break it.
  - There is no virtualization. The only use of `react-window` is `VersionList.tsx`.
- **Expected behavior:** one rebuild per frame at most. Unchanged rows keep their identity and do not re-render. Large trees are virtualized.
- **Root cause:** a coarse "rebuild everything" subscription and a recursive, prop-drilled tree.
- **Affected modules:** Layers panel, and `StructurePopover` if it uses the same data (not checked).
- **Recommendation:**
  - Coalesce the rebuild with rAF (as `useCanvasSync` already does).
  - Rebuild only the subtree of the changed element and reuse the others.
  - Flatten the visible rows and virtualize them with `FixedSizeList`.
  - Give each row derived booleans (`isSelected`, `isExpanded`) instead of the global sets.
- **Status:** VERIFIED in code. **Render cost NOT RUNTIME VERIFIED.**

#### A18-5: The publish SSE stream sends the entire deploy payload on every tick
- **Severity:** P2
- **File:line:** `packages/dashboard/app/api/sse/publish/[jobId]/route.ts:37, 54, 71, 84`. Compare `server/services/publish.service.ts:392-408` and `prisma/schema.prisma` (`PublishBuildJob.log`: "The deploy payload — { pages: {path,html}[] }").
- **Symbol:** `GET /api/sse/publish/[jobId]`
- **Evidence:**
  - `prisma.publishBuildJob.findUnique({ where: { id: jobId } })` has no `select`, so it loads `log`, which holds all page HTML from `startPublish` onward (`publish.service.ts:340`).
  - It runs once, then **every 1000 ms**.
  - `send("status", job)` / `send("status", updated)` serializes the whole row on connect and on every status or progress change.
  - The tRPC equivalent says "NEVER return the `log` column to clients: it holds the raw page HTML payload" and uses an explicit `select`.
  - The consumer is `lib/hooks/use-publish-sse.ts`, used by `components/publish/publish-progress.tsx`.
- **Expected behavior:** progress events of a few hundred bytes, and a DB read of only the status columns.
- **Root cause:** the SSE route was written separately from `getPublishStatus` and does not reuse its select.
- **Affected modules:** dashboard Publish progress, DB load during publish.
- **Recommendation:** call `getPublishStatus(jobId)`, or copy its `select`, both for the initial read and inside the interval.
- **Status:** VERIFIED in code. **Byte counts NOT RUNTIME VERIFIED.** See Overlaps for the authorization side.

#### A18-6: The media grid loads full-size originals, and hydration re-renders once per asset
- **Severity:** P2
- **File:line:**
  - `packages/editor/src/engine/media/MediaManager.ts:566-644` (`importServerAssets`: `src: sa.url`, no `thumbnailSrc`, then `await this.persist(asset); …; this.emit(MEDIA_ADDED, asset)` for each asset)
  - Thumbnails are generated only on local upload (`:1065-1067`)
  - `packages/editor/src/editor/sidebar/tabs/media/components/AssetCell.tsx:145-150` (`src={item.thumb || item.src}`)
  - `packages/editor/src/editor/sidebar/tabs/media/hooks/useLibraryState.ts:73-104`
  - `packages/editor/src/editor/shell/hooks/useMediaManager.ts:44-55`
  - `MediaManager.getAssets:1379-1404` (copy, filter, sort)
- **Symbol:** `importServerAssets`, the `reload` listeners
- **Evidence:**
  - Every asset hydrated from the server shows its original URL in a small tile. `loading="lazy"` is present, so offscreen tiles are deferred, but each visible tile still downloads the full file.
  - Pages are 200 assets (`BuildrikSyncProvider.ts:52`).
  - The awaited IndexedDB write between emits stops React from batching, so each emit is its own render. Each render also copies and sorts the whole list (`[...getAssets()]`).
- **Expected behavior:** tiles use a thumbnail a few KB in size. Hydration triggers one render per page of assets.
- **Root cause:** there is no server-side thumbnail pipeline, and the emitter fires once per item.
- **Affected modules:** Media Quick (MediaTab), Full Media (LibraryManager and MediaLibraryPanel), and the dashboard `media-library.tsx:317` (`<img src={a.url}>`, no lazy loading).
- **Recommendation:**
  - Store or derive a thumbnail URL at upload time, using an image transform or a resized blob.
  - In `importServerAssets`, persist in bulk and emit one `MEDIA_ADDED_BATCH`, or suspend emits until the loop ends.
- **Status:** VERIFIED in code. **Network bytes and render counts NOT RUNTIME VERIFIED.** It is a PRODUCT DECISION whether a resize service is in scope.

#### A18-7: Version hydration is N+1 on every editor open
- **Severity:** P2
- **File:line:** `packages/editor/src/services/versionSync.ts:88-124`; `packages/editor/src/editor/shell/hooks/useVersionSync.ts:38`; `server/services/site-version.service.ts:13` (`MAX_VERSIONS_PER_SITE = 50`, and named versions never prune)
- **Symbol:** `hydrateVersionsFromServer`
- **Evidence:**
  - `list.query`, then `for (const r of remote) { … await client().siteVersions.get.query(...) ; await saveVersion(...) }`.
  - Each `get` returns a full project snapshot.
  - It runs eagerly on mount, whether or not History is ever opened.
- **Expected behavior:** version metadata loads with the list, and payloads load on demand.
- **Root cause:** the local IndexedDB store is treated as the source of truth and is filled eagerly.
- **Affected modules:** History / VersionHistoryPanel, editor boot bandwidth.
- **Recommendation:**
  - Keep only list rows locally.
  - Fetch the payload when a version is previewed or restored.
  - If eager fetching stays, parallelize it with a concurrency cap and defer it until after first paint and project load.
- **Status:** VERIFIED in code. **NOT RUNTIME VERIFIED.**

#### A18-8: Rarely used heavy libraries are in the always-loaded editor chunk
- **Severity:** P2
- **File:line:**
  - `packages/editor/src/editor/shell/hooks/useExportHandlers.ts:27` (static `ExportEngine` → `jszip` in `ExportEngine.ts:7` and `ReactExporter.ts:7`)
  - `packages/editor/src/engine/Composer.ts:45` → `interactions/InteractionManager.ts:15` → `InteractionRuntime.ts:10` → `animations/GSAPEngine.ts:9` (`gsap`)
  - `packages/editor/src/editor/inspector/sections/interactions/types.ts:6` (value import of `GSAPEngine`)
  - `packages/editor/src/editor/shell/StudioModals.tsx:14-15` (`ExportModal`, `ImageEditorModal` → `react-easy-crop`)
- **Symbol:** static import graph
- **Evidence:**
  - Measured Vite build: main chunk 2,223.71 kB min / 652.30 kB gzip.
  - The chunk contains the `JSZip`, `gsap` and `react-easy-crop` identifiers.
  - Code that is correctly split: `html2canvas` (dynamic import, own 201 kB chunk), Sentry (own chunk), and 12 sidebar tabs via `React.lazy` (`TabRouter.tsx:35-52`).
- **Expected behavior:** export, interaction preview and image editing load their libraries on first use.
- **Root cause:** hook- and engine-level static imports pull these libraries into the shell graph.
- **Affected modules:** editor first load (`/edit/[siteId]`).
- **Recommendation:**
  - Use `await import("@/engine/export")` inside the export handlers.
  - Have `InteractionRuntime` import GSAP dynamically on `start()`.
  - Use `React.lazy` for `ExportModal` and `ImageEditorModal`.
  - Run `@next/bundle-analyzer` on the real Next build to set a budget.
- **Status:** PARTIAL. Measured on the Vite standalone build. **The Next production chunking was NOT measured.**

#### A18-9: Realtime collab rebuilds the editor for each remote op and stores cursor moves (flag-off)
- **Severity:** P2 while `FEATURE_COLLAB` is off. P1 if collaboration ships.
- **File:line:**
  - `packages/editor/src/engine/HistoryManager.ts:331-346` (`applyRemoteOperation` → `applyPatch` → `deepClone` → `composer.importProject(newState)`)
  - `packages/editor/src/editor/canvas/hooks/useCursorSync.ts` (50 ms throttle)
  - `packages/editor/src/engine/collaboration/CollaborationManager.ts:255-266`
  - `packages/editor/src/engine/collaboration/SSETransport.ts:86-99`
  - `packages/dashboard/app/api/collab/[siteId]/ops/route.ts` (`auth()`, `checkSiteRole`, `appendCollabOp`, no body size limit)
  - `server/services/collab.service.ts:10,41-48` (`MAX_BATCH = 200`)
  - `packages/dashboard/app/api/sse/collab/[siteId]/route.ts:66` (1.5 s poll)
- **Symbol:** `applyRemoteOperation`, `updateCursor`, `SSETransport.send`
- **Evidence:**
  - `importProject` emits only `PROJECT_LOADED`. Its 17 subscribers include the full canvas sync, the Layers rebuild, Pages, CommentLayer, LinkSection and template usage.
  - Cursor events go through the same `broadcast` → `fetch POST` path as document ops. Each becomes a `CollabOperation` row.
  - Good news: remote cursor updates are handled inside `RemoteCursorsOverlay` (`:108-160`) and `useCollaboration` has a no-change bail (`:127-134`), so **presence does not re-render the whole editor**.
- **Expected behavior:**
  - Remote ops patch the tree in place.
  - Presence is ephemeral: it is not stored and is capped per second.
  - Op bodies are size-capped.
- **Root cause:** the DB-backed op log is used for every realtime signal, and remote apply goes through the import path.
- **Affected modules:** Collaboration, Presence, Canvas, Layers, DB.
- **Recommendation:** part of the A16 redesign (product decision 1 there). If the current transport is kept:
  - add a separate presence endpoint with no DB write;
  - enforce a server-side `content-length` cap;
  - apply remote patches without `importProject`.
- **Status:** VERIFIED in code. **NOT RUNTIME VERIFIED.** It is a flag-off path.

### P3

- **A18-10: CMS N+1 hydration and unbounded tables.**
  - **Hydration:** `cmsSync.ts:125-160` makes one sequential `cms.entries.list` per collection, then one sequential IndexedDB `saveContentItem` per entry.
  - **Unbounded query:** `cms.service.ts:78-81` (`listEntries`) has no `take`.
  - **Unbounded table:** `CMSRecordsModal.tsx:104-141,395` renders every item.
  - **Recommendation:** batch or lazy hydration, server paging, a virtualized table.
  - **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

- **A18-11: High-frequency state at the editor root.**
  - `saveState` (`useStudioState.ts:257`) flips to "saving" and then "saved" on every autosave.
  - `usePublishJob` (instantiated in `useExportHandlers.ts:57` at the AquibraStudio root) calls `setStatus` every 2 s while a publish runs (`usePublishJob.ts:155-177`).
  - With no memo boundaries (A18-3), each of these re-renders the whole editor.
  - **Recommendation:** move them into a small external store read by the topbar and the Publish tab.
  - **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

- **A18-12: Dashboard over-fetching.**
  - The `QueryClient` sets no `staleTime` (`lib/trpc/client.tsx:88-107`), so every query refetches on mount and window focus.
  - Media library search is bound straight to the query key (`media-library.tsx:196`), so each keystroke sends a request.
  - "Load more" grows `limit` (`:356`), so every click re-downloads the whole list.
  - **Recommendation:** a default `staleTime`, a 250 ms debounce, `useInfiniteQuery` with `cursor`.
  - **Status:** VERIFIED in code.

- **A18-13: Notifications SSE reconnect storm.**
  - `use-notification-sse.ts:20-25` closes and reconnects after a fixed 5 s on any error, including the route's 401 (`sse/notifications/route.ts:9-11`), with no backoff or jitter.
  - Each open tab keeps one stream and runs a `notification.count` every 5 s (it is indexed on `[userId, read]`, so the query is cheap).
  - **Recommendation:** backoff with jitter, stop on 401, share one stream across tabs.
  - **Status:** VERIFIED in code. **Host connection limits NOT RUNTIME VERIFIED.**

- **A18-14: Small per-mutation listener costs.** Each is O(n), and together they add to A18-1 and A18-4.
  - `LinkSection.tsx:83-96`: `setPages(getAllPages())` on every `PROJECT_CHANGED`.
  - `useTemplateUsageMap.ts:40-50`: rebuild plus `setTick` on every `PROJECT_CHANGED`.
  - `CommentLayer.tsx:187` + `:265-305`: a debounced orphan scan with `querySelectorAll` over the canvas after every edit, even with comment mode off.
  - `Composer.beginTransaction`: `deepClone(exportProject())` for each outermost transaction.
  - `useCursorSync.handleMouseMove`: `getBoundingClientRect()` on every mousemove before `updateCursor` checks `isConnected()`, so it runs with collab off too.
  - **Recommendation:** filter on the `payload.type` discriminator (as `usePages` does), gate on `comments.length`, check the connection first.
  - **Status:** VERIFIED in code.

- **A18-15: Full scan for traffic sort.**
  - With `sort === "traffic" || hasTraffic`, `sites.service.ts:79-86` drops `skip/take` and loads every workspace site with 30 days of `analytics` rows, then paginates in memory.
  - **Recommendation:** aggregate in SQL, or store `visitors30d` from the analytics cron.
  - **Status:** VERIFIED in code.

---

## Good as-is

These were verified in code and should not be "fixed":

**Canvas and engine**
- `useCanvasSync` coalesces bursts of `PROJECT_CHANGED` to one sync per animation frame, so drag ticks do not pile up.
- `canvasInnerHtml` is memoized on the string, so unrelated state updates such as `setIsDragOver` do not rewrite `innerHTML` (`Canvas.tsx:492-503`).
- Token-usage recompute is coalesced per microtask (`Composer.ts:330-346`).
- History is diff-based: JSON patches, a checkpoint every 10 entries, 100 entries max (`HistoryManager.ts:82-83`, `config.ts:108`). Recording is coalesced over 500 ms.
- Canvas inline text editing commits on finish, not per keystroke (`useCanvasInlineEdit.ts:133-146`).

**Code splitting**
- The editor is loaded with `next/dynamic` from exactly one importer (`EditorClient.tsx:8-9`).
- 12 sidebar tabs and 3 full-page views are lazy (`TabRouter.tsx:35-52`, `FullPageRouter.tsx:18-22`).
- `html2canvas` and Sentry are in their own lazy chunks.

**Lists and media**
- The version list is virtualized with `react-window` (`VersionList.tsx:33,380`).
- Media is paged by cursor at 200 per page and sends search to the server (`BuildrikSyncProvider.ts:52`, `loadServerMedia`).
- Grid tiles use `loading="lazy"`.

**Realtime**
- Remote cursors re-render only `RemoteCursorsOverlay`.
- `useCollaboration`'s 2 s stats poll skips the update when nothing changed.

**Layers drag**
- Layers `dragover` returns `prev` when the target and position are unchanged (`panels/layers/index.tsx:263-266`).

**Server and DB**
- Retention caps exist: publish job payloads are pruned to 20 per site (`publish.service.ts:459-472`), and site versions are capped at 50 auto-saves (`site-version.service.ts:13`). The collab op log is pruned on a fixed cadence of every 50th op (`collab.service.ts:32-37`).
- The polled tables are indexed: `Notification[userId, read]`, `CollabOperation[siteId, seq]`, `CmsEntry[collectionId, status]`.
- `getPublishStatus` uses an explicit `select`, and the editor's publish polling uses it.
- The publish SSE route stops at 10 minutes (`MAX_LIFETIME_MS`).

---

## Product decisions required

1. **Supported document size (performance budget).** There is no stated maximum for elements per page, pages per site, media per site or CMS entries per collection. A18-1, A18-2, A18-4, A18-6 and A18-10 all grow with these numbers. Choose target sizes, for example 2k elements per page, 50 pages and 1k assets, and a per-edit frame budget. Then these findings can be ranked against the targets.
2. **Media thumbnails.** Generating resized thumbnails (server-side, a Blob transform or a third-party resize service) has a cost and a hosting choice. Until one is chosen, A18-6 can only be mitigated.
3. **Collaboration transport.** Whether collab ships decides whether A18-9 is P2 or P1. It is part of the A16 decision 1 redesign.
4. **Version history locality.** Should the editor keep a local IndexedDB copy of every server version (the current design) or only metadata (A18-7)?

---

## Overlaps with other audits

- **Agent F (Security), candidate for a ruling:** the publish SSE route checks access differently from its tRPC twin.
  - `app/api/sse/publish/[jobId]/route.ts:40-43` checks only `workspaceMember.findFirst({ workspaceId, userId })`. It has **no `status: "ACTIVE"` filter**, so a SUSPENDED member (`team.service.ts:180`) passes, and **no site scope** (`SitePermission`).
  - It then streams the full `log`, which is the deploy HTML.
  - `sites.publishStatus` uses `assertSiteAccess` (ACTIVE plus site scope, in `permission.service.ts:62-81`) and leaves `log` out.
  - Exploiting this needs a job id (a cuid), and the payload is headed for public deploy, which is why it is not rated P0 here. F should decide whether it is a permission bypass (P0 or P1). Password-protected sites are the case to check.
- **Agent D / A16:** A18-9 is the performance side of A16-5 (replay and snapshot storm), A16-10 (SSE poll leak) and A16-13 (no outbox). The DB-backed cursor traffic in the inventory is confirmed: cursor moves really are written as `CollabOperation` rows.
- **Agent G / Prompt 14 (functional wiring):** the dashboard media library's "Load more" breaks after 8 clicks.
  - `PAGE_SIZE = 24` and `limit` grows by 24 (`media-library.tsx:26,356`), but `listAssetsSchema.limit` is `.max(200)` (`packages/shared/schemas/media.ts:52`).
  - The 9th click sends `limit: 216`, the input fails validation and the grid errors.
  - Found in code, NOT RUNTIME VERIFIED.
- **Agent E / Prompt 17:** the lack of memo boundaries and the root-level state (A18-3, A18-11) are really a state-architecture issue: there is no shared store with selector subscriptions. The fix belongs with the Prompt 17 findings.
- **Inventory correction:** the editor's Publish progress **polls** (`usePublishJob.ts:25,177`, every 2 s). Only the dashboard's `publish-progress.tsx` uses the publish SSE, and it falls back to 2 s polling.

---

## AUDIT HANDOFF
- **Agent / Prompt:** E, Engineering Architecture / Prompt 18: Frontend + Realtime Performance
- **Report:** `docs/audits/2026-09-25-full-audit/18-performance.md`
- **Counts:** P0 = 0 · P1 = 1 · P2 = 8 · P3 = 6
- **P0:** none. A18-5's authorization side is handed to F as a candidate (see Overlaps).
- **P1:**
  - A18-1: every edit re-serializes the whole page, parses it twice more and replaces the entire canvas DOM. The cost grows with page size (8.3 ms `toHTML` at 1.5k elements in jsdom).
- **P2:**
  - A18-2: autosave rewrites every page, one query after another, in one transaction with the default timeout.
  - A18-3: hover state at the shell root, and no memo boundaries.
  - A18-4: the Layers tree is rebuilt twice per mutation and rendered without virtualization.
  - A18-5: publish SSE sends the full deploy HTML (`log`) and reads it every second.
  - A18-6: full-size originals in media tiles, and one render per asset during hydration.
  - A18-7: N+1 full-snapshot version hydration on every open.
  - A18-8: jszip, gsap and react-easy-crop in the eager 2.2 MB editor chunk.
  - A18-9: collab re-imports the project for each remote op and writes cursor moves to the DB (flag-off).
- **P3:**
  - A18-10: CMS N+1, unbounded lists.
  - A18-11: save and publish state at the root.
  - A18-12: dashboard `staleTime` 0, no search debounce, "load more" refetches everything.
  - A18-13: SSE reconnect storm.
  - A18-14: small per-mutation listeners.
  - A18-15: traffic-sort full scan.
- **Runtime verified:**
  - The engine probe, with a real Composer in jsdom: 1 `PROJECT_CHANGED` and 1 `ELEMENT_UPDATED` per `setStyle`; `toHTML` 1.62 / 8.26 ms; `deepClone(exportProject)` 1.11 / 5.49 ms; HTML 50.6 / 252.6 KB; save payload 75.7 / 376.4 KB, at 301 / 1,501 elements.
  - The Vite standalone bundle build: main chunk 2,223.71 kB / 652.30 kB gzip.
- **NOT RUNTIME VERIFIED:**
  - All browser frame and re-render costs (A18-1, 3, 4, 6, 11, 14).
  - The Next production bundle (A18-8).
  - DB timings and transaction timeouts (A18-2, 10, 15).
  - SSE byte volumes and host connection limits (A18-5, 13).
  - Every collab path (A18-9, flag-off).
- **Dependencies:**
  - A18-1's incremental patch path should land before, or together with, A18-4, which uses the same per-element events.
  - A18-3 and A18-11 share one fix (a selector store plus memo boundaries) with Prompt 17.
  - A18-9 depends on A16 product decision 1.
  - A18-2 overlaps the save path of A16-1 and A07-6. Fix them in the same batch so that dirty-page saving does not change conflict semantics.
- **Required tests (for G):**
  - `toHTML` is called at most once per frame per `setStyle`, and a single-element style change does not replace sibling DOM nodes (A18-1).
  - A save after editing page 1 of 5 upserts one page's `blocks` (A18-2).
  - Hovering an already-expanded ancestor chain does not change `expandedIds` identity (A18-3).
  - One `buildLayersFromEngine` per mutation (A18-4).
  - The publish SSE `status` event has no `log` key (A18-5).
  - `importServerAssets(200)` emits one batch event (A18-6).
  - `hydrateVersionsFromServer` makes no `get` calls before History opens (A18-7).
  - A bundle-size budget gate on the editor chunk (A18-8).
  - A dashboard media "load more" past 200 (overlap).
- **Inventory corrections:**
  - Editor publish progress is polling, not SSE.
  - Collab cursor updates are persisted as `CollabOperation` rows (confirmed).
  - Presence does **not** trigger full editor re-renders; the cursor overlay handles its own updates.
- **Suggested next owners:**
  - **E:** A18-1, A18-3, A18-4, A18-8, A18-11, A18-14.
  - **E + backend:** A18-2, A18-5, A18-7, A18-10, A18-12, A18-15.
  - **D:** A18-9.
  - **F:** the publish SSE authorization overlap.
  - **G:** the tests above and the media load-more overlap.
  - **Orchestrator:** product decisions 1 to 4.
