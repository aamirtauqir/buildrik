import { z } from "zod";

/**
 * Phase 0.5 / A / B / C — media library Zod contracts.
 *
 * Mirror of Prisma MediaAsset + MediaFolder + MediaAssetVersion + TemplateVersion
 * shapes, validated at tRPC boundary. Editor consumes generated client types.
 */

export const mediaTypeEnum = z.enum(["image", "video", "icon", "font"]);
export type MediaType = z.infer<typeof mediaTypeEnum>;

// ─── Folders (Phase A) ────────────────────────────────────────────────────

export const listFoldersSchema = z.object({
  siteId: z.string().optional(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1).max(80),
  parentId: z.string().nullable().optional(),
  siteId: z.string().nullable().optional(),
});

export const renameFolderSchema = z.object({
  folderId: z.string(),
  name: z.string().min(1).max(80),
});

export const deleteFolderSchema = z.object({
  folderId: z.string(),
});

export const moveFolderSchema = z.object({
  folderId: z.string(),
  newParentId: z.string().nullable(),
});

export type ListFoldersInput = z.infer<typeof listFoldersSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type RenameFolderInput = z.infer<typeof renameFolderSchema>;
export type DeleteFolderInput = z.infer<typeof deleteFolderSchema>;
export type MoveFolderInput = z.infer<typeof moveFolderSchema>;

// ─── Assets (Phase 0.5 / A / C) ───────────────────────────────────────────

export const listAssetsSchema = z.object({
  siteId: z.string().optional(),
  folderId: z.string().nullable().optional(),
  type: mediaTypeEnum.optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});

export const createAssetSchema = z.object({
  url: z.string().url(),
  bytes: z.number().int().min(0),
  type: mediaTypeEnum,
  mimeType: z.string(),
  filename: z.string().min(1).max(200),
  altText: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
  siteId: z.string().nullable().optional(),
  userMetadata: z.record(z.unknown()).optional(),
});

export const updateAssetSchema = z.object({
  assetId: z.string(),
  filename: z.string().min(1).max(200).optional(),
  altText: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
  userMetadata: z.record(z.unknown()).optional(),
});

export const deleteAssetSchema = z.object({
  assetId: z.string(),
});

export const moveAssetSchema = z.object({
  assetId: z.string(),
  folderId: z.string().nullable(),
});

export type ListAssetsInput = z.infer<typeof listAssetsSchema>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type DeleteAssetInput = z.infer<typeof deleteAssetSchema>;
export type MoveAssetInput = z.infer<typeof moveAssetSchema>;

// ─── Asset versions (Phase B) ─────────────────────────────────────────────

export const listAssetVersionsSchema = z.object({
  assetId: z.string(),
});

export const createAssetVersionSchema = z.object({
  assetId: z.string(),
  url: z.string().url(),
  bytes: z.number().int().min(0),
  edits: z.record(z.unknown()), // crop/rotate/brightness/contrast/saturation/filter snapshot
});

export const restoreAssetVersionSchema = z.object({
  versionId: z.string(),
});

export type ListAssetVersionsInput = z.infer<typeof listAssetVersionsSchema>;
export type CreateAssetVersionInput = z.infer<typeof createAssetVersionSchema>;
export type RestoreAssetVersionInput = z.infer<typeof restoreAssetVersionSchema>;

// ─── AI alt-text (P7) ─────────────────────────────────────────────────────

export const generateAltTextSchema = z.object({
  assetId: z.string(),
});

export const generateAltTextResultSchema = z.object({
  altText: z.string(),
  /** True when the existing user-typed alt text was preserved instead of overwritten. */
  skipped: z.boolean(),
  model: z.string().optional(),
});

export type GenerateAltTextInput = z.infer<typeof generateAltTextSchema>;
export type GenerateAltTextResult = z.infer<typeof generateAltTextResultSchema>;

// ─── Storage quota (Phase C) ──────────────────────────────────────────────

export const checkStorageQuotaSchema = z.object({});

export const storageQuotaResultSchema = z.object({
  ok: z.boolean(),
  usedBytes: z.number().int().min(0),
  totalBytes: z.number().int().min(0), // -1 for unlimited
  tier: z.enum(["FREE", "PRO", "BUSINESS"]),
  warningAt80Percent: z.boolean(),
});

export type StorageQuotaResult = z.infer<typeof storageQuotaResultSchema>;
