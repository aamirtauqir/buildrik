import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  createApiToken,
  listApiTokens,
  revokeApiToken,
  deleteApiToken,
  ALL_SCOPES,
  type Scope,
} from "@/server/services/api-token.service";
import { checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";

const scopeSchema = z.enum(ALL_SCOPES as [Scope, ...Scope[]]);

async function assertWorkspaceMember(
  prisma: typeof import("@/lib/prisma").prisma,
  userId: string,
  workspaceId: string,
): Promise<void> {
  // Mirror permission.service: only ACTIVE members may manage API tokens.
  // Suspended / pending members keep their workspace_member row but lose
  // access to other workspace operations — token management must follow.
  const member = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!member) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this workspace." });
  }
}

// Minting/revoking API tokens grants programmatic access to the workspace —
// ADMIN, not any member. (Tokens are deny-all today because no scopedProcedure
// consumes them, but gate now so it's not a live hole the day one ships.)
async function assertWorkspaceAdmin(
  prisma: typeof import("@/lib/prisma").prisma,
  userId: string,
  workspaceId: string,
): Promise<void> {
  try {
    await checkWorkspaceRole(prisma, userId, workspaceId, "ADMIN");
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}

export const apiTokensRouter = router({
  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.prisma, ctx.session.user!.id!, input.workspaceId);
      return listApiTokens(input.workspaceId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().min(1).max(64),
        scopes: z.array(scopeSchema).min(1),
        expiresAt: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceAdmin(ctx.prisma, ctx.session.user!.id!, input.workspaceId);
      const result = await createApiToken({
        userId: ctx.session.user!.id!,
        workspaceId: input.workspaceId,
        name: input.name,
        scopes: input.scopes,
        expiresAt: input.expiresAt ?? null,
      });
      // Plaintext returned ONCE. Caller must persist immediately.
      return result;
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const token = await ctx.prisma.apiToken.findUnique({
        where: { id: input.id },
        select: { workspaceId: true, name: true },
      });
      if (!token) throw new TRPCError({ code: "NOT_FOUND" });
      await assertWorkspaceAdmin(ctx.prisma, ctx.session.user!.id!, token.workspaceId);
      const result = await revokeApiToken(input.id);
      // Log via the workspace's activity feed (no specific siteId).
      await ctx.prisma.activityLog.create({
        data: {
          workspaceId: token.workspaceId,
          actorId: ctx.session.user!.id!,
          action: "workspace.api_token.revoked",
          targetType: "apiToken",
          targetId: input.id,
          description: `API token "${token.name}" revoked`,
          metadata: { name: token.name },
        },
      }).catch(() => {});
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const token = await ctx.prisma.apiToken.findUnique({
        where: { id: input.id },
        select: { workspaceId: true, name: true },
      });
      if (!token) throw new TRPCError({ code: "NOT_FOUND" });
      await assertWorkspaceAdmin(ctx.prisma, ctx.session.user!.id!, token.workspaceId);
      return deleteApiToken(input.id);
    }),
});
