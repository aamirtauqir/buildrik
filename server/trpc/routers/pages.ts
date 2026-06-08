import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  listPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  resolveTranslation,
  setTranslation,
  removeTranslation,
} from "@/server/services/page.service";
import {
  createPageSchema,
  updatePageSchema,
  deletePageSchema,
  getTranslationSchema,
  setTranslationSchema,
  removeTranslationSchema,
} from "@buildrik/shared/schemas/pages";
import { assertSiteAccess, checkSiteRole, PermissionError } from "@/server/services/permission.service";

// Read gate: any active member (incl. VIEWER) may read.
async function guardSite(prisma: typeof import("@/lib/prisma").prisma, userId: string, siteId: string): Promise<void> {
  try {
    await assertSiteAccess(prisma, userId, siteId);
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}

// Write gate: content mutations require EDITOR. A VIEWER must not create,
// update, delete, or translate pages.
async function guardSiteEditor(prisma: typeof import("@/lib/prisma").prisma, userId: string, siteId: string): Promise<void> {
  try {
    await checkSiteRole(prisma, userId, siteId, "EDITOR");
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
    await guardSiteEditor(ctx.prisma, ctx.session.user.id, input.siteId);
    try { return await createPage(input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "PAGE_LIMIT") throw new TRPCError({ code: "FORBIDDEN", message: "Page limit reached." });
      throw e;
    }
  }),
  update: protectedProcedure.input(updatePageSchema).mutation(async ({ ctx, input }) => {
    await guardSiteEditor(ctx.prisma, ctx.session.user.id, input.siteId);
    try { return await updatePage(input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "CONFLICT") throw new TRPCError({ code: "CONFLICT", message: "Page was updated elsewhere." });
      throw e;
    }
  }),
  delete: protectedProcedure.input(deletePageSchema).mutation(async ({ ctx, input }) => {
    await guardSiteEditor(ctx.prisma, ctx.session.user.id, input.siteId);
    try { await deletePage(input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "LAST_PAGE") throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete last page." });
      throw e;
    }
  }),
  getTranslation: protectedProcedure.input(getTranslationSchema).query(async ({ ctx, input }) => {
    const page = await getPage(input.pageId);
    if (!page) throw new TRPCError({ code: "NOT_FOUND" });
    await guardSite(ctx.prisma, ctx.session.user.id, page.siteId);
    return resolveTranslation(input.pageId, input.locale);
  }),
  setTranslation: protectedProcedure.input(setTranslationSchema).mutation(async ({ ctx, input }) => {
    await guardSiteEditor(ctx.prisma, ctx.session.user.id, input.siteId);
    try { return await setTranslation(input); }
    catch (e: unknown) {
      if (!(e instanceof Error)) throw e;
      if (e.message === "NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND" });
      if (e.message === "SITE_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Site not found." });
      if (e.message === "SITE_MISMATCH") throw new TRPCError({ code: "BAD_REQUEST", message: "Page does not belong to site." });
      if (e.message === "LOCALE_NOT_ENABLED") throw new TRPCError({ code: "BAD_REQUEST", message: "Locale is not enabled on this site." });
      if (e.message === "DEFAULT_LOCALE_USES_BLOCKS") throw new TRPCError({ code: "BAD_REQUEST", message: "Default-locale content lives on the page directly — use pages.update with blocks." });
      throw e;
    }
  }),
  removeTranslation: protectedProcedure.input(removeTranslationSchema).mutation(async ({ ctx, input }) => {
    await guardSiteEditor(ctx.prisma, ctx.session.user.id, input.siteId);
    try { return await removeTranslation(input); }
    catch (e: unknown) {
      if (!(e instanceof Error)) throw e;
      if (e.message === "NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND" });
      if (e.message === "SITE_MISMATCH") throw new TRPCError({ code: "BAD_REQUEST", message: "Page does not belong to site." });
      throw e;
    }
  }),
});
