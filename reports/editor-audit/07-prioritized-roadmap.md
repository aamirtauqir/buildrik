# 07 — CMS prioritized roadmap

## Run metadata
- **Date:** 2026-10-08 → 2026-10-09 (PKT)
- **Mode:** `audit`
- **Arguments:** `cms deeply`
- **Commit:** `main @ 7a50e34e1`
- **Run flags:** none

These are recommendations, not plans of record. Each wave lists issues from `02-issues.md`. The order follows data-loss risk first, then publish integrity, then structure.

## Wave 0: stop the bleeding (days)
| Item | Issues | Notes |
|---|---|---|
| Disable field-key rename (or warn) until C0.2 ships | EDT-001, EDT-028 | One-line UI gate. Prevents permanent rich-text loss. |
| Per-tab conflict precondition | EDT-002 | Carry the `updatedAt` the sheet loaded. Smallest fix for a P0. |
| `markDirty` on bind | EDT-006 | One line + test |
| Guard the drawer close with `shellDirty` | EDT-007 | |
| Resolve a pinned record by id | EDT-003 | `getContentItem(id)` + status check, in two places |
| Remove `_skipTouchCmsEdited` from the transport schema; delete `generateDynamicPages` | EDT-021, EDT-022 | Security, small |
| Toasts below modals | EDT-017 | Safety around Publish |

## Wave 1: publish integrity (1–2 weeks)
| Item | Issues |
|---|---|
| Shared path rule: record paths checked against reserved names and existing pages; skip-and-report instead of failing the whole deploy | EDT-004, EDT-020 |
| `duplicateSite` copies CMS with remapped ids (or strips bindings with a notice) | EDT-005 |
| Canvas follows the publish rules: react to publish/unpublish, placeholder state, marker always shown, filter drafts in lists, empty state | EDT-011, EDT-015 |
| Undo-delete restores the same id (+ server restore) | EDT-008, EDT-039 (restore part) |
| CSV coercion by type + per-row report | EDT-009, EDT-052 |
| Sync terminal states: drop child ops, `onCmsInvalid` toast, blocker matches the toast | EDT-012, EDT-029 |

## Wave 2: data-model primitives (C0.2 / C0.3 completion)
| Item | Issues |
|---|---|
| Server `cms.fields.rename` (atomic jsonb re-key incl. SEO patterns), field-type conversion, field-delete purge | EDT-001, EDT-023, EDT-028 |
| Required precondition (or `version`) on existing rows; per-field merge in the conflict UI | EDT-013, EDT-014, EDT-036, EDT-041 |
| Re-validate published rows on schema change; atomic clash check | EDT-020, EDT-019 |
| Write-back guard; synchronous outbox put; owed-row replay | EDT-033 |
| Server reference integrity + IN_USE delete guard; client dependants warning | EDT-027, EDT-037, EDT-038 |

## Wave 3: scale
| Item | Issues |
|---|---|
| Dynamic-page generation in the publish worker | EDT-010 |
| Cap and memoise canvas list expansion | EDT-034 |
| Paginated `entries.list`; indexed pre-check | EDT-040 |

## Wave 4: C2 IA restructure (design + code together)
**Precondition:** designer updates the boards listed in `05` first (founder rule: code first, Figma after runtime verification. The boards share these gaps, so they must move together).

| Item | Issues |
|---|---|
| PD-10 480px record dock, no duplicate tab row, ⋯ = Duplicate / View on page / Delete | EDT-032 |
| Four named tabs (Records · Fields · Pages · Settings) | EDT-031 |
| Records table: status column + filter, bulk select/actions, row ⋯, Columns, persisted sort, skeleton, collections overview at the root | EDT-026, EDT-044, EDT-048 |
| Keyboard and a11y: focus management, Escape contract, grid pattern, associated errors | EDT-024, EDT-025 |
| "Used by" page-qualified links | EDT-030 |
| Binding picker: names, one label map, searchable record combobox | EDT-045, EDT-046 |
| ActivityLog, restore, tombstone purge, rate limits | EDT-039 |

## Wave 5: owner decisions, then build
| Decision | Issues |
|---|---|
| Data Sources: hide the door now, or build C5 (Sheets, Airtable, API, Views, constants) | EDT-016 |
| Ecommerce blocks: wire to Products, or drop (PD-6) | EDT-042 |
| `archived` status: add server-side, or remove from the editor | EDT-040 |
| Canvas drafts in lists: hide, or show marked | EDT-015 |

## Polish (any time)
- Copy and vocabulary: EDT-043, EDT-047, EDT-050
- Design-system token pass: EDT-051
- Pages "+N" popover: EDT-049
- Console errors: EDT-053
- Engine hygiene: EDT-054
- Undo semantics: EDT-035
- Server error masking: EDT-036
- Server preconditions and pagination: EDT-038, EDT-040

## Test debt to retire alongside
These tests currently pass while pinning bugs, and must be rewritten with the fixes:
- `CollectionManager.rename.test.ts:30`
- `__tests__/db/cms-conflict.db.test.ts:60`

Seam tests to add:
- More than 50 published records
- Two tabs of the same browser
- Duplicate site with CMS
- Autosave after a binding-only change
- Reserved slugs


---

## Re-audit 2026-10-09 update
- **Done (VERIFIED_RUNTIME):** EDT-001 (rename order), EDT-006 (bind marks dirty), EDT-011 (canvas mirrors publish), and the auto-retry half of EDT-018.
- **Wave 0 now:**
  1. **EDT-002 (P0)** per-tab precondition.
  2. **EDT-056 (P1)** reference the template by pageId (D-12), or update it on a slug change.
  3. EDT-007 drawer-close guard.
  4. EDT-003 resolve pinned records by id.
  5. EDT-021 and EDT-022 security.
  6. EDT-017 toasts below modals.
  7. EDT-018 clear the recovery toast after a successful save.
- **Wave 1 additions:**
  - EDT-055 "Empty · Field" placeholder (board D2).
  - EDT-057 collection-aware template delete (board E3).
  - EDT-028 SEO-pattern rewrite and lock.
- **Polish additions:** EDT-058 32px rows, EDT-059, EDT-060, EDT-062.
- **SEO:** EDT-061 record-slug redirects, with EDT-020.
