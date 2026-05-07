import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { assertSiteAccess, checkSiteRole, PermissionError } from "@/server/services/permission.service";
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
  checkSlugAvailability,
  transferSite,
  saveProjectData,
  saveProjectFromEditor,
  getProjectData,
} from "@/server/services/sites.service";
import {
  listFolders,
  createFolder,
  deleteFolder,
  moveSiteToFolder,
  renameFolder,
} from "@/server/services/folder.service";
import {
  runPrePublishChecks,
  startPublish,
  getPublishStatus,
  cancelPublish,
  unpublishSite,
} from "@/server/services/publish.service";
import {
  listSitesSchema,
  createSiteSchema,
  bulkActionSchema,
  transferSiteSchema,
  checkSlugSchema,
  saveProjectDataSchema,
  getProjectDataSchema,
} from "@buildrik/shared/schemas/sites";
import { prePublishCheckSchema, publishInputSchema } from "@buildrik/shared/schemas/publish";

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
    .query(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.id);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
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
        if (e instanceof Error && e.message === "TEMPLATE_NOT_FOUND")
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found.",
          });
        throw e;
      }
    }),

  rename: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(2).max(100) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.id, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return renameSite(input.id, input.name);
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.id, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
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
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.id, "ADMIN");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return archiveSite(input.id);
    }),

  unarchive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.id, "ADMIN");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return unarchiveSite(input.id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), confirmName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.id, "OWNER");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
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

      const minRole = input.action === "delete" ? "OWNER"
        : ["archive", "unarchive", "publish", "unpublish"].includes(input.action) ? "ADMIN"
        : "EDITOR";

      try {
        await Promise.all(
          input.siteIds.map((siteId: string) =>
            checkSiteRole(ctx.prisma, ctx.session.user.id, siteId, minRole)
          )
        );
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }

      return bulkAction(workspaceId, input);
    }),

  checkSlug: protectedProcedure
    .input(checkSlugSchema)
    .query(async ({ input }) => ({
      available: await checkSlugAvailability(input.slug),
    })),

  transfer: protectedProcedure
    .input(transferSiteSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, "OWNER");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      try {
        return await transferSite(
          input.siteId,
          input.newOwnerId,
          ctx.session.user.id
        );
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NOT_OWNER")
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the site owner can transfer.",
          });
        if (e instanceof Error && e.message === "MEMBER_NOT_FOUND")
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Member not found in workspace.",
          });
        throw e;
      }
    }),

  saveProject: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        projectData: z.object({
          version: z.string(),
          pages: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              slug: z.string().optional(),
              isHome: z.boolean().optional(),
              root: z.any(),
              styles: z.any().optional(),
              settings: z.any().optional(),
              // Phase -1: full page persistence — applied-template state, slug history, etc.
              meta: z.any().optional(),
              slugHistory: z.any().optional(),
              slugManuallySet: z.boolean().optional(),
              seoTitle: z.string().nullable().optional(),
              seoDescription: z.string().nullable().optional(),
            })
          ),
          styles: z.array(z.any()),
          assets: z.array(z.any()),
          metadata: z.any().optional(),
          settings: z.any().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const site = await ctx.prisma.site.findUnique({
        where: { id: input.siteId },
        select: { workspaceId: true },
      });
      if (!site)
        throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      const member = await ctx.prisma.workspaceMember.findFirst({
        where: {
          workspaceId: site.workspaceId,
          userId: ctx.session.user.id,
        },
      });
      if (!member)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized",
        });

      try {
        return await saveProjectFromEditor(input.siteId, input.projectData);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "SITE_NOT_FOUND")
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Site not found",
          });
        throw e;
      }
    }),

  prePublishChecks: protectedProcedure
    .input(prePublishCheckSchema)
    .query(async ({ input }) => {
      return runPrePublishChecks(input.siteId);
    }),

  publish: protectedProcedure
    .input(publishInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, "ADMIN");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      const workspaceId = await getWorkspaceId(ctx);
      try {
        return await startPublish(input.siteId, workspaceId, ctx.session.user.id, input.pages);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "ALREADY_PUBLISHING")
          throw new TRPCError({
            code: "CONFLICT",
            message: "A publish job is already in progress.",
          });
        throw e;
      }
    }),

  publishStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const job = await getPublishStatus(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      return job;
    }),

  cancelPublish: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.publishBuildJob.findUnique({
        where: { id: input.jobId },
        select: { siteId: true },
      });
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, job.siteId, "ADMIN");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      try {
        return await cancelPublish(input.jobId);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NOT_CANCELLABLE")
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This job cannot be cancelled.",
          });
        throw e;
      }
    }),

  unpublish: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, "ADMIN");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return unpublishSite(input.siteId);
    }),

  saveProjectData: protectedProcedure
    .input(saveProjectDataSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.siteId);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      try {
        return await saveProjectData(input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "SITE_NOT_FOUND")
          throw new TRPCError({ code: "NOT_FOUND", message: "Site not found." });
        throw e;
      }
    }),

  getProjectData: protectedProcedure
    .input(getProjectDataSchema)
    .query(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.siteId);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      try {
        return await getProjectData(input.siteId);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "SITE_NOT_FOUND")
          throw new TRPCError({ code: "NOT_FOUND", message: "Site not found." });
        throw e;
      }
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
      .mutation(async ({ ctx, input }) => {
        const folder = await ctx.prisma.folder.findUnique({
          where: { id: input.id },
          select: { workspaceId: true },
        });
        if (!folder) throw new TRPCError({ code: "NOT_FOUND" });
        const member = await ctx.prisma.workspaceMember.findFirst({
          where: { userId: ctx.session.user.id, workspaceId: folder.workspaceId, status: "ACTIVE" },
          select: { role: true },
        });
        if (!member || (member.role !== "ADMIN" && member.role !== "OWNER"))
          throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
        return deleteFolder(input.id);
      }),

    rename: protectedProcedure
      .input(z.object({ id: z.string(), name: z.string().min(1).max(50) }))
      .mutation(async ({ ctx, input }) => {
        const folder = await ctx.prisma.folder.findUnique({
          where: { id: input.id },
          select: { workspaceId: true },
        });
        if (!folder) throw new TRPCError({ code: "NOT_FOUND" });
        const member = await ctx.prisma.workspaceMember.findFirst({
          where: { userId: ctx.session.user.id, workspaceId: folder.workspaceId, status: "ACTIVE" },
          select: { role: true },
        });
        if (!member || (member.role !== "ADMIN" && member.role !== "OWNER"))
          throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
        return renameFolder(input.id, input.name);
      }),

    moveSite: protectedProcedure
      .input(
        z.object({ siteId: z.string(), folderId: z.string().nullable() })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        return moveSiteToFolder(input.siteId, input.folderId);
      }),
  }),
});
