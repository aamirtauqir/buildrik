-- DB-backed collaboration op-log (serverless-friendly SSE fan-out).
-- Clients POST ops; the SSE stream replays ops with seq > the client's
-- last-seen seq. `seq` is a monotonic per-table sequence used for ordering.
CREATE TABLE "collab_operations" (
  "id"        TEXT NOT NULL,
  "siteId"    TEXT NOT NULL,
  "seq"       SERIAL NOT NULL,
  "authorId"  TEXT NOT NULL,
  "clientId"  TEXT NOT NULL,
  "op"        JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collab_operations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "collab_operations_siteId_seq_idx" ON "collab_operations" ("siteId", "seq");
CREATE INDEX "collab_operations_createdAt_idx" ON "collab_operations" ("createdAt");
