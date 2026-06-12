import { NextRequest, NextResponse } from "next/server";
import { recordPageView } from "@server/services/analytics.service";
import { checkRateLimit } from "@server/services/rate-limiter";

// First-party analytics beacon. Published sites POST a page-view here on load.
// Public + cross-origin (the deployed site lives on its own host), so it must
// be permissive on CORS but defensive on input + rate-limited per visitor IP.

const TRACK_MAX = 60; // events
const TRACK_WINDOW_MS = 60_000; // per minute per ip+site

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const limit = await checkRateLimit(`track:${siteId}:${ip}`, TRACK_MAX, TRACK_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false }, { status: 429, headers: CORS_HEADERS });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // Beacons may send no/invalid body — treat as a bare pageview.
  }

  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);

  await recordPageView(siteId, {
    path: str(body.path) ?? "/",
    referrer: str(body.referrer) ?? req.headers.get("referer"),
    sessionId: str(body.sessionId),
    userAgent: req.headers.get("user-agent"),
    // Vercel/edge geo header when available.
    country: req.headers.get("x-vercel-ip-country"),
    viewportWidth: num(body.viewportWidth),
  });

  // 204 — beacons ignore the response; keep it tiny.
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
