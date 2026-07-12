# Editor PRD · Ch.05 — Engine (document core)

> Part of BUILDRIK-PRD-EDITOR v2.0 · `main` @ `e5624ca1` · 2026-07-07 · base `packages/editor/src/`

## 5.0 Orientation

Headless document core; `Composer.ts` orchestrates ~30 managers; `EventEmitter` is the only engine→UI path (`engine/AGENTS.md:1-14`). **Brand naming split**: code "Aquibra", DOM/data attrs "buildrick", user-facing "Buildrik" (`shared/constants/config.ts:18`, `engine/styles/StyleEngine.ts:51`).

## 5.1 Document model

- **ElementData** (serialized node): id, type, tagName?, attributes?, classes?, styles?, breakpointStyles?, content?, children?, traits?, draggable?, droppable?, resizable?, locked?, data?, dataBindings? (`shared/types/element.ts:34-67`). Live tree = `Element` class instances w/ 4 delegates (Styles/Children/Operations/Serialization — 500-line file limit, `engine/elements/Element.ts:27-91`). Registry = flat `Map<id, Element>`; live instances are SSOT, `root` data reconstructed on export (`ElementManager.ts:26-29`, `manager/PageManager.ts:367-377`). ⚠ `buildElementTree` **mutates input** — history must clone around it (`ElementManager.ts:290-311`). animation/interactions stashed in `data` bag, not first-class (`ElementOperations.ts:181-244`).
- **PageData**: id, name, slug?, isHome?, root, styles?, settings?, meta?, updatedAt?, slugManuallySet?, slugHistory? (`shared/types/project.ts:122-155`). Root always `container/div.buildrick-page-root` (`PageManager.ts:70-75`). Insertion-ordered Map = page order (`:100-103,321-340`). PageManager syncs 3 sources per mutation: Map + router + typed `PROJECT_CHANGED` (`:4-10`). PageSettings.visibility: live|hidden|password (`project.ts:165-178`). PageMeta = forward-compat JSONB + appliedTemplates[] (`:109-120`).
- **ProjectData**: version, pages[], pagesOrder?, styles[], assets[], metadata?, settings?, dsSchemaVersion? (`project.ts:30-51`). `exportProject()` hardcodes version "1.0.0", empties assets (`Composer.ts:494-506`).

## 5.2 Core operations

- CRUD (`manager/ElementCRUD.ts`): createElement (droppable = CONTAINER_TYPES, `:30-51`); removeElement **blocks page root**, reassigns selection to parent, recursive (`:84-147`); moveElement clamps index (`:152-191`); duplicate/paste clone with fresh ids (`:196-250`, `ElementManager.ts:316-322`). wrap/unwrap/replaceWith/insertBefore/After (`ElementOperations.ts:64-172`); group/ungroup (`ElementManager.ts:206-247`).
- **Clipboard = in-memory Composer field** (not system clipboard) + separate styleClipboard (`Composer.ts:95-99`); ⌘C/⌘X/⌘V default commands (`commands/defaultCommands.ts:104-149`).
- **Undo/redo** (`HistoryManager.ts`): JSON-Patch diffs + checkpoint every 10, max 100 entries, coalesce 500ms (`:70-74`); canUndo needs length>1 (baseline checkpoint, `:607-611`); undo/redo **replace whole tree via importProject** + selection revalidation (`:483-534`); `flushPending()` SSOT at start of both (`:247-274`); trim promotes next patch to checkpoint (`:586-603`); patch-path-divergence bail-outs "iter 13 P0-9" (`:459-491`); restoreSnapshot clone-before-import P0 2026-06-09 (`:407-424`); time-travel via restoreEntry/getEntrySnapshot (`:645-699`).
- **Transactions**: deep-clone snapshot at outermost depth, nesting counter; rollback via `runWithoutTracking(importProject)` (`Composer.ts:80-83,712-777`).
- **Autosave** (`storage/StorageAdapter.ts`): debounce 5000ms on PROJECT_CHANGED, only when dirty (`:45-57`); ⚠ **no conflict handling** — unconditional overwrite; redacts email apiKey + published password at rest (`:176-210`); ⚠ autosave path does NOT clear dirty flag — only explicit saveProject() does (`Composer.ts:435-447`).

## 5.3 Styling engine

- **Two parallel representations**: (a) element inline styles + breakpointStyles{desktop,tablet,mobile}; (b) StyleEngine global rules Map flushed to `<style id="aquibra-styles">` on RAF (`StyleEngine.ts:27-54,584-605`).
- Resolution: base styles → component override map on top (`ElementStyles.ts:154-162`); computeStyles merges element+class rules; global styles "will be enhanced" = not wired (`StyleEngine.ts:639-661`).
- **Breakpoints desktop-first**: desktop=base, tablet `(max-width:1023px)`, mobile `(max-width:767px)` (`shared/constants/breakpoints.ts:15-58`); setBreakpointStyle writes rule + mirrors data (`StyleEngine.ts:192-222`). ⚠ **`setDeviceRule` uses conflicting 991/575 queries** (`:162-180`).
- **Tokens**: css var `--buildrick-design-${id}` (`designSystem/types.ts:128-130`); binding syntax `{{token.<id>}}` whole-value only (`TokenBindingResolver.ts:23-50`); engine-side writes history-aware in labeled transactions (`Composer.ts:151-291`); usage recompute microtask-coalesced (`:293-313`).
- **Dark**: ColorMode light|dark|system persisted `buildrik:colorMode` (`colorMode/ColorMode.ts:4-71`); DarkResolver darkValue ?? value + `tokens:dark-missing` (`darkResolver/DarkResolver.ts:19-37`).

