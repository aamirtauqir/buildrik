-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "allowIndexing" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "robotsTxt" TEXT;
