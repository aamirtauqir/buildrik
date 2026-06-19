-- CreateTable
CREATE TABLE "cms_collections" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "displayField" TEXT,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_entries" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cms_collections_siteId_idx" ON "cms_collections"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "cms_collections_siteId_slug_key" ON "cms_collections"("siteId", "slug");

-- CreateIndex
CREATE INDEX "cms_entries_collectionId_status_idx" ON "cms_entries"("collectionId", "status");

-- AddForeignKey
ALTER TABLE "cms_collections" ADD CONSTRAINT "cms_collections_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_entries" ADD CONSTRAINT "cms_entries_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "cms_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
