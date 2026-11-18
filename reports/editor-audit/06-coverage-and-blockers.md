# 06 — Coverage and blockers

## Run metadata
- **Date:** 2026-10-08 → 2026-10-09 (PKT)
- **Mode:** `audit`
- **Arguments:** `cms deeply`
- **Commit:** `main @ 7a50e34e1`. HEAD at write time was `98ca128b1`; the CMS paths are unchanged between the two.
- **Run flags:** none. Runtime and Figma were both reachable.
- **Subagents:** 4 read-only tracks:
  - A: server, data, security (code + DB tests + 8 probes)
  - B: engine, sync, export (code + 689 tests + 1 probe)
  - C: UI, IA, a11y, Figma (code + 10 Figma calls)
  - D: live runtime (Playwright, 9 journeys, 2 profiles)
- **Reconciliation:** done here. Where runtime contradicted code, runtime won. Four contradictions are recorded below.

## Module coverage (this run)
| Module | Covered? | Depth |
|---|---|---|
| CMS (collections, fields, records, import, sync, conflicts) | Yes | Code + tests + runtime + Figma |
| Inspector › CMS binding / Collection list | Yes (CMS seam only) | Code + runtime + Figma |
| Canvas CMS preview | Yes (CMS seam only) | Code + runtime |
| Pages › dynamic pages | Yes (CMS seam only) | Code + runtime + Figma |
| Publish (CMS snapshot, pre-checks, dynamic generation) | Partial | Code + tests + runtime up to the confirm dialog; **no real deploy** |
| Sites › Duplicate | CMS seam only | Code + runtime |
| History / undo for CMS operations | Yes (CMS seam only) | Runtime + code |
| Save / recovery | CMS-triggered paths only | Runtime |
| Forms → CMS, Components, Brand, Media, AI, other modules | **Not audited** (out of scope for `audit cms`) | — |

All modules discovered in the editor: about 17 module rows in the matrix (the 2026-10-08 full audit lists 37 sub-rows). This run audited **1 module (CMS)** plus 7 seams.

## Prior findings reconciliation (summary)
| Source | Still open | Fixed | Other |
|---|---|---|---|
| L3-015…L3-023 (2026-10-08 live) | 015, 016, 017, 018, 021, 022, 023 (most sub-items), 020 part 2 | — | 019 BLOCKED live (open in code); 020 part 1 **reclassified**: matches the board |
| 2026-09-27 CMS-01…23 | 07 (residual), 08, 11, 12, 13 (partly), 14, 17, 18, 20, 21, 23 | 01, 02, 03, 04, 06 (client side), 09, 19, 22 (rail name) | — |
| 05 phase-1 P1-1/2/3, P2-1/2/3/7/8/10/11/12/13 | All still open | — | P2-9 not reproducible as a file collision; real defects are EDT-004/020 |
| 03-engine P1-2/6/7, P2-6 | All still open | — | — |
| Proposal C0–C5 | C0.2, C2, C3, C4, C5 not built; C0.3/C0.5 partial | C0.1, C0.4, C0.7–C0.10, most of C1 | — |

## Contradictions resolved (runtime wins)
1. **B-03 said an orphaned outbox op blocks publish permanently.** At runtime the toast never clears, but publish is **not** blocked. EDT-012 records the gate mismatch, with the root cause unknown.
2. **B-01 said a required-field rename on a published record reverts.** Not reproduced live: the value survived. Only the rich-text half stands.
3. **C said CMS-22's React key warning was fixed.** The runtime console still shows a key warning at `RecordsTable.tsx:147` (EDT-053).
4. **B-12 said a collection-slug clash produces a 500 loop.** The UI guard prevents this on one device (VERIFIED_OK). Only the stale-device path remains (EDT-041, CODE_EVIDENCE).

Priority disagreements:
- EDT-032: track C said P1; set to P2 because no journey is blocked.
- EDT-011: B said P1, D said P2; set to P2 because pre-publish flags empty bindings.
- EDT-002: B said P2 (inferred), D said P0 (reproduced); set to P0, silent data loss.
- EDT-009: A said P3, D said P1; set to P1, because live output showed wrong values.

