import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Shared-theme push (redesign E2-T5b) — the ONLY layer that reads/writes the
 * workspace shared theme and applies it to sites. Every op is workspace-scoped
 * (IDOR guard): the router supplies workspaceId from the session, never from
 * client input, and site targets are filtered to the workspace.
 *
 * Model: an agency captures one site's tokens as `Workspace.sharedTheme`, then
 * pushes that token set onto its client sites' `projectStyles`. Push is
 * per-site and partial-fail tolerant (one site erroring never aborts the rest),
 * and skips sites with `themeLocked` (the per-site override).
 */

export class ThemeError extends Error {
  constructor(
    public code: "NOT_FOUND" | "NO_THEME" | "BAD_REQUEST",
    message: string,
  ) {
    super(message);
    this.name = "ThemeError";
  }
}

export interface SharedTheme {
  styles: unknown;
  updatedAt: Date;
}

export interface ThemeTarget {
  id: string;
  name: string;
  clientId: string | null;
  themeLocked: boolean;
  dsSchemaVersion: number;
}

export type PushStatus = "pushed" | "skipped-locked" | "failed";

export interface PushResult {
  siteId: string;
  name: string;
  status: PushStatus;
  error?: string;
}

// D2: how many pre-push snapshots to keep per site (oldest pruned on capture).
const SNAPSHOT_RETENTION = 10;

export interface PushPreview {
  siteId: string;
  name: string;
  status: "would-push" | "skipped-locked";
  /** True when the shared theme differs from the site's current tokens. */
  willChange: boolean;
}

/** The workspace shared theme, or null if none captured yet. */
export async function getSharedTheme(workspaceId: string): Promise<SharedTheme | null> {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { sharedTheme: true, sharedThemeUpdatedAt: true },
  });
  if (!ws || ws.sharedTheme == null || ws.sharedThemeUpdatedAt == null) return null;
  return { styles: ws.sharedTheme, updatedAt: ws.sharedThemeUpdatedAt };
}

/**
 * Capture a source site's current tokens as the workspace shared theme. The
 * source must live in the workspace. Returns the new capture timestamp.
 */
export async function captureSharedTheme(
  workspaceId: string,
  sourceSiteId: string,
): Promise<{ updatedAt: Date }> {
  const site = await prisma.site.findFirst({
    where: { id: sourceSiteId, workspaceId },
    select: { projectStyles: true },
  });
  if (!site) throw new ThemeError("NOT_FOUND", "Source site not found");

  const updatedAt = new Date();
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      sharedTheme:
        site.projectStyles == null
          ? Prisma.DbNull
          : (site.projectStyles as Prisma.InputJsonValue),
      sharedThemeUpdatedAt: updatedAt,
    },
  });
  return { updatedAt };
}

/** Every site in the workspace with its push-relevant state (drives the UI). */
export async function listThemeTargets(workspaceId: string): Promise<ThemeTarget[]> {
  const rows = await prisma.site.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, clientId: true, themeLocked: true, dsSchemaVersion: true },
  });
  return rows;
}

/** Toggle a site's per-site override (locked = excluded from pushes). */
export async function setSiteThemeLock(
  workspaceId: string,
  siteId: string,
  locked: boolean,
): Promise<void> {
  const site = await prisma.site.findFirst({
    where: { id: siteId, workspaceId },
    select: { id: true },
  });
  if (!site) throw new ThemeError("NOT_FOUND", "Site not found");
  await prisma.site.update({ where: { id: siteId }, data: { themeLocked: locked } });
}

/**
 * Push the workspace shared theme onto its sites. Targets default to every site
 * in the workspace; pass `siteIds` to scope (out-of-workspace ids are silently
 * excluded). Locked sites are skipped. Each site is written independently so one
 * failure never aborts the others — the caller gets a per-site result list.
 *
 * A pushed site's `dsSchemaVersion` is bumped so an open editor reloads tokens.
 */
