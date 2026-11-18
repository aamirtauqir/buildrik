# Track B — CMS client engine, sync, canvas, export/publish (read-only audit)

- **Commit audited:** `main @ 7a50e34e1`. HEAD at the end of the audit was still `7a50e34e1`. `git diff --stat 7a50e34e1 HEAD` over every cited path is empty, so nothing cited changed during the audit.
- **Read in full:**
  - `src/engine/cms/{CollectionManager,CollectionStorage,CMSBindingManager,CMSExportResolver,RepeaterRenderer,ProductCollectionService,index}.ts`
  - `src/services/{cmsSync,syncRetryQueue}.ts`
  - `src/editor/shell/hooks/useCmsSync.ts`, `src/editor/shell/exportPublishPages.ts`
  - `src/editor/canvas/hooks/{useCMSPreview,useCanvasContent}.ts`
  - `src/engine/data/BaseBindingManager.ts`
- **Read in the relevant parts:**
  - `src/engine/HistoryManager.ts` (record, runWithoutTracking)
  - `src/engine/Composer.ts` (CMS import/export/destroy)
  - `src/editor/shell/hooks/useComposerInit.ts` (setProjectId, products prompt)
  - `src/editor/inspector/sections/{CmsBindingSection,CollectionListSection}.tsx`
  - `src/editor/cms/{FieldInspector,CollectionSettingsPane,fieldUsage}.tsx/.ts`
  - `src/blocks/Ecommerce/*`
  - `src/editor/sidebar/tabs/content/DataRowDialogs.tsx`
  - `server/services/cms.service.ts` (upsertCollection / upsertEntry / sanitize)
  - `prisma/schema.prisma` (Cms models)
- **Prior documents reconciled:**
  - `docs/audits/2026-09-27-module-audit/04-cms.md`
  - `docs/plans/2026-09-28-cms-architecture-proposal.md` §11
  - `docs/audits/2026-10-08-editor-full-audit/phase2-live/L3.md` (L3-015..023)
  - `phase1-code/03-engine.md`
  - `phase1-code/05-pages-cms-components-forms.md` §2
- **Tests run** (from `packages/editor`):
  `npx vitest run src/engine/cms src/services/__tests__/cmsSync src/services/__tests__/syncRetryQueue src/editor/cms src/editor/shell/hooks/__tests__/useCmsSync src/editor/canvas/hooks/__tests__ src/engine/__tests__/Composer.cms src/editor/shell/__tests__/exportPublishPages src/editor/inspector/sections/__tests__/CmsBindingSection src/editor/inspector/sections/__tests__/CollectionList`
  - Result: **76 files. 687 passed, 1 failed, 1 todo (689 tests).**
  - The one failure: `CmsWorkspace.recordSave.test.tsx:167` "multi-select … a chip per option". It timed out at 15 s under parallel load.
  - Re-run alone, that file gave **9/9 passed**. This is the known flake, prior 05 §2 P2-13, reproduced.
- **Probe run:** `tsx scratchpad/cms-audit/probe-limit.ts`. It loads a 60-record published snapshot into `CollectionManager` and calls the exact `queryContent` that `resolveBinding` uses.
  - Output: `returned 50 of total 60 hasMore true`.
  - Output: `pinned r55 found by resolveBinding's lookup? false`.
  - This supports B-02.
- **Confidence vocabulary:**
  - VERIFIED_TEST: a test or probe I ran shows it.
  - CODE_EVIDENCE: read in code, with line references.
  - INFERRED: a reasoned race or consequence that I did not execute.
- **Not done:** no runtime/browser verification and no server tests.

---

## Transition map

The notation is: trigger → handler → state → persistence (IndexedDB + server mirror) → canvas → related panels → history → reload/hydration → publish.

**Create collection**
1. New-collection modal → `CollectionManager.createCollection` (CM:124).
2. IDB `saveCollection`, stamped with `siteId` (CM:147).
3. Emits `CMS_COLLECTION_CREATED` → `useCmsSync.onColUpsert` (useCmsSync:153).
4. `syncCollectionUpsert` → `mirror` writes the outbox (`bk-cms-outbox-v1`, localStorage) before the request.
5. `queue.run` serialises writes per key. The server `upsertCollection` validates fields and pattern, and caps the site at 100 collections.
6. Outcomes:
   - OK → stamp the row.
   - CONFLICT `SLUG_TAKEN` → `adoptServerCollection`.
   - INVALID → `announceInvalid` (**no subscriber**, B-03).
7. Not in undo history (deliberate: a separate store).
8. Reload → `flushCmsOutbox` → `hydrateCmsFromServer` → `refreshFromStorage`.

**Add field**
- `addField` → `updateCollection` → `CMS_COLLECTION_UPDATED` → whole-array collection upsert, with the same mirror as above.
- Field *rename* goes `updateField` → migrate each record → emit `CMS_CONTENT_UPDATED` per record → **then** `updateCollection` (CM:244-261). This is B-01.
- Field *type change* has no conversion (B-10).
- Field *delete* leaves orphan keys in the records (B-18).

**Create / edit / publish record**
1. Record sheet → `createContentItem` / `updateContentItem`. `assertPublishable` runs only when status is published.
2. IDB put → emits CREATED / UPDATED / PUBLISHED / UNPUBLISHED.
3. Mirror path:
   - The sheet calls `markDirectSync` and mirrors directly. Otherwise `useCmsSync` does it.
   - `syncEntryUpsert` → `await queue.settled(collectionUpsert)` → outbox → `entries.upsert` with `expectedUpdatedAt` = the browser-wide stamp.
   - The server sanitises the data, then writes it back locally if it changed (DM-10, cmsSync:834-846).
4. Canvas:
   - `CMSBindingManager.reapplyAll` writes the resolved text into the element model, untracked.
   - `useCMSPreview` bumps `revision` and re-renders the preview.
   - **Both ignore PUBLISHED/UNPUBLISHED events** (B-04).
