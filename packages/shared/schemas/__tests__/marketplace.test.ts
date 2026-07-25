import { describe, it, expect } from "vitest";
import { isConfigurableApp, parseAppConfig, liveChatConfigSchema, APP_CONFIG_SCHEMAS } from "../marketplace";

describe("isConfigurableApp", () => {
  it("recognizes head-inject apps, rejects features / connect apps", () => {
    expect(isConfigurableApp("live-chat")).toBe(true);
    expect(isConfigurableApp("hubspot")).toBe(true);
    expect(isConfigurableApp("linkedin-insight")).toBe(true);
    expect(isConfigurableApp("tiktok-pixel")).toBe(true);
    expect(isConfigurableApp("pinterest-tag")).toBe(true);
    expect(isConfigurableApp("site-verification")).toBe(true);
    expect(isConfigurableApp("commerce")).toBe(false);
    expect(isConfigurableApp("memberships")).toBe(false);
    expect(isConfigurableApp("google-analytics")).toBe(false);
    expect(isConfigurableApp("nope")).toBe(false);
  });
});

describe("siteVerificationConfigSchema", () => {
  it("accepts any one code, strips empties", () => {
    const out = parseAppConfig("site-verification", { google: " g-abc12345 ", bing: "", pinterest: "" });
    expect(out).toEqual({ google: "g-abc12345" });
  });
  it("rejects when all blank", () => {
    expect(APP_CONFIG_SCHEMAS["site-verification"].safeParse({ google: "", bing: "", pinterest: "" }).success).toBe(false);
  });
});

describe("liveChatConfigSchema", () => {
  it("accepts a valid property + widget id (trimmed)", () => {
    const out = parseAppConfig("live-chat", { propertyId: "  5f9a1b2c3d4e5f6a7b8c9d0e ", widgetId: " default " });
    expect(out).toEqual({ propertyId: "5f9a1b2c3d4e5f6a7b8c9d0e", widgetId: "default" });
  });

  it("rejects a short / non-hex property id", () => {
    expect(liveChatConfigSchema.safeParse({ propertyId: "abc", widgetId: "default" }).success).toBe(false);
    expect(liveChatConfigSchema.safeParse({ propertyId: "zzzz1b2c3d4e5f6a7b8c9d0e", widgetId: "default" }).success).toBe(false);
  });

  it("rejects an empty widget id", () => {
    expect(liveChatConfigSchema.safeParse({ propertyId: "5f9a1b2c3d4e5f6a7b8c9d0e", widgetId: "" }).success).toBe(false);
  });
});
