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

  // Bearer fallback: if no cookie session and an Authorization header is
  // present, try to verify it as an API token. Bearer-auth shapes the same
  // session.user.id contract so downstream protectedProcedure stays unchanged.
  let bearerSession: BearerSession | null = null;
  if (!session?.user) {
    const bearer = extractBearer(opts?.headers);
    if (bearer) {
      const verified = await verifyApiToken(bearer);
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
  }

  const effectiveSession = session ?? bearerSession;
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
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } });
});

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
