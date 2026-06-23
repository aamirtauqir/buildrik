-- CreateTable
CREATE TABLE "user_templates" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "html" TEXT NOT NULL,
    "css" TEXT,
    "thumbnail" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_templates_workspaceId_updatedAt_idx" ON "user_templates"("workspaceId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_templates_workspaceId_templateId_key" ON "user_templates"("workspaceId", "templateId");

-- AddForeignKey
ALTER TABLE "user_templates" ADD CONSTRAINT "user_templates_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
