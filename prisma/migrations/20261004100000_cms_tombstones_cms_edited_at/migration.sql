-- CMS tombstones (deletedAt on collections/entries) + Site.cmsEditedAt.
-- Staged in main checkout ahead of the feat/cms-c0 merge so the columns
-- exist before the CMS service code (which references them) ships.
-- Additive only — main's services do not yet read these columns, so the
-- migration is safe to run before feat/cms-c0 lands.
ALTER TABLE "cms_collections" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "cms_entries" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "sites" ADD COLUMN "cmsEditedAt" TIMESTAMP(3);
CREATE INDEX "cms_collections_siteId_deletedAt_idx" ON "cms_collections"("siteId", "deletedAt");
CREATE INDEX "cms_entries_collectionId_deletedAt_idx" ON "cms_entries"("collectionId", "deletedAt");
