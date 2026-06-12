import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createPresignedUrl, confirmUpload, getUploadLimits } from "@/server/services/upload.service";
import { presignSchema, confirmSchema } from "@buildrik/shared/schemas/upload";
import { resolveWorkspaceId as getWorkspaceId } from "@/server/trpc/workspace-ctx";

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
  confirm: protectedProcedure.input(confirmSchema).mutation(async ({ ctx, input }) => {
    try {
      return await confirmUpload(input.fileId, ctx.session.user.id);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Upload not found or expired." });
      if (e instanceof Error && e.message === "NOT_UPLOADED") throw new TRPCError({ code: "BAD_REQUEST", message: "File was not uploaded before confirm. Call PUT /api/upload/{fileId} with the file body first." });
      throw e;
    }
  }),
  limits: protectedProcedure.query(() => getUploadLimits()),
});
