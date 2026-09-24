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
import { DEFAULT_MODEL } from "@buildrik/shared/schemas/ai";

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
  /** `force`: the library's explicit Regenerate — replace existing alt text.
   *  The upload auto-trigger omits it, so a typed alt text is never lost. */
  opts: { force?: boolean } = {},
): Promise<AltTextRemoteResult | null> {
  try {
    const result = await getClient().media.generateAltText.mutate(
      opts.force ? { assetId, force: true } : { assetId },
    );
    return result as AltTextRemoteResult;
  } catch {
    return null;
  }
}

/**
 * An explicit Regenerate: ask the server to REPLACE the alt text, then write
 * it to the engine asset with its AI provenance. One path for the library's
 * details rail and the drawer's asset hub. `null` = the model could not be
 * reached (or the asset has no server row); `skipped` = the server kept text
 * the user wrote.
 */
export async function regenerateAltText(
  media: {
    updateAsset(
      id: string,
      updates: { altText: string; generatedMetadata: { altText: { generatedAt: string; model: string } } },
    ): Promise<unknown>;
  },
  id: string,
  assetId: string,
): Promise<AltTextRemoteResult | null> {
  const result = await generateAltTextRemote(assetId, { force: true });
  if (!result || result.skipped) return result;
  await media.updateAsset(id, {
    altText: result.altText,
    generatedMetadata: { altText: { generatedAt: new Date().toISOString(), model: result.model ?? DEFAULT_MODEL } },
  });
  return result;
}

/** Test-only: reset the cached tRPC client so vi.mock() takes effect per-test. */
export function __resetAltTextClient() {
  _client = null;
}
