import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeProjectStyles } from "@/lib/sanitize-blocks";
import { validateTokens, TOKENS_SCHEMA_VERSION } from "@buildrik/shared/schemas/design-tokens";
import { migrateTokensToV6 } from "@buildrik/shared/tokens";
import { isBrandTokensV2Enabled } from "@server/services/brand-tokens";

/**
 * Shared-theme push (redesign E2-T5b) — the ONLY layer that reads/writes the
 * workspace shared theme and applies it to sites. Every op is workspace-scoped
 * (IDOR guard): the router supplies workspaceId from the session, never from
 * client input, and site targets are filtered to the workspace.
 *
 * Model: an agency captures one site's design tokens as `Workspace.sharedTheme`,
 * then pushes that token set onto its client sites. Push is per-site and
 * partial-fail tolerant (one site erroring never aborts the rest), and skips
 * sites with `themeLocked` (the per-site override).
 *
 * A-3: the tokens live in `projectSettings.designTokens` (+ `designPresets`) —
 * that is what the editor's Brand panel reads and writes. Every op here used to
 * read and write `projectStyles` instead, which holds the editor's per-element
 * CSS rules (`[data-buildrik-id]` selectors): capture copied one site's element
 * rules, and push REPLACED the target's element rules with them, wiping its
 * canvas styling while its brand tokens never changed. Shared themes, presets
 * and snapshots now hold a `TokenTheme`; one captured in the old
 * projectStyles shape is refused rather than written into a site.
 */

/** What a shared theme, a preset and a pre-push snapshot hold. */
interface TokenTheme {
  designTokens: unknown[];
  designPresets?: unknown[];
}

/** The token set inside `projectSettings` (or a stored TokenTheme); null for
 *  anything else, including the legacy projectStyles-shaped rule array. */
function readTokenTheme(value: unknown): TokenTheme | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { designTokens, designPresets } = value as { designTokens?: unknown; designPresets?: unknown };
  if (!Array.isArray(designTokens)) return null;
  return Array.isArray(designPresets) ? { designTokens, designPresets } : { designTokens };
}

/** `projectSettings` with a token set written into it; every other setting kept. */
function withTokens(projectSettings: unknown, theme: TokenTheme, schemaVersion?: number): Prisma.InputJsonValue {
  const current =
    projectSettings && typeof projectSettings === "object" && !Array.isArray(projectSettings)
      ? (projectSettings as Record<string, unknown>)
      : {};
  return {
    ...current,
    designTokens: theme.designTokens,
    ...(theme.designPresets ? { designPresets: theme.designPresets } : {}),
    ...(schemaVersion === undefined ? {} : { designTokensSchemaVersion: schemaVersion }),
  } as Prisma.InputJsonValue;
}

/** The token schema version a site's settings declare; a site that never
 *  stored one is v5 (what every site held before versions were written). */
function storedTokensVersion(projectSettings: unknown): number {
  if (!projectSettings || typeof projectSettings !== "object") return 5;
  const v = (projectSettings as { designTokensSchemaVersion?: unknown }).designTokensSchemaVersion;
  return typeof v === "number" && Number.isInteger(v) ? v : 5;
}

/** A site's token set exactly as it stands — designPresets absence included,
 *  so a rollback can put the site back to "no presets". */
function snapshotTokens(projectSettings: unknown): TokenTheme {
  const current =
    projectSettings && typeof projectSettings === "object" && !Array.isArray(projectSettings)
      ? (projectSettings as { designTokens?: unknown; designPresets?: unknown })
      : {};
  const designTokens = Array.isArray(current.designTokens) ? current.designTokens : [];
  return Array.isArray(current.designPresets)
    ? { designTokens, designPresets: current.designPresets }
    : { designTokens };
}

/** `projectSettings` put back to a snapshot's token set — presets removed when
 *  the snapshot had none (withTokens leaves them, which is right for a push). */
function restoreTokens(projectSettings: unknown, snapshot: TokenTheme, snapshotVersion: number): Prisma.InputJsonValue {
  /* A push that migrated the tokens also raised the stored version; put the
     version back with them. Never lowered otherwise — older snapshots carry
     the column default, which says nothing about a v1-v4 site. */
  const upgraded = storedTokensVersion(projectSettings) > snapshotVersion;
  const restored = { ...(withTokens(projectSettings, snapshot, upgraded ? snapshotVersion : undefined) as Record<string, unknown>) };
  if (!snapshot.designPresets) delete restored.designPresets;
  if (upgraded) delete restored.darkMode;
  return restored as Prisma.InputJsonValue;
}

