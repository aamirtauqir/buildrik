# Buildrik v1 — Walk-and-Fix to Ship

**Date:** 2026-05-18
**Status:** Approved design. Implementation plan pending.
**Supersedes:** All 53 specs in `docs/superpowers/specs/` (to be archived Day 0).

---

## Goal

Builder product (dashboard + editor) ship-ready for the operator (self) to publish 1 real site end-to-end without crashing or losing data.

## Success criteria (the bar)

The following flow must execute cleanly:

1. Dashboard signup
2. Dashboard creates a site
3. "Open in editor" loads the editor with site data
4. Operator makes 5 edits
5. Operator clicks Publish
6. Live URL serves the published content
7. Revisit URL after editor close/reopen — changes persist

Zero `console.error` calls during walk. Zero crashes. Zero data loss. (React dev warnings and `console.warn` are not blockers — only `console.error` and uncaught exceptions.)

## Anti-goals

Out of scope for v1:

- Cosmetic bugs, slow load, mobile-broken layouts
- Webflow/Framer feature parity
- Multi-user / invite flow / collaboration
- Auth UX polish (login works = enough)
- Pixel-parity with prototype-v3 designs
- Continued ratcheting of CI gates (BLOCKING hook already shipped; runs in background)
- Any of the 53 archived spec ideas

---

## Day 0 — Archive and freeze (one-shot setup)

Before any walk iteration runs:

1. Archive specs:
   ```
   git mv docs/superpowers/specs/ docs/superpowers/archive-pre-v1/
   ```
   Memory ledger (`project_*.md` in `~/.claude/.../memory/`) untouched.

2. Freeze in-flight plans:
   - `TODOS.md` → `TODOS_PRE_V1.md`
   - `packages/editor/EDITOR_AUDIT_PLAN.md` → `EDITOR_AUDIT_PLAN_PRE_V1.md`
   - Create `V1_WALK_AND_FIX.md` at repo root — iteration log + sole source of truth for v1 work.

3. Add freeze policy to `CLAUDE.md`:
   ```
   ## V1 freeze policy

   Until v1 ships (see docs/v1-walk-and-fix-design.md):
   - No new specs.
   - No new audits.
   - No new tech-debt arcs.
   - Only items from V1_WALK_AND_FIX.md may be worked on.
   - Memory entries allowed (record what happened).
   - Violating the freeze = auto-reject.
   ```

4. Pause autonomous tech-debt loops. Pre-push BLOCKING hook handles regressions. Tech-debt arcs resume post-v1.

What stays active:

- Pre-push BLOCKING hook
- All currently-green CI gates
- Memory writing for v1 progress

If a v1 fix trips the pre-push hook: fix the gate violation as part of the same iteration. Do not bypass the hook. Do not ratchet new baselines — only resolve the specific violation the fix introduced.

---

## The loop

One iteration = walk → verify → fix → re-walk. Repeat until walk passes.

```
1. AGENT WALK (15-30 min)
   /qa skill drives the browser. Walks the locked script (below).
   Captures console errors, network errors, blank screens, crashes,
   data-loss moments.
   Appends a break list to V1_WALK_AND_FIX.md, severity-ranked.

2. USER VERIFY (10-20 min)
   Operator reviews list. Adds UX breaks the agent missed
   (mute features, confusing flow steps). Locks the #1 priority
   for this iteration.

3. AI FIX (max 1 calendar day)
   Fix only the #1 blocker — single concern per iteration.
   Codex pre-check ritual (see below) mandatory before edit.
   Single commit. Push immediately.

4. RE-WALK (auto)
   Agent re-runs same script.
   Verifies #1 fixed. Captures any regressions.
   If clean → next iteration with new #1.

LOOP UNTIL: walk completes full flow with zero crashes,
zero data loss, zero console errors.
```

### Locked walk script

Same script every iteration. Reproducibility beats coverage. Coverage expands post-v1.

```
1. dashboard signup with seeded test account `qa+v1@buildrik.test` (deterministic — reset DB row per iteration)
2. dashboard → create site "test-site-N" (N = iteration number)
3. click "Open in editor"
4. editor: add Section → add Heading → add Image (from media tab) → add Button → save
5. editor: Publish dropdown → publish to Vercel
6. wait for live URL → open in new tab → verify 4 elements visible
7. close editor → reopen → verify 4 elements still present
```

### Triage rules

