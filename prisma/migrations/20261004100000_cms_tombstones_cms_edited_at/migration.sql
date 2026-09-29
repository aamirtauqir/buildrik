ALTER TABLE "cms_collections" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "cms_entries" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "cms_collections_siteId_deletedAt_idx" ON "cms_collections"("siteId", "deletedAt");
CREATE INDEX "cms_entries_collectionId_deletedAt_idx" ON "cms_entries"("collectionId", "deletedAt");