5. History: record edits are not undoable (deliberate). The untracked model write leaves the history baseline stale (B-14).
6. Publish: the server snapshot of PUBLISHED rows (`fetchPublishSnapshot`) is loaded into a scratch composer via `loadSnapshot`.

**Bind element (field)**
1. Inspector `CmsBindingSection` → `bindToField(…, label)` → `BaseBindingManager.bind`.
2. `flushPending` → map set → `BINDING_CREATED` → async `applyBinding`.
3. When the value resolves, `setContent` runs untracked and then `history.record(label)`.
4. Persistence: `cmsBindings` is in `exportProject` → `sites.saveProject` (`projectCmsBindings`). It is saved **only if the project is dirtied** (B-06).
5. Undo: `importProject` restores the map and the text. Undo works.
6. Reload: `BuildrikSyncProvider` → `importProject` → `import()`. Bindings are restored without being applied.
7. Canvas `useCMSPreview`:
   - re-resolves published records only;
   - sets `data-cms-bound` only when the value resolves (B-04).
8. Publish: `CMSExportResolver.resolveStatic` → `resolveBinding`.
   - Published only.
   - **50-record window** (B-02).
   - Empty value → `""`.

**Collection list**
1. Inspector `CollectionListSection.bind` → transaction → `bindCollectionList` (`repeat:"children"`, `status:"published"`). Starter placeholders are retargeted, then `markDirty`.
2. `CMS_COLLECTION_BOUND` → preview revision.
3. Canvas `RepeaterRenderer.expandChildren({canvas:true})`:
   - **all statuses** (B-05);
   - up to 10,000 items (B-11);
   - record 0 is written into the real children, the rest are clones.
4. Publish: the same renderer with `canvas:false`.
   - Published only.
   - The template is removed and `clearUnresolved` runs.
   - Then `clearItemPlaceholders` page-wide (OK).
   - An empty list ships an empty container (B-17).

**Dynamic (template) page**
1. Dynamic pages pane → `updateCollection({pageSlugPattern,pageTemplatePath})` → mirror. The success toast fires before the server answers (prior P2-5).
2. Export: bindings without an `itemId` on `pageTemplatePath` are written as `{{bk:field}}` tokens (CMSExportResolver:126-128).
3. The server fills one page per PUBLISHED record, escaping text and sanitising richtext (cms.service:845-912).
4. The Pages summary counts the pattern only (prior P2-4, still open).

**Delete / rename**
- *Record delete*
  1. `deleteContentItem` → IDB delete → `CMS_CONTENT_DELETED`.
  2. `syncEntryDelete` drops any pending upsert. NOT_FOUND is treated as GONE.
  3. Canvas: `reapplyAll`. An unresolved binding keeps its stale text (B-04).
- *Collection delete*
  1. `CollectionSettingsPane.remove` unbinds field bindings and lists (CMS-06 fixed).
  2. `deleteCollection` → IDB deletes the collection and its content → `syncCollectionDelete`.
  3. **Entry ops already in the outbox for that collection stay** (B-03).
- *Collection rename (name/slug)*: `updateCollection` → mirror. A server slug clash on UPDATE is unmapped (B-12).
- *Field key rename*: B-01.
- *Element delete / duplicate*: bindings are forgotten or copied (CMSBindingManager:122-133). OK.

---

## Findings

### B-01 Renaming a field key loses data: richtext is stripped, and published records with a required field revert to the old key
- **Classification**
  - Type: Data / Integration.
  - Priority: **P0**.
  - Confidence: VERIFIED_TEST for the root-cause ordering (`CollectionManager.rename.test.ts:30-50` passes and *pins* entries-before-collection). The server-side consequence is CODE_EVIDENCE plus prior LIVE evidence (L3-015).
  - Status: CODE_GAP.
- **Journey / preconditions:** A collection with records holding values under key K. The field is unbound, so the Key input is enabled.
- **Repro A (richtext):**
  1. Field `summary` of type Rich text. Record value `Hello <strong>bold</strong>`.
  2. CMS › Fields › select the field › Key → `excerpt` › Enter.
  3. Watch the network.
  4. Reopen the record.
- **Repro B (required + published):**
  1. Field `title` is required. A record is PUBLISHED.
  2. Rename the key to `name`.
  3. Reload. Open the record and the canvas list.
- **Actual:**
  - (A) Network order is `entries.upsert {excerpt:…}` and then `collections.upsert`. The server still sees `excerpt` as an unknown, non-richtext key, so `stripMarkup` runs and returns `Hello bold`. The DM-10 write-back stores the stripped copy locally. Formatting is lost permanently, in every record.
  - (B) The server validates the PUBLISHED record against the OLD schema, finds `title` missing, and answers INVALID. Because the record has a stamp, `takeServerCopy` restores the old-key data locally. The collection upsert then lands with `name`. Every published record now shows an empty `name`, with the value stranded under `title`. A republish fails validation because `name` is required.
- **Expected:** A rename is atomic. The collection schema is on the server before any record moves, or a single server rename mutation runs.
- **Source:**
  - `src/engine/cms/CollectionManager.ts:244-261` (loop emits per record, then `updateCollection`).
  - `src/services/cmsSync.ts:818`: `await queue.settled(collectionUpsert:…)` returns at once because the collection upsert has not been started yet.
  - `src/services/cmsSync.ts:834-846` (write-back).
  - `src/services/cmsSync.ts` invalid branch (`takeServerCopy`).
  - `server/services/cms.service.ts:67-72` (`sanitizeEntryData`), `:378-380` (validation).
