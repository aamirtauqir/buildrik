-- SA-06: pin the Vercel project a site deploys to, so a slug change never
-- moves a published site to a new project. Nullable; null = derive from slug.
ALTER TABLE "sites" ADD COLUMN "vercelProjectName" TEXT;
