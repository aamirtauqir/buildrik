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

/**
 * Phase B5++ codex re-review pass 4 P1 fix: cross-tenant URL guard
 * applied at every URL-mutation surface, not just createAsset.
 *
 * The B5++ commit blocked URL_CONFLICT in createAsset, but missed two
 * other surfaces that ALSO write to MediaAsset.url:
 *   1. createAssetVersion accepts an arbitrary client-supplied URL
 *      and stores it on a MediaAssetVersion row (which becomes the
 *      MediaAsset.url after a restore call).
 *   2. restoreAssetVersion copies that version URL onto MediaAsset.url
 *      directly.
 *
 * Without a guard at all three surfaces, a user could smuggle another
 * tenant's URL into their own MediaAsset row via version+restore,
 * resurrecting the cross-tenant blob deletion vulnerability.
 *
 * This helper centralizes the check so future URL-mutation surfaces
 * either use it or fail review.
 */
async function assertUrlNotOwnedByOther(
  userId: string,
  url: string,
): Promise<void> {
  const conflictingAsset = await prisma.mediaAsset.findFirst({
    where: { url, NOT: { userId } },
    select: { id: true },
  });
  if (conflictingAsset) {
    throw new Error("URL_CONFLICT");
  }

  // Phase B5++++ codex re-review pass 5 P1 fix: also check
  // MediaAssetVersion. Pre-fix the guard only saw MediaAsset.url
  // refs, leaving versions as a 5th cross-tenant attack surface:
  // user A had a retained version at URL `U_v1`, user B could
  // create a MediaAsset at `U_v1` because the asset-only check
  // saw no conflict; when B's row was later deleted, deleteAsset's
  // ref-count guard ALSO only counted MediaAsset rows → del()
  // fired → A's version blob permanently gone. A version is
  // owned by whoever owns its parent asset.
  const conflictingVersion = await prisma.mediaAssetVersion.findFirst({
    where: {
      url,
      asset: { NOT: { userId } },
    },
    select: { id: true },
  });
  if (conflictingVersion) {
    throw new Error("URL_CONFLICT");
  }
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

  // Phase B5+ codex re-review pass 3 P0 fix [URL_CONFLICT]: reject if
  // the URL is already owned by a different user. Without this an
  // attacker can call createAsset({ url: someoneElsesPublicUrl }) to
  // mint a row pointing at another tenant's blob, then call
  // deleteAsset on their own row to wipe the shared underlying blob.
  // Pass 4: extracted into assertUrlNotOwnedByOther so the same guard
  // applies at every URL-mutation surface (versions, restore).
  await assertUrlNotOwnedByOther(userId, input.url);

  // Pre-fetch the existing row once for the quota delta. The actual
  // monotonic gate runs INSIDE the transaction below with SELECT FOR
  // UPDATE so the comparison is atomic — pass 4 fix.
  const preExisting = await prisma.mediaAsset.findUnique({
    where: { MediaAsset_userId_url_unique: { userId, url: input.url } },
    select: { bytes: true },
  });

  if (quota.totalBytes !== -1) {
    const delta = preExisting
      ? Math.max(input.bytes - preExisting.bytes, 0)
      : input.bytes;
    if (!quota.ok && quota.usedBytes + delta > quota.totalBytes) {
      throw new Error("QUOTA_EXCEEDED");
    }
  }

  return createAssetAtomic(userId, input);
}

/**
 * Phase B5++ codex re-review pass 4 P1 fix [bytes monotonic atomic].
 *
 * Pre-fix: createAsset used Prisma upsert with a JS-side stale-read
 * comparison. Two concurrent callers both saw existingBytes=0, both
 * fell through to write their own value, and the second write SHRANK
 * what the first wrote. The "monotonic" guarantee was monotonic at
 * row level only when callers were serialized.
 *
 * Fix: SELECT FOR UPDATE inside a transaction locks the row for the
 * bytes comparison. PostgreSQL READ COMMITTED isolation + row lock
 * gives atomic compare-and-update. Concurrent inserts (no row to
 * lock yet) are caught by the unique constraint as P2002, and the
 * caller retries — the second pass finds the row, locks it, and
 * applies the monotonic update.
 *
 * Why not raw INSERT ... ON CONFLICT ... DO UPDATE SET bytes = GREATEST:
 * Prisma's @default(cuid()) generates IDs JS-side, so a raw INSERT
 * would have to duplicate cuid generation (no available dep at root).
 * SELECT FOR UPDATE achieves the same atomicity through Prisma's
 * typed API without adding a runtime dep.
 */
