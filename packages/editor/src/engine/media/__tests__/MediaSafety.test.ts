/**
 * MediaSafety tests — security helpers from the pre-landing review fixes.
 *
 * Covers:
 * 1. isSafeSrc — URL scheme + character validation (blocks javascript:, etc.)
 * 2. sniffMimeType — magic byte detection (catches spoofed MIME types)
 *
 * The blob URL ref-counting fix in MediaManager is exercised via integration
 * (existing MediaManager flows) since direct unit-testing requires canvas
 * context which jsdom doesn't provide.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { isSafeSrc, sniffMimeType } from "../MediaHelpers";

describe("isSafeSrc — URL scheme allowlist", () => {
  describe("rejects dangerous schemes", () => {
    const dangerous = [
      "javascript:alert(1)",
      "JAVASCRIPT:alert(1)",
      "JaVaScRiPt:void(0)",
      "vbscript:msgbox(1)",
      "data:text/html,<script>alert(1)</script>",
      "data:application/javascript,alert(1)",
      "file:///etc/passwd",
      "about:blank",
    ];
    for (const bad of dangerous) {
      it(bad, () => expect(isSafeSrc(bad)).toBe(false));
    }
  });

  describe("rejects CSS-breaking characters", () => {
    const breaking = [
      'x");background:url("javascript:alert(1))',
      "url(\"x\")",
      "x'onerror='alert(1)",
    ];
    for (const bad of breaking) {
      it(JSON.stringify(bad), () => expect(isSafeSrc(bad)).toBe(false));
    }
  });

  describe("accepts safe URLs", () => {
    const safe = [
      "https://example.com/image.png",
      "http://example.com/image.png",
      "blob:https://example.com/abc-123",
      "data:image/png;base64,iVBORw0KGgo=",
      "data:image/svg+xml;base64,PHN2ZyAvPg==",
      "data:image/jpeg;base64,/9j/4AAQ",
      "relative/path.png",
      "image.jpg",
      "/absolute/path.png",
      "../up/and/over.png",
    ];
    for (const ok of safe) {
      it(ok, () => expect(isSafeSrc(ok)).toBe(true));
    }
  });

  describe("rejects invalid input", () => {
    it("empty string", () => expect(isSafeSrc("")).toBe(false));
    it("whitespace only", () => expect(isSafeSrc("   ")).toBe(false));
    it("null", () => expect(isSafeSrc(null)).toBe(false));
    it("undefined", () => expect(isSafeSrc(undefined)).toBe(false));
    it("number", () => expect(isSafeSrc(123)).toBe(false));
    it("object", () => expect(isSafeSrc({})).toBe(false));
  });
});

describe("sniffMimeType — magic byte detection", () => {
  function fileFrom(content: Uint8Array | string, name: string, type: string): File {
    const blob = new Blob([content as BlobPart], { type });
    return new File([blob], name, { type });
  }

  it("detects PNG by magic bytes regardless of declared type", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0]);
    const file = fileFrom(png, "fake.svg", "image/svg+xml");
    expect(await sniffMimeType(file)).toBe("image/png");
  });

  it("detects JPEG by magic bytes", async () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const file = fileFrom(jpeg, "image.png", "image/png");
    expect(await sniffMimeType(file)).toBe("image/jpeg");
  });

  it("detects GIF by magic bytes", async () => {
    const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    const file = fileFrom(gif, "image.png", "image/png");
    expect(await sniffMimeType(file)).toBe("image/gif");
  });

  it("detects WebP by RIFF + WEBP signature", async () => {
    const webp = new Uint8Array(20);
    [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50].forEach(
      (b, i) => (webp[i] = b),
    );
    const file = fileFrom(webp, "image.png", "image/png");
    expect(await sniffMimeType(file)).toBe("image/webp");
  });

  it("detects SVG content even when extension is .png (spoofed)", async () => {
    const svg = '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const file = fileFrom(svg, "spoofed.png", "image/png");
    expect(await sniffMimeType(file)).toBe("image/svg+xml");
  });

  it("detects SVG starting with <svg directly (no XML declaration)", async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const file = fileFrom(svg, "icon.svg", "image/svg+xml");
    expect(await sniffMimeType(file)).toBe("image/svg+xml");
  });

  it("returns null for unknown content", async () => {
    const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
    const file = fileFrom(garbage, "unknown.bin", "application/octet-stream");
    expect(await sniffMimeType(file)).toBeNull();
  });
});
