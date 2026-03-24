import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { listPages, getPage, createPage, updatePage, deletePage } from "@/server/services/page.service";
import { createPageSchema, updatePageSchema, deletePageSchema } from "@/lib/validations/pages";

export const pagesRouter = router({
  list: protectedProcedure.input(z.object({ siteId: z.string() })).query(({ input }) => listPages(input.siteId)),
  get: protectedProcedure.input(z.object({ pageId: z.string() })).query(async ({ input }) => {
    const page = await getPage(input.pageId);
    if (!page) throw new TRPCError({ code: "NOT_FOUND" });
    return page;
  }),
  create: protectedProcedure.input(createPageSchema).mutation(async ({ input }) => {
    try { return await createPage(input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "PAGE_LIMIT") throw new TRPCError({ code: "FORBIDDEN", message: "Page limit reached." });
      throw e;
    }
  }),
  update: protectedProcedure.input(updatePageSchema).mutation(async ({ input }) => {
    try { return await updatePage(input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "CONFLICT") throw new TRPCError({ code: "CONFLICT", message: "Page was updated elsewhere." });
      throw e;
    }
  }),
  delete: protectedProcedure.input(deletePageSchema).mutation(async ({ input }) => {
    try { await deletePage(input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "LAST_PAGE") throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete last page." });
      throw e;
    }
  }),
});
