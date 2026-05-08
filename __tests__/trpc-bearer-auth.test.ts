import { describe, it, expect, vi } from "vitest";
import { TRPCError, initTRPC } from "@trpc/server";

/**
 * Bearer-auth surface tests for codex P1-H2 / P1-H3 / P2-H4 remediation.
 *
 * The real `protectedProcedure` and `scopedProcedure` live in `server/trpc/trpc.ts`.
 * They depend on Prisma + NextAuth, which are infeasible to wire in unit tests.
 * Replicate the middleware bodies here against a fresh `initTRPC` instance and
 * exercise the same semantics. If the production implementation diverges from
 * these expectations the contract is broken.
 */

interface BearerSession {
  user: { id: string };
  apiToken: { workspaceId: string; scopes: string[]; tokenId: string };
}

interface TestContext {
  session: { user: { id: string } } | BearerSession | null;
  bearer: BearerSession | null;
}

const t = initTRPC.context<TestContext>().create();

const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (ctx.bearer) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "API tokens cannot use this endpoint.",
    });
  }
  return next({ ctx });
});

function scopedProcedure(requiredScope: string) {
  return t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    if (ctx.bearer && !ctx.bearer.apiToken.scopes.includes(requiredScope)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `API token is missing required scope: ${requiredScope}`,
      });
    }
    return next({ ctx });
  });
}

const appRouter = t.router({
  protectedEcho: protectedProcedure.query(({ ctx }) => ({ id: ctx.session!.user.id })),
  scopedRead: scopedProcedure("redirects:read").query(({ ctx }) => ({
    id: ctx.session!.user.id,
  })),
  scopedWrite: scopedProcedure("redirects:write").mutation(({ ctx }) => ({
    id: ctx.session!.user.id,
  })),
});

function cookieCtx(userId = "u1"): TestContext {
  return { session: { user: { id: userId } }, bearer: null };
}

function bearerCtx(opts: { userId?: string; workspaceId: string; scopes: string[] }): TestContext {
  const session: BearerSession = {
    user: { id: opts.userId ?? "u1" },
    apiToken: {
      workspaceId: opts.workspaceId,
      scopes: opts.scopes,
      tokenId: "tok_test",
    },
  };
  return { session, bearer: session };
}

describe("protectedProcedure: cookie session only", () => {
  it("rejects requests with no session", async () => {
    const caller = appRouter.createCaller({ session: null, bearer: null });
    await expect(caller.protectedEcho()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("accepts a cookie-session request", async () => {
    const caller = appRouter.createCaller(cookieCtx());
    await expect(caller.protectedEcho()).resolves.toEqual({ id: "u1" });
  });

  it("rejects bearer-authenticated requests with FORBIDDEN (codex P1-H3)", async () => {
    const caller = appRouter.createCaller(
      bearerCtx({ workspaceId: "ws-A", scopes: ["redirects:read", "redirects:write"] }),
    );
    await expect(caller.protectedEcho()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("protectedProcedure: mixed-auth (cookie + bearer header) is treated as bearer", () => {
  // The mixed-auth request shape: caller has a valid session cookie AND
  // an Authorization header. createTRPCContext promotes bearer when present
  // so protectedProcedure's deny-by-default still fires. Codex pass-3 P2.
  it("rejects mixed-auth requests at protectedProcedure (bearer takes precedence)", async () => {
    const mixed = bearerCtx({ workspaceId: "ws-A", scopes: ["redirects:read"] });
    // Mixed simulates the caller; createTRPCContext output: bearer non-null,
    // session resolves to bearer's user. Both fields populated.
    const caller = appRouter.createCaller(mixed);
    await expect(caller.protectedEcho()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("scopedProcedure on mixed-auth still requires the scope to be on the token", async () => {
    const caller = appRouter.createCaller(
      bearerCtx({ workspaceId: "ws-A", scopes: ["redirects:read"] }),
    );
    // Token has read but not write — write must still be denied even if a
    // session cookie was also present at request time.
    await expect(caller.scopedWrite()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("scopedProcedure: cookie OR bearer-with-scope", () => {
  it("accepts cookie-session for any scope-tagged endpoint (full session perms)", async () => {
    const caller = appRouter.createCaller(cookieCtx());
    await expect(caller.scopedRead()).resolves.toEqual({ id: "u1" });
    await expect(caller.scopedWrite()).resolves.toEqual({ id: "u1" });
  });

  it("accepts bearer when scope list includes the required scope", async () => {
    const caller = appRouter.createCaller(
      bearerCtx({ workspaceId: "ws-A", scopes: ["redirects:read"] }),
    );
    await expect(caller.scopedRead()).resolves.toEqual({ id: "u1" });
  });

  it("rejects bearer when scope list omits the required scope", async () => {
    const caller = appRouter.createCaller(
      bearerCtx({ workspaceId: "ws-A", scopes: ["redirects:read"] }),
    );
    // Token has redirects:read but not redirects:write — write must be denied.
    await expect(caller.scopedWrite()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects bearer with empty scope list against any scope-tagged endpoint", async () => {
    const caller = appRouter.createCaller(bearerCtx({ workspaceId: "ws-A", scopes: [] }));
    await expect(caller.scopedRead()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// api-tokens.assertWorkspaceMember (codex P2-H4) ACTIVE filter is a static
// query shape — exhaustive coverage lives at the source line. A grep test is
// the cheapest way to lock the predicate against regression.
describe("api-tokens.assertWorkspaceMember source predicate", () => {
  it("includes status: \"ACTIVE\" in the workspaceMember.findFirst predicate", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const root = path.resolve(import.meta.dirname, "..");
    const src = await fs.readFile(
      path.join(root, "server/trpc/routers/api-tokens.ts"),
      "utf-8",
    );
    // Match the ACTIVE filter inside the assertWorkspaceMember helper.
    const pattern = /workspaceMember\.findFirst\([\s\S]*?where:\s*\{[^}]*status:\s*"ACTIVE"/;
    expect(src).toMatch(pattern);
  });
});
