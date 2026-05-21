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

- [x] Parallel sessions workflow plan (2026-05-21, `774a600e`)
- [x] Parallel sessions workflow spec (2026-05-21, `fb75249b`)
- [x] AliasResolver replacedBy rename bridge tests (2026-05-21, `76a3e5aa`)
- [x] CSP allow fonts.bunny.net in dashboard (2026-05-21, `f8060f6f`)
- [x] Vercel disconnect UX hint (2026-05-20, `e7c37308`)
