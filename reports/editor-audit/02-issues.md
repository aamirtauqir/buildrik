# 02 — CMS issue register

## Run metadata
- **Date / mode / arguments:** 2026-10-08 → 2026-10-09 (PKT) · `audit` · module `CMS`, free text "deeply" (scoped `audit cms`)
- **Repository / ref / commit:** `/Users/shahg/Desktop/pencil/buildrik`, `main @ 7a50e34e1`. When this was written HEAD was `98ca128b1`. `git diff --stat 7a50e34e1 98ca128b1` over every CMS path cited here is empty (brand-only commits), so the evidence is current.
- **Figma:** file `g4GzQFqzNYz5sosz1QtZXC`, page `4418:45431` (Editor v3 · IA). 10 `get_screenshot` calls, serial, all successful. Nodes: `4428:143182`, `4428:144760`, `4428:147552`, `4428:147857`, `4428:148660`, `7063:79200`, `7995:205467`, `8139:217560`, `4418:84646`, `6881:70349`. PNGs are in `evidence/cms-2026-10-08/figma/`.
- **Environment and user access:**
  - Local dev server `localhost:3610`, run from the worktree `~/Desktop/buildrik-worktrees/editor-live-audit` (detached at `7a50e34e1`).
  - Playwright Chromium, 1440×900, two separate browser profiles.
  - Account `qa@buildrik.local`, role OWNER.
  - Throwaway sites `cmuzvsl4g0008ax1oyiouzh89` and its duplicate `cmuzzp94y0053ax1ofnj4przb`, both deleted at the end (soft delete, `evidence/cms-2026-10-08/cleanup.json`).
  - **No real publish:** publish requests were aborted at the network layer. The workspace has a real Vercel connection.
  - Local test DB `buildrik_test` for the DB-tier tests.
- **Run flags:** none. Runtime and Figma were both reachable. Coverage is partial; see `06-coverage-and-blockers.md`.
- **Modules discovered / audited:** this is a scoped audit of CMS plus the seams it touches (Inspector binding, Canvas preview, Pages/dynamic pages, Publish pre-checks and snapshot, Site duplicate, sync/outbox, History). Other editor modules are out of scope for this run (see `06`).
- **Subagents used:** yes, 4 read-only tracks: A server/data/security, B engine/sync/export, C UI/IA/a11y + Figma, D live runtime. Their full reports are in `evidence/cms-2026-10-08/tracks/` and are cited below as `A-nn`/`B-nn`/`C-nn`/`D-nn`.
- **`git status` before / after:** before, no tracked changes. After, no tracked changes; the only new path is the untracked `reports/`.
- **Evidence key:** `E/` = `reports/editor-audit/evidence/cms-2026-10-08/`. Screenshots are `E/shots/<name>.png`. Network/console logs and probe scripts were **not** copied into the repo because they contain session credentials; they lived in the session scratchpad only. Their findings are quoted in the track reports.

> **Re-audit 2026-10-09 (commit `50ab12da6`):** see the section at the end.
> - 3 issues are fixed (EDT-001, 006, 011) and 2 are partly fixed (EDT-018, 028). EDT-002 is re-confirmed broken.
> - 8 new issues: EDT-055…062.
> - The severity counts below are from the original audit; the current open counts are in the re-audit section.

## Severity summary
| Priority | Count | Principal blockers |
|---|---:|---|
| P0 | 2 | Field-key rename strips rich text from every record (EDT-001). Two tabs in one browser silently lose an update (EDT-002). |
| P1 | 8 | Pinned record beyond the 50-record window publishes empty (EDT-003). A reserved slug like `api` makes the whole site unpublishable (EDT-004). A duplicated site loses its CMS (EDT-005). A binding-only change is never saved (EDT-006). Closing the CMS panel discards record edits (EDT-007). Undo-delete gives the record a new id (EDT-008). CSV import doesn't coerce types (EDT-009). Dynamic pages render inside the publish request (EDT-010). |
| P2 | 24 | Canvas ≠ publish (EDT-011, EDT-015). Sync and recovery (EDT-012, EDT-013, EDT-018, EDT-033). Conflict UX (EDT-014). Schema-change safety (EDT-020, EDT-023, EDT-028). Security (EDT-021, EDT-022). Accessibility (EDT-024, EDT-025). The IA restructure C2 is unbuilt (EDT-026, EDT-031, EDT-032). |
| P3 | 20 | Server hardening, copy, design-system bypasses, polish |
| **Total** | **54** | |

## Issues
| ID | Module | Type | Priority | Confidence | Status | Evidence | Summary | Expected | Proposed next action |
|---|---|---|---|---|---|---|---|---|---|
| EDT-001 | CMS | Data | P0 | VERIFIED_RUNTIME | VERIFIED_OK · fixed (re-audit 10-09) | D-01, A-01 (probe P6), B-01 | Renaming a field key strips rich-text formatting from every record | Rename preserves values; schema changes before records move | Build server `cms.fields.rename` (C0.2); stop-gap: await the collection upsert first |
| EDT-002 | CMS | Data | P0 | VERIFIED_RUNTIME | VERIFIED_BROKEN · re-confirmed 10-09 | D-02, B-07 | Two tabs, same browser: the 2nd save silently overwrites the 1st tab's edit | The 2nd tab gets a CONFLICT | Per-tab precondition (loaded `updatedAt`) or BroadcastChannel |
| EDT-003 | CMS → Publish | Functional | P1 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-08, B-02 (probe) | A binding pinned to a record outside the newest 50 published resolves empty | Resolve a pinned record by id | `getContentItem(id)` + status check |
| EDT-004 | CMS → Pages/Publish | Integration | P1 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-09, A-02 (probe P8) | Slugs `api`/`index`/the template's slug are accepted; `api/…` fails the whole deploy | Refuse or flag reserved and colliding paths | Run `publishPathError` in `cmsRecordClash`; pre-publish row |
| EDT-005 | Sites → CMS | Integration | P1 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-07, A-03 | Duplicating a site copies the bindings but no collections or records | Copy CMS with re-pointed ids, or clear the bindings and say so | Extend `duplicateSite` transaction |
| EDT-006 | CMS → Inspector | State | P1 | VERIFIED_RUNTIME | VERIFIED_OK · fixed (re-audit 10-09) | D-03, B-06 | A binding-only change (re-pin, bind to a draft or empty field) never autosaves and reverts on reload | Every bind dirties the project | `markDirty` in `BaseBindingManager.bind` |
| EDT-007 | CMS | Data | P1 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-04, C-12 | Closing the CMS panel ✕ discards unsaved record edits without asking | Same discard guard as every other exit | Route panel close through `shellDirty` |
| EDT-008 | CMS | Integration | P1 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-05, C-02 | Undo after a record delete re-creates the record with a NEW id; bindings and references break | Undo restores the same id | Restore by id + server un-tombstone |
| EDT-009 | CMS | Data | P1 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-06, A-12 | CSV import stores everything as text: `false` shows Yes, `abc` lands in a number field, number sort is lexicographic | Coerce per field type; report bad rows | Typed coercion in `importCsvEntries` |
| EDT-010 | CMS → Publish | Performance | P1 | CODE_EVIDENCE | CODE_GAP | A-04 (bench 231 ms/page) | Dynamic pages are rendered and sanitized synchronously in `sites.publish`, then stored in one JSON row | Generation in the worker, bounded | Move generation to the publish worker |
| EDT-011 | CMS → Canvas | Integration | P2 | VERIFIED_RUNTIME | VERIFIED_OK · fixed; placeholder → EDT-055 (re-audit 10-09) | D-10, B-04, L3-016 | The canvas ignores publish/unpublish/delete; stale text; the bound marker is lost on reload | Canvas mirrors publish; marker always on | Subscribe to PUBLISHED/UNPUBLISHED; placeholder state |
| EDT-012 | CMS sync | Integration | P2 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-12, B-03, A (L3-019) | An outbox op that can never land replays forever ("1 CMS change didn't sync" on every load); the publish gate disagrees; INVALID has no listener | Terminal errors drop the op and explain why | Drop child ops on parent refusal or delete; subscribe `onCmsInvalid` |
| EDT-013 | CMS server | State | P2 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-20, A-06 (probe P1), L3-022 | Optimistic concurrency is opt-in: writes without `expectedUpdatedAt` overwrite newer saves | A missing precondition on an existing row = CONFLICT | Require the precondition (or C0.3 `version`) |
| EDT-014 | CMS | UX | P2 | VERIFIED_RUNTIME | BOTH_GAP | D-17, C-06, B-08, board `8139:217560`, L3-021 | The conflict banner hides "theirs"; Use theirs is primary; Keep mine overwrites the other user's fields | Field diff; safe choice; field-level merge | Return the server row with CONFLICT; per-field diff UI |
| EDT-015 | CMS → Canvas | Missing State | P2 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-11, B-05, B-17, L3-017 | The canvas Collection list shows drafts and raw `{{item.*}}`; no empty state anywhere | Publish filter or marked drafts; designed empty state | Owner decision + implement |
| EDT-016 | CMS / Data | Functional | P2 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-16, B-13, L3-018 | Data Sources added from JSON vanish after the session; Sheets/Airtable are "Coming soon"; C5 not built | Persist or remove the door until C5 | Execute the C1 decision (hide) or persist |
| EDT-017 | Shell/Publish | UX | P2 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-14 | Sync toasts cover the Publish confirm's **Cancel**; banners cover the topbar and CMS tabs | Overlays never cover modal actions | Toast layer below modals; banner layout |
| EDT-018 | Save/recovery | State | P2 | VERIFIED_RUNTIME | VERIFIED_BROKEN · partly fixed (re-audit 10-09) | D-13 | The project save isn't auto-retried after reconnect; "Restore my edits" outlives a successful save | Auto-retry on `online`; clear the prompt on success | Retry hook + recovery-state reset |
| EDT-019 | CMS | Functional | P2 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-15, D-25 | A draft with a duplicate slug blocks the original from publishing; error text and the eligibility line disagree | Refuse the dup at save or import; one coherent message | Slug uniqueness at draft save/import; inline Slug error |
| EDT-020 | CMS server | Data | P2 | VERIFIED_TEST | VERIFIED_BROKEN | A-07 (probe P5) | Schema or pattern changes never re-check published records → two pages at one path | Refuse or demote; never emit duplicate paths | Re-validate on collection upsert; dedupe in generator |
| EDT-021 | CMS server | Security | P2 | VERIFIED_TEST | VERIFIED_BROKEN | A-05 (probe P2) | Client-settable `_skipTouchCmsEdited` lets an EDITOR bypass approval invalidation | Internal-only option | Remove it from the transport schema |
| EDT-022 | CMS server | Security | P2 | CODE_EVIDENCE | CODE_GAP | A-08 | `cms.generateDynamicPages` (no UI caller) lets a VIEWER force heavy server CPU with a 2 MB template | No amplification endpoint for the lowest role | Delete the procedure, or gate, cap and rate-limit it |
| EDT-023 | CMS | Data | P2 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-22, B-10, C-08, B-18a | Field type change applies instantly with no confirm or conversion; field delete leaves values that resurrect | Confirm + count + conversion; delete purges | Type-change dialog + migration |
| EDT-024 | CMS | Accessibility | P2 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-18, C-07 | Keyboard-opened record sheet: focus stays on the row, Escape does nothing, focus goes to BODY after delete | Focus moves in; Escape closes; focus returns | `useColumnPanelEscape` + focus management |
| EDT-025 | CMS | Accessibility | P2 | CODE_EVIDENCE | CODE_GAP | C-14 | Div tables: 50 Tab stops; invalid `aria-selected`; unlabeled image controls; errors not associated | axe-clean grid and form | Grid pattern + `aria-invalid`/`describedby` |
| EDT-026 | CMS | Missing State | P2 | VERIFIED_RUNTIME | BOTH_GAP | C-03, D-19, board `4428:143182` | Records table has no status column/filter, bulk select/actions, or row actions | C2 table spec | Status column + filter first, then bulk |
| EDT-027 | CMS | UX | P2 | CODE_EVIDENCE | CODE_GAP | C-05, A-10 | Deleting a record referenced or pinned elsewhere gives no warning (client or server) | Count dependants → typed confirm | Dependant count in RecordSheet + server guard |
| EDT-028 | CMS | Functional | P2 | VERIFIED_RUNTIME | VERIFIED_BROKEN · partly fixed (re-audit 10-09) | C-09, B-16 | Key rename misses the SEO patterns; field usage ignores SEO and attribute `{{item.x}}`, so in-use fields can be deleted | Every use found and rewritten | Extend rename + `fieldUsage` |
| EDT-029 | CMS | State | P2 | CODE_EVIDENCE | CODE_GAP | C-13 | Collection delete unbinds before deleting with no catch; rename / Add field / Dynamic pages save swallow errors | Atomic delete; visible errors | Delete-then-unbind; catch + toast |
| EDT-030 | CMS | IA | P2 | FIGMA_EVIDENCE | CODE_GAP | C-10, board `4428:147552` | "Used by" names no page; "Open the binding" lands in Layers on the first use only | Page-qualified links to the element + binding section | Implement per board |
| EDT-031 | CMS | IA | P2 | VERIFIED_RUNTIME | BOTH_GAP | C-11, D-24, boards `4428:147857`, `4428:148660` | Dynamic pages and Settings hide behind an unlabeled ⋯ that mixes navigation and actions | 4 named tabs; ⋯ = Import/Export | C2 restructure + board update |
| EDT-032 | CMS | IA | P2 | FIGMA_EVIDENCE | BOTH_GAP | C-01, boards `4428:144760`, `8139:217560` | The record editor is a full overlay with a duplicate tab row, not the approved 480px dock (PD-10) | PD-10 dock; table stays live | Build C2 dock; update ~11 boards |
| EDT-033 | CMS sync | Data | P2 | CODE_EVIDENCE | CODE_GAP | B-08, B-09 | DM-10 write-back can revert a newer local edit; entry ops waiting on a collection op aren't in the outbox yet; local-newer orphans never re-sent | Newest edit always wins locally and lands | Guarded write-back; outbox put at event time |
| EDT-034 | CMS → Canvas | Performance | P2 | INFERRED | CODE_GAP | B-11 | "All" lists render up to 10,000 clones on the canvas, rebuilt on every content change | Canvas cap + memoised expansion | Cap canvas clones (e.g. 24 + "+N") |
| EDT-035 | CMS → History | State | P3 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-21, B-14 | Unbind = 2 undo steps; record saves not undoable (undocumented); untracked writes leave a stale history baseline | One step per user action; documented scope | Single transaction; re-base the cache |
| EDT-036 | CMS server | Functional | P3 | VERIFIED_TEST | VERIFIED_BROKEN | A-09 (probe P4) | Concurrent first write of one record → raw Prisma P2002 500 (message leaks) | CONFLICT with the winner's stamp | Catch P2002; mask 500s |
| EDT-037 | CMS server | Data | P3 | VERIFIED_TEST | VERIFIED_BROKEN | A-10 (probe P7) | Server accepts dangling required references; no server delete guard; one reference hop only | Live-reference check; IN_USE refusal | Server checks |
| EDT-038 | CMS server | Security | P3 | VERIFIED_TEST | VERIFIED_BROKEN | A-11 (probe P3) | Entry writes validate against `input.collectionId`, not the record's own collection (same-site bypass) | Validate against the stored collection | Compare `existing.collectionId` |
| EDT-039 | CMS server | Missing State | P3 | CODE_EVIDENCE | EXPECTED_BUT_ABSENT | A-13 | No activity log, restore, tombstone purge or rate limits for CMS (C2) | C2 server items | Build with C2 |
| EDT-040 | CMS server | Performance | P3 | CODE_EVIDENCE | CODE_GAP | A-14, B-18c | `entries.list` unpaginated; O(bindings×records) pre-check; `archived` round-trips as draft | Paginated; indexed; one status model | Cursor pagination; status decision |
| EDT-041 | CMS sync | Integration | P3 | CODE_EVIDENCE | CODE_GAP | B-12 (UI path NOT REPRODUCED in D) | A stale device renaming a collection slug to a taken one → unmapped 500 retried forever | Mapped INVALID; slug reverted | Map P2002 on update; adopt only on create |
| EDT-042 | CMS / Ecommerce | Integration | P3 | CODE_EVIDENCE | CODE_GAP | B-15 | Product blocks carry `data-bind` that nothing resolves; `DataBindResolver` is dead; Products prompt creates via 7 upserts | Wire or drop (PD-6) | Owner decision PD-6 |
| EDT-043 | CMS | Design | P3 | VERIFIED_RUNTIME | BOTH_GAP | D-23, C-21, board `4418:84646` | New-collection wizard: fake stepper and drag handle, title flips, title not required, empty multiselect, key `published-on` vs label | Honest single-step modal; sane defaults | Drop chips/handle; defaults |
| EDT-044 | CMS | Missing State | P3 | VERIFIED_RUNTIME | CODE_GAP | C-15, C-16, D-24 | No loading skeleton (previous rows flash); the workspace root is a blank grey pane | Skeleton; collections overview | Per F2 #1/#2 |
| EDT-045 | CMS → Inspector | UX | P3 | VERIFIED_RUNTIME | BOTH_GAP | C-17, C-19, D-24, board `7995:205467` | Field picker shows keys not names; two type-label maps; "Open affected record" beside "Nothing is bound" | Names; one label map; honest copy | Import `fieldTypes` labels |
| EDT-046 | CMS → Inspector | UX | P3 | CODE_EVIDENCE | BOTH_GAP | C-20, boards `7995:205467`, `7063:79200` | Record picker is a flat unsearchable list; switching Collection hides Unbind while the old binding stays live | Searchable combobox; visible state | Combobox + board update |
| EDT-047 | CMS → Pages/Publish | UX | P3 | VERIFIED_RUNTIME | BOTH_GAP | C-24, D-26, board `4428:147857` | "Generate N pages" only saves; copy over-promises; stale template list; publish confirm says "2 pages" while 59 generate | Honest copy and counts | Copy + count fix |
| EDT-048 | CMS | UX | P3 | CODE_EVIDENCE | CODE_GAP | C-25 | Search matches raw rich-text HTML; no status or field filters or Views | Text search; filters | With C2/C5 Views |
| EDT-049 | CMS → Pages | IA | P3 | CODE_EVIDENCE | CODE_GAP | C-26 | Pages "+N from collections" opens one collection even when N spans several | Lists all sources | Small fix |
| EDT-050 | CMS | UX | P3 | CODE_EVIDENCE | CODE_GAP | C-27, C-04 nit | "New Statu"/"New Categorie" singularisation; draft save toast says "live… next build"; "Delete record…" with no dialog | Correct copy | Copy pass |
| EDT-051 | CMS | Design | P3 | CODE_EVIDENCE | CODE_GAP | C-22 | Raw Tailwind palette/defaults in 3 CMS files; stale `@lint-hex-policy` exemption | `--bk-*` tokens only | Token pass; drop the exemption |
| EDT-052 | CMS | UX | P3 | CODE_EVIDENCE | CODE_GAP | C-23 | CSV (server) and JSON (client) import differ; error step is a dead end; Escape abandons an in-flight import | One server path; Back; guarded close | Per C2 import spec |
| EDT-053 | CMS → Canvas | Functional | P3 | VERIFIED_RUNTIME | VERIFIED_BROKEN | D-27 | Console: `el.getId is not a function` in `useCanvasEditorFlags` on bind; React key warning `RecordsTable.tsx:147` | Clean console | Fix handler arg; keys |
| EDT-054 | CMS engine | State | P3 | CODE_EVIDENCE | CODE_GAP | B-18 b,d,e,f,g,h | In-place sort, no IDB `onversionchange`, double refresh, bindings ignore `STORE_REFRESHED`, dead `repeat:self`, list order by updatedAt only | Hygiene | Hygiene pass |

