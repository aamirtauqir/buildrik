# Parallel Claude Code Sessions — Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Operationalize the 2-session parallel workflow described in `docs/superpowers/specs/2026-05-21-parallel-claude-sessions-design.md`. Produces a working sandbox-a tree + 2 task queue files committed to main, ready to launch both Claude sessions immediately.

**Architecture:** Pure setup work — no application code changes. All tasks are filesystem ops (env copy, install), markdown file authoring (queue files), and git ops (commit, pull). The deliverable is process documentation that lives in the repo so any future session reading the repo knows the rules.

**Tech Stack:** Git worktrees (already created), pnpm workspaces, plain Markdown.

---

## File Structure

```
buildrik/
  TASKS_LANE_A.md                 ← created Task 2 (feature queue)
  TASKS_LANE_B.md                 ← created Task 3 (cleanup queue)

buildrik-sandbox-a/
  .env.local                      ← created Task 1.1 (copy from main)
  node_modules/                   ← populated Task 1.2 (pnpm install)
  (mirrors main tree on branch sandbox-a)
```

No application code touched. No tests added (process plan, not code). The queue files themselves are the verification surface — they version the workflow's state.

---

## Pre-flight check

Before starting, confirm prerequisites from spec are met:

- [ ] **Step 0.1: Verify worktrees exist**

Run:
```bash
cd ~/Desktop/pencil/buildrik && git worktree list
```

Expected output includes:
```
/Users/shahg/Desktop/pencil/buildrik                      <sha> [main]
/Users/shahg/Desktop/pencil/buildrik-sandbox-a            <sha> [sandbox-a]
```

If sandbox-a missing, abort plan and create it:
```bash
cd ~/Desktop/pencil/buildrik && git worktree add ../buildrik-sandbox-a -b sandbox-a
```

- [ ] **Step 0.2: Verify main tree is clean**

Run:
```bash
cd ~/Desktop/pencil/buildrik && git status --short
```

Expected: empty output (no dirty files). If dirty, commit or stash before proceeding (stash banned mid-execution per `feedback_no_stash_mid_execution`; commit instead).

- [ ] **Step 0.3: Verify on main branch**

Run:
```bash
cd ~/Desktop/pencil/buildrik && git branch --show-current
```

Expected: `main`

---

## Task 1: Bootstrap sandbox-a tree

**Files:**
- Create: `~/Desktop/pencil/buildrik-sandbox-a/.env.local`
- Populate: `~/Desktop/pencil/buildrik-sandbox-a/node_modules/`

- [ ] **Step 1.1: Copy .env.local from main tree to sandbox-a**

Run:
```bash
cp ~/Desktop/pencil/buildrik/.env.local ~/Desktop/pencil/buildrik-sandbox-a/.env.local
```

Verify:
```bash
ls -la ~/Desktop/pencil/buildrik-sandbox-a/.env.local
```

Expected: shows file with non-zero size. Files are gitignored — this is a manual sync.

- [ ] **Step 1.2: Install dependencies in sandbox-a**

Run:
```bash
cd ~/Desktop/pencil/buildrik-sandbox-a && pnpm install
```

Expected: pnpm completes without errors; `node_modules/` populates; `pnpm-lock.yaml` is unchanged (it was checked out from main).

Verify lockfile drift = zero:
```bash
cd ~/Desktop/pencil/buildrik && git diff sandbox-a -- pnpm-lock.yaml
```

Expected: empty output. If non-empty, abort — lockfile drifted at install (rare; would indicate a pnpm version mismatch).

- [ ] **Step 1.3: Smoke-test sandbox-a build**

Run:
```bash
cd ~/Desktop/pencil/buildrik-sandbox-a/packages/dashboard && pnpm build 2>&1 | tail -20
```

Expected: build succeeds (TS errors from pre-existing `seo/page.tsx:29` are acceptable per prior session notes; Turbopack compile succeeds).

If sandbox-a build fails for a reason other than the known seo/page.tsx error, investigate before continuing — this is the canary that proves sandbox-a is a working tree.

---

## Task 2: Create TASKS_LANE_A.md (feature queue)

**Files:**
- Create: `~/Desktop/pencil/buildrik/TASKS_LANE_A.md`

