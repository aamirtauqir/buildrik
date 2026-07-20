import { describe, it, expect } from "vitest";
import { isEcosystemRoute, ECOSYSTEM_NAV, NAV_GROUPS } from "../nav";

/**
 * `isEcosystemRoute` decides whether a route is an ecosystem area (full-width, no
 * sidebar) or a workspace page (keeps the sidebar). The same predicate drives the
 * topbar's "Dashboard" active state, so a wrong answer is doubly visible: the
 * sidebar appears on a page meant to be full-width, or vanishes from a workspace
 * page, and the Dashboard tab lights up in the wrong place.
 */

describe("isEcosystemRoute", () => {
  it("is true for every ecosystem area and its sub-paths", () => {
    for (const item of ECOSYSTEM_NAV) {
      expect(isEcosystemRoute(item.href), item.href).toBe(true);
      expect(isEcosystemRoute(item.href + "/anything"), item.href + "/…").toBe(true);
    }
  });

  it("is false for the workspace root and its destinations", () => {
    // These keep the sidebar. /dashboard itself is the workspace home, not
    // ecosystem, so it must be false even though every ecosystem href also starts
    // with /dashboard.
    const workspace = [
      "/dashboard",
      "/dashboard/projects",
      "/dashboard/media",
      "/dashboard/templates",
      "/dashboard/settings",
      "/dashboard/settings/billing",
      "/dashboard/agency",
      "/dashboard/sites/abc123",
      "/dashboard/getting-started",
      "/dashboard/help",
    ];
    for (const path of workspace) {
      expect(isEcosystemRoute(path), path).toBe(false);
    }
  });

  it("does not match a route that merely starts with an ecosystem name", () => {
    // Guards the `startsWith(href + "/")` boundary: a hypothetical
    // /dashboard/learnings must not be swallowed by /dashboard/learn.
    expect(isEcosystemRoute("/dashboard/learnings")).toBe(false);
    expect(isEcosystemRoute("/dashboard/marketplaces")).toBe(false);
  });

  it("keeps the sidebar's Templates destination out of the ecosystem set", () => {
    // Templates is a workspace destination (sidebar), not an ecosystem tab, even
    // though the standalone Marketplace and Templates can feel adjacent.
    const templates = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.label === "Templates");
    expect(templates).toBeTruthy();
    expect(isEcosystemRoute(templates!.href)).toBe(false);
  });
});
