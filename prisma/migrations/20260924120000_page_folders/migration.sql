-- Personal page folders (PageFolder). Per user x site; pages stay shared.

-- CreateTable
CREATE TABLE "page_folders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "collapsed" BOOLEAN NOT NULL DEFAULT false,
    "pageIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_folders_userId_siteId_idx" ON "page_folders"("userId", "siteId");

-- AddForeignKey
ALTER TABLE "page_folders" ADD CONSTRAINT "page_folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_folders" ADD CONSTRAINT "page_folders_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