export async function pushSharedTheme(
  workspaceId: string,
  siteIds?: string[],
): Promise<PushResult[]> {
  const theme = await getSharedTheme(workspaceId);
  if (!theme) {
    throw new ThemeError("NO_THEME", "No shared theme has been captured for this workspace");
  }

  const targets = await prisma.site.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(siteIds ? { id: { in: siteIds } } : {}),
    },
    select: { id: true, name: true, themeLocked: true, dsSchemaVersion: true, projectStyles: true },
  });

  const styles = theme.styles as Prisma.InputJsonValue;
  const results: PushResult[] = [];
  const savedAt = new Date();

  for (const site of targets) {
    if (site.themeLocked) {
      results.push({ siteId: site.id, name: site.name, status: "skipped-locked" });
      continue;
    }
    try {
      // D2: snapshot the site's CURRENT tokens before the push overwrites them,
      // atomically with the overwrite, so a bad push can be rolled back. Push was
      // previously a wholesale overwrite with no prior-value capture.
      await prisma.$transaction([
        prisma.siteThemeSnapshot.create({
          data: {
            siteId: site.id,
            workspaceId,
            prevStyles:
              site.projectStyles == null
                ? Prisma.DbNull
                : (site.projectStyles as Prisma.InputJsonValue),
            prevDsSchemaVersion: site.dsSchemaVersion,
          },
        }),
        prisma.site.update({
          where: { id: site.id },
          data: {
            projectStyles: styles,
            dsSchemaVersion: site.dsSchemaVersion + 1,
            lastEditedAt: savedAt,
          },
        }),
      ]);
      await pruneSnapshots(site.id);
      results.push({ siteId: site.id, name: site.name, status: "pushed" });
    } catch (e) {
      results.push({
        siteId: site.id,
        name: site.name,
        status: "failed",
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }
  return results;
}

/** Keep only the newest SNAPSHOT_RETENTION snapshots per site (best-effort). */
async function pruneSnapshots(siteId: string): Promise<void> {
  const keep = await prisma.siteThemeSnapshot.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    take: SNAPSHOT_RETENTION,
    select: { id: true },
  });
  if (keep.length < SNAPSHOT_RETENTION) return;
  await prisma.siteThemeSnapshot
    .deleteMany({ where: { siteId, id: { notIn: keep.map((s) => s.id) } } })
    .catch(() => {});
}

/**
 * D1: dry-run a push. Returns, per target, whether the shared theme would change
 * the site's tokens — so the UI can show the blast radius (and per-site opt-out)
 * BEFORE committing. Reads only; never writes.
 */
export async function previewSharedThemePush(
  workspaceId: string,
  siteIds?: string[],
): Promise<PushPreview[]> {
  const theme = await getSharedTheme(workspaceId);
  if (!theme) {
    throw new ThemeError("NO_THEME", "No shared theme has been captured for this workspace");
  }
  const targets = await prisma.site.findMany({
    where: { workspaceId, deletedAt: null, ...(siteIds ? { id: { in: siteIds } } : {}) },
    orderBy: { name: "asc" },
    select: { id: true, name: true, themeLocked: true, projectStyles: true },
  });
  const after = JSON.stringify(theme.styles ?? null);
  return targets.map((site) => {
    if (site.themeLocked) {
      return { siteId: site.id, name: site.name, status: "skipped-locked" as const, willChange: false };
    }
    const before = JSON.stringify(site.projectStyles ?? null);
    return { siteId: site.id, name: site.name, status: "would-push" as const, willChange: before !== after };
  });
}

/**
 * D2: roll a site back to its tokens from before the most recent push. Consumes
 * that snapshot (rollback pops the latest push) and bumps dsSchemaVersion so an
 * open editor reloads. Workspace-scoped (IDOR guard).
 */