---

### EDT-001 — Renaming a field key strips rich-text formatting from every record
- **Type / Priority / Confidence / Status:** Data / P0 / VERIFIED_RUNTIME (also VERIFIED_TEST: server probe P6; the ordering is pinned by `CollectionManager.rename.test.ts:30`) / VERIFIED_BROKEN
- **User journey / preconditions:** A collection has a rich-text field with records. The user renames the field key in CMS › Fields › field inspector. The key is editable while the field is unbound.
- **Reproduction steps:**
  1. Posts (65 records) has a `body` rich-text field. "First post" = `Hello <strong>bold</strong> world`.
  2. Fields › `body` › Key → `content` › Enter.
  3. Reopen the record.
- **Actual result:**
  - The client sends 65 `cms.entries.upsert` calls with the new key *before* `cms.collections.upsert`.
  - The server still treats `content` as unknown/plain text and strips the markup.
  - The stripped copy is written back locally. `First post.content` = `Hello bold world` in every record.
  - A variant from the code track did **not** reproduce live: a published record with a required field reverting to its old key. A required-text rename kept its value.
- **Expected result:** Values are preserved byte-for-byte. The collection schema (or a single server rename) lands before any record moves.
- **Source location(s):**
  - `packages/editor/src/engine/cms/CollectionManager.ts:244-261`
  - `packages/editor/src/services/cmsSync.ts:818,834-846`
  - `server/services/cms.service.ts:67-74`
  - No `renameField` exists in `server/` or `packages/shared`.
- **Figma node / screenshot:** `E/shots/j2-11-key-renamed.png`
- **Runtime trace / test:** D-01 (network order: entry upserts, then the collection upsert as the 66th POST). A probe P6 (`excerpt: "Hello bold"`). `CollectionManager.rename.test.ts:30` passes while asserting the buggy order.
- **Root cause:** confirmed. The client writes records before the schema, `queue.settled()` only sees ops that have already started, and server-side rename C0.2 was never built.
- **Dependencies / impacted modules:** CMS records, dynamic page patterns, bindings by field key, Publish.
- **Recommendation and alternatives:** Build `cms.fields.rename` (C0.2): one `$transaction` that re-keys `fields`, `pageSlugPattern`, `pageSeoTitle/Description`, `displayField` and `cms_entries.data`, followed by a client rehydrate. Stop-gap: `await updateCollection` before migrating records. Rewrite the pinning test. Disable key rename until it is fixed if C0.2 is far away.
- **Acceptance criteria:** Rename `summary→excerpt` on 3 rich-text records (one published + required). A SQL read shows all values under `excerpt` with `<strong>` intact and none under `summary`. The network shows the schema op first. Generated paths are unchanged.
- **Owner:** unassigned (CMS / engine + server)

### EDT-002 — Two tabs in the same browser: the second save silently overwrites the first
- **Type / Priority / Confidence / Status:** Data / P0 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** The same site is open in two tabs of one browser profile, with the same record open in both.
- **Reproduction steps:**
  1. Tab 1: title → "CSV post 12 TAB1" → Save (200).
  2. Tab 2 (stale form): append body text → Save.
- **Actual result:**
  - Tab 2 saves 200 and no conflict is raised.
  - Its payload carries the stale title, with `expectedUpdatedAt` set to tab 1's fresh stamp. Sync stamps `bk-sync-stamps-v1` are shared in `localStorage`.
  - The server now has the old title, so tab 1's change is lost. Tab 1 still shows its own title locally.
  - The tabs never learn of each other's IndexedDB writes: there is no BroadcastChannel or storage listener.
- **Expected result:** Tab 2 gets the CONFLICT state (this is the C0.3 done-condition).
- **Source location(s):** `packages/editor/src/services/syncRetryQueue.ts:218-292`; `packages/editor/src/services/cmsSync.ts` (`expectedUpdatedAt: serverStampOf(...)`); `packages/editor/src/editor/shell/hooks/useCmsSync.ts:49-51`
- **Figma node / screenshot:** `E/shots/j6-10-same-context-tab2.png`
- **Runtime trace / test:** D-02 (network 19:51:26 / 19:51:31; the stamps are quoted in the track report).
- **Root cause:** confirmed by runtime + code. The precondition is the browser-wide last-known server stamp, not the version the form loaded. The cross-*profile* case is detected correctly (VERIFIED_OK).
- **Dependencies / impacted modules:** CMS records, any user with two tabs open, collaboration.
- **Recommendation and alternatives:** Carry the `updatedAt` the sheet loaded on each payload (per-tab precondition). Alternatively, broadcast CMS writes over `BroadcastChannel` so other tabs refresh and re-stamp. Also re-hydrate on focus.
- **Acceptance criteria:** The repro above shows "changed elsewhere" in tab 2 and tab 1's title survives on the server.
- **Owner:** unassigned (CMS sync)

### EDT-003 — A binding pinned to a record outside the newest 50 published records resolves empty
- **Type / Priority / Confidence / Status:** Functional / P1 / VERIFIED_RUNTIME (also a VERIFIED_TEST probe) / VERIFIED_BROKEN
- **User journey / preconditions:** More than 50 published records. A heading is pinned to an older one.
- **Reproduction steps:**
  1. Publish 60 records.
  2. Heading › Inspector › From CMS › Posts / title › Record = "First post" (the oldest).
- **Actual result:**
  - The Inspector says "This record isn't published — the page shows nothing here".
  - The preview reads "record 1 of 50".
  - The canvas keeps the previous text.
  - Publish writes `""` (C0.7 rule).
  - The server pre-check thinks it is fine, so editor and server disagree.
  - Which records break shifts as others are edited.
- **Expected result:** A pinned record resolves by id, wherever it sits in the list.
- **Source location(s):** `packages/editor/src/engine/cms/CMSBindingManager.ts:225-233`; `CollectionManager.ts:467-475` (`limit || 50`); `packages/editor/src/editor/inspector/sections/CmsBindingSection.tsx:170-180`
- **Figma node / screenshot:** `E/shots/j4-02-bound-default.png`, `E/shots/j4-03-pinned-first-post.png`
- **Runtime trace / test:** D-08. B probe: `returned 50 of total 60`, `r55 found? false`.
- **Root cause:** confirmed. `resolveBinding` searches a default-limited `queryContent` slice.
- **Dependencies / impacted modules:** Publish, share draft, Preview, Inspector, Canvas.
- **Recommendation and alternatives:** `getContentItem(id)` followed by a `status === "published"` check, in both the resolver and the Inspector. Add a >50-record test.
- **Acceptance criteria:** With 60 published records, a binding to the oldest resolves on the canvas, in Preview and in the published HTML.
- **Owner:** unassigned (CMS engine)

### EDT-004 — Reserved or colliding record slugs are accepted; an `api/…` path fails the whole site deploy
- **Type / Priority / Confidence / Status:** Integration / P1 / VERIFIED_RUNTIME (acceptance + the "Ready" state). The deploy failure is VERIFIED_TEST (probe P8), not observed live because publishing was forbidden. / VERIFIED_BROKEN
- **User journey / preconditions:** A collection with dynamic pages, template "Post template", pattern `{slug}`.
- **Reproduction steps:** Set three published records' slugs to `api`, `index`, and `post-template` (the template page's own slug).
- **Actual result:**
  - All three save without error.
  - Dynamic pages says "Ready · 59 complete records will get a page".
  - Pre-publish says "CMS templates: pass".
  - Server: `generateDynamicPages` emits `api/index.html`, which `publishPathError` refuses inside `buildDeployFiles`. That throws `UNSAFE_PUBLISH_PATH` for the **whole job**, after it has been queued.
  - What `index` and `post-template` do at deploy time is not verified.
- **Expected result:** Reserved first segments and collisions with existing pages are refused at save (`CMS_INVALID` with a reason), or skipped and named in pre-publish. The rest of the site still publishes.
- **Source location(s):** `packages/shared/schemas/cms.ts:295-309,323-344`; `packages/shared/schemas/publish.ts:23,41`; `lib/publish-files.ts:176-179`; `server/services/cms.service.ts:905-927`
- **Figma node / screenshot:** `E/shots/j5-05-dynamic-reserved-slugs.png`, `E/shots/j9-01-publish-dialog.png`
- **Runtime trace / test:** D-09; A probe P8.
- **Root cause:** confirmed. The CMS validator and the deploy path guard don't share a rule.
- **Dependencies / impacted modules:** Pages (dynamic), Publish, sitemap.
- **Recommendation and alternatives:** Run `publishPathError` on `cmsRecordPath(...)/index.html` inside `cmsRecordClash`, and check against existing static page slugs. In `appendDynamicPagesToPublish`, drop and report unsafe paths instead of throwing. Alternative: a reserved-segment list in `cmsPatternError` + the slug rule.
- **Acceptance criteria:** Publishing slug `api` returns a readable `CMS_INVALID`. A legacy `api` record does not stop the other pages publishing, and pre-publish names it. `index` and the template's own slug are refused.
- **Owner:** unassigned (CMS server + publish)

