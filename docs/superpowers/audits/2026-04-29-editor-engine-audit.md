# Editor Engine Audit — 2026-04-29

**Scope:** `packages/editor/src/engine/` (~154 TypeScript files)  
**Tracks:** Performance (P), Duplication (D), Business Logic (BL)  
**Severity:** Critical / High / Medium / Low / Info

---

## Summary

| Severity | P | D | BL | Total |
|----------|---|---|---|-------|
| Critical | 1 | 0 | 2 | 3 |
| High     | 4 | 2 | 5 | 11 |
| Medium   | 6 | 5 | 6 | 17 |
| Low      | 3 | 2 | 3 | 8 |
| Info     | 1 | 1 | 1 | 3 |
| **Total**| 15| 10| 17| 42 |

---

## Critical

### [BL-1] InteractionRuntime leaks window/global event listeners on stop()
**File:** `packages/editor/src/engine/interactions/InteractionRuntime.ts` (lines 200-235)  
**Severity:** Critical

`setupTrigger` registers `window.addEventListener("scroll", ...)` and `window.addEventListener("beforeunload", ...)` for `"page-scroll"`, `"page-leave"`, and `"while-scrolling"` triggers, but stores the handler reference via `this.addListener(element, "__page-scroll", handler)`. `addListener` calls `element.addEventListener(type, handler)`, **not** `window.addEventListener`. When `stop()` iterates `this.listeners` and calls `element.removeEventListener(type, handler)`, it removes a listener that was never registered on the element, while the real window listener remains alive.

**Impact:** Every start/stop cycle leaks window scroll and beforeunload listeners. In a long editing session this causes jank and memory growth.

**Fix:** Track window-level listeners in a separate `Map<eventType, handler>` and remove them explicitly in `stop()`.

---

### [BL-2] MediaManager.deleteAsset revokes blob URL before confirming storage deletion
**File:** `packages/editor/src/engine/media/MediaManager.ts` (lines 425-438)  
**Severity:** Critical

`deleteAsset` awaits `this.storage.deleteAsset(id)`, then filters state arrays, then revokes the Object URL. If `storage.deleteAsset` throws after the IndexedDB transaction commits but before the function returns (e.g., quota error during metadata cleanup), the local state is mutated but the blob URL may still be referenced by canvas elements, leading to a broken image.

**Impact:** Asset appears deleted in UI but still referenced by canvas; re-uploading with same ID causes collision.

**Fix:** Wrap the entire sequence (storage delete + state mutation + URL revoke) in a single try/catch that rolls back state on failure.

---

### [BL-3] OTEngine.applyRemoteOperation filters own pending ops by seq only, not userId
**File:** `packages/editor/src/engine/collaboration/OTEngine.ts` (line 219)  
**Severity:** Critical

Inside the `if (remoteOp.id.userId === this.userId)` branch, the pending-ops filter is:

```ts
this.state.pendingOps = this.state.pendingOps.filter(
  (op) => op.id.seq !== remoteOp.id.seq
);
```

It does not also check `op.id.userId === this.userId`. Although the outer branch already confirmed `remoteOp.id.userId === this.userId`, if two users share a seq number (possible with independent localSeq counters), this could incorrectly remove another user's pending op from the local queue.

**Impact:** Lost local operations in multi-user sessions; state divergence.

**Fix:** Filter by both `userId` and `seq`:
`op.id.userId === remoteOp.id.userId && op.id.seq !== remoteOp.id.seq`.

---

## High

### [P-1] OTEngine.transform is O(n*m) with no fast-path for disjoint paths
**File:** `packages/editor/src/engine/collaboration/OTEngine.ts` (lines 255-315)  
**Severity:** High

For every local op, the code iterates all remote ops to check path conflicts. In documents with many concurrent array ops (e.g., CMS repeater with 50 items), this is quadratic. The existing fast paths only catch exact same-path replace/add.

**Impact:** Lag during real-time collaboration on large pages.

**Fix:** Pre-index remote ops by path prefix in a Map/Trie so only potentially conflicting ops are checked.

---

### [P-2] MediaManager state uses linear search instead of Map
**File:** `packages/editor/src/engine/media/MediaManager.ts` (lines 138, 462, etc.)  
**Severity:** High

