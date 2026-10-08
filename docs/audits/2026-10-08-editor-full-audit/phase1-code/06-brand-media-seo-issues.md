# Audit 06 — Brand / Media / SEO / Accessibility, Issues, Review

Date: 2026-10-08 · Repo HEAD 44f5db956 (Brand Part 1a merged) · Read-only audit; nothing was edited, staged or committed in the repo.
How this was checked: code reading plus vitest suites. **No live-app walk was done**: the CLAUDE.md "live app is the verifier" step is outstanding for every finding below.

## Summary table

| ID | Sev | Module | One line |
|----|-----|--------|----------|
| MEDIA (see §2) | **P0** | Media | Dropping a library image or a file onto the canvas never inserts an image. It writes `src` onto the section or page root under the cursor (`useDropExecution.ts:85-116` → `ElementManager.ts:484-501`; root fallback at `dragCalculations.ts:238-242`). Confirmed in code by the parent. |
| BR-1 | P1 | Brand | Rename, and "replace & delete", never reach the canvas, export or publish: the emitter ignores `replacedBy`, and a rename mints a new cssVar. Confirmed with a probe. |
| BR-2 | P1 | Brand | The BRAND_TOKENS_V2 kill switch is bypassed for publish on CMS-bound sites, the /share draft, Compare and Time travel, because the scratch composer defaults `brandTokensV2: true`. |
| BR-3 | P1 | Brand | Template insert bakes token literals in place of `var()`, so Brand edits never reach template content. |
| Media P1s | P1 | Media | Re-upload on every library drag. Engine 1 GB quota blocks PRO/BUSINESS plans. Replace keeps the old alt. Stock search fails when one provider key is missing. |
| SEO-1 | P1 | SEO | The "SEO configured" pre-publish warning can never be cleared: no UI sets `metaTitleTemplate`. Spot-checked by the parent at `publish.service.ts:98`. |
| IR-1 | P1 | Issues | Publish-check rows in Issues are fetched once. They refresh only on the panel's "Try again", which shows only when the content scan failed. Spot-checked. |
| IR-2 | P1 | Issues | The editor treats missing alt and broken links as **errors**; the server treats them as **warnings**. |
| IR-3 | P1 | Issues | Clicking a "Whole site" issue on another page selects the element without switching page. |
| rest | P2 | all | See each section. |

## Test results

| Suite | Result |
|---|---|
| Editor DS: `src/engine/designSystem`, `src/editor/design-system`, `aliasResolver`, `darkResolver`, `colorMode`, `fonts`, `ExportEngine.siteTokens` | 93 files · 880 passed · 3 todo · **0 failed** |
| Root: `__tests__/sites-save-tokens-v6`, `theme.service`, `theme-brand-restore-points`, `packages/shared/tokens` | 7 files · 133 passed |
| Media: engine/services/canvas-drop | 94 files · 1198 passed (2 todo) |
| Media: sidebar media tab | 354 passed |
| Media: server media/stock/alt-text/upload | 64 passed |
| Media: `src/editor/media` | 8 timeouts on the first run under load average 170+; all 4 files passed when rerun alone |
| SEO: editor | 21 files · 262 passed |
| SEO: root `lib/` + server | 5 files · 64 passed |
| Issues/Review | 37 files · 462 passed, 3 failed under load. The 3 passed when rerun alone (52/52). `PublishTab.gate` looks timing-sensitive. |
| `tsc --noEmit` | Timed out at 500 s, so the procedure names and input shapes in the client/server contract were checked by reading, not by the compiler. |

Tests that **assert buggy behaviour as correct**: `useCanvasDragDrop.test.ts:729` (the media P0).
Gaps with no test: BR-1 (emitted CSS after a rename), BR-2 (the switch through `renderProjectPages`), SEO-1, SEO-2.

---

## 1. Brand / design system (Brand Part 1a, v6 tokens, BRAND_TOKENS_V2)

### What works (verified by reading + tests)

- **One write path.** Every Brand edit goes through one function, `composer.designSystem.setTokens` (`src/engine/Composer.ts:345-363`), as one transaction. That covers value edits, add/delete/rename, starters, import, Colour mode, Issues auto-fix, the AI `setDesignToken`, and the inspector's "Update everywhere". So each edit is one ⌘Z step and marks the project dirty, which drives autosave. While the site is read-only, `setTokens` refuses (`:346`).
- **Canvas propagation.** `ProjectTokensApplier` (`src/editor/design-system/ui/ProjectTokensApplier.tsx:27-55`) re-emits the site's token CSS into `<style id="bk-site-tokens">` when `SETTINGS_CHANGE`, `PROJECT_LOADED` or `colorMode:changed` fires. The canvas lives in the editor document (no iframe), so any element bound with `var(--token)` repaints. The inspector binds this way: `TokenPickerPopover.tsx:173,261`, `ColorFillPopover.tsx:166`, `textBodies.tsx:79`, `registry/text.tsx:88`. One emitter, `packages/shared/tokens/emit.ts`, serves the canvas, exports and publish.
- **Undo.** `HistoryManager.captureSnapshot`/`importScoped` (`src/engine/HistoryManager.ts:385-420`) limit history to the element tree plus tokens. Undoing a site's first token edit writes an explicit `[]` at v6, so the save carries it (commit 6e42aaa06). `importProject` fires `SETTINGS_CHANGE`/`PROJECT_LOADED`, so the canvas and the Brand registries (`useProjectTokens.ts:62-75`) both re-read.
- **Server gate.** `sites.saveProject` → `saveProjectFromEditor` → `saveProjectData` → `checkedTokensOrConflict` → `checkTokenPayload` (`server/services/sites.service.ts:925-935,963-975`; `server/services/brand-tokens.ts:81-115`) behaves as follows:
  - **Stale tab:** a stale payload version → `SAVE_CONFLICT` (the conflict dialog).
  - **v5 payload:** migrated only when the switch is on and the site is not held; otherwise stored unchanged.
  - **v6 payload:** must validate, or the save fails with `TOKENS_INVALID` → BAD_REQUEST. A first v6 save over stored pre-v6 tokens is refused when held or when the switch is off. When allowed, it needs the CAS token, and the old set is snapshotted in the same transaction (`reason:"migration"`).
  - **Payload with no `designTokens`:** keeps the stored token state (`withCheckedTokens`, `:902-914`).
  - **Workspace scope:** the switch is read per workspace (`isBrandTokensV2Enabled(workspaceId)`). The editor receives it through `siteDetail.settings.get` → `brandTokensV2` (`server/services/site-settings.service.ts:242`; `BuildrikSyncProvider.ts:691`; `useComposerInit.ts:256-262`).
- **Theme push** (`server/services/theme.service.ts:232-318`) follows the same rules: a held site is skipped, and with the switch off a pre-v6 site that has tokens is skipped. Each site is written with a CAS check plus a snapshot.
- **Tests:**
  - Editor (`src/engine/designSystem`, `src/editor/design-system`, `aliasResolver`, `darkResolver`, `colorMode`, `fonts`, `ExportEngine.siteTokens`): **93 files, 880 passed, 3 todo, 0 failed** (483 s).
  - Root (`__tests__/sites-save-tokens-v6`, `theme.service`, `theme-brand-restore-points`, `packages/shared/tokens`): **7 files, 133 passed**.

### Findings

#### BR-1 (P1): renaming a token, or "replace & delete", has no effect on the canvas, export or publish

