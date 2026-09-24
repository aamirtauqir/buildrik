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

const client = () => getBuildrikClient(DASHBOARD_URL).pages.folders;

async function orNull<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

export const pageFolderRemote = {
  list: (siteId: string): Promise<PageFolder[] | null> => orNull(() => client().list.query({ siteId })),
  create: (siteId: string, name: string): Promise<PageFolder | null> =>
    orNull(() => client().create.mutate({ siteId, name })),
  update: (folderId: string, patch: { name?: string; collapsed?: boolean }): Promise<PageFolder | null> =>
    orNull(() => client().update.mutate({ folderId, ...patch })),
  remove: (folderId: string): Promise<{ success: true } | null> => orNull(() => client().delete.mutate({ folderId })),
  movePage: (siteId: string, pageId: string, folderId: string | null): Promise<PageFolder[] | null> =>
    orNull(() => client().movePage.mutate({ siteId, pageId, folderId })),
};
