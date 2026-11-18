# 01 — CMS feature inventory

## Run metadata
- Date: 2026-10-08 → 2026-10-09 (PKT)
- Mode: `audit`
- Arguments: `cms deeply`
- Commit: `main @ 7a50e34e1`. HEAD at the time of writing was `98ca128b1`, and no CMS paths differ between the two.
- Run flags: none
- Sources: tracks A to D (`evidence/cms-2026-10-08/tracks/`)

## Stack (as found, not assumed)
- **Editor chrome:** the `@/editor/chrome-ui` components built on `flowbite-react`, styled with `tw:`-prefixed Tailwind utilities and the generated `--bk-*` tokens.
  - CMS files use no raw `<button>`/`<input>` elements, no hex colours and no purple.
  - There are a few raw palette and default utilities (EDT-051).
- **Engine:** `Composer` with `CollectionManager`, `CMSBindingManager`, `RepeaterRenderer` and `CMSExportResolver`.
  - The local store is IndexedDB (`CollectionStorage`, DB v2 with a `[siteId, slug]` index).
- **Sync:** `cmsSync.ts` + `syncRetryQueue.ts`.
  - The persistent outbox `bk-cms-outbox-v1` and the conflict stamps `bk-sync-stamps-v1` both live in `localStorage`.
  - The server mirror is tRPC.
- **Server:** tRPC router `server/trpc/routers/cms.ts` → `server/services/cms.service.ts` → Prisma `CmsCollection` and `CmsEntry`.
  - The `Site` model carries `projectCmsBindings` and `cmsEditedAt`.
  - Six CMS migrations exist.
- **Shared contract:** `packages/shared/schemas/cms.ts` is the shared validator, used by both engine and server. `packages/shared/content/cmsRichText.ts` is the shared rich-text allow-list.
- **Publish:** reads the server snapshot (`cms.publishSnapshot`), not IndexedDB.
  - Dynamic pages are generated server-side in `startPublish`.
  - Pre-publish CMS rows: empty bindings, unbound lists, templates.
- **Panel widths:** the record sheet is observed as a full overlay. The founder decision PD-10 (2026-09-28) says a 480px right-docked panel, which is a confirmed requirement. Nothing else is measured as a requirement.

## Entry points (VERIFIED_RUNTIME unless noted)
| Entry | Where | Result |
|---|---|---|
| CMS rail tab (shortcut D) | Left rail | Opens the drawer and workspace |
| ⌘K "Open CMS", "Manage CMS records" | Command palette | Works |
| Empty-state links | Drawer | Work; the links wrap word by word (EDT-044 family) |
| Inspector › Behaviour › CMS binding | Right panel, element selected | Binds to Collection · Field · Record |
| Inspector › Collection list section | Right panel, list selected | Binds a list to a collection |
| Pages panel "+N from collections" | Pages | Opens one collection only (EDT-049, CODE_EVIDENCE) |
| Product card / grid insert prompt | Add panel | Creates a Products collection; the blocks are not wired (EDT-042, CODE_EVIDENCE) |

