-- P1 publish truth + rollback: rollback provenance.
-- `rolledBackFrom` records the COMPLETED job id a publish re-deployed, so the
-- publish history can label it "↩ from vN". Additive + nullable — safe on a
-- live table (no rewrite, no default). Existing rows are normal publishes (NULL).
ALTER TABLE "publish_build_jobs" ADD COLUMN "rolledBackFrom" TEXT;
