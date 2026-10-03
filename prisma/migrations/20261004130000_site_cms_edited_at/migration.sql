-- Site.cmsEditedAt: bumped by every CMS write (collection/entry upsert/delete,
-- CSV import). Distinct from lastEditedAt, which the editor's own page writes
-- touch. The publish-approval gate AND the editor's publish-state read both
-- see this so CMS-only edits count as "unpublished changes" — the same way a
-- page edit does. Owned by Task 3 of cms-c0; tombstones shipped earlier in
-- 20261004100000_cms_tombstones_cms_edited_at.
-- 20261004100000 (the copy staged on main ahead of the cms-c0 merge) already
-- adds this column, so this must not fail when it exists (2026-10-03).
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "cmsEditedAt" TIMESTAMP(3);
