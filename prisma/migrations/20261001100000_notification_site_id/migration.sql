-- Site-scoped notifications (post-Oct-1, C5 G1-033 / decision 9).
--
-- The editor's bell lists "this site" only, but a Notification row carried no
-- site, so `notifications.recent` could only answer "everything for this user".
-- The writers that know their site (publish outcome, form submission) now set
-- it; everything else stays NULL (account, billing, security — not about a
-- site).
--
-- Additive: one NULLable text + one index. Existing rows read "no site" and so
-- drop out of the editor's site-scoped list; the dashboard bell (no siteId
-- argument) is unchanged. No backfill: `actionUrl` holds `/dashboard/sites/<id>`
-- for the publish/form rows and could seed one, but that is an owner call, not
-- part of this migration. Reversible by dropping the index and the column.

ALTER TABLE "notifications" ADD COLUMN "siteId" TEXT;

CREATE INDEX "notifications_userId_siteId_createdAt_idx" ON "notifications"("userId", "siteId", "createdAt");