async function createAssetAtomic(
  userId: string,
  input: CreateAssetInput,
  retryDepth = 0,
): Promise<{ id: string; url: string; bytes: number }> {
  if (retryDepth > 1) {
    // Two consecutive P2002s on the same key indicate something
    // pathological — bail rather than spin forever.
    throw new Error("CREATE_ASSET_CONFLICT_RETRY_EXCEEDED");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string; bytes: number }[]>`
        SELECT id, bytes FROM "media_assets"
        WHERE "userId" = ${userId} AND url = ${input.url}
        FOR UPDATE
      `;

      if (locked.length > 0) {
        const row = locked[0];
        if (input.bytes > row.bytes) {
          return tx.mediaAsset.update({
            where: { id: row.id },
            data: { bytes: input.bytes },
            select: { id: true, url: true, bytes: true },
          });
        }
        // Existing row already has bytes >= input.bytes — no-op,
        // monotonic invariant preserved.
        return { id: row.id, url: input.url, bytes: row.bytes };
      }

      return tx.mediaAsset.create({
        data: {
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
        select: { id: true, url: true, bytes: true },
      });
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      // Concurrent insert won the race. Re-enter — the row now
      // exists, SELECT FOR UPDATE locks it, monotonic update fires.
      return createAssetAtomic(userId, input, retryDepth + 1);
    }
    throw e;
  }
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

  // Phase B5+ codex re-review pass 3 P0 defense-in-depth: only delete
  // the Vercel Blob when no other MediaAsset row still references the
  // same URL. Combined with createAsset's URL_CONFLICT guard, this
  // makes cross-tenant blob deletion impossible: even if a stale row
  // ever survives the createAsset gate (race, bug, schema drift),
  // del() won't fire while another tenant's row still points at it.
  // Cost: orphan blobs accumulate when references exist; recoverable
  // via a future reconciliation job. Worth it for the safety property.
  if (asset.url && process.env.BLOB_READ_WRITE_TOKEN) {
    // Phase B5++++ codex re-review pass 5 P1 fix: count BOTH tables.
    // Pre-fix only counted MediaAsset rows, missing the case where
    // another user's MediaAssetVersion still pointed at the URL —
    // del() would fire and silently destroy that user's retained
    // version blob. Versions are restorable refs, so they must
    // protect the underlying blob from deletion just like assets.
    const [otherAssetRefs, otherVersionRefs] = await Promise.all([
      prisma.mediaAsset.count({ where: { url: asset.url } }),
      prisma.mediaAssetVersion.count({ where: { url: asset.url } }),
    ]);
    if (otherAssetRefs === 0 && otherVersionRefs === 0) {
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

  // Phase B5++ codex re-review pass 4 P1 fix: cross-tenant URL guard.
  // Pre-fix, createAssetVersion accepted any client-supplied URL and
  // stored it on the version row. A user could then call
  // restoreAssetVersion to copy that URL onto their MediaAsset, ending
  // up with their tenant's row pointing at another tenant's blob —
  // re-opening the cross-tenant blob deletion vulnerability that the
  // B5++ createAsset URL_CONFLICT guard was meant to close.
  await assertUrlNotOwnedByOther(userId, input.url);

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

  // Phase B5++ codex re-review pass 4 P1 fix: defense-in-depth URL
  // guard at restore time too. createAssetVersion now blocks adding
  // cross-tenant URLs to new versions, but legacy versions created
  // before the guard could still smuggle a foreign URL onto the
  // parent asset row at restore. Re-checking here closes that gap
  // for legacy data and protects against any future code path that
  // bypasses the createAssetVersion guard.
  await assertUrlNotOwnedByOther(userId, version.url);

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