- **Where:** `src/editor/design-system/state/kindRegistry.ts:33,40-46`. Emitter: `packages/shared/tokens/emit.ts:57-80`.
- **Trace:**
  1. BrandWorkspace calls `renameToken` (`BrandWorkspace.tsx:441-447`), which runs `kindRegistry.renameToken`.
  2. That keeps the old token unchanged except for `replacedBy: newId`, and appends a copy with a NEW `cssVar` (`--buildrick-design-${newId}`).
  3. Elements are bound by `var(<old cssVar>)`.
  4. `emitTokenCss` never reads `replacedBy`, so `--old` keeps its old literal forever.
  5. Every later edit to the renamed token writes only `--buildrick-design-<newId>`.
  - "Replace & delete" (`deleteToken(id, {replaceWith})`) has the same problem: the "deleted" token is still emitted with its own value, and its elements never take the replacement's value.
- **Probe:** run with tsx on the real emitter, scratchpad `rename-probe.ts`.
  - After rename + edit to `#FF0000`, the output is `--buildrick-design-color-primary:#1A56DB; --buildrick-design-brand:#FF0000`.
  - After replace-delete, the output is `--buildrick-design-color-x:#00FF00` (unchanged).
- **Root cause:** `replacedBy` is followed only by `AliasResolver` (`src/engine/aliasResolver/AliasResolver.ts:127`). That class is used in production only for the "Aliased by" list (`TokenDetailView.tsx:190`), not by the CSS emitter, which is what actually renders.
- **Expected:** the old variable resolves to the replacement, i.e. `--old: var(--new)`.
- **Fix (pick one):**
  - (a) Make the old token an alias: `modes.light = {alias: newId}`, and `modes.dark` likewise.
  - (b) Teach `emitTokenCss` to emit `cssVar:var(<target.cssVar>)` for any token with `replacedBy`.
  - Simplest for rename: keep `cssVar` unchanged and add the old name to `legacyNames` instead of minting a new variable.
- **Tests:** none cover emitted CSS after a rename or replace.

#### BR-2 (P1): the kill switch does not protect publish for CMS-bound sites (or the share preview, Compare and Time travel)

- **Where:**
  - `src/editor/shell/exportPublishPages.ts:85-89` → `renderProjectPages`, which creates a scratch `createComposer(...)` (`:126-135`).
  - `src/engine/Composer.ts:321` (`brandTokensV2: true` default).
  - `ExportEngine.ts:299`.
- **Trace:**
  1. A site with any CMS binding publishes through `renderProjectPages(project, …)`.
  2. The scratch composer is never given the live composer's `designSystem.brandTokensV2`. `ProjectData.brandTokensV2` exists (`src/shared/types/project.ts:70`), but `importProject` ignores it and `exportProject` never writes it.
  3. So `tokensForEmit(..., {migrate: true})` migrates a pre-v6 site's tokens in memory, and the published CSS differs from what the canvas showed while the switch was OFF for that workspace.
  4. The same path renders `/share/<token>` drafts (`packages/dashboard/app/share/[token]/draft-preview.tsx:64-66`; `share-link.service.ts:301` also omits `brandTokensV2`), Compare (`compareSources.ts:126`) and Time travel (`TimeTravelHost.tsx:172`).
- **Root cause:** the switch lives on the composer instance, not in the project data the scratch instance receives.
- **Expected:** commit 187a55d89 promises the kill switch protects canvas, export AND publish. Today that holds only for non-CMS sites.
- **Fix:** add a `brandTokensV2` parameter to `renderProjectPages` and set `scratch.designSystem.brandTokensV2` before `importProject`. Callers pass `composer.designSystem.brandTokensV2`; the share route passes `isBrandTokensV2Enabled(workspaceId)` in `siteColumns`.
- **Status:** the end-to-end publish is UNVERIFIED live. The code path is confirmed.

#### BR-3 (P1): template inserts bake token values in as literals, so later Brand edits never reach them

- **Where:**
  - `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:296-297`.
  - `utils/resolveTemplateTokens.ts:47-58`.
  - `utils/tokenSnapshot.ts:82,98-107`.
- **Trace:**
  1. Template HTML carries `background:{{token.color.primary}}` (`templatesData.ts:151,206,250`).
  2. `snapshotFromComputedStyle(document.documentElement, DEFAULT_TOKENS)` reads the computed literal.
  3. `resolveTokens` replaces the placeholder with that literal, e.g. `#1A56DB`.
  4. The imported elements carry hex values, not `var(--buildrick-design-color-primary)`. Changing Primary in Brand therefore leaves every template-inserted CTA on the old colour, and those values are not counted as token usage either.
- **Root cause:** the template resolver was written to produce literal values rather than live variable references.
- **Expected:** template content stays bound to the token, the same way inspector bindings are.
- **Fix:** in `resolveTokens`, return `var(${token.cssVar})` for colour, spacing and radius hits, and stop snapshotting computed values. Keep the literal only where a `var()` is invalid.
- **Status:** this may be an intended design decision (CEO plan AD1/AD2). Owner to confirm. It contradicts the "token edit propagates" contract.

#### BR-4 (P2): theme push bumps `dsSchemaVersion` as a "reload signal" that nothing reads, and that counter drives the DS project migrations

- **Where:** `server/services/theme.service.ts:230,282`. The counter is consumed by `importMigratedProject.ts:33-47` → `migrations/projectMigrations/runner.ts:52-81`.
- **What happens:**
  - The editor never watches `dsSchemaVersion`. An open editor learns about a push only through `SAVE_CONFLICT` on its next save, so the comment "so an open editor reloads tokens" is false.
  - The bump can carry a site from v0 to v1 and skip migration 0001.
- **Related:** those migrations run over `data.styles` (`projectStyles`, which holds CSS rules, not tokens) and add 18 legacy `--bd-*` token objects. `StyleEngine.importStyles` then drops them as malformed (`StyleEngine.ts:459`). The version still bumps, which marks the project dirty and forces a save on first open.
- **Fix:** stop bumping `dsSchemaVersion` on push and fix the comment. Retire the projectMigrations chain, which targets data that no longer lives in `styles` (dead migration).

#### BR-5 (P2): a held site still renders migrated v6 tokens

- **Where:** `useComposerInit.ts:256` sets `brandTokensV2` from the switch only. `tokensForEmit` (`projectTokens.ts:135-141`) migrates whenever `migrate: true`.
- **What happens:** with the switch ON and the site held (`tokensMigrationHold`, i.e. brand rolled back), Brand opens read-only. But the canvas, export and publish still render the in-memory v6 migration of the restored v5 tokens. If the rollback happened because the migration looked wrong, the hold does not undo the visual result.
- **Fix:** `instance.designSystem.brandTokensV2 = data.brandTokensV2 === true && !data.tokensMigrationHold`.
- **Status:** intent UNVERIFIED.

#### BR-6 (P2): a site with stored `designTokens: []` opens Brand read-only while the switch is off

- **Where:** `useComposerInit.ts:89-105`.
- **What happens:** `[]` is not v6-shaped, so a missing version reads as 1, and the switch-off branch marks Brand read-only. The server would accept a v6 write here, because `hasStoredTokens` is false (`brand-tokens.ts:109`).
- **Fix:** treat an empty array like `undefined` (no tokens means nothing to migrate).

#### BR-7 (P2): the client cannot act on `TOKENS_NEED_CAS`

- **Where:** `sites.service.ts:972` throws it, and `sites.ts:398-403` maps it to CONFLICT with the message `TOKENS_NEED_CAS: …`. On the client, `raiseSaveConflict` (`BuildrikSyncProvider.ts:170-173`) only matches `SAVE_CONFLICT:`, so the error lands in the generic "Save failed" branch.
- **Reachability:** practically unreachable today. `Site.lastEditedAt` is `@default(now())`, so the baseline is always set.
- **Fix:** have the server answer `SAVE_CONFLICT:<lastEditedAt>` here too.

#### BR-8 (P2): some token writes skip Brand's "Review changes" log

