import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import { isFeatureEnabled } from "@/server/services/feature-flag.service";
import { checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";
import { getHandoverRollup } from "@/server/services/handover.service";

/**
 * Agency handover (P6) — the per-site launch-checklist rollup. Part of the
 * agency layer: flag off → [] so a non-agency workspace shows an empty section
 * instead of erroring (mirrors reviews.list). Admin-gated — handover is a
 * portfolio-owner view, not a per-editor one.
 */
export const handoverRouter = router({
  rollup: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = await resolveWorkspaceId(ctx);
    if (!(await isFeatureEnabled(workspaceId, "agency_layer"))) return [];
    try {
      await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "ADMIN");
    } catch (e) {
      if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
      throw e;
    }
    return getHandoverRollup(workspaceId);
  }),
});
