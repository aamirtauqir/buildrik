/**
 * AnalyticsInjector — GA4 / Facebook Pixel / Google Ads snippet generation.
 * Privacy contract: GA4 config MUST ship anonymize_ip:true and
 * allow_google_signals:false.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import {
  generateAnalyticsScripts,
  isValidGAMeasurementId,
  isValidFBPixelId,
  isValidClarityProjectId,
  isValidGTMContainerId,
} from "../AnalyticsInjector";
import type { AnalyticsConfig } from "../../../shared/types";

describe("generateAnalyticsScripts — gate conditions", () => {
  it("returns '' when config is undefined", () => {
    expect(generateAnalyticsScripts(undefined)).toBe("");
  });

  it("returns '' when no provider is configured", () => {
    expect(generateAnalyticsScripts({})).toBe("");
  });

  it("returns '' when GA is disabled", () => {
    const config: AnalyticsConfig = {
      googleAnalytics: { enabled: false, measurementId: "G-ABCD1234" },
    };
    expect(generateAnalyticsScripts(config)).toBe("");
  });

  it("returns '' when GA is enabled but measurementId is empty", () => {
    const config: AnalyticsConfig = {
      googleAnalytics: { enabled: true, measurementId: "" },
    };
    expect(generateAnalyticsScripts(config)).toBe("");
  });
});

describe("generateAnalyticsScripts — Google Analytics 4", () => {
  const out = generateAnalyticsScripts({
    googleAnalytics: { enabled: true, measurementId: "G-TEST1234" },
  });

  it("loads gtag.js async with the measurement ID", () => {
    expect(out).toContain(
      '<script async src="https://www.googletagmanager.com/gtag/js?id=G-TEST1234"></script>'
    );
  });

  it("configures gtag with the measurement ID", () => {
    expect(out).toContain("gtag('config', 'G-TEST1234'");
    expect(out).toContain("window.dataLayer = window.dataLayer || [];");
    expect(out).toContain("gtag('js', new Date());");
  });

  it("PRIVACY: sets anonymize_ip: true", () => {
    expect(out).toContain("'anonymize_ip': true");
  });

  it("PRIVACY: sets allow_google_signals: false (remarketing disabled)", () => {
    expect(out).toContain("'allow_google_signals': false");
  });
});

describe("generateAnalyticsScripts — Facebook Pixel", () => {
  const out = generateAnalyticsScripts({
    facebookPixel: { enabled: true, pixelId: "123456789012345" },
  });

  it("initializes the pixel with the configured ID", () => {
    expect(out).toContain("fbq('init', '123456789012345');");
  });

  it("tracks PageView", () => {
    expect(out).toContain("fbq('track', 'PageView');");
  });

  it("loads fbevents.js from the Facebook CDN", () => {
    expect(out).toContain("https://connect.facebook.net/en_US/fbevents.js");
  });

  it("includes the <noscript> tracking pixel fallback with the ID", () => {
    expect(out).toContain("<noscript>");
    expect(out).toContain("https://www.facebook.com/tr?id=123456789012345&ev=PageView&noscript=1");
  });

  it("is not generated when disabled or pixelId is empty", () => {
    expect(
      generateAnalyticsScripts({ facebookPixel: { enabled: false, pixelId: "123456789012345" } })
    ).toBe("");
    expect(generateAnalyticsScripts({ facebookPixel: { enabled: true, pixelId: "" } })).toBe("");
  });
});

describe("generateAnalyticsScripts — Google Ads", () => {
  it("generates the Ads gtag snippet when GA is not enabled", () => {
    const out = generateAnalyticsScripts({
      googleAds: { enabled: true, conversionId: "AW-99999999" },
    });
    expect(out).toContain(
      '<script async src="https://www.googletagmanager.com/gtag/js?id=AW-99999999"></script>'
    );
    expect(out).toContain("gtag('config', 'AW-99999999');");
  });

  it("skips the Ads snippet when GA is already enabled (gtag dedupe)", () => {
    const out = generateAnalyticsScripts({
      googleAnalytics: { enabled: true, measurementId: "G-TEST1234" },
      googleAds: { enabled: true, conversionId: "AW-99999999" },
    });
    expect(out).not.toContain("AW-99999999");
    // Exactly one gtag.js loader tag.
    expect(out.match(/googletagmanager\.com\/gtag\/js/g)).toHaveLength(1);
  });

  it("is not generated when disabled or conversionId is empty", () => {
    expect(
      generateAnalyticsScripts({ googleAds: { enabled: false, conversionId: "AW-99999999" } })
    ).toBe("");
    expect(generateAnalyticsScripts({ googleAds: { enabled: true, conversionId: "" } })).toBe("");
  });
});

describe("generateAnalyticsScripts — multiple providers", () => {
  it("joins GA + FB Pixel snippets with a newline, GA first", () => {
    const out = generateAnalyticsScripts({
      googleAnalytics: { enabled: true, measurementId: "G-TEST1234" },
      facebookPixel: { enabled: true, pixelId: "123456789012345" },
    });
    expect(out).toContain("G-TEST1234");
    expect(out).toContain("fbq('init', '123456789012345');");
    expect(out.indexOf("G-TEST1234")).toBeLessThan(out.indexOf("fbq('init'"));
    expect(out).toContain("</script>\n  <script>");
  });
});

describe("isValidGAMeasurementId", () => {
  it("accepts G- IDs with 8+ uppercase alphanumerics", () => {
    expect(isValidGAMeasurementId("G-ABCD1234")).toBe(true);
    expect(isValidGAMeasurementId("G-XXXXXXXXXX")).toBe(true);
  });

  it("rejects short, lowercase, and legacy UA IDs", () => {
    expect(isValidGAMeasurementId("G-ABC123")).toBe(false);
    expect(isValidGAMeasurementId("g-abcd1234")).toBe(false);
    expect(isValidGAMeasurementId("UA-12345678-1")).toBe(false);
    expect(isValidGAMeasurementId("")).toBe(false);
  });
});

describe("isValidFBPixelId", () => {
  it("accepts 15- and 16-digit IDs", () => {
    expect(isValidFBPixelId("123456789012345")).toBe(true);
    expect(isValidFBPixelId("1234567890123456")).toBe(true);
  });

  it("rejects 14 digits, 17 digits, and non-digit input", () => {
    expect(isValidFBPixelId("12345678901234")).toBe(false);
    expect(isValidFBPixelId("12345678901234567")).toBe(false);
    expect(isValidFBPixelId("12345678901234a")).toBe(false);
    expect(isValidFBPixelId("")).toBe(false);
  });
});

describe("Microsoft Clarity", () => {
  it("injects the Clarity loader when enabled with a project id", () => {
    const out = generateAnalyticsScripts({ microsoftClarity: { enabled: true, projectId: "abcd1234ef" } });
    expect(out).toContain("clarity.ms/tag/"); // url built at runtime as base + id
    expect(out).toContain('"abcd1234ef"'); // project id injected as the last arg
    expect(out).toContain('"clarity","script"');
  });
  it("stays out when disabled or id empty", () => {
    expect(generateAnalyticsScripts({ microsoftClarity: { enabled: false, projectId: "abcd1234ef" } })).toBe("");
    expect(generateAnalyticsScripts({ microsoftClarity: { enabled: true, projectId: "" } })).toBe("");
  });
  it("validates project id shape", () => {
    expect(isValidClarityProjectId("abcd1234ef")).toBe(true);
    expect(isValidClarityProjectId("abc")).toBe(false); // too short
    expect(isValidClarityProjectId("has space")).toBe(false);
    expect(isValidClarityProjectId("")).toBe(false);
  });
});

describe("Google Tag Manager", () => {
  it("injects the GTM container loader when enabled with an id", () => {
    const out = generateAnalyticsScripts({ googleTagManager: { enabled: true, containerId: "GTM-ABC1234" } });
    expect(out).toContain("googletagmanager.com/gtm.js?id='+i");
    expect(out).toContain("GTM-ABC1234");
  });
  it("stays out when disabled or id empty", () => {
    expect(generateAnalyticsScripts({ googleTagManager: { enabled: false, containerId: "GTM-ABC1234" } })).toBe("");
    expect(generateAnalyticsScripts({ googleTagManager: { enabled: true, containerId: "" } })).toBe("");
  });
  it("validates container id shape", () => {
    expect(isValidGTMContainerId("GTM-ABC1234")).toBe(true);
    expect(isValidGTMContainerId("GTM-")).toBe(false);
    expect(isValidGTMContainerId("ABC1234")).toBe(false);
    expect(isValidGTMContainerId("")).toBe(false);
  });
});
