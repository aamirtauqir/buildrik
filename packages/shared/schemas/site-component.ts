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
});

export const listSiteComponentsSchema = z.object({ siteId: z.string() });
export const getSiteComponentSchema = z.object({ siteId: z.string(), componentId: z.string() });
export const deleteSiteComponentSchema = z.object({ siteId: z.string(), componentId: z.string() });
// C1/C3: blast-radius for a component master (which sites carry it).
export const componentUsageSchema = z.object({ componentId: z.string() });
// P6 shared library: rename a component master across the workspace (ADMIN).
export const renameWorkspaceComponentSchema = z.object({
  componentId: z.string(),
  name: z.string().min(1).max(200),
});

export type UpsertSiteComponentInput = z.infer<typeof upsertSiteComponentSchema>;
export type ListSiteComponentsInput = z.infer<typeof listSiteComponentsSchema>;
export type GetSiteComponentInput = z.infer<typeof getSiteComponentSchema>;
export type DeleteSiteComponentInput = z.infer<typeof deleteSiteComponentSchema>;
