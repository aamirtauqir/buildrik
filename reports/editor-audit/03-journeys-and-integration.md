# 03 — CMS journeys, integration map and traceability

## Run metadata
- **Date:** 2026-10-08 → 2026-10-09 (PKT)
- **Mode:** `audit`
- **Arguments:** `cms deeply`
- **Commit:** `main @ 7a50e34e1`
- **Run flags:** none
- **Runtime:** `localhost:3610`, OWNER account, two browser profiles, no real publish.

## Journey results (live walk, track D)
| # | Journey | Passed / failed steps | Main failures |
|---|---|---|---|
| 1 | Entry points and empty state | 4 / 1 | Workspace root is blank (EDT-044) |
| 2 | Collections and fields | 11 / 4 | Renaming a rich-text key strips formatting (EDT-001); type change has no warning (EDT-023); wizard defaults (EDT-043) |
| 3 | Records | 12 / 5 | CSV values are not coerced (EDT-009); delete has no dependants warning (EDT-027); Escape and focus (EDT-024); a draft duplicate slug blocks the original (EDT-019) |
| 4 | Binding and Collection list | 3 / 6 | 50-record window (EDT-003); stale canvas (EDT-011); Undo gives a new id (EDT-008); drafts and `{{item.*}}` on the canvas (EDT-015); a binding-only change is not saved (EDT-006) |
| 5 | Dynamic pages | 3 / 1 | Reserved and colliding slugs are accepted (EDT-004) |
| 6 | Persistence and concurrency | 4 / 4 | Two tabs lose an update (EDT-002); Keep mine overwrites (EDT-014); Sources vanish (EDT-016); duplicating a site drops CMS (EDT-005) |
| 7 | Offline and recovery | 3 / 3 | An orphaned change never clears (EDT-012); save is not auto-retried (EDT-018); unsynced CMS does not block publish (EDT-012) |
| 8 | Undo and keyboard | 3 / 4 | Unbind takes 2 steps and record saves are not undoable (EDT-035); Escape (EDT-024); closing the panel drops edits (EDT-007) |
| 9 | Pre-publish checks | 2 / 3 | Slug collisions are not flagged (EDT-004); unsynced changes don't block (EDT-012); toasts cover Cancel (EDT-017) |
| **Total** | | **45 / 31** | |

**Critical journey 5** (define collection → add record → bind → preview → publish) is **not complete**. Every step up to preview works on the happy path. The publish step was deliberately not executed. At least five issues alter what would publish: EDT-003, EDT-004, EDT-006, EDT-011 and EDT-015.

## Transition map (trigger → handler → state → persistence → canvas → panels → history → reload → publish)
Taken from track B, with the runtime verdict added.

| Operation | Chain | Breaks at | Issue |
|---|---|---|---|
| Create collection | Modal → `CollectionManager.createCollection` → IndexedDB → `CMS_COLLECTION_CREATED` → `useCmsSync` → outbox → `collections.upsert` → stamp | When the server refuses (INVALID), nothing listens | EDT-012 |
| Add field | `addField` → `updateCollection` → whole-array collection upsert | — (VERIFIED_OK) | — |
| Rename field key | `updateField` → per-record `CMS_CONTENT_UPDATED` → entry upserts → **then** collection upsert | Ordering: the server sanitizes against the old schema | EDT-001, EDT-028 |
| Change field type | `update({type})` with no data pass | No conversion | EDT-023 |
| Create / edit record | Sheet → `create/updateContentItem` → IndexedDB → mirror (`expectedUpdatedAt` = browser-wide stamp) → server sanitizes → write-back | Stamp shared across tabs; write-back race | EDT-002, EDT-033 |
| Publish / unpublish record | `CMS_CONTENT_PUBLISHED/UNPUBLISHED` → mirror | Canvas and binding manager don't listen | EDT-011 |
| Delete record + Undo | `deleteContentItem` → tombstone; Undo → `saveRecord(null…)` → new id | New id | EDT-008, EDT-027 |
| Bind element | Inspector → `bind` → map → async `applyBinding` → `setContent` + `history.record` → autosave only if marked dirty | No `markDirty` in `bind()`; empty value returns early | EDT-006, EDT-003 |
| Collection list | `bindCollectionList` → `RepeaterRenderer.expandChildren({canvas:true})`, all statuses, up to 10k | Canvas ≠ publish; performance | EDT-015, EDT-034 |
| Dynamic page | Pane → `updateCollection({pattern, template})` → server `appendDynamicPagesToPublish` at publish time | Reserved paths; synchronous generation; duplicate paths | EDT-004, EDT-010, EDT-020 |
| Delete collection | `remove` unbinds → `deleteCollection` → tombstone + entries | Unbinds before the delete succeeds; child ops left in the outbox | EDT-029, EDT-012 |
| Duplicate site | `sites.duplicateSite` copies `projectCmsBindings` only | No CMS rows | EDT-005 |
| Reload / second device | `flushCmsOutbox` → `hydrateCmsFromServer` → `refreshFromStorage` | Works across profiles; a binding-only change is lost; Sources lost | EDT-006, EDT-016 |
| Publish | `cmsSyncBlocker` → `fetchPublishSnapshot` → scratch composer → `CMSExportResolver` → server dynamic pages | 50-record window; slug paths | EDT-003, EDT-004 |

