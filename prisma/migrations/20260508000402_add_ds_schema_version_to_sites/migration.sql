-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "dsSchemaVersion" INTEGER NOT NULL DEFAULT 0;

-- RenameIndex (IF EXISTS guard for prod-deploy safety —
-- prod may already have the auto-derived name if seeded fresh)
ALTER INDEX IF EXISTS "MediaAsset_userId_url_unique" RENAME TO "media_assets_userId_url_key";
