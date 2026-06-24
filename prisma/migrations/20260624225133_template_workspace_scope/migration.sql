-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "workspaceId" TEXT;

-- CreateIndex
CREATE INDEX "templates_workspaceId_idx" ON "templates"("workspaceId");
