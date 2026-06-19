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
    select: { id: true, name: true, themeLocked: true, dsSchemaVersion: true },
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
      await prisma.site.update({
        where: { id: site.id },
        data: {
          projectStyles: styles,
          dsSchemaVersion: site.dsSchemaVersion + 1,
          lastEditedAt: savedAt,
        },
      });
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
