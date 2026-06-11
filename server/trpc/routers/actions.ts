import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { assertSiteAccess, PermissionError } from "@/server/services/permission.service";
import { signActionToken, verifyActionToken } from "@/server/services/action-token.service";
import { getAction } from "@/server/services/ai-actions.service";

/**
 * Privileged-action platform (phase 3) — propose → confirm-token → execute.
 *
 *   propose: validate the action + args, verify the caller is a site member,
 *            issue a server-signed confirmation token + a consequence string.
 *   confirm: verify the token against the session actor, then execute through
 *            the action's domain path (which re-checks the hard role).
 *
 * No execution happens at propose. The confirm gate (a per-action explicit
 * approval in the editor) sits between the two; it is NEVER folded into the
 * agent's auto-apply.
 */
export const actionsRouter = router({
  propose: protectedProcedure
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
      // Membership gate — never issue a token to a non-member. The hard role
      // (e.g. ADMIN for publish) is re-checked at execute via the domain path.
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      const parsed = def.schema.safeParse(input.args ?? {});
      if (!parsed.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid action args" });
      }
      const token = signActionToken({
        actorId: ctx.session.user!.id!,
        siteId: input.siteId,
        actionId: input.actionId,
        args: parsed.data,
      });
      return { token, confirm: def.describe(parsed.data) };
    }),

  confirm: protectedProcedure
    .input(z.object({ token: z.string().min(1), payload: z.unknown().optional() }))
    .mutation(async ({ ctx, input }) => {
      const v = verifyActionToken(input.token, ctx.session.user!.id!);
      if (!v.ok) {
        throw new TRPCError({ code: "FORBIDDEN", message: `Invalid confirmation token (${v.reason})` });
      }
      const def = getAction(v.claims.actionId);
      if (!def) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown action" });
      }
      const parsed = def.payloadSchema.safeParse(input.payload ?? {});
      if (!parsed.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid action payload" });
      }
      try {
        return await def.execute(ctx, v.claims, parsed.data);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        if (e instanceof Error && e.message === "ALREADY_PUBLISHING") {
          throw new TRPCError({ code: "CONFLICT", message: "A publish job is already in progress." });
        }
        throw e;
      }
    }),
});
