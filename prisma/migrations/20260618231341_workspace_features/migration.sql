-- CreateTable
CREATE TABLE "workspace_features" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_features_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspace_features_workspaceId_idx" ON "workspace_features"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_features_workspaceId_key_key" ON "workspace_features"("workspaceId", "key");

-- AddForeignKey
ALTER TABLE "workspace_features" ADD CONSTRAINT "workspace_features_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
