/**
 * "My Templates" (save-as-template) schemas (#13/25, 2026-06-24). Server mirror
 * of the editor's local MY_TEMPLATES cache, workspace-scoped (resolved from the
 * editing site). `html` is the exported page markup.
 *
 * @license BSD-3-Clause
 */
import { z } from "zod";

export const upsertUserTemplateSchema = z.object({
  siteId: z.string(),
  /** Editor's "user-<ts>" id — canonical dedupe key. */
  templateId: z.string(),
  name: z.string().min(1).max(200),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  html: z.string(),
  css: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
});

export const listUserTemplatesSchema = z.object({ siteId: z.string() });
export const deleteUserTemplateSchema = z.object({ siteId: z.string(), templateId: z.string() });

export type UpsertUserTemplateInput = z.infer<typeof upsertUserTemplateSchema>;
export type ListUserTemplatesInput = z.infer<typeof listUserTemplatesSchema>;
export type DeleteUserTemplateInput = z.infer<typeof deleteUserTemplateSchema>;

/* Saved-template trash — "Recently deleted" (design-2l9 B6-T24…T33). A
   deleted saved template stays restorable for this many days, then the
   retention purge removes it. */
export const USER_TEMPLATE_TRASH_RETENTION_DAYS = 30;

export const restoreUserTemplateSchema = z.object({ siteId: z.string(), templateId: z.string() });
/** Permanent delete: the template's name typed back (B6-T30/T31). */
export const purgeUserTemplateSchema = z.object({ siteId: z.string(), templateId: z.string(), confirmName: z.string() });

export const trashedUserTemplateSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  html: z.string(),
  deletedAt: z.coerce.date(),
});

export type RestoreUserTemplateInput = z.infer<typeof restoreUserTemplateSchema>;
export type PurgeUserTemplateInput = z.infer<typeof purgeUserTemplateSchema>;
export type TrashedUserTemplate = z.infer<typeof trashedUserTemplateSchema>;
