# V1 Walk-and-Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute Day 0 archive/freeze actions from the V1 design + trigger the first walk iteration, leaving the project in a state where the walk-and-fix loop is operational.

**Architecture:** Three phases — (1) Day 0 file moves and CLAUDE.md edits that put 53 archived specs out of reach and add freeze policy + fix protocol rules; (2) verify the seeded QA account exists and the locked walk script is runnable end-to-end; (3) run the first walk via the `/qa` skill, log results to `V1_WALK_AND_FIX.md`, and stop for user to pick #1 blocker.

**Tech Stack:** git, Prisma (seed), bash, Edit/Write/Bash tools, `/qa` skill for browser automation, Next.js dashboard on port 3000, Vite editor on port 5050.

**Spec reference:** `docs/v1-walk-and-fix-design.md` (commit `7bbba5b5`).

---

## File Structure

Files this plan creates or modifies:

- **Move:** `docs/superpowers/specs/` → `docs/superpowers/archive-pre-v1/` (53 files, history preserved via `git mv`).
- **Move:** `TODOS.md` → `TODOS_PRE_V1.md` at repo root.
- **Move:** `packages/editor/EDITOR_AUDIT_PLAN.md` → `packages/editor/EDITOR_AUDIT_PLAN_PRE_V1.md`.
- **Create:** `V1_WALK_AND_FIX.md` at repo root — iteration log + sole source of truth for v1 work.
- **Modify:** `CLAUDE.md` (repo root) — add `## V1 freeze policy` and `## V1 fix protocol` sections.

No new code files. No engine changes. No package changes.

---

## Task 1: Archive 53 superseded specs

**Files:**
- Move: `docs/superpowers/specs/` → `docs/superpowers/archive-pre-v1/`

- [ ] **Step 1: Verify current spec count**

Run:
```
ls /Users/shahg/Desktop/pencil/buildrik/docs/superpowers/specs/ | wc -l
```

Expected output: `53` (or a number close to it; record the actual count).

- [ ] **Step 2: Move the folder via git mv**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && git mv docs/superpowers/specs docs/superpowers/archive-pre-v1
```

Expected: no output, exit code 0. `git status` shows renames.

- [ ] **Step 3: Verify rename + history preserved**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && git status --short | head -5 && ls docs/superpowers/archive-pre-v1/ | wc -l
```

Expected: first command shows `R  docs/superpowers/specs/... -> docs/superpowers/archive-pre-v1/...` lines. Second command shows same count as Step 1.

---

## Task 2: Rename TODOS.md and EDITOR_AUDIT_PLAN.md

**Files:**
- Move: `TODOS.md` → `TODOS_PRE_V1.md`
- Move: `packages/editor/EDITOR_AUDIT_PLAN.md` → `packages/editor/EDITOR_AUDIT_PLAN_PRE_V1.md`

- [ ] **Step 1: Move TODOS.md**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && git mv TODOS.md TODOS_PRE_V1.md
```

Expected: no output, exit code 0.

- [ ] **Step 2: Move editor audit plan**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && git mv packages/editor/EDITOR_AUDIT_PLAN.md packages/editor/EDITOR_AUDIT_PLAN_PRE_V1.md
```

Expected: no output, exit code 0.

- [ ] **Step 3: Verify both renames staged**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && git status --short | grep -E "(TODOS|EDITOR_AUDIT)"
```

Expected output (exact):
```
R  TODOS.md -> TODOS_PRE_V1.md
R  packages/editor/EDITOR_AUDIT_PLAN.md -> packages/editor/EDITOR_AUDIT_PLAN_PRE_V1.md
```

---

## Task 3: Create V1_WALK_AND_FIX.md skeleton

**Files:**
- Create: `V1_WALK_AND_FIX.md` (repo root)

- [ ] **Step 1: Write the skeleton file**

Use the Write tool to create `/Users/shahg/Desktop/pencil/buildrik/V1_WALK_AND_FIX.md` with this exact content:

```markdown
# V1 Walk-and-Fix — Iteration Log

**Spec:** `docs/v1-walk-and-fix-design.md`
**Status:** Loop active. Day 0 setup complete.

## Locked walk script