const LEGACY_THEME_MESSAGE =
  "This theme was captured in an older format that would overwrite page styles. Capture it again from a source site.";

/** The workspace's shared theme as a token set, or NO_THEME. */
async function requireTokenTheme(workspaceId: string): Promise<TokenTheme> {
  const shared = await getSharedTheme(workspaceId);
  if (!shared) {
    throw new ThemeError("NO_THEME", "No shared theme has been captured for this workspace");
  }
  const theme = readTokenTheme(shared.styles);
  if (!theme) throw new ThemeError("NO_THEME", LEGACY_THEME_MESSAGE);
  return theme;
}

export class ThemeError extends Error {
  constructor(
    public code: "NOT_FOUND" | "NO_THEME" | "BAD_REQUEST" | "CONFLICT",
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

export type PushStatus = "pushed" | "skipped-locked" | "skipped-held" | "skipped-version" | "failed";

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
  status: "would-push" | "skipped-locked" | "skipped-held" | "skipped-version";
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
  const theme = await readSourceTokens(workspaceId, sourceSiteId);
  const updatedAt = new Date();
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      sharedTheme: theme as unknown as Prisma.InputJsonValue,
      sharedThemeUpdatedAt: updatedAt,
    },
  });
  return { updatedAt };
}

/**
 * A source site's token set, workspace-scoped. A site with no brand tokens yet
 * is refused: capturing nothing used to report "Theme captured" over a no-op —
 * a new user's FIRST agency action succeeding at nothing.
 */
async function readSourceTokens(workspaceId: string, sourceSiteId: string): Promise<TokenTheme> {
  const site = await prisma.site.findFirst({
    where: { id: sourceSiteId, workspaceId },
    select: { projectSettings: true },
  });
  if (!site) throw new ThemeError("NOT_FOUND", "Source site not found");
  const theme = readTokenTheme(site.projectSettings);
  if (!theme || theme.designTokens.length === 0) {
    throw new ThemeError(
      "BAD_REQUEST",
      "That site has no brand tokens to capture yet — open it, set your brand colours and type, then capture.",
    );
  }
  return theme;
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
  const theme = await requireTokenTheme(workspaceId);

  const targets = await prisma.site.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(siteIds ? { id: { in: siteIds } } : {}),
    },
    select: { id: true, name: true, themeLocked: true, dsSchemaVersion: true, projectSettings: true, lastEditedAt: true, tokensMigrationHold: true },
  });

  const results: PushResult[] = [];
  const savedAt = new Date();
  const migrated = migrateSharedTheme(theme);

  for (const site of targets) {
    if (site.themeLocked) {
      results.push({ siteId: site.id, name: site.name, status: "skipped-locked" });
      continue;
    }
    const plan = planPush(theme, migrated, site);
    if (plan.kind !== "write") {
      results.push({
        siteId: site.id,
        name: site.name,
        status: plan.kind,
        ...(plan.kind === "skipped-version" ? { error: SKIPPED_VERSION_MESSAGE } : {}),
      });
      continue;
    }
    const pushed = plan;
    try {
      // D2: snapshot the site's CURRENT tokens before the push overwrites them,
      // atomically with the overwrite, so a bad push can be rolled back. Push was
      // previously a wholesale overwrite with no prior-value capture.
      /* CAS on the lastEditedAt read above: projectSettings is merged from
         that read, so an editor save landing in between would be silently
         reverted by this write. It fails that site instead ("changed while
         pushing" — push again). */
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.site.updateMany({
          where: { id: site.id, lastEditedAt: site.lastEditedAt },
          data: {
            projectSettings: withTokens(site.projectSettings, pushed.theme, pushed.version),
            dsSchemaVersion: site.dsSchemaVersion + 1,
            lastEditedAt: savedAt,
          },
        });
        if (claimed.count === 0) throw new Error("This site changed while pushing — push again.");
        await tx.siteThemeSnapshot.create({
          data: {
            siteId: site.id,
            workspaceId,
            prevStyles: snapshotTokens(site.projectSettings) as unknown as Prisma.InputJsonValue,
            prevDsSchemaVersion: site.dsSchemaVersion,
            reason: "theme-push",
            tokensSchemaVersion: storedTokensVersion(site.projectSettings),
          },
        });
      });
      await pruneThemeSnapshots(site.id);
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

/** A non-v6 workspace theme moved to v6 for a push (switch on). Null when it
 *  is already v6, the switch is off, or it cannot migrate. */