`this.state.assets` is an array. `getAssetSrc`, `getAsset`, `updateAsset`, `deleteAsset` all do `O(N)` `.find()` or `.filter()` scans. A media library with 500+ assets makes every lookup expensive.

**Impact:** Slow asset panel, laggy drag-and-drop, blocked main thread during gallery scroll.

**Fix:** Maintain a `Map<string, MediaAsset>` in parallel to the array, or replace the array entirely.

---

### [P-3] ImageProcessor.applyEditState serializes intermediate results as data URLs
**File:** `packages/editor/src/engine/media/ImageProcessor.ts` (lines 181-211)  
**Severity:** High

Each editing step (crop, rotate, flip, filters, adjustments) creates a full canvas, draws, and exports to `data:image/png`. For a 3000x2000 image, this allocates ~24 MB per step. Five steps = ~120 MB of transient base64 strings.

**Impact:** Out-of-memory crashes on mobile or large images; GC pauses.

**Fix:** Keep the canvas alive across operations, mutating the same 2D context, and only export at the end.

---

### [P-4] GlobalStyleManager.updateElementsUsingStyle walks entire element tree
**File:** `packages/editor/src/engine/styles/GlobalStyleManager.ts` (lines 322-358)  
**Severity:** High

On every global style update, it recurses from root through every element to find those referencing the style ID. No early exit, no index.

**Impact:** Updating a global color token on a 500-element page freezes the UI.

**Fix:** Maintain an inverse index `Map<styleId, Set<elementId>>` updated when `applyToElement` is called.

---

### [BL-4] RecoveryManager leaks document visibilitychange listener
**File:** `packages/editor/src/engine/recovery/RecoveryManager.ts` (lines 25-33)  
**Severity:** High

`setupRecoveryListeners` adds `document.addEventListener("visibilitychange", ...)`. `destroy()` has a comment claiming "Event listeners will be cleaned up by browser", which is false for `addEventListener`.

**Impact:** Leaked listener fires after RecoveryManager is destroyed, causing spurious recovery attempts on unrelated pages.

**Fix:** Store listener reference and call `document.removeEventListener` in `destroy()`.

---

### [BL-5] SyncManager fires async handlers without awaiting
**File:** `packages/editor/src/engine/sync/SyncManager.ts` (lines 287-309)  
**Severity:** High

`handleOnline`, `handleProjectSave`, and `processQueue` all call async functions (`this.processQueue()`, `this.push()`, `offlineQueue.enqueue()`) without `await`. Rapid online/offline toggles cause overlapping syncs and race conditions.

**Impact:** Duplicate cloud pushes, conflict storms, corrupted offline queue.

**Fix:** Make handlers `async`, `await` the async calls, and guard with an `isSyncing` flag.

---

### [BL-6] RecoveryManager mutates Composer internals via duck-typed cast
**File:** `packages/editor/src/engine/recovery/RecoveryManager.ts` (lines 101-107)  
**Severity:** High

```ts
const context = this.composer.elements as unknown as { buildElementTree: ... };
context.buildElementTree(newRootData);
page.root = newRootData;
```

This bypasses the Composer API contract. `buildElementTree` is not a public method of `ElementManager`. Direct mutation of `page.root` skips slug-history tracking, router re-registration, and emission of `PROJECT_CHANGED`.

**Impact:** Recovered pages may have broken routing, missing undo history, and stale UI.

**Fix:** Route recovery through `composer.elements.createPage` or add a `composer.recoverPageRoot()` API.

---

### [D-1] Four identical IndexedDB promise wrappers duplicated
**Files:**
- `packages/editor/src/engine/media/IndexedDBAdapter.ts`
- `packages/editor/src/engine/storage/VersionHistoryStorage.ts`
- `packages/editor/src/engine/sync/OfflineQueue.ts`
- `packages/editor/src/engine/storage/StorageAdapter.ts`
**Severity:** High

Each file repeats the same `indexedDB.open` → `request.onsuccess/onerror` → `new Promise` boilerplate. IndexedDB versioning, transaction wrapping, and error handling are copy-pasted with minor variations.