- **Root cause:** Confirmed. Write ordering, and `settled()` only sees ops already started.
- **Impacted modules:** CMS records, dynamic pages (pattern renamed, records not), publish.
- **Recommendation:** In `updateField`, `await this.updateCollection(...)` before migrating records, and make `syncEntryUpsert` wait on a collection op that is *queued or about to be queued*.
  - Better: build proposal C0.2, a server `cms.fields.rename` that migrates `data`, `pageSlugPattern` and `displayField` in one transaction, followed by a rehydrate.
  - Also rewrite `CollectionManager.rename.test.ts:30` (it pins the bug).
- **Acceptance:**
  - (A) After a rename, richtext markup survives in the DB and in the record sheet.
  - (B) Published records with a required field keep their value under the new key, with no INVALID.
  - The network shows `collections.upsert` (or `fields.rename`) before any `entries.upsert`.
- **Prior ID:** L3-015; 05 §2 P1-2; proposal C0.2 (not built).

### B-02 A binding pinned to a specific record publishes EMPTY when that record is not among the 50 most recently edited published records
- **Classification**
  - Type: Functional / Data.
  - Priority: **P1**.
  - Confidence: VERIFIED_TEST (probe: `returned 50 of total 60`, `r55 found? false`).
  - Status: VERIFIED_BROKEN (engine level).
- **Journey / preconditions:**
  - The collection has more than 50 published records.
  - A heading on a normal page is bound to one specific record.
  - The record picker uses `getContentItems`, which returns all records, so any record can be chosen.
- **Repro:**
  1. Import more than 50 records and publish them all, for example via CSV followed by bulk publish.
  2. Bind a heading to the oldest-edited record (Inspector › Content › From CMS › choose record).
  3. Look at the Inspector preview.
  4. Publish and inspect the live heading.
  5. Edit any 50 other records, then republish.
- **Actual:**
  - `resolveBinding` calls `queryContent({status:"published", filter:{}})` with no limit. That falls back to `limit 50`, sorted by `updatedAt desc`, and the code then `find`s the id in that slice.
  - Outside the window the result is the fallback or `""`.
  - Publish writes `""` (C0.7 rule).
  - The canvas keeps stale stored text.
  - The Inspector says "This record isn't published — the page shows nothing here" about a published record.
  - Which records break shifts every time other records are edited.
- **Expected:** A pinned record resolves by id, whatever its position.
- **Source:**
  - `src/engine/cms/CMSBindingManager.ts:225-233`.
  - `src/engine/cms/CollectionManager.ts:467-475` (default `limit || 50`).
  - `src/editor/inspector/sections/CmsBindingSection.tsx:170-180` (same pattern in the preview).
  - The template-mode "first published" path at `CMSBindingManager.ts:214` is unaffected.
- **Root cause:** Confirmed by the probe.
- **Impacted modules:** Publish, /share draft, in-editor Preview (`renderPreviewHtml`), canvas, Inspector binding banner.
- **Recommendation:** Resolve a pinned record with `getContentItem(id)` (or a `getContentItems` lookup) and then check `status === "published"`. Do the same in CmsBindingSection. Add a test with more than 50 records.
- **Acceptance:** With 60 published records, a binding to the 60th-newest resolves on the canvas, in Preview and in the published HTML.
- **Prior ID:** new.

### B-03 CMS ops that can never land stay in the persistent outbox forever and block publish across reloads; collection INVALID is still silent
- **Classification**
  - Type: Integration / State.
  - Priority: **P1**.
  - Confidence: CODE_EVIDENCE.
  - Status: CODE_GAP.
- **Journey / preconditions:** A collection whose create never reached the server. Causes include:
  - the server refused it as INVALID, for example the 101st collection or a bad field/pattern;
  - it was created offline and deleted again before reconnecting;
  - its create kept failing with 5xx.
- **Repro (offline variant):**
  1. DevTools › offline.
  2. Create collection "Tmp" and add a record.
  3. Delete "Tmp".
  4. Go online, reload, try Publish on a site that has any binding.
- **Repro (INVALID variant):** On a site at the collection cap, create one more collection and add a record.
- **Actual:**
  - The collection upsert leaves the outbox. On INVALID that happens through `announceInvalid`, but `onCmsInvalid` has **no subscriber in `src/`**, so no toast appears. On delete, `syncCollectionDelete` drops it.
  - The record's `entryUpsert` remains. The server answers NOT_FOUND "Collection not found" (cms.service:351), which `classify` does not map, so it is queued and retried forever.
  - A failed op is never removed from `bk-cms-outbox-v1`, so it replays on every load.
  - `cmsSyncBlocker` then permanently says "1 CMS change hasn't reached the server yet". "Retry now" cannot clear it.
  - The only escape is clearing localStorage.
- **Expected:**
  - A collection refusal is surfaced with a toast, and the collection is marked local-only.
  - Entry ops whose parent collection was refused or deleted are dropped.
  - NOT_FOUND on an entry upsert whose collection has no server stamp is terminal.
- **Source:**
  - `src/services/cmsSync.ts:265` (`onCmsInvalid`, unsubscribed).
  - `src/services/cmsSync.ts:284-291` (`classify`).
  - `src/services/cmsSync.ts:340` (an outbox entry is removed only on an answered outcome).
  - `src/services/cmsSync.ts:400-428` (blocker).
  - `syncCollectionDelete` (cmsSync ≈781-800) drops only `collectionUpsert`.
  - `src/editor/shell/hooks/useCmsSync.ts:101-151` (conflict and gone are subscribed, invalid is not).
  - `server/services/cms.service.ts:217`, `:351`.
- **Root cause:** Confirmed by code reading.
- **Impacted modules:** Publish (all sites with bindings), sync toast, outbox.
- **Recommendation:**
  - Subscribe `onCmsInvalid` in `useCmsSync` with a toast.
  - In `syncCollectionDelete` and in the INVALID handler for a collection, `queue.drop` and `outboxRemove` every `entryUpsert` / `entryDelete` whose payload's `collectionId` matches.
  - Map entry NOT_FOUND to GONE when the collection was never stamped.