function migrateSharedTheme(theme: TokenTheme): TokenTheme | null {
  if (!isBrandTokensV2Enabled() || validateTokens(theme.designTokens).ok) return null;
  try {
    return { ...theme, designTokens: migrateTokensToV6(theme.designTokens) };
  } catch (e) {
    console.warn("[theme] workspace theme did not migrate; pushing as-is", {
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

const SKIPPED_VERSION_MESSAGE =
  "This site uses the new brand format; re-capture the theme from an upgraded site.";

type PushPlan =
  | { kind: "write"; theme: TokenTheme; version: number }
  | { kind: "skipped-held" | "skipped-version" };

/**
 * What a push does to one site, from the theme's REAL version (v6 when it
 * validates, else v5), so the stored version label always matches the tokens
 * written. A held site (brand rolled back) never takes v6; a v6 site never
 * takes v5. A v5 theme migrates for a non-held site when the switch is on.
 */
function planPush(
  theme: TokenTheme,
  migrated: TokenTheme | null,
  site: { projectSettings: unknown; tokensMigrationHold: boolean },
): PushPlan {
  if (validateTokens(theme.designTokens).ok) {
    return site.tokensMigrationHold ? { kind: "skipped-held" } : { kind: "write", theme, version: TOKENS_SCHEMA_VERSION };
  }
  if (migrated && !site.tokensMigrationHold) return { kind: "write", theme: migrated, version: TOKENS_SCHEMA_VERSION };
  if (storedTokensVersion(site.projectSettings) >= TOKENS_SCHEMA_VERSION) return { kind: "skipped-version" };
  return { kind: "write", theme, version: 5 };
}

/** Keep only the newest SNAPSHOT_RETENTION snapshots per site (best-effort).
 *  `migration` rows are the one-time undo for the v6 move and are never pruned. */
export async function pruneThemeSnapshots(siteId: string): Promise<void> {
  try {
    const keep = await prisma.siteThemeSnapshot.findMany({
      where: { siteId, reason: { not: "migration" } },
      orderBy: { createdAt: "desc" },
      take: SNAPSHOT_RETENTION,
      select: { id: true },
    });
    if (keep.length < SNAPSHOT_RETENTION) return;
    await prisma.siteThemeSnapshot.deleteMany({
      where: { siteId, reason: { not: "migration" }, id: { notIn: keep.map((s) => s.id) } },
    });
  } catch (e) {
    console.warn("[theme] prune failed", { siteId, error: e instanceof Error ? e.message : String(e) });
  }
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
  const theme = await requireTokenTheme(workspaceId);
  const targets = await prisma.site.findMany({
    where: { workspaceId, deletedAt: null, ...(siteIds ? { id: { in: siteIds } } : {}) },
    orderBy: { name: "asc" },
    select: { id: true, name: true, themeLocked: true, projectSettings: true, tokensMigrationHold: true },
  });
  const migrated = migrateSharedTheme(theme);
  return targets.map((site) => {
    if (site.themeLocked) {
      return { siteId: site.id, name: site.name, status: "skipped-locked" as const, willChange: false };
    }
    const plan = planPush(theme, migrated, site);
    if (plan.kind !== "write") return { siteId: site.id, name: site.name, status: plan.kind, willChange: false };
    const before = JSON.stringify(readTokenTheme(site.projectSettings)?.designTokens ?? []);
    const versionChanges = storedTokensVersion(site.projectSettings) !== plan.version;
    return {
      siteId: site.id,
      name: site.name,
      status: "would-push" as const,
      willChange: versionChanges || before !== JSON.stringify(plan.theme.designTokens),
    };
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
    select: { id: true, dsSchemaVersion: true, projectSettings: true, lastEditedAt: true },
  });
  if (!site) throw new ThemeError("NOT_FOUND", "Site not found");

  const snap = await prisma.siteThemeSnapshot.findFirst({
    where: { siteId, workspaceId, reason: "theme-push" },
    orderBy: { createdAt: "desc" },
  });
  if (!snap) throw new ThemeError("NO_THEME", "No theme snapshot to roll back to");

  /* A token snapshot restores the tokens. A snapshot taken by the old
     projectStyles push holds the element rules that push overwrote, so
     restoring them there is still the right undo. */
  const prevTokens = readTokenTheme(snap.prevStyles);
  /* CAS on the lastEditedAt read above, like push: projectSettings is merged
     from that read, so an editor save landing in between would be silently
     reverted by a blind write. A lost race refuses and keeps the snapshot. */
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.site.updateMany({
      where: { id: siteId, lastEditedAt: site.lastEditedAt },
      data: {
        ...(prevTokens
          ? { projectSettings: restoreTokens(site.projectSettings, prevTokens, snap.tokensSchemaVersion) }
          : {
              // S-1 class: a legacy snapshot's `prevStyles` was frozen before
              // the allowlist sanitizer shipped (or by a path that predates
              // it) — re-run it on restore rather than writing the snapshot
              // back verbatim.
              projectStyles:
                snap.prevStyles == null
                  ? Prisma.DbNull
                  : (sanitizeProjectStyles(snap.prevStyles) as Prisma.InputJsonValue),
            }),
        dsSchemaVersion: site.dsSchemaVersion + 1,
        lastEditedAt: new Date(),
      },
    });
    if (claimed.count === 0) {
      throw new ThemeError("CONFLICT", "This site changed while rolling back — nothing was changed. Try again.");
    }
    await tx.siteThemeSnapshot.delete({ where: { id: snap.id } });
  });
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
    where: { siteId, workspaceId, reason: "theme-push" },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
}

/**
 * Operator-only (no router): undo a site's v6 migration. Writes the migration
 * snapshot's tokens and version back verbatim, drops dark mode, bumps
 * dsSchemaVersion and sets the hold so nothing migrates the site again until
 * clearTokenMigrationHold. lastEditedAt moves too, so a stale open tab gets a
 * save conflict instead of overwriting the rollback.
 */
export async function rollbackTokenMigration(siteId: string): Promise<{ restoredVersion: number }> {
  const snap = await prisma.siteThemeSnapshot.findFirst({
    where: { siteId, reason: "migration" },
    orderBy: { createdAt: "desc" },
  });
  if (!snap) throw new ThemeError("NOT_FOUND", "No migration snapshot for this site");
  const prev = readTokenTheme(snap.prevStyles);
  if (!prev) throw new ThemeError("BAD_REQUEST", "The migration snapshot holds no token set");
  const site = await prisma.site.findUniqueOrThrow({
    where: { id: siteId },
    select: { projectSettings: true, dsSchemaVersion: true, lastEditedAt: true },
  });
  const current =
    site.projectSettings && typeof site.projectSettings === "object" && !Array.isArray(site.projectSettings)
      ? (site.projectSettings as Record<string, unknown>)
      : {};
  const { darkMode: _darkMode, ...rest } = current;
  const claimed = await prisma.site.updateMany({
    where: { id: siteId, lastEditedAt: site.lastEditedAt },
    data: {
      projectSettings: {
        ...rest,
        designTokens: prev.designTokens,
        designTokensSchemaVersion: snap.tokensSchemaVersion,
      } as Prisma.InputJsonValue,
      dsSchemaVersion: site.dsSchemaVersion + 1,
      tokensMigrationHold: true,
      lastEditedAt: new Date(),
    },
  });
  if (claimed.count === 0) {
    throw new ThemeError("CONFLICT", "This site changed while rolling back — nothing was changed. Try again.");
  }
  return { restoredVersion: snap.tokensSchemaVersion };
}

/** Operator-only (no router): let a rolled-back site migrate again. */
export async function clearTokenMigrationHold(siteId: string): Promise<void> {
  await prisma.site.update({ where: { id: siteId }, data: { tokensMigrationHold: false } });
}

/** Restore points the Brand panel offers: only snapshots holding a token set.
 *  Legacy projectStyles snapshots stay admin-rollback-only. */
export async function listBrandRestorePoints(
  siteId: string,
): Promise<Array<{ id: string; reason: string; createdAt: Date }>> {
  const rows = await prisma.siteThemeSnapshot.findMany({
    where: { siteId, site: { deletedAt: null } },
    orderBy: { createdAt: "desc" },
    select: { id: true, reason: true, createdAt: true, prevStyles: true },
  });
  return rows
    .filter((r) => readTokenTheme(r.prevStyles) !== null)
    .map(({ id, reason, createdAt }) => ({ id, reason, createdAt }));
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
  const styles = (await readSourceTokens(workspaceId, sourceSiteId)) as unknown as Prisma.InputJsonValue;
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
  const theme = readTokenTheme(preset.styles);
  if (!theme) throw new ThemeError("BAD_REQUEST", LEGACY_THEME_MESSAGE);
  const updatedAt = new Date();
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      sharedTheme: theme as unknown as Prisma.InputJsonValue,
      sharedThemeUpdatedAt: updatedAt,
    },
  });
  return { updatedAt };
}
