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
   * True when nothing was generated: the server kept user-typed alt text, or
   * declined an automatic request (`reason`). Hook treats `skipped` as "do not
   * write back to engine".
   */
  skipped: boolean;
  reason?: "AUTO_OFF" | "ALREADY_GENERATED";
  model?: string;
}

/** How long one read of the workspace flag answers for — a bulk drop asks once. */
const AUTO_FLAG_TTL_MS = 60_000;
let _autoFlag: { at: number; value: Promise<boolean> } | null = null;

/**
 * L4-007: whether the workspace turned on automatic alt text (paid AI, off by
 * default). Unknown — signed out, unreachable, the flag absent — reads as off:
 * an opt-in is never assumed. The server enforces the same flag; this only
 * saves the upload hook a request it would decline.
 */
export function autoAltTextEnabled(): Promise<boolean> {
  if (_autoFlag && Date.now() - _autoFlag.at < AUTO_FLAG_TTL_MS) return _autoFlag.value;
  const value = getClient()
    .features.list.query()
    .then((flags) => (flags as { auto_alt_text?: boolean }).auto_alt_text === true)
    .catch(() => false);
  _autoFlag = { at: Date.now(), value };
  return value;
}

/**
 * Trigger AI alt-text generation for a server-mirrored MediaAsset. Returns
 * null on any failure or when the server returns `skipped` — caller
 * decides whether/how to apply the result.
 */
export async function generateAltTextRemote(
  assetId: string,
  /** `force`: the library's explicit Regenerate — replace existing alt text.
   *  `trigger: "auto"`: the upload hook — held to the workspace opt-in, once
   *  per asset, never forcing, so a typed alt text is never lost. */
  opts: { force?: boolean; trigger?: "auto" } = {},
): Promise<AltTextRemoteResult | null> {
  try {
    const result = await getClient().media.generateAltText.mutate(
      opts.trigger === "auto" ? { assetId, trigger: "auto" } : opts.force ? { assetId, force: true } : { assetId },
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
  _autoFlag = null;
}
