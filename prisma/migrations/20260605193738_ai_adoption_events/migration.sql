-- CreateTable
CREATE TABLE "ai_adoption_events" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "siteId" TEXT,
    "actorId" TEXT,
    "event" TEXT NOT NULL,
    "surface" TEXT,
    "model" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_adoption_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_adoption_events_workspaceId_event_createdAt_idx" ON "ai_adoption_events"("workspaceId", "event", "createdAt");

-- CreateIndex
CREATE INDEX "ai_adoption_events_siteId_createdAt_idx" ON "ai_adoption_events"("siteId", "createdAt");

-- AddForeignKey
ALTER TABLE "ai_adoption_events" ADD CONSTRAINT "ai_adoption_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
