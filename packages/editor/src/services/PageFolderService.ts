/**
 * PageFolderService — the Pages panel's personal folders, on the server
 * (`pages.folders.*`, stored per user × site). Every call resolves `null` on
 * failure (offline, demo with no dashboard, refused): the caller keeps its
 * local copy and reconciles on the next successful read.
 *
 * @license BSD-3-Clause
 */
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import type { PageFolder } from "@buildrik/shared/schemas/pages";

/* Full `pages.folders.<proc>` chains, not a cached `.folders` handle: the
   tRPC orphan gate finds callers by that dotted path. */
const api = () => getBuildrikClient(DASHBOARD_URL);

async function orNull<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

export const pageFolderRemote = {
  list: (siteId: string): Promise<PageFolder[] | null> => orNull(() => api().pages.folders.list.query({ siteId })),
  create: (siteId: string, name: string): Promise<PageFolder | null> =>
    orNull(() => api().pages.folders.create.mutate({ siteId, name })),
  update: (folderId: string, patch: { name?: string; collapsed?: boolean }): Promise<PageFolder | null> =>
    orNull(() => api().pages.folders.update.mutate({ folderId, ...patch })),
  remove: (folderId: string): Promise<{ success: true } | null> => orNull(() => api().pages.folders.delete.mutate({ folderId })),
  movePage: (siteId: string, pageId: string, folderId: string | null): Promise<PageFolder[] | null> =>
    orNull(() => api().pages.folders.movePage.mutate({ siteId, pageId, folderId })),
};
