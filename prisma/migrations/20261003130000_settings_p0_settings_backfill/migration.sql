-- SA-01: the Site columns become the one source of truth for the settings
-- they back; saveProjectData stops storing those keys in "projectSettings".
-- Before it does, a value that only ever reached the JSON (an EDITOR's edit,
-- which the ADMIN-only settings mirror never sent) is copied into its column.
--
-- Rules, per column:
--   * only a NULL column is filled; a column with a value is never overwritten
--   * only a JSON string that is not blank (the editor's "" means "empty")
--   * trimmed like the editor's mirror trims it; head/body code copied raw
-- Not backfilled:
--   * "name" <- seo.siteName: NOT NULL and authoritative
--   * "publishedPassword": the JSON copy was never enforced; the column is ciphertext
--   * "allowIndexing" <- seo.allowIndexing: NOT NULL DEFAULT true, so the column
--     always holds a value, and the editor already loaded it over the JSON
--   * "defaultLocale" <- seo.language: NOT NULL DEFAULT 'en'
-- No schema change. "lastEditedAt" (the save CAS token) is not touched.

-- "metaTitle" <- seo.metaTitle
UPDATE "sites"
SET "metaTitle" = btrim("projectSettings" #>> '{seo,metaTitle}')
WHERE "metaTitle" IS NULL
  AND jsonb_typeof("projectSettings" #> '{seo,metaTitle}') = 'string'
  AND btrim("projectSettings" #>> '{seo,metaTitle}') <> '';

-- "metaDescription" <- seo.metaDescription
UPDATE "sites"
SET "metaDescription" = btrim("projectSettings" #>> '{seo,metaDescription}')
WHERE "metaDescription" IS NULL
  AND jsonb_typeof("projectSettings" #> '{seo,metaDescription}') = 'string'
  AND btrim("projectSettings" #>> '{seo,metaDescription}') <> '';

-- "metaTitleTemplate" <- seo.metaTitleTemplate
UPDATE "sites"
SET "metaTitleTemplate" = btrim("projectSettings" #>> '{seo,metaTitleTemplate}')
WHERE "metaTitleTemplate" IS NULL
  AND jsonb_typeof("projectSettings" #> '{seo,metaTitleTemplate}') = 'string'
  AND btrim("projectSettings" #>> '{seo,metaTitleTemplate}') <> '';

-- "ogImage" <- seo.defaultOgImage
UPDATE "sites"
SET "ogImage" = btrim("projectSettings" #>> '{seo,defaultOgImage}')
WHERE "ogImage" IS NULL
  AND jsonb_typeof("projectSettings" #> '{seo,defaultOgImage}') = 'string'
  AND btrim("projectSettings" #>> '{seo,defaultOgImage}') <> '';

-- "favicon" <- seo.favicon
UPDATE "sites"
SET "favicon" = btrim("projectSettings" #>> '{seo,favicon}')
WHERE "favicon" IS NULL
  AND jsonb_typeof("projectSettings" #> '{seo,favicon}') = 'string'
  AND btrim("projectSettings" #>> '{seo,favicon}') <> '';

-- "touchIcon" <- seo.touchIcon
UPDATE "sites"
SET "touchIcon" = btrim("projectSettings" #>> '{seo,touchIcon}')
WHERE "touchIcon" IS NULL
  AND jsonb_typeof("projectSettings" #> '{seo,touchIcon}') = 'string'
  AND btrim("projectSettings" #>> '{seo,touchIcon}') <> '';

-- "robotsTxt" <- seo.robotsTxt
UPDATE "sites"
SET "robotsTxt" = btrim("projectSettings" #>> '{seo,robotsTxt}')
WHERE "robotsTxt" IS NULL
  AND jsonb_typeof("projectSettings" #> '{seo,robotsTxt}') = 'string'
  AND btrim("projectSettings" #>> '{seo,robotsTxt}') <> '';

-- "headCode" <- customCode.headScripts
UPDATE "sites"
SET "headCode" = "projectSettings" #>> '{customCode,headScripts}'
WHERE "headCode" IS NULL
  AND jsonb_typeof("projectSettings" #> '{customCode,headScripts}') = 'string'
  AND btrim("projectSettings" #>> '{customCode,headScripts}') <> '';

-- "bodyCode" <- customCode.bodyScripts
UPDATE "sites"
SET "bodyCode" = "projectSettings" #>> '{customCode,bodyScripts}'
WHERE "bodyCode" IS NULL
  AND jsonb_typeof("projectSettings" #> '{customCode,bodyScripts}') = 'string'
  AND btrim("projectSettings" #>> '{customCode,bodyScripts}') <> '';

-- "socialLinks" <- seo.socialLinks (an object whose every value is a string)
UPDATE "sites"
SET "socialLinks" = "projectSettings" #> '{seo,socialLinks}'
WHERE "socialLinks" IS NULL
  AND jsonb_typeof("projectSettings" #> '{seo,socialLinks}') = 'object'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_each("projectSettings" #> '{seo,socialLinks}') e
    WHERE jsonb_typeof(e.value) <> 'string'
  );
