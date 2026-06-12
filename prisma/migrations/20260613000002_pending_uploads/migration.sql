-- Small-asset upload handshake (presign -> PUT -> confirm), previously an
-- in-memory Map that broke on serverless: presign and PUT landed on different
-- lambdas, so every valid upload 404'd. TTL is enforced on read (10 min) and
-- expired rows are pruned by the session-cleanup cron.
CREATE TABLE "pending_uploads" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wsId" TEXT NOT NULL,
    "siteId" TEXT,
    "storedUrl" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_uploads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pending_uploads_createdAt_idx" ON "pending_uploads"("createdAt");
