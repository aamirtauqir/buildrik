import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@server/trpc/router";
import { createTRPCContext } from "@server/trpc/trpc";

/**
 * P0.1b — CSRF defense via Origin pin on mutations.
 *
 * SameSite=lax cookies already block third-party form-submission CSRF,
 * but Origin pinning adds defense-in-depth and rejects accidental
 * cross-origin POSTs from non-allowlisted browsers.
 *
 * Allowed origins:
 * - EDITOR_ORIGIN — editor.buildrik.com (or localhost:5050 dev)
 * - NEXT_PUBLIC_APP_URL — dashboard's own origin (app.buildrik.com)
 *
 * Server-to-server callers (CLI with Bearer token) don't send Origin —
 * those bypass the check but must present Authorization header.
 *
 * GET (queries) skipped: idempotent, no state change, lower CSRF risk.
 */
const ALLOWED_ORIGINS = new Set(
  [
    process.env.EDITOR_ORIGIN || "http://localhost:5050",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ].filter(Boolean)
);

function isAllowedOrigin(req: Request): boolean {
  if (req.method !== "POST") return true;
  const origin = req.headers.get("origin");
  if (!origin) {
    return req.headers.has("authorization");
  }
  return ALLOWED_ORIGINS.has(origin);
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

const handler = async (req: Request) => {
  const cors = corsHeaders(req);
  if (!isAllowedOrigin(req)) {
    return new Response("Forbidden: origin not allowed", {
      status: 403,
      headers: cors,
    });
  }
  const res = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  });
  for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
  return res;
};

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export { handler as GET, handler as POST };