**Impact:** Bug fixes (e.g., missing `db.close()` on error) must be applied in four places. One file already leaks DB connections.

**Fix:** Extract a shared `IDBDatabase` wrapper in `engine/utils/` or `shared/utils/`.

---

### [D-2] Three identical `escapeHTML` implementations
**Files:**
- `packages/editor/src/engine/export/ExportHelpers.ts` (exported)
- `packages/editor/src/engine/export/SEOInjector.ts` (private method)
- `packages/editor/src/engine/export/FormspreeInjector.ts` (private method)
**Severity:** High

Same character-replacement logic (`& → &amp;`, `< → &lt;`, etc.) exists in three places. `ExportHelpers.escapeHTML` is already exported but not consumed by the other two.

**Impact:** Inconsistent escaping (e.g., SEOInjector handles `&#039;` while ExportHelpers uses `&#39;`). Future security fixes must touch three files.

**Fix:** Import `ExportHelpers.escapeHTML` everywhere; remove private duplicates.

---

## Medium

### [P-5] ExportEngine.calculateStats instantiates Blob objects just for size
**File:** `packages/editor/src/engine/export/ExportEngine.ts` (lines 315-323)  
**Severity:** Medium

```ts
htmlSize: new Blob([html]).size,
cssSize: new Blob([css]).size,
```

Creates actual Blob allocations in the renderer process for metrics that could be computed with `new TextEncoder().encode(html).length`.

**Impact:** Unnecessary memory churn during frequent preview/export cycles.

**Fix:** Use `TextEncoder` or simple string length (with UTF-8 byte-length helper).

---

### [P-6] MediaManager.getAssets rebuilds and sorts on every call
**File:** `packages/editor/src/engine/media/MediaManager.ts` (lines 466-491)  
**Severity:** Medium

`getAssets` copies the array (`[...this.state.assets]`), filters by folder/type/tags/search, then sorts. No memoization. Called on every gallery render.

**Impact:** O(N log N) cost on every React re-render of media panel.

**Fix:** Memoize by filter key, or maintain pre-filtered indexes.

---

### [P-7] TemplateManager JSON-stringifies filter for cache key
**File:** `packages/editor/src/engine/templates/TemplateManager.ts` (line 61)  
**Severity:** Medium

```ts
const cacheKey = JSON.stringify(filter || {});
```

Object key order is not guaranteed. Identical filters may produce different cache keys, and complex filters stringify slowly.

**Impact:** Cache misses and extra fetches.

**Fix:** Build a deterministic key from normalized filter fields.

---

### [P-8] InteractionRuntime.playAnimation creates new GSAP timeline per event
**File:** `packages/editor/src/engine/interactions/InteractionRuntime.ts` (lines 283-301)  
**Severity:** Medium

Every click/hover/scroll triggers `gsapEngine.createAnimation({ id: `${interaction.id}-${Date.now()}`, ... })`. No timeline reuse or pooling.

**Impact:** Rapid interactions (e.g., hover in/out) create many short-lived GSAP objects.

**Fix:** Cache active timelines by interaction ID and reuse or kill before creating new ones.

---

### [P-9] BoundsCalculator/SnapCalculator/SpacingCalculator all subscribe to same events with same handler
**Files:**
- `packages/editor/src/engine/canvas/indicators/BoundsCalculator.ts`
- `packages/editor/src/engine/canvas/indicators/SnapCalculator.ts`
- `packages/editor/src/engine/canvas/indicators/SpacingCalculator.ts`
**Severity:** Medium

All three constructors attach to `element:style-changed`, `element:children-changed`, `canvas:scrolled`, `viewport:resized` and all call `boundsCalculator.invalidateCache()`. If multiple calculators exist, the same event fires N invalidations.

**Impact:** Multiple cache invalidations and recalculations per frame.

**Fix:** Centralize invalidation in a single `CanvasIndicators` coordinator, or dedupe within a microtask.

---

### [P-10] StorageAdapter auto-save debounce doesn't cancel on destroy
**File:** `packages/editor/src/engine/storage/StorageAdapter.ts` (lines 47-56)  
**Severity:** Medium

The debounced handler is stored, but if `destroy()` is called while a debounced save is pending, the timer may still fire after teardown.