```
1. dashboard login: qa@buildrik.local / qa-test-1234 (seeded via prisma/seed.ts)
2. dashboard → create site "test-site-N" (N = iteration number)
3. click "Open in editor"
4. editor: add Section → add Heading → add Image (from media tab) → add Button → save
5. editor: Publish dropdown → publish to Vercel
6. wait for live URL → open in new tab → verify 4 elements visible
7. close editor → reopen → verify 4 elements still present
```

## Triage rules

| Severity | Definition | Loop action |
|---|---|---|
| P0 — crash | console.error or uncaught exception breaks flow | Stop. Fix this iteration. |
| P0 — data loss | User edit doesn't persist after save | Stop. Fix this iteration. |
| P1 — flow break | Step fails but workaround exists | Fix after all P0 drained. |
| P2 — cosmetic / slow | Looks bad, works | Log to V1_POST_DEFERRED.md. Out of v1 scope. |

## Iterations

(Iteration entries appended below, newest at bottom.)
```

- [ ] **Step 2: Verify file created**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && wc -l V1_WALK_AND_FIX.md && git status --short V1_WALK_AND_FIX.md
```

Expected: ~28 lines, status shows `?? V1_WALK_AND_FIX.md` (untracked).

- [ ] **Step 3: Stage the file**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && git add V1_WALK_AND_FIX.md
```

Expected: no output, exit code 0.

---

## Task 4: Add V1 freeze policy + fix protocol to root CLAUDE.md

**Files:**
- Modify: `/Users/shahg/Desktop/pencil/buildrik/CLAUDE.md` — insert two new sections before `## Skill routing` (currently at line 127).

- [ ] **Step 1: Verify anchor line**

Run:
```
grep -n "## Skill routing" /Users/shahg/Desktop/pencil/buildrik/CLAUDE.md
```

Expected: prints exactly one line with line number (was `127` at plan-write time; verify still single match).

- [ ] **Step 2: Use Edit tool to insert sections before the anchor**

Use the Edit tool on `/Users/shahg/Desktop/pencil/buildrik/CLAUDE.md`:

`old_string`:
```
## Skill routing
```

`new_string`:
```
## V1 freeze policy

Until v1 ships (see `docs/v1-walk-and-fix-design.md`):

- No new specs.
- No new audits.
- No new tech-debt arcs.
- Only items from `V1_WALK_AND_FIX.md` may be worked on.
- Memory entries allowed (record what happened).
- Violating the freeze = auto-reject.

## V1 fix protocol

Before any commit during V1 walk-and-fix:

1. Run the codex pre-check (5-step list in `docs/v1-walk-and-fix-design.md`).
2. Commit message footer must include: `pre-check: grep ✓ / read ✓ / token-verified ✓`
3. Missing footer = revert + redo.

## Skill routing
```

(Note: `replace_all` defaults to false. The string `## Skill routing` appears only once in this file, so the Edit will be unambiguous.)

- [ ] **Step 3: Verify both sections inserted exactly once**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && grep -c "## V1 freeze policy" CLAUDE.md && grep -c "## V1 fix protocol" CLAUDE.md && grep -c "## Skill routing" CLAUDE.md
```

Expected output (each on own line):
```
1
1
1
```

If any returns `0` or `2+`, revert the edit and redo.

---

## Task 5: Commit Day 0 setup

**Files:**
- All staged changes from Tasks 1-4.

- [ ] **Step 1: Review what will commit**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && git status --short | head -20
```

Expected: renames for specs (53 lines), TODOS rename, EDITOR_AUDIT_PLAN rename, new V1_WALK_AND_FIX.md, modified CLAUDE.md.

- [ ] **Step 2: Commit**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && git commit -m "$(cat <<'EOF'
chore: V1 Day 0 — archive 53 specs, freeze pre-v1 TODOs, add V1 policy

- docs/superpowers/specs/ → archive-pre-v1/ (53 files, history preserved)
- TODOS.md → TODOS_PRE_V1.md (628-line narrative log frozen)
- packages/editor/EDITOR_AUDIT_PLAN.md → EDITOR_AUDIT_PLAN_PRE_V1.md
- New V1_WALK_AND_FIX.md at repo root — iteration log SSOT
- CLAUDE.md: V1 freeze policy + V1 fix protocol sections added

