# Buildrik software factory

A team of Claude Code agents that works like a software house: every task is
written down, specified, built, verified and reviewed by different roles, and
the one who builds never approves.

## Team

| Role | Agent | Writes | Never |
|---|---|---|---|
| PM / coordinator | main session (`/factory` skill) | `task.md`, merges | writes product code |
| Analyst | `factory-analyst` | `spec.md` | edits code |
| Product designer | `factory-designer` | `design/` in the task folder, Figma | edits app code |
| Design reviewer | `design-guard-reviewer` | nothing (returns report) | edits anything |
| Developer | `factory-developer` | code, in its own worktree, PR | pushes or merges `main` |
| QA / verifier | `factory-qa` | nothing (returns report) | edits anything |
| Code reviewer | `factory-code-reviewer` | nothing (returns report) | edits anything |
| Security auditor | `factory-security` | nothing (returns report) | edits anything |
| Founder | you | approvals | — |

## Workflow

```
founder issue
  → PM opens docs/factory/tasks/T-NNN/task.md            (status: intake)
  → factory-analyst writes spec.md                        (status: spec)
  → founder approves the spec                             (status: spec-approved)
  → [UI change]  factory-designer → design-guard-reviewer (status: design)
  → factory-developer builds in a worktree, opens a PR    (status: build)
  → factory-qa verifies the done-condition live           (status: qa)
  → factory-code-reviewer  [+ factory-security if guarded areas]   (status: review)
  → CI green (7 required checks) → PM merges              (status: merged)
     guarded areas: founder sign-off before merge
```

Any FAIL sends the task back to the stage that owns the fix. Three failed
rounds on one stage → `blocked`, and the PM asks the founder.

## What enforces this (not just prose)

| Rule | Enforced by |
|---|---|
| Reviewers / QA cannot edit | agent `tools` + `.claude/hooks/guard.mjs` role rules |
| Analyst / designer write only in the task folder | guard role rules |
| No agent pushes or merges `main`; only `factory/*` branches | guard role rules |
| Only the PM edits `task.md` | guard role rules |
| An agent cannot finish without its evidence block | `.claude/hooks/factory-stop.mjs` (SubagentStop) |
| After compaction the rules + active tasks come back | `.claude/hooks/factory-context.mjs` (SessionStart) |
| Merge needs green CI | branch protection on `main` |

Rules in one page: [`RULES.md`](RULES.md). Task template: [`tasks/_TEMPLATE/task.md`](tasks/_TEMPLATE/task.md).
