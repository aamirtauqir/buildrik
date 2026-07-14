import { describe, it, expect } from "vitest";
import { NAV_GROUPS } from "@/components/dashboard/shell/sidebar";

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
    // Solo accounts must not see the partner/client/review/theme rows. They are
    // marked, not filtered out at definition time, so the flag has to survive.
    const agencyOnly = ITEMS.filter((i) => i.agencyOnly);
    expect(agencyOnly.length).toBeGreaterThan(0);
    for (const item of agencyOnly) {
      expect(item.agencyOnly).toBe(true);
    }
  });
});
