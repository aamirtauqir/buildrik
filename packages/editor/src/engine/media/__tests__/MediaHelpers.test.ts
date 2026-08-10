/**
 * engine/media/MediaHelpers — validation, src safety, id + magic-byte sniff.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  validateFile,
  isSafeSrc,
  generateMediaId,
  sniffMimeType,
} from "../MediaHelpers";

const fileWithSize = (type: string, size: number): File => {
  const f = new File(["x"], "f", { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

describe("validateFile", () => {
  it("rejects unsupported MIME types", () => {
    const r = validateFile(new File(["x"], "a.pdf", { type: "application/pdf" }));
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/Unsupported file type/);
  });

  it("rejects files over the per-type size limit", () => {
    const r = validateFile(fileWithSize("image/png", 20 * 1024 * 1024));
    expect(r.valid).toBe(false);
    // Board 145:148: the message names the file size AND the limit.
    expect(r.error).toMatch(/Upload failed — file is 20 MB, limit is 10 MB/);
  });

  it("accepts a supported, small file", () => {
    expect(validateFile(fileWithSize("image/png", 1024))).toEqual({ valid: true });
  });
});

describe("isSafeSrc", () => {
  it("rejects non-strings and blank strings", () => {
    expect(isSafeSrc(null)).toBe(false);
    expect(isSafeSrc(123)).toBe(false);
    expect(isSafeSrc("")).toBe(false);
    expect(isSafeSrc("   ")).toBe(false);
  });

  it("rejects CSS/attribute-breaking characters", () => {
    expect(isSafeSrc("http://x/a)b")).toBe(false);
    expect(isSafeSrc(`http://x/a"b`)).toBe(false);
    expect(isSafeSrc("http://x/a'b")).toBe(false);
  });

  it("blocks dangerous schemes", () => {
    expect(isSafeSrc("javascript:alert(1)")).toBe(false);
    expect(isSafeSrc("vbscript:x")).toBe(false);
    expect(isSafeSrc("file:///etc/passwd")).toBe(false);
    expect(isSafeSrc("about:blank")).toBe(false);
  });

  it("allows data: URLs only for images", () => {
    expect(isSafeSrc("data:image/png;base64,AAA")).toBe(true);
    expect(isSafeSrc("data:image/svg+xml;base64,PHN2Zy8+")).toBe(true);
    expect(isSafeSrc("data:text/html;base64,AAA")).toBe(false);
  });

  it("allows http/https/blob and relative URLs", () => {
    expect(isSafeSrc("https://example.com/a.png")).toBe(true);
    expect(isSafeSrc("http://example.com/a.png")).toBe(true);
    expect(isSafeSrc("blob:https://x/abc")).toBe(true);
    expect(isSafeSrc("images/pic.png")).toBe(true);
    expect(isSafeSrc("#anchor")).toBe(true);
  });
});

describe("generateMediaId", () => {
  it("produces unique media_-prefixed ids", () => {
    const a = generateMediaId();
    const b = generateMediaId();
    expect(a).toMatch(/^media_\d+_[a-z0-9]+$/);
    expect(a).not.toBe(b);
  });
});

describe("sniffMimeType", () => {
  const fileFrom = (data: Uint8Array | string) => new File([data as BlobPart], "x");

  it("detects SVG by leading markup", async () => {
    expect(await sniffMimeType(fileFrom("<svg xmlns='...'></svg>"))).toBe("image/svg+xml");
    expect(await sniffMimeType(fileFrom("<?xml version='1.0'?><svg/>"))).toBe("image/svg+xml");
  });

  it("detects PNG / JPEG / GIF magic bytes", async () => {
    expect(await sniffMimeType(fileFrom(new Uint8Array([0x89, 0x50, 0x4e, 0x47])))).toBe(
      "image/png"
    );
    expect(await sniffMimeType(fileFrom(new Uint8Array([0xff, 0xd8, 0xff])))).toBe("image/jpeg");
    expect(await sniffMimeType(fileFrom(new Uint8Array([0x47, 0x49, 0x46])))).toBe("image/gif");
  });

  it("detects WebP (RIFF....WEBP)", async () => {
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(await sniffMimeType(fileFrom(webp))).toBe("image/webp");
  });

  it("returns null for unrecognised content", async () => {
    expect(await sniffMimeType(fileFrom(new Uint8Array([0x00, 0x01, 0x02, 0x03])))).toBeNull();
  });
});
