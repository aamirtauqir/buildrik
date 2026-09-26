/**
 * Site version-history schemas (#3/26, 2026-06-24). Server mirror of the
 * editor's local version history so it's shared per-site + survives device /
 * cache loss. `payload` is the full engine NamedVersion (snapshot + metadata),
 * validated loosely as a JSON object — the engine owns its exact shape.
 *
 * @license BSD-3-Clause
 */
import { z } from "zod";

/** SSOT for a version's name length cap — shared by the schema below and the
 *  editor's rename input (VersionList.tsx), so the client can never type
 *  past what the server will accept. */
export const VERSION_NAME_MAX = 200;

export const createSiteVersionSchema = z.object({
  siteId: z.string(),
  /** Engine NamedVersion.id — canonical key for dedupe + restore. */
  versionId: z.string(),
  name: z.string().min(1).max(VERSION_NAME_MAX),
  isAuto: z.boolean().default(false),
  /** Full engine NamedVersion (includes the project snapshot). */
  payload: z.record(z.unknown()),
  createdBy: z.string().nullable().optional(),
});

export const listSiteVersionsSchema = z.object({ siteId: z.string() });
export const getSiteVersionSchema = z.object({ siteId: z.string(), versionId: z.string() });
export const deleteSiteVersionSchema = z.object({ siteId: z.string(), versionId: z.string() });
export const renameSiteVersionSchema = z.object({
  siteId: z.string(),
  versionId: z.string(),
  name: z.string().min(1).max(VERSION_NAME_MAX),
});

export type CreateSiteVersionInput = z.infer<typeof createSiteVersionSchema>;
export type ListSiteVersionsInput = z.infer<typeof listSiteVersionsSchema>;
export type GetSiteVersionInput = z.infer<typeof getSiteVersionSchema>;
export type DeleteSiteVersionInput = z.infer<typeof deleteSiteVersionSchema>;
export type RenameSiteVersionInput = z.infer<typeof renameSiteVersionSchema>;
