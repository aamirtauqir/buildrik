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
