# Settings · Clone — Implementation Plan (S1–S5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the shipped fullpage Settings (`packages/editor/src/editor/sidebar/tabs/settings/`) look and behave like the 67 frames of Figma page `Editor v1 Clone` (`3397:13062`), section `3397:32010` "Configure site and workspace · Settings" — every frame, every drawn state, verified in the running unified editor.

**Architecture:** A conformance walk over an existing surface, with the backend in scope this time. `SettingsTab` (nav + save bar) → 13 screens (`screens/*.tsx`) → composer project settings (General / SEO / Analytics / Custom code) or tRPC + Site columns (Domains / Redirects / Headers / Forms / Webhooks / Localization / Integrations). Each Clone frame is walked live at 1440×900 beside its cached shot; drift is closed test-first, one commit per fix; where a frame needs data or an endpoint the code lacks, the phase's **backend delta doc** names it and, once approved, a backend agent builds it through the chain (Page → tRPC → Router → Service → Prisma).

**Tech Stack:** React 18 + TS editor (Vitest + RTL), Next 16 dashboard (tRPC 11, Prisma 5, Postgres) at `localhost:3000` hosting the unified editor, gstack `/browse` for the live walk, `scripts/baseline/figma-mcp.mjs` + `scripts/figma/clone-shots.mjs` for Figma (budget-capped, cached).

**Spec:** the grilling session of 2026-09-14 (decisions below) + the section census `docs/design-jobs/CLONE-SETTINGS/census.json` + the cached shots `docs/design-jobs/CLONE-SETTINGS/shots/<id>.png` + the prototype edge graph `docs/design-jobs/CLONE-SETTINGS/reactions-*.json`.

## Decisions (grilling 2026-09-14 — all locked)

| # | decision | founder's call |
|---|---|---|
| Q1 | Scope | **B — all 67 frames.** `CURRENT DESIGN` and `REFERENCE VARIANT` alike are contracts; every drawn state is forced live and verified. |
| Q2 | Phases | **S1 Shell + SITE → S2 DISTRIBUTION → S3 PLUMBING-1 → S4 PLUMBING-2 → S5 odd ones** (table below). |
| Q3a | Conflict: Clone vs V1 S7 board vs code | **A — Clone wins** (visual + copy). S7 rows → `authority: superseded:board:clone-<id>` (kept active, recipes live); every Clone row `authority: board:clone-<id>`. |
| Q3b | Behaviour source | **C — the frame wins, and the backend changes where the frame needs it.** No client-side fakes. |
| Q3c | How far the backend opens | **C — delta doc first.** Every phase starts with `docs/design-jobs/CLONE-SETTINGS/phaseN-backend.md` (endpoints, schemas, columns, migrations, the frames that need each); the founder says "go"; only then is any of it built. Prisma migrations allowed once approved; committed; applied locally with `prisma migrate dev`; prod apply is the founder's step (`prisma migrate deploy`). |
| Q3d | Density | **A — 32px controls / 28–32 rows** (DESIGN.md compact). The Clone's 44px refused → `founder:density-32` on the row. |
| Q3e | Sample data · Clone-vs-Clone | **Yes both:** frame data ("Bella Cucina", "bellacucina.com", "About → /our-story") is shape, never literal; when two Clone frames disagree the later / more specific frame wins, recorded on the row. |
| Q4 | Figma budget | **A — ~85 calls on 2026-09-14** (68 shots + the edge graph in chunks + a few `get_design_context`), all cached under `docs/design-jobs/CLONE-SETTINGS/`, no Figma call inside any phase after that. |
| Q5 | Git | **B — push `feat/assets-clone-p1` first, then `feat/settings-clone` from it.** One fix = one commit `J-<nodeId>: implemented — …`; backend commits `J-<nodeId>: backend — …`. Never stage `packages/editor/src/editor/shell/AquibraStudio.tsx` or `packages/editor/scripts/baselines/ssot.json`. Push only when asked. |
| Q6 | Verification env | **A — local seed + plan flip + forced failures.** Unified editor `localhost:3000/edit/scratchver0000000000000001` at 1440×900, side-by-side shots; a Prisma seed for the scratch workspace (domains, redirects, headers, forms + submissions, webhooks); plan `STARTER ↔ PRO` flipped by SQL for the locked/unlocked walks and reverted; loading / load-error / save-error forced through the browser (request block / reject). Real external services (DNS verification, OAuth) are not called → `blocked:external`. |
| Q7 | Execution | **A — per phase: 1 backend agent (server/, packages/shared/schemas, prisma — only the approved delta) + 2–3 editor agents (screens by tab), each in a worktree; main merges, walks live, fixes, records.** |
| Q8 | Done-condition · gate | **A — stop after every phase.** Done = every frame of the phase has a live screenshot beside its shot (states forced or seeded; the rest `driven` / `blocked:*` on the row) · editor tests + dashboard tests green · `tsc` clean · `pnpm run verify:ds` exit 0 · migrations applied locally · `boards.json` rows + `phaseN-journeys.md` · one commit per fix. Then the phase report + the NEXT phase's backend delta doc → the founder's "go". |
| Q9 | Kickoff | **A — plan doc → push → branch → shots + graph → S1 backend delta doc → stop.** |

