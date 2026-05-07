-- AlterTable: per-site locale config
ALTER TABLE "sites"
  ADD COLUMN "defaultLocale" TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN "enabledLocales" TEXT[] NOT NULL DEFAULT ARRAY['en']::TEXT[];

-- AlterTable: per-page translation payloads
ALTER TABLE "pages"
  ADD COLUMN "translations" JSONB;
