-- Page trash (design-2l9 A-21). Additive only.
-- A page removed from the editor is kept for 30 days instead of being
-- hard-deleted: `deletedAt` marks it, `deletedById` says who, and
-- `trashedSlug` keeps the URL it had while `slug` holds a tombstone
-- (`<slug>~deleted~<id>`) that frees the (siteId, slug) unique key.
ALTER TABLE "pages" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "pages" ADD COLUMN "deletedById" TEXT;
ALTER TABLE "pages" ADD COLUMN "trashedSlug" VARCHAR(100);
CREATE INDEX "pages_siteId_deletedAt_idx" ON "pages"("siteId", "deletedAt");
