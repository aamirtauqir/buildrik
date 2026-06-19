-- AlterTable
ALTER TABLE "review_requests" ADD COLUMN     "changeSummary" TEXT;

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "editsRequireApproval" BOOLEAN NOT NULL DEFAULT false;