## Blockers / not verified
| Item | Why | Needed to unblock |
|---|---|---|
| Real publish / deploy output (EDT-004 `index`/template slugs, EDT-010 timing, EDT-020 duplicate files on Vercel) | QA workspace has a live Vercel connection; publishing was forbidden | A workspace with no Vercel connection + `PUBLISH_ALLOW_SIMULATION=true`, or an owner-approved throwaway deploy with cleanup |
| L3-019 collection INVALID live | Needs a 101st collection or a forced refusal | Seed 100 collections in a throwaway site |
| Image field values | Empty media library on the throwaway site | Upload a test asset |
| Roles below OWNER | Only the OWNER account was walked | An EDITOR/VIEWER test user |
| Screen reader / axe | Not run | axe pass + VoiceOver walk |
| Canvas performance at 2k+ records (EDT-034) | Not measured | Seed 2k records; measure typing latency |
| Figma prototype wiring / FG-013 orphans | Saves the call budget | ~3 `get_metadata` calls |
| Ecommerce block exposure (EDT-042) | Not checked | Open the Add panel |

## Evidence retained
- `evidence/cms-2026-10-08/tracks/`: the 4 full track reports. These are the authoritative per-finding detail.
- `evidence/cms-2026-10-08/shots/`: about 126 runtime screenshots.
- `evidence/cms-2026-10-08/figma/`: 10 board PNGs.
- `evidence/cms-2026-10-08/cleanup.json`: proof that the throwaway sites were deleted.
- **Not retained in the repo:** network and console logs, probe scripts and the DB probes. They contain session credentials or live outside the report root. Their results are quoted in the track reports.

## `git status`
- **Before:** no tracked changes. Untracked files pre-existed (docs, pngs, dumps), and none of them were touched.
- **After:** no tracked changes. The only new path is the untracked `reports/editor-audit/`.
- **Outside the repo:** the audit worktree `~/Desktop/buildrik-worktrees/editor-live-audit` was moved from `f9f79bc66` to a detached `7a50e34e1` and left clean.
- **Local dev DB:** throwaway sites were created and then soft-deleted; they sit in "Recently deleted".


---

## Re-audit 2026-10-09 coverage
- **Re-walked live:** EDT-001, 002, 006, 011, 018 and 028, plus regressions (live title propagation, cross-profile CONFLICT, pre-publish dialog), plus the candidate checks (row height, template slug/delete, VIEWER).
- **Not re-walked:** all other issues. Their code is unchanged since `7a50e34e1` (literal-path diff), so the 10-08 evidence stands.
- **Blocked:**
  - VIEWER role. `qa-viewer@buildrik.local` exists with no password; signing in needs a magic-link token written to the DB, which is excluded.
  - Real publish. The QA workspace deploys for real.
- **Promoted candidates:**
  - From the spec: 40px rows → EDT-058; template referenced by file name → EDT-056; no redirect on slug change → EDT-061; template delete unguarded → EDT-057; two `useContentPanel` → EDT-062.
  - Dismissed: "two New collection buttons". They are one per surface (drawer, Inspector binding, Inspector list), which is contextual and not duplicated.
  - Still BLOCKED: VIEWER read-only.
- **Contradiction resolved:** the runtime track said record delete "now" asks for a typed DELETE with no Undo, which would make EDT-008 moot. No delete code changed. The typed confirm applies to records that own a generated page (`RecordSheet.tsx:335`, C-04), which the test record did. EDT-008 stays open.
- **Process note:** an earlier verify drift check used a zsh variable as the pathspec, which matched nothing. The checks in this re-audit use literal paths.
- **`git status`:** 0 tracked changes before and after. The worktree is left detached at `50ab12da6`. The throwaway site is soft-deleted (`evidence/cms-reaudit-2026-10-09/cleanup.json`).
