import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SETTINGS_RAIL_HREFS } from "@/components/dashboard/shell/settings-rail";

/**
 * Settings smoke (spec 2026-07-16 §Settings, test #9). The 366-line index split
 * moved five routes in and repointed the rail; a typo or a missed move would
 * leave a rail item pointing at a 404. Rather than render 14 pages behind trpc +
 * session mocks, assert every rail destination maps to a real page file — the
 * same guarantee, caught at the route table.
 */

const APP_DASHBOARD = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../packages/dashboard/app/dashboard",
);

// "/dashboard/settings/team" → app/dashboard/settings/team/page.tsx
function pageFileFor(href: string): string {
  const rel = href.replace(/^\/dashboard/, "");
  return resolve(APP_DASHBOARD, `.${rel}/page.tsx`);
}

describe("settings rail routes", () => {
  it("lists the expected 14 destinations", () => {
    expect(SETTINGS_RAIL_HREFS).toHaveLength(14);
  });

  it("points every rail item at a real page file (no silent 404)", () => {
    for (const href of SETTINGS_RAIL_HREFS) {
      expect(href.startsWith("/dashboard/settings")).toBe(true);
      const file = pageFileFor(href);
      expect(existsSync(file), `${href} → missing ${file}`).toBe(true);
    }
  });

  it("keeps the index (Workspace) at /dashboard/settings", () => {
    expect(SETTINGS_RAIL_HREFS[0]).toBe("/dashboard/settings");
    expect(existsSync(pageFileFor("/dashboard/settings"))).toBe(true);
  });

  it("carries the five moved-in routes", () => {
    for (const name of ["team", "plans", "usage", "billing", "domains"]) {
      const href = `/dashboard/settings/${name}`;
      expect(SETTINGS_RAIL_HREFS).toContain(href);
      expect(existsSync(pageFileFor(href)), `moved route ${href} missing`).toBe(true);
    }
  });
});
