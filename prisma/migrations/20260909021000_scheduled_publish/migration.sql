-- E2 (docs/design-jobs/BLOCKERS.md) — scheduled publish.
--
-- Confirmed absent 2026-09-03: no `scheduledFor`, `schedulePublish` or
-- `scheduled_publish` existed anywhere in `server/`, `prisma/` or the editor,
-- so four boards drew a feature with no producer of any kind. Taken 2026-09-08.
--
-- A table rather than a column on `sites`, because a schedule has an author and
-- an outcome: cancelling one has to leave a record instead of nulling a field,
-- and a run that crashed must be distinguishable from one that never fired.
--
-- Purely additive: creates one new table and its indexes, touches nothing
-- existing, and needs no backfill.

CREATE TABLE "scheduled_publishes" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "jobId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_publishes_pkey" PRIMARY KEY ("id")
);

-- The sweep's only query: PENDING rows whose time has come.
CREATE INDEX "scheduled_publishes_status_scheduledFor_idx"
    ON "scheduled_publishes"("status", "scheduledFor");

-- The panel's query, and the uniqueness check below.
CREATE INDEX "scheduled_publishes_siteId_status_idx"
    ON "scheduled_publishes"("siteId", "status");

-- At most one PENDING schedule per site, enforced in the DATABASE and not only
-- in the service — the same lesson `publish_job_active_unique` records for
-- PublishBuildJob, where two concurrent requests could otherwise both pass a
-- service-level check. Prisma's schema language cannot express a partial unique
-- index, so like that one it lives only in SQL. Do NOT add an
-- `@@unique([siteId])` to the model: that would create a conflicting full index.
CREATE UNIQUE INDEX "scheduled_publishes_site_pending_unique"
    ON "scheduled_publishes"("siteId")
    WHERE "status" = 'PENDING';
