-- Settings · Clone S2 (docs/design-jobs/CLONE-SETTINGS/phase2-backend.md §2).
--
-- The Add-a-domain dialog (3737:43669) draws a domain TYPE (Primary · Redirect
-- · Subdomain), a DNS PROVIDER select and a Force HTTPS toggle; the Domains
-- card (3397:32206) draws the toggle again. None of the three had a column —
-- `Domain` carried only status/ssl/isPrimary. `isPrimary` stays what it is
-- ("which domain serves the site", flipped by setPrimaryDomain); `kind` is what
-- the domain IS. Localization (3397:32376) draws an "Auto-redirect by browser"
-- toggle with no column behind it either.
--
-- Additive: four columns, each with a default (or NULLable), so every existing
-- row reads PRIMARY · https on · no provider · no redirect — the behaviour the
-- product had before this migration. Reversible by dropping the four columns.

ALTER TABLE "domains" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'PRIMARY';
ALTER TABLE "domains" ADD COLUMN "forceHttps" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "domains" ADD COLUMN "dnsProvider" TEXT;

ALTER TABLE "sites" ADD COLUMN "localeAutoRedirect" BOOLEAN NOT NULL DEFAULT false;
