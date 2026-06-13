/**
 * MediaVersionService — Editor → dashboard asset-version bridge.
 *
 * Companion to AssetUploadService. Calls the `media.listAssetVersions`,
 * `media.createAssetVersion`, and `media.restoreAssetVersion` tRPC endpoints
 * (server-side version history keyed on the dashboard MediaAsset id). The
 * editor's media items expose that id as `LibraryItem.assetId` (from
 * MediaAsset.serverId), so the detail drawer's Versions tab can read + restore
 * the real history rather than only the local sibling-file heuristic.
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

/** Restore: point the parent asset back at this version's URL/bytes. */
export async function restoreAssetVersion(versionId: string): Promise<{ id: string; url: string }> {
  return (await getClient().media.restoreAssetVersion.mutate({ versionId })) as { id: string; url: string };
}
