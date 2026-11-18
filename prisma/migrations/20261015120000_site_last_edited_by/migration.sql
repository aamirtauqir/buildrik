-- Who saved the site's current content (restore/conflict dialogs). Additive.
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "lastEditedById" TEXT;

DO $$ BEGIN
  ALTER TABLE "sites" ADD CONSTRAINT "sites_lastEditedById_fkey"
    FOREIGN KEY ("lastEditedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