## Cross-module integration seams
| Seam | Status | Issues |
|---|---|---|
| CMS ↔ Inspector (binding) | Partial | EDT-003, EDT-006, EDT-045, EDT-046 |
| CMS ↔ Canvas (preview) | Broken: canvas ≠ publish | EDT-011, EDT-015, EDT-034, EDT-053 |
| CMS ↔ Pages (dynamic pages) | Partial | EDT-004, EDT-047, EDT-049 |
| CMS ↔ Publish (snapshot, pre-checks) | Server side sound; gaps at the edges | EDT-004, EDT-010, EDT-012, EDT-017, EDT-020 |
| CMS ↔ Sites (duplicate) | Broken | EDT-005 |
| CMS ↔ History (undo) | Partial | EDT-008, EDT-035 |
| CMS ↔ Save / recovery | Partial | EDT-006, EDT-007, EDT-018 |
| CMS ↔ Approval workflow | Bypassable | EDT-021 |
| CMS ↔ Forms | Not examined in this run (Forms → CMS destination not in scope) | — |
| CMS ↔ AI | Absent (see `04`) | — |

## Traceability: issue → evidence → code area → test
| Issue | Evidence | Code area | Test that would catch it (today) |
|---|---|---|---|
| EDT-001 | D-01, `E/shots/j2-11-key-renamed.png`, A probe P6 | `engine/cms/CollectionManager.ts:244-261`, `server/services/cms.service.ts:67-74` | `CollectionManager.rename.test.ts:30` pins the bug and must be rewritten |
| EDT-002 | D-02, `j6-10-same-context-tab2.png` | `services/syncRetryQueue.ts:218-292`, `cmsSync.ts` | None |
| EDT-003 | D-08, B probe-limit | `CMSBindingManager.ts:225-233`, `CollectionManager.ts:467-475` | None (needs a >50-record fixture) |
| EDT-004 | D-09, A probe P8 | `shared/schemas/cms.ts:295-344`, `lib/publish-files.ts:176-179` | None |
| EDT-005 | D-07, A-03 | `server/services/sites.service.ts:458-530` | None (duplicate tests ignore CMS) |
| EDT-006 | D-03, B-06 | `engine/data/BaseBindingManager.ts:84-122` | None |
| EDT-007 | D-04 | `shell/StudioPanels.tsx:449`, `RecordSheet.tsx:242-261` | None |
| EDT-008 | D-05, C-02 | `CmsWorkspace.tsx:486-488`, `useContentPanel.ts:221-249` | None |
| EDT-009 | D-06, A-12 | `cms.service.ts:556-566` | `cms-csv-import.test.ts` (does not assert types) |
| EDT-010 | A-04 bench | `publish.service.ts:493-512` | None |
| EDT-011 | D-10, B-04 | `CMSBindingManager.ts:113-115,282`, `useCMSPreview.ts` | None |
| EDT-012 | D-12, B-03 | `cmsSync.ts:265,284-291,340,400-428` | `cmsSync.outbox.test.ts` (no terminal-NOT_FOUND case) |
| EDT-013 | D-20, A probe P1 | `cms.service.ts:184-194` | `cms-conflict.db.test.ts:60` pins the bypass |
| EDT-014 | D-17, C-06, board `8139:217560` | `RecordSheet.tsx:612-638`, `cmsSync.ts:741-744` | None |
| EDT-015 | D-11, B-05 | `RepeaterRenderer.ts:155-186` | `RepeaterRenderer.test.ts` (asserts canvas drafts by design) |
| EDT-016 | D-16, B-13 | `DataManager`, `DataRowDialogs.tsx` | None |
| EDT-017 | D-14 | chrome-ui overlay / toast layering | None |
| EDT-018 | D-13 | save / recovery hooks | None |
| EDT-019 | D-15, D-25 | `shared/schemas/cms.ts:323-344` | None |
| EDT-020 | A probe P5 | `cms.service.ts:236-305` | None |
| EDT-021 | A probe P2 | `shared/schemas/cms.ts:389-391` | None |
| EDT-022 | A-08 | `routers/cms.ts:87-97` | None |
| EDT-023 | D-22, B-10, C-08 | `FieldInspector.tsx:147-160`, `CollectionManager.ts:223-275` | None |
| EDT-024 | D-18, C-07 | `RecordSheet.tsx:505-516`, `RecordsTable.tsx:169-182` | None |
| EDT-025–EDT-034 | See `02` per issue | See `02` | None found |
| EDT-035–EDT-054 | See `02` per issue | See `02` | Mostly none; EDT-036/037/038 have scratch probes (not committed) |

