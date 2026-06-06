-- Partial unique index: at most one ACTIVE publish job per site.
-- "Active" = QUEUED / BUILDING / DEPLOYING — the same set startPublish
-- uses for its "already publishing?" precheck. Postgres partial unique
-- indexes enforce this atomically, so two parallel publishes can no
-- longer both pass the precheck and both create a job. The losing
-- INSERT throws 23505 (Prisma P2002); the service catches it and
-- rethrows ALREADY_PUBLISHING.
--
-- Prisma can't express partial unique indexes in schema.prisma — this
-- migration is hand-authored. Prisma's schema is updated with a
-- comment marker so future schema diffs don't try to drop it.
CREATE UNIQUE INDEX "publish_build_jobs_active_unique"
  ON "publish_build_jobs" ("siteId")
  WHERE "status" IN ('QUEUED', 'BUILDING', 'DEPLOYING');
