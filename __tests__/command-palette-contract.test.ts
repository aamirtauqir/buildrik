import { describe, it, expect } from "vitest";
import { PALETTE_HREFS, SETTINGS_ITEMS } from "@/components/search/command-palette";
import { SETTINGS_GROUPS } from "@/components/dashboard/shell/settings-sections";
import { NAV_GROUPS } from "@/components/dashboard/shell/nav";

/**
 * Command-palette contract (spec 2026-07-16 §Command palette, E2, test #4).
 * Every href the palette can navigate to — nav, settings, actions, and the
 * "moved" aliases — must resolve against the IA v2 route table. No entry may
 * point at a route the merge deleted; the whole point of the "moved" scope is
 * to rescue those searches, so a stale destination silently defeats it.
 */

// Routes the merge deleted — a bare match here means a dead palette link.
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

// Live destinations (path only). Site-detail sub-routes are covered by the
// /dashboard/sites/ prefix rule below.
const LIVE_ROUTES = new Set([
  "/dashboard",
  "/dashboard/projects",
  "/dashboard/agency",
  "/dashboard/agency/reviews",
  "/dashboard/agency/theme",
  "/dashboard/agency/partner",
  "/dashboard/media",
  "/dashboard/templates",
  "/dashboard/marketplace",
  "/dashboard/learn",
  "/dashboard/resources",
  "/dashboard/getting-started",
  "/dashboard/help",
  "/dashboard/notifications",
  "/dashboard/settings",
  // The settings index became the design's directory of section cards; the
  // workspace form it used to render moved to its own route.
  "/dashboard/settings/workspace",
  "/dashboard/settings/team",
  "/dashboard/settings/domains",
  "/dashboard/settings/integrations",
  "/dashboard/settings/ai",
  "/dashboard/settings/api-tokens",
  "/dashboard/settings/plans",
  "/dashboard/settings/billing",
  "/dashboard/settings/usage",
  "/dashboard/settings/account",
  "/dashboard/settings/profile",
  "/dashboard/settings/security",
  "/dashboard/settings/notifications",
  "/dashboard/settings/danger",
]);

const pathOf = (href: string) => href.split("?")[0];

describe("command palette — IA v2 route contract", () => {
  it("exposes a non-empty href list", () => {
    expect(PALETTE_HREFS.length).toBeGreaterThan(0);
  });

  it("never links to a deleted route", () => {
    for (const href of PALETTE_HREFS) {
      expect(DELETED_ROUTES.has(pathOf(href)), `palette links to dead ${href}`).toBe(false);
    }
  });

  it("resolves every href against the live route table", () => {
    for (const href of PALETTE_HREFS) {
      const path = pathOf(href);
      const ok = LIVE_ROUTES.has(path) || path.startsWith("/dashboard/sites/");
      expect(ok, `palette href ${href} is not a live route`).toBe(true);
    }
  });

  it("derives its nav destinations from NAV_GROUPS (E2)", () => {
    // Every sidebar destination must appear in the palette — the derivation is
    // what makes nav drift impossible.
    const navHrefs = NAV_GROUPS.flatMap((g) => g.items).map((i) => i.href);
    for (const href of navHrefs) {
      expect(PALETTE_HREFS.includes(href), `palette missing nav dest ${href}`).toBe(true);
    }
  });
});

describe("command palette — Settings entries follow the regrouped directory (Phase B §25)", () => {
  const cards = SETTINGS_GROUPS.flatMap((g) => g.items);

  it("every Settings entry opens a card of the directory — no AI & Credits, no Plans", () => {
    const cardHrefs = new Set(cards.map((c) => c.href));
    for (const item of SETTINGS_ITEMS) {
      expect(cardHrefs.has(item.href), `${item.label} → ${item.href} is not a settings card`).toBe(true);
    }
    expect(SETTINGS_ITEMS.map((i) => i.label)).not.toContain("AI & Credits");
    expect(SETTINGS_ITEMS.map((i) => i.label)).not.toContain("Plans");
  });

  it("the folded-in homes carry the directory's own names", () => {
    const byHref = (href: string) => SETTINGS_ITEMS.find((i) => i.href === href)?.label;
    const card = (href: string) => cards.find((c) => c.href === href)?.label;
    expect(byHref("/dashboard/settings/billing")).toBe(card("/dashboard/settings/billing"));
    expect(byHref("/dashboard/settings/usage")).toBe(card("/dashboard/settings/usage"));
  });
});
