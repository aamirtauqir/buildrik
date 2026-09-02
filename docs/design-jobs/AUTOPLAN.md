# Autoplan — implement every editor board in the codebase

Founder goal, 2026-09-03: *"do not stop unless every board of the editor is
implemented in the code base … agar koi aisa scenario aa jaye ke codebase aur
design mein conflict ho, jaise codebase bohat zyada forward ho, tab aap ne ruk
jana hai, wahan par implement nahi karna, koi aur board dekh lena … main yeh
chahta hoon ke 80-90% implement ho jaye saare boards."*

## The two rules that decide everything

1. **Implement the board** where the code is behind or merely different.
2. **SKIP the board** where the code is AHEAD — more states, more affordances,
   a safer flow, a real capability the board omits. Do not remove working
   behaviour to match a drawing. Mark the job `skipped-code-ahead`, write one
   line of evidence saying what the code has that the board lacks, and take
   the next board. This is a founder ruling, not a judgment call per board.

## Done condition (observable, not claimed)

`done + verify` ÷ `implement scope` ≥ 85 %, where implement scope excludes
`unbuildable` (the product cannot produce the state) and `fix-figma` (the board
is wrong, not the code). At the start of this plan:

| | count |
|---|---|
| implement scope | 447 |
| done + verify (code applied or matching) | 351 (78.5 %) |
| work left (`fix` + `todo`) | 96 |
| skip (unbuildable + fix-figma) | 72 |

To 85 % → 28 more jobs. To 90 % → 51 more.

A job reaches `verify` when its code is applied, tests and gates are green, and
the change is pushed. It reaches `done` only on a live measurement.

## Roles

| role | writes | isolation |
|---|---|---|
| **Coordinator** (this session) | merges worktree branches, runs the suite, commits, pushes | main tree |
| **Implementer** ×N | code for its OWN families only | its own git worktree |
| **Verifier** ×2 | nothing — measures live, reports | read-only |
| **peer session** `packages-1d` | `docs/design-jobs/*` (single writer) | main tree |

Two Claude sessions share this repo. `jobs.json`, `LEDGER.jsonl` and
`BLOCKERS.md` have ONE writer between them; this session sends findings rather
than writing those files. That is the defect that cost a whole retraction cycle
on 2026-09-02.

## File ownership per implementer — disjoint by construction

| agent | families | owns |
|---|---|---|
| impl-media | Media, Media drill-ins | `sidebar/tabs/media/**`, `media/**` |
| impl-panels | Compare, Components, Modal, Issues | `sidebar/tabs/compare/**`, `components-catalog/**`, `shell/modals/**` |
| impl-editor | AI, History, Inspector, Layers | `sidebar/tabs/{ai,history}/**`, `inspector/**`, `panels/layers/**` |
| impl-flows | S1/S3/S5 flows, Shell states | `shell/**`, `canvas/**` |
| impl-nav | Insert, Pages, Templates, Brand | `sidebar/tabs/{insert,pages,templates}/**`, `design-system/**` |

`chrome-ui/**`, `themes/**`, `shared/**` and anything under `scripts/` are
**coordinator-only**. An implementer that needs a chrome-ui change writes the
request into its report; it does not edit the file. That keeps the shared
component library single-writer while five agents run.

## Per-job loop for an implementer

1. Read the job's evidence in `jobs.json` (numbers + file:line are already there
   for most; a `todo` job needs the board read first).
2. Read the board once via `scripts/baseline/figma-mcp.mjs`
   (`get_design_context`). The Figma seat is capped near 28 calls/hour — budget
   it, and if the cap trips, work the jobs whose evidence already carries the
   numbers.
3. Decide: behind → implement. Ahead → **skip**, one line of why.
4. Apply the change. Anchor every edit on an exact string; assert it matched.
5. `npx tsc --noEmit` + `npx vitest run <your dirs>` + `pnpm run verify:ds`.
   All three green or the change does not leave the worktree.
6. Report: job, verdict (`implemented` / `skipped-code-ahead` / `blocked`),
   file:line, and what a verifier should measure to confirm it.

## Gates that will bite (learned today)

- Gate 14 greps raw text for `28px`/`32px`/`320px` — use the token
  (`var(--bk-size-row)`, `var(--bk-size-row-dense)`) or a scale class.
- `gate:styling-ratchet` counts CSS lines per file: a fix must not grow the
  file. Fold declarations onto one line.
- Gate 13 caps panel-chrome radius at 4; the founder has since split the rule
  by surface, so read the current baseline before touching a radius.
- flowbite leaks `h-10` and, on `variant="link"`, used to leak weight 500. A
  same-property utility wins through twMerge; a different property loses.
- WCAG target-size floors every control at 24×24, so a text link is
  `tw:h-auto tw:min-h-6`, never `min-h-0`.

## Waves

**Wave 1 (now).** 5 implementers in worktrees + 2 verifiers on the live app.
Verifiers do not wait for the implementers: they measure the 351 jobs already
in `verify` and convert the ones that hold to `done`, which is where most of
the percentage actually comes from.

**Wave 2.** Coordinator merges each worktree branch in turn, runs the whole
suite, pushes. Re-launch implementers on what came back `blocked`.

**Wave 3.** Re-measure everything touched; report the honest percentage.