- **Acceptance:** In both repros, publish is not blocked after reload, and a toast explains that the collection was refused or deleted.
- **Prior ID:** L3-019, 05 §2 P1-3 (still open, and broader than first reported).

### B-04 The canvas does not react to publish or unpublish; an unresolved binding shows stale text; the bound marker disappears
- **Classification**
  - Type: State / Integration.
  - Priority: **P1**.
  - Confidence: CODE_EVIDENCE (+ prior LIVE).
  - Status: CODE_GAP.
- **Repro:**
  1. Bind a heading to record R's title.
  2. Edit the title (the canvas updates, which is correct).
  3. Set R to Draft.
  4. Delete R.
  5. Reload.
- **Actual:**
  - Neither `CMSBindingManager` nor `useCMSPreview` subscribes to `CMS_CONTENT_PUBLISHED` / `UNPUBLISHED` (`content:published` / `content:unpublished`), so a status change does not re-render.
  - When re-resolution does happen (delete, or any later update), an empty value returns early on both paths, so the element keeps its last text. Export writes `""`.
  - `data-cms-bound` is set only on a successful resolve, so after reload the bound indicator is gone.
- **Expected:** The canvas mirrors publish: an empty or placeholder state with "unpublished record" marking, and the bound marker always present.
- **Source:**
  - `src/engine/cms/CMSBindingManager.ts:113-115`, `:282` (`if (!value) return`).
  - `src/editor/canvas/hooks/useCMSPreview.ts:81,91,126-129`.
  - The emit site is `CollectionManager.ts:369-387`.
  - Export: `CMSExportResolver.ts:130-138` → `writeBoundValue` `""`.
- **Root cause:** Confirmed: missing subscriptions and a keep-stale fallback.
- **Recommendation:**
  - Add both events to the two listener lists. Do not emit an extra UPDATED, because `useCmsSync` would mirror twice.
  - On the canvas, render the unresolved state as a visible placeholder, not the stale text.
  - Set `data-cms-bound` for every bound element regardless of the value.
- **Acceptance:** Unpublishing a bound record immediately changes the canvas to the empty/placeholder state, and the bound outline survives reload.
- **Prior ID:** L3-016; 05 §2 P1-1.

### B-05 Collection lists on the canvas show drafts and raw `{{item.*}}` (empty or unbound list); this disagrees with field bindings and with publish
- **Classification**
  - Type: Missing State / UX.
  - Priority: **P2**.
  - Confidence: CODE_EVIDENCE.
  - Status: CODE_GAP.
- **Repro:**
  1. Insert a Collection list. It shows `{{item.name}}`-style text before binding.
  2. Bind it to a collection with 0 records: the raw mustache stays.
  3. Add one Draft record: it renders on the canvas, but publish shows nothing.
- **Actual:**
  - `expandChildren` uses `status: canvas ? undefined : …`, so all statuses render, and reference tables include drafts on the canvas.
  - With zero items the template stays as written.
  - Field bindings on the same canvas resolve published only, so one page mixes the two rules.
  - No draft badge exists on the clones.
- **Publish side is correct:** `clearUnresolved` and `clearItemPlaceholders` strip all mustache (VERIFIED_OK).
- **Expected:**
  - Either filter drafts on the canvas, or render them with a "Draft" marker.
  - An empty state for 0 records.
  - Starter placeholders replaced by a designed placeholder.
- **Source:** `src/engine/cms/RepeaterRenderer.ts:155-163, 175-186, 337-347`; `CMSExportResolver.ts:43-67`.
- **Root cause:** Confirmed. The draft behaviour is a deliberate design comment and conflicts with L3-017.
- **Recommendation:** Owner decision. Default to the publish filter, with a "Show drafts" toggle that marks draft clones.
- **Acceptance:** Draft-only list → canvas shows the empty state and publish shows nothing. Zero-record list → no `{{` visible.
- **Prior ID:** L3-017, CMS-17, CMS-18.

### B-06 A field binding whose value does not resolve yet is never saved, and is lost on reload
- **Classification**
  - Type: State / Data.
  - Priority: **P1**.
  - Confidence: CODE_EVIDENCE.
  - Status: CODE_GAP.
- **Repro:**
  1. Create a record and leave it Draft. Or use a published record whose bound field is empty.
  2. Bind a heading to it from the Inspector (it shows "isn't published").
  3. Make no other edit. Wait for autosave, then reload.
- **Actual:**
  - `bind()` never calls `markDirty`.
  - `applyBinding` returns early on an empty value, so no `setContent` and therefore no `markDirty` happen.
  - `history.record(label)` emits only `HISTORY_RECORDED`, and the autosave (`StorageAdapter` and the server save) listens to `PROJECT_CHANGED`.
  - The binding lives only in memory.
  - `bindCollection` and `unbind` *do* call `markDirty` (`CMSBindingManager.ts:340,383`; `BaseBindingManager.ts:142`).
- **Expected:** Every bind dirties the project.
- **Source:** `src/engine/data/BaseBindingManager.ts:84-122`; `src/engine/cms/CMSBindingManager.ts:282`; `src/engine/storage/StorageAdapter.ts:56`.
- **Root cause:** Confirmed by reading. Not executed.
- **Recommendation:**
  - Add `this.composer.markDirty?.()` after `this.bindings.set(...)` in `bind()`.
  - Delete the stale `noteUnrecordedAction` branch and the contradictory comment (`:107-111`), prior P2-6.
- **Acceptance:** Bind to a draft record, reload with no other edit → the binding is still present.
- **Prior ID:** 03-engine P1-7, P2-6.

### B-07 Two tabs in the same browser share conflict stamps, so the second tab silently overwrites the first
- **Classification**
  - Type: Data / Integration.
  - Priority: **P2**.
  - Confidence: INFERRED (from code).
  - Status: CODE_GAP.
