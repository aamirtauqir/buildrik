import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

/**
 * Section-tab active-rule (spec 2026-07-16 §Section tabs, E7, test #2). The
 * helper is the SSOT for both SettingsRail and AgencyTabs: a segment-safe prefix
 * match, with an exact-match exception for a section's index href so the index
 * doesn't light on every sibling and nested survivors keep their parent lit.
 */

let pathname = "/dashboard/settings";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

import { useSectionTabActive, sectionTabClass } from "../section-tab-active";

function activeFor(href: string, current: string, opts?: { index?: boolean }) {
  pathname = current;
  return renderHook(() => useSectionTabActive(href, opts)).result.current;
}

describe("useSectionTabActive", () => {
  beforeEach(() => {
    pathname = "/dashboard/settings";
  });

  it("prefix-matches a non-index tab for its own sub-routes", () => {
    expect(activeFor("/dashboard/settings/integrations", "/dashboard/settings/integrations")).toBe(true);
    // Nested survivor: the vercel-team-picker OAuth callback keeps Integrations lit.
    expect(
      activeFor("/dashboard/settings/integrations", "/dashboard/settings/integrations/vercel-team-picker"),
    ).toBe(true);
  });

  it("does not match a sibling route", () => {
    expect(activeFor("/dashboard/settings/team", "/dashboard/settings/billing")).toBe(false);
  });

  it("is segment-safe — a shared prefix that is not a path boundary does not match", () => {
    // /dashboard/settings/ai must not light for /dashboard/settings/api-tokens.
    expect(activeFor("/dashboard/settings/ai", "/dashboard/settings/api-tokens")).toBe(false);
  });

  it("index href matches ONLY its exact path, never siblings", () => {
    expect(activeFor("/dashboard/settings", "/dashboard/settings", { index: true })).toBe(true);
    expect(activeFor("/dashboard/settings", "/dashboard/settings/team", { index: true })).toBe(false);
  });

  it("exposes shared token classes for both renderers", () => {
    expect(sectionTabClass.base).toContain("rounded-sm");
    expect(sectionTabClass.active).toContain("--color-primary-subtle");
    expect(sectionTabClass.inactive).toContain("hover:bg-[var(--color-bg-subtle)]");
  });
});