### EDT-005 — Duplicating a site copies its CMS bindings but no collections or records
- **Type / Priority / Confidence / Status:** Integration / P1 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** A site with collections, a Collection list and bound headings. Dashboard › Sites › ⋯ › Duplicate.
- **Reproduction steps:** Duplicate the site, then open the copy in the editor and open Publish.
- **Actual result:**
  - `cms.collections.list` on the copy returns `[]`.
  - The canvas still shows the original's bound text with "[bound]" markers, and a list full of the original's records.
  - 5 bindings point at the original's collection ids.
  - Pre-publish: `ready:false` ("Collection lists: fail — isn't connected"). "CMS bindings" names only 2 of the 5.
- **Expected result:** The copy carries collections and records with new ids, and the bindings are re-pointed. Or it clears the bindings and says CMS is not copied.
- **Source location(s):** `server/services/sites.service.ts:458-530` (copies `projectCmsBindings` at `:512`; no CMS tables). No test covers CMS in duplicate.
- **Figma node / screenshot:** `E/shots/j12-03-site-menu.png`, `E/shots/j12-07-copy-editor.png`
- **Runtime trace / test:** D-07 (`sites.duplicate` at 20:29:20); A-03.
- **Root cause:** confirmed. The CMS tables were added after `duplicateSite`, and only the JSON column was carried over.
- **Dependencies / impacted modules:** Dashboard Sites, CMS, Publish, pre-publish checks.
- **Recommendation and alternatives:** In the same `$transaction`, copy non-deleted collections and entries with new ids, then remap the bindings, `referenceCollection` and reference values through an id map. Alternative: strip the bindings and show a notice.
- **Acceptance criteria:** A DB test duplicates a site with 2 collections (one referencing the other) and 3 records. The copy resolves every binding, pre-publish has no list failure, and the original is untouched.
- **Owner:** unassigned (server / sites)

### EDT-006 — A binding-only change is never autosaved and reverts on reload
- **Type / Priority / Confidence / Status:** State / P1 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** A heading is bound and the site is saved. The user changes only the binding.
- **Reproduction steps:**
  1. Inspector › CMS binding › Record = a draft record ("Temp undo").
  2. Wait 15 s, then reload.
- **Actual result:**
  - No `sites.saveProject` is sent, and the topbar shows "Done".
  - There is no unload warning.
  - After reload the binding is back on the old record.
  - Code shows the same for binding to a draft or an empty field: `bind()` never marks the project dirty, and `applyBinding` returns early on an empty value.
  - A fresh bind made together with other edits persists.
- **Expected result:** Every bind or re-bind marks the project dirty and autosaves.
- **Source location(s):** `packages/editor/src/engine/data/BaseBindingManager.ts:84-122` (stale comment at `:107-111`); `packages/editor/src/engine/cms/CMSBindingManager.ts:282`; `packages/editor/src/engine/storage/StorageAdapter.ts:56`
- **Figma node / screenshot:** `E/shots/j4-05-rebind-to-draft.png`, `E/shots/j4-06-after-reload.png`
- **Runtime trace / test:** D-03; B-06.
- **Root cause:** confirmed (code + runtime). Autosave listens to `PROJECT_CHANGED`, and `history.record` alone does not emit it.
- **Dependencies / impacted modules:** Inspector, Save, Publish.
- **Recommendation and alternatives:** `composer.markDirty()` after `bindings.set` in `bind()`, and delete the stale `noteUnrecordedAction` branch.
- **Acceptance criteria:** Re-pin to a draft with no other edit → autosave fires → the binding survives reload.
- **Owner:** unassigned (engine)

### EDT-007 — Closing the CMS panel with unsaved record edits discards them without asking
- **Type / Priority / Confidence / Status:** Data / P1 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** A record is open with unsaved edits.
- **Reproduction steps:** Type into a field, then click the CMS panel ✕ (top-left of the drawer).
- **Actual result:**
  - The sheet closes with no dialog, and the edit is gone.
  - Every other exit asks first: Escape inside the sheet, the sheet ✕, Cancel, switching collection, and switching rail tab.
- **Expected result:** The same discard guard on every exit, or the workspace survives drawer collapse (UI-21).
- **Source location(s):** `packages/editor/src/editor/shell/StudioPanels.tsx:449` (`cmsWorkspaceOpen` depends on `isLeftPanelOpen`); `packages/editor/src/editor/cms/RecordSheet.tsx:242-261` (`shellDirty` covers tab switches only).
- **Figma node / screenshot:** `E/shots/j8-03-panel-close-dirty.png`; contrast with `j3-04-escape-guard.png`, `j3-05-switch-guard.png`, `j3-06-rail-switch.png`
- **Runtime trace / test:** D-04; C-12.
- **Root cause:** confirmed. Panel collapse unmounts the workspace without consulting the dirty guard.
- **Dependencies / impacted modules:** Shell/drawer, CMS.
- **Recommendation and alternatives:** Route drawer close through `shellDirty`. Better: decouple the workspace from drawer collapse (proposal UI-21).
- **Acceptance criteria:** With a dirty record, the panel ✕ shows the discard dialog, and "Keep editing" keeps the edit.
- **Owner:** unassigned (shell + CMS UI)

### EDT-008 — Undo after deleting a record creates a new record with a new id
- **Type / Priority / Confidence / Status:** Integration / P1 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** A heading is pinned to record X (other collections may reference X).
- **Reproduction steps:** Record ⋯ › Delete record… › toast Undo.
- **Actual result:**
  - The record returns under a new id (`cmuzwayax…` → `muzwwpx9-…`), and `createdAt` resets.
  - The binding still points at the old id: the Inspector picker is blank and says "isn't published", and the canvas shows stale text with no marker.
  - Reference cells would show "Deleted record".
- **Expected result:** Undo restores the same id, so bindings and references survive.
- **Source location(s):** `packages/editor/src/editor/cms/CmsWorkspace.tsx:486-488`; `packages/editor/src/editor/sidebar/tabs/content/useContentPanel.ts:221-249` (`recordId ?? cms.nextId()`)
- **Figma node / screenshot:** `E/shots/j4-08-after-delete-undo.png`
- **Runtime trace / test:** D-05 (delete 18:53:15 → upsert with a new id 18:53:17); C-02.
- **Root cause:** confirmed. Undo is implemented as "create a copy", and the server tombstone isn't reversed.
- **Dependencies / impacted modules:** Bindings, Reference fields, dynamic pages, ⌘K deep links.
- **Recommendation and alternatives:** Restore through `createContentItem(…, { id })` plus a server un-tombstone (`cms.entries.restore`, see EDT-039). Alternative: drop Undo and use a typed confirm whenever dependants exist (EDT-027).
- **Acceptance criteria:** Delete → Undo → same id. Bound elements and Reference cells show the record again.
- **Owner:** unassigned (CMS UI + server)

### EDT-009 — CSV import does not coerce types
- **Type / Priority / Confidence / Status:** Data / P1 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** A collection with Number and Boolean fields. Posts ⋯ › Import CSV….
- **Reproduction steps:** Import a 63-row CSV with `views=6`, `featured=false`, and one row with `views=abc`.
- **Actual result:**
  - Every value is stored as a string.
  - Imported `false` rows show **Featured = Yes** in the table and in the sheet.
  - `"abc"` was accepted in the number field.
  - VIEWS descending sorts as strings.
  - The import reports "Imported 63 of 63 rows". Mapping keys aren't checked against fields, and unknown keys persist and fill template tokens.
- **Expected result:** Coercion per field type (number, boolean, `;`-split multiselect, ISO date) with per-row failures reported. Unknown mapping keys dropped.
- **Source location(s):** `server/services/cms.service.ts:556-566`; `packages/shared/schemas/cms.ts:387`
- **Figma node / screenshot:** `E/shots/j3-15-csv-preview.png`, `j3-16-csv-result.png`, `j3-19-csv02-sheet.png`, `j3-20-page2.png`
- **Runtime trace / test:** D-06; A-12.
- **Root cause:** confirmed. The importer copies cell strings as-is, and drafts skip validation.
- **Dependencies / impacted modules:** Records, Publish (a later publish fails INVALID), canvas lists.
- **Recommendation and alternatives:** Typed coercion + a preview showing coercion failures + Undo import (C2 import spec).
- **Acceptance criteria:** `price=12`, `featured=false` and `tags=a;b` import as `12`, `false` and `["a","b"]`. An `abc` number row is reported and not imported.
- **Owner:** unassigned (CMS server)

### EDT-010 — Dynamic pages are generated synchronously inside the publish request and stored in one JSON row
- **Type / Priority / Confidence / Status:** Performance / P1 for collections of a few hundred records or more (P3 for small sites) / CODE_EVIDENCE (micro-benchmark measured; end-to-end timing INFERRED) / CODE_GAP
- **User journey / preconditions:** Publish a site whose page-generating collection has N published records.
- **Reproduction steps:** Publish with 1,000 published records (not run live, because publishing was forbidden).
- **Actual result:**
  - `sites.publish` awaits `appendDynamicPagesToPublish`, which runs jsdom + DOMPurify once per record (~231 ms per 50 KB page, warm).
  - That is about 4 min for 1,000 records on the request thread.
  - All rendered pages are written into `publishBuildJob.log` (~50 MB at 1,000 × 50 KB).
- **Expected result:** Generation happens in the out-of-band worker, or is bounded. The job row stores inputs only.
- **Source location(s):** `server/services/publish.service.ts:493-512`; `server/services/cms.service.ts:885-928,1027-1065`; `lib/sanitize-blocks.ts:331+`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** A-04 bench (`bench.ts`, 20 pages).
- **Root cause:** confirmed for where the work happens and how it is stored. The proxy timeout threshold is not measured.
- **Dependencies / impacted modules:** Publish, DB, cPanel proxy.
- **Recommendation and alternatives:** Generate in the publish worker and stream into the deploy file list. Alternative: per-publish page cap + pre-publish warning, sanitizing the template once with per-value escaping.
- **Acceptance criteria:** With 1,000 published records, `sites.publish` returns in under 2 s, the worker deploys 1,000 record pages, and the job row is under 1 MB.
- **Owner:** unassigned (publish)

### EDT-011 — The canvas ignores publish, unpublish and delete; stale text; bound marker lost
- **Type / Priority / Confidence / Status:** Integration / P2 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** A heading is bound to record R.
- **Reproduction steps:**
  1. Unpublish R.
  2. Delete R.
  3. Reload.
- **Actual result:**
  - The canvas keeps "[bound] CSV post 05" after both changes.
  - Unresolved bindings show another record's text with no `data-cms-bound` marker, before and after reload.
  - Live title edits do propagate (VERIFIED_OK).
- **Expected result:** The canvas mirrors publish: an "unpublished record" placeholder, with the bound marker always shown.
- **Source location(s):** `packages/editor/src/engine/cms/CMSBindingManager.ts:113-115,282`; `packages/editor/src/editor/canvas/hooks/useCMSPreview.ts:81,91,126-129`
- **Figma node / screenshot:** `E/shots/j4-07-after-unpublish.png`, `j4-04-four-headings.png`, `j4-06-after-reload.png`
- **Runtime trace / test:** D-10; B-04.
- **Root cause:** confirmed. There is no subscription to `content:published`/`unpublished`, an empty value returns early, and the marker is set only on a resolved value.
- **Dependencies / impacted modules:** Canvas, Inspector, Publish (pre-publish does flag empty bindings, which is the workaround).
- **Recommendation and alternatives:** Add both events to the listener lists (without emitting an extra UPDATED), render a placeholder, and always set the marker.
- **Acceptance criteria:** Unpublishing → the canvas changes immediately to the placeholder, and the marker survives reload.
- **Owner:** unassigned (engine + canvas)
- **Prior:** L3-016 (REPRODUCED), 05 §2 P1-1.

### EDT-012 — An outbox op that can never land replays forever, and the publish gate disagrees
- **Type / Priority / Confidence / Status:** Integration / P2 / VERIFIED_RUNTIME (the INVALID branch is BLOCKED live and confirmed in code only) / VERIFIED_BROKEN
- **User journey / preconditions:** A collection whose create never reached the server: created and deleted while offline, or refused as INVALID.
- **Reproduction steps:**
  1. Go offline.
  2. Create collection "Offline three" and add a record.
  3. Delete the collection with the typed DELETE.
  4. Go online, reload, then relaunch the browser.
- **Actual result:**
  - On replay the entry upsert and the collection delete both get 404 "Collection not found".
  - "Some content changes didn't sync · 1 CMS change…" returns after every reload and relaunch (still seen 25+ min later).
  - Publish confirm says "⚠ 5 warnings — none block", so publish is **not** blocked. That contradicts the code track's prediction; runtime wins, so the root cause of the gate mismatch is unknown.
  - `onCmsInvalid` has no subscriber, so a collection refusal shows nothing.
- **Expected result:** NOT_FOUND for an op whose parent was never stamped or was deleted is terminal. Child ops are dropped with an explanation. INVALID shows a toast. The publish gate and the toast agree.
- **Source location(s):** `packages/editor/src/services/cmsSync.ts:265,284-291,340,400-428,≈781-800`; `packages/editor/src/editor/shell/hooks/useCmsSync.ts:101-151`
- **Figma node / screenshot:** `E/shots/j7-06-offline-delete-col.png`, `j7-11-publish-after-relaunch.png`, `j7-12-publish-after-45s.png`
- **Runtime trace / test:** D-12 (404s 19:28:31–19:34:03); B-03.
- **Root cause:** confirmed for the never-clearing queue (unmapped NOT_FOUND, child ops not dropped). Unknown for why `cmsSyncBlocker` doesn't block.
- **Dependencies / impacted modules:** Sync, Publish gate, toasts.
- **Recommendation and alternatives:** Subscribe `onCmsInvalid`. On a collection delete or refusal, `queue.drop` and `outboxRemove` its child entry ops. Map entry NOT_FOUND to GONE when the collection was never stamped. Then reconcile the blocker with the toast count.
- **Acceptance criteria:** After the repro and a reload, no sync toast appears, the publish gate reads 0 pending, and a refused collection shows a reason.
- **Owner:** unassigned (CMS sync)
- **Prior:** L3-019 (BLOCKED live; code still open), 05 §2 P1-3.

### EDT-013 — The server accepts blind writes; optimistic concurrency is opt-in
- **Type / Priority / Confidence / Status:** State / P2 / VERIFIED_RUNTIME (59 upserts without a precondition returned 200) + VERIFIED_TEST (probe P1) / VERIFIED_BROKEN
- **User journey / preconditions:** Any client or script with an EDITOR cookie session. API tokens cannot reach CMS (`trpc.ts:123-134`), which corrects L3-022.
- **Reproduction steps:**
  1. Save v1.
  2. Tab B saves v2 with a precondition.
  3. Stale tab A saves with no `expectedUpdatedAt`.
