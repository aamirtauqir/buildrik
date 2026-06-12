import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { checkSiteRole, PermissionError } from "@/server/services/permission.service";
import {
  createConfirmation,
  consumeConfirmation,
} from "@/server/services/action-confirmation.service";
import { getAction } from "@/server/services/ai-actions.service";
import { checkRateLimit } from "@/server/services/rate-limiter";

/**
 * Privileged-action platform — propose → single-use confirm → execute.
 *
 *   propose: validate the action + args, check the caller has the action's role
 *            (fail non-admins HERE, the correct failure point), issue a single-use
 *            confirmation grant + a consequence string.
 *   confirm: atomically CONSUME the grant (one execution, before expiry, matching
 *            actor), then execute through the action's domain path (which re-checks
 *            the role). The grant is single-use, so a captured token can't be
 *            replayed.
 *
 * Both procedures are rate-limited per user+action — these mint/spend privileged
 * grants, not ordinary reads.
 */
const rateLimitedAction = protectedProcedure.use(async ({ ctx, path, next }) => {
  const key = `action:${ctx.session.user!.id!}:${path}`;
  if (!(await checkRateLimit(key, 20, 60_000)).allowed) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many action requests. Try again shortly." });
  }
  return next();
});

export const actionsRouter = router({
  propose: rateLimitedAction
    .input(
      z.object({
        siteId: z.string().min(1),
        actionId: z.string().min(1).max(64),
        args: z.unknown().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const def = getAction(input.actionId);
      if (!def) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown action: ${input.actionId}` });
      }
      // Role gate at propose — non-admins fail here, not after they read the
      // consequence and click confirm. Execute re-checks via the domain path.
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, def.minRole);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      const parsed = def.schema.safeParse(input.args ?? {});
      if (!parsed.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid action args" });
      }
      const token = await createConfirmation({
        actorId: ctx.session.user!.id!,
        siteId: input.siteId,
        actionId: input.actionId,
        args: parsed.data,
      });
      return { token, confirm: def.describe(parsed.data) };
    }),

  confirm: rateLimitedAction
    .input(z.object({ token: z.string().min(1), payload: z.unknown().optional() }))
    .mutation(async ({ ctx, input }) => {
      const consumed = await consumeConfirmation(input.token, ctx.session.user!.id!);
      if (!consumed.ok) {
        throw new TRPCError({ code: "FORBIDDEN", message: `Invalid confirmation (${consumed.reason})` });
      }
      const def = getAction(consumed.claims.actionId);
      if (!def) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown action" });
      }
      const parsed = def.payloadSchema.safeParse(input.payload ?? {});
      if (!parsed.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid action payload" });
      }
      try {
        return await def.execute(ctx, { actorId: ctx.session.user!.id!, ...consumed.claims }, parsed.data);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        if (e instanceof Error && e.message === "ALREADY_PUBLISHING") {
          throw new TRPCError({ code: "CONFLICT", message: "A publish job is already in progress." });
        }
        throw e;
      }
    }),
});
