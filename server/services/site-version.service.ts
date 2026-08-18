/**
 * Site version-history service (#3/26, 2026-06-24). Server persistence behind
 * the editor's VersionTimelineManager (which keeps the local IndexedDB cache).
 * Upsert-on-(siteId, versionId) so a re-mirror is idempotent; list returns
 * metadata only (never 50 full snapshots); get returns the payload for restore;
 * prune keeps the newest N to bound row growth (mirrors the local cap).
 *
 * @license BSD-3-Clause
 */
import { prisma } from "@/lib/prisma";
import type { CreateSiteVersionInput } from "@buildrik/shared/schemas/site-version";

const MAX_VERSIONS_PER_SITE = 50;

export async function createSiteVersion(input: CreateSiteVersionInput): Promise<{ versionId: string }> {
  const row = await prisma.siteVersion.upsert({
    where: { siteId_versionId: { siteId: input.siteId, versionId: input.versionId } },
    create: {
      siteId: input.siteId,
      versionId: input.versionId,
      name: input.name,
      isAuto: input.isAuto,
      payload: input.payload as never,
      createdBy: input.createdBy ?? null,
    },
    update: {
      name: input.name,
      isAuto: input.isAuto,
      payload: input.payload as never,
    },
  });
  await pruneSiteVersions(input.siteId);
  return { versionId: row.versionId };
}

export async function listSiteVersions(siteId: string) {
  return prisma.siteVersion.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    select: { versionId: true, name: true, isAuto: true, createdBy: true, createdAt: true },
  });
}

export async function getSiteVersion(siteId: string, versionId: string): Promise<unknown | null> {
  const row = await prisma.siteVersion.findUnique({
    where: { siteId_versionId: { siteId, versionId } },
    select: { payload: true },
  });
  return row?.payload ?? null;
}

export async function deleteSiteVersion(siteId: string, versionId: string): Promise<{ ok: true }> {
  // deleteMany (not delete) so a missing row is a no-op, not a P2025 throw —
  // the editor mirror fires delete best-effort and may race a prune.
  await prisma.siteVersion.deleteMany({ where: { siteId, versionId } });
  return { ok: true };
}

/**
 * Keep the newest MAX_VERSIONS_PER_SITE rows by evicting AUTO-SAVES only.
 *
 * Board 162:2 prints the rule under the list: "50 versions kept. Auto-saves
 * prune oldest first; named ones never prune." This deleted the oldest rows
 * whatever they were, so a milestone a user named — the one thing this feature
 * promises to keep — was dropped as soon as fifty newer rows existed. The
 * editor's own `pruneVersions` had the identical bug; both are fixed together.
 *
 * A site whose named versions alone exceed the cap keeps them all: "never
 * prune" is not "prune later".
 */
async function pruneSiteVersions(siteId: string): Promise<void> {
  const all = await prisma.siteVersion.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    select: { id: true, isAuto: true },
  });
  if (all.length <= MAX_VERSIONS_PER_SITE) return;
  const excess = all.length - MAX_VERSIONS_PER_SITE;
  const overflow = all
    .filter((r) => r.isAuto)
    .slice(-excess)
    .map((r) => r.id);
  if (overflow.length === 0) return;
  await prisma.siteVersion.deleteMany({ where: { id: { in: overflow } } });
}