- **Repro:**
  1. Open the same site in tabs A and B. In both, open record R's sheet.
  2. Edit the title in A and save. It lands.
  3. In B (still showing the old values), edit the body and save.
- **Actual:**
  - Stamps (`bk-sync-stamps-v1`) are browser-wide in localStorage. A's success updates the stamp, so B sends `expectedUpdatedAt` equal to A's server time.
  - The server accepts. Tab B's sheet posts its full form data, so A's title change is overwritten. No CONFLICT is raised.
  - Tab B's `CollectionManager` and content cache never learn about A's IndexedDB writes: there is no BroadcastChannel and no storage-event listener.
  - Hydration runs only on editor open, CSV import or retry, so cross-device edits are also invisible until reload.
- **Expected:** Two tabs behave like two clients (proposal C0.3 done-condition: "two tabs edit the same record → the second save shows the conflict state").
- **Source:**
  - `src/services/syncRetryQueue.ts:218-292`.
  - `src/services/cmsSync.ts` (`expectedUpdatedAt: serverStampOf(...)` in both upserts).
  - `src/editor/shell/hooks/useCmsSync.ts:49-51` (the only hydrate).
- **Root cause:** Suspected, but the mechanism is clear.
- **Recommendation:**
  - Keep the precondition per tab: the server `updatedAt` the sheet *loaded*, carried on the payload.
  - Or broadcast CMS writes over a `BroadcastChannel` so other tabs refresh and re-stamp.
  - Re-hydrate on focus or visibility.
- **Acceptance:** The scenario above shows "changed elsewhere" in B, and A's title survives.
- **Prior ID:** L3-022 (server accepts blind writes), proposal C0.3 (built as an `updatedAt` precondition, no `version`).

### B-08 Stale payloads written over newer edits: the DM-10 write-back and "Keep mine"
- **Classification**
  - Type: Data.
  - Priority: **P2**.
  - Confidence: INFERRED (write-back race) / CODE_EVIDENCE (keepMine).
  - Status: CODE_GAP.
- **Repro (write-back):**
  1. Make one save whose payload the server sanitises differently. Markup in a plain-text field is enough.
  2. While it is in flight, save again with sanitiser-neutral content.
- **Actual (write-back):**
  - The first response writes `{...item1, data: stored1}` over the local row without checking that the row is unchanged, which reverts edit 2 locally.
  - Edit 2 then lands on the server unchanged, so no second write-back happens.
  - The local `updatedAt` (item1) no longer equals the stamp's `local` (item2), so `serverCopyWins` stays false and the device keeps the stale copy permanently.
  - The next edit from that sheet overwrites the server with stale fields.
- **Actual (keepMine):** It resends the conflict-time `item` captured in the closure. If the toast sits there while the user keeps editing, Keep mine overwrites both the server and the newer local edits.
- **Source:** `src/services/cmsSync.ts:834-846`, `:741-744`, `:857-860`.
- **Recommendation:**
  - Write back only if `Storage.loadContentItem(id).updatedAt === item.updatedAt`.
  - Have `keepMine` re-read the current local row.
- **Acceptance:** A unit test with two queued saves of one record keeps the newer one locally and on the server. Keep mine after further edits sends the latest copy.
- **Prior ID:** 05 §2 P2-7 (keepMine, still open); write-back race is new.

### B-09 Outbox durability gaps: an entry write that waits on a collection write is not persisted yet, and an orphaned local-newer row is never re-sent
- **Classification**
  - Type: Data.
  - Priority: **P2**.
  - Confidence: CODE_EVIDENCE / INFERRED.
  - Status: CODE_GAP.
- **Repro:**
  1. Throttle the network to Slow 3G.
  2. Edit a field's settings (a collection upsert is now in flight) and immediately save a record of that collection.
  3. Close the tab before the collection request returns. Reopen it.
- **Actual:**
  - `syncEntryUpsert` awaits `queue.settled(collectionUpsert)` **before** `mirror()` calls `outboxPut`, so the edit is only in IndexedDB.
  - On reload it is not in the outbox, it has a stamp, and the local `updatedAt` differs from the stamp. `serverCopyWins` returns false: the local copy is kept, and nothing ever re-sends it.
  - Publish (server snapshot) ships the old value, and `cmsSyncBlocker` shows 0 pending.
  - The same stranded state follows a localStorage quota failure in `writeOutbox`, which is silently ignored.
  - Records can be large and the outbox stores full payloads.
- **Also:**
  - The outbox lives in localStorage (proposal C0.5 said IndexedDB). It is a non-atomic read-modify-write shared across tabs.
  - IndexedDB writes resolve on `request.onsuccess`, not `transaction.oncomplete`.
- **Source:** `src/services/cmsSync.ts:112-176, 812-819`; `src/services/syncRetryQueue.ts:278-292`; `src/engine/cms/CollectionStorage.ts:99-110,173-184`.
- **Recommendation:**
  - Call `outboxPut` synchronously at event time, before any await.
  - In hydrate, treat "local `updatedAt` ≠ stamp.local and not in the outbox" as owed: enqueue a mirror instead of keeping it silently.
  - Consider moving the outbox to the IndexedDB store.
- **Acceptance:** The repro above lands the record on the server after reopening.
- **Prior ID:** proposal C0.5 (built with gaps).

### B-10 Changing a field type with existing data: no confirmation and no conversion
- **Classification**
  - Type: Data / UX.
  - Priority: **P2**.
  - Confidence: CODE_EVIDENCE.
  - Status: CODE_GAP.
- **Repro:** On an unbound field with values, change Text → Number, or Rich text → Text.
- **Actual:**
  - `update({type})` is applied at once (the select is disabled only when the field is bound). Records keep their old values.
  - Text → Number: every published record now fails `assertPublishable` / server INVALID on its next save.
  - Rich text → Text: list clones show literal tags, because the text sink uses `textContent`, until the server strips markup on the next save.
