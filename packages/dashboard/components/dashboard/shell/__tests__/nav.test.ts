import { describe, it, expect } from "vitest";
import { isFullWidthRoute, ECOSYSTEM_NAV, NAV_GROUPS } from "../nav";

/**
 * `isFullWidthRoute` decides whether a route renders full-width with no workspace
 * sidebar (the ecosystem tabs plus reference pages like Help) or is a workspace
 * page that keeps the sidebar. The same predicate drives the topbar's "Dashboard"
 * active state, so a wrong answer is doubly visible: the sidebar appears on a page
 * meant to be full-width, or vanishes from a workspace page, and the Dashboard tab
 * lights up in the wrong place.
 */

describe("isFullWidthRoute", () => {
  it("is true for every ecosystem area and its sub-paths", () => {
    for (const item of ECOSYSTEM_NAV) {
      expect(isFullWidthRoute(item.href), item.href).toBe(true);
      expect(isFullWidthRoute(item.href + "/anything"), item.href + "/…").toBe(true);
    }
  });

  it("is true for Help — a full-width reference page reached from Resources", () => {
    // Help is full-width (no sidebar) but is NOT an Explore tab; it lives in
    // Resources. It renders like an ecosystem page without appearing in the topbar.
    expect(isFullWidthRoute("/dashboard/help")).toBe(true);
    expect(isFullWidthRoute("/dashboard/help/some-article")).toBe(true);
    expect(ECOSYSTEM_NAV.some((n) => n.href === "/dashboard/help")).toBe(false);
  });

  it("is false for the workspace root and its destinations", () => {
    // These keep the sidebar. /dashboard itself is the workspace home, so it must
    // be false even though every full-width href also starts with /dashboard.
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
    ];
    for (const path of workspace) {
      expect(isFullWidthRoute(path), path).toBe(false);
    }
  });

  it("does not match a route that merely starts with a full-width name", () => {
    // Guards the `startsWith(href + "/")` boundary: a hypothetical
    // /dashboard/learnings must not be swallowed by /dashboard/learn, and
    // /dashboard/helpful must not be swallowed by /dashboard/help.
    expect(isFullWidthRoute("/dashboard/learnings")).toBe(false);
    expect(isFullWidthRoute("/dashboard/marketplaces")).toBe(false);
    expect(isFullWidthRoute("/dashboard/helpful")).toBe(false);
  });

  it("keeps the sidebar's Templates destination full-width-free", () => {
    // Templates is a workspace destination (sidebar), not a full-width page.
    const templates = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.label === "Templates");
    expect(templates).toBeTruthy();
    expect(isFullWidthRoute(templates!.href)).toBe(false);
  });
});
