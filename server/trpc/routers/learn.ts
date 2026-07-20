import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { listCoursesForUser, markLessonComplete } from "@/server/services/learn.service";

export const learnRouter = router({
  // Progress is per-user, so this is protected — unlike help.categories, which is
  // public because the same articles are shown to everyone signed out or in.
  list: protectedProcedure.query(({ ctx }) => listCoursesForUser(ctx.session.user.id)),

  complete: protectedProcedure
    .input(z.object({ lessonSlug: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await markLessonComplete(ctx.session.user.id, input.lessonSlug);
      } catch (e) {
        // An unknown slug is a client/UI bug, not a server fault — surface it as
        // a 400 rather than a 500 so it is visible in development.
        if (e instanceof Error && e.message.startsWith("UNKNOWN_LESSON")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown lesson" });
        }
        throw e;
      }
      return { ok: true };
    }),
});
