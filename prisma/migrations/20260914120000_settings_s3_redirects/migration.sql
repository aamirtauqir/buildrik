-- Settings · Clone S3 (docs/design-jobs/CLONE-SETTINGS/phase3-backend.md §2).
--
-- The Add / Edit redirect dialogs (4254:75736, 4254:75747) draw a "Match query
-- strings" toggle ("Forward ?utm_source and other parameters to the
-- destination.") and a Notes field ("Optional — why this redirect exists.").
-- `Redirect` carried only fromPath / toUrl / type. The HSTS card draws
-- "Enable HSTS" + "Max age" only, so the includeSubDomains / preload columns
-- the delta floated are NOT added — this is the phase's only migration.
--
-- Additive: one defaulted boolean, one NULLable text. Every existing row reads
-- "does not forward the query · no notes", which is what it was. Reversible
-- by dropping the two columns.

ALTER TABLE "redirects" ADD COLUMN "matchQuery" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "redirects" ADD COLUMN "notes" TEXT;
