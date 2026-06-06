/**
 * P7 — editor → server alt-text bridge.
 *
 * Wraps the `media.generateAltText` tRPC mutation so callers can fire-and-
 * forget without try/catch boilerplate. Returns `null` on auth failure,
 * non-image asset, network error, or any other failure mode — the caller
 * (typically `useAltTextAutoTrigger`) treats null as "leave the engine
 * asset's altText alone."
 *
 * Lives next to `AssetUploadService` and `PublishService` — same vendor-
 * bridge tier (engine ↔ tRPC), same client-singleton pattern.
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

export interface AltTextRemoteResult {
  altText: string;
  /**
   * True when the server preserved an existing user-typed alt text instead
   * of overwriting it. Hook treats `skipped` as "do not write back to
   * engine" — engine state already matches what the server kept.
   */
  skipped: boolean;
  model?: string;
}

/**
 * Trigger AI alt-text generation for a server-mirrored MediaAsset. Returns
 * null on any failure or when the server returns `skipped` — caller
 * decides whether/how to apply the result.
 */
export async function generateAltTextRemote(
  assetId: string,
): Promise<AltTextRemoteResult | null> {
  try {
    const result = await getClient().media.generateAltText.mutate({ assetId });
    return result as AltTextRemoteResult;
  } catch {
    return null;
  }
}

/** Test-only: reset the cached tRPC client so vi.mock() takes effect per-test. */
export function __resetAltTextClient() {
  _client = null;
}
