-- Schema drift: both of these have been in schema.prisma with no migration, so
-- `migrate deploy` never created them (CI's smoke run died on the missing
-- column since 2026-09-14). Written idempotently: a database that got them via
-- `db push` is left as it is.

-- OnboardingState.wizardData (schema since 1c8fae40b, 2026-07-12)
ALTER TABLE "onboarding_states" ADD COLUMN IF NOT EXISTS "wizardData" JSONB;

-- KnownDevice
CREATE TABLE IF NOT EXISTS "known_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "known_devices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "known_devices_userId_idx" ON "known_devices"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "known_devices_userId_fingerprint_key" ON "known_devices"("userId", "fingerprint");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'known_devices_userId_fkey') THEN
    ALTER TABLE "known_devices" ADD CONSTRAINT "known_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