Spec: docs/v1-walk-and-fix-design.md (7bbba5b5)
Pre-v1 work continues to be referenceable via *_PRE_V1.md + archive-pre-v1/.

pre-check: grep ✓ / read ✓ / token-verified ✓

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds. Pre-push hook does not run (commit, not push).

- [ ] **Step 3: Verify clean working tree**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && git status
```

Expected: `nothing to commit, working tree clean`. Branch ahead of origin by 2 commits (this commit + the earlier design-doc commit).

---

## Task 6: Verify seeded QA account exists in dashboard DB

**Files:**
- Reference: `prisma/seed.ts` (seeds `qa@buildrik.local`)

- [ ] **Step 1: Check if dashboard dev server is running**

Run:
```
lsof -i :3000 | grep LISTEN || echo "not running"
```

Expected: either Node process listed, or `not running`.

- [ ] **Step 2: If not running, start dashboard**

If Step 1 said `not running`, in a new terminal:
```
cd /Users/shahg/Desktop/pencil/buildrik/packages/dashboard && npm run dev
```

Wait for `Ready in <Xs>` log line. Do NOT run this with `run_in_background` from the plan executor — it must stay foreground in user terminal so the walk agent can hit it.

- [ ] **Step 3: Run seed script**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && npx prisma db seed
```

Expected output ends with: `Seeded user qa@buildrik.local / qa-test-1234`.

If the seed fails because `prisma db seed` is not configured: run directly with `npx tsx prisma/seed.ts`.

- [ ] **Step 4: Smoke-test login via dashboard UI**

Open `http://localhost:3000/login` in a browser. Sign in with:
- email: `qa@buildrik.local`
- password: `qa-test-1234`

Expected: redirects to dashboard home with at least an empty sites list visible. If login fails, the seed didn't take — re-run Step 3.

---

## Task 7: Verify editor dev server reachable

**Files:**
- Reference: `packages/editor/CLAUDE.md` — editor runs on port 5050 via `npm run dev` in `packages/editor/`.

- [ ] **Step 1: Check if editor dev server is running**

Run:
```
lsof -i :5050 | grep LISTEN || echo "not running"
```

Expected: either Node process listed, or `not running`.

- [ ] **Step 2: If not running, start editor**

If Step 1 said `not running`, in a new terminal:
```
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npm run dev
```

Wait for Vite ready log line (`Local: http://localhost:5050/`). Do NOT background.

- [ ] **Step 3: Smoke-test editor loads**

Open `http://localhost:5050/?siteId=test` in a browser.

Expected: editor shell renders. May show "site not found" or empty canvas — that is fine for this task. Zero console errors during load is the success bar.

Open DevTools console. If there are `console.error` calls during initial load before any user interaction, log them to `V1_WALK_AND_FIX.md` under a pre-walk note — these are P0 by definition and need to be fixed before the walk can even start.

---

## Task 8: Run first walk via /qa skill and append output to V1_WALK_AND_FIX.md

**Files:**
- Append to: `V1_WALK_AND_FIX.md`

- [ ] **Step 1: Invoke the /qa skill with the locked walk script**

In the conversation (not via Bash), invoke the `/qa` skill with this exact instruction:

```
Run the V1 walk script from V1_WALK_AND_FIX.md. Use the seeded account
qa@buildrik.local / qa-test-1234. Walk all 7 steps. For each step,
capture: pass/fail, any console.error or uncaught exception (verbatim),
any network 4xx/5xx, any blank screens, and any data-loss moments
(edits that disappear after save). Do NOT fix anything. Do NOT change
any code. Output a structured break list with severity (P0/P1/P2 per
the triage rules in V1_WALK_AND_FIX.md).
```

Expected: agent runs through the 7 steps in a browser, returns a structured break list.

- [ ] **Step 2: Append agent output to V1_WALK_AND_FIX.md**

Use the Edit tool on `/Users/shahg/Desktop/pencil/buildrik/V1_WALK_AND_FIX.md`.

`old_string`:
```
## Iterations

(Iteration entries appended below, newest at bottom.)
```