**Impact:** Attempts to call `this.composer.isDirty()` on a destroyed composer.

**Fix:** Track the debounce timer ID and clear it in `destroy()`.

---

### [P-11] RecoveryManager.recoverFromInactivity runs without debounce
**File:** `packages/editor/src/engine/recovery/RecoveryManager.ts` (lines 39-74)  
**Severity:** Medium

The `visibilitychange` listener fires immediately on every tab switch. If a user rapidly alt-tabs, recovery runs multiple times.

**Impact:** Redundant tree traversals and DOM queries.

**Fix:** Debounce `recoverFromInactivity` with a 500ms delay.

---

### [D-3] `loadImage` duplicated across ImageProcessorHelpers and MediaOptimizerHelpers
**Files:**
- `packages/editor/src/engine/media/ImageProcessorHelpers.ts` (line 144)
- `packages/editor/src/engine/media/MediaOptimizerHelpers.ts` (line 45)
**Severity:** Medium

Identical implementation: `new Image()`, `crossOrigin = "anonymous"`, `onload/onerror`, `img.src = src`.

**Fix:** Export from one file, import in the other.

---

### [D-4] Element-to-HTML conversion logic duplicated in ExportEngine and ReactExporter
**Files:**
- `packages/editor/src/engine/export/ExportEngine.ts` (lines 167-220, 521-566)
- `packages/editor/src/engine/export/ReactExporter.ts` (lines 142-195)
**Severity:** Medium

Both files walk ElementData recursively, handle self-closing tags, build attribute strings, and escape content. Divergence risks: ReactExporter handles JSX attribute mapping; ExportEngine handles form injection. The shared tree-walking logic should be unified.

**Fix:** Extract a shared `elementDataToMarkup(element, format: "html" | "jsx")` walker.

---

### [D-5] `toDataURL("image/png")` hardcoded in six ImageProcessor methods
**File:** `packages/editor/src/engine/media/ImageProcessor.ts` (lines 79, 98, 117, 133, 153, 172)  
**Severity:** Medium

Every operation hardcodes `"image/png"`. If a future requirement wants lossless WebP, six edits are needed.

**Fix:** Define `DEFAULT_EXPORT_FORMAT = "image/png"` as a module constant.

---

### [D-6] Transaction begin/end/rollback pattern duplicated in PageManager, HTMLParser, MediaCommandLayer
**Files:**
- `packages/editor/src/engine/elements/manager/PageManager.ts`
- `packages/editor/src/engine/elements/manager/HTMLParser.ts`
- `packages/editor/src/engine/media/MediaCommandLayer.ts`
**Severity:** Medium

Each file repeats:
```ts
this.composer.beginTransaction("name");
try { ... } finally { this.composer.endTransaction(); }
```

**Fix:** Create a `composer.runInTransaction("name", () => { ... })` helper on Composer.

---

### [D-7] Canvas indicator constructors subscribe to events but never unsubscribe
**Files:**
- `packages/editor/src/engine/canvas/indicators/SpacingCalculator.ts` (lines 26-29)
- `packages/editor/src/engine/canvas/indicators/SnapCalculator.ts`
**Severity:** Medium

Event listeners added in constructor are never removed. If the calculators are ever recreated (e.g., during project switch), old listeners accumulate.

**Fix:** Add `destroy()` methods that call `composer.off(...)` for each subscribed event.

---

### [BL-7] MediaCommandLayer.replaceAcross commits empty batch when no elements match
**File:** `packages/editor/src/engine/media/MediaCommandLayer.ts` (lines 164-231)  
**Severity:** Medium

If `findByMediaSrc` returns an empty array, `beginTransaction` is opened, the loop is skipped, and `endTransaction` is called on an empty batch. This creates an unnecessary undo checkpoint.

**Impact:** Clutters undo history with no-op entries.

**Fix:** Early-return before `beginTransaction` when `elements.length === 0`.

---

### [BL-8] OfflineQueue deduplication drops earlier ops of same project+type
**File:** `packages/editor/src/engine/sync/OfflineQueue.ts` (lines 164-167)  
**Severity:** Medium

