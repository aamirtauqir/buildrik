# Parallel Claude Code Sessions — Workflow Design

**Status:** Spec approved 2026-05-21. Pending plan + first-day trial.

**Goal:** Run 2 concurrent Claude Code sessions in this monorepo, each picking tasks from its own queue, working in its own git worktree, without colliding on shared resources. Throughput up, supervision down, conflicts near zero.

**Out of scope:**
- 3+ concurrent sessions (defer until 2-lane pattern is proven for ≥ 1 week).
- Cross-session real-time chat / IPC (sessions communicate via committed files only).
- Auto-merge tooling (nightly merge stays manual — human gate keeps history clean).
- Replacing existing `buildrik-inspector-hardening` worktree (separate active arc, untouched).

## Locked decisions (from brainstorm 2026-05-21)

| Decision | Choice | Rationale |
|---|---|---|
| Concurrency | **2 sessions** | Proven pattern (`feedback_parallel_agent_convergence_20260511`); 3+ multiplies coordination cost |
| Lane split | **Feature lane (A) + Cleanup lane (B)** | Different file footprints → minimal merge conflict; matches V1 freeze policy where cleanup is allowed but features are gated |
| Coordination model | **Fully autonomous `/loop` per session** | User-stated preference; both sessions self-pace from their queues; user supervises by reading logs, not by stepping in |
| Task queue | **Pre-split: `TASKS_LANE_A.md` + `TASKS_LANE_B.md`** | Zero overlap by construction; user rebalances by moving lines between files |
| Branches | **Lane A → `main` direct; Lane B → `sandbox-a` branch** | Lane A's solo-direct-to-main matches existing workflow; Lane B isolates riskier cleanup with a daily merge gate |
| Lane B → main | **Nightly squash-merge, manual** | Daily noise consolidated into one commit; user reviews summary before merge |
| MEMORY.md writes | **Lane A only** | Single writer prevents merge corruption on a 24.7KB hot file |
| package.json / migrations | **Lane A only** | Lockfile + DB are global resources; one writer prevents race |
| Dev server ports | **Hardcoded per lane (3000/5050 vs 3001/5051)** | Both can run dev servers simultaneously |
| `.env.local` | **Manual copy per tree on rotation** | Gitignored; no automation worth building |

---

## Architecture

```
                              ORIGIN (GitHub)
                                    ▲
                                    │ git push / fetch
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        │                                                       │
   Lane A (main)                                          Lane B (sandbox-a)
        │                                                       │
   Tree: ~/Desktop/pencil/buildrik/                  Tree: ~/Desktop/pencil/buildrik-sandbox-a/
   Branch: main                                      Branch: sandbox-a
   Queue: TASKS_LANE_A.md                            Queue: TASKS_LANE_B.md
   Port: 3000 (dashboard) / 5050 (editor)            Port: 3001 / 5051
   Role: FEATURE LANE                                Role: CLEANUP LANE
   Push: direct to origin/main per task              Push: to origin/sandbox-a per task
        │                                                       │
        │                                                       │
        ▼                                                       │
   Session 1 (Terminal 1)                                       │
   Claude /loop reading TASKS_LANE_A.md                         │
        │                                                       │
        │                                                       ▼
        │                                              Session 2 (Terminal 2)
        │                                              Claude /loop reading TASKS_LANE_B.md
        │                                                       │
        └──────── nightly squash-merge (manual, user) ◄─────────┘
                  squash sandbox-a → main, reset sandbox-a
```

---

## Tree ↔ Session mapping

```
Session 1 (Terminal 1)              Session 2 (Terminal 2)
─────────────────────              ─────────────────────
Tree:    buildrik/                  Tree:    buildrik-sandbox-a/
Branch:  main                       Branch:  sandbox-a
Queue:   TASKS_LANE_A.md            Queue:   TASKS_LANE_B.md
Port:    3000 / 5050                Port:    3001 / 5051
Role:    FEATURE LANE               Role:    CLEANUP LANE
Push:    direct origin/main         Push:    origin/sandbox-a
                                    Merge:   nightly squash → main
```

The existing `buildrik-inspector-hardening` worktree is untouched. `buildrik-sandbox-b` reserved for a future third lane.

---

## Task queue files

### `TASKS_LANE_A.md` (feature lane — repo root)

```markdown
# Lane A — Feature Queue (main tree)
Owner: Session 1
Tree: ~/Desktop/pencil/buildrik
Branch: main
Port: 3000 (dashboard) / 5050 (editor)

Rules:
1. Read this file only. Never grab from TASKS_LANE_B.md.
2. Pick top Pending item, move to In Progress (only one at a time).
3. Ship to main, append to Done with commit SHA.
4. If queue empty, stop and report.

## Pending
- [ ] [P1] <task description>
- [ ] [P2] ...

## In Progress
(only one task; blank means session is between tasks)

## Done (last 5)
- [x] <task summary> (YYYY-MM-DD, <sha>)
```

