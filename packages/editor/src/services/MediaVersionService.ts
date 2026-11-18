/**
 * MediaVersionService — Editor → dashboard asset-version bridge.
 *
 * Companion to AssetUploadService. Calls the `media.listAssetVersions` and
 * `media.createAssetVersion` tRPC endpoints (server-side version history
 * keyed on the dashboard MediaAsset id). The editor's media items expose that
 * id as `LibraryItem.assetId` (from MediaAsset.serverId), so the detail
 * drawer's Versions view can list the real history.
 *
 * @license BSD-3-Clause
 */

import { createBuildrikApiClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

export interface AssetVersion {
  id: string;
  assetId: string;
  url: string;
  bytes: number;
  edits: unknown;
  // tRPC (superjson) deserializes the Prisma timestamp to a Date on the client.
  createdAt: string | Date;
  /** Bare id of who saved this version (never a relation — see the schema note). */
  createdBy?: string | null;
  /** Board Assets 4418:62883's author line ("Ali", "Sara"). Absent = unknown author. */
  createdByName?: string | null;
}

/** Server-side version history for a synced asset, newest first. */
export async function listAssetVersions(assetId: string): Promise<AssetVersion[]> {
  return (await getClient().media.listAssetVersions.query({ assetId })) as unknown as AssetVersion[];
}

/** Record a version snapshot of the asset (subject to the plan's version cap). */
export async function createAssetVersion(input: {
  assetId: string;
  url: string;
  bytes: number;
  edits: Record<string, unknown>;
}): Promise<AssetVersion> {
  return (await getClient().media.createAssetVersion.mutate(input)) as unknown as AssetVersion;
}
