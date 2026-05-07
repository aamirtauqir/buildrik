-- Phase B5+ codex re-review fix [P1A bytes=0 + race]:
-- Make (userId, url) uniquely identifying so concurrent
-- onUploadCompleted webhook + client createAsset can converge on the
-- same row via upsert. Without this, double-insert is possible under
-- contention.
--
-- Defensive cleanup of pre-existing dupes (if any) before adding constraint.
DELETE FROM "media_assets"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id",
           ROW_NUMBER() OVER (PARTITION BY "userId", "url" ORDER BY "createdAt" ASC) AS rn
    FROM "media_assets"
  ) t
  WHERE t.rn > 1
);

-- Add unique constraint.
CREATE UNIQUE INDEX "MediaAsset_userId_url_unique" ON "media_assets"("userId", "url");
