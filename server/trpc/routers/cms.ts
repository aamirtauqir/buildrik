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
  resolveDynamicPages,
  generateDynamicPages,
  previewCsvImport,
  importCsvEntries,
  getPublishedCmsForCollections,
  CmsError,
} from "@/server/services/cms.service";
import { listSiteFontAssets } from "@/server/services/media.service";
import {
  upsertCollectionInput,
  listCollectionsInput,
  deleteCollectionInput,
  upsertEntryInput,
  listEntriesInput,
  deleteEntryInput,
  dynamicPagesInput,
  generateDynamicPagesInput,
  previewCsvEntriesInput,
  importCsvEntriesInput,
  publishSnapshotInput,
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
  if (e instanceof CmsError) {
    /* CmsError carries CONFLICT / GONE — not on tRPC's TRPCErrorCode union.
       Translate the domain-known recoverable ones to BAD_REQUEST (the message
       carries the reason — "changed somewhere else", "was deleted") and fall
       back to INTERNAL_SERVER_ERROR for anything else we did not plan for. */
    const code: TRPCError["code"] =
      e.code === "CONFLICT" || e.code === "GONE" ? "BAD_REQUEST" :
      e.code;
    throw new TRPCError({ code, message: e.message });
  }
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
  // The published pages a page-generating collection produces (slug + pattern SEO
  // per entry). Read-only resolution; the publish pipeline turns these into HTML.
  dynamicPages: protectedProcedure.input(dynamicPagesInput).query(async ({ ctx, input }) => {
    await requireRead(ctx, input.siteId);
    try {
      return await resolveDynamicPages(input.siteId, input.collectionId);
    } catch (e) {
      translateCms(e);
    }
  }),
  // Render the dynamic pages to HTML files (publish-pipeline consumer). The
  // editor passes the template page's exported HTML; the publish worker deploys
  // the returned files. Read-gated (pure render, no mutation).
  generateDynamicPages: protectedProcedure.input(generateDynamicPagesInput).mutation(async ({ ctx, input }) => {
    await requireRead(ctx, input.siteId);
    try {
      return await generateDynamicPages(input.siteId, input.collectionId, input.templateHtml);
    } catch (e) {
      translateCms(e);
    }
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
    // CSV import (fix-all round, 2026-09-25 — decision: build CSV, no OAuth
    // connectors). Both steps require EDITOR+ (same floor as every other
    // write here): a preview is part of the import action, not a plain read.
    importCsvPreview: protectedProcedure.input(previewCsvEntriesInput).mutation(async ({ ctx, input }) => {
      await requireWrite(ctx, input.siteId);
      try {
        return await previewCsvImport(input.siteId, input.collectionId, input.csv);
      } catch (e) {
        translateCms(e);
      }
    }),
    importCsv: protectedProcedure.input(importCsvEntriesInput).mutation(async ({ ctx, input }) => {
      await requireWrite(ctx, input.siteId);
      try {
        return await importCsvEntries(input.siteId, input.collectionId, input.csv, input.columnMapping);
      } catch (e) {
        translateCms(e);
      }
    }),
  }),
  // What a publish renders CMS content from: the server's live, published rows
  // for the collections the project binds, plus the site fonts a scratch
  // render needs. EDITOR-gated like the publish it feeds.
  publishSnapshot: protectedProcedure.input(publishSnapshotInput).query(async ({ ctx, input }) => {
    await requireWrite(ctx, input.siteId);
    const [cms, siteFonts] = await Promise.all([
      getPublishedCmsForCollections(input.siteId, input.collectionIds),
      listSiteFontAssets(input.siteId),
    ]);
    return { cms, siteFonts };
  }),
});
