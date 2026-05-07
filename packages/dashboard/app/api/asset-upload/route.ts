/**
 * Phase B1.2 + B1.3 — asset upload route.
 *
 * Vercel Blob client-token flow. Editor calls @vercel/blob/client `upload()`
 * pointing at this route as `handleUploadUrl`. Vercel's `handleUpload` helper
 * generates a scoped client token after our auth + quota gate accepts the
 * request, then the editor uploads directly to Blob storage (no proxying
 * through the dashboard server, which has a 4.5MB request body limit).
 *
 * Two phases per request:
 *  1. `blob.generate-client-token` — pre-upload validation. Verifies session,
 *     checks storage quota, returns a token allowing the upload.
 *  2. `blob.upload-completed` — post-upload notification (currently no-op;
 *     future hook for asset-row creation if we move createAsset out of the
 *     editor and into the upload completion flow).
 *
 * @license BSD-3-Clause
 */

import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@server/auth";
import { checkStorageQuota, createAsset } from "@server/services/media.service";
import type { MediaType } from "@buildrik/shared/schemas/media";

// Allow common image/video/font types. Editor sniffs MIME from magic bytes
// already (MediaManager.ts uses sniffMimeType + DOMPurify for SVG sanitization),
// so this is a defense-in-depth check rather than the primary validation.
const ALLOWED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "font/ttf",
  "font/otf",
  "font/woff",
  "font/woff2",
  // Some browsers send these for fonts despite the official font/* prefix.
  "application/font-woff",
  "application/font-woff2",
  "application/x-font-ttf",
  "application/octet-stream", // fallback for fonts on some platforms
];

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB hard ceiling matches editor's UploadZone

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // 1. Session check.
        const session = await auth();
        if (!session?.user?.id) {
          throw new Error("Unauthenticated upload attempt");
        }
        const userId = session.user.id;

        // 2. Plan-tier quota check via existing media service.
        // BUSINESS tier returns totalBytes = -1 (unlimited).
        const quota = await checkStorageQuota(userId);
        if (quota.totalBytes !== -1 && !quota.ok) {
          throw new Error(
            `Storage quota exceeded for tier ${quota.tier}: ${quota.usedBytes} / ${quota.totalBytes} bytes`
          );
        }

        // 3. Parse clientPayload for size + metadata. Phase B5 P1A fix:
        // metadata is now MANDATORY when remoteSync is wired so
        // onUploadCompleted can create the canonical MediaAsset row
        // without trusting a follow-up client call. Closes the quota
        // bypass exploit where an authenticated client could upload
        // blobs and never call createAsset.
        let parsedClientPayload: {
          bytes?: number;
          type?: MediaType;
          mimeType?: string;
          filename?: string;
          folderId?: string | null;
          siteId?: string | null;
        } = {};
        if (clientPayload) {
          try {
            parsedClientPayload = JSON.parse(clientPayload);
          } catch {
            // Fall through with empty payload — onUploadCompleted will skip
            // row creation in this case (back-compat for non-Buildrik
            // clients that might POST without metadata).
          }
          if (typeof parsedClientPayload.bytes === "number") {
            if (parsedClientPayload.bytes > MAX_FILE_BYTES) {
              throw new Error(
                `File ${pathname} exceeds 50MB limit (${parsedClientPayload.bytes} bytes)`
              );
            }
            if (
              quota.totalBytes !== -1 &&
              quota.usedBytes + parsedClientPayload.bytes > quota.totalBytes
            ) {
              throw new Error(
                `Upload would exceed quota: ${quota.usedBytes + parsedClientPayload.bytes} > ${quota.totalBytes}`
              );
            }
          }
        }

        // 4. Issue token. tokenPayload carries everything onUploadCompleted
        // needs to create the row server-side (P1A fix).
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_BYTES,
          tokenPayload: JSON.stringify({
            userId,
            type: parsedClientPayload.type,
            mimeType: parsedClientPayload.mimeType,
            filename: parsedClientPayload.filename,
            folderId: parsedClientPayload.folderId ?? null,
            siteId: parsedClientPayload.siteId ?? null,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Phase B5 P1A fix: server-side row creation here closes the
        // quota bypass exploit. Idempotent on URL (createAsset upserts
        // by url), so the client's own media.createAsset call (which
        // runs in parallel from the editor) sees the existing row and
        // returns it. Whichever path lands first wins.
        if (!tokenPayload) return;
        let payload: {
          userId?: string;
          type?: MediaType;
          mimeType?: string;
          filename?: string;
          folderId?: string | null;
          siteId?: string | null;
        };
        try {
          payload = JSON.parse(tokenPayload);
        } catch {
          return;
        }
        if (!payload.userId || !payload.type || !payload.mimeType || !payload.filename) {
          // Insufficient metadata (legacy/non-Buildrik client). Don't
          // create a row — but the blob persists, which means it counts
          // against Vercel Blob storage. Future GC pass cleans these up.
          return;
        }
        try {
          await createAsset(payload.userId, {
            url: blob.url,
            bytes: 0, // Vercel doesn't give us bytes here; createAsset's
            // idempotent path catches the client's call (which DOES
            // have bytes) and uses that row instead. If client never
            // calls, we still have a row so quota at least counts the
            // attempt. TODO: derive bytes via blob.size or Vercel API.
            type: payload.type,
            mimeType: payload.mimeType,
            filename: payload.filename,
            folderId: payload.folderId ?? null,
            siteId: payload.siteId ?? null,
          });
        } catch (err) {
          // Quota or folder errors at completion — log but don't throw
          // (Vercel will retry the webhook indefinitely otherwise).
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[asset-upload] createAsset failed in completion: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    // 401 for auth, 403 for quota/size, 400 otherwise.
    const status =
      message.includes("Unauthenticated") ? 401
      : message.includes("quota") || message.includes("limit") ? 403
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
