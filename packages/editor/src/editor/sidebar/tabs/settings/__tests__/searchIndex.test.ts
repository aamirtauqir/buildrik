/**
 * searchIndex — the registry behind the sidebar's "Search site settings"
 * filter, rebuilt for the Phase B IA (§25). The shape facts the shell relies
 * on: unique ids, one section per nav row in sidebar order with the nav's own
 * title / subtitle / group (so search cannot name a row the sidebar lacks),
 * the anchors of the fields that moved here in Phase B (the Lane 0 contract),
 * aliases that match without being drawn, and a ranking that keeps a section
 * ahead of its own fields.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it } from "vitest";
import { SETTINGS_SEARCH_INDEX, searchSettings, type SettingsSearchScreen } from "../searchIndex";
import { SETTINGS_NAV, SETTINGS_NAV_GROUPS } from "../constants";

const NAV_ORDER: SettingsSearchScreen[] = [
  "general",
  "localization",
  "branding",
  "seo",
  "domains",
  "redirects",
  "access",
  "analytics",
  "forms",
  "custom-code",
  "headers",
  "danger-zone",
  "members",
  "billing",
  "webhooks",
];

const sections = SETTINGS_SEARCH_INDEX.filter((e) => e.fieldId === undefined);
const titles = (hits: { title: string }[]) => hits.map((h) => h.title);
const fieldsOf = (screen: SettingsSearchScreen) =>
  SETTINGS_SEARCH_INDEX.filter((e) => e.screen === screen && e.fieldId !== undefined).map((e) => e.fieldId);

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

  it("lists every nav row once, in sidebar order — no Export, no Integrations (PD-2)", () => {
    expect(sections.map((s) => s.screen)).toEqual(NAV_ORDER);
    expect(sections.map((s) => s.screen)).toEqual(SETTINGS_NAV.map((n) => n.id));
    expect(sections.some((s) => /export|^integrations$/i.test(s.title))).toBe(false);
  });

  it("takes each section's title, subtitle and group from the nav itself", () => {
    for (const s of sections) {
      const nav = SETTINGS_NAV.find((n) => n.id === s.screen)!;
      expect(s.title).toBe(nav.title.replace(/ ↗$/, ""));
      expect(s.description).toBe(nav.subtitle);
      expect(s.group).toBe(SETTINGS_NAV_GROUPS[nav.group]);
    }
    expect(titles(sections)).toEqual([
      "General",
      "Languages",
      "Brand",
      "SEO",
      "Domains",
      "Redirects",
      "Access",
      "Analytics",
      "Form submissions",
      "Custom code",
      "Security headers",
      "Danger zone",
      "Members",
      "Billing",
      "Integrations & webhooks",
    ]);
  });

  it("indexes the fields that moved in Phase B under the anchors their screens must set", () => {
    expect(fieldsOf("general")).toEqual(["site-name", "favicon-url", "touch-icon", "site-author", "site-slug"]);
    expect(fieldsOf("seo")).toEqual([
      "seo-meta-title",
      "seo-meta-description",
      "seo-og",
      "social-twitter",
      "social-facebook",
      "social-linkedin",
      "social-instagram",
      "social-youtube",
      "social-github",
      "seo-allow-indexing",
      "seo-canonical",
      "seo-robots",
    ]);
    expect(fieldsOf("domains")).toEqual(["dom-domain", "dom-primary", "dom-force-https", "dom-dns-records"]);
    expect(fieldsOf("redirects")).toEqual(["rd-rules", "rd-suggest-from-404s", "rd-import-csv", "rd-export-csv"]);
    expect(fieldsOf("access")).toEqual(["access-password", "access-share-links"]);
    expect(fieldsOf("danger-zone")).toEqual(["danger-archive", "danger-transfer", "danger-delete"]);
    expect(fieldsOf("localization")).toEqual(["default-locale", "locales"]);
    // Headers kept its controls' own ids.
    expect(fieldsOf("headers")).toEqual(["set-hd-csp", "set-hd-xfo", "set-hd-referrer", "set-hd-hsts-enable", "set-hd-hsts-max", "set-hd-permissions"]);
  });

  it("files each field under its section and right after it; never interleaves screens", () => {
    let last: string | null = null;
    const seen = new Set<string>();
    for (const e of SETTINGS_SEARCH_INDEX) {
      if (e.screen !== last) {
        expect(seen.has(e.screen)).toBe(false);
        expect(e.fieldId).toBeUndefined();
        seen.add(e.screen);
        last = e.screen;
      } else {
        expect(e.id).toBe(`${e.screen}/${e.fieldId}`);
        expect(e.group).toBe(sections.find((s) => s.screen === e.screen)!.title);
      }
    }
  });
});

describe("searchSettings", () => {
  it("an empty (or blank) query is the section list, no fields", () => {
    expect(searchSettings("")).toEqual(sections);
    expect(searchSettings("   ")).toEqual(sections);
  });

  it("`domain`: Domains, then its fields, in registry order (and the slug, by its `subdomain` alias)", () => {
    const hits = searchSettings("domain");
    expect(titles(hits)).toEqual(["URL slug", "Domains", "Domain", "Primary domain", "Force HTTPS", "DNS records"]);
    expect(hits[1].fieldId).toBeUndefined();
  });

  it("matches case-insensitively over title, description and group", () => {
    expect(titles(searchSettings("DOMAIN"))).toEqual(titles(searchSettings("domain")));
    /* a section's group */
    expect(titles(searchSettings("visitors"))).toEqual(["Analytics", "Form submissions"]);
    /* a field's group — its section */
    /* the section's own subtitle, then the fields whose card it is */
    expect(searchSettings("social profiles").map((e) => e.fieldId)).toEqual([
      undefined,
      "social-twitter",
      "social-facebook",
      "social-linkedin",
      "social-instagram",
      "social-youtube",
      "social-github",
    ]);
  });

  it("matches the words people use, without drawing them", () => {
    const languages = searchSettings("localization");
    expect(languages.map((e) => e.screen)).toEqual(["localization"]);
    expect(languages[0].fieldId).toBeUndefined();
    expect(searchSettings("slug").map((e) => e.fieldId)).toEqual(["site-slug"]);
    expect(searchSettings("password").map((e) => e.id)).toEqual(["access", "access/access-password"]);
    expect(searchSettings("touch icon").map((e) => e.fieldId)).toEqual(["touch-icon"]);
    expect(searchSettings("zapier").map((e) => e.screen)).toEqual(["webhooks"]);
    expect(searchSettings("csp").map((e) => e.screen).every((s) => s === "headers")).toBe(true);
  });

  it("returns nothing for a query nothing carries", () => {
    expect(searchSettings("zzz")).toEqual([]);
    /* Export left Settings (§24): only the Redirects CSV export is found. */
    expect(searchSettings("export").map((e) => e.id)).toEqual(["redirects/rd-export-csv"]);
  });

  it("never reorders: every result set is a subsequence of the registry", () => {
    for (const q of ["e", "s", "a", "domain", "seo", "code"]) {
      const hits = searchSettings(q);
      const positions = hits.map((h) => SETTINGS_SEARCH_INDEX.indexOf(h));
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    }
  });
});