- **Where:**
  - Issues auto-fix: `AquibraStudio.tsx:613` → `designSystem.applyAutoFix`.
  - AI: `applySetStyle.ts:559` → `setDesignToken`.
  - Inspector "Update everywhere": `useUpdateColorEverywhere.ts:29`.
- **What happens:** all three call `setTokens` directly rather than `useSessionEdits.commit`. They are undoable and persisted, but missing from Review changes, and every earlier session row turns "stale".
- **Fix:** record from the engine. Have `setTokens` emit `BRAND_APPLIED` with {label, before, after} and let `useSessionEdits` subscribe.

#### BR-9 (P2): dead code and duplication

- `DarkResolver` (`src/engine/darkResolver/DarkResolver.ts`) is a pass-through over `resolveTokenLiteral` with zero production callers (only `Composer.ts:293` constructs it). This violates the "no pass-through wrappers" rule.
- `AliasResolver.resolve`, `validateAndEmit`, `getChain` and `findReplacedBy` have no production callers.
- `kindRegistry.updateToken` and `filterTokens` have no production callers. Brand writes through `changeToken`/`store.commit`.
- The "merged tokens" read is duplicated. `Composer.mergedDesignTokens` (`Composer.ts:916-919`), `useUpdateColorEverywhere.ts:27-28` and `registry/text.tsx:63` each re-run `mergeProjectTokens(settings.designTokens ?? [], settings.designTokensSchemaVersion)`.
- **Misleading comment:** the header of `TokenRegistryContext.tsx` says "a colour edit re-renders colour consumers only, never SizeSection". But `kinds` (`:88-96`) rebuilds all 14 registry objects on every `all` change, so every consumer re-renders. Fix the comment, or memoise per kind on its own filtered list.

### Brand: not verified

- Brand was not walked in the live app (no dev server run). BR-1 was confirmed only with the emitter probe.
- I did not check font slot propagation (`siteFontsFromSettings`) beyond reading the code.

---

## 2. Media


Scope: `packages/editor/src/editor/media/`, `src/editor/sidebar/tabs/media/`, `src/engine/media/` (MediaManager, MediaCommandLayer), `src/services/{AssetUploadService,AltTextService,stock/StockService}.ts`, canvas media drop (`src/editor/canvas/hooks/drag/useDropExecution.ts`), server `media.service.ts`, `media-folder.service.ts`, `stock.service.ts`, `alt-text.service.ts`, `server/trpc/routers/media.ts`, `upload.ts`, dashboard `app/api/asset-upload/route.ts`, `app/api/upload/[fileId]/route.ts`.

Method: static read and data-flow trace, plus tests. Nothing was checked in a running app, so every behavioural claim below is code-derived. The ones that most need a live check are marked UNVERIFIED.

## Tests

| Suite | Result |
|---|---|
| Editor: `src/engine/media`, `src/services`, `ElementManager.media.test.ts`, `insert-media-alt.test.ts`, `useCanvasDragDrop.test.ts`, `src/editor/shell/hooks/__tests__` | 94 files, 1198 passed, 2 todo |
| Editor: `src/editor/sidebar/tabs/media` | 42 files, 354 passed |
| Editor: `src/editor/media` | 1st run: 8 failed / 457 passed (4 files). Every failure was a 15s timeout on the first test in the file, and the load average was 173–254. Run again on their own (`--testTimeout=60000`), all 4 files passed (7 + 111 tests). These are load-induced timeouts, not defects. |
| Server: `media.service`, `stock.service`, `stock-error-translation`, `media-service-paging`, `media-write-role-gate`, `alt-text.service`, `upload-service` | 7 files, 64 passed |

Note: `useCanvasDragDrop.test.ts:729` checks the P0-1 behaviour below as correct: it expects `targetElementId: "r1"` (the page root).

## What works (verified in code)

- **Click-insert from the library** (`useMediaState.insertToCanvas`, `hooks/useMediaState.ts:144`) goes through `composer.mediaOps.insertMediaAt`, which leads to `ElementManager.createElement`. It carries alt text, selects the new element (`:248-249`) and tells local-only assets apart from synced ones. Layers and Inspector follow the selection and `ELEMENT_UPDATED` events.
- **Replace with a selected image or video** (`replaceMedia`, `MediaCommandLayer.ts:246`) is wrapped in `beginTransaction("Replace media")`, so it is one undo step. Replace-across is one transaction too, and rolls back if every element fails.
- **Upload pipeline** (`MediaManager.uploadFile`, `MediaManager.ts:964`): validation errors carry size and limit, and the SVG is sanitized with DOMPurify plus a check that the root element is `<svg>`. If the server mirror fails, the asset is kept as local-only and queued for retry (`retryQueue`, re-run on success and when the browser comes back online). `replaceAssetId` re-points placed `blob:` URLs to the server URL (`:699-701`). The UI side (`useUploadState.ts`) keeps a band showing the failure with Retry and Dismiss, and the File is kept for a retry (`failedFilesRef`).
- **Stock search contract**: the client calls `media.searchStockPhotos` with `{query,page,orientation,color}` and `media.searchStockVideos` with `{query,page}`. The router declares the same procedures and inputs (`routers/media.ts:348-373`). Error codes survive the round trip (PRECONDITION_FAILED becomes not-configured, FORBIDDEN becomes unauthorized, anything else becomes request-failed). Abort and stale-response discard are honoured.
- **Alt text**: the server uses OpenAI (`alt-text.service.ts:72`, `getOpenAI()` + `assertProviderConfigured`). Env is `OPENAI_API_KEY`, or `OLLAMA_BASE_URL` for local models. There is no Anthropic code left. The auto-trigger is mounted at `StudioPanels.tsx:278`. Regenerate is wired in both the drawer (`MediaTab.tsx:190`) and the library (`LibraryManager.tsx:988`), with error, skipped and success toasts (`AssetDetailsPanel.tsx:735-745`). It never overwrites alt text the user typed: a check before the call and a re-check after it (TOCTOU).
- **Upload routes**: `/api/asset-upload` checks the session, the per-user path prefix, plan quota, the per-plan file cap, the role (`assertMediaWrite`) and folder ownership before it mints a token. It uses `addRandomSuffix` and an idempotent `createAsset` upsert. `/api/upload/[fileId]` re-checks the role, checks content-type and size, and writes randomized keys.

## Findings

