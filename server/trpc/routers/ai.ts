import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  generateContent,
  generatePage,
  generateLayout,
} from "@/server/services/ai.service";

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
});
