import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  listFormBlocks,
  listSubmissions,
  updateSubmission,
  deleteSubmission,
  exportSubmissions,
} from "@/server/services/form-submission.service";
import { listSubmissionsSchema, updateSubmissionSchema } from "@buildrik/shared/schemas/forms";

export const formsRouter = router({
  listBlocks: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .query(({ input }) => listFormBlocks(input.siteId)),

  listSubmissions: protectedProcedure
    .input(listSubmissionsSchema)
    .query(({ input }) => listSubmissions(input)),

  updateSubmission: protectedProcedure
    .input(updateSubmissionSchema)
    .mutation(({ input }) => updateSubmission(input)),

  deleteSubmission: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => deleteSubmission(input.id)),

  exportSubmissions: protectedProcedure
    .input(z.object({
      siteId: z.string(),
      formBlockId: z.string(),
      format: z.enum(["csv", "json"]),
    }))
    .query(({ input }) => exportSubmissions(input.siteId, input.formBlockId, input.format)),
});
