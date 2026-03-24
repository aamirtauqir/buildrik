import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  listCategories,
  searchArticles,
  getArticle,
  submitFeedback,
  createTicket,
} from "@/server/services/help.service";
import { supportTicketSchema } from "@/lib/validations/help";

export const helpRouter = router({
  categories: publicProcedure.query(() => listCategories()),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1).max(200) }))
    .query(async ({ input }) => searchArticles(input.query)),

  article: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const article = await getArticle(input.slug);
      if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      return article;
    }),

  feedback: publicProcedure
    .input(z.object({ articleId: z.string(), helpful: z.boolean() }))
    .mutation(async ({ input }) => {
      await submitFeedback(input.articleId, input.helpful);
      return { ok: true };
    }),

  createTicket: protectedProcedure
    .input(supportTicketSchema)
    .mutation(async ({ ctx, input }) => {
      return createTicket(ctx.session.user.id, input);
    }),
});
