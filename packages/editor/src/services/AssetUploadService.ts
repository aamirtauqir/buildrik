/**
 * AssetUploadService — Phase B1.4 + B2 — editor → Vercel Blob bridge.
 *
 * Two surfaces:
 *   - `uploadBlob(blob, filename, contentType)` — low-level Vercel Blob client
 *     wrapper. Used directly by editor flows that already have a File object.
 *   - `createRemoteAssetSync()` — RemoteAssetSync factory (Phase B2 contract).
 *     Composes the uploadBlob primitive with the tRPC `media.createAsset` /
 *     `media.deleteAsset` mutations. Composer wires the resulting object into
 *     MediaManager via ComposerConfig.remoteSync.
 *
 * Why a separate service (vs inline in MediaManager):
 *   Engine code lives in `engine/` and per CLAUDE.md "Import Direction Rules"
 *   may only import from `shared/`. This service lives in `services/`
 *   alongside BuildrikSyncProvider and PublishService — same vendor-bridge
 *   tier. The RemoteAssetSync interface in `shared/types/media.ts` is the
 *   contract MediaManager depends on; this service is one implementation.
 *
 * @license BSD-3-Clause
 */

import { upload } from "@vercel/blob/client";
import { createBuildrikApiClient } from "@buildrik/shared";
import type { RemoteAssetSync } from "@/shared/types/media";

const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

export interface UploadBlobResult {
  /** Public URL where Vercel Blob now serves the file. */
  url: string;
  /** Byte size as reported by the upload (mirrors local blob.size). */
  bytes: number;
  /** Content-type as accepted by the route's allowedContentTypes filter. */
  contentType: string;
}

/**
 * Upload a Blob to Vercel Blob via the dashboard's signing route.
 *
 * MediaManager passes the post-sanitization, post-optimization Blob (which
 * may differ from the original File — SVG sanitization rewrites the bytes;
 * WebP optimization swaps mime). The filename + contentType are passed
 * separately so we don't depend on File-only metadata.
 *
 * Flow:
 *   1. `@vercel/blob/client` `upload()` POSTs metadata to `/api/asset-upload`
 *      with `clientPayload = JSON.stringify({bytes})` for pre-validation.
 *   2. Dashboard route validates session + quota + size; returns scoped token.
 *   3. Browser uploads file directly to Blob storage using that token.
 *   4. Resolved promise gives us the public URL.
 *
 * Throws on auth failure, quota rejection, oversized file, or network error.
 * Caller decides retry behavior.
 */
export async function uploadBlob(
  blob: Blob,
  filename: string,
  contentType: string,
  /**
   * Phase B5 P1A: full server-side row metadata. The route's
   * onUploadCompleted handler uses these to create the canonical
   * MediaAsset row, closing the quota bypass exploit. Without metadata
   * the server can't create a row, so unscanned blobs would consume
   * storage without quota accounting.
   */
  meta?: {
    type?: "image" | "video" | "icon" | "font";
    folderId?: string | null;
    siteId?: string | null;
  },
): Promise<UploadBlobResult> {
  const result = await upload(filename, blob, {
    access: "public",
    handleUploadUrl: `${DASHBOARD_URL}/api/asset-upload`,
    clientPayload: JSON.stringify({
      bytes: blob.size,
      type: meta?.type,
      mimeType: contentType,
      filename,
      folderId: meta?.folderId ?? null,
      siteId: meta?.siteId ?? null,
    }),
    contentType: contentType || undefined,
  });

  return {
    url: result.url,
    bytes: blob.size,
    contentType,
  };
}

/**
 * Probe whether the upload route is reachable. Used by MediaManager to
 * decide between server-mirroring and local-only paths at startup.
 *
 * Returns false on offline, dashboard unconfigured, or auth fail.
 */
export async function isUploadServiceReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${DASHBOARD_URL}/api/asset-upload`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      // Empty body — Vercel's handleUpload will return 400, but the route
      // itself responds. Network/auth errors give different status codes.
      body: JSON.stringify({}),
    });
    return res.status === 400 || res.status === 401;
  } catch {
    return false;
  }
}

/**
 * Phase B2: build a RemoteAssetSync implementation backed by Vercel Blob
 * + media tRPC. Composer accepts this in ComposerConfig and threads it
 * into MediaManager. Returns null on any failure so MediaManager can
 * fall back to local-only without try/catch noise.
 *
 * Optional siteId scopes assets to a specific site row server-side.
 */
export function createRemoteAssetSync(opts?: { siteId?: string | null }): RemoteAssetSync {
  const siteId = opts?.siteId ?? null;

  return {
    async uploadAndCreate(blob, meta) {
      try {
        // Forward server-row metadata via clientPayload so the route's
        // onUploadCompleted handler can create the canonical MediaAsset
        // row independently (P1A defense in depth).
        const uploaded = await uploadBlob(blob, meta.filename, meta.mimeType, {
          type: meta.type,
          folderId: meta.folderId ?? null,
          siteId: meta.siteId ?? siteId,
        });
        // Client-driven createAsset is now idempotent on URL match
        // server-side. If onUploadCompleted already created the row,
        // this returns the existing one. If completion hasn't fired
        // yet, this creates and the completion handler is the no-op.
        const created = (await getClient().media.createAsset.mutate({
          url: uploaded.url,
          bytes: meta.bytes,
          type: meta.type,
          mimeType: meta.mimeType,
          filename: meta.filename,
          folderId: meta.folderId ?? null,
          siteId: meta.siteId ?? siteId,
        })) as { id: string; url: string; bytes: number };
        return { serverId: created.id, url: uploaded.url };
      } catch {
        // Auth / quota / network — caller falls back to localOnly + retry queue.
        return null;
      }
    },

    async deleteRemote(serverId) {
      try {
        await getClient().media.deleteAsset.mutate({ assetId: serverId });
        return true;
      } catch (err) {
        // 404 = already gone, treat as success. Anything else = transient.
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("NOT_FOUND") || message.includes("not found")) return true;
        return false;
      }
    },

    async createFolder(input) {
      try {
        const created = (await getClient().media.createFolder.mutate({
          name: input.name,
          parentId: input.parentId ?? null,
          siteId: input.siteId ?? siteId,
        })) as { id: string };
        return { serverId: created.id };
      } catch {
        return null;
      }
    },

    async deleteFolder(serverId) {
      try {
        await getClient().media.deleteFolder.mutate({ folderId: serverId });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("NOT_FOUND") || message.includes("not found")) return true;
        return false;
      }
    },

    async moveAsset(serverId, folderId) {
      try {
        await getClient().media.moveAsset.mutate({
          assetId: serverId,
          folderId: folderId,
        });
        return true;
      } catch {
        return false;
      }
    },
  };
}
