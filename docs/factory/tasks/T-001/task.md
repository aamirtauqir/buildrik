# T-001 — Editor CLAUDE.md says production env lives in Vercel; production is cPanel

<!-- Ledger. Only the PM (main session) edits this file. -->

- **Status:** ready-to-merge
- **Stage owner:** PM (merge after CI)
- **Created:** 2026-10-15
- **Founder issue (verbatim):** "(factory pilot, from the 2026-10-15 readiness audit) packages/editor/CLAUDE.md §ENV says prod values live in 'Vercel project settings'; prod is cPanel."
- **Guarded areas touched:** none
- **UI change:** no
- **Branch / PR:** factory/T-001 · https://github.com/aamirtauqir/buildrik/pull/31

## Goal

Agents reading packages/editor/CLAUDE.md are told the true place production env vars are set.

## Done-condition

- [x] `grep -n -i "vercel project settings" packages/editor/CLAUDE.md` → no output (exit 1)
- [x] `sed -n 511,520p packages/editor/CLAUDE.md` → names cPanel, references root CLAUDE.md "Where the values live", mentions NEXT_PUBLIC_* baked at build
- [x] `git diff --stat main` → only packages/editor/CLAUDE.md (plus task docs); only the ~:513-515 paragraph
- [x] `pnpm run audit:rules` → no new finding for packages/editor/CLAUDE.md
- [x] Old behaviour: ENV table, Notes and every other section byte-identical

## Stage log

| # | Stage | Agent | Verdict | Evidence (file / command / URL) | Date |
|---|---|---|---|---|---|
| 1 | spec | factory-analyst | READY (reproduced: n/a, open questions: 0, 2 follow-ups) | spec.md | 2026-10-15 |
| 2 | build | factory-developer | BLOCKED — commit 4660acf3e on factory/T-001 not pushed; pre-push hook `editor=0 dashboard=0 figma=0 orphans=0 spec-age=1 button-variants=0`; all 5 done-condition checks PASS locally | worktree .claude/worktrees/agent-ab748a6868414a496 | 2026-10-15 |
| 3 | push + PR | PM (interactive) | pushed with the spec-age-only bypass after re-running the hook in the dev worktree (`editor=0 dashboard=0 figma=0 orphans=0 spec-age=1 button-variants=0`); PR opened | https://github.com/aamirtauqir/buildrik/pull/31 | 2026-10-15 |
| 4 | qa | factory-qa | PASS — 5/5 done-condition lines + root CLAUDE.md consistency; audit:rules controlled against clean main (same pre-existing CLAUDE.md:169 finding, only :648→:652 shift) | factory/T-001 @ 4660acf3e, inline report | 2026-10-15 |
| 5 | review | factory-code-reviewer | APPROVE — 0 blocking, 2 non-blocking: (1) section now self-contradicts: heading/first sentence/table still say VITE_ (table tells prod to set VITE_FEATURE_PUBLISH, which the shipping bundle never reads); (2) runtimeEnv.ts:13-15 VITE_ wins over NEXT_PUBLIC_ during SSR — note, not verified as a defect | PR 31 @ 4660acf3e | 2026-10-15 |

## Founder decisions

- 2026-10-15 spec approved: "Approve, run the pipeline" (follow-ups stay out of scope).
- 2026-10-15 founder asked for the full team workflow to be built and piloted ("complate workflow banoo pori team rakhoo is project ka lia").

## Open questions

- Resolved 2026-10-15: the headless PM could not push (in a non-interactive session the guard's ask tier acts as deny). The interactive PM pushed under the founder's standing spec-age-only approval.
- Follow-up (raised by analyst, reinforced by reviewer — now urgent): editor CLAUDE.md §ENV heading, first sentence and table still say VITE_ for production. Candidate T-002.
- Follow-ups proposed by analyst, not in scope: editor CLAUDE.md:513 `VITE_`-only prefix claim; :521 "once Vercel pipeline live".
