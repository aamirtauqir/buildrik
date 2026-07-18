import { prisma } from "@/lib/prisma";
import { isInstallableApp } from "@/lib/marketplace-catalog";

/** Thrown when an appId isn't a catalog app, or is a Connect-type app (those are
 *  third-party OAuth integrations owned by Settings › Integrations, never
 *  installed into WorkspaceApp). */
export class AppNotInstallableError extends Error {
  code = "APP_NOT_INSTALLABLE" as const;
  constructor(appId: string) {
    super(`App "${appId}" cannot be installed`);
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