- **Source:** `src/editor/cms/FieldInspector.tsx:147-157`; `CollectionManager.updateField` (no data pass).
- **Recommendation:** Add a confirmation with a count of affected records, plus a conversion step: coerce, or strip markup with an explicit warning.
- **Acceptance:** A type change with data asks first, and published records stay publishable or are listed.
- **Prior ID:** CMS-20.

### B-11 Rendering large collections on the canvas: "All" means up to 10,000 clones, re-built on every content change
- **Classification**
  - Type: Performance.
  - Priority: **P2**.
  - Confidence: INFERRED.
  - Status: CODE_GAP.
- **Repro:** Import 2,000 records, bind a Collection list with "Show items" empty (All), then type in any canvas text element.
- **Actual:**
  - `useCMSPreview` re-parses the entire page HTML with `DOMParser` whenever `content` or `revision` changes, and re-expands each list up to `CMS_COLLECTION_LIMIT_MAX = 10_000` (canvas includes drafts).
  - `applyContext` builds a new `RegExp` per attribute × per data key × per element × per record.
  - Every record save also triggers `reapplyAll` over all bound elements on all pages, each calling `setContent` → `markDirty` → autosave.
- **Source:** `src/editor/canvas/hooks/useCMSPreview.ts:34-115`; `src/engine/cms/RepeaterRenderer.ts:157-163, 459-494`; `packages/shared/schemas/sites.ts:167`; `CMSBindingManager.ts:311-316`.
- **Recommendation:**
  - Cap canvas rendering (for example 24 clones plus a "+N more" chip) independently of the publish limit.
  - Memoise expansion per list keyed on (list HTML, collection revision).
  - Precompile the attribute regexes per field.
- **Acceptance:** With 2,000 records the canvas keeps typing latency under 50 ms (measured), and publish still emits every record.
- **Prior ID:** new.

### B-12 Renaming a collection slug to one the server already holds (an update, not a create) is an unmapped 500 that is retried forever
- **Classification**
  - Type: Integration.
  - Priority: **P2**.
  - Confidence: CODE_EVIDENCE.
  - Status: CODE_GAP.
- **Repro:**
  1. Device 1 creates collection "news".
  2. Device 2, opened before that and therefore stale (no re-hydrate during a session), renames its "blog" slug to `news`.
- **Actual:**
  - The update path calls `updateMany`, which hits `@@unique([siteId, slug])` and throws a raw P2002. Only `createCollectionRow` maps P2002 to `SLUG_TAKEN`.
  - The client cannot classify it, so the op is queued and replayed every load, and publish is blocked.
  - If the update were ever mapped to `SLUG_TAKEN`, the client's `adoptServerCollection` would *merge this collection's records into the other collection*. That is wrong for a rename.
- **Source:** `server/services/cms.service.ts:273-287` vs `:213-233`; `src/services/cmsSync.ts:775-790`, conflict handler `:722-737`.
- **Recommendation:** Map a P2002 on update to INVALID "Slug already used by X", and limit adopt to creates (a collection with no stamp).
- **Acceptance:** A clashing rename shows an error and the slug is reverted locally. Publish is not blocked.
- **Prior ID:** new (DM-07 adjacent).

### B-13 Data Sources are paste-only and in memory; Sheets/Airtable/API are "Coming soon"; wave C5 is not built
- **Classification**
  - Type: Functional / Missing.
  - Priority: **P2**.
  - Confidence: CODE_EVIDENCE.
  - Status: EXPECTED_BUT_ABSENT.
- **Actual:**
  - `DataManager.registerSource` / `importSampleData` keep sources in an in-memory map: no `markDirty`, no `dataSources` in `ProjectData` or `exportProject` (prior probe: 1 source before export, 0 after).
  - "Google Sheets" and "Airtable" are rendered disabled with "Coming soon" (`DataRowDialogs.tsx:213-227`).
  - There is no `cms-source.service.ts`, no `cms.sources.*` router and no Prisma source models.
  - The pre-C5 decision "PD-3/5 = remove pasted sources" (proposal C1) was not executed either.
- **Recommendation:** Execute the C1 decision (remove the door) until C5 ships, or persist sources in `projectSettings` like `siteVariables`.
- **Acceptance:** After reload the Sources count matches what was added, or the door is gone.
- **Prior ID:** L3-018, CMS-14, 03-engine P1-6, proposal C5.

### B-14 Untracked CMS writes leave the history baseline stale, so the next undo reverts bound text
- **Classification**
  - Type: State.
  - Priority: **P3** (for CMS: the canvas preview re-resolves and hides it, and export re-resolves).
  - Confidence: CODE_EVIDENCE (+ prior probe in 03-engine).
  - Status: CODE_GAP.
- **Repro:**
  1. Bind a heading to record R.
  2. Edit R's title in CMS: `reapplyAll` writes it untracked.
  3. Change the heading colour, then press ⌘Z.
  4. Unpublish R so the stored text becomes visible.
- **Actual:** `runWithoutTracking` does not refresh `currentStateCache`, so the colour undo also restores the pre-edit content.
- **Source:** `src/engine/HistoryManager.ts:502-512`; `src/engine/cms/CMSBindingManager.ts:294-296`.
- **Recommendation:** Re-base the cache at the end of `runWithoutTracking` (as proposed in 03-engine P1-2).
- **Prior ID:** 03-engine P1-2 (still open).

### B-15 Ecommerce blocks carry `data-bind` / `data-cms-collection` attributes that nothing resolves; `DataBindResolver` is dead
- **Classification**
  - Type: Integration / Enhancement.
  - Priority: **P3**.
  - Confidence: CODE_EVIDENCE.
  - Status: CODE_GAP.
