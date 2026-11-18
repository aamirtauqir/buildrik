/**
 * "My Templates" router (#13/25, 2026-06-24). Editor mirrors upsert/delete +
 * hydrates list. Read gate = any active member of the editing site
 * (guardSiteAccess); the service resolves the workspace from that site.
 *
 * @license BSD-3-Clause
 */
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import {
  upsertUserTemplate,
  listUserTemplates,
  deleteUserTemplate,
  listUserTemplateTrash,
  restoreUserTemplate,
  purgeUserTemplate,
  UserTemplateTrashError,
} from "@/server/services/user-template.service";
import { PermissionError } from "@/server/services/permission.service";
import {
  upsertUserTemplateSchema,
  listUserTemplatesSchema,
  deleteUserTemplateSchema,
  restoreUserTemplateSchema,
  purgeUserTemplateSchema,
} from "@buildrik/shared/schemas/user-template";
import { guardSiteAccess as guardSite, guardSiteRole } from "@/server/trpc/guards";

export const userTemplatesRouter = router({
  upsert: protectedProcedure
    .input(upsertUserTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      await guardSiteRole(ctx.prisma, ctx.session.user.id, input.siteId);
      // Stamp the caller — never trust a client-supplied createdBy.
      return upsertUserTemplate({ ...input, createdBy: ctx.session.user.id });
    }),

  list: protectedProcedure
    .input(listUserTemplatesSchema)
    .query(async ({ ctx, input }) => {
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
      return listUserTemplates(input.siteId);
    }),

  delete: protectedProcedure
    .input(deleteUserTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      await guardSiteRole(ctx.prisma, ctx.session.user.id, input.siteId);
      return deleteUserTemplate(input.siteId, input.templateId);
    }),

  /* Saved-template trash — "Recently deleted" (design-2l9 B6-T24…T33).
     List + restore: EDITOR+ (as delete); permanent delete: ADMIN, checked in
     the service. */
  trash: router({
    list: protectedProcedure.input(listUserTemplatesSchema).query(async ({ ctx, input }) => {
      await guardSiteRole(ctx.prisma, ctx.session.user.id, input.siteId);
      return listUserTemplateTrash(input.siteId);
    }),
    restore: protectedProcedure.input(restoreUserTemplateSchema).mutation(async ({ ctx, input }) => {
      await guardSiteRole(ctx.prisma, ctx.session.user.id, input.siteId);
      return translateTrashError(() => restoreUserTemplate(input));
    }),
    purge: protectedProcedure.input(purgeUserTemplateSchema).mutation(({ ctx, input }) =>
      translateTrashError(() => purgeUserTemplate(ctx.session.user.id, input)),
    ),
  }),
});

async function translateTrashError<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    if (e instanceof UserTemplateTrashError) {
      throw new TRPCError({ code: e.code === "NOT_FOUND" ? "NOT_FOUND" : "BAD_REQUEST", message: e.message });
    }
    throw e;
  }
}
