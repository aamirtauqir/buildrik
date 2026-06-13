-- The site settings UI has a favicon uploader that pushed files to Blob but
-- had no column to persist the URL — every favicon upload was lost on save.
-- (touchIcon already existed for the apple-touch-icon; favicon is the
-- separate browser-tab icon.)
ALTER TABLE "sites" ADD COLUMN "favicon" TEXT;
