/**
 * PUT /api/upload/[fileId]
 *
 * Receives the file body for an upload previously registered via
 * trpc.upload.presign. Pairs with the in-memory pendingUploads table in
 * server/services/upload.service.ts.
 *
 * Used by site-detail/settings-tab + seo-tab for favicon, og-image, etc.
 * Distinct from the larger media upload flow at /api/asset-upload, which
 * uses Vercel Blob direct-upload + writes MediaAsset rows.
 *
 * Persists the body to Vercel Blob (same backend as /api/asset-upload) and
 * records the real URL on the pending entry. trpc.upload.confirm then reads
 * that URL and hands it back to the client.
 *
 * @license BSD-3-Clause
 */

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@server/auth";
import {
  getPendingUpload,
  setPendingUploadStoredUrl,
  validateUpload,
} from "@server/services/upload.service";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
): Promise<NextResponse> {
  const { fileId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const pending = await getPendingUpload(fileId);
  if (!pending) {
    return NextResponse.json({ error: "Upload not found or expired" }, { status: 404 });
  }
  if (pending.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (contentType !== pending.fileType) {
    return NextResponse.json(
      { error: `Content-Type mismatch (expected ${pending.fileType}, got ${contentType})` },
      { status: 400 },
    );
  }

  const body = await req.arrayBuffer();
  const sizeMB = body.byteLength / (1024 * 1024);
  try {
    validateUpload(pending.context, pending.fileType, sizeMB);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid upload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Store under a stable key derived from context + ids so re-uploads of the
  // same logical asset (favicon, og-image) replace the prior blob. Vercel
  // Blob will dedup or rotate per its own rules.
  const pathname = buildBlobPath(pending);

  try {
    const blob = await put(pathname, body, {
      access: "public",
      contentType: pending.fileType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    await setPendingUploadStoredUrl(fileId, blob.url);
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Blob upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildBlobPath(pending: NonNullable<Awaited<ReturnType<typeof getPendingUpload>>>): string {
  const ext = guessExt(pending.fileType, pending.fileName);
  const ctx = pending.context;
  const wsId = pending.wsId;
  const siteId = pending.siteId ?? "global";
  if (ctx === "avatar") return `avatars/${pending.userId}/avatar${ext}`;
  if (ctx === "workspace_icon") return `workspaces/${wsId}/icon${ext}`;
  if (ctx === "favicon") return `sites/${siteId}/favicon${ext}`;
  if (ctx === "touch_icon") return `sites/${siteId}/touch-icon${ext}`;
  if (ctx === "og_image") return `sites/${siteId}/og-image${ext}`;
  if (ctx === "site_media") return `media/${wsId}/${pending.fileName}`;
  if (ctx === "ticket") return `tickets/${pending.userId}/${pending.fileName}`;
  return `uploads/${wsId}/${pending.fileName}`;
}

function guessExt(mime: string, fallback: string): string {
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/x-icon": ".ico",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "application/pdf": ".pdf",
  };
  if (map[mime]) return map[mime];
  const idx = fallback.lastIndexOf(".");
  return idx >= 0 ? fallback.slice(idx) : "";
}
