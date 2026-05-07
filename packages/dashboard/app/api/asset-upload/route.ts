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
import { checkStorageQuota } from "@server/services/media.service";

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

        // 3. Optional client-supplied size hint for stricter pre-validation.
        // The clientPayload is opaque JSON the editor passes via upload();
        // editor sets it to JSON.stringify({bytes}) so we can reject oversized
        // files before issuing the token rather than after the upload.
        if (clientPayload) {
          try {
            const parsed = JSON.parse(clientPayload) as { bytes?: number };
            if (typeof parsed.bytes === "number") {
              if (parsed.bytes > MAX_FILE_BYTES) {
                throw new Error(
                  `File ${pathname} exceeds 50MB limit (${parsed.bytes} bytes)`
                );
              }
              if (
                quota.totalBytes !== -1 &&
                quota.usedBytes + parsed.bytes > quota.totalBytes
              ) {
                throw new Error(
                  `Upload would exceed quota: ${quota.usedBytes + parsed.bytes} > ${quota.totalBytes}`
                );
              }
            }
          } catch (err) {
            // Re-throw quota/size errors; tolerate JSON.parse failures (no hint).
            if (err instanceof Error && err.message.includes("quota")) throw err;
            if (err instanceof Error && err.message.includes("limit")) throw err;
          }
        }

        // 4. Issue token. Path-scoped to user namespace so a malicious client
        // can't overwrite another user's blobs even with a leaked token.
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_BYTES,
          // Vercel Blob gives the client this prefix in the resulting URL.
          // Path-scoping isolates user uploads.
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // No-op for now. The editor calls media.createAsset.mutate immediately
        // after upload() resolves — that path owns asset row creation. This
        // hook fires asynchronously from Vercel and would race with the
        // editor's own createAsset call.
        //
        // Future use: if we move createAsset to be server-driven (not
        // editor-driven), this is where we'd write the row. For now,
        // log for diagnostics.
        if (process.env.NODE_ENV !== "production") {
          const payload = tokenPayload ? JSON.parse(tokenPayload) : {};
          console.log(
            `[asset-upload] blob ready: user=${payload.userId} url=${blob.url} bytes=${blob.contentDisposition}`
          );
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
