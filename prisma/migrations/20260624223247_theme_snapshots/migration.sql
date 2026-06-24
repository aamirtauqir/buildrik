-- CreateTable
CREATE TABLE "site_theme_snapshots" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "prevStyles" JSONB,
    "prevDsSchemaVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_theme_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_theme_snapshots_siteId_createdAt_idx" ON "site_theme_snapshots"("siteId", "createdAt");

-- CreateIndex
CREATE INDEX "site_theme_snapshots_workspaceId_idx" ON "site_theme_snapshots"("workspaceId");

-- AddForeignKey
ALTER TABLE "site_theme_snapshots" ADD CONSTRAINT "site_theme_snapshots_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_theme_snapshots" ADD CONSTRAINT "site_theme_snapshots_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
