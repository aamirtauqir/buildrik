-- Phase -1: persistence boundary fix.
-- Adds page-level meta + settings + slugHistory + slugManuallySet columns.
-- All four are additive optional columns; no data migration needed.
-- REGRESSION-1: applied-template state now survives reload.

-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "meta" JSONB,
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "slugHistory" JSONB,
ADD COLUMN     "slugManuallySet" BOOLEAN NOT NULL DEFAULT false;
