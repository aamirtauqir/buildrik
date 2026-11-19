-- L1-015 / L1-029: per user × site editor onboarding state. Additive only.
CREATE TABLE "editor_onboarding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dismissedAt" TIMESTAMP(3),
    "tipsSeen" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tipsDismissed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editor_onboarding_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "editor_onboarding_siteId_idx" ON "editor_onboarding"("siteId");

CREATE UNIQUE INDEX "editor_onboarding_userId_siteId_key" ON "editor_onboarding"("userId", "siteId");

ALTER TABLE "editor_onboarding" ADD CONSTRAINT "editor_onboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "editor_onboarding" ADD CONSTRAINT "editor_onboarding_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
