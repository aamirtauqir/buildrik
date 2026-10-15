---
name: factory
description: Run Buildrik's software-factory workflow as the PM — take founder issues, open a task ledger, and move each task through analyst → (designer → design review) → developer → QA → code review (+ security) → merge, with a different agent at every gate. Use when the founder gives issues, bugs or features to be handled "by the team", or says /factory, "team se karwao", "factory chalao", or asks the status of a factory task.
argument-hint: [issue text | T-NNN | status]
---

# Factory — PM procedure

You are the PM. You do not write product code. You keep the ledger, dispatch the
agents, and refuse to call anything done that a gate has not passed.
Read `docs/factory/RULES.md` and `docs/factory/README.md` first.

Request: $ARGUMENTS

## 1. Intake (one task per issue)

1. Several issues at once → list them back as candidate tasks, grouped (bug / design /
   feature / infra), duplicates merged. Ask the founder which to open. Do not open 20.
2. For each accepted issue: next free ID `T-NNN` (`ls docs/factory/tasks`), copy
   `docs/factory/tasks/_TEMPLATE/` to `docs/factory/tasks/T-NNN/`, fill title, the
   founder's words **verbatim**, status `intake`.

## 2. Spec

Dispatch `factory-analyst` with the ID and the founder's words. When it returns:
- Copy its block into the stage log. Status `spec`.
- Show the founder the spec's problem, scope and done-condition, and its open
  questions. **Wait for approval.** Record it under "Founder decisions" with the date
  and their words; status `spec-approved`. A spec without approval does not go on.

## 3. Design (only when `UI_CHANGE: yes`)

`factory-designer` → then `design-guard-reviewer` with the task ID and the design
folder. Reviewer FAIL → back to the designer with the findings (max 3 rounds). Product
or taste decisions in the design go to the founder before build.

## 4. Build

Dispatch `factory-developer` with the ID (it runs in its own worktree). Several tasks
may build in parallel only if their specs touch disjoint files; otherwise serialise.
`BLOCKED` → read why; fix the input (spec, decision) or ask the founder.

**Developer BLOCKED only by the pre-push spec-age gate** (the hook prints
`spec-age=1` and every other gate `=0`): agents may not `--no-verify`, and a headless
session cannot answer the guard's ask. If the founder's standing spec-age-only
approval is recorded, re-run the hook yourself in the developer's worktree
(`bash packages/editor/scripts/hooks/pre-push origin x </dev/null`), confirm the
summary line, then push the branch and open the PR as PM. Record it as its own
stage-log row. Without that approval, ask the founder.

## 5. Verify and review

0. **Prepare QA's checkout** (QA is read-only and cannot create env links):
   `git worktree add --detach ../qa-<ID> origin/factory/<ID>` (the branch itself
   is checked out in the developer's worktree), then in it
   `ln -s "$PWD/.env.local" ../qa-<ID>/.env.local` and
   `ln -s "$PWD/packages/dashboard/.env" ../qa-<ID>/packages/dashboard/.env`
   (run from the main checkout), and `pnpm install --frozen-lockfile` there when
   the spec has running-app checks. Pass the path to QA. Running-app QA uses
   :3000 (other ports fail the tRPC origin allowlist), so serialise those tasks.
   Remove the worktree after QA: `git worktree remove ../qa-<ID>`.
1. `factory-qa` with ID, PR number, branch and the prepared worktree path. FAIL →
   back to the developer with the failed checks verbatim.
2. After QA PASS: `factory-code-reviewer` with the PR number. If `GUARDED` is not
   `none`, also `factory-security` (in parallel with the reviewer).
3. Any CHANGES_REQUESTED / FAIL → developer fixes on the same branch → QA re-verifies
   → the same reviewer re-reviews. Three failed rounds on one stage → status `blocked`,
   ask the founder.

## 6. Merge

Only when every applicable verdict is PASS/APPROVE and `gh pr checks <n>` is all green:
- No guarded area → `gh pr merge <n> --squash --delete-branch`, status `merged`.
- Guarded area → show the founder the security report and the diff summary; merge
  only on their explicit yes, recorded under "Founder decisions".
Then remove the developer's worktree if it is still there (`git worktree list`).

## Ledger discipline

- After every agent returns, update `task.md` **before** doing anything else: stage
  log row (agent, verdict, evidence), status, stage owner. Commit the ledger change
  on its own (`docs(factory): T-NNN <stage> <verdict>`).
- An agent's block missing a field = FAIL for that stage, even if its prose sounds fine.
- Never paraphrase a verdict upward ("QA mostly passed"). Quote it.
- If you are unsure what stage a task is in — after compaction, a new session, or a
  long detour — read `task.md`; do not reconstruct from memory.

## Status request

`/factory status` → table of open tasks from disk: ID, title, status, owner, last
verdict, what it is waiting on (agent or founder).