- **Actual result:** A's stale write wins with no CONFLICT. A raced collection create clears the precondition by force (`cms.service.ts:231`).
- **Expected result:** A missing precondition on an existing row is a CONFLICT; only creates may omit it.
- **Source location(s):** `server/services/cms.service.ts:184,190-194,231,285-287,401-403`; `__tests__/db/cms-conflict.db.test.ts:60` (documents the bypass); `packages/editor/src/services/cmsSync.ts:710,829`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** D-20; A-06 probe P1.
- **Root cause:** confirmed. It is a design choice; C0.3 (`version` + required `expectedVersion`) was built only partially.
- **Dependencies / impacted modules:** Sync, collaboration (EDT-002 is the client-side twin).
- **Recommendation and alternatives:** Require the precondition for existing rows, with a client fetch-stamp-first path. Or add a C0.3 `version` column.
- **Acceptance criteria:** Probe P1 inverted (CONFLICT), and the DB test rewritten.
- **Owner:** unassigned (CMS server)
- **Prior:** L3-022 (REPRODUCED).

### EDT-014 — The conflict UI hides "theirs"; Use theirs is primary; Keep mine overwrites the other user's fields
- **Type / Priority / Confidence / Status:** UX / P2 / VERIFIED_RUNTIME / BOTH_GAP (board `8139:217560` is identical: no diff, primary Use theirs)
- **User journey / preconditions:** Two profiles edit the same record.
- **Reproduction steps:**
  1. Profile A saves a new title.
  2. Profile B saves a body edit → CMS_CONFLICT.
  3. B chooses Keep mine.
- **Actual result:**
  - The banner shows "Someone else changed this record. Keep mine / Use theirs" with no diff.
  - Keep mine resends B's whole record, so A's title is lost on the server.
  - Keep mine resends the conflict-time snapshot, so edits made after the conflict are also overwritten (code).
  - Detection itself works (VERIFIED_OK).
- **Expected result:** A changed-field diff with both values, and a field-level merge (non-conflicting fields from both). Neither choice styled as primary, or the safe one primary. Keep mine re-reads the current local row.
- **Source location(s):** `packages/editor/src/editor/cms/RecordSheet.tsx:612-638`; `packages/editor/src/services/cmsSync.ts:189-195,741-744,857-860`
- **Figma node / screenshot:** `E/figma/8139-217560.png`; `E/shots/j6-04-conflict-crossctx.png`, `j6-08-B-reload-latest.png`, `j6-09-B-keep-mine.png`
- **Runtime trace / test:** D-17; C-06; B-08.
- **Root cause:** confirmed. `CmsConflict` carries no server payload, and keepMine uses a closure snapshot.
- **Dependencies / impacted modules:** Sync, collaboration.
- **Recommendation and alternatives:** Return the server row with the CONFLICT, then show a per-field diff and merge. Update the board in the same pass.
- **Acceptance criteria:** A forced conflict lists the changed fields with both values. Keep mine keeps A's untouched title.
- **Owner:** unassigned (CMS UI + sync); design for the board
- **Prior:** L3-021 (REPRODUCED).

### EDT-015 — The canvas Collection list shows drafts and raw `{{item.*}}`; no empty state
- **Type / Priority / Confidence / Status:** Missing State / P2 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** Insert a Collection list.
- **Reproduction steps:**
  1. Insert the list (unbound).
  2. Bind it to an empty collection.
  3. Bind it to Posts, which contains drafts.
- **Actual result:**
  - The unbound list shows `{{item.name}}`.
  - The empty collection shows `{{item.title}}`/`{{item.bio}}`.
  - With Posts, the first card is a **draft**.
  - Publish strips the placeholders and shows published records only (VERIFIED_OK in code), so the canvas and the published site disagree.
  - The published empty list is an empty container.
  - After a collection delete, unbound lists revert to `{{item.*}}`, contrary to the "keeps what it shows now" copy.
- **Expected result:** The canvas uses the publish filter (or marks draft clones), and a designed empty state replaces placeholders.
- **Source location(s):** `packages/editor/src/engine/cms/RepeaterRenderer.ts:155-186,337-347`; `CMSExportResolver.ts:43-67`; `packages/editor/src/editor/cms/CollectionSettingsPane.tsx:71-73,86-92`
- **Figma node / screenshot:** `E/shots/j4-09-collist-unbound.png`, `j4-10-collist-authors-empty.png`, `j4-11-collist-posts.png`
- **Runtime trace / test:** D-11; B-05; B-17.
- **Root cause:** confirmed. Showing drafts on the canvas is a deliberate code comment that conflicts with L3-017.
- **Dependencies / impacted modules:** Canvas, Publish.
- **Recommendation and alternatives:** Owner decision. Default to the publish filter plus a "Show drafts" toggle with a Draft marker.
- **Acceptance criteria:** A draft-only list shows the empty state on the canvas and nothing on publish. No `{{` is ever visible on the canvas.
- **Owner:** unassigned (owner decision → engine)
- **Prior:** L3-017 (REPRODUCED), CMS-17/18.

### EDT-016 — Data Sources added from JSON vanish; external sources are "Coming soon"; C5 not built
- **Type / Priority / Confidence / Status:** Functional / P2 / VERIFIED_RUNTIME (caveat: the tab was also in a save-conflict state) / VERIFIED_BROKEN
- **User journey / preconditions:** Content › Sources › add JSON.
- **Reproduction steps:** Add "products · array · 1 item", then relaunch the browser.
- **Actual result:**
  - "No data source connected".
  - Sources live in an in-memory map with no `markDirty`, and there is no `dataSources` in `ProjectData`.
  - Sheets/Airtable are disabled "Coming soon".
  - There is no `cms-source` service, router or models.
  - The C1 decision to remove the door was not executed.
- **Expected result:** Persisted, or the door is removed until C5.
- **Source location(s):** `DataManager` (in-memory); `packages/editor/src/editor/sidebar/tabs/content/DataRowDialogs.tsx:213-227`
- **Figma node / screenshot:** `E/shots/j6-14-sources-after-relaunch.png`
- **Runtime trace / test:** D-16; B-13.
- **Root cause:** confirmed (code).
- **Dependencies / impacted modules:** Content panel, C5 roadmap.
- **Recommendation and alternatives:** Hide the door now (cheap). Build C5 later, or persist in `projectSettings`.
- **Acceptance criteria:** After reload the Sources count matches what was added, or the door is gone.
- **Owner:** unassigned (owner: C5 timing)
- **Prior:** L3-018 (REPRODUCED), CMS-14, 03 P1-6.

### EDT-017 — Sync toasts cover the Publish confirm's Cancel; banners cover the chrome
- **Type / Priority / Confidence / Status:** UX / P2 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** Sync toasts are visible ("Some work never reached the server").
- **Reproduction steps:** Open the Publish confirm, then hit-test its Cancel button.
- **Actual result:**
  - `elementFromPoint` at Cancel's centre returns the toast, so the clickable choices are effectively "Publish now" and ✕.
  - The offline banner covers the topbar (Publish, Exit).
  - The "Couldn't save" banner covers the CMS tabs and ⋯.
- **Expected result:** Toasts and banners never overlap modal actions or primary chrome.
- **Source location(s):** chrome-ui `Toast` / overlay root (layering); banner layout. Exact lines not isolated.
- **Figma node / screenshot:** `E/shots/err-1791487782341.png`, `j7-05b-banner-over-tabs.png`, `err-1791487653668.png`
- **Runtime trace / test:** D-14 (`cancelHitTarget` in the j7d/j7e outputs).
- **Root cause:** suspected. Toast z-order above modals, and the banners are positioned over the chrome.
- **Dependencies / impacted modules:** Shell, Publish, CMS.
- **Recommendation and alternatives:** Keep toasts below modal scrims, or push them aside when a modal opens. Banners should take layout space.
- **Acceptance criteria:** With toasts visible, `elementFromPoint` at Cancel returns Cancel.
- **Owner:** unassigned (chrome-ui)

### EDT-018 — The project save isn't auto-retried after reconnect, and the recovery prompt outlives a successful save
- **Type / Priority / Confidence / Status:** State / P2 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** Editing while offline.
- **Reproduction steps:**
  1. Go offline and edit.
  2. Go online and reload/relaunch.
  3. Wait, then click Retry save.
- **Actual result:**
  - No `saveProject` is sent until a manual "Retry save" (19:36:21 → 200).
  - The topbar shows "Save failed — retry".
  - The "Some work never reached the server · Restore my edits" toast persists after the successful save, inviting a restore of older work.
- **Expected result:** Auto-retry on `online`, and the recovery state cleared on success.
- **Source location(s):** save/recovery hooks (not isolated in this run; see full-audit L5-070/L5-075).
- **Figma node / screenshot:** `E/shots/j7-05-after-reload.png`, `j7-13-after-retry.png`
- **Runtime trace / test:** D-13.
- **Root cause:** suspected; it matches prior L5-070 (failed saves never retried).
- **Dependencies / impacted modules:** Save, Recovery, Publish.
- **Recommendation and alternatives:** Add an `online` listener → retry. Clear the recovery prompt when a save succeeds.
- **Acceptance criteria:** After reconnect a save fires within 5 s, and no recovery toast remains after the 200.
- **Owner:** unassigned (shell/save)

### EDT-019 — A draft with a duplicate slug blocks the original from publishing
- **Type / Priority / Confidence / Status:** Functional / P2 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** A CSV import or "Add record" creates a draft with an existing slug.
- **Reproduction steps:** Import the draft "Dup slug row" with slug `csv-post-01`, then publish the original "CSV post 01".
- **Actual result:**
  - 400 `CMS_INVALID: Another record already uses the Slug "csv-post-01"`.
  - Manual add lets a draft reuse a published slug silently.
  - The error shows next to a green "Eligible for publishing", with no inline Slug error.
- **Expected result:** A dup slug is refused at draft save or import, or drafts don't count against published uniqueness. One coherent message, inline on Slug.
- **Source location(s):** `packages/shared/schemas/cms.ts:323-344` (`cmsRecordClash`); `RecordSheet.tsx` footer.
- **Figma node / screenshot:** `E/shots/j3-07-dupslug-before.png`, `j3-08-dupslug-after.png`, `j3-10-dupslug-published.png`
- **Runtime trace / test:** D-15, D-25.
- **Root cause:** suspected. The clash check counts drafts on publish but doesn't run at draft save or import.
- **Dependencies / impacted modules:** Records, Import, Publish.
- **Recommendation and alternatives:** Validate slug uniqueness on every save and import (warn on drafts). Show the inline field error.
- **Acceptance criteria:** Importing a dup slug reports that row. The original still publishes. The sheet shows the Slug error.
- **Owner:** unassigned

### EDT-020 — Schema changes never re-check published records, so two pages can publish to one path
- **Type / Priority / Confidence / Status:** Data / P2 / VERIFIED_TEST (probe P5) / VERIFIED_BROKEN
- **User journey / preconditions:** Published records with distinct paths.
- **Reproduction steps:** Change the pattern `blog/{slug}` → `blog/{cat}` when both records have `cat=news`.
- **Actual result:**
  - The change is accepted, and generation emits `blog/news/index.html` twice.
  - The deploy list isn't deduped, and the sitemap lists the URL twice.
  - The same applies to making a field required, adding rules, or a type change.
  - The publish clash check is read-then-write with no lock.
- **Expected result:** Refused with "N published records would break", or the affected records are demoted and named. The generator never emits duplicate paths.
- **Source location(s):** `server/services/cms.service.ts:236-305,378-391,905-927`; `lib/publish-files.ts:172-200`; `packages/shared/seo/sitemap.ts:34-45`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** A-07 probe P5.
- **Root cause:** confirmed. Validation runs per record write only.
- **Dependencies / impacted modules:** Publish, SEO/sitemap.
- **Recommendation and alternatives:** Re-validate published rows on a collection upsert, dedupe and report in the generator, and lock the clash check (`FOR UPDATE` or a unique path column).
- **Acceptance criteria:** Probe P5 gets INVALID. A legacy duplicate yields one file and a pre-publish warning.
- **Owner:** unassigned (CMS server)

### EDT-021 — `_skipTouchCmsEdited` is client-settable (approval bypass)
- **Type / Priority / Confidence / Status:** Security / P2 / VERIFIED_TEST (probe P2) / VERIFIED_BROKEN
- **User journey / preconditions:** A workspace with `editsRequireApproval`. The site is APPROVED. The actor is an EDITOR.
- **Reproduction steps:** A raw tRPC `cms.entries.upsert` with `_skipTouchCmsEdited: true`.
- **Actual result:** The write lands, `site.cmsEditedAt` doesn't move, and the approval stays "fresh", so changed content publishes without `APPROVAL_STALE`.
- **Expected result:** Only the internal CSV importer can skip the bump.
- **Source location(s):** `packages/shared/schemas/cms.ts:389-391`; `server/trpc/routers/cms.ts:117-119`; `server/services/cms.service.ts:363-365,572`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** A-05 probe P2.
- **Root cause:** confirmed. An internal option sits in the transport schema.
- **Dependencies / impacted modules:** Approval workflow, Publish.
- **Recommendation and alternatives:** Remove it from `upsertEntryInput` and pass a separate service-only option.
- **Acceptance criteria:** A router test with the flag still advances `cmsEditedAt`. CSV import bumps once.
- **Owner:** unassigned (server)
- **Prior:** 05 P2-1.

### EDT-022 — `cms.generateDynamicPages` lets any VIEWER force heavy server CPU
- **Type / Priority / Confidence / Status:** Security / P2 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** Any workspace member (VIEWER and up).
- **Reproduction steps:** Call the mutation with a template of up to 2 MB on a large collection.
- **Actual result:**
  - It is gated by `requireRead`, renders and sanitizes once per published record, has no rate limit and no UI caller (it is on the tRPC orphan list).
  - It returns full rendered pages.
- **Expected result:** No amplification endpoint available to the lowest role.
- **Source location(s):** `server/trpc/routers/cms.ts:87-97`; `packages/shared/schemas/cms.ts:374-378`; `packages/dashboard/scripts/check-trpc-orphans.mjs:80`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** A-08 (code + the per-page bench).
- **Root cause:** confirmed. A dev/preview seam shipped as a public procedure.
- **Dependencies / impacted modules:** Server capacity.
- **Recommendation and alternatives:** Delete it. If preview is wanted, gate it at EDITOR, cap the template at ~200 KB, return a few records, and rate-limit.
- **Acceptance criteria:** The procedure is absent, or a VIEWER call gets FORBIDDEN and 2 MB is refused.
- **Owner:** unassigned (server)

