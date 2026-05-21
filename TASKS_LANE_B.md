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
  - Acceptance: `grep -r "from.*templates/\(MyTemplates\|SaveTemplate\|TemplateLibrary\|TemplatePreview\)" packages/editor/src/` returns zero results; files deleted.

## In Progress

(only one task — blank means session is between tasks)

## Done (last 5)

(blank — first day on sandbox-a)
