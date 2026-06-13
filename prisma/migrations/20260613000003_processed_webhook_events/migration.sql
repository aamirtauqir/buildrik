-- Idempotency ledger for Stripe webhook events. Stripe retries delivery until
-- a 2xx, so duplicate deliveries previously re-ran side effects (PAST_DUE
-- flip + payment-failed notification spam). The route records the event id
-- before handling; a duplicate primary-key insert means "already processed".
CREATE TABLE "processed_webhook_events" (
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("eventId")
);

CREATE INDEX "processed_webhook_events_processedAt_idx" ON "processed_webhook_events"("processedAt");