### EDT-023 — Field type change applies instantly with no confirm or conversion; field delete leaves data that resurrects
- **Type / Priority / Confidence / Status:** Data / P2 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** An unbound field with existing values.
- **Reproduction steps:**
  1. Change `notes` from Long text to Number.
  2. Then Delete field.
  3. Reload.
- **Actual result:**
  - The type changes with no dialog, and values stay strings, so published records fail validation on their next save. Rich text → Text shows literal tags in list clones.
  - After the delete, 2 records still carry `notes` server-side. Re-adding the key resurrects the old values.
  - Required → Yes shows no impact count, and Min > Max is accepted.
- **Expected result:** A confirm with the affected count plus a conversion preview. Delete purges values. Required shows the missing count.
- **Source location(s):** `packages/editor/src/editor/cms/FieldInspector.tsx:147-160,206-212`; RuleInput `:50-73`; `CollectionManager.ts:223-275`
- **Figma node / screenshot:** `E/shots/j2-12-type-change.png`, `j2-13-delete-field-guard.png`
- **Runtime trace / test:** D-22 (`notesLeft: 2`); B-10; C-08.
- **Root cause:** confirmed. `updateField` migrates only key renames, and `deleteField` doesn't touch records.
- **Dependencies / impacted modules:** Records, Publish, canvas lists.
- **Recommendation and alternatives:** Add a type-change dialog with conversion, a server-side purge on field delete, and impact counts (C2).
- **Acceptance criteria:** A type change with data asks first, and published records stay publishable or are listed. After deleting a field no record carries the key.
- **Owner:** unassigned
- **Prior:** CMS-20.

### EDT-024 — Keyboard-opened record sheet: focus stays on the row and Escape does nothing
- **Type / Priority / Confidence / Status:** Accessibility / P2 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** A keyboard-only user.
- **Reproduction steps:** Tab from search to the first row → Enter → Escape. Separately, delete a record.
- **Actual result:**
  - The sheet opens but `activeElement` stays on `cms-row-*`.
  - Escape doesn't close the sheet; its handler fires only inside it.
  - After a delete, focus goes to BODY.
  - The sheet is `role=dialog` without `aria-modal`, and the engine Escape is suppressed by `hasOpenEscapeSurface()`.
- **Expected result:** Focus moves into the sheet on open. Escape closes it from anywhere (`useColumnPanelEscape`, the AGENTS.md contract). Focus returns to the originating row.
- **Source location(s):** `packages/editor/src/editor/cms/RecordSheet.tsx:505-516`; `RecordsTable.tsx:169-182`
- **Figma node / screenshot:** n/a (j3h output: `focusInSheet:false`, `sheetClosedByEsc:false`)
- **Runtime trace / test:** D-18; C-07.
- **Root cause:** confirmed. There is no focus management and the Escape handler is local.
- **Dependencies / impacted modules:** Accessibility, CMS.
- **Recommendation and alternatives:** Focus the first field on open, use `useColumnPanelEscape`, and restore focus on close.
- **Acceptance criteria:** Tab → Enter → type → Esc → discard question → Keep editing; after close, focus is on the row.
- **Owner:** unassigned

### EDT-025 — Table and form accessibility
- **Type / Priority / Confidence / Status:** Accessibility / P2 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** Screen-reader or keyboard user on the records/fields tables and the record form.
- **Reproduction steps:** Run axe on the records table and the sheet. Tab through a 50-row page.
- **Actual result:**
  - Div tables have no rowgroup, and every row is a Tab stop (50 stops).
  - `aria-selected` on `role=row` inside `role=table` is invalid.
  - The inner tablist has no `aria-controls` and no roving.
  - The image field label is a `<span>` and its controls are unnamed.
  - Errors have no `aria-invalid`/`aria-describedby`/`aria-required`.
- **Expected result:** A grid pattern with one Tab stop and arrow keys, and associated errors and labels.
- **Source location(s):** `RecordsTable.tsx:161-210`; `FieldsTable.tsx:42-90` (`:58`); `RecordSheet.tsx:376-421,573-593`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** C-14 (no axe run in this audit).
- **Root cause:** confirmed (code).
- **Dependencies / impacted modules:** Accessibility.
- **Recommendation and alternatives:** `role=grid` with roving tabindex, or a native `<table>` with row links. Associate errors.
- **Acceptance criteria:** axe reports 0 violations, and Tab from search reaches the pager in ≤3 stops.
- **Owner:** unassigned

### EDT-026 — The records table can't manage a real collection
- **Type / Priority / Confidence / Status:** Missing State / P2 / VERIFIED_RUNTIME / BOTH_GAP (board `4428:143182` lacks these too)
- **User journey / preconditions:** Publish, unpublish or delete many records, or find drafts.
- **Reproduction steps:** Open Posts with 65 records.
- **Actual result:**
  - The columns are TITLE, VIEWS, PUBLISHED_ON, FEATURED, UPDATED.
  - Status is only a faint "· Draft" suffix.
  - There is no checkbox or bulk bar, no row ⋯, no status filter and no Columns menu.
  - Sort resets on collection switch.
  - There is no bulk publish; the runtime setup had to use API calls to publish 59 records.
