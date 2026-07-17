import { describe, it, expect } from "vitest";
import { IA_V2_REDIRECTS } from "@lib/ia-v2-redirects.mjs";

/**
 * Redirect-table contract (spec 2026-07-16 §Redirects, test #3). The IA v2 merge
 * deletes 14 top-level routes; every one keeps a permanent redirect so emailed
 * links and stale bookmarks still land. `/dashboard/sites` must stay EXACT —
 * a wildcard would swallow the surviving site-detail `/dashboard/sites/[id]`.
 */

// The old routes that were deleted in the merge — every one must be a redirect
// source, and none may be a destination.
const DELETED_ROUTES = new Set([
  "/dashboard/sites",
  "/dashboard/apps",
  "/dashboard/reviews",
  "/dashboard/comments",
  "/dashboard/partner",
  "/dashboard/theme",
  "/dashboard/clients",
  "/dashboard/team",
  "/dashboard/plans",
  "/dashboard/usage",
  "/dashboard/billing",
  "/dashboard/domains",
  "/dashboard/integrations",
  "/dashboard/libraries",
]);

describe("IA v2 redirect table", () => {
  it("has exactly one rule per deleted route (15 total incl. clients/:id)", () => {
    // 14 deleted top-level routes + the clients/:id → agency/:id detail rule.
    expect(IA_V2_REDIRECTS).toHaveLength(15);
  });

  it("is permanent (308) on every rule — emailed /dashboard/reviews links", () => {
    for (const r of IA_V2_REDIRECTS) {
      expect(r.permanent, `${r.source} must be permanent`).toBe(true);
    }
  });

  it("sources every deleted route", () => {
    const sources = new Set(IA_V2_REDIRECTS.map((r) => r.source));
    for (const dead of DELETED_ROUTES) {
      expect(sources.has(dead), `no redirect for deleted route ${dead}`).toBe(true);
    }
  });

  it("never redirects TO a deleted route", () => {
    for (const r of IA_V2_REDIRECTS) {
      // Strip a :param so /dashboard/agency/:id compares as /dashboard/agency.
      const destRoot = r.destination.replace(/\/:[^/]+$/, "");
      expect(DELETED_ROUTES.has(destRoot), `${r.source} → dead ${r.destination}`).toBe(false);
    }
  });

  it("keeps /dashboard/sites EXACT so site-detail survives", () => {
    const sites = IA_V2_REDIRECTS.find((r) => r.source === "/dashboard/sites");
    expect(sites).toBeDefined();
    expect(sites?.source).toBe("/dashboard/sites"); // no /:path* wildcard
    expect(sites?.destination).toBe("/dashboard/projects");
  });

  it("routes the four agency concepts under /dashboard/agency", () => {
    const map = Object.fromEntries(IA_V2_REDIRECTS.map((r) => [r.source, r.destination]));
    expect(map["/dashboard/clients"]).toBe("/dashboard/agency");
    expect(map["/dashboard/clients/:id"]).toBe("/dashboard/agency/:id");
    expect(map["/dashboard/reviews"]).toBe("/dashboard/agency/reviews");
    expect(map["/dashboard/comments"]).toBe("/dashboard/agency/reviews");
    expect(map["/dashboard/theme"]).toBe("/dashboard/agency/theme");
    expect(map["/dashboard/partner"]).toBe("/dashboard/agency/partner");
  });

  it("routes the five settings movers under /dashboard/settings", () => {
    const map = Object.fromEntries(IA_V2_REDIRECTS.map((r) => [r.source, r.destination]));
    for (const name of ["team", "plans", "usage", "billing", "domains", "integrations"]) {
      expect(map[`/dashboard/${name}`]).toBe(`/dashboard/settings/${name}`);
    }
  });
});