- [ ] **Step 2.1: Write the queue file**

Create file at `~/Desktop/pencil/buildrik/TASKS_LANE_A.md` with exact contents:

````markdown
# Lane A — Feature Queue (main tree)

**Owner:** Session 1
**Tree:** `~/Desktop/pencil/buildrik`
**Branch:** `main`
**Ports:** 3000 (dashboard) / 5050 (editor)
**Push target:** `origin/main` direct

## Rules

1. Read this file only. Never grab tasks from `TASKS_LANE_B.md`.
2. Pick the top Pending item, move it to In Progress (only one task at a time).
3. Ship to `main`, append to Done with the commit SHA.
4. If the queue is empty, stop and report. Do not pick from Lane B.
5. Before each task: `git fetch origin && git log origin/main --oneline -20`. If the task is already shipped, mark Done and skip.
6. You may modify any file including `MEMORY.md`, `package.json`, `pnpm-lock.yaml`, and prisma migrations.

## Pending

- [ ] [P1] **Phase 4 unification cleanup — gated on Vercel canary stable for 24hr**
  - Subtask 4.1: Delete `packages/dashboard/components/editor-route/unified-flag.server.ts` + `unified-flag.ts`'s legacy branch.
  - Subtask 4.2: Delete `UnifiedEditorFlagProvider`; simplify `EditorLink` to always use `/edit/...`.
  - Subtask 4.3: Remove `EDITOR_ORIGIN` env var + CORS allowlist from `packages/dashboard/next.config.mjs` (lines 34-41).
  - Subtask 4.4: Delete legacy editor Vercel project + DNS CNAME (user-side action via Vercel + Cloudflare/Namecheap dashboards — Lane A flags only).
  - Acceptance: `grep -r "EDITOR_ORIGIN\|NEXT_PUBLIC_UNIFIED_EDITOR\|localhost:5050" packages/dashboard/` returns zero results.

- [ ] [P2] **Sentry SDK wire for editor.cold_load_ms beacon** — gated on Sentry account creation
  - Replace `console.info(JSON.stringify(...))` in `packages/dashboard/components/editor-route/EditorClient.tsx:20-28` with `Sentry.captureMessage` or `Sentry.metrics.distribution`.
  - Acceptance: Vercel logs show structured Sentry event after editor mount.

- [ ] [P3] **Localization Phase 2 frontend** — subdir URL routing
  - Per memory `project_localization_decision_20260518` (`LOC: A,A` — subdirectory URLs + JSON column).
  - Backend Phase 1 already shipped per `project_autonomous_run_20260518`.
  - Acceptance: `/en/...` and `/es/...` routes resolve to same page with locale switched.

## In Progress

(only one task — blank means session is between tasks)

## Done (last 5)

- [x] Parallel sessions workflow spec (2026-05-21, `fb75249b`)
- [x] AliasResolver replacedBy rename bridge tests (2026-05-21, `76a3e5aa`)
- [x] CSP allow fonts.bunny.net in dashboard (2026-05-21, `f8060f6f`)
- [x] Vercel disconnect UX hint (2026-05-20, `e7c37308`)
- [x] Publish 403 → token-invalid + preserve PUBLISHED on republish fail (2026-05-20, `1e11d197`)
````

Verify:
```bash
ls -la ~/Desktop/pencil/buildrik/TASKS_LANE_A.md && head -20 ~/Desktop/pencil/buildrik/TASKS_LANE_A.md
```

Expected: file exists, contains header + Rules + Pending list.

---

## Task 3: Create TASKS_LANE_B.md (cleanup queue)

**Files:**
- Create: `~/Desktop/pencil/buildrik/TASKS_LANE_B.md`

- [ ] **Step 3.1: Write the queue file**

Create file at `~/Desktop/pencil/buildrik/TASKS_LANE_B.md` with exact contents:

````markdown
# Lane B — Cleanup Queue (sandbox-a tree)

**Owner:** Session 2
**Tree:** `~/Desktop/pencil/buildrik-sandbox-a`
**Branch:** `sandbox-a`
**Ports:** 3001 (dashboard) / 5051 (editor)
**Push target:** `origin/sandbox-a`
**Merge to main:** nightly squash by user (not by this session)

## Rules

