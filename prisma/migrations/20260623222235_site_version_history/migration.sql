-- CreateTable
CREATE TABLE "site_versions" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAuto" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_versions_siteId_createdAt_idx" ON "site_versions"("siteId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "site_versions_siteId_versionId_key" ON "site_versions"("siteId", "versionId");

-- AddForeignKey
ALTER TABLE "site_versions" ADD CONSTRAINT "site_versions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
