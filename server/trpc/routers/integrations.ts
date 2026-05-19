import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc/trpc";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";
import { cookies } from "next/headers";

const PENDING_COOKIE = "buildrik_vercel_pending";

const PendingPayload = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  accessToken: z.string(),
  vercelUserId: z.string(),
  teamId: z.string().nullable(),
  configurationId: z.string().nullable(),
  candidateTeams: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string() })),
  exp: z.number(),
});

export const vercelIntegrationsRouter = router({
  getConnection: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      const row = await prisma.workspaceIntegration.findFirst({
        where: { workspaceId: input.workspaceId, provider: "vercel" },
      });
      if (!row) return { connected: false as const };
      const config = row.config as Record<string, unknown>;
      return {
        connected: true as const,
        teamId: typeof config.teamId === "string" ? config.teamId : null,
        vercelUserId: typeof config.vercelUserId === "string" ? config.vercelUserId : null,
        isActive: row.isActive,
      };
    }),

  finishConnect: protectedProcedure
    .input(z.object({ workspaceId: z.string(), teamId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user!.id!;
      try {
        await checkWorkspaceRole(prisma, userId, input.workspaceId, "ADMIN");
      } catch (err) {
        if (err instanceof PermissionError) {
          throw new TRPCError({ code: "FORBIDDEN", message: "FORBIDDEN: requires OWNER or ADMIN role" });
        }
        throw err;
      }

      const cookieStore = await cookies();
      const cookie = cookieStore.get(PENDING_COOKIE);
      if (!cookie?.value) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "PENDING_COOKIE_MISSING" });
      }

      let payload: z.infer<typeof PendingPayload>;
      try {
        payload = PendingPayload.parse(JSON.parse(decrypt(cookie.value)));
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "PENDING_COOKIE_CORRUPT" });
      }

      if (payload.workspaceId !== input.workspaceId || payload.userId !== userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "PENDING_MISMATCH" });
      }
      if (Date.now() > payload.exp) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "PENDING_EXPIRED" });
      }

      const finalTeamId = input.teamId ?? payload.teamId;
      const configData = {
        encryptedToken: encrypt(payload.accessToken),
        teamId: finalTeamId,
        vercelUserId: payload.vercelUserId,
        configurationId: payload.configurationId,
        connectedAt: new Date().toISOString(),
        connectedBy: userId,
      };

      await prisma.workspaceIntegration.upsert({
        where: { workspaceId_provider: { workspaceId: input.workspaceId, provider: "vercel" } },
        create: {
          workspaceId: input.workspaceId,
          provider: "vercel",
          isActive: true,
          config: configData,
        },
        update: {
          isActive: true,
          config: configData,
        },
      });

      cookieStore.delete(PENDING_COOKIE);

      await prisma.auditLog.create({
        data: {
          userId,
          action: "vercel.integration.connected",
          status: "ok",
          metadata: JSON.stringify({ workspaceId: input.workspaceId, teamId: finalTeamId }),
        },
      });

      return { success: true };
    }),

  disconnect: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user!.id!;
      try {
        await checkWorkspaceRole(prisma, userId, input.workspaceId, "ADMIN");
      } catch (err) {
        if (err instanceof PermissionError) {
          throw new TRPCError({ code: "FORBIDDEN", message: "FORBIDDEN: requires OWNER or ADMIN role" });
        }
        throw err;
      }

      const row = await prisma.workspaceIntegration.findFirst({
        where: { workspaceId: input.workspaceId, provider: "vercel" },
      });
      if (!row) return { success: true };

      const config = row.config as Record<string, unknown>;
      const configurationId = typeof config.configurationId === "string" ? config.configurationId : null;

      if (configurationId) {
        try {
          const token = decrypt(
            typeof config.encryptedToken === "string" ? config.encryptedToken : "",
          );
          await fetch(
            `https://api.vercel.com/v1/integrations/configuration/${configurationId}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
        } catch (err) {
          // best-effort; proceed with local delete regardless
          console.warn("[vercel] disconnect revoke failed:", err);
        }
      }

      await prisma.workspaceIntegration.delete({ where: { id: row.id } });

      await prisma.auditLog.create({
        data: {
          userId,
          action: "vercel.integration.disconnected",
          status: "ok",
          metadata: JSON.stringify({ workspaceId: input.workspaceId }),
        },
      });

      return { success: true };
    }),
});
