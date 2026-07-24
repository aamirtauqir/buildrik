/**
 * POST /api/site-thumbnail/[siteId]
 *
 * Receives a PNG preview of a rendered site (captured client-side in the editor
 * at publish/save time) and stores it on the site as its grid/detail thumbnail.
 * Uploads to Vercel Blob (same backend as /api/upload) under a stable per-site
 * key so a re-capture overwrites the previous one, then writes Site.thumbnail.
 *
 * The capture is best-effort and non-blocking on the client — this route never
 * needs to succeed for a publish to succeed. It still enforces auth + edit
 * access so one workspace can't set another's thumbnail.
 *
 * @license BSD-3-Clause
 */

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@server/auth";
import { assertSiteEditAccess, setSiteThumbnail } from "@server/services/sites.service";
import { PermissionError } from "@server/services/permission.service";

// A page screenshot is small; cap so a runaway capture can't push a huge blob.
const MAX_BYTES = 3 * 1024 * 1024;
// Site ids are cuids. Constrain the shape before it reaches the blob key so a
// crafted siteId can't shape the storage path (e.g. traversal-looking keys).
const SITE_ID_RE = /^[a-z0-9]{20,32}$/;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
): Promise<NextResponse> {
  const { siteId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (!SITE_ID_RE.test(siteId)) {
    return NextResponse.json({ error: "Invalid site id" }, { status: 400 });
  }

  // Authorize BEFORE the blob write. The blob key is a predictable per-site path
  // (sites/<id>/thumbnail.png), so writing first would let any authenticated
  // user overwrite another site's thumbnail blob even though the DB update would
  // then fail. Gate on edit access up front.
  try {
    await assertSiteEditAccess(session.user.id, siteId);
  } catch (e) {
    if (e instanceof PermissionError) {
      const status = e.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: e.message }, { status });
    }
    throw e;
  }

  const contentType = req.headers.get("content-type") || "";
  if (contentType !== "image/png") {
    return NextResponse.json({ error: "Expected image/png" }, { status: 400 });
  }

  const body = await req.arrayBuffer();
  if (body.byteLength === 0) {
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  }
  if (body.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Thumbnail too large" }, { status: 413 });
  }

  try {
    const blob = await put(`sites/${siteId}/thumbnail.png`, body, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    // setSiteThumbnail enforces edit access; a non-member gets FORBIDDEN below.
    await setSiteThumbnail(session.user.id, siteId, blob.url);
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (e) {
    if (e instanceof PermissionError) {
      const status = e.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: e.message }, { status });
    }
    const msg = e instanceof Error ? e.message : "Thumbnail upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
