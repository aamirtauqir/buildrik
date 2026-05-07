import { Prisma } from "@prisma/client";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type {
  CreateAssetInput,
  CreateAssetVersionInput,
  DeleteAssetInput,
  ListAssetVersionsInput,
  ListAssetsInput,
  MoveAssetInput,
  RestoreAssetVersionInput,
  StorageQuotaResult,
  UpdateAssetInput,
} from "@buildrik/shared/schemas/media";

/**
 * Phase 0.5 / A / B / C — server-backed media library + asset versions + storage quota.
 *
 * Replaces editor's IndexedDB-only model (decision #8). Editor IndexedDB
 * stays as offline cache; this service is the durable source of truth.
 */

async function getUserPlan(userId: string): Promise<PlanName> {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { workspace: { select: { plan: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return (member?.workspace?.plan ?? "FREE") as PlanName;
}

// ─── Asset CRUD (Phase 0.5 / A) ────────────────────────────────────────────

export async function listAssets(userId: string, input: ListAssetsInput) {
  const where: Prisma.MediaAssetWhereInput = {
    userId,
    ...(input.siteId !== undefined ? { siteId: input.siteId } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    // folderId === null means "in root", folderId === undefined means "any folder"
    ...(input.folderId !== undefined ? { folderId: input.folderId } : {}),
    ...(input.search
      ? {
          OR: [
            { filename: { contains: input.search, mode: "insensitive" } },
            { altText: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const assets = await prisma.mediaAsset.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: input.limit + 1, // fetch one extra for hasMore detection
    ...(input.cursor
      ? { cursor: { id: input.cursor }, skip: 1 }
      : {}),
  });

  const hasMore = assets.length > input.limit;
  const items = hasMore ? assets.slice(0, input.limit) : assets;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, nextCursor };
}

export async function createAsset(userId: string, input: CreateAssetInput): Promise<{ id: string; url: string; bytes: number }> {
  // Phase B5+ codex re-review fix [P1A race + bytes=0]:
  // upsert on the new @@unique([userId, url]) constraint. Closes two
  // bugs at once:
  //   - Race: concurrent onUploadCompleted webhook + client createAsset
  //     calls can't double-insert anymore — DB enforces single row.
  //   - bytes=0: if a prior caller created the row with bytes=0 (legacy
  //     before-fix data), the update branch repairs it to the real bytes
  //     count. Without this, quota would stay undercounted forever.
  //
  // Quota check still fires on the create branch only — duplicates of an
  // already-counted row don't double-charge the user. We DO want the
  // update branch to repair bytes when the existing row has bytes=0,
  // because that case is "completion handler raced ahead with no bytes
  // info"; the client's later call carries the real value.
  const quota = await checkStorageQuota(userId);

  // Validate folder ownership if set.
  if (input.folderId) {
    const folder = await prisma.mediaFolder.findUnique({
      where: { id: input.folderId },
      select: { userId: true },
    });
    if (!folder || folder.userId !== userId) {
      throw new Error("FOLDER_NOT_FOUND");
    }
  }

  // Pre-check: would creating consume more than allowed? Skipped on
  // unlimited tier (-1) or when an existing row already accounts for it.
  if (quota.totalBytes !== -1) {
    const existing = await prisma.mediaAsset.findUnique({
      where: { MediaAsset_userId_url_unique: { userId, url: input.url } },
      select: { bytes: true },
    });
    const delta = existing ? Math.max(input.bytes - existing.bytes, 0) : input.bytes;
    if (!quota.ok && quota.usedBytes + delta > quota.totalBytes) {
      throw new Error("QUOTA_EXCEEDED");
    }
  }

  return prisma.mediaAsset.upsert({
    where: { MediaAsset_userId_url_unique: { userId, url: input.url } },
    create: {
      userId,
      siteId: input.siteId ?? null,
      folderId: input.folderId ?? null,
      url: input.url,
      bytes: input.bytes,
      type: input.type,
      mimeType: input.mimeType,
      filename: input.filename,
      altText: input.altText ?? null,
      userMetadata: (input.userMetadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
    update: {
      // Repair bytes=0 from a webhook that landed before the client's
      // metadata-bearing call. Only update when the new value is bigger
      // — otherwise a stale call could shrink a valid row.
      bytes: input.bytes,
    },
    select: { id: true, url: true, bytes: true },
  });
}

export async function updateAsset(userId: string, input: UpdateAssetInput) {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: input.assetId },
    select: { userId: true },
  });
  if (!asset || asset.userId !== userId) {
    throw new Error("NOT_FOUND");
  }

  // Validate folder ownership if changing.
  if (input.folderId) {
    const folder = await prisma.mediaFolder.findUnique({
      where: { id: input.folderId },
      select: { userId: true },
    });
    if (!folder || folder.userId !== userId) {
      throw new Error("FOLDER_NOT_FOUND");
    }
  }

  const data: Prisma.MediaAssetUpdateInput = {};
  if (input.filename !== undefined) data.filename = input.filename;
  if (input.altText !== undefined) data.altText = input.altText;
  if (input.folderId !== undefined) {
    data.folder = input.folderId
      ? { connect: { id: input.folderId } }
      : { disconnect: true };
  }
  if (input.userMetadata !== undefined) {
    data.userMetadata = input.userMetadata as Prisma.InputJsonValue;
  }

  return prisma.mediaAsset.update({ where: { id: input.assetId }, data });
}

export async function deleteAsset(userId: string, input: DeleteAssetInput) {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: input.assetId },
    select: { userId: true, url: true },
  });
  if (!asset || asset.userId !== userId) {
    throw new Error("NOT_FOUND");
  }
  // Versions cascade-delete via FK constraint.
  await prisma.mediaAsset.delete({ where: { id: input.assetId } });

  // Phase B5+ codex re-review fix [P1C]: also delete the underlying
  // Vercel Blob so storage isn't silently leaked. Pre-fix, deleting an
  // asset removed the Prisma row but left the binary at vercel-storage.com
  // forever — quota would re-fill on the next billing cycle even though
  // the user "deleted" everything. Best-effort: legacy rows without a
  // Vercel URL or environments without BLOB_READ_WRITE_TOKEN simply skip.
  if (asset.url && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(asset.url);
    } catch (err) {
      // Don't fail the user-visible delete on a blob cleanup error;
      // orphan blobs are recoverable via a future reconciliation job.
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[media.deleteAsset] Vercel Blob del failed for ${input.assetId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
  return { success: true };
}

export async function moveAsset(userId: string, input: MoveAssetInput) {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: input.assetId },
    select: { userId: true },
  });
  if (!asset || asset.userId !== userId) {
    throw new Error("NOT_FOUND");
  }
  if (input.folderId) {
    const folder = await prisma.mediaFolder.findUnique({
      where: { id: input.folderId },
      select: { userId: true },
    });
    if (!folder || folder.userId !== userId) {
      throw new Error("FOLDER_NOT_FOUND");
    }
  }
  return prisma.mediaAsset.update({
    where: { id: input.assetId },
    data: { folderId: input.folderId },
  });
}

// ─── Asset versions (Phase B) ──────────────────────────────────────────────

export async function listAssetVersions(userId: string, input: ListAssetVersionsInput) {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: input.assetId },
    select: { userId: true },
  });
  if (!asset || asset.userId !== userId) {
    throw new Error("NOT_FOUND");
  }
  return prisma.mediaAssetVersion.findMany({
    where: { assetId: input.assetId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Phase B: write a new version row + auto-prune oldest if over PLAN_LIMITS cap.
 * Decision #7: Free 5 / Pro 25 / Business 100. Templates stay unlimited (different fn).
 */
export async function createAssetVersion(userId: string, input: CreateAssetVersionInput) {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: input.assetId },
    select: { userId: true },
  });
  if (!asset || asset.userId !== userId) {
    throw new Error("NOT_FOUND");
  }

  const plan = await getUserPlan(userId);
  const cap = PLAN_LIMITS[plan].assetVersionsCap as number;

  return prisma.$transaction(async (tx) => {
    const version = await tx.mediaAssetVersion.create({
      data: {
        assetId: input.assetId,
        url: input.url,
        bytes: input.bytes,
        edits: input.edits as Prisma.InputJsonValue,
      },
    });

    if (cap !== -1) {
      const count = await tx.mediaAssetVersion.count({
        where: { assetId: input.assetId },
      });
      if (count > cap) {
        // Drop the oldest (count - cap) entries.
        const toRemove = count - cap;
        const oldest = await tx.mediaAssetVersion.findMany({
          where: { assetId: input.assetId },
          orderBy: { createdAt: "asc" },
          take: toRemove,
          select: { id: true },
        });
        if (oldest.length > 0) {
          await tx.mediaAssetVersion.deleteMany({
            where: { id: { in: oldest.map((v: { id: string }) => v.id) } },
          });
        }
      }
    }

    return version;
  });
}

