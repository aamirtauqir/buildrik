/**
 * searchIndex — the registry behind Search settings (Clone 3737:46109) and
 * the pure match over it. The shape facts the dialog and the shell rely on:
 * unique ids, the fifteen sections in the Clone's nav order, every S1 field
 * under the brief's id, and a ranking that keeps a section over its own
 * fields — the frame's `Domains` → `DNS records` order.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it } from "vitest";
import { SETTINGS_SEARCH_INDEX, searchSettings, type SettingsSearchScreen } from "../searchIndex";

const NAV_ORDER: SettingsSearchScreen[] = [
  "general",
  "branding",
  "localization",
  "seo",
  "domains",
  "redirects",
  "export",
  "analytics",
  "forms",
  "custom-code",
  "headers",
  "integrations",
  "webhooks",
  "members",
  "billing",
];

/** The brief's field ids for S1's three screens, by screen. */
const S1_FIELDS: Record<"general" | "seo" | "custom-code", string[]> = {
  general: ["site-name", "favicon-url", "site-language", "site-author", "social-twitter", "social-facebook", "social-linkedin", "canvas-grid-size", "canvas-snap"],
  seo: ["seo-meta-title", "seo-meta-description", "seo-twitter", "seo-og", "seo-allow-indexing", "seo-robots"],
  "custom-code": ["code-head", "code-body", "code-css"],
};

const sections = SETTINGS_SEARCH_INDEX.filter((e) => e.fieldId === undefined);
const titles = (hits: { title: string }[]) => hits.map((h) => h.title);

describe("SETTINGS_SEARCH_INDEX", () => {
  it("has a unique id on every entry and never an empty line", () => {
    const ids = SETTINGS_SEARCH_INDEX.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of SETTINGS_SEARCH_INDEX) {
      expect(e.title).not.toBe("");
      expect(e.description).not.toBe("");
      expect(e.group).not.toBe("");
    }
  });

  it("lists the fifteen sections once each, in the Clone's nav order, under their Clone labels and groups", () => {
    expect(sections.map((s) => s.screen)).toEqual(NAV_ORDER);
    expect(sections.map((s) => s.id)).toEqual(NAV_ORDER);
    expect(titles(sections)).toEqual([
      "General",
      "Fonts & colours",
      "Localization",
      "SEO defaults",
      "Domains",
      "Redirects",
      "Export",
      "Analytics",
      "Forms",
      "Custom code",
      "Headers",
      "Integrations",
      "Webhooks",
      "Members",
      "Billing",
    ]);
    expect(sections.map((s) => s.group)).toEqual([
      ...Array<string>(3).fill("Site setup"),
      ...Array<string>(4).fill("SEO & publishing"),
      ...Array<string>(2).fill("Visitors"),
      ...Array<string>(3).fill("Advanced"),
      ...Array<string>(3).fill("Workspace"),
    ]);
  });

  it("carries the Clone's pane subtitles on S1's sections and the search frame's on Domains and Redirects", () => {
    const byScreen = Object.fromEntries(sections.map((s) => [s.screen, s.description]));
    expect(byScreen.general).toBe("Manage your site identity, language and social profiles.");
    expect(byScreen.seo).toBe("Search & social preview");
    expect(byScreen["custom-code"]).toBe("Head, body, CSS injections");
    expect(byScreen.domains).toBe("Custom domain + DNS");
    expect(byScreen.redirects).toBe("301 / 302 redirects");
  });

  it("lists every S1 field under the brief's id, on its screen, grouped by its section, right after that section", () => {
    for (const [screen, ids] of Object.entries(S1_FIELDS)) {
      const own = SETTINGS_SEARCH_INDEX.filter((e) => e.screen === screen);
      expect(own[0].fieldId).toBeUndefined();
      expect(own.slice(1).map((e) => e.fieldId)).toEqual(ids);
      for (const e of own.slice(1)) {
        expect(e.id).toBe(`${screen}/${e.fieldId}`);
        expect(e.group).toBe(own[0].title);
      }
    }
  });

  it("keeps each section ahead of its fields and never interleaves screens", () => {
    let last: string | null = null;
    const seen = new Set<string>();
    for (const e of SETTINGS_SEARCH_INDEX) {
      if (e.screen !== last) {
        expect(seen.has(e.screen)).toBe(false);
        expect(e.fieldId).toBeUndefined();
        seen.add(e.screen);
        last = e.screen;
      }
    }
  });

  it("has no Force HTTPS row — the Domains screen has no such control", () => {
    expect(SETTINGS_SEARCH_INDEX.find((e) => /force https/i.test(e.title))).toBeUndefined();
  });
});

describe("searchSettings", () => {
  it("an empty (or blank) query is the section list, no fields", () => {
    expect(searchSettings("")).toEqual(sections);
    expect(searchSettings("   ")).toEqual(sections);
  });

  it("the frame's `domain`: Domains, then its fields, in registry order", () => {
    const hits = searchSettings("domain");
    expect(titles(hits)).toEqual(["Domains", "Domain", "DNS records"]);
    expect(hits[0].fieldId).toBeUndefined();
    expect(hits[2]).toMatchObject({ screen: "domains", fieldId: "dns-records", group: "Domains" });
  });

  it("matches case-insensitively over title, description and group", () => {
    expect(titles(searchSettings("DOMAIN"))).toEqual(titles(searchSettings("domain")));
    /* description */
    expect(titles(searchSettings("social profiles"))).toEqual(["General"]);
    /* a section's group */
    expect(titles(searchSettings("visitors"))).toEqual(["Analytics", "Forms"]);
    /* a field's group — its section */
    expect(titles(searchSettings("indexing"))).toEqual(["Allow search indexing", "robots.txt"]);
    expect(searchSettings("indexing").every((e) => e.screen === "seo")).toBe(true);
  });

  it("finds S1's fields by their labels", () => {
    expect(searchSettings("favicon")).toMatchObject([{ screen: "general", fieldId: "favicon-url" }]);
    expect(searchSettings("og image")).toMatchObject([{ screen: "seo", fieldId: "seo-og" }]);
    expect(titles(searchSettings("scripts"))).toEqual(["Head scripts", "Body scripts (end)"]);
  });

  it("returns nothing for a query nothing carries", () => {
    expect(searchSettings("zzz")).toEqual([]);
  });

  it("never reorders: every result set is a subsequence of the registry", () => {
    for (const q of ["e", "s", "a", "domain", "seo", "code"]) {
      const hits = searchSettings(q);
      const positions = hits.map((h) => SETTINGS_SEARCH_INDEX.indexOf(h));
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    }
  });
});