1. Read this file only. Never grab tasks from `TASKS_LANE_A.md`.
2. Pick the top Pending item, move it to In Progress (only one task at a time).
3. Commit to `sandbox-a`, push to `origin/sandbox-a`, append to Done with the commit SHA.
4. If the queue is empty, stop and report. Do not pick from Lane A.
5. **You may NOT modify** `MEMORY.md` (its index), `package.json`, `pnpm-lock.yaml`, or run `prisma migrate`. If a task requires any of these, add a new task to `TASKS_LANE_A.md` and skip the original.
6. Before each work day: `git fetch origin && git rebase origin/main && pnpm test`. If rebase has conflicts, resolve manually then `git rebase --continue`. If tests fail post-rebase, halt and report.
7. Before each task: `git fetch origin` to stay current.
8. Cleanup-only scope. Allowed: TODOS drain, QA bug fixes, doc updates, test coverage, dead code removal, lint passes. **Forbidden:** new features, new abstractions, new domain models, architecture changes.

## Pending

- [ ] [P1] **AliasResolver test coverage — chain depth + edge cases**
  - Existing tests added 2026-05-21 cover `replacedBy` rename bridge.
  - Gap: chain depth-3 aliasOf, mixed replacedBy+aliasOf+replacedBy chains, `semanticKind` round-trip.
  - File: `packages/editor/src/engine/aliasResolver/__tests__/AliasResolver.test.ts`.
  - Acceptance: 5+ new test cases, all passing.

- [ ] [P2] **Hex literal drain — user-content path filter (Gate 10 ratchet)**
  - Per memory `project_hex_drain_20260518`: Gate 10 floor 823 dominated by user-content (templates, starters, wizard).
  - Add path-filter to scanner to exclude `templates/`, `starters/`, `wizard/`.
  - Acceptance: Gate 10 floor drops to chrome-only count; CI green.

- [ ] [P3] **Doc update — V1.1 closeout retrospective**
  - Per memory `project_v1_shipped_20260518` + Vercel OAuth shipped 2026-05-20.
  - Write retrospective markdown: what shipped, what dragged, what surprised.
  - Location: `docs/retrospectives/2026-05-v1-and-vercel-oauth.md`.
  - Acceptance: file committed, 200-500 words.

