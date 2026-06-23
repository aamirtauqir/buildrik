-- CreateTable
CREATE TABLE "site_components" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_components_siteId_updatedAt_idx" ON "site_components"("siteId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "site_components_siteId_componentId_key" ON "site_components"("siteId", "componentId");

-- AddForeignKey
ALTER TABLE "site_components" ADD CONSTRAINT "site_components_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
