/**
 * Brand restore points (spec §8, M10): the list, taking one before a big
 * change (generator, Dark Auto, logo/URL — OQ-6: the caller does not apply
 * when this returns false), and restoring one as a single transaction through
 * setDarkMode (a point that recorded Dark mode) or setTokens.
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { getBuildrikClient } from "@/services/api-client";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { mergeProjectTokens } from "@/engine/designSystem/projectTokens";
import { restoredTokens } from "@/engine/designSystem/restorePoint";

const client = () => getBuildrikClient(DASHBOARD_URL);

export async function takeRestorePoint(
  composer: Composer,
  siteId: string,
  reason: "generator" | "dark-auto" | "logo",
): Promise<boolean> {
  const s = composer.getProjectSettings();
  try {
    await client().theme.createBrandRestorePoint.mutate({
      siteId,
      reason,
      designTokens: Array.isArray(s.designTokens) ? s.designTokens : [],
      ...(Array.isArray(s.designPresets) ? { designPresets: s.designPresets } : {}),
      darkMode: s.darkMode === "auto" ? "auto" : "off",
    });
    return true;
  } catch {
    return false;
  }
}

export function useBrandRestorePoints(composer: Composer | null) {
  const siteId = getSiteIdFromUrl();
  const [rows, setRows] = React.useState<Array<{ id: string; reason: string; createdAt: Date }>>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");

  const refresh = React.useCallback(() => {
    if (!siteId) return;
    setStatus("loading");
    client().theme.brandRestorePoints.query({ siteId })
      .then((r) => { setRows(r); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, [siteId]);
  React.useEffect(refresh, [refresh]);

  const restore = React.useCallback(async (id: string): Promise<"restored" | "refused" | "failed"> => {
    if (!composer || !siteId) return "failed";
    let point;
    try {
      point = await client().theme.brandRestorePoint.query({ siteId, id });
    } catch {
      return "failed";
    }
    const s = composer.getProjectSettings();
    const current = mergeProjectTokens(s.designTokens ?? [], s.designTokensSchemaVersion);
    const usage = { count: (tokenId: string) => composer.designSystem.tokenUsage.getCount(tokenId) };
    const out = restoredTokens(point, current, usage);
    if (!out.ok) return "refused";
    const done = point.darkMode
      ? composer.designSystem.setDarkMode(point.darkMode, "Restore brand", out.tokens)
      : composer.designSystem.setTokens(out.tokens, "Restore brand");
    return done ? "restored" : "refused";
  }, [composer, siteId]);

  return { rows, status, refresh, restore };
}
