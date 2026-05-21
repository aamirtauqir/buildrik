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