```ts
this.queue = this.queue.filter(
  (existing) => !(existing.projectId === projectId && existing.type === type)
);
```

This keeps only the newest update per project, silently dropping intermediate state changes.

**Impact:** Data loss during offline editing.

**Fix:** Queue should append, not dedupe by type, or merge payloads rather than dropping.

---

### [BL-9] StorageAdapter.load/save catch-and-rethrow is useless
**File:** `packages/editor/src/engine/storage/StorageAdapter.ts` (lines 176-182, 196-202, etc.)  
**Severity:** Medium

Multiple methods have `try { ... } catch (error) { throw error; }` which adds no value and obscures stack traces.

**Fix:** Remove pointless catch blocks, or add logging/transformation.

---

### [BL-10] AssetBundler.rewriteUrls has substring collision risk
**File:** `packages/editor/src/engine/export/AssetBundler.ts` (lines 192-203)  
**Severity:** Medium

```ts
const regex = new RegExp(escapedUrl, "g");
result = result.replace(regex, asset.localPath);
```

If one URL is a substring of another (e.g., `image.png` and `large-image.png`), replacement order matters and shorter URLs may corrupt longer ones.

**Impact:** Broken links in exported ZIP.

**Fix:** Sort URLs by length descending before replacing, or use a proper HTML parser/tokenizer.

---

### [BL-11] FormspreeInjector.processHTML uses regex on HTML
**File:** `packages/editor/src/engine/export/FormspreeInjector.ts` (lines 80-113)  
**Severity:** Medium

Regex-based HTML mutation (`new RegExp(<form[^>]*id=["']${form.id}["'][^>]*)>`) is fragile. If the form tag has the id in a different position, or if the id appears inside other attributes, it may fail or match incorrectly.

**Impact:** Exported forms may lack action URLs or have malformed tags.

**Fix:** Parse HTML with a DOM parser, mutate the DOM, and serialize.

---

### [BL-12] MediaManager.getAssetSrc treats relative URLs as blob candidates
**File:** `packages/editor/src/engine/media/MediaManager.ts` (lines 148-150)  
**Severity:** Medium

```ts
if (asset.src.startsWith("http") || asset.src.startsWith("data:")) {
  return asset.src;
}
```

Relative paths like `/uploads/image.png` or `images/logo.png` fall through to IndexedDB blob lookup, which returns null, causing unnecessary fetch attempts.

**Impact:** Missing thumbnails for assets using relative paths.

**Fix:** Add `!asset.src.startsWith("/") && !asset.src.match(/^[a-zA-Z]/)` or similar check for relative URLs.

---

### [BL-13] Composer.destroy() listener hygiene incomplete for collaboration.off
**File:** `packages/editor/src/engine/__tests__/Composer.test.ts` (lines 116-125)  
**Severity:** Medium

The test verifies `collabOffSpy` is called for `operation:apply`, but there is no equivalent test ensuring `OTEngine.destroy()` is called when `Composer.destroy()` runs. If OTEngine's cleanup interval (10s) is active after Composer teardown, it may emit events into a dead composer.

**Impact:** Memory leak and console errors from stale interval callbacks.

**Fix:** Add explicit `otEngine.destroy()` call in `Composer.destroy()` and a corresponding test.

---

## Low

### [P-12] MediaOptimizer.previewCompression runs serially
**File:** `packages/editor/src/engine/media/MediaOptimizer.ts` (lines 144-161)  
**Severity:** Low

Five quality levels are optimized in a `for...of` loop. These are independent canvas operations.

**Impact:** Slow compression preview for large images.

**Fix:** Use `Promise.all` to run previews in parallel.

---

### [P-13] SitemapGenerator.generate() creates intermediate array
**File:** `packages/editor/src/engine/export/SitemapGenerator.ts` (lines 25-35)  
**Severity:** Low

```ts
const urls = pages.filter(...).map(...).join("\n");
```

Minor, but for 10k pages this allocates an intermediate array of 10k strings.

**Fix:** Use a generator or manual string building.

---

### [P-14] FontManager.getAllFonts rebuilds array from Map on every call
**File:** `packages/editor/src/engine/fonts/FontManager.ts` (lines 399-454)  
**Severity:** Low

