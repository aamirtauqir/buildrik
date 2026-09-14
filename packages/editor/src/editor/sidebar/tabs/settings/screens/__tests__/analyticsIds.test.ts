/**
 * analyticsIds — the per-provider shape rules and the sentences the Analytics
 * screen shows under a malformed id (Clone 3397:34148).
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it } from "vitest";
import { validateProviderId } from "../analyticsIds";

describe("validateProviderId", () => {
  it("empty is not set, never an error", () => {
    expect(validateProviderId("googleAnalytics", "")).toBeNull();
    expect(validateProviderId("googleTagManager", "")).toBeNull();
    expect(validateProviderId("facebookPixel", "")).toBeNull();
    expect(validateProviderId("microsoftClarity", "")).toBeNull();
  });

  it("Google Analytics: G- and exactly 10 letters or digits, any case", () => {
    expect(validateProviderId("googleAnalytics", "G-ABCD123456")).toBeNull();
    expect(validateProviderId("googleAnalytics", "g-abcd123456")).toBeNull();
    const sentence =
      "This doesn't look right. Your Google Analytics ID should start with G- followed by 10 characters, like G-ABCD123456.";
    expect(validateProviderId("googleAnalytics", "G-ABC")).toBe(sentence);
    expect(validateProviderId("googleAnalytics", "G-ABCD1234567")).toBe(sentence);
    expect(validateProviderId("googleAnalytics", "UA-12345678-1")).toBe(sentence);
    expect(validateProviderId("googleAnalytics", "G-ABCD 12345")).toBe(sentence);
  });

  it("Google Tag Manager: GTM- and 6 to 8 letters or digits", () => {
    expect(validateProviderId("googleTagManager", "GTM-ABC123")).toBeNull();
    expect(validateProviderId("googleTagManager", "GTM-ABC1234")).toBeNull();
    expect(validateProviderId("googleTagManager", "GTM-ABC12345")).toBeNull();
    const sentence =
      "This doesn't look right. Your GTM Container ID should start with GTM- followed by 6 to 8 characters, like GTM-ABC1234.";
    expect(validateProviderId("googleTagManager", "GTM-ABC12")).toBe(sentence);
    expect(validateProviderId("googleTagManager", "GTM-ABC123456")).toBe(sentence);
    expect(validateProviderId("googleTagManager", "G-ABCD123456")).toBe(sentence);
  });

  it("Meta Pixel: 15 or 16 digits", () => {
    expect(validateProviderId("facebookPixel", "123456789012345")).toBeNull();
    expect(validateProviderId("facebookPixel", "1234567890123456")).toBeNull();
    const sentence = "This doesn't look right. Your Pixel ID should be 15 or 16 digits, like 1234567890123456.";
    expect(validateProviderId("facebookPixel", "12345678901234")).toBe(sentence);
    expect(validateProviderId("facebookPixel", "12345678901234567")).toBe(sentence);
    expect(validateProviderId("facebookPixel", "12345678901234a")).toBe(sentence);
  });

  it("Microsoft Clarity: exactly 10 letters or digits", () => {
    expect(validateProviderId("microsoftClarity", "abcdefghij")).toBeNull();
    expect(validateProviderId("microsoftClarity", "a1b2c3d4e5")).toBeNull();
    const sentence = "This doesn't look right. Your Clarity Project ID should be 10 letters or digits, like abcdefghij.";
    expect(validateProviderId("microsoftClarity", "abcdefghi")).toBe(sentence);
    expect(validateProviderId("microsoftClarity", "abcdefghijk")).toBe(sentence);
    expect(validateProviderId("microsoftClarity", "abcde-ghij")).toBe(sentence);
  });
});
