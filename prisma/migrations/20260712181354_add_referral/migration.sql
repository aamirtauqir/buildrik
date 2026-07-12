-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "referredName" TEXT NOT NULL,
    "referredEmail" TEXT,
    "plan" TEXT NOT NULL,
    "mrrCents" INTEGER NOT NULL DEFAULT 0,
    "commissionCents" INTEGER NOT NULL DEFAULT 0,
    "signedUpAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "referrals_workspaceId_idx" ON "referrals"("workspaceId");

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