`Array.from(this.fonts.values())` is cheap for small maps, but repeated filtering/sorting without memoization is wasteful.

**Fix:** Cache the sorted result and invalidate on mutation.

---

### [BL-14] HTMLParser.importHTMLToActivePage may create page with stale root reference
**File:** `packages/editor/src/engine/elements/manager/HTMLParser.ts` (lines 58-108)  
**Severity:** Low

If `oldRoot` exists, descendants are deleted, then `oldRoot` is deleted, then `page.root.children` is reassigned and `buildElementTree` is called. If `buildElementTree` throws, the finally block calls `endTransaction()`, but the page object has a partially mutated root with deleted children.

**Impact:** Inconsistent page state if import fails mid-way.

**Fix:** Build the new tree first, then atomically swap root references.

---

### [BL-15] VersionHistoryStorage.saveVersion double-opens database
**File:** `packages/editor/src/engine/storage/VersionHistoryStorage.ts` (lines 91-105)  
**Severity:** Low

`saveVersion` calls `writeVersion(version)` which opens DB, writes, and closes. On `QuotaExceededError`, it calls `loadVersions` (opens DB again), then `pruneVersions` (opens DB again), then `writeVersion` (opens DB again). That's four open/close cycles for one retry.

**Impact:** Unnecessary I/O overhead.

**Fix:** Keep DB connection open for the duration of the save call.

---

### [BL-16] ExportEngine.exportPageToHtml double-traverses element tree
**File:** `packages/editor/src/engine/export/ExportEngine.ts` (lines 413-456)  
**Severity:** Low

`renderPageElement` builds the HTML body, then `collectFormElements` walks the entire tree again to find forms. Could be done in a single pass.

**Impact:** Slightly slower multi-page export.

**Fix:** Collect forms during `renderPageElement` traversal.

---

### [D-8] `debounce` utility may not support async correctly
**File:** `packages/editor/src/engine/storage/StorageAdapter.ts` (line 48)  
**Severity:** Low

The debounced handler wraps an async `save()` call but `debounce` from `shared/utils/helpers` may not handle promise-returning functions or rejections correctly.

**Impact:** Unhandled promise rejection if auto-save fails.

**Fix:** Verify the debounce implementation handles async, or switch to a promise-aware debounce.

---

### [D-9] `generateId()` patterns scattered, some use `Date.now()` + `Math.random()`
**Files:**
- `packages/editor/src/engine/interactions/InteractionManager.ts` (line 268)
- `packages/editor/src/engine/templates/TemplateManager.ts` (line 375)
- `packages/editor/src/engine/media/MediaHelpers.ts` (line 181)
**Severity:** Low

Collision probability is low but non-zero under high-frequency generation (e.g., batch interaction creation). Other files use `generateId()` from shared utils.

**Fix:** Standardize on the shared `generateId` helper.

---

### [BL-17] MediaCommandLayer.setElementSrc emits wrong property name for background-image
**File:** `packages/editor/src/engine/media/MediaCommandLayer.ts` (lines 291-296)  
**Severity:** Low

Always emits `property: "src"` even when updating `background-image`.

**Impact:** Consumers listening to `element:style-updated` receive misleading property name.

**Fix:** Emit the actual changed property (`"src"` or `"background-image"`).

---

## Info

### [P-15] ExportEngine.elementToHTML and extractStyles are not memoized
**File:** `packages/editor/src/engine/export/ExportEngine.ts`  
**Severity:** Info

HTML/CSS generation is recomputed from scratch on every preview toggle. Acceptable for now, but worth caching.

---

### [D-10] `deepCloneValue` in JsonPatch could use structuredClone
**File:** `packages/editor/src/engine/utils/JsonPatch.ts` (line 346)  
**Severity:** Info

Modern browsers support `structuredClone`, which is faster and handles more types than the hand-rolled recursion.

**Fix:** Consider using `structuredClone` with a fallback.

---

### [BL-18] PageManager.getRouter uses duck typing instead of type-safe injection
**File:** `packages/editor/src/engine/elements/manager/PageManager.ts` (lines 357-370)  
**Severity:** Info

```ts
const router = (this.ctx.composer as unknown as { router?: unknown }).router;
```

