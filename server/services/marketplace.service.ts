import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isInstallableApp } from "@/lib/marketplace-catalog";
import { generateWorkspaceAppScripts } from "@/lib/marketplace-app-scripts";
import { isConfigurableApp, parseAppConfig } from "@buildrik/shared/schemas/marketplace";

/** Thrown when an appId isn't a catalog app, or is a Connect-type app (those are
 *  third-party OAuth integrations owned by Settings › Integrations, never
 *  installed into WorkspaceApp). */
export class AppNotInstallableError extends Error {
  code = "APP_NOT_INSTALLABLE" as const;
  constructor(appId: string) {
    super(`App "${appId}" cannot be installed`);
  }
}

/** Thrown when an appId has no configurable head-inject behaviour (Commerce,
 *  Memberships, Typeform, or any Connect-type app). */
export class AppNotConfigurableError extends Error {
  code = "APP_NOT_CONFIGURABLE" as const;
  constructor(appId: string) {
    super(`App "${appId}" cannot be configured`);
  }
}

/** App ids this workspace has installed. */
export async function listInstalledApps(workspaceId: string): Promise<string[]> {
  const rows = await prisma.workspaceApp.findMany({
    where: { workspaceId },
    select: { appId: true },
  });
  return rows.map((r) => r.appId);
}

/** Install a first-party app. Idempotent — installing twice is a no-op rather
 *  than a unique-constraint error. */
export async function installApp(workspaceId: string, appId: string): Promise<void> {
  if (!isInstallableApp(appId)) throw new AppNotInstallableError(appId);
  await prisma.workspaceApp.upsert({
    where: { workspaceId_appId: { workspaceId, appId } },
    create: { workspaceId, appId },
    update: {},
  });
}

/** Uninstall. Idempotent — uninstalling something not installed is a no-op. */
export async function uninstallApp(workspaceId: string, appId: string): Promise<void> {
  if (!isInstallableApp(appId)) throw new AppNotInstallableError(appId);
  await prisma.workspaceApp.deleteMany({ where: { workspaceId, appId } });
}

/** Read a single app's stored config (null if not installed or unconfigured).
 *  Used to pre-fill the Configure dialog. */
export async function getAppConfig(workspaceId: string, appId: string): Promise<unknown> {
  const row = await prisma.workspaceApp.findUnique({
    where: { workspaceId_appId: { workspaceId, appId } },
    select: { config: true },
  });
  return row?.config ?? null;
}

/** Validate + persist an app's config. Installs the app if not already present
 *  (configuring implies wanting it), so a single Save both enables and wires it.
 *  Throws AppNotConfigurableError for apps with no head-inject behaviour, and
 *  ZodError (caught by the router) for invalid config. */
export async function configureApp(
  workspaceId: string,
  appId: string,
  rawConfig: unknown,
): Promise<void> {
  if (!isConfigurableApp(appId)) throw new AppNotConfigurableError(appId);
  const config = parseAppConfig(appId, rawConfig) as Prisma.InputJsonValue;
  await prisma.workspaceApp.upsert({
    where: { workspaceId_appId: { workspaceId, appId } },
    create: { workspaceId, appId, config },
    update: { config },
  });
}

/**
 * Head-inject HTML for every installed, validly-configured app in the workspace.
 * Called by the publish worker to graft workspace-wide integrations (Live Chat,
 * …) onto each published page. Returns "" when nothing applies. The generator
 * re-validates each config, so a half-configured row never emits a broken tag.
 */
export async function getWorkspaceAppScripts(workspaceId: string): Promise<string> {
  const rows = await prisma.workspaceApp.findMany({
    where: { workspaceId },
    select: { appId: true, config: true },
  });
  return generateWorkspaceAppScripts(rows);
}
