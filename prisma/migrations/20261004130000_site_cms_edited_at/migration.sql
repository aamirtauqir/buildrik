-- Site.cmsEditedAt: bumped by every CMS write (collection/entry upsert/delete,
-- CSV import). Distinct from lastEditedAt, which the editor's own page writes
-- touch. The publish-approval gate AND the editor's publish-state read both
-- see this so CMS-only edits count as "unpublished changes" — the same way a
-- page edit does. Owned by Task 3 of cms-c0; tombstones shipped earlier in
-- 20261004100000_cms_tombstones_cms_edited_at.
ALTER TABLE "sites" ADD COLUMN "cmsEditedAt" TIMESTAMP(3);
