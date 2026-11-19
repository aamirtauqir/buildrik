import type { StyleModel } from "@buildrik/shared/schemas/class-styles";

/**
 * Class-first styling switch (BD-30, CLASS-FIRST-SPEC §5.4). Server-side,
 * read per request — never NEXT_PUBLIC_*, so there is no VITE_/NEXT_PUBLIC_
 * pair and nothing baked at build. `CLASS_STYLES=on` enables every
 * workspace; `CLASS_STYLES_WORKSPACES` (comma-separated ids) only those —
 * the QA-workspace-first rollout, same shape as isBrandTokensV2Enabled.
 */
export function isClassStylesEnabled(workspaceId?: string): boolean {
  if (process.env.CLASS_STYLES === "on") return true;
  if (!workspaceId) return false;
  return (process.env.CLASS_STYLES_WORKSPACES ?? "").split(",").some((id) => id.trim() === workspaceId);
}

/**
 * The style model the editor loads and the save guard enforces: the site's
 * stored `styleModel` column, but "class" only while the flags enable its
 * workspace. Flags off = every site is "element", exactly today's behaviour,
 * whatever the column holds — so unsetting the flags is a full kill switch
 * (P0; P6 may narrow it to "stops new switches"). Load and save both read
 * this one function, so they always agree and a site cannot lock its own
 * editors out of saving.
 */
export function effectiveStyleModel(stored: string | null | undefined, workspaceId: string): StyleModel {
  return stored === "class" && isClassStylesEnabled(workspaceId) ? "class" : "element";
}

/** A NEW site's stored style model: "class" when `CLASS_STYLES_DEFAULT_NEW=on` and the workspace is enabled (rollout stage 3). */
export function newSiteStyleModel(workspaceId: string): StyleModel {
  return process.env.CLASS_STYLES_DEFAULT_NEW === "on" && isClassStylesEnabled(workspaceId) ? "class" : "element";
}
