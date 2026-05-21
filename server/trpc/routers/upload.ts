import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createPresignedUrl, confirmUpload, getUploadLimits } from "@/server/services/upload.service";
import { presignSchema, confirmSchema } from "@buildrik/shared/schemas/upload";

async function getWorkspaceId(ctx: any): Promise<string> {
  const member = await ctx.prisma.workspaceMember.findFirst({
    where: { userId: ctx.session.user.id },
    select: { workspaceId: true },
  });
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
  return member.workspaceId;
}

export const uploadRouter = router({
  presign: protectedProcedure.input(presignSchema).mutation(async ({ ctx, input }) => {
    const wsId = await getWorkspaceId(ctx);
    try {
      return await createPresignedUrl(input, ctx.session.user.id, wsId);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "INVALID_FORMAT") throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid file format for this upload type." });
      if (e instanceof Error && e.message === "FILE_TOO_LARGE") throw new TRPCError({ code: "BAD_REQUEST", message: "File exceeds size limit." });
      throw e;
    }
  }),
  confirm: protectedProcedure.input(confirmSchema).mutation(async ({ input }) => {
    try {
      return await confirmUpload(input.fileId);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Upload not found or expired." });
      if (e instanceof Error && e.message === "NOT_UPLOADED") throw new TRPCError({ code: "BAD_REQUEST", message: "File was not uploaded before confirm. Call PUT /api/upload/{fileId} with the file body first." });
      throw e;
    }
  }),
  limits: protectedProcedure.query(() => getUploadLimits()),
});
