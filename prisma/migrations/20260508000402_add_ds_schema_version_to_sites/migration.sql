-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "dsSchemaVersion" INTEGER NOT NULL DEFAULT 0;

-- RenameIndex
ALTER INDEX "MediaAsset_userId_url_unique" RENAME TO "media_assets_userId_url_key";
