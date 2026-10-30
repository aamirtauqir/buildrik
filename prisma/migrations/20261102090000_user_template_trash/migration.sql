-- Saved-template trash (design-2l9 B6-T24…T33). Additive only.
-- Deleting a saved page template keeps its row for 30 days with `deletedAt`
-- set ("Recently deleted"); a restore clears it, keeping the templateId.
ALTER TABLE "user_templates" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "user_templates_workspaceId_deletedAt_idx" ON "user_templates"("workspaceId", "deletedAt");
