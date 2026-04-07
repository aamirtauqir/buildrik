/**
 * BuildrikSyncProvider — Dashboard tRPC API integration for cloud sync
 *
 * Loads and saves site data from the Buildrik dashboard backend via tRPC.
 * Used when the editor is opened from the dashboard with a siteId query param.
 *
 * @module services/BuildrikSyncProvider
 * @license BSD-3-Clause
 */

import { createBuildrikApiClient } from "@buildrik/shared";
import type { ProjectData } from "@/shared/types/project";
import type { ElementData } from "@/shared/types/element";

const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

const DEFAULT_ROOT: ElementData = {
  id: "root",
  type: "container",
  children: [],
};

export async function loadProject(siteId: string): Promise<ProjectData> {
  const client = getClient();
  const site = await client.sites.get.query({ id: siteId });
  const pages = await client.pages.list.query({ siteId });

  return {
    version: "1.0",
    pages: pages
      .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      .map((p: { id: string; name: string; slug: string; isHomePage: boolean; blocks?: ElementData }) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        isHome: p.isHomePage,
        root: p.blocks ?? DEFAULT_ROOT,
      })),
    styles: [],
    assets: [],
    metadata: { name: site.name },
  };
}

export async function saveProject(
  siteId: string,
  projectData: ProjectData
): Promise<{ success: boolean; savedAt: Date }> {
  return getClient().sites.saveProject.mutate({ siteId, projectData });
}

export function getSiteIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("siteId");
}

/**
 * Returns StorageConfig handlers for the Buildrik dashboard API.
 * Wire into AquibraStudio via options.storage.handlers.
 */
export function getBuildrikStorageHandlers(siteId: string) {
  return {
    load: () => loadProject(siteId),
    save: (data: ProjectData) =>
      saveProject(siteId, data).then(() => undefined),
  };
}

/**
 * Initialize Buildrik sync on a Composer instance.
 * Loads the project and sets up auto-save on PROJECT_CHANGED events.
 */
export async function initBuildrikSync(
  composer: {
    importProject: (data: ProjectData) => void;
    exportProject: () => ProjectData;
    on: (event: string, cb: () => void) => void;
  },
  siteId: string,
  onSaveError?: (error: Error) => void
): Promise<void> {
  const data = await loadProject(siteId);
  composer.importProject(data);

  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  composer.on("project:changed", () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const projectData = composer.exportProject();
      saveProject(siteId, projectData).catch((err: unknown) => {
        const error =
          err instanceof Error ? err : new Error("Save failed");
        console.error("[BuildrikSync] save failed, retrying once:", error.message);
        saveProject(siteId, projectData).catch((retryErr: unknown) => {
          const retryError =
            retryErr instanceof Error ? retryErr : new Error("Save retry failed");
          console.error("[BuildrikSync] retry failed:", retryError.message);
          onSaveError?.(retryError);
        });
      });
    }, 5000);
  });
}
