-- X-1 (audit-fix Lrt2): a server clock for a saved version.
--
-- A rename changes only `name`, and the editor caches versions in IndexedDB.
-- To take a rename made in another browser without overwriting one made here
-- offline, the editor stamps each cached version with the server's updatedAt
-- (the same persisted-stamp scheme CMS collections/entries use). Existing rows
-- read "now" — additive, no backfill.
ALTER TABLE "site_versions" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
