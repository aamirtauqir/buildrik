# P1 — Publish truth + rollback · task-level plan

> Executes P1 of the master plan. Re-greped 2026-07-23. The plan is SMALLER than the master-plan draft feared — much infra already exists.

**Goal:** publishing is honest (the payload of a shipped version survives so it can be re-deployed), and a prior version can be rolled back = re-published as a NEW version (contract §5: never a mutation of history).

**Ground truth (re-greped 2026-07-23) — what already exists:**
- `PublishBuildJob` has `log Json?` (holds `{pages}` — the deploy payload; `steps`/`error` are separate). No `payload` column, no `updatedAt`.
- `startPublish` (`publish.service.ts:133`) already has: **stranded-job reaper** (`STALE_BUILDING_AFTER_MS = 15min`, `STALE_QUEUED_AFTER_MS = 5min` → FAILED, on next-publish), **active-unique P2002 → ALREADY_PUBLISHING**, the **approval gate** (`publishApprovalBlock`), Vercel-connection check, payload persist (`log:{pages}`), worker dispatch.
- `completePublish:350` + `cancelPublish:333` **NULL `log`** on terminal → the payload is destroyed (the eng finding — rollback impossible today). This is the one real gap.
- `getPublishStatus` already **explicit-selects, never returns `log`** — mirror for history.
- `publish_build_jobs_active_unique` partial-index migration **EXISTS locally** (`20260607000001`), referenced by the P2002 catch. (Absent on prod — applied at a later deploy with CONCURRENTLY per P7.)

**Corrections to the master-plan P1 draft:**
1. No `payload` column — **reuse `log`** (it already IS the payload, only ever holds `{pages}`; a parallel column needs a data-migration + dual-write for zero functional gain). Stop nulling it on complete; prune to bound storage. Documented divergence.
2. No new reaper — the 15-min on-demand reaper already exists in startPublish.
3. Approval-gate bypass for rollback via a startPublish opt, not a forked path (DRY).

## Global constraints
DS primitives (Gate 24); inline-style chrome; flag-independent (publish isn't agency-gated); TDD; commit per slice to `main`; tsc + ds-ssot + verify:ds green; live dev-DB integration before "done".

### Slice A — Server: payload retention + history + rollback
**Files:** `prisma/schema.prisma` (+`rolledBackFrom String?`) + migration `20260723xxxxxx_publish_rollback_provenance` · `server/services/publish.service.ts` · `server/trpc/routers/sites.ts` · `packages/shared/schemas/publish.ts` (history/rollback inputs) · tests.

**Produces:**
- **Payload retention:** `completePublish` stops nulling `log`; after COMPLETED, **prune** — keep the 20 most recent COMPLETED jobs (by `completedAt` desc) with `log` for the site, null `log` on older COMPLETED. The live version (most recent) is always retained. `cancelPublish`/FAILED still null (not rollback targets).
- `getPublishHistory(siteId): PublishHistoryRow[]` — COMPLETED jobs newest first (limit 20). Reads `log` internally ONLY to compute `rollbackable: log != null`; **never returns `log`**. Each row: `{ id, version, completedAt, deploymentId, rollbackable, rolledBackFrom }`. `version` = ascending ordinal (oldest COMPLETED = v1).
- `rollbackPublish(workspaceId, siteId, jobId, userId)` — validate: target found + workspace-scoped (else NOT_FOUND), COMPLETED (else NOT_ROLLBACKABLE), `log.pages` present (else NOT_ROLLBACKABLE — payload pruned). Then start a NEW publish of the stored pages via `startPublish(..., { bypassApproval: true, rolledBackFrom: jobId })` — an ADMIN restoring a previously-shipped version skips the approval gate; guarded by active-unique (ALREADY_PUBLISHING if a publish runs).
- `startPublish` gains `opts?: { bypassApproval?: boolean; rolledBackFrom?: string }` — when `bypassApproval`, skip the approval-gate block; set `rolledBackFrom` on the created job.
- Router: `sites.publishHistory` (EDITOR — own-site read) · `sites.rollback` (ADMIN — destructive §2, activity-logged `site.rolled_back`).

- [ ] A1 failing service tests (retention: complete keeps log + prunes >20; history: newest-first, rollbackable flag, no log leak; rollback: NOT_ROLLBACKABLE on pruned/non-complete, bypasses approval, sets rolledBackFrom, ALREADY_PUBLISHING when active)
- [ ] A2 fail · A3 implement (schema+migration+service+schemas+router) · A4 pass; tsc · A5 commit

### Slice B — Editor UI: deploy states + publish history/rollback
**Files:** `packages/editor/src/services/PublishService.ts` (fetchPublishHistory, rollbackPublish) · a `PublishHistory` surface (modal/section) · wire into PublishDropdown/StudioModals · tests.

**Produces:**
- ServerPublishService: `fetchPublishHistory()` + `rollbackPublish(jobId)` (fail-closed reads / throwing writes, per P0 convention).
- Publish-history surface (S6.1 drawn): list versions (v1..vN, live badge on latest, rollbackable), rollback pick → confirm ("↩ from vN" + names: draft untouched · prior approver · creates new version) → publishing (usePublishJob progress) → done. Non-rollbackable rows disabled with a reason (payload pruned). Deploy states (connect-vercel/publishing/live/failed) surfaced via the existing usePublishJob polling.

- [ ] B1 failing tests · B2 fail · B3 implement + wire · B4 pass; tsc · B5 commit

### Slice C — Verify
- [ ] C1 vitest green (touched) · tsc gate · verify:ds green
- [ ] C2 live dev-DB: publish→complete (log retained) → history shows it rollbackable → rollback (new job, bypasses approval, rolledBackFrom set) → 21st publish prunes the oldest's log → that one now NOT_ROLLBACKABLE. Cascade-clean.
- [ ] C3 commit notes; update memory
