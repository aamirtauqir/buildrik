import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import { listWorkspaceFeatures, setFeature } from "@/server/services/feature-flag.service";
import { featureKeySchema } from "@buildrik/shared/schemas/feature-flags";
import { checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";

export const featuresRouter = router({
  // Any workspace member may read which flags are on (drives conditional UI).
  // Scoped through the shared resolveWorkspaceId, which only resolves an ACTIVE
  // membership — a removed member's stale session can't read another workspace's
  // flags. (This router used to carry its own looser lookup; consolidated.)
  list: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = await resolveWorkspaceId(ctx);
    return listWorkspaceFeatures(workspaceId);
  }),

  // Toggling a flag is the runtime kill-switch — Admin only.
  set: protectedProcedure
    .input(z.object({ key: featureKeySchema, enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      try {
        await checkWorkspaceRole(ctx.prisma, ctx.session!.user.id, workspaceId, "ADMIN");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      await setFeature(workspaceId, input.key, input.enabled);
      return { ok: true as const };
    }),
});
