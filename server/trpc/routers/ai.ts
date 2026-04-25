import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  generateContent,
  generatePage,
  generateLayout,
  summarizeChanges,
  suggestMilestone,
} from "../../services/ai.service";
import { streamContent } from "../../services/ai.service";
import { checkQuota, recordUsage } from "../../services/quota.service";
import { modelSchema, DEFAULT_MODEL } from "../../services/types";

const contentInputSchema = z.object({
  prompt: z.string().min(1).max(5000),
  type: z.enum(["content", "layout", "section"]),
  options: z
    .object({
      tone: z.string().optional(),
      length: z.string().optional(),
    })
    .optional(),
});

const pageInputSchema = z.object({
  pageType: z.enum(["landing", "portfolio", "product", "pricing", "blog"]),
  description: z.string().min(1).max(5000),
  style: z.enum(["modern", "minimal", "bold"]),
});

const layoutInputSchema = z.object({
  prompt: z.string().min(1).max(5000),
  sectionType: z.string().optional(),
});

const summarizeInputSchema = z.object({
  versionName: z.string().min(1).max(200),
  changes: z.object({
    elementName: z.string(),
    summary: z.object({
      style: z.number().int().nonnegative(),
      text: z.number().int().nonnegative(),
      layout: z.number().int().nonnegative(),
      content: z.number().int().nonnegative(),
      other: z.number().int().nonnegative(),
    }),
    changes: z.array(
      z.object({
        type: z.enum(["style", "text", "layout", "content", "other"]),
        property: z.string(),
        before: z.string(),
        after: z.string(),
      })
    ),
  }),
});

const milestoneSuggestInputSchema = z.object({
  recentChanges: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        timestamp: z.number(),
        type: z.enum(["checkpoint", "patch"]),
      })
    )
    .max(50),
  pageStructure: z
    .object({
      pageCount: z.number().int().nonnegative(),
      elementCount: z.number().int().nonnegative(),
    })
    .optional(),
});

const scopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("element"), id: z.string().min(1) }),
  z.object({ kind: z.literal("page") }),
]);

const streamPromptInputSchema = z.object({
  prompt: z.string().min(1).max(5000),
  scope: scopeSchema,
  model: modelSchema.default(DEFAULT_MODEL),
});

export const aiRouter = router({
  content: protectedProcedure
    .input(contentInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await generateContent(input);
      } catch (e: unknown) {
        if (
          e instanceof Error &&
          "status" in e &&
          (e as { status: number }).status === 429
        ) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "OpenAI rate limit exceeded. Please try again later.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            e instanceof Error ? e.message : "Content generation failed",
        });
      }
    }),

  page: protectedProcedure
    .input(pageInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await generatePage(input);
      } catch (e: unknown) {
        if (
          e instanceof Error &&
          "status" in e &&
          (e as { status: number }).status === 429
        ) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "OpenAI rate limit exceeded. Please try again later.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            e instanceof Error ? e.message : "Page generation failed",
        });
      }
    }),

  layout: protectedProcedure
    .input(layoutInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await generateLayout(input);
      } catch (e: unknown) {
        if (
          e instanceof Error &&
          "status" in e &&
          (e as { status: number }).status === 429
        ) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "OpenAI rate limit exceeded. Please try again later.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            e instanceof Error ? e.message : "Layout generation failed",
        });
      }
    }),

  summarize: protectedProcedure
    .input(summarizeInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await summarizeChanges(input.versionName, input.changes);
      } catch (e: unknown) {
        const err = e as { status?: number; message?: string };
        if (err.status === 429) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "AI rate limit exceeded. Please try again later.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message ?? "Summary generation failed",
        });
      }
    }),

  milestoneSuggest: protectedProcedure
    .input(milestoneSuggestInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await suggestMilestone(input.recentChanges, input.pageStructure);
      } catch (e: unknown) {
        const err = e as { status?: number; message?: string };
        if (err.status === 429) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "AI rate limit exceeded. Please try again later.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message ?? "Milestone suggestion failed",
        });
      }
    }),

  getQuotaStatus: protectedProcedure.query(async ({ ctx }) => {
    return checkQuota(ctx.session.user.id);
  }),

  streamPrompt: protectedProcedure
    .input(streamPromptInputSchema)
    .subscription(async function* ({ ctx, input, signal }) {
      const userId = ctx.session.user.id;
      const quota = await checkQuota(userId);
      if (!quota.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Daily limit reached (${quota.limit}). Resets at ${quota.resetsAt.toISOString()}.`,
        });
      }
      const ac = signal ?? new AbortController().signal;
      for await (const chunk of streamContent(input.prompt, input.model, ac)) {
        yield chunk;
      }
      await recordUsage(userId, input.model);
    }),
});