`new_string` (replace `<DATE>` with today's date, `<COUNTS>` with actual counts from agent output, `<P0_LIST>` with the agent's P0 items verbatim, `<P1_LIST>` and `<P2_LIST>` similarly):
```
## Iterations

(Iteration entries appended below, newest at bottom.)

## Iteration 1 — <DATE>

- Walk: <COUNTS> (e.g., "5/7 steps passed; step 3 and step 5 failed")
- P0 blockers:
  <P0_LIST>
- P1 issues:
  <P1_LIST>
- P2 (deferred to V1_POST_DEFERRED.md):
  <P2_LIST>
- Commit: (none yet — fix not started)
- Re-walk: (pending fix)
- Next blocker: (user to pick from P0 list above)
```

- [ ] **Step 3: Stage and commit the iteration log update**

Run:
```
cd /Users/shahg/Desktop/pencil/buildrik && git add V1_WALK_AND_FIX.md && git commit -m "$(cat <<'EOF'
chore(v1): iteration 1 walk results

First walk run via /qa skill against locked 7-step script.
Break list logged in V1_WALK_AND_FIX.md. Awaiting user to pick #1 P0
blocker for first fix.

pre-check: grep ✓ / read ✓ / token-verified ✓

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds. Working tree clean.

- [ ] **Step 4: Stop. Report to user.**

Report to the user:

- "Day 0 archive + freeze complete (commit `<sha-task-5>`)."
- "Iteration 1 walk complete (commit `<sha-task-8>`)."
- "N P0 blockers found." (Insert actual N.)
- "Top P0 candidates:" (List the first 3 P0 items from the agent output.)
- "Which one should be Iteration 1's fix?"

Wait for user to pick. Do NOT proceed to fix without explicit choice. Per the spec stop conditions, the next iteration's fix is gated on user verification.

---

## Self-Review

Spec coverage check against `docs/v1-walk-and-fix-design.md`:

| Spec section | Plan task |
|---|---|
| Goal + success criteria (Section 1) | Tasks 6-8 set up the seeded account and execute the walk that validates the bar. |
| Day 0 archive specs (Section 2.1) | Task 1 |
| Day 0 freeze TODOs (Section 2.2) | Task 2 |
| Day 0 create V1_WALK_AND_FIX.md (Section 2.2) | Task 3 |
| Day 0 add freeze policy to CLAUDE.md (Section 2.3) | Task 4 |
| Day 0 fix protocol in CLAUDE.md (Section 4 enforcement) | Task 4 (combined with freeze policy in same edit) |
| Day 0 pause autonomous tech-debt loops (Section 2.4) | Implicit — Tasks 1-5 create the freeze; no separate task needed because there is no autonomous loop currently running. |
| Loop walk step (Section 3.1) | Task 8 step 1 |
| Loop user verify step (Section 3.2) | Task 8 step 4 (stop and report) |
| Loop fix step (Section 3.3) | Out of scope for THIS plan — fix happens in next iteration's adhoc plan; spec Section 3 is the recipe. |
| Codex pre-check (Section 4) | Task 4 adds it to CLAUDE.md; first usage in Task 5 + Task 8 commit footers. |
| Stop conditions (Section 5) | Documented in spec; not executable until later iterations. |

Gaps: none for the Day 0 + Iteration 1 walk scope.

Placeholder scan: No "TBD", "TODO", "implement later" in any task. All file paths absolute. All commands runnable as-is. The `<DATE>` / `<COUNTS>` / `<P0_LIST>` placeholders in Task 8 step 2 are explicit fill-in-from-real-output markers, not unspecified work.

Type consistency: file paths, account credentials, commit-footer text, and walk-script step ordering match across all tasks and the spec.

---

## After this plan completes

Working state:
- 53 specs archived under `docs/superpowers/archive-pre-v1/`.
- `TODOS_PRE_V1.md` + `EDITOR_AUDIT_PLAN_PRE_V1.md` frozen.
- `V1_WALK_AND_FIX.md` is the SSOT for v1 work, with Iteration 1 walk results logged.
- `CLAUDE.md` carries the V1 freeze policy + V1 fix protocol — every future commit in this arc must respect both.
- Awaiting user pick of Iteration 1's #1 P0 blocker.

Next: the user picks the blocker, the spec's loop kicks in for Iteration 1's fix step (codex pre-check → minimal fix → commit with pre-check footer → re-walk). No new plan needed per iteration — the spec is the recipe; each iteration appends to `V1_WALK_AND_FIX.md`.
