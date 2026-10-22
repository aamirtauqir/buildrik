import { z } from "zod";

// Locale string shape mirrors packages/shared/schemas/site-detail.ts (defaultLocale/enabledLocales).
// BCP-47 friendly: "en", "fr-FR", "zh-Hant".
const localeString = z.string().min(2).max(10);

export const getTranslationSchema = z.object({
  pageId: z.string(),
  locale: localeString,
});

export const setTranslationSchema = z.object({
  pageId: z.string(),
  siteId: z.string(),
  locale: localeString,
  blocks: z.unknown(),
});

export const removeTranslationSchema = z.object({
  pageId: z.string(),
  siteId: z.string(),
  locale: localeString,
});

export type GetTranslationInput = z.infer<typeof getTranslationSchema>;
export type SetTranslationInput = z.infer<typeof setTranslationSchema>;
export type RemoveTranslationInput = z.infer<typeof removeTranslationSchema>;

// ─── Personal page folders (Pages panel) ───────────────────────────────────
// One member's own grouping of a site's pages; the pages themselves are shared.

const folderName = z.string().trim().min(1).max(80);

export const listPageFoldersSchema = z.object({ siteId: z.string() });

export const createPageFolderSchema = z.object({
  siteId: z.string(),
  name: folderName,
});

/** Rename and/or collapse. At least one field. */
export const updatePageFolderSchema = z
  .object({
    folderId: z.string(),
    name: folderName.optional(),
    collapsed: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.collapsed !== undefined, {
    message: "Nothing to update",
  });

export const deletePageFolderSchema = z.object({ folderId: z.string() });

/** Put a page in one of the user's folders on its site, or take it out of all
 *  of them (`folderId: null`). A page sits in at most one of a user's folders. */
export const movePageToFolderSchema = z.object({
  siteId: z.string(),
  pageId: z.string(),
  folderId: z.string().nullable(),
});

export const pageFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  collapsed: z.boolean(),
  pageIds: z.array(z.string()),
});

export type CreatePageFolderInput = z.infer<typeof createPageFolderSchema>;
export type UpdatePageFolderInput = z.infer<typeof updatePageFolderSchema>;
export type MovePageToFolderInput = z.infer<typeof movePageToFolderSchema>;
export type PageFolder = z.infer<typeof pageFolderSchema>;
