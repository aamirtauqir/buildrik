-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "tokensMigrationHold" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "site_theme_snapshots" ADD COLUMN     "darkMode" TEXT,
ADD COLUMN     "reason" TEXT NOT NULL DEFAULT 'theme-push',
ADD COLUMN     "tokensSchemaVersion" INTEGER NOT NULL DEFAULT 5;

-- CreateIndex
CREATE INDEX "site_theme_snapshots_siteId_reason_createdAt_idx" ON "site_theme_snapshots"("siteId", "reason", "createdAt");
