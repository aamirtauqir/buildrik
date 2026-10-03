-- C1: two sites must never share a Vercel project — the second one's publish
-- would deploy over the first one's live site. NULL (unpinned) is unlimited.
CREATE UNIQUE INDEX "sites_vercelProjectName_key" ON "sites"("vercelProjectName");