**Root-cause clusters** (synthesis):
1. **Write ordering and atomicity across engine ↔ server:** EDT-001, EDT-028, EDT-029, EDT-033. One missing primitive: server-side schema operations (C0.2).
2. **Concurrency preconditions:** EDT-002, EDT-013, EDT-014, EDT-036, EDT-041. C0.3 is half-built.
3. **The canvas rule differs from the publish rule:** EDT-003, EDT-011, EDT-015, EDT-034. The canvas re-implements resolution with different filters and limits.
4. **Dirty, save and lifecycle events not raised:** EDT-006, EDT-007, EDT-016, EDT-018.
5. **Validation is per write and per layer, not per path:** EDT-004, EDT-019, EDT-020, EDT-037, EDT-038.
6. **Features added after their neighbours:** EDT-005 (duplicate), EDT-042 (ecommerce), EDT-021 (internal option leaked into the schema).
7. **The C2 IA wave is unbuilt, and the boards share the gaps:** EDT-026, EDT-031, EDT-032, EDT-014, EDT-043.


---

## Re-audit 2026-10-09: journey deltas (main @ `50ab12da6`)
| Journey (10-08) | Re-walked step | Result |
|---|---|---|
| 2 Collections and fields | Rich-text key rename; required key on a published record | **Pass** (was fail) · URL-pattern key locked · SEO patterns stale (EDT-028) |
| 4 Binding | Re-pin to a draft → autosave → reload | **Pass** (was fail) |
| 4 Binding | Unpublish / delete / reload a bound record | **Pass** on the publish mirror and the marker · empty element is 0px (EDT-055) |
| 7 Offline and recovery | Offline edits → online | Auto-save **pass** (1.17 s) · recovery toast lingers (EDT-018) · duplicate attempt after reload (EDT-059) |
| 6 Persistence and concurrency | Two tabs, same profile | **Fail** (EDT-002, re-confirmed) · cross-profile CONFLICT still OK |
| 5 Dynamic pages (new steps) | Template page slug change; template page delete | **Fail**: disconnects silently (EDT-056); generic confirm (EDT-057) |

**Traceability additions:**
| Issue | Evidence | Code area | Test |
|---|---|---|---|
| EDT-001 | `r1-*`, net 06:41 | `CollectionManager.ts` updateField (`56a31dbbc`) | `CollectionManager.rename.test.ts` (now asserts collection-first) |
| EDT-006 | `r2-*` | `BaseBindingManager.ts` bind (`a51581f6c`) | `CMSBindingManager.lifecycle.test.ts` |
| EDT-011 | `r3-*` | `useCMSPreview.ts`, `CMSBindingManager.ts` (`4180deaca`, `701c28522`) | `useCanvasContent.cms.test.tsx` |
| EDT-055 | `r3-04/05` | `useCMSPreview.ts` empty write | none → placeholder test |
| EDT-056 | `r6-06/07` | `shared/schemas/cms.ts:366`, `recordTemplatePreview.ts:42` | none → template-rename test |
| EDT-057 | `r6-08` | Pages delete dialog | none |
| EDT-058 | r6a | `RecordsTable.tsx`, `FieldsTable.tsx` row size | none → computed-height check |
| EDT-061 | code | `cms.service.ts`, `site-detail.service.ts:285` | none |
