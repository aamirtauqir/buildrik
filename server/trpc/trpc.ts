import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { checkRateLimit } from "@/server/services/rate-limiter";

export const createTRPCContext = async (opts?: { headers?: Headers }) => {
  const session = await auth();
  return { prisma, session, headers: opts?.headers };
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

  // Verify DB session is still active — enables real session revocation.
  // Sessions without a dbSessionId are legacy pre-v0.1.1 tokens; allow them through
  // so existing sessions aren't broken on deploy.
  const dbSessionId = ctx.session.user.dbSessionId;
  if (dbSessionId) {
    const activeSession = await ctx.prisma.session.findFirst({
      where: { sessionToken: dbSessionId, expires: { gt: new Date() } },
      select: { id: true },
    });
    if (!activeSession) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired or revoked" });
    }
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