## Capability inventory
| Area | Capability | State | Evidence |
|---|---|---|---|
| Collections | Create via the setup modal; name-clash dialog; rename; slug-clash refusal (local) | Works, with wizard defects (EDT-043) | D j2-* |
| Collections | Delete with a typed DELETE that counts records, pages and bindings, and is blocked while referenced | Works; not atomic on failure (EDT-029) | D, C VERIFIED_OK |
| Fields | 10 types: text, long text, rich text, number, date, boolean, image, slug, multi-select, reference | Work | D j2 |
| Fields | Key rename | **Broken** for rich text (EDT-001); misses SEO patterns (EDT-028) | D-01 |
| Fields | Type change | No confirm, no conversion (EDT-023) | D-22 |
| Fields | Delete | Guarded while bound or used in the URL pattern; values stay behind (EDT-023) | D, C |
| Records | Create, edit, auto-slug, required-to-publish, publish toggle, unsaved guards | Work, except closing the panel (EDT-007) | D j3 |
| Records | Delete + Undo | Undo gives a new id (EDT-008); no warning about dependants (EDT-027) | D-05 |
| Records | Table: search, sort (`aria-sort`), 50 per page | Works; no status column, filter, bulk actions or row actions (EDT-026) | D, C |
| Records | CSV import (server path, 300 KB / 500 rows) | Works; values not type-coerced (EDT-009) | D-06 |
| Records | JSON import (client path) | Exists; follows different rules from CSV (EDT-052) | C-23 |
| Records | Conflict detection across browsers | Works; the resolution UI can't see the other version (EDT-014) | D-17 |
| Records | Conflict detection across tabs of the same browser | **Broken** (EDT-002) | D-02 |
| Records | Offline edit → outbox → replay | Works; edge cases are stuck (EDT-012, EDT-033) | D j7 |
| Binding | Field binding (Collection / Field / Record), live propagation, Unbind, undo | Works; 50-record window (EDT-003); binding-only change not saved (EDT-006) | D j4 |
| Binding | Collection list (repeat children, current-item, `{{item.url}}`) | Publish is correct; the canvas shows drafts and raw `{{item.*}}` (EDT-015) | D-11 |
| Dynamic pages | Template + URL pattern + SEO title/description patterns; record preview | Works; reserved and colliding slugs accepted (EDT-004) | D j5 |
| Publish | Server snapshot; empty-binding and unbound-list pre-checks; drafts never published | Works (VERIFIED_OK); generation is synchronous (EDT-010) | A strengths |
| Data sources | Paste JSON; Sheets and Airtable "Coming soon" | In memory only (EDT-016); C5 not built | D-16 |
| Activity / restore | — | Absent (EDT-039) | A-13 |
| Views / filters / constants (C5) | — | Absent; planned in C5 | A, B |
| AI in CMS | — | Absent; not planned (see `04`) | grep |

## Roadmap waves (proposal `docs/plans/2026-09-28-cms-architecture-proposal.md`) vs `7a50e34e1`
| Wave | Built? |
|---|---|
| C0.1 server snapshot publish | Built |
| C0.2 server field rename | **Not built** (root cause of EDT-001) |
| C0.3 conflict precondition | Partial: optional `updatedAt`, no `version` column (EDT-002, EDT-013) |
| C0.4 tombstones | Built |
| C0.5 persistent outbox | Built in localStorage, with gaps (EDT-012, EDT-033) |
| C0.6–C0.10 | Built; C0.6 not re-checked |
| C1 (shared validator, Reference / Rich text / Multi-select, slug, caps, binding fixes) | Largely built; "remove Sources" not executed (EDT-016) |
| C2 (IA restructure, PD-10 dock, table bulk/status, import spec, restore, ActivityLog) | **Not started** |
| C3 / C4 | Not started (C4 ecommerce: EDT-042) |
| C5 (sources, Views, constants) | **Not built** |

## Tests present
- **Editor:** 76 CMS-related test files, 689 tests. Result: 687 passed, 1 timed out (the known flake `CmsWorkspace.recordSave.test.tsx:167`, which passes 9/9 when run alone), and 1 todo.
- **Server/shared unit:** 191/191 passed.
- **DB tier:** 25/25 passed (5 files).
- **Gap:** no test crosses the module seams that broke at runtime: rename ordering, the >50-record window, duplicating a site, a binding-only autosave, and two tabs.


---

## Re-audit 2026-10-09 delta (main @ `50ab12da6`)
- **Field key rename:** the collection is written before the records (fixed EDT-001). A key used by the **URL pattern** is now locked in the Field inspector. Keys used only in SEO patterns are not locked or migrated (EDT-028).
- **Binding:** every bind marks the project dirty (fixed EDT-006).
- **Canvas preview:** re-resolves on publish/unpublish and bind/unbind. An unresolved binding renders empty with the `data-cms-bound` marker kept (fixed EDT-011). There is no placeholder (EDT-055).
- **Save:** a failed autosave retries on its own when back online, and "Restore my edits" saves (EDT-018 partly).
- **Unchanged:** the template page is still referenced by file path (EDT-056), and two `useContentPanel` instances remain (EDT-062).
