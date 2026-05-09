/**
 * P7 — auto-fire AI alt-text generation after image upload.
 *
 * Subscribes to `MEDIA_EVENTS.UPLOAD_COMPLETE` once at mount. For each
 * successful image upload that:
 *   - made it to the server (has `serverId`, `localOnly === false`)
 *   - has no user-typed alt text yet
 *
 * fires `media.generateAltText` and writes the result back via
 * `composer.media.updateAsset` (which re-emits `MEDIA_UPDATED` so the
 * inspector + library pick up the new value).
 *
 * The server is the source of truth for the "user already typed alt text"
 * invariant — see prototype-v3 §25 #3 + alt-text.service.ts. This hook
 * pre-filters obvious skips (non-image, local-only, already-typed) only
 * to avoid a wasted network call; the server still enforces TOCTOU.
 *
 * Mounted at `StudioPanels` so uploads from any surface (Media tab,
 * canvas drag-drop, paste) get auto-tagged.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import { MEDIA_EVENTS } from "../../../shared/constants/media";
import type { MediaAsset } from "../../../shared/types/media";
import { generateAltTextRemote } from "../../../services/AltTextService";

interface UploadCompletePayload {
  success: boolean;
  asset: MediaAsset;
  fileName: string;
}

function shouldAutoGenerate(asset: MediaAsset): boolean {
  if (asset.type !== "image") return false;
  if (asset.localOnly) return false;
  if (!asset.serverId) return false;
  if (typeof asset.altText === "string" && asset.altText.trim().length > 0) return false;
  return true;
}

export function useAltTextAutoTrigger(composer: Composer | null): void {
  React.useEffect(() => {
    if (!composer?.media) return;

    const handler = async (payload: unknown) => {
      const event = payload as UploadCompletePayload;
      if (!event?.success || !event.asset) return;
      const asset = event.asset;
      if (!shouldAutoGenerate(asset)) return;

      const result = await generateAltTextRemote(asset.serverId as string);
      if (!result || result.skipped) return;

      // Re-check at write time: if the user typed alt text between the
      // event firing and the AI returning, don't clobber. The engine
      // asset object is stale (it's the upload payload); read fresh.
      const fresh = composer.media.getAsset(asset.id);
      if (!fresh) return;
      if (typeof fresh.altText === "string" && fresh.altText.trim().length > 0) return;

      await composer.media.updateAsset(asset.id, { altText: result.altText });
    };

    composer.media.on(MEDIA_EVENTS.UPLOAD_COMPLETE, handler);
    return () => {
      composer.media.off(MEDIA_EVENTS.UPLOAD_COMPLETE, handler);
    };
  }, [composer]);
}

export default useAltTextAutoTrigger;