Carried over unchanged from the Assets arc: `BLOB_READ_WRITE_TOKEN` never appears in chat; gstack `/browse` only (never `mcp__claude-in-chrome__*`); chrome rules (`@/editor/chrome-ui` only, `tw:` utilities not new CSS, `var(--bk-*)`, Gate 24, twMerge for flowbite overrides); `boards.json` written with `json.dump(indent=1, ensure_ascii=False)` + trailing newline, counts re-summed; rows carry `page: "3397:13062"`, `recipe: ""`, family `Settings · Clone`.

## Global Constraints

- **Target section:** `3397:32010` on page `3397:13062`. The leave-unsaved dialog the section references (`3737:43639`, "Leave Settings · Unsaved changes") lives in another section and is part of S1.
- **Export:** frame `3397:32144` is "REFERENCE · superseded by the Export modal" → the `export` nav item leaves Settings (S7 `639:2754` is already `unreachable`); row `superseded:board:clone-3397:32144`.
- **Overview:** `3397:32915` is a screen the code does not have — S1 builds it as the landing screen.
- **Backend chain (CLAUDE.md):** Page → tRPC → Router → Service → Prisma; shared/domain Zod in `packages/shared/schemas/`; services own DB access; no module-level clients; `../../` imports banned. Every `process.env.X` read added gets its row in the root CLAUDE.md env table in the same commit.
- **Migrations:** one migration per phase at most, named for the phase (`settings_s<N>_…`); reversible where possible; the delta doc lists the columns and the rollback.
- **Fixtures:** `packages/dashboard/prisma/seed-settings-clone.ts` (or the repo's existing seed entry) seeds the scratch workspace only, idempotent, and has a `--reset`; plan flips are two SQL statements recorded in the journeys doc and reverted before the phase report.
- **Copy:** on screen follows the frame (Q3a), except sample data (Q3e).
- **Not verified is written down:** a state that could not be forced is `driven` (tests only) or `blocked:external` on its row and in the journeys doc — never counted as walked.

---

## The phases

| phase | tabs | frames | count |
|---|---|---|---|
| **S1 Shell + SITE** | Overview · General · SEO · Custom code · nav · save bar · leave-unsaved | `3397:32915` Overview · `3397:32011` General + `3953:26363` loading + `3953:26503` load-error + `3950:26309` save-error · `3397:32076` SEO + `3953:26646` + `3953:26785` + `3951:26319` · `3397:32456` Custom code + `3953:49260` + `3953:49386` + `3951:26607` + `3397:32859` locked (Pro) · `3737:43639` leave dialog | 14 |
| **S2 DISTRIBUTION** | Domains · Analytics · Localization | `3397:32206` Domains + `3397:32985` loading + `3397:33034` empty + `3397:33085` load-error + `3397:33134` save-error + `3397:34402` remove-confirm + `3455:15509` removed · `3397:32295` Analytics + `3953:49515` + `3953:49670` + `3951:26455` + `3397:34148` validation · `3397:32376` Localization + `3397:33194` + `3397:33241` + `3397:33288` | 16 |
| **S3 PLUMBING-1** | Redirects · Headers | `3397:32517` Redirects + `3397:33479` loading + `3397:33526` empty + `3397:33573` load-error + `3397:33620` validation + `3951:26730` save-error + `3519:19920` / `3519:20096` About URL repair draft/saved + `3519:20272` / `3519:20448` Our story draft/saved · `3397:32602` Headers + `3397:33335` + `3397:33383` + `3397:33431` + `3397:34227` unsaved changes | 15 |
| **S4 PLUMBING-2** | Forms · Webhooks · Integrations | `3397:32678` Forms + `3397:33669` loading + `3397:33716` empty + `3397:33765` error + `3397:33812` action-error + `3397:33860` inbox-loading + `3397:33907` inbox-empty + `3397:34304` delete-submission-confirm + `3445:14050` Submission deleted · `3397:32769` Webhooks + `3397:33954` + `3397:34001` + `3397:34050` + `3397:34097` · `3397:34499` Integrations + `3951:49259` loading + `3951:49414` load-error | 17 |
| **S5 Odd ones** | Permissions · page-settings SEO · Branding pointer · Export | `3397:14146` Permissions (976×788) · `3397:38740` S3.7 page-settings SEO · `3397:32906` S7.2 Branding pointer (720×560) · `3397:32144` Export (record only) | 4 |

Total 66 frames + Export = 67 (+ `3737:43639`).

## Per-phase loop (same for S1–S5)

1. **Backend delta doc** `docs/design-jobs/CLONE-SETTINGS/phaseN-backend.md` — read the phase's shots + graph against the code and tRPC: for each frame, the fields / actions / states it draws, what the code has, what is missing (endpoint · schema · column · migration · seed row). Founder's "go" (Q3c). No code before it.
2. **Brief** `phaseN-brief.md` — the frames, the decided contradictions, the work split (files owned per agent), the contracts between agents, the testids the walk will drive.
3. **Agents** (Q7) in worktrees on the phase branch: `B` backend (server/, shared/schemas, prisma, dashboard tests), `E1..E3` editor screens. Each reports in the brief's format: screens with verdicts, contradictions decided, tests, not-done.
4. **Merge** (main): resolve, fold duplicates, run editor + dashboard suites, `tsc`, apply migrations locally, seed.
5. **Live walk** (main): every frame, states forced/seeded, side-by-side at 1440×900; each defect → failing test → fix → commit `J-<nodeId>`.
6. **Record**: `boards.json` rows (family `Settings · Clone`) + S7 rows superseded + `phaseN-journeys.md` + `verify:ds` + the phase report + the next phase's backend delta doc → stop.

## Step 0 (this session, before S1)

- [x] Plan doc (this file).
- [ ] Push `feat/assets-clone-p1` (pre-push hook runs `verify:ds`).
- [ ] `feat/settings-clone` from its HEAD.
- [ ] Shots: 68 (`scripts/figma/clone-shots.mjs docs/design-jobs/CLONE-SETTINGS/shots …`, resumable).
- [ ] Edge graph: `reactions-settings.json` (chunks of ~14 frames per `use_figma` call).
- [ ] Commit `docs/plans/2026-09-14-settings-clone.md` + `docs/design-jobs/CLONE-SETTINGS/{census.json,shots/,reactions-*.json}`.
- [ ] `phase1-backend.md` (S1's delta) → stop for the founder's "go".
