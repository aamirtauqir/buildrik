-- D11 / A3 / O6: the shipped bundle, its hash, the failure phase and the
-- post-deploy forms activation state live on the publish job. Additive.
ALTER TABLE "publish_build_jobs" ADD COLUMN IF NOT EXISTS "bundle" JSONB;
ALTER TABLE "publish_build_jobs" ADD COLUMN IF NOT EXISTS "bundleHash" TEXT;
ALTER TABLE "publish_build_jobs" ADD COLUMN IF NOT EXISTS "failedPhase" TEXT;
ALTER TABLE "publish_build_jobs" ADD COLUMN IF NOT EXISTS "formsStatus" TEXT;
ALTER TABLE "publish_build_jobs" ADD COLUMN IF NOT EXISTS "formsError" TEXT;
ALTER TABLE "publish_build_jobs" ADD COLUMN IF NOT EXISTS "formsPlan" JSONB;
ALTER TABLE "publish_build_jobs" ADD COLUMN IF NOT EXISTS "formsAttempts" INTEGER NOT NULL DEFAULT 0;