### `TASKS_LANE_B.md` (cleanup lane — repo root)

Identical structure, with header pointing to sandbox-a tree, port 3001/5051, branch sandbox-a. Lane B task scope is cleanup-only: TODOS drain, QA bug fixes, doc updates, test coverage, dead code removal. **No architecture changes, no new features.**

Both files version-controlled. Both sessions pull updates via `git fetch && git pull` at task transitions.

---

## Shared-resource rules

### `.env.local` (gitignored)

Manual copy from main tree to each new worktree on creation and after every secret rotation:

```bash
cp ~/Desktop/pencil/buildrik/.env.local ~/Desktop/pencil/buildrik-sandbox-a/.env.local
```

No automation — secrets shouldn't be sync'd via tooling.

### `MEMORY.md` (hot file, already at 24.7KB)

**Only Session 1 writes the MEMORY.md index.** Session 2 may create new memory topic files in the `memory/` directory but must NOT edit `MEMORY.md`. If Session 2 produces a memory-worthy event, it appends a one-line note to its current task in `TASKS_LANE_B.md`; Session 1 batches index updates during its next idle moment.

Verification: `git log -1 --format="%an %s" memory/MEMORY.md` should always show Session 1 commits.

### `package.json` + `pnpm-lock.yaml`

Only Lane A modifies dependencies. If Lane B's task needs a new dep, Session 2 opens a new task in TASKS_LANE_A.md (e.g., `[P1] add dep "foo"`) and skips the original cleanup task until that lands.

Verification: `git diff main sandbox-a -- pnpm-lock.yaml package.json` should always be empty before nightly merge.

### Database (Postgres)

Both sessions hit the same `DATABASE_URL`. Migrations are global → only Lane A runs `pnpm prisma migrate`. Session 2 reads schema, never migrates.

### Dev server ports

| Service | Lane A | Lane B |
|---|---|---|
| Dashboard (Next.js) | 3000 | 3001 |
| Editor (Vite) | 5050 | 5051 |
| Prisma Studio | 5555 | 5556 |

Hardcoded in each session's prompt; declared in each lane's queue header.

### Build cache

`.next/`, `.turbo/`, `node_modules/` — per-tree, no collision. No special handling needed.

### Git operations

Lane B does `git fetch origin` (not `git pull origin main`). Daily morning rebase: `git rebase origin/main`. Never during an active task.

### Reads vs writes

Both sessions read everything freely. Write restrictions apply only to MEMORY.md, package.json, pnpm-lock.yaml, and prisma migrations (all Lane-A-only).

---

## Merge cadence

### Lane A → main (real-time, per task)

```bash
git add . && git commit -m "..."
git push origin main
```

Frequency: 1-3 commits/hour during active work.

### Lane B → main (nightly squash, manual by user)

Once per day (suggested: end of working day, ~11pm):

```bash
cd ~/Desktop/pencil/buildrik
git fetch origin
git merge --squash sandbox-a
git commit -m "chore(cleanup): nightly batch YYYY-MM-DD — N tasks

- Task A summary
- Task B summary
- ...

Squashed from sandbox-a (commits <first>..<last>).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin main

# Reset sandbox-a to fresh main
cd ~/Desktop/pencil/buildrik-sandbox-a
git fetch origin
git reset --hard origin/main
git push --force-with-lease origin sandbox-a
```

### Lane B rebase from main (daily morning, by Session 2)

```bash
cd ~/Desktop/pencil/buildrik-sandbox-a
git fetch origin
git rebase origin/main
# if conflict: resolve, then `git rebase --continue`
# always run `pnpm test` after rebase before claiming next task
```

### Emergency Lane B → main (skip nightly)

If Lane B fixes a critical bug needed in main same-day:

```bash
cd ~/Desktop/pencil/buildrik
git cherry-pick <sandbox-commit-sha>
git push origin main
```

The nightly squash auto-dedupes cherry-picked commits.

### Cadence summary

| Action | Frequency | Who |
|---|---|---|
| Lane A commit + push | per task | Session 1 (autonomous) |
| Lane B commit | per task | Session 2 (autonomous) |
| Lane B → main squash | nightly | User (manual) |
| Lane B rebase from main | morning | Session 2 (autonomous, ritualized) |
| Emergency cherry-pick | as needed | User (manual) |

**Why merges stay manual:** Squash-vs-merge and conflict-resolution are decisions. Session 2 cannot judge whether 8 sandbox commits belong in one squash or two. Human gate keeps `main` history clean.

---

## Pitfall list

