import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  createFolder,
  deleteFolder,
  listFolders,
  moveFolder,
  renameFolder,
} from "@/server/services/media-folder.service";
import {
  checkStorageQuota,
  createAsset,
  createAssetVersion,
  deleteAsset,
  listAssetVersions,
  listAssets,
  moveAsset,
  restoreAssetVersion,
  updateAsset,
} from "@/server/services/media.service";
import {
  checkStorageQuotaSchema,
  createAssetSchema,
  createAssetVersionSchema,
  createFolderSchema,
  deleteAssetSchema,
  deleteFolderSchema,
  listAssetVersionsSchema,
  listAssetsSchema,
  listFoldersSchema,
  moveAssetSchema,
  moveFolderSchema,
  renameFolderSchema,
  restoreAssetVersionSchema,
  updateAssetSchema,
} from "@buildrik/shared/schemas/media";

/**
 * Phase A / B / C — media library tRPC.
 *
 * Folders, assets, asset-versions, and storage quota. Editor consumers:
 *   - useMediaState: list + create + update + delete + move (asset & folder)
 *   - AssetDetailDrawer (Phase B): listAssetVersions, restoreAssetVersion
 *   - ImageEditorModal save path: createAssetVersion
 *   - UploadZone state: checkStorageQuota for 80% warning + exhausted UI
 *
 * Errors mapped: NOT_FOUND → 404, FOLDER_NOT_FOUND → 404, PARENT_NOT_FOUND → 400,
 * CYCLE → 400 (folder move would create cycle), QUOTA_EXCEEDED → 402.
 */
export const mediaRouter = router({
  // ─── Folders ────────────────────────────────────────────────────────────

  listFolders: protectedProcedure
    .input(listFoldersSchema)
    .query(async ({ ctx, input }) => {
      return listFolders(ctx.session.user.id, input);
    }),

  createFolder: protectedProcedure
    .input(createFolderSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await createFolder(ctx.session.user.id, input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "PARENT_NOT_FOUND") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Parent folder not found." });
        }
        throw e;
      }
    }),

  renameFolder: protectedProcedure
    .input(renameFolderSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await renameFolder(ctx.session.user.id, input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Folder not found." });
        }
        throw e;
      }
    }),

  moveFolder: protectedProcedure
    .input(moveFolderSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await moveFolder(ctx.session.user.id, input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Folder not found." });
        }
        if (e instanceof Error && e.message === "PARENT_NOT_FOUND") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Target parent not found." });
        }
        if (e instanceof Error && e.message === "CYCLE") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot move folder into itself." });
        }
        throw e;
      }
    }),

  /**
   * Decision #6: cascade-delete moves assets to root.
   * Returns { movedAssets, movedChildFolders } for the client toast.
   */
  deleteFolder: protectedProcedure
    .input(deleteFolderSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await deleteFolder(ctx.session.user.id, input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Folder not found." });
        }
        throw e;
      }
    }),

  // ─── Assets ─────────────────────────────────────────────────────────────

  listAssets: protectedProcedure
    .input(listAssetsSchema)
    .query(async ({ ctx, input }) => {
      return listAssets(ctx.session.user.id, input);
    }),

  createAsset: protectedProcedure
    .input(createAssetSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await createAsset(ctx.session.user.id, input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "QUOTA_EXCEEDED") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Storage quota exceeded." });
        }
        if (e instanceof Error && e.message === "FOLDER_NOT_FOUND") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Folder not found." });
        }
        // Phase B5+ codex re-review pass 3 P0: cross-tenant URL collision.
        // Returned as CONFLICT so the editor's defense-in-depth client
        // createAsset can swallow + log without surfacing as a generic
        // 500. Should be unreachable in practice — Vercel Blob URLs
        // include a randomized suffix per upload, so legitimate flows
        // never produce this error.
        if (e instanceof Error && e.message === "URL_CONFLICT") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Asset URL is already owned by another user.",
          });
        }
        throw e;
      }
    }),

  updateAsset: protectedProcedure
    .input(updateAssetSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await updateAsset(ctx.session.user.id, input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found." });
        }
        if (e instanceof Error && e.message === "FOLDER_NOT_FOUND") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Folder not found." });
        }
        throw e;
      }
    }),

  deleteAsset: protectedProcedure
    .input(deleteAssetSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await deleteAsset(ctx.session.user.id, input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found." });
        }
        throw e;
      }
    }),

  moveAsset: protectedProcedure
    .input(moveAssetSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await moveAsset(ctx.session.user.id, input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found." });
        }
        if (e instanceof Error && e.message === "FOLDER_NOT_FOUND") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Folder not found." });
        }
        throw e;
      }
    }),

  // ─── Asset versions (Phase B) ───────────────────────────────────────────

  listAssetVersions: protectedProcedure
    .input(listAssetVersionsSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await listAssetVersions(ctx.session.user.id, input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found." });
        }
        throw e;
      }
    }),

  createAssetVersion: protectedProcedure
    .input(createAssetVersionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await createAssetVersion(ctx.session.user.id, input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found." });
        }
        throw e;
      }
    }),

  restoreAssetVersion: protectedProcedure
    .input(restoreAssetVersionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await restoreAssetVersion(ctx.session.user.id, input);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Version not found." });
        }
        throw e;
      }
    }),

  // ─── Storage quota (Phase C) ────────────────────────────────────────────

  checkStorageQuota: protectedProcedure
    .input(checkStorageQuotaSchema)
    .query(async ({ ctx }) => {
      return checkStorageQuota(ctx.session.user.id);
    }),
});
