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
import { prisma } from "@/lib/prisma";
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

        // 3. Parse clientPayload — REQUIRED. Phase B5+ codex re-review
        // P1A fix: previously the route would issue a token when payload
        // was missing/unparseable, which let an authenticated client
        // upload blobs without ever creating a MediaAsset row. Now we
        // require complete metadata up-front so onUploadCompleted always
        // has what it needs to create the canonical row.
        if (!clientPayload) {
          throw new Error("Asset upload requires clientPayload metadata");
        }
        let parsedClientPayload: {
          bytes?: number;
          type?: MediaType;
          mimeType?: string;
          filename?: string;
          folderId?: string | null;
          siteId?: string | null;
        };
        try {
          parsedClientPayload = JSON.parse(clientPayload);
        } catch {
          throw new Error("Asset upload clientPayload is not valid JSON");
        }
        // bytes + type + mimeType + filename are mandatory. siteId/folderId optional.
        if (typeof parsedClientPayload.bytes !== "number") {
          throw new Error("Asset upload clientPayload missing 'bytes'");
        }
        if (!parsedClientPayload.type) {
          throw new Error("Asset upload clientPayload missing 'type'");
        }
        if (!parsedClientPayload.mimeType) {
          throw new Error("Asset upload clientPayload missing 'mimeType'");
        }
        if (!parsedClientPayload.filename) {
          throw new Error("Asset upload clientPayload missing 'filename'");
        }
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

        // Phase B5+ codex re-review pass 3 P1 fix: validate folderId
        // ownership BEFORE issuing the token. Pre-fix, an attacker
        // could request a token with a fake/stolen folderId, upload
        // the blob, and then both onUploadCompleted's createAsset
        // call AND the client's defense-in-depth createAsset call
        // would throw FOLDER_NOT_FOUND — the blob exists in storage
        // with no row tracking it, no quota deduction, no cleanup
        // path. Validating ownership here aborts the flow before
        // the token mints anything.
        if (parsedClientPayload.folderId) {
          const folder = await prisma.mediaFolder.findUnique({
            where: { id: parsedClientPayload.folderId },
            select: { userId: true },
          });
          if (!folder || folder.userId !== userId) {
            throw new Error(
              `Asset upload folderId not owned by user: ${parsedClientPayload.folderId}`
            );
          }
        }

        // 4. Issue token. tokenPayload carries everything onUploadCompleted
        // needs to create the row server-side. bytes included so the
        // completion handler doesn't store bytes:0 (P1A bytes=0 fix).
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_BYTES,
          tokenPayload: JSON.stringify({
            userId,
            bytes: parsedClientPayload.bytes,
            type: parsedClientPayload.type,
            mimeType: parsedClientPayload.mimeType,
            filename: parsedClientPayload.filename,
            folderId: parsedClientPayload.folderId ?? null,
            siteId: parsedClientPayload.siteId ?? null,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Phase B5+ codex re-review fix: token issuance now REQUIRES
        // complete metadata, so this handler always has what it needs.
        // No graceful fallthrough on missing fields — onBeforeGenerateToken
        // would have thrown earlier. createAsset is upsert-by-url
        // server-side, idempotent under client+webhook racing.
        if (!tokenPayload) return;
        let payload: {
          userId: string;
          bytes: number;
          type: MediaType;
          mimeType: string;
          filename: string;
          folderId: string | null;
          siteId: string | null;
        };
        try {
          payload = JSON.parse(tokenPayload);
        } catch {
          // Token corruption — shouldn't happen since we control the
          // tokenPayload. Log + abort. Vercel won't retry further.
          if (process.env.NODE_ENV !== "production") {
            console.warn("[asset-upload] tokenPayload not valid JSON");
          }
          return;
        }
        // Phase B5++++ codex re-review pass 5 P2 fix [folder TOCTOU]:
        // if the folder was deleted between token issuance and upload
        // completion, fall back to creating the asset at root rather
        // than failing. Pre-fix the FOLDER_NOT_FOUND throw left the
        // blob orphaned (no row, no quota deduction); the editor's
        // client-side createAsset call ALSO failed; MediaManager then
        // queued a localOnly retry which uploaded a SECOND blob,
        // wasting storage. Falling back to root preserves the user's
        // upload without producing a duplicate blob, matching the
        // semantic that local deleteFolder already moves orphaned
        // assets to root.
        try {
          await createAsset(payload.userId, {
            url: blob.url,
            bytes: payload.bytes,
            type: payload.type,
            mimeType: payload.mimeType,
            filename: payload.filename,
            folderId: payload.folderId ?? null,
            siteId: payload.siteId ?? null,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message === "FOLDER_NOT_FOUND" && payload.folderId) {
            // Folder went away mid-flight. Retry at root.
            try {
              await createAsset(payload.userId, {
                url: blob.url,
                bytes: payload.bytes,
                type: payload.type,
                mimeType: payload.mimeType,
                filename: payload.filename,
                folderId: null,
                siteId: payload.siteId ?? null,
              });
            } catch (rootErr) {
              // Phase B5+++++ codex re-review pass 6 P3 fix: log
              // root-fallback failures in production too. Pre-fix the
              // log was gated to non-prod; if the fallback ALSO failed
              // in production the orphan blob recreated invisibly with
              // no cleanup signal. console.error makes it visible to
              // log aggregators / Vercel's runtime logs. We don't
              // throw because Vercel would retry the webhook
              // indefinitely on permanent errors like quota.
              console.error(
                `[asset-upload] createAsset root-fallback failed: ${rootErr instanceof Error ? rootErr.message : String(rootErr)}`,
              );
            }
            return;
          }
          // Quota or other errors at completion — log but don't throw
          // (Vercel will retry the webhook indefinitely otherwise).
          // Pass 6 P3 fix: log in prod too so orphan-blob causes are
          // diagnosable from runtime logs.
          console.error(
            `[asset-upload] createAsset failed in completion: ${message}`,
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
