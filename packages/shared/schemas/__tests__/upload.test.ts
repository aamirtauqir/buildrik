import { describe, it, expect } from "vitest";
import { safeBlobName } from "../upload";

describe("safeBlobName (S-3)", () => {
  it("keeps only the basename", () => {
    expect(safeBlobName("../../sites/victim/favicon.png")).toBe("favicon.png");
    expect(safeBlobName("..\\..\\x.png")).toBe("x.png");
  });

  it("replaces unsafe characters and strips leading dots", () => {
    expect(safeBlobName("my photo (1).jpg")).toBe("my_photo__1_.jpg");
    expect(safeBlobName(".htaccess")).toBe("htaccess");
  });

  it("never returns an empty or dot-only name", () => {
    expect(safeBlobName("..")).toBe("file");
    expect(safeBlobName("a/")).toBe("file");
  });

  it("caps the length and keeps the extension", () => {
    const out = safeBlobName(`${"a".repeat(300)}.png`);
    expect(out).toHaveLength(100);
    expect(out.endsWith(".png")).toBe(true);
  });
});