export async function restoreAssetVersion(userId: string, input: RestoreAssetVersionInput) {
  const version = await prisma.mediaAssetVersion.findUnique({
    where: { id: input.versionId },
    include: { asset: { select: { userId: true } } },
  });
  if (!version || version.asset.userId !== userId) {
    throw new Error("NOT_FOUND");
  }
  // Restore = update the parent asset to point at this version's URL.
  // The version row itself stays; parent asset reflects the active state.
  return prisma.mediaAsset.update({
    where: { id: version.assetId },
    data: { url: version.url, bytes: version.bytes },
  });
}

// ─── Storage quota (Phase C) ───────────────────────────────────────────────

/**
 * Phase C: storage quota check. Replaces editor's hardcoded 1GB IndexedDB cap.
 * Sums MediaAsset.bytes for the user; compares against PLAN_LIMITS[plan].storageMB.
 */
export async function checkStorageQuota(userId: string): Promise<StorageQuotaResult> {
  const plan = await getUserPlan(userId);
  const limitMB = PLAN_LIMITS[plan].storageMB as number;
  const totalBytes = limitMB === -1 ? -1 : limitMB * 1024 * 1024;

  const agg = await prisma.mediaAsset.aggregate({
    where: { userId },
    _sum: { bytes: true },
  });
  const usedBytes = agg._sum.bytes ?? 0;

  const ok = totalBytes === -1 || usedBytes < totalBytes;
  const warningAt80Percent =
    totalBytes !== -1 && usedBytes >= totalBytes * 0.8;

  return {
    ok,
    usedBytes,
    totalBytes,
    tier: plan,
    warningAt80Percent,
  };
}
