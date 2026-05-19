-- DropIndex
DROP INDEX "workspace_integrations_workspaceId_provider_idx";

-- CreateIndex
CREATE UNIQUE INDEX "workspace_integrations_workspaceId_provider_key" ON "workspace_integrations"("workspaceId", "provider");
