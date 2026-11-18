# 00 — CMS audit: executive summary

## Run metadata
- **Date:** 2026-10-08 → 2026-10-09 (PKT)
- **Mode:** `audit`
- **Arguments:** `cms deeply` (scoped: CMS + its seams)
- **Repository:** `/Users/shahg/Desktop/pencil/buildrik`
- **Commit:** audited at `main @ 7a50e34e1`. HEAD at write time was `98ca128b1`; the CMS paths are unchanged.
- **Run flags:** none. Runtime and Figma were both verified, with partial coverage (see `06`).
- **Evidence:** live walk at `localhost:3610` with 2 browser profiles, as the OWNER account, with no real publish. Plus 191 + 25 server/DB tests, 689 editor tests, 9 probes and 10 Figma board screenshots.

## Verdict
CMS is **feature-rich but not end-to-end safe**. The server is solid:
- permission checks
- cross-site isolation
- tombstones
- the shared validator
- layered XSS defence
- drafts never published
- publish reading the server snapshot

What breaks is the seams between the editor engine, sync, canvas and publish. Of 76 live journey steps, 45 passed and 31 failed. **Critical journey 5** (collection → record → bind → preview → publish) works on the happy path but is **not complete**: at least five defects change what would publish.

## Issues: 54 unique (after merging 86 track findings)
| Priority | Count | Headline |
|---|---:|---|
| **P0** | 2 | **EDT-001** renaming a field key strips rich text from every record (live, test-confirmed). **EDT-002** two tabs of the same browser silently overwrite each other's edits (live). |
| **P1** | 8 | Pinned record beyond the newest 50 publishes empty (EDT-003). Slug `api` makes the whole site unpublishable (EDT-004). Duplicated site loses its CMS (EDT-005). Re-binding is never saved (EDT-006). Closing the CMS panel discards edits (EDT-007). Undo-delete gives a new id (EDT-008). CSV import doesn't coerce types (EDT-009). Dynamic pages render inside the publish request (EDT-010). |
| P2 | 24 | Canvas ≠ publish; sync dead-letters; conflict UX; schema-change safety; 2 security gaps; accessibility; C2 IA not built |
| P3 | 20 | Server hardening, copy, design-system tokens, polish |

## Top root-cause clusters
1. **No server-side schema operations (C0.2 unbuilt).** Renames and type changes are replayed record by record from the client, in the wrong order.
2. **Concurrency precondition half-built (C0.3).** It is optional on the server and shared across tabs on the client.
3. **The canvas re-implements CMS resolution with different rules from publish.** It has a 50-record window, shows drafts, and ignores publish events.
4. **Dirty/save events not raised** for binding-only changes, panel close and data sources.
5. **Validation per write, not per published path.** Reserved slugs, schema-change re-checks and duplicate paths are not covered.
6. **The C2 IA wave was never started, and the Figma boards share its gaps:** the PD-10 dock, status and bulk on the table, named tabs, and the conflict diff.

## Prior audits
- **L3-015…L3-022** (from earlier today): 7 of 8 testable items are still reproducible. L3-019 is blocked live but open in code.
- **L3-020's "typed DELETE required" is reclassified.** It matches the board, which only asks for it on page-owning records.
- **2026-09-27 CMS-xx:** 8 fixed, 11 still open.
- **2026-09-28 proposal:** C0.2, C2, C3, C4 and C5 are not built.

## AI
CMS has no AI integration and none is planned. It is recorded as absent, not broken (`04`).

## Recommended next steps
- **Wave 0** (`07`), a few days:
  - gate field-key rename
  - per-tab precondition
  - `markDirty` on bind
  - guard the drawer close
  - resolve pinned records by id
  - remove the two security leaks
  - keep toasts below modals
- **Then** `blueprint cms` to turn C2 plus the open decisions (Sources, ecommerce, archived, canvas drafts) into a signed-off spec before any Figma work.

## Files
- `01-feature-inventory.md`
- `02-issues.md` (register, 54 issues)
- `03-journeys-and-integration.md` (journeys, transition map, traceability, clusters)
- `04-ai-audit.md`
- `05-figma-vs-code.md`
- `06-coverage-and-blockers.md`
- `07-prioritized-roadmap.md`
- `evidence/cms-2026-10-08/`


---

## Re-audit 2026-10-09 (scoped `audit cms`, main @ `50ab12da6`)
The audit-fix branch merged: 20 CMS/save/canvas files. The changed journeys were re-walked live (`evidence/cms-reaudit-2026-10-09/`).

**Fixed (VERIFIED_RUNTIME):**
- **EDT-001 (P0)**: a rich-text key rename now keeps its formatting.
- **EDT-006**: a binding-only change saves.
- **EDT-011**: the canvas mirrors publish.

**Partly fixed:**
- **EDT-018**: auto-retry works, but the stale recovery toast remains.
- **EDT-028**: the URL-pattern key is locked, but SEO patterns keep the old key.

**Still broken:** **EDT-002 (P0)** two tabs, re-confirmed.

**New (8):**
- **EDT-056 (P1)**: changing the template page slug silently disconnects dynamic pages.
- EDT-055 (P2): an empty binding collapses to 0px.
- EDT-057 (P2): the template delete has no collection warning.
- EDT-061 (P2): no redirect for a changed record slug.
- EDT-058, 059, 060, 062 (P3).

**Open now:** P0 1 · P1 8 · P2 26 · P3 24, so 59 open of 62 registered.

**Next:** EDT-002 (the last P0), then EDT-056 together with D-12 (template by pageId), then the rest of Wave 0/1 in `07`.