| Severity | Definition | Loop action |
|---|---|---|
| P0 — crash | Console error breaks flow continuation | Stop. Fix this iteration. |
| P0 — data loss | User edit doesn't persist after save | Stop. Fix this iteration. |
| P1 — flow break | Step fails but workaround exists | Fix after all P0 drained. |
| P2 — cosmetic / slow | Looks bad, works | Out of v1 scope. Log to `V1_POST_DEFERRED.md`. |

---

## Codex pre-check (block prevention)

Memory shows codex blocks plans on 4 patterns. Each fix runs this 5-step ritual before any edit:

```
1. Identify the file(s) about to be edited.
2. grep consumers: who imports this? what calls this function?
3. Read 100 lines around the edit target in the live code.
4. List the tokens/types/APIs the fix relies on. Verify each EXISTS in live code.
5. If the change crosses packages: repeat 2-4 in each package.
6. Write a 5-line plan: "I will change X in Y because Z.
   Consumers A,B,C unaffected because reason."
7. Only then edit.
```

Cross-reference with memory:

| Codex block pattern | Pre-check step that prevents it |
|---|---|
| `feedback_axioms_against_code.md` — plan contradicts shipped tokens | Step 4 |
| `feedback_plan_must_grep_actual_code.md` — plan doesn't grep | Step 2 |
| `feedback_phase_prereq_check.md` — claims state without verify | Step 3 |
| `feedback_inventory_must_cross_packages.md` — multi-package miss | Step 5 |

### Enforcement

No new CI gate. Single CLAUDE.md rule:

```
## V1 fix protocol

Before any commit during V1 walk-and-fix:
1. Run the codex pre-check (5-step list).
2. Commit message footer must include:
   pre-check: grep ✓ / read ✓ / token-verified ✓
3. Missing footer = revert + redo.
```

Post-v1, validate whether this pattern dropped codex-block rate. If yes, promote to general rule. If no, replace with auto-invoke of the `/codex` skill pre-commit.

---

## Stop conditions

### Success (primary stop)

Walk script (above) completes:

- All 7 steps execute.
- Zero console errors during walk.
- Live URL persistence test passes.
- Re-walk of same iteration produces same result.

When this happens:

1. Declare v1 done.
2. Write `project_v1_shipped_<date>.md` memory entry.
3. Unfreeze tech-debt arcs.

### Iteration timebox

Each iteration: max 1 calendar day. If a fix takes longer:

- Iteration paused.
- Operator decides: continue / descope the blocker / change approach.
- Prevents a single fix from consuming weeks.

### Hard escalation triggers

| Trigger | Action |
|---|---|
| Same blocker appears in 3 consecutive walks despite "fix" commit | Stop. Architecture issue. Extended brainstorm needed. |
| Walk-list grows iteration-over-iteration (regressions > fixes) | Stop. Fix protocol broken. Audit codex pre-check usage. |
| 10 iterations done, walk still has P0 | Stop. Re-scope. Bar may be too high, or backlog has structural issues. |
| Vercel publish (step 5) blocked by infra (not code) | Stub steps 5-7 locally. Resume when infra unblocks. Don't let infra wait kill loop. |

### De-scope exits (last resort)

If after 10 iterations + escalation, the A bar is still unreachable:

- **D1:** Lower the bar (e.g., publish to local preview only). Ship that as v1.
- **D2:** Pick smaller scope (e.g., drop media tab from v1 walk). Re-walk.
- **D3:** Pause arc. Fundamental architecture rethink.

Explicit exits exist so the loop cannot run forever.

---

## Progress visibility

Each iteration appends to `V1_WALK_AND_FIX.md`:

```
## Iteration N — YYYY-MM-DD

- Walk: <pass/fail counts>
- P0 blocker fixed: <one-liner>
- Commit: <sha>
- Re-walk: <pass/fail>
- Next blocker: <one-liner>
```

Operator reads this file = full arc status at a glance. No second source.

---

## Why this design works

This is the 4th time the project has tried to reach a "v1 ready" state. Three prior attempts failed because:

1. Each attempt was a new spec, not a walk.
2. Specs were written from an assumed codebase state, not a verified one.
3. There was no stop condition.

This design directly addresses all three:

1. The walk replaces specs as the authoritative gap list.
2. The codex pre-check forces grep-before-write.
3. The 7-step walk script is the stop condition.

Past memory of plan churn: `feedback_inventory_before_architecture.md`,
`feedback_plan_must_grep_actual_code.md`,
`feedback_codex_iterate_until_clean.md`.