### P0-1: Dragging a library asset onto the canvas never inserts a new element; it writes `src` onto whatever container is under the cursor
- **Where**: `src/editor/canvas/hooks/drag/useDropExecution.ts:85-91,110-116`, `src/editor/canvas/hooks/drag/dragCalculations.ts:238-242`, `src/engine/elements/ElementManager.ts:484-501`.
- **Trace**: An AssetCell drag sets `x-aquibra-media-src` (`dragPayload.ts:41`). `drop()` (`useDropExecution.ts:317`) calls `handleInternalMediaDrop`, which calls `calculateFreshDropTarget()`. That returns the element under the cursor, and **falls back to the page root when nothing is found** (`dragCalculations.ts:239-242`), so `targetId` is never null while a page exists. Next, `mediaOps.insertMediaAt(src, type, { targetElementId: targetId, x, y })` calls `ElementManager.insertMediaAt`. When `targetElementId` resolves, it runs `target.setAttribute("src", src)` (or rewrites the target's `background-image`) and returns. The "create new element at x/y" branch is unreachable.
- **Root cause**: Commit `47c064f93` said "prefers targetElementId when dropping over a section with bg-image or an existing image placeholder". The code passes the drop target with no check on its type.
- **Effect**: Drop an image on a section, a heading or empty canvas, and nothing new appears. The section or the root gets a meaningless `src` attribute (or loses its background image), and the toast says "<name> applied ✓". The x/y placement code is dead for this path.
- **OS-file drop shares the defect**: `useDropExecution.ts:231-245` uploads the file, then calls `el.setAttribute("src", …)` directly on the drop target or root fallback. That skips the lock gate and has no transaction.
- **Expected**: Replace only when the target is an image or video element (or a placeholder) of the matching kind, or has a `url()` background. Otherwise insert a new element at the drop point.
- **Minimal fix**: In `handleInternalMediaDrop`, pass `targetElementId` only when `composer.elements.getElement(targetId)?.getType()` matches `insertType` (image or video), or the target has a `url(` background-image. Otherwise omit it. Apply the same rule to the OS-file branch: insert with `mediaOps.insertMediaAt(result.asset.src, "image", {x,y})` instead of setting `src` on the target. Update `useCanvasDragDrop.test.ts:729` in the same commit.
- **UNVERIFIED live**: the code path is unambiguous and a test checks it, but no one has walked it in the running app.

### P1-1: Every drag of a library image to the canvas re-uploads it, duplicating the library entry and using quota
- **Where**: `useDropExecution.ts:145-160`.
- **Trace**: After the insert, `if ((insertType === "image" || rawType === "img") && src.startsWith("http"))` runs `fetch(src)` and then `composer.media.uploadFile(new File(…"imported-xxx.webp"))`. Synced library assets have `https://…blob.vercel-storage.com` srcs, so the condition is true for every library drag, not only stock. Each drop creates a new "imported-…" asset and a new blob, and counts against quota.
- **Click-insert of stock has a similar problem**: `useMediaState.ts:133-142,180-182` auto-saves on every insert, so inserting the same stock photo twice saves it twice. The file is also forced to `.webp` with `type: "image/webp"` whatever the real content type is.
- **Fix**: Auto-save only when `src` is not already a library asset (`!composer.media.getAssets().some(a => a.src === src)`), or carry an explicit `x-aquibra-media-origin: stock` flag in the drag payload. Dedupe stock saves by provider id.

### P1-2: The engine's 1 GB local quota blocks uploads for PRO and BUSINESS users whose server library is past 1 GB
- **Where**: `src/engine/media/MediaManager.ts:991-999`, `src/shared/constants/media.ts:336`, plan limits `lib/constants/plan-limits.ts:32,53,74` (500 MB / 5 GB / 50 GB).
- **Trace**: `uploadFile` adds up `this.state.assets[].size`. That includes server-hydrated assets, because `size: sa.bytes` is set at `MediaManager.ts:635`. When the sum plus the new file is over the hard-coded 1 GB, it throws `MediaQuotaError`. `useUploadState.upload` already gates on the real server quota (`serverQuota`, `:180-197`), but the engine then refuses on its own constant. Canvas OS-drop and `saveToLibrary` call `composer.media.uploadFile` directly, so for them the server quota is never checked client-side. Only the engine's 1 GB gate applies, and the server token check is the real gate.
- **Root cause**: two quota gates with different numbers. This is an SSOT violation.
- **Fix**: Remove the engine's local quota gate, since the server's `onBeforeGenerateToken` is authoritative, or inject the plan quota into MediaManager from `checkStorageQuota`. Keep one gate.
- **UNVERIFIED live**: it needs a PRO account with more than 1 GB uploaded.

### P1-3: Replacing media keeps the old element's alt text, so the new image is described wrongly
- **Where**: `src/engine/media/MediaCommandLayer.ts:246-260` (`replaceMedia(elementId, newSrc)` has no alt parameter) and `setElementSrc` (`:497-520`). Caller: `useMediaState.ts:213-216`.
- **Trace**: Inspector "Choose image", ⌘K "Replace selected media" and "insert with an image selected" all go through `requestAssetPick` → `insertToCanvas` → `replaceMedia(target, asset.src)`. The asset's `altText`, or the stock `photo.alt`, is dropped. The element keeps the alt text of the image it replaced. Compare the insert path, which carries `alt` (`useMediaState.ts:245-248`).
- **Fix**: `replaceMedia(elementId, newSrc, { alt })` sets `alt` when it is provided and clears it when the asset has none (empty alt is better than a wrong one). Pass `asset.altText` from `insertToCanvas`.

### P1-4: Stock search fails outright when only one of the two provider keys is set
- **Where**: `src/editor/sidebar/tabs/media/hooks/useDiscoveryState.ts:147-151`.
- **Trace**: `Promise.all([searchPhotos, searchVideos])`. Without `PEXELS_API_KEY`, `searchStockVideos` throws `NOT_CONFIGURED`. The `catch` sets `searchFailed = "not-configured"` and photos never land, even though Unsplash answered. CLAUDE.md lists the two keys as optional and independent.
- **Fix**: Use `Promise.allSettled`, and keep failure state per kind (`searchFailed: {img, vid}`). The modal then shows photos and reports only that video search is not configured.

### P2-1: Two separate implementations of "replace an element's media src"
- `ElementManager.insertMediaAt` when `targetElementId` is set (`ElementManager.ts:484-501`): no `isSafeSrc` check, no transaction, sets alt.
- `MediaCommandLayer.setElementSrc` (`MediaCommandLayer.ts:497-520`): has `isSafeSrc`, runs inside a transaction, does not set alt.
- Neither path goes through the lock gate (`writeElement` / `canWrite` in `engine/commands/commandOperations.ts`), so a locked image can have its media replaced (engine AGENTS.md calls this one lock gate).
- **Fix**: Keep one helper (the MediaCommandLayer one), have it go through `writeElement`, and have `ElementManager.insertMediaAt` stop doing replacements.
- **UNVERIFIED**: whether the UI already disables Choose image for locked elements.

### P2-2: The upload progress bar is synthetic, and the network upload shows no progress
- `MediaManager.ts:1002-1201` emits fixed milestones: 25 (read), 50, "optimizing", 75 ("processing"). Then `remoteSync.uploadAndCreate` (the actual Vercel Blob PUT, up to 50 MB) runs with no progress events, so a large video sits at 75% "processing" until it finishes. `@vercel/blob/client upload()` supports `onUploadProgress`.
- **Fix**: Thread `onUploadProgress` through `uploadBlob` → `uploadAndCreate` and map it onto 75–100.

### P2-3: Alt text generated after an image is already placed never reaches the placed element
- `useAltTextAutoTrigger.ts:64-74` updates only the asset's `altText`. Elements already inserted from that asset (common case: OS-drop on the canvas, or upload then immediate insert) keep `alt` empty, and the published image has no alt text.
- Late mirrors (`retryLocalOnlyAssets`, `MediaManager.ts:475-480`) never emit `UPLOAD_COMPLETE`, so assets synced after an offline upload never get auto alt text.
- **Fix**: On a successful generation, set `alt` on elements whose `src === asset.src` and whose alt is empty, in one transaction. Emit an event on a late mirror that the trigger listens to.

### P2-4: Stock saves drop the photo's alt text and attribution
- `useDiscoveryState.ts:258-276` (`saveToLibrary`) uploads the file and sets only `assetSource: "stock"`. The provider alt text (`photo.alt`) and the author / `authorUrl` are lost, so a library asset inserted later has no alt and no credit.
- Unsplash's API guidelines also require hitting `links.download_location` when a photo is used. `stock.service.ts:124-146` does not map it and nothing calls it.
- **UNVERIFIED** whether production Unsplash approval depends on this.

### P2-5: Dead code and stale contracts
- `useDiscoveryState.ts:97,188-208`: `discSource` / `setDiscSource` / `extras.source`. No UI sets the source and the server ignores it (Unsplash for photos, Pexels for videos, fixed). The re-search effect is unreachable. The `orientation` argument to `searchVideos` is also ignored (`StockService.ts:131`).
- `src/services/stock/StockService.ts:4-9`: the header still says "Currently a stub: returns empty results". That is no longer true.
- `dragPayload.ts:55` `readMediaDragData` is exported and never imported.
- `MediaCommandLayer.ts:331,457` `void new MediaReplacePartialError(...)` builds an error object and throws it away.
- `packages/shared/schemas/media.ts:128,142` `generateAltTextResultSchema` and `storageQuotaResultSchema` are never used. `storageQuotaResultSchema.totalBytes` is `.min(0)`, but the service returns `-1` for unlimited, so the schema would reject real data if anything parsed with it.
- The upload context `site_media` (`packages/shared/schemas/upload.ts:6,20`, `server/services/upload.service.ts:26,51`, `upload/[fileId]/route.ts:106`) has no caller. It would be a second media path that writes no `MediaAsset` row.
- `server/trpc/routers/media.ts:302-305` doc comment: "Generate alt text via Claude Haiku vision". The service has used OpenAI since the Anthropic path was removed. `alt-text.service.ts:154` comment: "waiting on Anthropic".
- `MediaCommandLayer.insertMedia` (`:169`) is a pure pass-through to `insertMediaAt`, which CLAUDE.md rule 1 forbids. One caller: `MediaTab.tsx:347`.

### P2-6: Unconfigured alt-text provider surfaces as INTERNAL_SERVER_ERROR
- `assertProviderConfigured` throws a plain `Error` (`ai.service.ts:481-491`). `generateAltText`'s catch (`routers/media.ts:316-328`) maps only `ASSET_NOT_FOUND` and `NOT_IMAGE`, so the result is a 500. The client folds every error into `null` ("Couldn't generate alt text — try again later"), which tells the user to retry something that will never work.
- **Fix**: Throw a domain error (`AI_NOT_CONFIGURED`), map it to `PRECONDITION_FAILED`, and give the UI a "not configured" message, the same way stock search does.

### P2-7: Asset-upload quota trusts the byte count the client declares
- `asset-upload/route.ts:124-138,194-198`: the quota and the persisted `bytes` both come from `clientPayload.bytes`. `onUploadCompleted` ignores the real `blob` size. A client can declare `bytes: 1` and upload up to `maximumSizeInBytes` per file while the counted quota hardly moves.
- **Fix**: In `onUploadCompleted`, persist the real size from Blob (`head(blob.url)`) rather than the declared value.
- **UNVERIFIED**: whether the `blob` object passed to `onUploadCompleted` carries a size in the installed `@vercel/blob` version.

### P2-8: Regenerate in the library passes the engine key as the server asset id
- `LibraryManager.tsx:988`: `regenerateAltText(composer.media, key, key)`. This works only because the engine id equals the server CUID after `replaceAssetId`. For a local-only asset it returns NOT_FOUND, shown as "try again later". The drawer passes `it.assetId` correctly (`MediaTab.tsx:190`).
- **Fix**: Pass `asset.serverId`, and hide Regenerate when it is missing.

### P2-9: The library is scoped to the user, not the site
- `media.service.ts:153-156` `listAssets` filters on `userId`. Two editors on the same site never see each other's uploads in the library, even though `assertMediaWrite` treats the site as the shared scope.
- **UNVERIFIED**: this may be an intended product decision. Flagged for the owner.

## Not verified
- None of the above was walked in the running app. In particular: the P0-1 drop behaviour, undo after a click-insert (`createElement` history recording is not wrapped in a transaction in `insertMediaAt` and relies on the engine's change capture), and whether drop indicators linger after an internal media drop. `handleInternalMediaDrop` never calls `resetSession` / `clearAllIndicators` / `canvas.drag.end`, unlike `handleMainDrop` (`useDropExecution.ts:186-190,288`).
- Whether Pexels video file links allow a cross-origin `fetch` for `saveToLibrary` (CORS).
- Whether real uploads to Vercel Blob succeed in production (needs `BLOB_READ_WRITE_TOKEN`).

---

## 3. SEO


## Data flow (verified by reading code)

| Layer | Page-level SEO | Site-level SEO |
|---|---|---|
| Edit UI | `editor/sidebar/tabs/pages/page-settings/` (SeoTab / SocialTab / AdvancedTab, one form, state in `usePageSettings.ts`) | `editor/sidebar/tabs/settings/screens/SeoScreen.tsx` (Defaults, Social profiles, Indexing incl. canonical + robots.txt), `SiteSettingsScreen.tsx` (favicon, touch icon, site name), `LocalizationScreen.tsx` (`seo.language`) |
| Engine store | `PageManager.updatePage` (`engine/elements/manager/PageManager.ts:119`) merges into `page.settings.seo` / `settings.head` / `settings.visibility`, emits `PROJECT_CHANGED` | `ProjectSettings.seo` (`shared/types/project.ts:362`), hydrated from Site columns in `services/BuildrikSyncProvider.ts:536-544`, flushed back as columns (`:305-323`) through `siteDetail.settings.update` |
| Server store | `pages.settings` JSON (validated by `pageSettingsSchema`, `packages/shared/schemas/sites.ts:131`) | `sites.metaTitle/metaDescription/metaTitleTemplate/ogImage/favicon/touchIcon/canonicalUrl/allowIndexing/robotsTxt/socialLinks/defaultLocale` |
| Emit (editor) | `engine/export/SEOInjector.ts:104` `inject()` — title (with template + site default), description, og:*, twitter:*, robots (page noindex/nofollow), JSON-LD, sameAs Organization, favicon, sanitized custom head. Called by both single-file export (`ExportEngine.ts:621`) and per-page publish HTML (`ExportEngine.ts:968`). `<html lang>` from `resolveLanguage` (`:697`, `:1016`) | same injector reads `siteSEO` |
| Emit (server, publish) | — | `lib/publish-files.ts:171 buildDeployFiles` → `lib/publish-html.ts` `injectHeadTags` (favicon, apple-touch-icon, og:image, skip if present), `injectSeoTags` (per-page canonical via `pageCanonicalUrl`, og:url, site noindex), `robots.txt`, `sitemap.xml` (`packages/shared/seo/sitemap.ts`, excludes pages with own noindex), `vercel.json` |

Client/server contract: the editor calls `siteDetail.settings.get` / `siteDetail.domains.list` (usePageSettings.ts:170-172, SeoScreen.tsx:150-152) and saves columns via the shell flush; field names line up with `updateSiteSettingsSchema` (SeoScreen validates against `updateSiteSettingsSchema.shape[key]` directly, SeoScreen.tsx:70). No procedure-name or input-shape mismatch found.

The 2026-10 SEO work holds up: one title rule (`resolvePageTitle`) is shared by export, publish and the drawer preview, both export paths use one injector, and canonical/og:url/sitemap all go through `pageCanonicalUrl`.

## Findings

### P1-SEO-1: "SEO configured" pre-publish warning can't be cleared. No UI writes `metaTitleTemplate`
- **Where:** `server/services/publish.service.ts:98-101` (check), `packages/editor/src/editor/sidebar/tabs/publish/PublishTab.tsx:94` (`"SEO configured": { screen: "seo" }`), `SeoScreen.tsx` (no template field; its flush at `:224-235` never sets `metaTitleTemplate`).
- **Trace:** the pre-publish check reads `site.metaTitleTemplate`. The editor and every server writer were grepped. The column is only *read* (BuildrikSyncProvider hydration/flush passthrough, SEOInjector, share-link, dashboard `seo-tab.tsx:68` read-only row). The "Fix ›" button opens Settings › SEO, which has Title / Description / OG image / socials / indexing but no template input. The dashboard SEO tab is read-only and links back to the same screen.
- **Root cause:** the template field was never built into the rebuilt SEO screen (or it was dropped), but the check and the exporter (`SEOInjector.ts:64 applyTitleTemplate`) still depend on it.
- **Impact:** every site shows a permanent "SEO configured: warning — No meta title template set" with a Fix door that goes nowhere. A site with full per-page titles and descriptions is still told its SEO is not configured. The dashboard row also shows `{page_title} | {site_name}` as the empty placeholder (`seo-tab.tsx:68`), which suggests a default template applies. The engine applies none.
- **Expected:** either the SEO screen's Defaults card has a "Title template" field (written to `seo.metaTitleTemplate`, which the sync provider already maps to the column at `BuildrikSyncProvider.ts:310`), or the check grades what actually ships (pages with title + description, which `site-detail.service.ts:108` already computes).
- **Minimal fix:** add the template input to `SeoScreen` Defaults (state + snapshot + flush `metaTitleTemplate`). The column mapping already exists. If the owner does not want the field, change the check to the page title/description coverage rule and drop the misleading dashboard placeholder.

### P2-SEO-2: a page's own robots meta suppresses the site-wide noindex
- **Where:** `lib/publish-html.ts:115` — `if (!seo.allowIndexing && !/<meta[^>]+name=["']?robots/i.test(html))`.
- **Trace:** a page with "Follow links" off emits `<meta name="robots" content="nofollow">` (`SEOInjector.ts:93-98, 200-203`). With Settings › SEO "Allow indexing" off, `injectSeoTags` sees an existing robots tag and skips `noindex,nofollow`. The page ships *indexable*. The same happens when the page has `noindex` and the site's `nofollow` is lost.
- **Mitigation:** the default robots.txt is `Disallow: /` when indexing is off (`publish-files.ts:197-199`), so crawlers mostly stay out. A custom `robotsTxt` that allows crawling removes that safety net. That is why this is P2, not P1.
- **Expected:** with the site toggle off, every page carries `noindex` whatever its own directives say.
- **Minimal fix:** in `injectSeoTags`, merge instead of skipping. If a robots meta exists and lacks `noindex`, rewrite its `content` to the union (`noindex,nofollow` plus the page's own directives). Add a publish-html test for page-nofollow + site-off.

### P2-SEO-3: dead duplicate meta/JSON-LD builder in `shared/utils/html/seo.ts`
- **Where:** `packages/editor/src/shared/utils/html/seo.ts:50,167,180,194` (`generateMetaTags`, `generateJsonLd`, `generateBreadcrumbJsonLd`, `generateFaqJsonLd`), re-exported from `shared/utils/html/index.ts:172-179` and `shared/utils/index.ts:179`.
- **Trace:** grep across editor, dashboard and server finds zero non-test consumers. Only `shared/utils/html/__tests__/seo.test.ts` uses them. It is a second meta-tag generator with different rules (keywords, author, theme-color, separate twitter title) from `SEOInjector`.
- **Root cause:** a leftover from before `SEOInjector` became the single emitter. It breaks the CLAUDE.md "no dead code" and SSOT rules.
- **Fix:** delete `seo.ts`, its barrel re-exports and its test.

### P2-SEO-4: page settings save replaces `settings.seo` wholesale and drops fields the form doesn't own
- **Where:** `editor/sidebar/tabs/pages/page-settings/usePageSettings.ts:279-292` builds a fresh `seo` object. `PageManager.updatePage` (`PageManager.ts:158-160`) shallow-merges `settings`, so `settings.seo` is replaced.
- **Trace:** `PageSEO` also has `canonicalUrl`, `structuredData`, `twitterCard`, `twitterTitle/Description/Image` (`shared/types/project.ts:240-267`). The exporter emits `canonicalUrl` and `structuredData` (`SEOInjector.ts:138,207`), and the server schema accepts them (`schemas/sites.ts:111-128`). Any value that reaches them by import, API, AI generation or template is silently erased the next time someone clicks Done in Page settings.
- **Note:** no current editor UI writes these fields, so impact today is limited to imported or API data. UNVERIFIED whether any template or AI path seeds `structuredData`.
- **Fix:** spread the existing value first: `seo: { ...page.settings?.seo, metaTitle: …, … }`. Taking it from `composer.elements.getPage(page.id)?.settings?.seo` is enough.

### P2-SEO-5: legacy `pages.seoTitle` / `seoDescription` columns are a parallel truth the exporter never reads
- **Where:** `prisma/schema.prisma:612-613`; writable via `pages.update` (`packages/shared/schemas/pages.ts:19-20`, `server/trpc/routers/pages.ts:67`); read as fallback by `site-settings.service.ts:222-223` (dashboard SEO preview) and `site-detail.service.ts:114-115` (SEO health score).
- **Trace:** the editor never sends or loads these columns (no reference in `packages/editor/src/services`). `SEOInjector` reads only `page.settings.seo`. A title set through the API therefore shows in the dashboard preview and counts toward the SEO health score, but never ships.
- **Fix:** pick one store. Either migrate the column values into `settings.seo` and drop the columns and fallbacks, or have the editor's load path map them into `settings.seo` when that is empty.

### P2-SEO-6: dashboard SEO preview ignores the title rule that actually ships
- **Where:** `packages/dashboard/components/site-detail/seo-tab.tsx:46-48`.
- **Trace:** the preview uses `pageSeo.metaTitle ?? site.metaTitle` raw. The shipped title is `resolvePageTitle` (`SEOInjector.ts:24`), which applies the template and falls back to the page name. With a template set, the dashboard preview and the live `<title>` differ.
- **Fix:** move `resolvePageTitle` / `applyTitleTemplate` into `packages/shared/seo/` (it has no editor dependencies apart from types) and call it from both places.

### P2-SEO-7: `og:locale` uses BCP-47 form
- **Where:** `SEOInjector.ts:156`. It emits `content="${language}"` straight from `Site.defaultLocale` (e.g. `en`, `fr-FR`).
- **Problem:** Open Graph expects `language_TERRITORY` (`fr_FR`). `en` and `fr-FR` are not valid og:locale values. UNVERIFIED how strictly Facebook/LinkedIn reject them; they generally fall back to `en_US`.
- **Fix:** `language.replace('-', '_')`, and emit only when a territory is present (or map bare languages to a default territory).

### P2-SEO-8: AI "Suggest SEO title" fails silently
- **Where:** `page-settings/SeoTab.tsx:124-139`. The `catch {}` swallows the error and the button just stops spinning.
- **Context:** CLAUDE.md records that `OPENAI_API_KEY` was missing in production for months, which is exactly this path's failure mode.
- **Fix:** show a toast in the catch ("Couldn't suggest a title — AI isn't available right now").

### P2-SEO-9: sitemap and canonical origins can disagree
- **Where:** `lib/publish-files.ts:174-177` vs `:207-208`.
- **Trace:** the canonical/og:url origin is `resolveSiteOrigin` *without* the Vercel fallback (typed canonical or verified primary only, per owner decision Q10). `sitemap.xml` and the robots `Sitemap:` line use `input.origin`, which *includes* the `*.vercel.app` fallback (route.ts:357-361). A site with no custom domain therefore ships no canonical but a sitemap of `vercel.app` URLs. That is arguably fine, but it contradicts the stated "never canonicalise to a preview host" intent and the editor's preview (`siteOrigin`, which falls back to `publishedUrl`).
- **Fix:** an owner decision. Either drop the sitemap without a canonical origin or document the asymmetry. Low priority.

### Not defects / verified OK
- Page drawer buttons are all wired: slug with dedupe and validation, the redirect offer (emits `UI_SETTINGS_OPEN` with `screen: "redirects"`), the AI suggest, the Index/No-index select, "Open site defaults", the visibility segmented control, the indexing/follow toggles and the custom head.
- Save has three states: clean, saving, and error (the dialog stays open). Errors toast.
- SeoScreen has load, error and retry states (`LoadCard`), dirty tracking against server values, field errors keyed by server path, and a save error banner.
- Hidden pages are excluded from publish (`isPageLive`, `ExportEngine.ts:140,796`). Custom head code is sanitized (DOMPurify allowlist).
- Page settings are not undoable: `updatePage` records no history. This looks deliberate (a form with Cancel/Done), not a bug.

## Tests run
- Editor (`packages/editor`): `npx vitest run` over ExportEngine.publishedPage, ExportEngine.singleFileSeo, SEOInjector*, documentLanguage, sanitizeHeadCode*, pages/utils (seoScore, slug), SeoScreen, page-settings/* (SeoTab, usePageSettings, PageSettingsDrawer.done/.escape), shared/utils/html seo.test: **21 files, 262 tests, all passed.**
- Root: `lib/__tests__/publish-html|publish-files|publish-urls`, `server/services/__tests__/site-settings-pageSeo`, `publish-prechecks-visibility`: **5 files, 64 tests, all passed.**
- No test covers P2-SEO-2 (page robots + site noindex), and none covers the absence of a template input (P1-SEO-1). The green suites do not contradict either finding.

## Not verified
- No live run in the app. All findings come from reading the code plus the unit suites.
- I did not trace how CMS dynamic-page SEO (`cms.service.ts:809` `pageSeoTitle`) gets through `appendDynamicPagesToPublish` into the head.

---

## 4. Accessibility + Issues + Review


Scope: Issues panel and its feed, the content (a11y) detector, the DS-lint/contrast checker, the pre-publish checks (editor ↔ server), the lifecycle publish gate, the Review panel with comments and client review, and `src/editor/collaboration`. Read-only. Paths below are relative to `packages/editor/` unless they start with `server/`, `packages/` or `../shared`.

## Architecture as built (verified by reading code)

```
Issues feed  (shell/hooks/useIssuesFeed.ts)  →  state.issues  →  IssuesPanel / SiteMenu title / lifecycle errorCount / PublishErrorsConfirmModal
  ├─ DS-lint: DSLintRunner → useDSLint → DSLinter.lint + buildContrastIssues → designSystem.lintState → "lint:changed"
  ├─ content: useContentIssueScanner → @buildrik/shared/content/contentIssues.detectContentIssues(exportPages())
  │           (re-runs on PROJECT_LOADED / PROJECT_CHANGED / ELEMENT_UPDATED, debounced 400ms; undo re-imports → PROJECT_LOADED, so undo is covered)
  └─ server checks: fetchPrePublishChecks(siteId) → sites.prePublishChecks → runPrePublishChecks (server/services/publish.service.ts:25)
               (content rows filtered out to avoid double counting)
Publish panel (sidebar/tabs/publish/PublishTab.tsx) runs its OWN fetch of the same server list (on mount, and when a publish settles).
```

- There is one content detector, shared by the editor and the server (`packages/shared/content/contentIssues.ts`). Good.
- The DS contrast rule has a single source too (`design-system/utils/contrastLint.ts`), merged into `useDSLint`.
- The tRPC client is typed against `AppRouter` (`src/services/api-client.ts:18`), so the client's procedure names and input shapes are compile-checked. By reading, the `comments.*` / `reviews.*` / `sites.prePublishChecks` calls in `src/services/ReviewService.ts` and `PublishService.ts` match the router definitions, and the dashboard `/review/[token]` page uses `clientReview.get/identify/comment/resolve/requestNewLink/comments`, which all exist (`server/trpc/routers/client-review.ts:89-134`). **UNVERIFIED by a compiler:** `npx tsc --noEmit` timed out at 500s (exit 124) on this machine.
- The topbar `IssueChip` was removed (C3). The count now rides in the SiteMenu "Issues" row title (`shell/StudioHeader.tsx:663-665,865`). No dead `IssueChip` export remains.

## Findings

### P1-IR-1 — Server-check rows in Issues are fetched once and never refreshed, so the error count, the "Publish anyway" label and the open-errors confirm go stale
- **Where:** `shell/hooks/useIssuesFeed.ts:81-116`. The effect depends only on `[siteId, checkRetry]`, and `checkRetry` only changes from the panel's "Try again" (`:122-125`), which only shows when the *content* scan failed (`IssuesPanel.tsx:220-229`).
- **Trace:**
  1. On mount the server returns `Vercel connected: fail` (or `Pages ready: fail`).
  2. `useIssuesFeed.ts:100` maps a `fail` to `type:"error"` and pushes it into `state.issues`.
  3. `AquibraStudio.tsx:438-441` counts that row into `errorCount`.
  4. `lifecycle.ts:215` returns gate `open-errors`, and `:258` sets the label to `Publish anyway`.
  5. The user then connects Vercel in the dashboard, adds a page, or a publish settles. `PublishTab` refetches (`PublishTab.tsx:367-377`), but the Issues feed never does.
- **Effect:** the editor keeps showing "Publish anyway" and the `PublishErrorsConfirmModal` (`AquibraStudio.tsx:871-883`) lists an error that no longer exists, until a full reload. Issues and Publish disagree again, which is the exact A02-9 failure this hook was written to end.
- **Root cause:** two independent fetches of one server list. Only the Publish panel's fetch has refresh triggers.
- **Expected:** one fetch of the check list, refreshed on the same triggers (publish settled, Publish panel open, window focus/`useRefetchOnFocus`, `SETTINGS_CHANGE` after a successful save).
- **Fix (minimal):** lift `loadChecks` into one shared hook, or have `useIssuesFeed` subscribe to `publishJob.uiState` and `useRefetchOnFocus`, as `useLifecycle.ts:146` already does. Have PublishTab consume the same state instead of fetching a second time.

### P1-IR-2 — The editor and the server give the same content finding different severities, so the editor gates on findings the server calls advisory
- **Where:**
  - `packages/shared/content/contentIssues.ts:113`: missing alt is `type:"error"`.
  - `:146` and `:162`: an empty link and a dead `#page:` link are `type:"error"`.
  - `server/services/publish.service.ts:131-141`: the server reports both as `status:"warning"`, with the comment "Warnings only — an unlabelled image or a dead link degrades the site, it does not stop the deploy".
- **Trace:** `useContentIssueScanner.ts:56-64` keeps `f.type`. `AquibraStudio.tsx:439` counts it in `errorCount`, which triggers the `open-errors` gate (`lifecycle.ts:215`) and relabels the CTA "Publish anyway". The Publish panel draws the same fact as an amber row whose legend says "Amber = advisory".
- **Effect:** one image without alt text makes the editor demand a "Publish with 1 open error?" confirmation, while the readiness list beside it calls the same fact advisory. Users see two verdicts on one fact.
- **Root cause:** the detector carries a per-finding `type`, and the server ignores it and hard-codes `warning`.
- **Fix:** pick one rule. Either the server row uses the worst finding's type, mapping `error→fail` (only if a missing alt should block, which the owner decides), or the detector emits `warning` for missing-alt and dead links. **Owner decision needed. Do not silently change the gate.**

### P1-IR-3 — "Whole site" issue rows select elements on other pages without switching page
- **Where:** `AquibraStudio.tsx:596-608`. `composer.elements.getElement(id)` finds elements on every page, because the registry is site-wide (`engine/elements/manager/ElementCRUD.ts:65`). `composer.selection.select(target)` (`engine/SelectionManager.ts:30-44`) never changes the active page.
- **Trace:** Issues → "Whole site" → click "Image is missing alt text · About". The element is selected and the Inspector shows it, but the canvas still shows Home. Nothing scrolls, and the selection is invisible.
- **Root cause:** the cross-page locate logic already exists as `sidebar/tabs/review/locate.ts:56-79` (`locateComment`: switch the page first, select, then scroll when rendered), but the Issues handler re-implements a partial copy. That is duplicated logic.
- **Fix:** call `locateComment(composer, { pageId: issue.pageId ?? null, targetSelector: issue.elementId })` for element-bound issues, perhaps after moving it to a shared `editor/shared/locate.ts`. Keep the token-usage fallback for DS issues.
- **Status:** runtime UNVERIFIED (not walked live). The code path is unambiguous.

### P2-IR-4 — Clicking a server-check row in Issues (Vercel, SEO, Favicon…) opens the Brand panel
- **Where:** `AquibraStudio.tsx:606`. With no `elementId` and no `tokenId`, the fallback is `composer.emit("ui:switch-tab", { tab: "design" })`. Server-check issues (`useIssuesFeed.ts:98-103`) carry neither.
- **Effect:** clicking "Publish › Vercel connected" or "Publish › SEO configured" lands on Brand, which is unrelated.
- **Fix:** carry the check label on the issue (`checkLabel`) and route it through PublishTab's `FIX_TARGETS` (`PublishTab.tsx:92-98`), or open the Publish tab.

### P2-IR-5 — Several Publish-check rows have no Fix door
- **Where:** `PublishTab.tsx:92-98,474-475`. `FIX_TARGETS` covers only Pages ready, SEO, Domain, Empty pages and Favicon. Image alt text, Links, CMS templates, Template pages and CMS bindings render no door, so the row is a dead end.
- **Fix:** route "Image alt text" and "Links" to the Issues panel (whose rows select the element), and the CMS rows to the CMS panel.

### P2-IR-6 — The Issues panel's empty states are wrong
- **Where:**
  - `IssuesPanel.tsx:239`: the zero state says **"No brand issues."**, but the feed also carries content and publish-check issues.
  - `IssuesPanel.tsx:315-320`: when `filter === "all"` and page scope hides everything (all issues are on other pages), the EmptyState title is `No warnings`, because the ternary only knows `error` vs everything else.
- **Fix:** use "No issues." for the zero state. Derive the empty title from filter and scope, for example "No issues on this page".

### P2-IR-7 — The editor scans hidden pages; the server scans only live ones
- **Where:** `useContentIssueScanner.ts:53` scans `exportPages()`, which is every page. `server/services/publish.service.ts:46-51` filters `isLive`.
- **Effect:** a broken link on a hidden or draft page counts as an editor error (see IR-2) and feeds the publish confirm, although it never ships.
- **Fix:** filter by the same `isPageLive` rule (ExportEngine) before calling `detectContentIssues`, and pass all page ids as `existingPageIds`, mirroring the server call.

### P2-IR-8 — Contrast auto-fix rewrites only the light literal, but the issue may be measured in dark mode
- **Where:**
  - `engine/Composer.ts:329-338`: `applyAutoFix` resolves and sets the `"light"` value.
  - `design-system/utils/contrastLint.ts:96-113`: the failure is measured in `mode` (`composer.colorMode.resolved()`) while the hint is computed against light.
- **Effect:** in dark mode, Fix › succeeds (it returns a value, so no fix-failed band appears) but the dark-mode issue stays.
- **Related:** the `useDSLint.ts:56-87` effect deps are `[composer, allTokens, runNonce]` and do not include colour mode, so contrast findings may not re-run on a light/dark toggle.
- **Status:** UNVERIFIED live. **Fix:** pass the resolved mode into `applyAutoFix`/`setTokenLiteral`, and add the colour-mode change to the lint deps (subscribe to the ColorMode event).

### P2-IR-9 — The DS lint runs twice
- **Where:** `useDSLint` is mounted headless by `design-system/ui/DSLintRunner.tsx:36` and again by `BrandWorkspace.tsx:220`. Both write `lintState.setAllIssues` (`useDSLint.ts:84`).
- **Effect:** the results are identical, so this is harmless, but it doubles lint work and `lint:changed` emits while Brand is open. The DSLintRunner header claims "`useDSLint` is the only place the linter runs".
- **Fix:** BrandWorkspace should read `lintState`, or a context fed by the one runner, rather than call the hook again.

### P2-IR-10 — Review replies are attached to an arbitrary page
- **Where:** `sidebar/tabs/review/ReviewTab.tsx:285`: `const activePage = round && comments[0]?.pageId ? comments[0].pageId : undefined;` is passed to `postReply(body, activePage)` (`:294`).
- **Effect:** an internal reply is filed under whichever page the first-listed comment happens to be on, not the active page and not "General". It then groups under that page heading (`pageName`, `:276-283`).
- **Fix:** pass `composer.elements.getActivePage()?.id`, or `undefined` for a general reply, per the board's intent.

### P2-IR-11 — Dead code and stale docs
- `editor/collaboration/PresenceIndicators.tsx:59-70`: the `PresenceIndicators` component and its barrel export (`collaboration/index.ts`) have no production consumer. Only `toPresenceUsers` is imported (`StudioHeader.tsx:33`), and the component lives on only for its test. `MOCK_USERS` ("Ana") also shows a fake collaborator in dev builds (`:35-38,53`).
- `sidebar/tabs/publish/PrePublishChecks.tsx` header: says "The server's six… PublishTab drops Favicon". Both claims are false: the server emits up to 11 rows, and `PublishTab.tsx:356-358` renders Favicon with a Fix door.
- `IssuesPanel.tsx:2-3` header: says "DS-lint today; broken links and missing alt text as those producers land". Both have landed.

### P2-IR-12 — The server publish path does not re-check `fail` rows (UNVERIFIED)
- `runPrePublishChecks` is called only from `sites.prePublishChecks` (`server/trpc/routers/sites.ts:416-426`). `startPublish` (`publish.service.ts`) does not re-run it.
- The client blocks on `blockedByChecks` (`PublishTab.tsx:385`), and the Vercel connection is enforced in the worker. "Pages ready: fail" (zero live pages) does not appear to be enforced server-side. Not traced end to end.

## Working as intended (verified by reading)
- **Fix › on DS issues:** `applyAutoFix` runs inside one transaction (`Composer.ts:340-360`, `setTokens`), so it is one undo step. It emits `BRAND_APPLIED`. Registries re-hydrate on `project:changed`, the lint re-runs (500ms debounce), and the row disappears. The fix-failed band appears when the result is null. "Ignore for this token" and "Restore" go through `lintState.suppress/unsuppress`, which emits `lint:changed`, so the count updates.
- **Fixing content issues** (adding alt, fixing a link): `ELEMENT_UPDATED` triggers a rescan within 400ms, and the count, panel and gate all follow, because they read the one `state.issues`. Undo is covered via `PROJECT_LOADED`.
- **Review panel:** resolve, reply and revoke all `reload()` and emit `comments:refresh`, which `useLifecycle.ts:164` listens to for `openCommentCount`. Load, error and retry states exist (`ReviewTab.tsx:612,660`), and Locate switches page first (`locate.ts`).
- **Server comment and review authorization:** create/list need site access; resolve/reattach need EDITOR. Client-review is token-scoped and rate-limited.

## Tests run
`npx vitest run` over: the IssuesPanel tests, `lifecycle.test.ts`, `useContentIssueScanner`, `useIssuesFeed`, `useLifecycle`, `sidebar/tabs/publish/**`, `sidebar/tabs/review/**`, `editor/collaboration`, `LintState`, `designSystem/linter`, `issueCopy`, `shell/modals`.
- **Result:** 37 files, 462 passed, 3 failed, 1 todo.
- **The 3 failures:**
  - `PublishTab.gate.test.tsx`: assertion at `:133`.
  - `PublishTab.states.test.tsx:91`: 15s timeout.
  - `ReviewTab.banner.test.tsx:105`: 15s timeout.
- **Re-run in isolation:** 3 files, 52/52 passed. These are load-induced flakes (`tsc` was running concurrently), not product defects. The gate test's assertion failing under load suggests a timing dependency worth hardening.
- **`tsc --noEmit`:** timed out (exit 124), so the result is UNVERIFIED.
