-- CreateTable
CREATE TABLE "workspace_presets" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "styles" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspace_presets_workspaceId_updatedAt_idx" ON "workspace_presets"("workspaceId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_presets_workspaceId_name_key" ON "workspace_presets"("workspaceId", "name");

-- AddForeignKey
ALTER TABLE "workspace_presets" ADD CONSTRAINT "workspace_presets_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
