import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { checkRateLimit } from "@/server/services/rate-limiter";
import { extractBearer, verifyApiToken, type Scope } from "@/server/services/api-token.service";

interface BearerSession {
  user: { id: string };
  apiToken: { workspaceId: string; scopes: Scope[]; tokenId: string };
}

export const createTRPCContext = async (opts?: { headers?: Headers }) => {
  const session = await auth();

  // Always look at the Authorization header — even when a cookie session
  // exists. If both are present we treat the request as bearer-auth: the
  // protectedProcedure deny-by-default + scope enforcement must apply, or
  // the token's restrictions silently evaporate. Codex pass-3 P2.
  let bearerSession: BearerSession | null = null;
  const bearerToken = extractBearer(opts?.headers);
  if (bearerToken) {
    const verified = await verifyApiToken(bearerToken);
    if (verified) {
      bearerSession = {
        user: { id: verified.userId },
        apiToken: {
          workspaceId: verified.workspaceId,
          scopes: verified.scopes,
          tokenId: verified.tokenId,
        },
      };
    }
  }

  // Effective identity: bearer wins when present (more restrictive). Cookie
  // session falls through only when no Authorization header was supplied.
  const effectiveSession = bearerSession ?? session;
  return { prisma, session: effectiveSession, bearer: bearerSession, headers: opts?.headers };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        cause: error.cause instanceof Error ? undefined : error.cause,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Cookie-session-only protected procedure. Denies bearer tokens by default —
 * API tokens must use `scopedProcedure(scope)` so the requested capability is
 * declared against the token's allowlist. This prevents tokens issued with a
 * narrow scope (e.g. `redirects:read`) from reaching unrelated mutations
 * (`siteDetail.settings.update`, billing routes) that share the same procedure.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.bearer) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "API tokens cannot use this endpoint. Use a session-authenticated request, " +
        "or call a scope-tagged endpoint that matches your token's scopes.",
    });
  }
  return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } });
});

/**
 * Procedure that accepts either a cookie session (full access) OR a bearer
 * token whose scope list includes `requiredScope`. Use for endpoints intended
 * to be reachable from API tokens. Downstream handlers should still pass
 * `ctx.bearer` to `assertSiteAccess`/`checkSiteRole` so the resource's
 * workspaceId is cross-checked against the token's workspaceId.
 */
export function scopedProcedure(requiredScope: Scope) {
  return t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (ctx.bearer && !ctx.bearer.apiToken.scopes.includes(requiredScope)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `API token is missing required scope: ${requiredScope}`,
      });
    }
    return next({
      ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } },
    });
  });
}

export function createRateLimitedProcedure(maxAttempts: number, windowMs: number) {
  return publicProcedure.use(async ({ ctx, path, next }) => {
    const forwarded = ctx.headers?.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const key = `${ip}:${path}`;
    const result = checkRateLimit(key, maxAttempts, windowMs);
    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Please try again later.",
      });
    }
    return next();
  });
}
