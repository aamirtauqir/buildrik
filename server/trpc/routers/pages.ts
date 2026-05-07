import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { listPages, getPage, createPage, updatePage, deletePage } from "@/server/services/page.service";
import { createPageSchema, updatePageSchema, deletePageSchema } from "@buildrik/shared/schemas/pages";
import { assertSiteAccess, PermissionError } from "@/server/services/permission.service";

async function guardSite(prisma: typeof import("@/lib/prisma").prisma, userId: string, siteId: string): Promise<void> {
  try {
    await assertSiteAccess(prisma, userId, siteId);
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}

export const pagesRouter = router({
  list: protectedProcedure.input(z.object({ siteId: z.string() })).query(async ({ ctx, input }) => {
    await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
    return listPages(input.siteId);
  }),
  get: protectedProcedure.input(z.object({ pageId: z.string() })).query(async ({ ctx, input }) => {
    const page = await getPage(input.pageId);
    if (!page) throw new TRPCError({ code: "NOT_FOUND" });
    await guardSite(ctx.prisma, ctx.session.user.id, page.siteId);
    return page;
  }),
  create: protectedProcedure.input(createPageSchema).mutation(async ({ ctx, input }) => {
    await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
    try { return await createPage(input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "PAGE_LIMIT") throw new TRPCError({ code: "FORBIDDEN", message: "Page limit reached." });
      throw e;
    }
  }),
  update: protectedProcedure.input(updatePageSchema).mutation(async ({ ctx, input }) => {
    await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
    try { return await updatePage(input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "CONFLICT") throw new TRPCError({ code: "CONFLICT", message: "Page was updated elsewhere." });
      throw e;
    }
  }),
  delete: protectedProcedure.input(deletePageSchema).mutation(async ({ ctx, input }) => {
    await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
    try { await deletePage(input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "LAST_PAGE") throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete last page." });
      throw e;
    }
  }),
});
