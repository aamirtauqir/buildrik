-- AlterTable
ALTER TABLE "sites"
  ADD COLUMN "cspPolicy" TEXT,
  ADD COLUMN "hstsMaxAge" INTEGER,
  ADD COLUMN "xFrameOptions" TEXT,
  ADD COLUMN "referrerPolicy" TEXT,
  ADD COLUMN "permissionsPolicy" TEXT;