- [ ] [P3] **Dead code sweep — packages/editor/src/templates/**
  - Per memory `feedback_templatemanager_soft_deprecated`: legacy template manager soft-deprecated. Confirm zero consumers, delete files.
  - Acceptance: `grep -r "from.*templates/(MyTemplates|SaveTemplate|TemplateLibrary|TemplatePreview)" packages/editor/src/` returns zero results; files deleted.

## In Progress

(only one task — blank means session is between tasks)

## Done (last 5)

(blank — first day on sandbox-a)
````

Verify:
```bash
ls -la ~/Desktop/pencil/buildrik/TASKS_LANE_B.md && head -20 ~/Desktop/pencil/buildrik/TASKS_LANE_B.md
```

Expected: file exists, contains header + Rules + Pending list + write-restriction warning.

- [ ] **Step 3.2: Cross-check queues for overlap**

Run:
```bash
cd ~/Desktop/pencil/buildrik && diff <(grep -E "^- \[ \]" TASKS_LANE_A.md | sed 's/^- \[ \] //') <(grep -E "^- \[ \]" TASKS_LANE_B.md | sed 's/^- \[ \] //')
```

Expected: every line is unique (diff shows everything, no shared lines). No task should appear in both queues.

---

## Task 4: Commit queue files + sync to sandbox-a

**Files:**
- Commit: `TASKS_LANE_A.md` + `TASKS_LANE_B.md` (both on `main`)

- [ ] **Step 4.1: Stage + commit on main**

Run:
```bash
cd ~/Desktop/pencil/buildrik
git add TASKS_LANE_A.md TASKS_LANE_B.md
git commit -m "$(cat <<'EOF'
chore(workflow): add parallel session task queues

Two task queue files for the 2-lane parallel Claude Code workflow:
- TASKS_LANE_A.md → feature lane, main tree, direct-to-main commits
- TASKS_LANE_B.md → cleanup lane, sandbox-a tree, nightly squash to main

Each file is self-contained: header with tree/branch/ports/rules + Pending
list with priority tags + In Progress (single task) + Done log. Sessions
read only their own queue; user manually rebalances by moving lines.

See spec: docs/superpowers/specs/2026-05-21-parallel-claude-sessions-design.md

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Verify:
```bash
git log -1 --stat
```

Expected: commit shows 2 files added (TASKS_LANE_A.md, TASKS_LANE_B.md).

- [ ] **Step 4.2: Push to origin/main**

Run:
```bash
git push origin main
```

Expected: push succeeds. If push fails because remote ahead, run `git pull --rebase origin main && git push origin main`.

- [ ] **Step 4.3: Sync queue files into sandbox-a tree**

Run:
```bash
cd ~/Desktop/pencil/buildrik-sandbox-a
git fetch origin
git rebase origin/main
```

Expected: rebase succeeds; sandbox-a HEAD now equals main HEAD (which contains the new queue files).

Verify:
```bash
ls TASKS_LANE_A.md TASKS_LANE_B.md
```

Expected: both files present in sandbox-a tree.

---

## Task 5: Create session prompt cheat sheet

**Files:**
- Create: `docs/superpowers/runbooks/parallel-session-prompts.md`

- [ ] **Step 5.1: Create runbook directory if missing**

Run:
```bash
cd ~/Desktop/pencil/buildrik && mkdir -p docs/superpowers/runbooks
```

- [ ] **Step 5.2: Write the runbook**

Create file at `~/Desktop/pencil/buildrik/docs/superpowers/runbooks/parallel-session-prompts.md` with exact contents:

````markdown
# Parallel Session Prompts — Copy/Paste Cheat Sheet

Use these prompts verbatim when launching Claude in each terminal. See `docs/superpowers/specs/2026-05-21-parallel-claude-sessions-design.md` for the design rationale.

## Session 1 (Feature Lane)

Terminal directory: `~/Desktop/pencil/buildrik`

Launch prompt:

> You are Session 1 (Feature Lane) operating in the main tree on branch `main`. Read `TASKS_LANE_A.md`. Pick the top Pending task. Move it to In Progress. Ship it directly to `origin/main`. Append a Done row with the commit SHA. Repeat via `/loop` until queue is empty or you hit a blocker, then report. Use dev ports 3000 (dashboard) and 5050 (editor). You may modify any file including `MEMORY.md`, `package.json`, `pnpm-lock.yaml`, and prisma migrations. Before each task, run `git fetch origin && git log origin/main --oneline -20` to confirm task is not already shipped. Caveman mode terse responses.

## Session 2 (Cleanup Lane)

Terminal directory: `~/Desktop/pencil/buildrik-sandbox-a`

Launch prompt:

> You are Session 2 (Cleanup Lane) operating in the sandbox-a tree on branch `sandbox-a`. Read `TASKS_LANE_B.md`. Pick the top Pending task. Move it to In Progress. Commit to `sandbox-a` and push to `origin/sandbox-a`. Append a Done row with the commit SHA. Repeat via `/loop`. Use dev ports 3001 (dashboard) and 5051 (editor). **You may NOT modify `MEMORY.md`, `package.json`, `pnpm-lock.yaml`, or run prisma migrations.** If a task requires any of those, add a new task to `TASKS_LANE_A.md` and skip the original. Before each work day, run `git fetch origin && git rebase origin/main && pnpm test`. Before each task, run `git fetch origin` to stay current. Caveman mode terse responses.

## User actions (manual, not session-driven)

### Nightly squash-merge (Lane B → main)

Run at end of working day (~11pm):

```bash
cd ~/Desktop/pencil/buildrik
git fetch origin
git merge --squash sandbox-a
git commit -m "chore(cleanup): nightly batch YYYY-MM-DD — N tasks"
git push origin main

cd ~/Desktop/pencil/buildrik-sandbox-a
git fetch origin
git reset --hard origin/main
git push --force-with-lease origin sandbox-a
```

### Emergency cherry-pick (Lane B fix needed in main same-day)

```bash
cd ~/Desktop/pencil/buildrik
git cherry-pick <sandbox-commit-sha>
git push origin main
```

### After secret rotation in main `.env.local`

```bash
cp ~/Desktop/pencil/buildrik/.env.local ~/Desktop/pencil/buildrik-sandbox-a/.env.local
```

### Stop the workflow / rollback

```bash
# Squash remaining sandbox-a work into main
cd ~/Desktop/pencil/buildrik
git merge --squash sandbox-a && git commit -m "..." && git push

# Remove worktree
git worktree remove ../buildrik-sandbox-a
git branch -d sandbox-a
```
````

Verify:
```bash
ls ~/Desktop/pencil/buildrik/docs/superpowers/runbooks/parallel-session-prompts.md
```

Expected: file exists.

- [ ] **Step 5.3: Commit + push runbook**

Run:
```bash
cd ~/Desktop/pencil/buildrik
git add docs/superpowers/runbooks/parallel-session-prompts.md
git commit -m "$(cat <<'EOF'
docs(runbooks): parallel session launch prompts cheat sheet

Copy/paste prompts for launching Session 1 (feature lane) and Session 2
(cleanup lane), plus manual user actions for nightly squash-merge,
emergency cherry-pick, secret rotation sync, and rollback.

References spec docs/superpowers/specs/2026-05-21-parallel-claude-sessions-design.md.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push origin main
```

Expected: commit + push succeed.

---

## Task 6: Final verification

- [ ] **Step 6.1: Confirm all artifacts present on main**

Run:
```bash
cd ~/Desktop/pencil/buildrik && ls TASKS_LANE_A.md TASKS_LANE_B.md docs/superpowers/specs/2026-05-21-parallel-claude-sessions-design.md docs/superpowers/runbooks/parallel-session-prompts.md
```

Expected: all 4 files listed without error.

- [ ] **Step 6.2: Confirm sandbox-a tree synced**

Run:
```bash
cd ~/Desktop/pencil/buildrik-sandbox-a && ls TASKS_LANE_A.md TASKS_LANE_B.md && git log -1 --oneline
```

Expected: queue files present; HEAD matches main HEAD.

- [ ] **Step 6.3: Confirm sandbox-a has working deps**

Run:
```bash
cd ~/Desktop/pencil/buildrik-sandbox-a && pnpm test --reporter=dot 2>&1 | tail -5
```

Expected: tests run (pass or fail acceptable — just confirming pnpm + node_modules wired). If "command not found: pnpm" or "Cannot find module" errors, abort and revisit Task 1.

- [ ] **Step 6.4: Confirm queue overlap is zero**

Run:
```bash
cd ~/Desktop/pencil/buildrik && comm -12 <(grep -oE "\[P[123]\] \*\*[^*]+" TASKS_LANE_A.md | sort -u) <(grep -oE "\[P[123]\] \*\*[^*]+" TASKS_LANE_B.md | sort -u)
```

Expected: empty output (no shared task titles).

- [ ] **Step 6.5: Confirm worktree health**

Run:
```bash
cd ~/Desktop/pencil/buildrik && git worktree list
```

Expected: at minimum shows main + sandbox-a + inspector-hardening + sandbox-b (untouched).

---

## Done — ready to launch

After Task 6 passes, the parallel session infrastructure is ready. User can now:

1. Open Terminal 1 → `cd ~/Desktop/pencil/buildrik` → launch Claude → paste Session 1 prompt from `docs/superpowers/runbooks/parallel-session-prompts.md`.
2. Open Terminal 2 → `cd ~/Desktop/pencil/buildrik-sandbox-a` → launch Claude → paste Session 2 prompt.
3. Both sessions start working autonomously on their own queues.
4. At end of day, user runs nightly squash-merge command from runbook.

---

## Out-of-band actions (NOT part of this plan)

These are not steps to execute now — they are reminders for the workflow's lifecycle:

- **Phase 4 cleanup unblocks** when Vercel canary (`NEXT_PUBLIC_UNIFIED_EDITOR=true`) is stable on production for 24hr. Until then, Lane A's P1 task stays Pending.
- **Sentry wire unblocks** when user creates a Sentry account and provides the DSN. Until then, Lane A's P2 task stays Pending.
- **Queue rebalancing** happens manually whenever Lane A finishes early or a new arc opens. User moves task lines between TASKS_LANE_A.md ↔ TASKS_LANE_B.md and pushes to main; both sessions see the update on their next `git fetch`.
