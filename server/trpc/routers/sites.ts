import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  listSites,
  createSite,
  getSite,
  renameSite,
  duplicateSite,
  archiveSite,
  unarchiveSite,
  deleteSite,
  bulkAction,
} from "@/server/services/sites.service";
import {
  listFolders,
  createFolder,
  deleteFolder,
  moveSiteToFolder,
} from "@/server/services/folder.service";
import {
  listSitesSchema,
  createSiteSchema,
  bulkActionSchema,
} from "@/lib/validations/sites";

async function getWorkspaceId(ctx: {
  prisma: { workspaceMember: { findFirst: Function } };
  session: { user: { id: string } };
}): Promise<string> {
  const member = await ctx.prisma.workspaceMember.findFirst({
    where: { userId: ctx.session.user.id },
    select: { workspaceId: true },
  });
  if (!member)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No workspace found",
    });
  return member.workspaceId;
}

export const sitesRouter = router({
  list: protectedProcedure
    .input(listSitesSchema)
    .query(async ({ ctx, input }) => {
      const workspaceId = await getWorkspaceId(ctx);
      return listSites(workspaceId, input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const site = await getSite(input.id);
      if (!site) throw new TRPCError({ code: "NOT_FOUND" });
      return site;
    }),

  create: protectedProcedure
    .input(createSiteSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getWorkspaceId(ctx);
      try {
        return await createSite(workspaceId, ctx.session.user.id, input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "SITE_LIMIT")
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Site limit reached. Upgrade your plan.",
          });
        throw e;
      }
    }),

  rename: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(2).max(100) }))
    .mutation(async ({ input }) => {
      return renameSite(input.id, input.name);
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getWorkspaceId(ctx);
      try {
        return await duplicateSite(input.id, workspaceId, ctx.session.user.id);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "SITE_LIMIT")
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Site limit reached.",
          });
        throw e;
      }
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => archiveSite(input.id)),

  unarchive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => unarchiveSite(input.id)),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), confirmName: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await deleteSite(input.id, input.confirmName);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NAME_MISMATCH")
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Site name does not match.",
          });
        throw e;
      }
    }),

  bulk: protectedProcedure
    .input(bulkActionSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getWorkspaceId(ctx);
      return bulkAction(workspaceId, input);
    }),

  folders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const workspaceId = await getWorkspaceId(ctx);
      return listFolders(workspaceId);
    }),

    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(50) }))
      .mutation(async ({ ctx, input }) => {
        const workspaceId = await getWorkspaceId(ctx);
        try {
          return await createFolder(workspaceId, input.name);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "FOLDER_EXISTS")
            throw new TRPCError({
              code: "CONFLICT",
              message: "Folder name already exists.",
            });
          throw e;
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => deleteFolder(input.id)),

    moveSite: protectedProcedure
      .input(
        z.object({ siteId: z.string(), folderId: z.string().nullable() })
      )
      .mutation(async ({ input }) =>
        moveSiteToFolder(input.siteId, input.folderId)
      ),
  }),
});
