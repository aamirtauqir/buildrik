import { describe, it, expect } from "vitest";
import { NAV_GROUPS, isActiveRoute } from "@/components/dashboard/shell/nav";

/**
 * The sidebar moved to `shell/sidebar` in the shell rewrite (ab512dbc) and its
 * flat `SIDEBAR_NAV_ITEMS` became grouped `NAV_GROUPS`. This file kept importing
 * the old path and asserting the old six-item PRD list, so it has been red ever
 * since — and the new nav has had no coverage at all.
 *
 * These assert the contract rather than a frozen list, so adding a nav item is a
 * one-line change here (or none at all), not a test rewrite.
 */
const ITEMS = NAV_GROUPS.flatMap((g) => g.items);

describe("Sidebar navigation", () => {
  it("exposes grouped nav items", () => {
    expect(NAV_GROUPS.length).toBeGreaterThan(0);
    expect(ITEMS.length).toBeGreaterThan(0);
    for (const group of NAV_GROUPS) {
      expect(group.items.length, "an empty group renders a stray divider").toBeGreaterThan(0);
    }
  });

  it("gives every item a label, an href and an icon", () => {
    for (const item of ITEMS) {
      expect(item.label, JSON.stringify(item)).toBeTruthy();
      expect(item.href, item.label).toBeTruthy();
      expect(typeof item.icon, item.label).toBe("string");
    }
  });

  it("keeps every destination under /dashboard", () => {
    for (const item of ITEMS) {
      expect(item.href.startsWith("/dashboard"), `${item.label} → ${item.href}`).toBe(true);
    }
  });

  it("has no duplicate destinations", () => {
    // Two nav rows pointing at the same route means one of them highlights wrong
    // and the other is unreachable-looking. Usually a copy-paste.
    const hrefs = ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size, `duplicates in: ${hrefs.join(", ")}`).toBe(hrefs.length);
  });

  it("has no duplicate labels", () => {
    const labels = ITEMS.map((i) => i.label);
    expect(new Set(labels).size, `duplicates in: ${labels.join(", ")}`).toBe(labels.length);
  });

  it("gates the agency-only rows behind a flag rather than a separate list", () => {
    // Solo accounts must not see agency rows. They are marked, not filtered
    // out at definition time, so the flag has to survive.
    const agencyOnly = ITEMS.filter((i) => i.agencyOnly);
    expect(agencyOnly.length).toBeGreaterThan(0);
    for (const item of agencyOnly) {
      expect(item.agencyOnly).toBe(true);
    }
  });

  // IA v2 contract (spec 2026-07-16): 6 destinations + labeled 2-item Support
  // group. This IS a frozen list — the whole point of the redesign was the
  // count, so growing it is a design decision, not a one-line test edit.
  it("carries exactly the IA v2 six destinations plus the Support pair", () => {
    expect(NAV_GROUPS).toHaveLength(2);
    expect(NAV_GROUPS[0].items.map((i) => i.href)).toEqual([
      "/dashboard",
      "/dashboard/projects",
      "/dashboard/agency",
      "/dashboard/media",
      "/dashboard/templates",
      "/dashboard/settings",
    ]);
    expect(NAV_GROUPS[1].label).toBe("Support");
    expect(NAV_GROUPS[1].items.map((i) => i.href)).toEqual([
      "/dashboard/getting-started",
      "/dashboard/help",
    ]);
  });

  it("marks Agency — and ONLY Agency — agencyOnly", () => {
    const flagged = ITEMS.filter((i) => i.agencyOnly).map((i) => i.href);
    expect(flagged).toEqual(["/dashboard/agency"]);
  });

  // MobileTabBar filter (spec §Responsive, test #5). The mobile bar renders the
  // six primary destinations with the same agencyOnly filter: solo sees 5,
  // agency sees 6. The bar derives from NAV_GROUPS[0].items, so assert the
  // filter arithmetic at the source.
  it("filters the mobile destinations to 5 solo / 6 agency", () => {
    const primary = NAV_GROUPS[0].items;
    expect(primary).toHaveLength(6);
    const solo = primary.filter((i) => !i.agencyOnly);
    expect(solo).toHaveLength(5);
    expect(solo.some((i) => i.href === "/dashboard/agency")).toBe(false);
  });
});

describe("isActiveRoute", () => {
  it("activates Home only on the exact dashboard root", () => {
    expect(isActiveRoute("/dashboard", "/dashboard")).toBe(true);
    expect(isActiveRoute("/dashboard/projects", "/dashboard")).toBe(false);
  });

  it("keeps Projects active on surviving /dashboard/sites/* URLs", () => {
    // Site-detail keeps its URLs; its nav parent is Projects.
    expect(isActiveRoute("/dashboard/sites/abc123", "/dashboard/projects")).toBe(true);
    expect(isActiveRoute("/dashboard/sites/abc123/domains", "/dashboard/projects")).toBe(true);
    expect(isActiveRoute("/dashboard/projects", "/dashboard/projects")).toBe(true);
  });

  it("prefix-matches section roots for their sub-routes", () => {
    expect(isActiveRoute("/dashboard/settings/billing", "/dashboard/settings")).toBe(true);
    expect(isActiveRoute("/dashboard/agency/reviews", "/dashboard/agency")).toBe(true);
    expect(isActiveRoute("/dashboard/media", "/dashboard/agency")).toBe(false);
  });
});
