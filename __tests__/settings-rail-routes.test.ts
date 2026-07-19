import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SETTINGS_SECTIONS,
  SETTINGS_OWN_HREFS,
  findSettingsSection,
} from "@/components/dashboard/shell/settings-sections";

/**
 * Settings route smoke (spec 2026-07-16 §Settings, test #9). A typo or a missed
 * move would leave a section pointing at a 404. Rather than render every page
 * behind trpc + session mocks, assert every destination maps to a real page file
 * — the same guarantee, caught at the route table.
 *
 * The rail this used to cover is gone: settings now drills in from the directory,
 * so the section list moved to settings-sections.ts and the layout reads it back
 * to title a sub-page. Same contract, new source.
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

describe("settings sections", () => {
  it("points every settings-owned section at a real page file (no silent 404)", () => {
    for (const href of SETTINGS_OWN_HREFS) {
      const file = pageFileFor(href);
      expect(existsSync(file), `${href} → missing ${file}`).toBe(true);
    }
  });

  it("sends its two off-section cards to the agency routes, which are route-grouped", () => {
    // Reviews and Partner are agency pages the directory links out to. They live
    // under a (tabs) route group, so their URL path is not their file path — a
    // literal path check would wrongly report them missing. e2e/link-integrity
    // resolves these over real HTTP, which is what actually proves they serve.
    const offSection = SETTINGS_SECTIONS.map((s) => s.href).filter((h) => !SETTINGS_OWN_HREFS.includes(h));
    expect(offSection).toEqual(["/dashboard/agency/reviews", "/dashboard/agency/partner"]);
    for (const href of offSection) {
      const grouped = href.replace("/dashboard/agency/", "/dashboard/agency/(tabs)/");
      expect(existsSync(pageFileFor(grouped)), `${href} → missing grouped page`).toBe(true);
    }
  });

  it("keeps the index as the directory, with the workspace form on its own route", () => {
    expect(SETTINGS_OWN_HREFS[0]).toBe("/dashboard/settings/workspace");
    expect(existsSync(pageFileFor("/dashboard/settings/workspace"))).toBe(true);
    expect(existsSync(pageFileFor("/dashboard/settings"))).toBe(true);
  });

  it("carries the five moved-in routes", () => {
    for (const name of ["team", "plans", "usage", "billing", "domains"]) {
      const href = `/dashboard/settings/${name}`;
      expect(SETTINGS_OWN_HREFS).toContain(href);
      expect(existsSync(pageFileFor(href)), `moved route ${href} missing`).toBe(true);
    }
  });

  it("gives every section a label and a description for the drill-in header", () => {
    for (const section of SETTINGS_SECTIONS) {
      expect(section.label.length, `${section.href} has no label`).toBeGreaterThan(0);
      expect(section.description.length, `${section.href} has no description`).toBeGreaterThan(0);
    }
  });

  it("resolves a nested route to its parent section", () => {
    // Integrations has a child route; it must still title as Apps & Integrations
    // rather than falling through to the directory header.
    expect(findSettingsSection("/dashboard/settings/integrations/vercel-team-picker")?.href).toBe(
      "/dashboard/settings/integrations"
    );
    expect(findSettingsSection("/dashboard/settings/team")?.label).toBe("Team");
  });

  it("treats the index itself as the directory, not a section", () => {
    expect(findSettingsSection("/dashboard/settings")).toBeUndefined();
  });
});
