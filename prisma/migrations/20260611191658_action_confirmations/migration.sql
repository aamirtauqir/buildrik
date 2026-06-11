-- CreateTable
CREATE TABLE "action_confirmations" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "argsHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "action_confirmations_actorId_idx" ON "action_confirmations"("actorId");

-- CreateIndex
CREATE INDEX "action_confirmations_expiresAt_idx" ON "action_confirmations"("expiresAt");
