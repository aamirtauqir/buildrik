-- Class-first styling (BD-30, CLASS-FIRST-SPEC §2.3): the site's style model.
-- Additive; every existing site reads "element" (no visual change).
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "styleModel" TEXT NOT NULL DEFAULT 'element';