- **Actual:**
  - Inserting Product card or Product grid opens the "create Products collection (+ sample data)" prompt (`useComposerInit.ts:879-916`).
  - The blocks' `data-bind="name"` and the grid's `data-cms-collection="products"` are read only by `DataBindResolver`, which is imported by the barrel only, with no runtime caller.
  - The cards keep static "Product Name / $0.00" on the canvas and in publish.
  - `ProductCollectionService.createProductsCollection` makes about 7 sequential collection upserts (create, one per field, then display field) instead of using `createCollection(init)`.
  - It does not await `initialize()`, so before hydration it can create a duplicate Products collection, which `SLUG_TAKEN` → adopt then repairs.
- **Source:** `src/blocks/Ecommerce/ProductCard.tsx:21-31`, `ProductGrid.tsx:25-31`; `src/engine/cms/index.ts:13-19`; `src/engine/cms/ProductCollectionService.ts:57-96`.
- **Recommendation:** PD-6. Either wire the product blocks as Collection lists over Products, or drop the prompt and delete `DataBindResolver`.
- **Note:** I did not verify whether the Ecommerce category is exposed in the Insert panel.
- **Prior ID:** proposal C4 "Ecommerce: wire … or drop" (open); 05 §2 P2-10.

### B-16 Field usage ignores `{{item.x}}` in attributes, so a field used only in an href/src/alt can be renamed or deleted without the lock
- **Classification**
  - Type: Data.
  - Priority: **P3**.
  - Confidence: CODE_EVIDENCE.
  - Status: CODE_GAP.
- **Source:** `src/editor/cms/fieldUsage.ts:52-62` scans `getContent()` only. Export strips the stale placeholder and removes the URL attribute (`CMSExportResolver.ts:58-66`), so links and images vanish silently.
- **Recommendation:** Also scan the attributes of list descendants.
- **Prior ID:** new.

### B-17 Published Collection list: no empty state; after a collection delete, unbound lists show raw placeholders on the canvas
- **Classification**
  - Type: Missing State.
  - Priority: **P3**.
  - Confidence: CODE_EVIDENCE.
  - Status: CODE_GAP.
- **Actual:**
  - A list with 0 published records publishes an empty container.
  - `CollectionSettingsPane.remove` unbinds lists. Its copy says each element "keeps what it shows now", but list children revert to `{{item.*}}` on the canvas. Publish strips them.
- **Source:** `RepeaterRenderer.ts:186`; `src/editor/cms/CollectionSettingsPane.tsx:71-73, 86-92`.
- **Prior ID:** L3-017(b) adjacent.

### B-18 Engine hygiene (bundle)
- **Classification**
  - Type: State / Data.
  - Priority: **P3**.
  - Confidence: CODE_EVIDENCE.
  - Status: CODE_GAP.
- **Items:**
  - (a) `deleteField` leaves the values in every record. Re-adding the same key resurrects old values (`CollectionManager.ts:266-275`).
  - (b) `queryContent` with `sort` sorts the cached array in place (`:457-465`). There are no callers today.
  - (c) The status `archived` is sent as DRAFT and hydrates as draft (cmsSync:828) — prior P2-3.
  - (d) `getDatabase()` has no `onblocked` and no `db.onversionchange`, so a future `DB_VERSION` bump with an old tab open hangs the CMS store open forever (`CollectionStorage.ts:28-44`).
  - (e) `refreshFromStorage` runs twice per open (hydrate plus `useCmsSync.ts:51`) — prior P2-11.
  - (f) `CMSBindingManager` ignores `CMS_STORE_REFRESHED`, so remote edits do not update stored element text — prior P2-12.
  - (g) The legacy `repeat:"self"` path (`expandRepeaters`) has no runtime caller. Only `repeat:"children"` lists render.
  - (h) Collection lists order by `updatedAt desc` only, with no sort control: fixing a typo moves a record to the top of the live list. This is an enhancement.

---

## VERIFIED_OK strengths (code, plus the suites above passing)

- **Publish reads the server, not IndexedDB** (C0.1):
  - `exportPublishPages.ts:66-91` → `cmsSyncBlocker` → `fetchPublishSnapshot` → scratch `loadSnapshot`, which never touches IndexedDB (`CollectionManager.ts:89-94, 431`).
  - The blocker counts queued, in-flight, outbox and conflicted ops, and hydration in "loading".
- **No raw mustache in published HTML:** `clearUnresolved` per clone plus page-wide `clearItemPlaceholders`, which also removes empty URL attributes.
- **Sanitisation at every output sink:**
  - Richtext goes through `sanitizeRichtext` in `writeBoundValue`, `applyContext` and `CMSBindingManager.applyBinding`; the server does the same on dynamic pages.
  - Non-rich values are inserted as text nodes.
  - Raw-text elements (script, style, textarea…) are skipped.
  - `javascript:` and `data:` URLs are dropped (`isSafeCmsBoundValue`, `isDangerousUrl`).
  - Stored bindings are filtered on import (`filterCmsBindings`).
- **Current-item semantics** (C0.8, `RepeaterRenderer.applyCurrentItem`) and template-page tokens (`{{bk:key}}`, BD-13).
- **Sync protocol:**
  - The persistent outbox (C0.5) is written before each request, with a `seq` guard, replayed in collection → entry → delete order before hydrate.
  - CONFLICT, GONE and INVALID are classified and leave the retry loop.
  - A delete answered NOT_FOUND is treated as GONE.
  - Server tombstones are refused, and the conditional `updateMany` includes `deletedAt: null`.
  - Hydration does not overwrite held rows and deletes only stamped rows.
- **Site scoping:**
  - `setProjectId` is called (`useComposerInit.ts:220`).
  - The IDB v2 `[siteId, slug]` index.
  - Legacy rows with no `siteId` are claimed or marked `~unclaimed` (DM-20).
- **Binding lifecycle:**
  - Element delete forgets bindings; duplicate copies them position by position; page delete prunes.
  - Collection delete unbinds (CMS-06 fixed).
  - Bindings are in the history snapshot, so bind and unbind are single undo steps, and undo restores both the map and the text.
