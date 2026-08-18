import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { assertSiteAccess, checkSiteRole, checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";
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
  getPublishHistory,
  rollbackPublish,
} from "@/server/services/publish.service";
import {
  listSitesSchema,
  createSiteSchema,
  bulkActionSchema,
  transferSiteSchema,
  checkSlugSchema,
  saveProjectDataSchema,
  getProjectDataSchema,
  editorSaveProjectSchema,
} from "@buildrik/shared/schemas/sites";
import { prePublishCheckSchema, publishInputSchema, publishHistoryInput, rollbackInput } from "@buildrik/shared/schemas/publish";
import { recordForSite } from "@/server/services/activity-log.service";
import { resolveWorkspaceId as getWorkspaceId } from "@/server/trpc/workspace-ctx";

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
      // Creating a site consumes plan quota and mutates the workspace — EDITOR+,
      // never a VIEWER.
      try {
        await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
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
        : ["archive", "unarchive"].includes(input.action) ? "ADMIN"
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

  // P6 editor role plumbing — the chrome shows disabled-with-reason controls
  // per the Permissions boards (59:2 / 396:3777), so it needs the member's
  // effective role for this site's workspace.
  myRole: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .query(async ({ ctx, input }) => {
      const site = await ctx.prisma.site.findUnique({
        where: { id: input.siteId },
        select: { workspaceId: true },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND" });
      const member = await ctx.prisma.workspaceMember.findFirst({
        where: { userId: ctx.session.user.id, workspaceId: site.workspaceId, status: "ACTIVE" },
        select: { role: true },
      });
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this workspace" });
      return { role: member.role };
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
    .input(editorSaveProjectSchema)
    .mutation(async ({ input, ctx }) => {
      // Content save requires EDITOR — a VIEWER must not mutate site content.
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }

      try {
        return await saveProjectFromEditor(input.siteId, input.projectData, input.expectedLastEditedAt ?? undefined);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "SITE_NOT_FOUND")
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Site not found",
          });
        // 61-conflict: the site changed elsewhere since this editor loaded it.
        // The serverLastEditedAt suffix lets the client offer "Reload latest".
        if (e instanceof Error && e.message.startsWith("SAVE_CONFLICT"))
          throw new TRPCError({
            code: "CONFLICT",
            message: e.message,
          });
        throw e;
      }
    }),

  prePublishChecks: protectedProcedure
    .input(prePublishCheckSchema)
    .query(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return runPrePublishChecks(input.siteId);
    }),

  publish: protectedProcedure
    .input(publishInputSchema)
    .mutation(async ({ ctx, input }) => {
      // The gate is the approval, not the role (contracts §2, decided 2026-07-19):
      // a DESIGNER (EDITOR site-role) may publish. The real control is the
      // approval gate in startPublish, which throws an APPROVAL_* error for a
      // member in an approval-required workspace without an APPROVED review
      // (OWNER exempt) — one error per gate state, so the message can say what
      // to do next. Requiring ADMIN here contradicted the design, which
      // draws Publish as Allowed for a designer.
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      const workspaceId = await getWorkspaceId(ctx);
      try {
        return await startPublish(
          input.siteId,
          workspaceId,
          ctx.session.user.id,
          input.pages,
          input.acknowledgeStale,
        );
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "ALREADY_PUBLISHING")
          throw new TRPCError({
            code: "CONFLICT",
            message: "A publish job is already in progress.",
          });
        // Sites deploy into the workspace's own Vercel account. The pre-publish
        // check already disables the button, but the editor and the API can still
        // reach here — they get a reason, not a 500.
        if (e instanceof Error && e.message === "VERCEL_NOT_CONNECTED")
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Connect this workspace to Vercel before publishing.",
          });
        // m-approval gate (publish.service startPublish): a member in an
        // approval-required workspace without an APPROVED review gets a clear
        // reason, not a 500.
        // One message per gate state (board S5.4). The editor keys off these
        // PHRASES (`classifyPublishBlock` in usePublishJob.ts) because all four
        // arrive as PRECONDITION_FAILED and the message is the only
        // discriminator — reword one here and you must reword it there in the
        // same commit, or the gate degrades into a red "publish failed" toast.
        // The old single sentence —
        // "this site needs an approved review" — was true in all three cases
        // and useful in none: it never said whether to send a review, wait for
        // one, or go read the comments that already came back.
        if (e instanceof Error && e.message === "APPROVAL_NONE")
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "This site has not been sent for review yet. Send it for review to publish.",
          });
        if (e instanceof Error && e.message === "APPROVAL_PENDING")
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "This site is waiting on its review. You can publish once it is approved.",
          });
        if (e instanceof Error && e.message === "APPROVAL_CHANGES")
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "The reviewer asked for changes. Resolve the open comments and re-send for review.",
          });
        // Stale approval (contracts §1.5): approved, but the site changed since.
        // The client signed off on an earlier version — re-send for review, or
        // publish again with acknowledgeStale to ship it deliberately.
        if (e instanceof Error && e.message === "APPROVAL_STALE")
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "This site changed after it was approved. Re-send it for review, or acknowledge to publish the un-approved changes.",
          });
        throw e;
      }
    }),

  publishStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await getPublishStatus(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      // Authz: only a member of the job's site may poll its status (was open to
      // any authenticated user).
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, job.siteId);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
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
      const result = await unpublishSite(input.siteId);
      await recordForSite({
        siteId: input.siteId,
        actorId: ctx.session.user!.id!,
        action: "site.unpublished",
        targetType: "site",
        targetId: input.siteId,
        description: "Site unpublished",
      });
      return result;
    }),

  // P1: a site's published-version history (contract §5). EDITOR — reading your
  // own site's history. Never returns the HTML payload (service strips it).
  publishHistory: protectedProcedure
    .input(publishHistoryInput)
    .query(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return getPublishHistory(input.siteId);
    }),

  // P1: roll back = re-publish a prior version as a NEW job (contract §5).
  // ADMIN — a destructive/cross-history action (§2). Bypasses the approval gate
  // in the service (restoring an already-shipped version). Activity-logged.
  rollback: protectedProcedure
    .input(rollbackInput)
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, "ADMIN");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      const workspaceId = await getWorkspaceId(ctx);
      let result;
      try {
        result = await rollbackPublish(workspaceId, input.siteId, input.jobId, ctx.session.user!.id!);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "That version was not found." });
        if (msg === "NOT_ROLLBACKABLE")
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "That version can no longer be rolled back to." });
        if (msg === "ALREADY_PUBLISHING")
          throw new TRPCError({ code: "CONFLICT", message: "A publish is already in progress." });
        if (msg === "VERCEL_NOT_CONNECTED")
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Connect Vercel before rolling back." });
        throw e;
      }
      await recordForSite({
        siteId: input.siteId,
        actorId: ctx.session.user!.id!,
        action: "site.rolled_back",
        targetType: "site",
        targetId: input.siteId,
        description: `Rolled back from version ${input.jobId}`,
      });
      return result;
    }),

  saveProjectData: protectedProcedure
    .input(saveProjectDataSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
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
        // Organizing the workspace is an EDITOR action, not a VIEWER one.
        try {
          await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "EDITOR");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        try {
          return await createFolder(workspaceId, input.name);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "FOLDER_NAME_EXISTS")
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
