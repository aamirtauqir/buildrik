/**
 * Site component-master schemas (#4/27, 2026-06-24). Server mirror of the
 * editor's local component library so masters are shared across an agency's
 * client sites + survive device/cache loss. `payload` is the full engine
 * ComponentDefinition, validated loosely as a JSON object.
 *
 * @license BSD-3-Clause
 */
import { z } from "zod";

export const upsertSiteComponentSchema = z.object({
  siteId: z.string(),
  /** Engine ComponentDefinition.id — canonical key for dedupe + restore. */
  componentId: z.string(),
  name: z.string().min(1).max(200),
  /** Full engine ComponentDefinition. */
  payload: z.record(z.unknown()),
  createdBy: z.string().nullable().optional(),
  /** Scope (board 6971:77663): omitted/null = "This site"; a page id of this
   *  site = "This page". */
  pageId: z.string().nullable().optional(),
});

export const listSiteComponentsSchema = z.object({ siteId: z.string() });
export const getSiteComponentSchema = z.object({ siteId: z.string(), componentId: z.string() });
// ─── Component trash (design-2l9 K18–K20, K42) ─────────────────────────────
// A deleted master stays in "Recently deleted" for
// COMPONENT_TRASH_RETENTION_DAYS, then the retention purge removes it.

export const COMPONENT_TRASH_RETENTION_DAYS = 30;

/** What a delete detached, kept with the trashed row so a restore can re-link
 *  the instances whose element nobody changed since (fingerprint equal). */
export const componentTrashInfoSchema = z.object({
  instances: z
    .array(z.object({ record: z.record(z.unknown()), fingerprint: z.string().max(64) }))
    .max(2000),
  pageCount: z.number().int().min(0),
});

export const deleteSiteComponentSchema = z.object({
  siteId: z.string(),
  componentId: z.string(),
  trash: componentTrashInfoSchema.optional(),
});

export const listComponentTrashSchema = z.object({ siteId: z.string() });
export const restoreComponentsSchema = z.object({
  siteId: z.string(),
  componentIds: z.array(z.string()).min(1).max(100),
});
/** ADMIN only; the dialog's typed word (board 217:42370). */
export const purgeComponentsSchema = z.object({
  siteId: z.string(),
  componentIds: z.array(z.string()).min(1).max(100),
  confirm: z.literal("DELETE"),
});

export const trashedComponentSchema = z.object({
  componentId: z.string(),
  name: z.string(),
  deletedAt: z.date(),
  deletedBy: z.object({ id: z.string(), name: z.string().nullable(), isYou: z.boolean() }).nullable(),
  /** Null = the delete did not record it (workspace library). */
  detached: z.object({ instances: z.number().int(), pages: z.number().int() }).nullable(),
});
// C1/C3: blast-radius for a component master (which sites carry it).
export const componentUsageSchema = z.object({ componentId: z.string() });
// P6 shared library: rename a component master across the workspace (ADMIN).
export const renameWorkspaceComponentSchema = z.object({
  componentId: z.string(),
  name: z.string().min(1).max(200),
});

/** FROM LIBRARY (board 4418:99857) — the workspace's shared masters, seen
 *  from one site. */
export const componentLibrarySchema = z.object({ siteId: z.string() });
export const libraryComponentSchema = z.object({ siteId: z.string(), componentId: z.string() });

export type UpsertSiteComponentInput = z.infer<typeof upsertSiteComponentSchema>;
export type ListSiteComponentsInput = z.infer<typeof listSiteComponentsSchema>;
export type GetSiteComponentInput = z.infer<typeof getSiteComponentSchema>;
export type DeleteSiteComponentInput = z.infer<typeof deleteSiteComponentSchema>;
export type ComponentTrashInfo = z.infer<typeof componentTrashInfoSchema>;
export type RestoreComponentsInput = z.infer<typeof restoreComponentsSchema>;
export type PurgeComponentsInput = z.infer<typeof purgeComponentsSchema>;
export type TrashedComponent = z.infer<typeof trashedComponentSchema>;