- **Expected result:** The C2 table spec: status column and filter, bulk Publish/Unpublish/Delete + Undo, row actions, Columns menu, sort persisted per collection.
- **Source location(s):** `packages/editor/src/editor/cms/RecordsTable.tsx:35-37,101-108,185-189`; `CmsWorkspace.tsx:301`
- **Figma node / screenshot:** `E/figma/4428-143182.png`; `E/shots/j3-09-table-with-draft.png`
- **Runtime trace / test:** D-19; C-03.
- **Root cause:** confirmed. C2 has not started, and the board predates the proposal.
- **Dependencies / impacted modules:** Records, Publish.
- **Recommendation and alternatives:** The status column + filter first (cheap), then bulk selection. Update the board in the same pass (F2 #2).
- **Acceptance criteria:** The Status pill column, a "Drafts" filter, and 3 selected rows → bulk Publish with Undo.
- **Owner:** unassigned (CMS UI + design)
- **Prior:** L3-020 part 2. L3-020 part 1 (typed DELETE) is reclassified as matching the board: typed confirm applies only to page-owning records (C-04).

### EDT-027 — Deleting a referenced or pinned record gives no warning
- **Type / Priority / Confidence / Status:** UX (destructive) / P2 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** Record X is referenced by other records and/or pinned by element bindings.
- **Reproduction steps:** Record ⋯ › Delete record.
- **Actual result:**
  - The instant path checks only `ownsPage`, so dependants are not counted.
  - Afterwards Reference cells read "Deleted record" and bound elements go stale.
  - The server doesn't guard deletes either (A-10).
- **Expected result:** Count dependants (as the collection delete does) and route to the typed confirm, naming them.
- **Source location(s):** `RecordSheet.tsx:335`; `CollectionSettingsPane.tsx:55-73` (the pattern to copy); `server/services/cms.service.ts:433-441`
- **Figma node / screenshot:** n/a (no board for this state; see Figma debt in `05`)
- **Runtime trace / test:** C-05.
- **Root cause:** confirmed (code).
- **Dependencies / impacted modules:** Bindings, Reference fields; EDT-008.
- **Recommendation and alternatives:** A client dependant count plus a server IN_USE refusal unless `force`.
- **Acceptance criteria:** Deleting a record referenced by 2 records and pinned by 1 element shows "Used by 2 records and 1 element".
- **Owner:** unassigned

### EDT-028 — Key rename misses SEO patterns; field usage misses SEO and attribute uses
- **Type / Priority / Confidence / Status:** Functional / P2 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** A field used only in the SEO title/description patterns, or only in an `href`/`src`/`alt` `{{item.x}}`.
- **Reproduction steps:** Rename or delete that field.
- **Actual result:**
  - The rename rewrites `pageSlugPattern` and `displayField` only.
  - `fieldUsage` scans content and the slug pattern only, so the field shows "Nothing is bound" and can be deleted.
  - Dynamic pages then refuse to save.
  - Published pages get a literal `{key}`, an empty title, or links and images silently removed.
- **Expected result:** Every use is found and rewritten.
- **Source location(s):** `CollectionManager.ts:250-252`; `packages/editor/src/editor/cms/fieldUsage.ts:52-68`; `DynamicPagesPane.tsx:69-70,228`; `CMSExportResolver.ts:58-66`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** C-09, B-16.
- **Root cause:** confirmed (code).
- **Dependencies / impacted modules:** Dynamic pages SEO, list attributes; EDT-001.
- **Recommendation and alternatives:** Fold this into C0.2 rename. Extend `fieldUsage` to SEO patterns and descendant attributes.
- **Acceptance criteria:** Renaming `name→title` updates the SEO pattern to `{title}`. A field used only in an `href` is locked.
- **Owner:** unassigned

### EDT-029 — Destructive and settings writes swallow errors; collection delete isn't atomic
- **Type / Priority / Confidence / Status:** State / P2 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** A server refusal or network failure during a write.
- **Reproduction steps:** Delete a collection with the network off. Add a field the server refuses.
- **Actual result:**
  - `remove` unbinds every element *before* awaiting `deleteCollection`, with no catch, so a failed delete leaves the collection alive and every binding gone, silently.
  - Rename, Dynamic pages save and Add field have no catch either; Add field stays open with no reason.
- **Expected result:** Delete first and unbind on success (or one undo transaction), with an error on every failed write.
- **Source location(s):** `CollectionSettingsPane.tsx:75-97`; `TypedDeleteDialog.tsx:35-43`; `DynamicPagesPane.tsx:79-101`; `AddFieldDialog.tsx:62-82`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** C-13 (not run live).
- **Root cause:** confirmed (code).
- **Dependencies / impacted modules:** Bindings, Publish.
- **Recommendation and alternatives:** Reorder the delete and unbind, add catch + toast/inline errors, and add an `onCmsInvalid` listener (EDT-012).
- **Acceptance criteria:** An offline collection delete keeps its bindings and shows "Couldn't delete …". A refused Add field shows the reason.
- **Owner:** unassigned

### EDT-030 — "Used by" names no page; "Open the binding" lands in Layers
- **Type / Priority / Confidence / Status:** IA / P2 / FIGMA_EVIDENCE / CODE_GAP (the board is right)
- **User journey / preconditions:** A bound field. Fields › select it.
- **Reproduction steps:** Read USED BY, then click "Open the binding".
- **Actual result:**
  - Uses are labelled by layer name or type, with no page; off-page elements show a raw id.
  - Rows are not links.
  - "Open the binding" selects only the first use and switches to Layers, without changing page or opening the binding section.
- **Expected result:** As board `4428:147552` shows: page-qualified links that open the page, select the element and open Inspector › CMS binding.
- **Source location(s):** `fieldUsage.ts:25-30`; `FieldsTable.tsx:80-82`; `FieldInspector.tsx:232-237`; `CmsWorkspace.tsx:242-247`; `DeleteFieldDialog.tsx:43,87-90`
- **Figma node / screenshot:** `E/figma/4428-147552.png`
- **Runtime trace / test:** C-10.
- **Root cause:** confirmed (code behind the board).
- **Dependencies / impacted modules:** Pages, Inspector, Layers.
- **Recommendation and alternatives:** Implement per the board.
- **Acceptance criteria:** Clicking a use on another page lands on that page, with the element selected and the binding section open.
- **Owner:** unassigned
- **Prior:** CMS-08.

### EDT-031 — Dynamic pages and Settings hide behind an unlabeled ⋯
- **Type / Priority / Confidence / Status:** IA / P2 / VERIFIED_RUNTIME / BOTH_GAP (boards `4428:147857`, `4428:148660` draw the ⋯ as the active tab)
- **User journey / preconditions:** Open Dynamic pages or Settings.
- **Reproduction steps:** Select ⋯ › Dynamic pages.
- **Actual result:**
  - The tab strip shows "Records Fields •••", and the only cue for the current view is the ⋯ pressed state ("Collection menu, pressed" to a screen reader).
  - The ⋯ mixes navigation with actions (Import, disabled Sheets/Airtable).
- **Expected result:** C2: tabs Records · Fields · Pages · Settings, with `aria-selected`. The ⋯ holds Import/Export only.
- **Source location(s):** `CmsWorkspace.tsx:64-67,358-399`
- **Figma node / screenshot:** `E/figma/4428-147857.png`, `E/figma/4428-148660.png`
- **Runtime trace / test:** D-24; C-11.
- **Root cause:** confirmed. C2 has not started.
- **Dependencies / impacted modules:** CMS IA.
- **Recommendation and alternatives:** Four named tabs; update the boards.
- **Acceptance criteria:** Each destination is a named tab, and the ⋯ has no navigation items.
- **Owner:** unassigned (CMS UI + design)
- **Prior:** CMS-12, L3-023.

### EDT-032 — The record editor is a full overlay, not the approved 480px dock (PD-10)
- **Type / Priority / Confidence / Status:** IA / P2 (track C proposed P1; downgraded because no journey is blocked and it is a planned C2 wave) / FIGMA_EVIDENCE / BOTH_GAP
- **User journey / preconditions:** Scan records → edit one → compare or step to the next.
- **Reproduction steps:** CMS → a collection → click a row.
- **Actual result:**
  - `RecordSheet` is `absolute inset-0` over the table and header.
  - It duplicates the Records · Fields · Dynamic pages tab row (no Settings); its "Records" tab closes the sheet.
  - The ⋯ holds only Preview and Delete.
  - There is no next/previous record.
- **Expected result:** PD-10: a right-docked 480px panel with the table still live, no duplicate tabs, ⋯ = Duplicate / View on page / Delete, and a Saved state.
- **Source location(s):** `RecordSheet.tsx:505-516,538-551,573-593`; `CmsWorkspace.tsx:448-491`
- **Figma node / screenshot:** `E/figma/4428-144760.png`, `E/figma/8139-217560.png` (both draw the overlay; ~11 sibling boards listed in `05`)
- **Runtime trace / test:** C-01 (live screenshots show the same overlay, e.g. `E/shots/j3-01-new-record.png`).
- **Root cause:** confirmed. C2 has not started; PD-10 was never applied to code or boards.
- **Dependencies / impacted modules:** RecordSheet, RecordPreview, CmsWorkspace.
- **Recommendation and alternatives:** Build the dock as a 480px `aside`, where selecting a row swaps the record. Alternative: keep the overlay and add ‹ › stepping without the duplicate tabs.
- **Acceptance criteria:** At 1440×900 the table stays visible beside a 480px panel. Clicking another row swaps the record, with the guard. There is no second tab row.
- **Owner:** unassigned (design + CMS UI)
- **Prior:** CMS-11, proposal F1.

### EDT-033 — Sync races: write-back can revert a newer local edit; outbox durability gaps
- **Type / Priority / Confidence / Status:** Data / P2 / CODE_EVIDENCE (races INFERRED) / CODE_GAP
- **User journey / preconditions:** Rapid consecutive saves, a slow network, or closing the tab mid-sync.
- **Reproduction steps:**
  1. Save A, which the server sanitises differently; save B while A is in flight.
  2. Separately: on Slow 3G, edit a field's settings, then save a record and close the tab before the collection op returns.
- **Actual result:**
  - (1) A's response writes `stored1` over the local row without checking it is unchanged, which reverts B locally permanently. The next save then pushes stale fields.
  - (2) The entry waits on `queue.settled` *before* `outboxPut`, so it is not in the outbox. On reload, local-newer + stamped + not in outbox means it is kept but never re-sent.
  - Publish (server snapshot) ships the old value, and the blocker shows 0.
  - A localStorage quota failure is silently ignored.
- **Expected result:** The newest edit always wins locally and always lands.
- **Source location(s):** `packages/editor/src/services/cmsSync.ts:112-176,812-819,834-846`; `syncRetryQueue.ts:278-292`; `CollectionStorage.ts:99-110,173-184`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** B-08, B-09 (not run).
- **Root cause:** confirmed in code; the timing is inferred.
- **Dependencies / impacted modules:** Sync, Publish.
- **Recommendation and alternatives:** Guard the write-back with an `updatedAt` equality check. Call `outboxPut` synchronously at event time. In hydrate, treat local-newer orphans as owed. Consider an IndexedDB outbox (C0.5 said IDB).
- **Acceptance criteria:** Unit tests: two queued saves keep the newer one. The slow-network repro lands after reopen.
- **Owner:** unassigned (CMS sync)

### EDT-034 — Canvas renders up to 10,000 list clones, rebuilt on every content change
- **Type / Priority / Confidence / Status:** Performance / P2 / INFERRED / CODE_GAP
- **User journey / preconditions:** A collection with ~2,000 records and a Collection list set to "All".
- **Reproduction steps:** Type in any canvas text element.
- **Actual result:**
  - `useCMSPreview` re-parses the page and re-expands every list (up to 10,000, drafts included) on each content or revision change.
  - A RegExp is built per attribute × key × element × record.
  - A record save triggers `reapplyAll` → `setContent` → autosave.
- **Expected result:** Canvas expansion is capped and memoised; publish still emits every record.
- **Source location(s):** `useCMSPreview.ts:34-115`; `RepeaterRenderer.ts:157-163,459-494`; `packages/shared/schemas/sites.ts:167`; `CMSBindingManager.ts:311-316`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** B-11 (not measured; D imported only 63 rows, in 11 s).
- **Root cause:** suspected (code reading).
- **Dependencies / impacted modules:** Canvas performance.
- **Recommendation and alternatives:** A canvas cap (24 + "+N more"), memoisation keyed on (list HTML, collection revision), and precompiled regexes.
- **Acceptance criteria:** With 2,000 records, typing latency stays under 50 ms (measured).
- **Owner:** unassigned

### EDT-035 — Undo/history semantics around CMS
- **Type / Priority / Confidence / Status:** State / P3 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** A bound element.
- **Reproduction steps:**
  1. Unbind, then ⌘Z once and again.
  2. Save a record, then ⌘Z.
- **Actual result:**
  - Unbind took the undo count from 1 to 3; one ⌘Z left the element unbound, and the second restored it.
  - A record save is not undoable, and nothing in the UI says so.
  - Untracked CMS writes leave a stale history baseline, so a later colour undo also reverts bound text (code, B-14).
- **Expected result:** One undo step per user action, and the scope of undo made clear to the user.
- **Source location(s):** `packages/editor/src/engine/HistoryManager.ts:502-512`; `CMSBindingManager.ts:294-296`
- **Figma node / screenshot:** `E/shots/j8-02-undo-unbind.png`
- **Runtime trace / test:** D-21; B-14.
- **Root cause:** confirmed for the baseline (03-engine P1-2). The double step is suspected to be unbind + `markDirty` as separate records.
- **Dependencies / impacted modules:** History.
- **Recommendation and alternatives:** Wrap unbind in a single transaction, and re-base the cache at the end of `runWithoutTracking`.
- **Acceptance criteria:** Unbind → one ⌘Z restores the binding. A colour undo does not touch bound text.
- **Owner:** unassigned (engine)

### EDT-036 — A concurrent first write of one record surfaces a raw Prisma P2002 as a 500
- **Type / Priority / Confidence / Status:** Functional / P3 / VERIFIED_TEST (probe P4: 87 raw rejections over 30×4) / VERIFIED_BROKEN
- **User journey / preconditions:** Two clients create the same record id at the same moment.
- **Reproduction steps:** Probe P4.
- **Actual result:** INTERNAL_SERVER_ERROR, with the Prisma message reaching the client because `errorFormatter` doesn't mask it.
- **Expected result:** The loser becomes an update, or gets a CONFLICT with the winner's stamp.
- **Source location(s):** `server/services/cms.service.ts:414-422` vs `:219-233`; `server/trpc/trpc.ts:63-108`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** A-09.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** Sync.
- **Recommendation and alternatives:** Catch P2002, and mask 500 messages in production.
- **Acceptance criteria:** Probe P4 inverted (0 non-`CmsError` rejections).
- **Owner:** unassigned
- **Prior:** 05 P2-2.

### EDT-037 — Reference integrity is checked by type only on the server
- **Type / Priority / Confidence / Status:** Data / P3 / VERIFIED_TEST (probe P7) / VERIFIED_BROKEN
- **User journey / preconditions:** A collection with a required Reference field.
- **Reproduction steps:** Publish a record whose required reference points at a deleted record or at `"no-such-record"`.
- **Actual result:**
  - The record publishes.
  - The server doesn't guard deleting a referenced record or a collection.
  - The snapshot resolves only one reference hop.
- **Expected result:** A live-reference check on publish, and an IN_USE refusal on delete.
- **Source location(s):** `packages/shared/schemas/cms.ts:170-171`; `server/services/cms.service.ts:307-322,433-441,996-1009`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** A-10.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** Publish; EDT-027.
- **Recommendation and alternatives:** A batch reference check in the PUBLISHED branch, and an IN_USE refusal in `deleteCollection`.
- **Acceptance criteria:** Probe P7 inverted.
- **Owner:** unassigned
- **Prior:** DM-11, 05 P2-8.

### EDT-038 — Entry writes are validated against `input.collectionId`, not the record's own collection
- **Type / Priority / Confidence / Status:** Security / P3 / VERIFIED_TEST (probe P3) / VERIFIED_BROKEN
- **User journey / preconditions:** A same-site EDITOR sending a crafted request.
- **Reproduction steps:** Probe P3: update a record of collection `strict` while sending `collectionId: "lax"`, `data: {}`, PUBLISHED.
- **Actual result:** The `strict` record publishes with no title, because the rules came from `lax`. Cross-site access is blocked correctly.
- **Expected result:** Validation against the stored collection, or NOT_FOUND on mismatch.
- **Source location(s):** `server/services/cms.service.ts:347-405`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** A-11.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** Validation.
- **Recommendation and alternatives:** Compare `existing.collectionId` with `input.collectionId`.
- **Acceptance criteria:** Probe P3 inverted.
- **Owner:** unassigned

### EDT-039 — No CMS activity log, restore, tombstone purge or rate limits
- **Type / Priority / Confidence / Status:** Missing State / P3 / CODE_EVIDENCE / EXPECTED_BUT_ABSENT (proposal C2)
- **User journey / preconditions:** Recovering from a mistaken delete, or auditing who changed what.
- **Reproduction steps:** Delete a collection, then look for an activity entry or a restore option.
- **Actual result:**
  - There is no ActivityLog write.
  - There is no restore procedure.
  - The purge cron covers sites only, so CMS tombstones accumulate.
  - There are no CMS rate limits.
  - The count-then-create cap check has no lock.
- **Expected result:** As in C2.
- **Source location(s):** `server/services/cms.service.ts` (no `activity-log` calls; `:160-169,215-220,426-431`); `app/api/cron/soft-delete-purge/route.ts:15`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** A-13.
- **Root cause:** confirmed. Not built yet.
- **Dependencies / impacted modules:** Activity, EDT-008 (restore).
- **Recommendation and alternatives:** Build with C2.
- **Acceptance criteria:** A delete writes an ActivityLog row, restore works within the window, and the purge covers CMS.
- **Owner:** unassigned

### EDT-040 — Unpaginated reads; O(bindings × records) pre-check; `archived` round-trips as draft
- **Type / Priority / Confidence / Status:** Performance / P3 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** A large collection, or a record marked archived in the editor.
- **Reproduction steps:** Load a collection near the caps, run the pre-publish check, archive a record and reload.
- **Actual result:**
  - `entries.list` returns every record with full data.
  - `findEmptyBindings` does a linear find per binding.
  - The server status is `DRAFT|PUBLISHED`, while the editor has `archived`.
- **Expected result:** Paginated reads, an indexed lookup, and one status model.
- **Source location(s):** `server/services/cms.service.ts:334-340,685-702`; `prisma/schema.prisma:482`; `packages/editor/src/services/cmsSync.ts:828`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** A-14, B-18c.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** Performance, status UX.
- **Recommendation and alternatives:** Cursor pagination, indexing by id, and an owner decision on archived.
- **Acceptance criteria:** A list call is bounded, and archived survives reload (or is removed from the UI).
- **Owner:** unassigned

### EDT-041 — A stale device renaming a collection slug to a taken one gets an unmapped 500, retried forever
- **Type / Priority / Confidence / Status:** Integration / P3 / CODE_EVIDENCE / CODE_GAP. The same-device UI path is VERIFIED_OK: the UI refuses the clash before sending.
- **User journey / preconditions:** Two devices; the second is stale.
- **Reproduction steps:** Device 1 creates "news". Device 2 (opened earlier, no re-hydrate) renames "blog" → `news`.
- **Actual result:**
  - The update hits `@@unique` and raises a raw P2002.
  - The client can't classify it, so it is retried every load.
  - If mapped to SLUG_TAKEN, adopt would merge the records into the other collection.
- **Expected result:** A mapped INVALID and a local revert; adopt only on create.
- **Source location(s):** `server/services/cms.service.ts:273-287`; `packages/editor/src/services/cmsSync.ts:722-737,775-790`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** B-12; D target 10 NOT REPRODUCED (UI guard).
- **Root cause:** confirmed (code).
- **Dependencies / impacted modules:** Sync.
- **Recommendation and alternatives:** As expected above.
- **Acceptance criteria:** The clashing stale rename shows an error and the slug reverts.
- **Owner:** unassigned

### EDT-042 — Ecommerce blocks carry dead CMS attributes
- **Type / Priority / Confidence / Status:** Integration / P3 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** Insert a Product card or Product grid.
- **Reproduction steps:** Insert the block, accept the "create Products collection" prompt, and look at the canvas and the publish output.
- **Actual result:**
  - The prompt creates Products through ~7 sequential upserts and doesn't await initialization.
  - The blocks' `data-bind`/`data-cms-collection` are read only by the dead `DataBindResolver`, so the cards stay static ("Product Name / $0.00").
- **Expected result:** Wire the blocks as Collection lists, or drop the prompt (PD-6).
- **Source location(s):** `src/blocks/Ecommerce/ProductCard.tsx:21-31`, `ProductGrid.tsx:25-31`; `src/engine/cms/ProductCollectionService.ts:57-96`; `src/engine/cms/index.ts:13-19`; `useComposerInit.ts:879-916`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** B-15. Whether these blocks appear in the Insert panel is not verified.
- **Root cause:** confirmed (code).
- **Dependencies / impacted modules:** Add panel, Ecommerce.
- **Recommendation and alternatives:** An owner decision on PD-6.
- **Acceptance criteria:** Product cards show records, or the blocks and prompt are gone and `DataBindResolver` is deleted.
- **Owner:** owner decision
- **Prior:** 05 P2-10, proposal C4.

### EDT-043 — New-collection wizard: fake stepper and handle, bad defaults
- **Type / Priority / Confidence / Status:** Design / P3 / VERIFIED_RUNTIME / BOTH_GAP (board `4418:84646` draws the chips and handles)
- **User journey / preconditions:** Create a new collection.
- **Reproduction steps:** Open the setup modal and type a name.
- **Actual result:**
  - "✓ Name & Type" shows as done before any name is typed, and the title flips to "Fields for X" while typing.
  - A ⠿ handle has no drag behind it.
  - The `title` field is not required.
  - A wizard multiselect gets no options.
  - A typed `published_on` becomes key `published-on`, while the label stays `published_on`.
  - Copy uses "entry", and the CTA "Create Collection" is title case.
- **Expected result:** An honest single-step modal, sane defaults, and the product's vocabulary ("record", sentence case).
- **Source location(s):** `packages/editor/src/editor/shell/modals/CMSCollectionSetupModal.tsx:97,277,282-294,320,324`
- **Figma node / screenshot:** `E/figma/4418-84646.png`; `E/shots/j2-01*.png`, `j2-09-fields-after.png`
- **Runtime trace / test:** D-23, D-24; C-21.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** CMS onboarding.
- **Recommendation and alternatives:** Drop the chips and handle, make title required, and prompt for options. Update the board (it is also stale on template/SEO).
- **Acceptance criteria:** No step chips, a constant title, a required title field, and "record" in the copy.
- **Owner:** unassigned
- **Prior:** L3-023, CMS-13.

### EDT-044 — No loading skeleton; the workspace root is blank
- **Type / Priority / Confidence / Status:** Missing State / P3 / VERIFIED_RUNTIME (blank root seen) / CODE_GAP
- **User journey / preconditions:** Open CMS with collections present, or switch collections.
- **Reproduction steps:** Open CMS without selecting a collection. Switch from a 0-record to a 50-record collection.
- **Actual result:**
  - The centre is blank grey with "Select a collection".
  - Switching collections shows the previous rows under the new columns until the load resolves, and can flash "No records yet" (code).
- **Expected result:** A collections overview at the root, and skeleton rows while loading (F2 #1/#2).
- **Source location(s):** `CmsWorkspace.tsx:122-124,178-207`; `useContentPanel.ts:172-178`
- **Figma node / screenshot:** `E/shots/j1-01*.png`
- **Runtime trace / test:** D-24; C-15, C-16.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** CMS.
- **Recommendation and alternatives:** Per F2.
- **Acceptance criteria:** No "No records yet" flash, and the root lists collections with counts.
- **Owner:** unassigned
- **Prior:** CMS-21, L3-023.

### EDT-045 — Binding/field copy: keys not names, two label maps, misleading "Open affected record"
- **Type / Priority / Confidence / Status:** UX / P3 / VERIFIED_RUNTIME / BOTH_GAP (board `7995:205467` shows the key)
- **User journey / preconditions:** Bind an element, or inspect a field.
- **Reproduction steps:** Open Inspector › CMS binding › Field. Open a field that nothing is bound to.
- **Actual result:**
  - The picker reads `published-on · Date`.
  - `FIELD_TYPE_LABEL` in the Inspector ("Yes / no", "Options") diverges from `cms/fieldTypes.ts` ("Boolean", "Multi-select"), which is an SSOT break.
  - "Open affected record" shows next to "Nothing is bound to this field".
  - The binding note shows even when unbound.
- **Expected result:** Field names (key secondary), one label map, honest copy.
- **Source location(s):** `CmsBindingSection.tsx:63-82`; `packages/editor/src/editor/cms/fieldTypes.ts:19-30`; `FieldInspector.tsx:103,241-253`
- **Figma node / screenshot:** `E/figma/7995-205467.png`
- **Runtime trace / test:** D-24; C-17, C-19.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** Inspector.
- **Recommendation and alternatives:** Import the shared label map and label options by `f.name`.
- **Acceptance criteria:** The picker shows names, one label map exists, and the button is gone when nothing is bound.
- **Owner:** unassigned
- **Prior:** L3-023.

### EDT-046 — Binding Record picker: flat and unsearchable; collection switch hides the live binding
- **Type / Priority / Confidence / Status:** UX / P3 / CODE_EVIDENCE / BOTH_GAP (the boards have no Record row)
- **User journey / preconditions:** A collection with hundreds of records, and a bound element.
- **Reproduction steps:** Open the Record picker. Change the Collection select while bound.
- **Actual result:**
  - `SelectRow` lists every record with no search.
  - Changing Collection hides Unbind and the preview while the old binding stays live.
- **Expected result:** A searchable combobox, and the "bound to X" state visible until a new field is picked.
- **Source location(s):** `CmsBindingSection.tsx:128-130,253-263,296-323`
- **Figma node / screenshot:** `E/figma/7995-205467.png`, `E/figma/7063-79200.png`
- **Runtime trace / test:** C-20.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** Inspector.
- **Recommendation and alternatives:** A combobox, plus a board update.
- **Acceptance criteria:** Type-to-filter works at 500 records, and the bound state stays visible.
- **Owner:** unassigned

### EDT-047 — Dynamic pages copy and counts mislead
- **Type / Priority / Confidence / Status:** UX / P3 / VERIFIED_RUNTIME / BOTH_GAP (board `4428:147857` uses the same copy and lacks the SEO fields)
- **User journey / preconditions:** Set up dynamic pages for a collection.
- **Reproduction steps:** Click "Generate N pages", add a page, then open the Publish confirm.
- **Actual result:**
  - "Generate N pages" only saves; pages appear on the next publish.
  - The intro says pages "update when records change".
  - The hint says "open here and under Pages", which is false.
  - The template list is memoised on `[composer]` and misses new pages.
  - There is no unsaved guard.
  - The Publish confirm says "2 pages" while 59 dynamic pages will generate.
- **Expected result:** "Save" + "N pages generate on next publish", accurate counts in the publish confirm, and a live template list.
- **Source location(s):** `DynamicPagesPane.tsx:43-54,79-101,156,232`; `CmsWorkspace.tsx:325`
- **Figma node / screenshot:** `E/figma/4428-147857.png`; `E/shots/j9-01-publish-dialog.png`
- **Runtime trace / test:** D-26; C-24.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** Pages, Publish.
- **Recommendation and alternatives:** A copy and count fix, recomputing the template list on page events.
- **Acceptance criteria:** The Publish confirm counts static + dynamic pages, and the button says Save.
- **Owner:** unassigned

### EDT-048 — Search and filtering are minimal
- **Type / Priority / Confidence / Status:** UX / P3 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** Find records in a collection with rich-text fields.
- **Reproduction steps:** Search for "strong", then look for a status or field filter.
- **Actual result:** Search is a substring match over raw values, so it matches rich-text markup ("strong" matches). There are no status or field filters and no Views.
- **Expected result:** A text search that ignores markup, plus status and field filters (Views per D5/C5).
- **Source location(s):** `RecordsTable.tsx:110-116`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** C-25.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** C5 Views.
- **Recommendation and alternatives:** Strip markup for search, and add a status filter with EDT-026.
- **Acceptance criteria:** "strong" no longer matches plain records, and a Drafts filter exists.
- **Owner:** unassigned

### EDT-049 — Pages "+N from collections" opens only one collection
- **Type / Priority / Confidence / Status:** IA / P3 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** Two or more collections generate dynamic pages.
- **Reproduction steps:** Pages panel › "+N from collections".
- **Actual result:** It opens `dynamicPages.collectionId` only.
- **Expected result:** Lists or links every source collection.
- **Source location(s):** `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.tsx:94-98`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** C-26.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** Pages.
- **Recommendation and alternatives:** A popover listing each collection.
- **Acceptance criteria:** With 2 collections, both are reachable.
- **Owner:** unassigned
- **Prior:** CMS-23.

### EDT-050 — Copy and vocabulary bugs
- **Type / Priority / Confidence / Status:** UX / P3 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** Collections named News, Categories or Status; saving drafts; deleting a record without a page.
- **Reproduction steps:** Open a new record in each of those collections, save a draft, open the record ⋯ menu.
- **Actual result:**
  - `name.replace(/s$/,"")` produces "New New", "New Categorie" and "New Statu".
  - The draft save toast says "live in the CMS… refresh on next build".
  - The Settings Source row is fixed copy.
  - "Delete record…" shows an ellipsis on the instant (no-dialog) path.
- **Expected result:** Correct singulars (or a neutral "New record"), honest copy, "publish" vocabulary, an ellipsis only when a dialog follows.
- **Source location(s):** `RecordSheet.tsx:194,265-271,549`; `RecordPreview.tsx:89`; `CollectionSettingsPane.tsx:119-127`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** C-27, C-04.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** none.
- **Recommendation and alternatives:** A copy pass.
- **Acceptance criteria:** None of the strings above remain.
- **Owner:** unassigned

### EDT-051 — Design-system bypasses in CMS chrome
- **Type / Priority / Confidence / Status:** Design / P3 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** n/a (code conformance).
- **Reproduction steps:** grep the files below for raw Tailwind palette and default utilities.
- **Actual result:**
  - `tw:border-red-200`, `tw:rounded-lg`, `tw:text-xs` and `tw:text-white` in `CMSCollectionSetupModal.tsx:84-105`.
  - `tw:text-xs` in `useImportRecords.tsx:91-108`.
  - `tw:bg-white` in `RecordTemplatePreviewDialog.tsx:131`.
  - A stale `@lint-hex-policy` exemption (`CMSCollectionSetupModal.tsx:2`).
- **Expected result:** `--bk-*` tokens only, and no exemption.
- **Source location(s):** as above.
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** C-22. No purple, raw controls or hex were found.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** Design-system gates.
- **Recommendation and alternatives:** A token pass, and drop the exemption.
- **Acceptance criteria:** grep shows no raw palette in `cms/*` or the modal.
- **Owner:** unassigned

### EDT-052 — Import: two paths, a dead-end error, and Escape abandons an in-flight import
- **Type / Priority / Confidence / Status:** UX / P3 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** Importing records by CSV or JSON.
- **Reproduction steps:** Trigger an import error; separately, press Escape while an import is running.
- **Actual result:**
  - CSV imports through the server and JSON loops client-side.
  - The error step offers only Close.
  - Escape or the scrim closes the dialog mid-import, which drops the result and skips `onImported`.
  - There is no required-missing warning and no Undo import.
- **Expected result:** The C2 import spec.
- **Source location(s):** `CsvImportDialog.tsx:95-118,245-283`; `useImportRecords.tsx:36-60`
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** C-23.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** EDT-009.
- **Recommendation and alternatives:** One server path, Back/Retry, and a guarded close while busy.
- **Acceptance criteria:** Escape during an import is blocked or asks first, and the error step has Back.
- **Owner:** unassigned

### EDT-053 — Console errors on bind and in the records table
- **Type / Priority / Confidence / Status:** Functional / P3 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **User journey / preconditions:** Bind an element; open the records table.
- **Reproduction steps:** Bind an element with the console open; load a records table.
- **Actual result:**
  - `[EventEmitter] handler for "element:updated" threw: TypeError: el.getId is not a function` (`useCanvasEditorFlags`) on bind.
  - React "unique key" warning from `RecordsTable.tsx:147` (header cells). Track C judged CMS-22's key warning fixed from code; runtime contradicts that for the header cells.
- **Expected result:** A clean console.
- **Source location(s):** `useCanvasEditorFlags`; `RecordsTable.tsx:147`
- **Figma node / screenshot:** n/a (console log quoted in D-27)
- **Runtime trace / test:** D-27 (console 18:46:26, 19:05:14).
- **Root cause:** suspected. The handler receives a payload that is not an Element instance.
- **Dependencies / impacted modules:** Canvas flags.
- **Recommendation and alternatives:** Fix the handler argument type, and add keys to the header cells.
- **Acceptance criteria:** No errors or warnings during the bind journey.
- **Owner:** unassigned

### EDT-054 — Engine hygiene bundle
- **Type / Priority / Confidence / Status:** State / P3 / CODE_EVIDENCE / CODE_GAP
- **User journey / preconditions:** n/a (engine internals).
- **Reproduction steps:** Read the sources listed below.
- **Actual result:**
  - `queryContent` sorts the cache in place.
  - IndexedDB has no `onblocked`/`onversionchange`, so a future version bump would hang.
  - `refreshFromStorage` runs twice per open.
  - `CMSBindingManager` ignores `CMS_STORE_REFRESHED`.
  - The `repeat:"self"` path is dead.
  - Lists order by `updatedAt` only, with no sort control, so fixing a typo reorders the live list.
- **Expected result:** Clean, non-mutating engine behaviour and an author-controlled list order.
- **Source location(s):** `CollectionManager.ts:457-465`; `CollectionStorage.ts:28-44`; `useCmsSync.ts:51`; `RepeaterRenderer.ts` (`expandRepeaters`)
- **Figma node / screenshot:** n/a
- **Runtime trace / test:** B-18.
- **Root cause:** confirmed.
- **Dependencies / impacted modules:** Engine.
- **Recommendation and alternatives:** A hygiene pass; list sort control as an enhancement.
- **Acceptance criteria:** Each item is closed or ticketed.
- **Owner:** unassigned

## Unverified areas and blockers
- [ ] **Real publish/deploy output:** forbidden in this run, because the QA workspace has a live Vercel connection. Deploy-time effects of EDT-004 (`index`, `post-template`), EDT-010 and EDT-020 are from tests and code, not observed.
- [ ] **L3-019 collection-level INVALID:** not triggered live (it needs a 101st collection); code confirms there is no listener.
- [ ] **Image field values:** the media library was empty. External sources (Sheets/Airtable) are "Coming soon".
- [ ] **Screen-reader output and an axe run:** not done (EDT-024 is runtime keyboard only; EDT-025 is code).
- [ ] **Canvas performance at 2,000+ records (EDT-034):** not measured.
- [ ] **Figma prototype wiring:** not inspected. FG-013's 4 orphaned CMS state boards were not re-checked.
- [ ] **Ecommerce blocks' exposure in the Insert panel (EDT-042):** not checked.
- [ ] **Roles other than OWNER:** not walked live (EDITOR/VIEWER behaviour is from code and probes).

## Risk / release gates
- **Data loss:**
  - EDT-001 (rename) and EDT-002 (two tabs) can each silently destroy user content today.
  - EDT-007 and EDT-033 lose unsaved or pending edits.
  - EDT-023 leaves resurrecting data.
  - **Recommend disabling field-key rename and warning on multiple tabs until fixed.**
- **Publish integrity:**
  - EDT-003 and EDT-011 make the canvas and the published output disagree.
  - EDT-004 can make a site unpublishable via one record.
  - EDT-005 makes duplicated CMS sites unpublishable.
  - EDT-010 risks publish timeouts at scale.
  - EDT-020 can ship duplicate paths.
- **Security:**
  - EDT-021 approval bypass.
  - EDT-022 VIEWER CPU amplification.
  - EDT-038 cross-collection validation bypass.
  - EDT-036 Prisma message leak.
  - All require an authenticated workspace member; cross-site isolation is VERIFIED_OK.
- **Regression net:**
  - `CollectionManager.rename.test.ts:30` currently pins the EDT-001 bug.
  - `cms-conflict.db.test.ts:60` pins EDT-013.
  - Both must be rewritten with the fixes.
  - Known flaky test: `CmsWorkspace.recordSave.test.tsx:167` (timeout under load).


---

# Re-audit 2026-10-09 (scoped `audit cms`)

## Run metadata
- **Date / mode / arguments:** 2026-10-09 (PKT) · `audit` · `cms`
- **Repository / ref:** main @ `50ab12da6`. The source audit was `7a50e34e1`. Drift on the CMS/save/canvas paths is 20 files (+576/−87), from merging the audit-fix branch (`030979468`). There was no further CMS drift from `030979468` to `50ab12da6`.
- **Environment:**
  - Local dev server `localhost:3610` from the worktree `editor-live-audit`, detached at `50ab12da6`.
  - Playwright Chromium 1440×900, two profiles.
  - `qa@buildrik.local` (OWNER).
  - Throwaway site `cmv0lbfbb000820ekh2imsp1o`, deleted (soft) afterwards.
  - Publish, rollback and schedule requests were aborted at the network layer: **0 sent**.
- **Run flags:** none. The runtime is verified for the changed journeys. Figma was not re-read in this run; the Figma evidence is from the 2026-10-08/09 runs.
- **Subagents:** 1 runtime track (`evidence/cms-reaudit-2026-10-09/R-runtime.md`). Code checks were done in the main session.
- **Unit tests:** 36 files, 391 passed, 1 todo, 0 failed (`verify/cms.md` #3).
- **`git status`:** 0 tracked changes before and after.

## Status changes for existing issues
| ID | Was | Now | Evidence |
|---|---|---|---|
| EDT-001 (P0) rich-text key rename | VERIFIED_BROKEN | **VERIFIED_OK: fixed** (stop-gap ordering) | `collections.upsert` is sent before the batched `entries.upsert`. `<strong>` is kept on the server, in the record sheet and after reload. A required key renamed on a published record keeps its value. Commit `56a31dbbc`. Shots: `r1-body-renamed.png`, `r1-after-reload-sheet.png`. The server atomic rename (C0.2) is still recommended, but as hardening. |
| EDT-006 (P1) binding-only change not saved | VERIFIED_BROKEN | **VERIFIED_OK: fixed** | Re-pinning to a draft fires `saveProject` about 1.5 s later and survives reload. A fresh bind to a draft persists. Commit `a51581f6c`. Shots: `r2-repin-draft-*.png`. |
| EDT-011 (P2) canvas ignores publish/unpublish/delete | VERIFIED_BROKEN | **VERIFIED_OK: fixed** (behaviour) | Unpublish, delete and reload all render empty with `data-cms-bound` kept, and republish restores the text. Commits `4180deaca` and `701c28522`. The missing placeholder is tracked as **EDT-055**. Shots: `r3-01…05`. |
| EDT-018 (P2) save not auto-retried; stale recovery toast | VERIFIED_BROKEN | **VERIFIED_BROKEN: partly fixed** | Auto-retry is **fixed**: `saveProject` fires 1.17 s after going online, and "Restore my edits" saves. **Still broken:** "Some work never reached the server · Restore my edits" stays after the successful save. Shots: `r4-01…06`. |
| EDT-028 (P2) rename misses patterns/usage | CODE_GAP | **VERIFIED_BROKEN: partly fixed** | A key used by the URL pattern is now locked. The **SEO title/description patterns keep `{old-key}`** on the server, the pane error repeats the key ("subtitle, subtitle are not a field"), and the status still says "Ready". Shot: `r1-dynamic-after-rename.png`. |
| EDT-002 (P0) two tabs, same profile | VERIFIED_BROKEN | **VERIFIED_BROKEN: re-confirmed** | Tab 2 saved a stale title with tab 1's fresh stamp and got 200; tab 1's edit was lost with no warning. Shot: `r6-01-two-tabs-tab2.png`. |
| Regression: live title propagation, cross-profile CONFLICT, pre-publish dialog | VERIFIED_OK | **VERIFIED_OK** (unchanged) | `R-runtime.md` journey 5 |
| EDT-008 (P1) Undo after delete → new id | VERIFIED_BROKEN | **Unchanged, not re-tested.** The runtime saw a typed DELETE with no Undo, but that is the existing rule for records that **own a generated page** (`RecordSheet.tsx:335`, C-04). The delete code did not change. | code diff (no `editor/cms` changes) |

## New issues
| ID | Module | Type | Priority | Confidence | Status | Evidence | Summary | Expected | Proposed next action |
|---|---|---|---|---|---|---|---|---|---|
| EDT-055 | CMS → Canvas/Inspector | Missing State | P2 | VERIFIED_RUNTIME | VERIFIED_BROKEN | R N-1 | A bound element that resolves to nothing collapses to 0px (invisible, unclickable). The Inspector calls a deleted record "isn't published"; the picker shows "Newest published record" for a deleted pin. | Dimmed "Empty · Field" placeholder at normal height (spec AT-17, board D2 `8250:235648`); deleted vs unpublished copy | Placeholder in `useCMSPreview`/`writeBoundValue`; Inspector state per cause |
| EDT-056 | Pages → CMS | Integration | P1 | VERIFIED_RUNTIME | VERIFIED_BROKEN | R N-2; `recordTemplatePreview.ts:42`, `cms.ts:366` | Changing the template page's slug silently disconnects the collection's dynamic pages (referenced by file name). Only a non-blocking pre-publish warning; Pages footer still says "+2 from collections". | Template referenced by pageId (D-12), or the slug change updates or warns | Implement D-12 (pageId reference) |
| EDT-057 | Pages → CMS | UX | P2 | VERIFIED_RUNTIME | VERIFIED_BROKEN | R N-3 | Deleting the template page shows a generic confirm with no mention of the collection or the N pages that stop generating (Undo exists) | Collection-aware confirm (board E3 `8251:237058`) | Dependency check in the Pages delete dialog |
| EDT-058 | CMS | Design | P3 | VERIFIED_RUNTIME | BOTH_GAP | R N-5; original board `4428:143182` rows are 40px "Record row" instances (FIGMA_EVIDENCE, s02) | Records and Fields rows are 40px in code **and** on the original board; DESIGN.md says 32px, never 40 | 32px rows (approved spec; proposal boards A2/B1) | Row size 32 in `RecordsTable`/`FieldsTable`; retire the 40px row component |
| EDT-059 | Save/recovery | State | P3 | VERIFIED_RUNTIME | VERIFIED_BROKEN | R N-6 (single observation) | After a reload with a failed save, another save fires before the user acts and stacks "Couldn't save" over "Restore my edits" | One recovery prompt; no duplicate attempt | Gate the auto-retry while the recovery prompt is pending |
| EDT-060 | Layers / status bar | UX | P3 | VERIFIED_RUNTIME | VERIFIED_BROKEN | R N-7 | Layers rows and the canvas status bar show the element's stored text, not the bound value | Label from the resolved value (or "⌁ Field") | Resolve the label for bound elements |
| EDT-061 | CMS → SEO/Redirects | Integration | P2 | CODE_EVIDENCE | CODE_GAP | `cms.service.ts` never calls `redirect.service.ts`; `suggestRedirects` (`site-detail.service.ts:285`) covers pages only | Changing a **published** record's slug breaks the old URL with no redirect or suggestion | Redirect row or suggestion on a slug change (proposal BD-28) | Feed record-slug changes into `suggestRedirects` |
| EDT-062 | CMS | State | P3 | CODE_EVIDENCE | CODE_GAP | `ContentTab.tsx:80`, `CmsWorkspace.tsx:87` | Two independent `useContentPanel` instances (drawer + workspace) hold separate state; a desync risk (INFERRED, e.g. counts after import) | One store (proposal UI-22) | Lift to one shared store |

The "SEO-pattern half" (runtime N-4) is folded into **EDT-028** and is not a new ID.

### EDT-055 — A bound element that resolves to nothing collapses to 0px
- **Type / Priority / Confidence / Status:** Missing State / P2 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **Journey:** A heading is bound to a record that is then unpublished or deleted, or the heading is pinned to a draft.
- **Reproduction steps:**
  1. Bind a heading to a record.
  2. Unpublish or delete the record.
  3. Look at the canvas.
- **Actual result:**
  - `textContent ""`, height 0, no `::before`. The element can only be reached through Layers.
  - The Inspector says "isn't published" for a **deleted** record.
  - The Record picker shows "Newest published record".
  - "Unbind keeps the text you see now" refers to empty text.
- **Expected result:** a dimmed "Empty · Title" placeholder at normal height, and copy that tells deleted, unpublished and empty-field apart (spec AT-17, board D2).
- **Source:** `packages/editor/src/editor/canvas/hooks/useCMSPreview.ts` (empty write, post-`4180deaca`); `CmsBindingSection.tsx` banner copy.
- **Figma / screenshot:** board D2 `8250:235648`; `r3-04-after-reload.png`, `r3-05-inspector-deleted.png`
- **Runtime trace:** `R-runtime.md` N-1
- **Root cause:** confirmed. The fix chose "mirror publish = write nothing" without a placeholder.
- **Dependencies:** Canvas, Inspector; EDT-011.
- **Recommendation:** render a placeholder on the canvas only; export stays `""`.
- **Acceptance:** AT-17.
- **Owner:** unassigned

### EDT-056 — Template page slug change disconnects the collection's dynamic pages
- **Type / Priority / Confidence / Status:** Integration / P1 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **Reproduction steps:** Pages → template page ⋯ → Page settings → URL slug `post-template` → `article-template` → Done.
- **Actual result:**
  - The collection keeps `pageTemplatePath: "post-template.html"`.
  - Dynamic pages says the template is missing.
  - Pre-publish shows only a warning that generated pages won't publish.
  - The Pages footer still says "+2 from collections".
  - No warning appears at the moment of the slug change.
- **Expected result:** the template is referenced by page id (approved D-12), or the change updates or blocks with a warning.
- **Source:** `packages/shared/schemas/cms.ts:366`, `prisma/schema.prisma:464` (string path); `recordTemplatePreview.ts:42`. Nothing updates `pageTemplatePath` on a page rename.
- **Evidence:** `r6-06-page-settings.png`, `r6-07-dp-after-slug-change.png`
- **Root cause:** confirmed (reference by file name).
- **Dependencies:** Pages, Publish, sitemap.
- **Recommendation:** D-12, or update `pageTemplatePath` in the same save as the slug change.
- **Acceptance:** after a template slug change, Dynamic pages stays "Ready" and the publish count is unchanged.
- **Owner:** unassigned

### EDT-057 — Template page delete has no collection-aware warning
- **Type / Priority / Confidence / Status:** UX / P2 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **Reproduction steps:** Pages → template page → ⋯ → Delete page.
- **Actual result:** a generic "This page and everything on it is removed. Undo (⌘Z) brings it back." The collection keeps its stale path; Undo restores the page.
- **Expected result:** the confirm names the collection and the pages that stop generating (board E3).
- **Source:** the Pages delete dialog.
- **Evidence:** `r6-08-delete-template-dialog.png`, `r6-09/10`.
- **Root cause:** confirmed (no dependency check).
- **Dependencies:** EDT-056.
- **Recommendation:** dependency lookup before delete.
- **Acceptance:** the dialog lists "Template for Posts — 2 record pages stop publishing".
- **Owner:** unassigned

### EDT-058 — Records and Fields rows are 40px
- **Type / Priority / Confidence / Status:** Design / P3 / VERIFIED_RUNTIME / BOTH_GAP
- **Actual result:** computed height is 40px on every `cms-row-*` and `cms-field-*` row. The original board `4428:143182` uses 40px "Record row" instances.
- **Expected result:** 32px (DESIGN.md §Row Density; approved spec; proposal boards A2/B1).
- **Evidence:** `r6-02/03`, r6a output; s02 board structure read.
- **Recommendation:** 32px rows; update or retire the 40px component.
- **Acceptance:** computed row height is 32px.
- **Owner:** unassigned

### EDT-059 — Duplicate save attempt after a reload with a failed save
- **Type / Priority / Confidence / Status:** State / P3 / VERIFIED_RUNTIME (one observation) / VERIFIED_BROKEN
- **Actual result:** with the save still failing, the reloaded page fired `saveProject` at once and stacked "Couldn't save" over "Restore my edits".
- **Expected result:** one recovery prompt; no automatic save of the server copy before the user chooses.
- **Evidence:** `r4-04-reload-recovery-prompt.png`; network 06:58:39 / 06:58:45.
- **Root cause:** unknown (suspected: auto-retry from L5-070 runs on load).
- **Recommendation:** suppress the auto-retry while recovery is pending.
- **Acceptance:** reload with a failed save → exactly one prompt.
- **Owner:** unassigned

### EDT-060 — Layers and status bar labels are stale for bound elements
- **Type / Priority / Confidence / Status:** UX / P3 / VERIFIED_RUNTIME / VERIFIED_BROKEN
- **Actual result:** a heading bound to the draft "Third post" is labelled "First post" in Layers; the status bar says "Heading · Second post" while the canvas shows "First post EDITED".
- **Expected result:** the label follows the resolved value, or a bound marker ("⌁ Title").
- **Evidence:** r3l output, `err-1791529471414.png`
- **Recommendation:** derive the label for bound elements from the binding.
- **Acceptance:** the Layers label equals the canvas text.
- **Owner:** unassigned

### EDT-061 — A changed record slug gets no redirect or suggestion
- **Type / Priority / Confidence / Status:** Integration / P2 / CODE_EVIDENCE / CODE_GAP
- **Actual result:** `redirect.service.ts` exists, and `suggestRedirects` only reads page changes. `cms.service.ts` never records the old record URL. Changing a published record's slug breaks inbound links and SEO.
- **Expected result:** an automatic redirect, or a Redirects suggestion, for the old `/collection/old-slug` (proposal BD-28).
- **Source:** `server/services/site-detail.service.ts:13,285`; `server/services/cms.service.ts` (no redirect calls).
- **Evidence:** code grep. Not walked live, because a publish would be needed.
- **Recommendation:** on a published slug change, record a suggestion row.
- **Acceptance:** changing slug a→b on a published record lists a→b in the Redirects suggestions.
- **Owner:** unassigned

### EDT-062 — Two independent `useContentPanel` instances
- **Type / Priority / Confidence / Status:** State / P3 / CODE_EVIDENCE / CODE_GAP
- **Actual result:** the drawer (`ContentTab.tsx:80`) and the workspace (`CmsWorkspace.tsx:87`) each create their own `useContentPanel(composer)` state. A desync (counts, selection after import) is INFERRED, not observed.
- **Expected result:** one store (proposal UI-22, §9 MERGE).
- **Recommendation:** lift into a shared store or context.
- **Acceptance:** importing in the workspace updates the drawer count without a reload.
- **Owner:** unassigned

## Current open counts (after re-audit)
| Priority | Open | Fixed since 10-08 | New in re-audit | Principal open blockers |
|---|---:|---:|---:|---|
| P0 | **1** | 1 (EDT-001) | 0 | **EDT-002** two tabs lose an edit |
| P1 | **8** | 1 (EDT-006) | 1 (EDT-056) | EDT-003 50-record window, EDT-004 reserved slugs, EDT-005 duplicate site, EDT-007 panel close, EDT-008 undo id, EDT-009 CSV types, EDT-010 publish generation, **EDT-056** template slug |
| P2 | **26** | 1 (EDT-011) | 3 (EDT-055, 057, 061) | EDT-018 and EDT-028 partly fixed and still open |
| P3 | **24** | 0 | 4 (EDT-058, 059, 060, 062) | — |
| **Total** | **59 open / 62 registered** | **3** | **8** | |

## Unverified areas and blockers (re-audit)
- [ ] **VIEWER role: BLOCKED.** `qa-viewer@buildrik.local` exists, but it has no password, and a magic-link token would have to be written to the DB, which the rules exclude.
- [ ] **Real publish output: not run.** This includes stale SEO patterns, a disconnected template, and record-slug redirects (EDT-061).
- [ ] **Issues not re-walked:** EDT-003…005, 007…010, 012…017, 019…027, 029…054. Their code is unchanged since 7a50e34e1, so the 10-08 evidence stands.