| ID | Pitfall | Severity | Likelihood | Mitigation |
|---|---|---|---|---|
| 5.1 | Same task in both queues | High | Low | Pre-split prevents; daily `diff TASKS_LANE_A.md TASKS_LANE_B.md` |
| 5.2 | Force-push wipes main | Critical | Low | NEVER `--force` on main; `--force-with-lease` only on sandbox-a |
| 5.3 | MEMORY.md race | High | Medium | Section 3.2 rule: Session 2 read-only on MEMORY.md |
| 5.4 | Lockfile race | Medium | Low | Section 3.3 rule: Session 2 no package.json edits |
| 5.5 | Dev server port collision | Low | Medium | Hardcoded ports per lane; declared in queue headers |
| 5.6 | Rebase silent regression | Medium | Medium | `pnpm test` after every rebase before next task |
| 5.7 | `.env.local` drift | Low | Low | Manual copy on rotation; reminder in this spec |
| 5.8 | Architecture drift between lanes | Critical | Low | Architecture decisions Lane A only; cleanup lane never makes design changes |
| 5.9 | Convergence shipping (both ship X) | Medium | Medium | Both sessions `git fetch origin && git log origin/main --oneline -20` before claiming task |
| 5.10 | Worktree corruption | Low | Low | Always `git worktree remove` (not `rm -rf`); `git worktree prune` to clean stale |

**Critical pitfalls (5.2, 5.8) require zero-tolerance discipline:**
- Force-push to main has no recovery without git acrobatics + reflog hunting.
- Architecture decisions made in Lane B get squashed into a nightly commit with stale context — undoing them later requires a manual revert and a follow-up discussion.

---

## Session prompts (operational)

When starting Session 1 in `~/Desktop/pencil/buildrik`:

> You are Session 1 (Feature Lane) operating in the main tree on branch `main`. Read `TASKS_LANE_A.md`. Pick the top Pending task. Move it to In Progress. Ship it directly to `origin/main`. Append a Done row with the commit SHA. Repeat via `/loop` until queue is empty or you hit a blocker, then report. Use dev ports 3000 (dashboard) and 5050 (editor). You may modify any file including `MEMORY.md`, `package.json`, `pnpm-lock.yaml`, and prisma migrations. Before each task, run `git fetch origin && git log origin/main --oneline -20` to confirm task is not already shipped.

When starting Session 2 in `~/Desktop/pencil/buildrik-sandbox-a`:

> You are Session 2 (Cleanup Lane) operating in the sandbox-a tree on branch `sandbox-a`. Read `TASKS_LANE_B.md`. Pick the top Pending task. Move it to In Progress. Commit to `sandbox-a` and push to `origin/sandbox-a`. Append a Done row with the commit SHA. Repeat via `/loop`. Use dev ports 3001 (dashboard) and 5051 (editor). **You may NOT modify `MEMORY.md`, `package.json`, `pnpm-lock.yaml`, or run prisma migrations.** If a task requires any of those, add a new task to `TASKS_LANE_A.md` and skip the original. Before each work day, run `git fetch origin && git rebase origin/main && pnpm test`. Before each task, run `git fetch origin` to stay current.

---

## Setup checklist (one-time)

1. Confirm worktrees exist: `git worktree list` shows `main`, `inspector-hardening`, `sandbox-a`, `sandbox-b`.
2. Copy `.env.local` to sandbox-a:
   ```
   cp ~/Desktop/pencil/buildrik/.env.local ~/Desktop/pencil/buildrik-sandbox-a/.env.local
   ```
3. Install deps in sandbox-a:
   ```
   cd ~/Desktop/pencil/buildrik-sandbox-a && pnpm install
   ```
4. Create `TASKS_LANE_A.md` and `TASKS_LANE_B.md` at repo root with initial task lists (see implementation plan).
5. Commit both queue files to main; pull into sandbox-a.
6. Open two terminals, `cd` into respective trees, launch Claude in each with its session prompt.

---

## Success criteria

- ✅ Both sessions run for 4+ hours without manual intervention.
- ✅ Daily diff `TASKS_LANE_A.md TASKS_LANE_B.md` shows zero overlap.
- ✅ Nightly squash merge produces ≤ 1 conflict per week.
- ✅ `MEMORY.md` writes attributed to Lane A only (`git blame memory/MEMORY.md`).
- ✅ `git diff main sandbox-a -- pnpm-lock.yaml` returns empty before each nightly merge.
- ✅ Force-push to main occurs zero times.

After 1 week of stable operation: revisit and consider 3rd lane (`sandbox-b`) for a specific domain (e.g., AI/inspector experimentation).

---

## Rollback path

If the parallel pattern produces more friction than throughput:

1. Stop Session 2.
2. Squash-merge sandbox-a → main one final time.
3. `git worktree remove ../buildrik-sandbox-a`.
4. `git branch -d sandbox-a`.
5. Resume single-session work in main tree.

Total revert time: ~10 minutes. Zero work lost (sandbox commits all migrated to main).
