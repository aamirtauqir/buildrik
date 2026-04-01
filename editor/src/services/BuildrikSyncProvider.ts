/**
 * BuildrikSyncProvider — Dashboard tRPC API integration for cloud sync
 *
 * Loads and saves site data from the Buildrik dashboard backend via tRPC.
 * Used when the editor is opened from the dashboard with a siteId query param.
 *
 * @module services/BuildrikSyncProvider
 * @license BSD-3-Clause
 */

import type { ProjectData } from "@/shared/types/project";
import type { ElementData } from "@/shared/types/element";

const API_BASE = "/api/trpc";

interface TRPCResponse<T> {
  result: { data: T };
}

interface SiteResponse {
  id: string;
  name: string;
}

interface PageResponse {
  id: string;
  name: string;
  slug: string;
  isHomePage: boolean;
  blocks: ElementData | null;
  position: number;
}

async function trpcQuery<T>(
  procedure: string,
  input: Record<string, unknown>
): Promise<T> {
  const params = new URLSearchParams({
    input: JSON.stringify(input),
  });
  const res = await fetch(`${API_BASE}/${procedure}?${params}`, {
    credentials: "include",
  });

  if (res.status === 401) {
    window.location.href = "/auth/login";
    throw new Error("AUTH_EXPIRED");
  }

  if (!res.ok) {
    throw new Error(`API_ERROR_${res.status}`);
  }

  const json: TRPCResponse<T> = await res.json();
  return json.result.data;
}

async function trpcMutation<T>(
  procedure: string,
  input: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${API_BASE}/${procedure}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (res.status === 401) {
    window.location.href = "/auth/login";
    throw new Error("AUTH_EXPIRED");
  }

  if (!res.ok) {
    throw new Error(`API_ERROR_${res.status}`);
  }

  const json: TRPCResponse<T> = await res.json();
  return json.result.data;
}

const DEFAULT_ROOT: ElementData = {
  id: "root",
  type: "container",
  children: [],
};

export async function loadProject(siteId: string): Promise<ProjectData> {
  const site = await trpcQuery<SiteResponse>("sites.get", { id: siteId });
  const pages = await trpcQuery<PageResponse[]>("pages.list", { siteId });

  return {
    version: "1.0",
    pages: pages
      .sort((a, b) => a.position - b.position)
      .map((p) => ({
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
): Promise<{ success: boolean; savedAt: string }> {
  return trpcMutation("sites.saveProject", { siteId, projectData });
}

export function getSiteIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("siteId");
}

/**
 * Returns StorageConfig handlers for the Buildrik dashboard API.
 * Wire into AquibraStudio via options.storage.handlers.
 *
 * Usage from the dashboard page that embeds the editor:
 * ```
 * const siteId = getSiteIdFromUrl();
 * <AquibraStudio
 *   options={{
 *     storage: {
 *       type: "none" as any,
 *       autoSave: true,
 *       autoSaveInterval: 5000,
 *       handlers: siteId ? getBuildrikStorageHandlers(siteId) : undefined,
 *     },
 *   }}
 * />
 * ```
 *
 * NOTE: StorageAdapter routes to `handlers` only via its `default` switch branch,
 * so the consuming page must pass a storage type that falls through to default
 * (e.g., cast `"buildrik"` as the type). Until StorageAdapter is updated to check
 * handlers first, the recommended integration is via `onReady` + Composer methods:
 *
 * ```
 * onReady={(composer) => {
 *   const siteId = getSiteIdFromUrl();
 *   if (siteId) initBuildrikSync(composer, siteId);
 * }}
 * ```
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
  composer: { importProject: (data: ProjectData) => void; exportProject: () => ProjectData; on: (event: string, cb: () => void) => void },
  siteId: string
): Promise<void> {
  const data = await loadProject(siteId);
  composer.importProject(data);

  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  composer.on("project:changed", () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveProject(siteId, composer.exportProject()).catch(() => {
        /* save error — silently retry on next change */
      });
    }, 5000);
  });
}
