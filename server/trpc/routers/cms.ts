import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import {
  assertSiteAccess,
  checkSiteRole,
  PermissionError,
} from "@/server/services/permission.service";
import {
  listCollections,
  upsertCollection,
  deleteCollection,
  listEntries,
  upsertEntry,
  deleteEntry,
  CmsError,
} from "@/server/services/cms.service";
import {
  upsertCollectionInput,
  listCollectionsInput,
  deleteCollectionInput,
  upsertEntryInput,
  listEntriesInput,
  deleteEntryInput,
} from "@buildrik/shared/schemas/cms";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireRead(ctx: any, siteId: string): Promise<void> {
  try {
    await assertSiteAccess(ctx.prisma, ctx.session.user.id, siteId);
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireWrite(ctx: any, siteId: string): Promise<void> {
  try {
    await checkSiteRole(ctx.prisma, ctx.session.user.id, siteId, "EDITOR");
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}

function translateCms(e: unknown): never {
  if (e instanceof CmsError) throw new TRPCError({ code: e.code, message: e.message });
  throw e;
}

export const cmsRouter = router({
  collections: router({
    list: protectedProcedure.input(listCollectionsInput).query(async ({ ctx, input }) => {
      await requireRead(ctx, input.siteId);
      return listCollections(input.siteId);
    }),
    upsert: protectedProcedure.input(upsertCollectionInput).mutation(async ({ ctx, input }) => {
      await requireWrite(ctx, input.siteId);
      try {
        return await upsertCollection(input.siteId, input);
      } catch (e) {
        translateCms(e);
      }
    }),
    delete: protectedProcedure.input(deleteCollectionInput).mutation(async ({ ctx, input }) => {
      await requireWrite(ctx, input.siteId);
      try {
        await deleteCollection(input.siteId, input.id);
        return { ok: true as const };
      } catch (e) {
        translateCms(e);
      }
    }),
  }),
  entries: router({
    list: protectedProcedure.input(listEntriesInput).query(async ({ ctx, input }) => {
      await requireRead(ctx, input.siteId);
      try {
        return await listEntries(input.siteId, input.collectionId);
      } catch (e) {
        translateCms(e);
      }
    }),
    upsert: protectedProcedure.input(upsertEntryInput).mutation(async ({ ctx, input }) => {
      await requireWrite(ctx, input.siteId);
      try {
        return await upsertEntry(input.siteId, input);
      } catch (e) {
        translateCms(e);
      }
    }),
    delete: protectedProcedure.input(deleteEntryInput).mutation(async ({ ctx, input }) => {
      await requireWrite(ctx, input.siteId);
      try {
        await deleteEntry(input.siteId, input.id);
        return { ok: true as const };
      } catch (e) {
        translateCms(e);
      }
    }),
  }),
});