## 5.4 State machines

| FSM | States | Source |
|---|---|---|
| Composer state | ready, dirty, zoom, activePageId, snapToGrid, gridSize, isPreviewMode (+device computed SSOT "E-004") | `Composer.ts:70,397-407,647-662` |
| Dirty | false→true on markDirty (deferred in txn); cleared ONLY by saveProject() | `:689-747` |
| Collab connection | disconnected/connecting/connected/reconnecting | `collaboration/CollaborationManager.ts:541-556` |
| ConnectionQuality | excellent(<100ms)/good(<300)/poor/disconnected(no ACK 10s) | `OTEngine.ts:394-424` |
| Migration | skipped/started/complete/failed + crash-resume marker | `MigrationManager.ts:24-52`, `runner.ts:36-83` |
| Crash recovery | sentinel `buildrick:last-crash` in sessionStorage; recovers page/root/selection | `recovery/RecoveryManager.ts:26-198` |

## 5.5 Enums

ElementType ×46 (`element.ts:69-119`) · TraitType ×8 (`:143-151`) · DeviceType desktop/tablet/mobile/**watch/wide** — ⚠ watch/wide have no breakpoint styles (`state.ts:34` vs `breakpoints.ts:100-125`) · HistoryEntryType checkpoint/patch, ChangeType ×5 (`historyTypes.ts:19-24`) · TokenCategory legacy ×9 vs TokenKind canonical ×14 — **two unreconciled taxonomies** (`designSystem/types.ts:20-69`) · ThemeMode ×3 · PresetCategory ×11 · WcagLevel ×5 · **EVENTS catalog: 293 keys** (`shared/constants/events.ts`)

## 5.6 Business rules (THRESHOLDS `shared/constants/config.ts:85-152`)

| Rule | Value |
|---|---|
| History | max 100, checkpoint 10, coalesce 500ms (⚠ `HISTORY_DEBOUNCE:300` dead — hardcodes 500) |
| Autosave | engine 5000ms; shell hook 1000ms (`AUTOSAVE_DEBOUNCE`) |
| Zoom | 10–500 step 10 (engine) — note canvas UI uses 10–300 |
| Grid | default 10, clamp 1–100 |
| Named versions | 50/site, auto-checkpoint off (interval 0), JPEG snapshots q0.6; sync clone <100 elements else idleCallback 2s |
| Slug history | 100/page (301 redirects) · applied-templates 25/page |
| **Nesting depth** | ⚠ CONFLICT: THRESHOLDS 50 (drag-drop) vs nesting/types 30 (validator) |
| Media | image 10MB, video 100MB, audio 50MB, SVG 1MB, max dim 4096 |
| OT | ACK 30s, latency samples 10; collab editing 3s, soft-lock 5s |
| Feature flags | ⚠ COLLABORATION:false, PLUGINS:false, VERSION_HISTORY:false — contradicts shipped VersionTimelineManager/CollaborationManager code (`config.ts:227-237`) |

## 5.7 Defects

1. **Collab DEMO-ONLY, 6 P1s** — OT doesn't converge (remote always wins `OTEngine.ts:256-316`), remote apply clobbers 500ms coalesce window, corrupts undo (`HistoryManager.ts:319-336`), SSE replay non-idempotent, clientId spoofable (`AGENTS.md:24`)
2. Dead constants: HISTORY_DEBOUNCE, ELEMENT_MIN/MAX_*, CANVAS_MAX_* (zero usages)
3. TemplateManager soft-deprecated 2026-05-07 (`templates/TemplateManager.ts:10`); StateReconstructor "not yet implemented" (`history/index.ts:10`)
4. Two responsive query sets (1023/767 vs 991/575); two nesting caps (50/30); two token taxonomies (9/14)
5. Autosave: no conflict handling + dirty flag never cleared by it
6. Type smells: `as unknown as` casts in VersionTimelineManager (`:724-778`)

## 5.8 Integration

Storage backends local/session/indexeddb/remote (`StorageAdapter.ts`; IndexedDB db "aquibra-storage"); VersionHistoryStorage separate IndexedDB; media IndexedDB. Export injectors: GA4/FB Pixel/Google Ads, SEO, Sitemap, Stripe, Formspree, AssetBundler, ReactExporter (`engine/export/*`). `markDirty()` → PROJECT_CHANGED = fan-out hub (history, autosave, token-usage, UI) (`Composer.ts:696-710`). PROJECT_LOADED fires ~4×/load — HistoryManager filters real payloads (`HistoryManager.ts:126-150`). importProject sanitizes via DOMPurify SSOT (`Composer.ts:452-470`).
