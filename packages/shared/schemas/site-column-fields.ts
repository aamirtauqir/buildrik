/**
 * The editor `projectSettings` fields that are Site columns (SA-01).
 *
 * The column is the one source of truth for each of these. The server strips
 * them from `projectSettings` on save (`stripColumnBackedSettings`), the editor
 * loads them from the columns only (`BuildrikSyncProvider`), mirrors them to the
 * columns for an ADMIN, and locks them below ADMIN on the Settings screens.
 */
export const SITE_COLUMN_FIELDS = [
  "seo.siteName",
  "seo.favicon",
  "seo.language",
  "seo.metaTitle",
  "seo.metaDescription",
  "seo.metaTitleTemplate",
  "seo.defaultOgImage",
  "seo.allowIndexing",
  "seo.robotsTxt",
  "seo.touchIcon",
  "seo.socialLinks",
  "customCode.headScripts",
  "customCode.bodyScripts",
  "publishing.publishedPassword",
] as const;

export type SiteColumnField = (typeof SITE_COLUMN_FIELDS)[number];
