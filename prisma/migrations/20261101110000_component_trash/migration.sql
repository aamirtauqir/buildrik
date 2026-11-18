-- Component trash (design-2l9 K18–K20, K42). Additive only.
-- A deleted component master is kept for 30 days instead of being
-- hard-deleted: `deletedAt` marks it, `deletedById` says who, and `trash`
-- keeps what the delete detached (the instance links and a fingerprint of
-- each detached element, plus how many pages they sat on) so a restore can
-- re-link the instances nobody changed since. No key rewrite is needed: the
-- (siteId, componentId) key is the engine's generated id, and bringing the
-- same id back IS the restore.
ALTER TABLE "site_components" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "site_components" ADD COLUMN "deletedById" TEXT;
ALTER TABLE "site_components" ADD COLUMN "trash" JSONB;
CREATE INDEX "site_components_siteId_deletedAt_idx" ON "site_components"("siteId", "deletedAt");