export async function rollbackSiteTheme(
  workspaceId: string,
  siteId: string,
): Promise<{ rolledBackTo: Date }> {
  const site = await prisma.site.findFirst({
    where: { id: siteId, workspaceId },
    select: { id: true, dsSchemaVersion: true },
  });
  if (!site) throw new ThemeError("NOT_FOUND", "Site not found");

  const snap = await prisma.siteThemeSnapshot.findFirst({
    where: { siteId, workspaceId },
    orderBy: { createdAt: "desc" },
  });
  if (!snap) throw new ThemeError("NO_THEME", "No theme snapshot to roll back to");

  await prisma.$transaction([
    prisma.site.update({
      where: { id: siteId },
      data: {
        projectStyles:
          snap.prevStyles == null ? Prisma.DbNull : (snap.prevStyles as Prisma.InputJsonValue),
        dsSchemaVersion: site.dsSchemaVersion + 1,
        lastEditedAt: new Date(),
      },
    }),
    prisma.siteThemeSnapshot.delete({ where: { id: snap.id } }),
  ]);
  return { rolledBackTo: snap.createdAt };
}

/** D2: a site's rollback history (newest first). Workspace-scoped. */
export async function listSiteThemeSnapshots(
  workspaceId: string,
  siteId: string,
): Promise<Array<{ id: string; createdAt: Date }>> {
  const site = await prisma.site.findFirst({
    where: { id: siteId, workspaceId },
    select: { id: true },
  });
  if (!site) throw new ThemeError("NOT_FOUND", "Site not found");
  return prisma.siteThemeSnapshot.findMany({
    where: { siteId, workspaceId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
}

/**
 * D4: save a site's current tokens as a NAMED agency brand preset. Unlike the
 * single Workspace.sharedTheme, an agency keeps a library of presets (one per
 * client brand). Upsert by name. Workspace-scoped (source site must be in ws).
 */
export async function saveWorkspacePreset(
  workspaceId: string,
  name: string,
  sourceSiteId: string,
  createdBy?: string | null,
): Promise<{ name: string }> {
  const site = await prisma.site.findFirst({
    where: { id: sourceSiteId, workspaceId },
    select: { projectStyles: true },
  });
  if (!site) throw new ThemeError("NOT_FOUND", "Source site not found");
  const styles =
    site.projectStyles == null ? Prisma.DbNull : (site.projectStyles as Prisma.InputJsonValue);
  await prisma.workspacePreset.upsert({
    where: { workspaceId_name: { workspaceId, name } },
    create: { workspaceId, name, styles, createdBy: createdBy ?? null },
    update: { styles },
  });
  return { name };
}

/** D4: the agency's brand preset library (newest first). */
export async function listWorkspacePresets(
  workspaceId: string,
): Promise<Array<{ id: string; name: string; updatedAt: Date }>> {
  return prisma.workspacePreset.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  });
}

/** D4: remove a preset. Workspace-scoped; missing is a no-op. */
export async function deleteWorkspacePreset(
  workspaceId: string,
  presetId: string,
): Promise<{ ok: true }> {
  await prisma.workspacePreset.deleteMany({ where: { id: presetId, workspaceId } });
  return { ok: true } as const;
}

/**
 * D4: make a preset the active shared theme (then the agency pushes it via D1).
 * Workspace-scoped.
 */
export async function applyWorkspacePreset(
  workspaceId: string,
  presetId: string,
): Promise<{ updatedAt: Date }> {
  const preset = await prisma.workspacePreset.findFirst({
    where: { id: presetId, workspaceId },
    select: { styles: true },
  });
  if (!preset) throw new ThemeError("NOT_FOUND", "Preset not found");
  const updatedAt = new Date();
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      sharedTheme: preset.styles == null ? Prisma.DbNull : (preset.styles as Prisma.InputJsonValue),
      sharedThemeUpdatedAt: updatedAt,
    },
  });
  return { updatedAt };
}
