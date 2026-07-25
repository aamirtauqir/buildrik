import { describe, it, expect } from "vitest";
import { generateWorkspaceAppScripts } from "../marketplace-app-scripts";

const VALID = { propertyId: "5f9a1b2c3d4e5f6a7b8c9d0e", widgetId: "1abc2def3" };

describe("generateWorkspaceAppScripts — Live Chat (Tawk.to)", () => {
  it("emits the Tawk loader with the embed URL when config is valid", () => {
    const out = generateWorkspaceAppScripts([{ appId: "live-chat", config: VALID }]);
    expect(out).toContain("https://embed.tawk.to/5f9a1b2c3d4e5f6a7b8c9d0e/1abc2def3");
    expect(out).toContain("Tawk_API");
  });

  it("accepts the literal 'default' widget id", () => {
    const out = generateWorkspaceAppScripts([{ appId: "live-chat", config: { propertyId: VALID.propertyId, widgetId: "default" } }]);
    expect(out).toContain(`embed.tawk.to/${VALID.propertyId}/default`);
  });

  it("emits nothing when config is missing or malformed", () => {
    expect(generateWorkspaceAppScripts([{ appId: "live-chat", config: null }])).toBe("");
    expect(generateWorkspaceAppScripts([{ appId: "live-chat", config: {} }])).toBe("");
    expect(generateWorkspaceAppScripts([{ appId: "live-chat", config: { propertyId: "nope", widgetId: "x" } }])).toBe("");
  });
});

describe("generateWorkspaceAppScripts — other head-inject apps", () => {
  it("HubSpot: emits the tracking loader with the portal id", () => {
    const out = generateWorkspaceAppScripts([{ appId: "hubspot", config: { portalId: "1234567" } }]);
    expect(out).toContain("js.hs-scripts.com/1234567.js");
    expect(out).toContain('id="hs-script-loader"');
  });

  it("LinkedIn: emits partner id + snap.licdn loader, head-only (no noscript)", () => {
    const out = generateWorkspaceAppScripts([{ appId: "linkedin-insight", config: { partnerId: "987654" } }]);
    expect(out).toContain('_linkedin_partner_id = "987654"');
    expect(out).toContain("snap.licdn.com/li.lms-analytics/insight.min.js");
    expect(out).not.toContain("<noscript>"); // invalid in <head>; omitted
  });

  it("TikTok: emits ttq loader with the pixel id + page()", () => {
    const out = generateWorkspaceAppScripts([{ appId: "tiktok-pixel", config: { pixelId: "C4A1B2C3D4E5F6G7H8I9" } }]);
    expect(out).toContain('ttq.load("C4A1B2C3D4E5F6G7H8I9")');
    expect(out).toContain("analytics.tiktok.com/i18n/pixel/events.js");
  });

  it("Pinterest: emits pintrk load, head-only (no noscript)", () => {
    const out = generateWorkspaceAppScripts([{ appId: "pinterest-tag", config: { tagId: "2612345678901" } }]);
    expect(out).toContain('pintrk("load","2612345678901")');
    expect(out).toContain("s.pinimg.com/ct/core.js");
    expect(out).not.toContain("<noscript>"); // invalid in <head>; omitted
  });

  it("Site verification: one meta per configured engine; skips blanks", () => {
    const out = generateWorkspaceAppScripts([{ appId: "site-verification", config: { google: "g-abc123456", pinterest: "p-xyz789012" } }]);
    expect(out).toContain('<meta name="google-site-verification" content="g-abc123456">');
    expect(out).toContain('<meta name="p:domain_verify" content="p-xyz789012">');
    expect(out).not.toContain("msvalidate.01");
  });

  it("Site verification: nothing when all codes blank/invalid", () => {
    expect(generateWorkspaceAppScripts([{ appId: "site-verification", config: {} }])).toBe("");
    expect(generateWorkspaceAppScripts([{ appId: "site-verification", config: { google: "" } }])).toBe("");
  });

  it("rejects malformed ids per app", () => {
    expect(generateWorkspaceAppScripts([{ appId: "hubspot", config: { portalId: "abc" } }])).toBe("");
    expect(generateWorkspaceAppScripts([{ appId: "tiktok-pixel", config: { pixelId: "short" } }])).toBe("");
  });
});

describe("generateWorkspaceAppScripts — gating", () => {
  it("ignores non-configurable / unknown app ids", () => {
    expect(generateWorkspaceAppScripts([{ appId: "commerce", config: VALID }])).toBe("");
    expect(generateWorkspaceAppScripts([{ appId: "memberships", config: {} }])).toBe("");
    expect(generateWorkspaceAppScripts([{ appId: "made-up", config: VALID }])).toBe("");
  });

  it("returns '' for an empty install list", () => {
    expect(generateWorkspaceAppScripts([])).toBe("");
  });

  it("skips a broken row but still emits a valid sibling", () => {
    const out = generateWorkspaceAppScripts([
      { appId: "commerce", config: {} },
      { appId: "live-chat", config: VALID },
    ]);
    expect(out).toContain("embed.tawk.to");
  });
});
