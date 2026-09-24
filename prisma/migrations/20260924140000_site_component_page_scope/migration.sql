-- Component scope "This site / This page" (G2-118, board 6971:77663).
-- NULL = site-wide (every existing row); a page id = that page only.
ALTER TABLE "site_components" ADD COLUMN "pageId" TEXT;
