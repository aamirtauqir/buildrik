-- E7 (docs/design-jobs/BLOCKERS.md): boards 146:2 and 146:32 draw an asset's
-- pixel dimensions ("2400x1600") and a version's author, and the model had no
-- column for either. Confirmed 2026-09-03 against the schema — the obvious
-- escape hatch was checked too: dimensions are not hiding in
-- `generatedMetadata`, whose only writer is alt-text.service.ts and which
-- carries alt-text output, not geometry. Taken 2026-09-08.
--
-- All three columns are NULLable and carry no default. Every existing row
-- predates the measurement, and back-filling a guessed dimension would put a
-- number on screen that nothing measured — the boards are honest only when the
-- value is real or absent.
--
-- Additive and non-destructive: no existing column is altered or dropped, so
-- this is safe to apply to a live database and needs no backfill step.

ALTER TABLE "media_assets" ADD COLUMN "width" INTEGER;
ALTER TABLE "media_assets" ADD COLUMN "height" INTEGER;

ALTER TABLE "media_asset_versions" ADD COLUMN "createdBy" TEXT;
