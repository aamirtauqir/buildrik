-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "themeLocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "sharedTheme" JSONB,
ADD COLUMN     "sharedThemeUpdatedAt" TIMESTAMP(3);
