/**
 * P4 SEO contracts: site structured data (FG-009), the page SEO additions
 * (FG-007 keyphrase / schema type, FG-011 X customisation, validated
 * canonical) and the publish payload's page id (L3-011 sitemap from settings).
 */
import { describe, it, expect } from "vitest";
import { seoSiteSchemaSchema } from "../seo-schema";
import { pageSeoSchema } from "../sites";
import { publishPageSchema } from "../publish";
import { projectSettingsPatchSchema } from "../project-settings";

describe("seoSiteSchemaSchema", () => {
  it("accepts an Organization with a logo", () => {
    expect(seoSiteSchemaSchema.parse({ entity: "Organization", name: "Acme", logoUrl: "https://cdn.x/logo.png" }).entity).toBe("Organization");
  });
  it("accepts a LocalBusiness subtype with address + hours", () => {
    const v = seoSiteSchemaSchema.parse({
      entity: "Organization",
      name: "Cafe",
      localBusiness: {
        enabled: true,
        businessType: "Restaurant",
        streetAddress: "1 Main",
        locality: "Town",
        postalCode: "123",
        country: "PK",
        telephone: "+92 300 0000000",
        openingHours: [{ days: ["Mo", "Tu"], opens: "09:00", closes: "17:00" }],
      },
    });
    expect(v.entity === "Organization" && v.localBusiness?.businessType).toBe("Restaurant");
  });
  it("rejects a Person with a localBusiness block", () => {
    expect(() =>
      seoSiteSchemaSchema.parse({ entity: "Person", name: "Ann", localBusiness: { enabled: true, businessType: "Store" } }),
    ).toThrow();
  });
  it("rejects opening hours that close before they open", () => {
    expect(() =>
      seoSiteSchemaSchema.parse({
        entity: "Organization",
        name: "X",
        localBusiness: { enabled: true, businessType: "Store", openingHours: [{ days: ["Mo"], opens: "18:00", closes: "09:00" }] },
      }),
    ).toThrow(/closes/);
  });
  it("names the field a person fixes: an empty name and a malformed phone", () => {
    const r = seoSiteSchemaSchema.safeParse({
      entity: "Organization",
      name: "",
      localBusiness: { enabled: true, businessType: "Store", telephone: "abc" },
    });
    expect(r.success).toBe(false);
    const messages = r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));
    expect(messages).toMatchObject({ name: "Enter an organization name.", "localBusiness.telephone": "Enter a valid phone number." });
  });
});

describe("pageSeoSchema additions", () => {
  it("round-trips keyphrase, schemaType, article, xCustomized", () => {
    const v = pageSeoSchema.parse({
      focusKeyphrase: " wood fired pizza ",
      schemaType: "Article",
      article: { authorName: "Sam", datePublished: "2026-10-01T00:00:00.000Z" },
      xCustomized: true,
    });
    expect(v.focusKeyphrase).toBe("wood fired pizza");
    expect(v.schemaType).toBe("Article");
    expect(v.xCustomized).toBe(true);
  });
  it("rejects a relative canonical", () => {
    expect(() => pageSeoSchema.parse({ canonicalUrl: "/about" })).toThrow();
  });
  it("accepts an empty canonical as 'this page'", () => {
    expect(pageSeoSchema.parse({ canonicalUrl: "" }).canonicalUrl).toBe("");
  });
});

describe("publishPageSchema", () => {
  it("accepts an optional pageId", () => {
    expect(publishPageSchema.parse({ path: "about.html", html: "<html></html>", pageId: "p1" }).pageId).toBe("p1");
    expect(publishPageSchema.parse({ path: "about.html", html: "<html></html>" }).pageId).toBeUndefined();
  });
});

describe("site structured data + sitemap switch ride the JSON-only seo block", () => {
  it("accepts seo.schema and seo.sitemapEnabled without an author", () => {
    const patch = projectSettingsPatchSchema.parse({
      seo: { schema: { entity: "Person", name: "Sofia Rossi" }, sitemapEnabled: false },
    });
    expect(patch.seo).toEqual({ schema: { entity: "Person", name: "Sofia Rossi" }, sitemapEnabled: false });
  });
  it("clears structured data with null", () => {
    expect(projectSettingsPatchSchema.parse({ seo: { schema: null } }).seo).toEqual({ schema: null });
  });
  it("refuses an invalid structured-data block", () => {
    expect(projectSettingsPatchSchema.safeParse({ seo: { schema: { entity: "Organization", name: "" } } }).success).toBe(false);
  });
});