The router is optional and discovered via runtime shape checks. A typed interface would be cleaner.

**Fix:** Add `router?: PageRouter` to Composer's public type.

---

## Appendix: Files Audited

All `.ts` files under `packages/editor/src/engine/` were read, including:

- Top-level: `Composer.ts`, `EventEmitter.ts`, `HistoryManager.ts`, `VersionHistoryManager.ts`, `HistoryFormatter.ts`, `PluginManager.ts`, `SelectionManager.ts`, `Viewport.ts`, `index.ts`
- AI: `CodeGenerator.ts`, `ContentWriter.ts`, `LayoutAnalyzer.ts`, `PageGenerator.ts`
- Animations: `GSAPEngine.ts`, `ScrollTriggerEngine.ts`, `TimelineManager.ts`
- Canvas: `AlignmentHandler.ts`, `ResizeHandler.ts`, `CanvasIndicators.ts`, `AutoLayoutManager.ts`, `GuideManager.ts`, `MeasurementManager.ts`, `SelectionIndicatorManager.ts`, `SnapCalculator.ts`, `BoundsCalculator.ts`, `SpacingCalculator.ts`, `ConstraintManager.ts`, `DOMUpdater.ts`, `HitTester.ts`, `ResizeInputManager.ts`, `ResizeOrchestrator.ts`, `SnapManager.ts`
- CMS: `CMSBindingManager.ts`, `CMSExportResolver.ts`, `CollectionManager.ts`, `CollectionStorage.ts`, `DataBindResolver.ts`, `ProductCollectionService.ts`, `RepeaterRenderer.ts`
- Collaboration: `CollaborationManager.ts`, `OTEngine.ts`, `OTTypes.ts`
- Commands: `CommandCenter.ts`, `KeybindingManager.ts`, `commandOperations.ts`, `defaultCommands.ts`
- Components: `ComponentInstance.ts`, `ComponentManager.ts`, `ComponentStorage.ts`, `ComponentVariantResolver.ts`, `ComponentInstances.ts`
- Data: `DataManager.ts`, `StyleDataBinding.ts`, `TemplateEngine.ts`, `TextDataBinding.ts`, `TraitDataBinding.ts`, `BaseBindingManager.ts`
- Drag: `DragManager.ts`
- Elements: `Element.ts`, `ElementChildren.ts`, `ElementOperations.ts`, `ElementSerialization.ts`, `ElementStyles.ts`, `PreviewLayer.ts`, `ElementManager.ts`, `ElementCRUD.ts`, `HTMLParser.ts`, `PageManager.ts`, `types.ts`, `index.ts`
- Export: `ExportEngine.ts`, `ReactExporter.ts`, `AssetBundler.ts`, `SEOInjector.ts`, `SitemapGenerator.ts`, `StripeInjector.ts`, `FormspreeInjector.ts`, `AnalyticsInjector.ts`, `ExportHelpers.ts`, `sanitizeHeadCode.ts`, `index.ts`
- Fonts: `FontManager.ts`
- Forms: `FormHandler.ts`
- History: `index.ts`
- Interactions: `InteractionManager.ts`, `InteractionRuntime.ts`, `types.ts`, `index.ts`
- Media: `MediaManager.ts`, `MediaCommandLayer.ts`, `MediaStorage.ts`, `MediaEventEmitter.ts`, `MediaHelpers.ts`, `MediaOptimizer.ts`, `MediaOptimizerHelpers.ts`, `ImageProcessor.ts`, `ImageProcessorHelpers.ts`, `IndexedDBAdapter.ts`, `MediaStorageTypes.ts`, `index.ts`
- Recovery: `RecoveryManager.ts`
- Routing: `PageRouter.ts`, `index.ts`
- Storage: `StorageAdapter.ts`, `VersionHistoryStorage.ts`
- Styles: `StyleEngine.ts`, `GlobalStyleManager.ts`, `index.ts`
- Sync: `SyncManager.ts`, `OfflineQueue.ts`
- Templates: `TemplateManager.ts`
- Utils: `JsonPatch.ts`, `Transforms.ts`, `index.ts`

And all 19 `__tests__` files co-located with source.