- **Listener hygiene:** `useCMSPreview`, `CollectionListSection` and `useCmsSync` all unsubscribe. `Composer.destroy` removes all listeners. I found no leak.
- **Limits:** "All" really is all (`CMS_COLLECTION_LIMIT_MAX`, BD-08) for lists. Records are created directly as Published in one write (CMS-01 engine side).

---

## Prior findings reconciliation

| Prior ID | Claim | Status @7a50e34e1 | Evidence |
|---|---|---|---|
| L3-015 | Key rename strips richtext | **STILL OPEN** (worse: published+required case reverts keys) | CM:244-261; rename.test pins the order → B-01 |
| L3-016 | Stale bound text; marker lost on reload | **STILL OPEN** | CMSBindingManager:113-115,282; useCMSPreview:81,91,126-129 → B-04 |
| L3-017 | Canvas drafts and raw `{{item.*}}` | **STILL OPEN** on canvas; publish side OK | RepeaterRenderer:159; CMSExportResolver:43-67 → B-05 |
| L3-018 | Sources vanish on reload | **STILL OPEN** | DataManager in-memory; no `dataSources` in ProjectData → B-13 |
| L3-019 | Collection INVALID silent → publish blocked | **STILL OPEN**, broader (outbox makes it survive reloads) | cmsSync:265,340; useCmsSync has no invalid subscriber → B-03 |
| L3-020 | Record delete unguarded | NOT RE-CHECKED (UI). The engine has no guard (`deleteContentItem` is immediate) | CM:392-401 |
| L3-021 | Conflict hides "theirs" | **STILL OPEN**: `CmsConflict` carries no server payload, so no diff is possible without a fetch | cmsSync:189-195 |
| L3-022 | Server accepts blind writes | **STILL OPEN** server-side; the client side worsens with the two-tab stamp sharing | cms.service:398-401 → B-07 |
| L3-023 | UI rough edges | NOT RE-CHECKED (UI, track A) | — |
| 05 §2 P1-1 | Publish/unpublish doesn't update canvas | STILL OPEN | → B-04 |
| 05 §2 P1-2 | Rename races mirror | STILL OPEN | → B-01 |
| 05 §2 P1-3 | INVALID dropped | STILL OPEN | → B-03 |
| 05 §2 P2-1 | `_skipTouchCmsEdited` in public input | STILL OPEN | shared/schemas/cms.ts:391 |
| 05 §2 P2-3 | archived → DRAFT | STILL OPEN | cmsSync:828 |
| 05 §2 P2-4 / P2-5 | Dynamic summary counts pattern only; toast before ack | STILL OPEN | useDynamicPagesSummary.ts:54; DynamicPagesPane.tsx:91 |
| 05 §2 P2-7 | keepMine stale payload | STILL OPEN | cmsSync:741,857 → B-08 |
| 05 §2 P2-10 | DataBindResolver dead | STILL OPEN | barrel only → B-15 |
| 05 §2 P2-11 / P2-12 | Double refresh; bindings ignore STORE_REFRESHED | STILL OPEN | → B-18(e,f) |
| 05 §2 P2-13 | recordSave test flake | **REPRODUCED** (timeout in the full run, 9/9 alone) | this run |
| 03-engine P1-2 | `runWithoutTracking` stale baseline | STILL OPEN | HistoryManager:502-512 → B-14 |
| 03-engine P1-6 | Data sources not persisted | STILL OPEN | → B-13 |
| 03-engine P1-7 | Unresolved bind never autosaved | STILL OPEN | BaseBindingManager:84-122 → B-06 |
| 03-engine P2-6 | Contradictory binding/history comment | STILL OPEN | BaseBindingManager:107-111 |
| 04-cms CMS-01 | Blank drafts pile up | FIXED (engine): create-as-published in one write | CM:300-337 |
| 04-cms CMS-05 | List children bind only via mustache | PARTLY FIXED (C0.8 current item); the image-slot UI was not checked | RepeaterRenderer:198-225 |
| 04-cms CMS-06 | Collection delete unguarded | FIXED (unbinds; consequence copy) | CollectionSettingsPane:60-97 |
| 04-cms CMS-07 | Duplicate record slugs | FIXED (client `assertPublishable` + server clash) | CM:508-523; cms.service:381-390 |
| 04-cms CMS-17 / 18 | Canvas drafts; raw placeholders | STILL OPEN | → B-05 |
| 04-cms CMS-20 | Type change without confirm/convert | STILL OPEN | → B-10 |

**Proposal 2026-09-28 §11 waves, as built:**

| Wave / item | Status |
|---|---|
| C0.1 server snapshot publish | Built |
| C0.2 server field rename | **Not built** |
| C0.3 conflict detection | Built as an `updatedAt` precondition, not a `version` column; the two-tab done-condition is unmet (B-07) |
| C0.4 tombstones | Built |
| C0.5 outbox | Built in localStorage, with gaps (B-09) |
| C0.6 | Not checked |
| C0.7 empty binding writes `""` | Built |
| C0.8 current item | Built |
| C0.9 home page not a template | Built (server refusal) |
| C0.10 `cmsEditedAt` | Built |
| C0.11 / C0.12 | Not checked (UI) |
| C1 | Partial. Built: shared validator, DM-06/07/10/20, Reference fields, BD-08/12/13. Not done: the "remove Sources/Conditions" decision; ecommerce. |
| C5 (sources, views, constants) | **Not built**: no service, router or models |

---

## Not verified
- No runtime or browser checks; every behaviour claim is from code or from the probe and tests above.
- Server-side tests were not run.
- Catalog exposure of the ecommerce blocks.
- Export ZIP and handlebars "template" mode (`resolveTemplate` emits `{{collectionId.field}}`; no caller sets `cmsMode:"template"` was observed).
- C0.6 and C0.11/12.
- UI items L3-020 and L3-023.
