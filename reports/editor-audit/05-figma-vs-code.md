# 05 — CMS: Figma vs code vs runtime

## Run metadata
- **Date:** 2026-10-08 → 2026-10-09 (PKT)
- **Mode:** `audit`
- **Arguments:** `cms deeply`
- **Commit:** `main @ 7a50e34e1`
- **Run flags:** none
- **Figma file:** `g4GzQFqzNYz5sosz1QtZXC`. Source-of-truth page: `4418:45431` (Editor v3 · IA).
- **Figma calls:** 10 `get_screenshot` calls, serial, all succeeded. The PNGs are in `evidence/cms-2026-10-08/figma/`.
- **Other board text:** comes from the local 2026-09-21 dump (`docs/audit-2026-09-21/dump/live-all.json`), is marked "dump" below, and is **not** counted as FIGMA_EVIDENCE.
- **Precedence (`packages/editor/CLAUDE.md`):**
  - Behaviour follows the code contract.
  - Visuals follow the board.
  - Founder decisions (PD-10, C2) override both where they are recorded.

## Board-by-board comparison
| Board node | Board shows | Code does | Runtime | Verdict | Issue |
|---|---|---|---|---|---|
| `4428:143182` Records table | 5 columns, no status, no checkbox, no pager | Same columns, a "· Draft" suffix, search, a 50-row pager | Same | Code ≈ board; **both behind C2** | EDT-026 |
| `4428:144760` Record workspace | Full overlay over the table, duplicate tab row | Same, plus a Published toggle | Same | Code ≈ board; **both violate PD-10** | EDT-032 |
| `4428:147552` Fields | Used by at page level, › per row | Layer or type name, no page, not clickable | — | **Code behind the board** | EDT-030 |
| `4428:147857` Dynamic pages | Pattern, Template, Ready, routes, "Generate 4 pages"; no SEO fields | Same, plus SEO title and description patterns | Same | Board stale; shared copy problems | EDT-047 |
| `4428:148660` Settings | Source = Google Sheets synced; danger zone counts records and pages | Source = "Buildrik CMS"; counts bindings; blocks deletion when referenced | — | Board stale (09-25 no-OAuth decision); code richer | EDT-050 |
| `7063:79200` Inspector · From CMS | CONTENT section, Source radio, Collection only | Collection · Field · Record · preview · Open · Unbind | Works | Board superseded | EDT-046 |
| `7995:205467` Inspector v4 bound heading | Field "name · Text", preview, Open record, Unbind; no Record row | Matches, plus a Record row | Works | Board lacks the Record row; both show the key instead of the name | EDT-045, EDT-046 |
| `8139:217560` Record conflict | Yellow band, Keep mine (ghost) / Use theirs (primary), no diff | Identical | Reproduced | **Both blind** | EDT-014 |
| `4418:84646` New collection | Step chips, drag handles, Template + SEO in the summary | Chips and handle kept; summary shows the slug pattern only | Reproduced | Both keep the fake chips; board stale on template/SEO | EDT-043 |
| `6881:70349` Delete record (typed) | Typed DELETE for a page-owning record | Identical, for page-owning records only | Instant delete for others, by design | **Match** | (C-04) |

## Discrepancy summary
- **Code behind the board (CODE_GAP):** EDT-030 (Used by links).
- **Board and code both diverge from approved decisions (BOTH_GAP):** EDT-014, EDT-026, EDT-031, EDT-032, EDT-043, EDT-045, EDT-046, EDT-047.
- **Board stale, code ahead:** Settings source; Inspector · From CMS; Dynamic pages SEO; the New collection summary.
- **Match:** record delete guard (typed confirm only for page-owning records). The earlier claim in L3-020 that "Figma requires typed DELETE" for every record was a misreading.

## Figma debt (for the designer)
- **Stale against PD-10:** `4428:144760` and about 10 record-workspace siblings still draw the overlay. From the dump: `5940:149118`, `5940:149532`, `5940:149946`, `6887:75832`, `6887:76066`, `6887:76300`, `6749:59940`, `6930:81443`, `7116:76427`, `8139:217560`.
- **Missing states (proposal F2):**
  - Collections overview at the workspace root
  - Records loading skeleton
  - Bulk selection and bulk delete
  - Record panel saving / saved / field-level validation / read-only / missing media
  - Conflict **diff**
  - Field type-change confirmation and Required-impact count
  - Record delete when the record has dependants
  - Import progress / partial result / Undo
- **Board text behind the code:** `4428:147857` (no SEO), `4428:148660` (Google Sheets), `4428:148905` (dump: "Import from Google Sheets"), `7063:79200` and `7995:205467` (no Record row), `4418:84646` (template/SEO in the summary).
- **No board at all:** RichTextField toolbar; OptionsEditor; ReferenceField "Deleted record". Date field config (FG-043, boards `7978:197166` and `7978:197182`, per the dump) was not re-read.
- **Not re-checked:** whether FG-013's 4 orphaned CMS state boards are reachable in the prototype. That would cost metadata calls.

## Claims kept separate
- **Figma prototype wiring:** not inspected.
- **Code implementation:** see `02`.
- **End-to-end function:** verified live for journeys 1–9 except a real deploy.


---

## Re-audit 2026-10-09 notes
- **EDT-058 (BOTH_GAP):** the original board `4428:143182` and the code both use 40px record rows. The approved spec and the proposal boards (A2 `8243:232939`, B1 `8248:233437`) use 32px.
- **EDT-055:** code now renders an unresolved binding as empty (0px). Proposal board D2 `8250:235648` specifies the dimmed "Empty · Name" placeholder. The design is ready; the code gap is open.
- **EDT-056/057:** proposal boards B3 `8248:234422` (template by pageId) and E3 `8251:237058` (guarded template delete) cover the target. The code is still file-name based, with a generic confirm.
- Figma was not re-read in this run.
