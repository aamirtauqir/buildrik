/**
 * AssetUploadService — Phase B1.4 — editor → Vercel Blob bridge.
 *
 * Wraps `@vercel/blob/client` `upload()` against the dashboard's
 * `/api/asset-upload` route (which Vercel Blob's `handleUpload` helper
 * uses for client-token issuance + auth + quota gating).
 *
 * Why a separate service (vs inline in MediaManager):
 *   Engine code lives in `engine/` and per CLAUDE.md "Import Direction Rules"
 *   may only import from `shared/`. This service lives in `services/`
 *   alongside BuildrikSyncProvider and PublishService — same vendor-bridge
 *   tier. Composer wires this into MediaManager via dependency injection
 *   (the RemoteAssetSync interface in shared/types/), keeping engine pure.
 *
 * @license BSD-3-Clause
 */

import { upload } from "@vercel/blob/client";

const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

export interface UploadBlobResult {
  /** Public URL where Vercel Blob now serves the file. */
  url: string;
  /** Byte size as reported by the upload (mirrors local file.size). */
  bytes: number;
  /** Content-type as accepted by the route's allowedContentTypes filter. */
  contentType: string;
}

/**
 * Upload a File blob to Vercel Blob via the dashboard's signing route.
 *
 * Flow:
 *   1. `@vercel/blob/client` `upload()` POSTs metadata to `/api/asset-upload`
 *      with `clientPayload = JSON.stringify({bytes})` for pre-validation.
 *   2. Dashboard route validates session + quota + size; returns scoped token.
 *   3. Browser uploads file directly to Blob storage using that token.
 *   4. Resolved promise gives us the public URL.
 *
 * Throws on auth failure, quota rejection, oversized file, or network error.
 * Caller (MediaManager via RemoteAssetSync interface) decides retry behavior.
 */
export async function uploadBlob(file: File): Promise<UploadBlobResult> {
  // Path inside Vercel Blob storage. The route's onBeforeGenerateToken
  // returns tokenPayload with userId, so blobs end up scoped per user
  // even though the path here is just a filename.
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: `${DASHBOARD_URL}/api/asset-upload`,
    // Editor's File.size is the canonical bytes count. Sending it as a
    // clientPayload lets the server reject oversized uploads BEFORE
    // issuing a token instead of after the upload finishes.
    clientPayload: JSON.stringify({ bytes: file.size }),
    contentType: file.type || undefined,
  });

  return {
    url: blob.url,
    bytes: file.size,
    contentType: file.type,
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
    // 400 means the route ran (Vercel's handleUpload rejected empty body).
    // 401 means auth failed but route exists.
    // Network error throws.
    return res.status === 400 || res.status === 401;
  } catch {
    return false;
  }
}
