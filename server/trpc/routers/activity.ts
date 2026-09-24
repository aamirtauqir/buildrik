import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { assertSiteAccess, PermissionError } from "@/server/services/permission.service";
import { listSiteActivity } from "@/server/services/activity-log.service";
import { siteActivityInput } from "@buildrik/shared/schemas/activity";

export const activityRouter = router({
  // The editor's History › Activity tab (B6). Same access as the site's
  // Overview "Recent Activity" card: any active member of the site's workspace.
  recent: protectedProcedure.input(siteActivityInput).query(async ({ ctx, input }) => {
    try {
      await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.siteId);
    } catch (e) {
      if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
      throw e;
    }
    return listSiteActivity(input.siteId, input.filter);
  }),
});
