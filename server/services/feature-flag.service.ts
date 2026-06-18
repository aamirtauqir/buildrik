import { prisma } from "@/lib/prisma";
import {
  FEATURE_KEYS,
  type FeatureKey,
  type WorkspaceFeatureMap,
} from "@buildrik/shared/schemas/feature-flags";

/**
 * Per-workspace feature flags — the ONLY layer that reads/writes the flag table.
 *
 *   isFeatureEnabled ──> WorkspaceFeature row?  ──yes──> row.enabled
 *                                              ──no───> false (default-off, ships dark)
 *
 * Used by E2 (agency_layer) and E4 (client_mode) to gate the riskiest epics with a
 * runtime kill-switch (UPDATE one row), not a build-time env flag.
 */
export async function isFeatureEnabled(
  workspaceId: string,
  key: FeatureKey,
): Promise<boolean> {
  const row = await prisma.workspaceFeature.findUnique({
    where: { workspaceId_key: { workspaceId, key } },
    select: { enabled: true },
  });
  return row?.enabled ?? false;
}

/** All known flags for a workspace, defaulting every absent key to false. */
export async function listWorkspaceFeatures(
  workspaceId: string,
): Promise<WorkspaceFeatureMap> {
  const rows = await prisma.workspaceFeature.findMany({
    where: { workspaceId },
    select: { key: true, enabled: true },
  });
  const map = Object.fromEntries(
    FEATURE_KEYS.map((k) => [k, false]),
  ) as WorkspaceFeatureMap;
  for (const r of rows) {
    if ((FEATURE_KEYS as readonly string[]).includes(r.key)) {
      map[r.key as FeatureKey] = r.enabled;
    }
  }
  return map;
}

/** Toggle a flag (Admin-gated at the router layer). Idempotent upsert. */
export async function setFeature(
  workspaceId: string,
  key: FeatureKey,
  enabled: boolean,
): Promise<void> {
  await prisma.workspaceFeature.upsert({
    where: { workspaceId_key: { workspaceId, key } },
    create: { workspaceId, key, enabled },
    update: { enabled },
  });
}
