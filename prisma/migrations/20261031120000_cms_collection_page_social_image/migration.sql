-- A-27: the image field whose value is each generated page's og:image. Additive, nullable.
ALTER TABLE "cms_collections" ADD COLUMN "pageSocialImage" TEXT;
