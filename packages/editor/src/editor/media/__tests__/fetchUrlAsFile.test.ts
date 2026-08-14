/**
 * The two import-from-URL surfaces share one implementation because they used
 * to disagree about whether the feature existed at all: the fullpage manager
 * imported, the picker modal said "coming soon".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchUrlAsFile, isFetchableUrl } from "../fetchUrlAsFile";

afterEach(() => vi.unstubAllGlobals());

function stubFetch(res: Partial<Response> & { blob?: () => Promise<Blob> }) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res));
}

describe("isFetchableUrl", () => {
  it("accepts http and https", () => {
    expect(isFetchableUrl("http://example.com/a.png")).toBe(true);
    expect(isFetchableUrl("https://example.com/a.png")).toBe(true);
    expect(isFetchableUrl("  https://example.com/a.png  ")).toBe(true);
  });

  it("rejects schemes the import path cannot read", () => {
    expect(isFetchableUrl("data:image/png;base64,AAAA")).toBe(false);
    expect(isFetchableUrl("blob:https://example.com/x")).toBe(false);
    expect(isFetchableUrl("file:///etc/passwd")).toBe(false);
    expect(isFetchableUrl("javascript:alert(1)")).toBe(false);
    expect(isFetchableUrl("not a url")).toBe(false);
    expect(isFetchableUrl("")).toBe(false);
  });
});

describe("fetchUrlAsFile", () => {
  it("names the file from the path, without the query string", async () => {
    stubFetch({ ok: true, blob: async () => new Blob(["x"], { type: "image/png" }) });

    const file = await fetchUrlAsFile("https://cdn.example.com/photos/hero.png?w=800&token=abc");

    expect(file.name).toBe("hero.png");
    expect(file.type).toBe("image/png");
  });

  it("falls back to an extension from the blob type when the URL has no filename", async () => {
    stubFetch({ ok: true, blob: async () => new Blob(["x"], { type: "video/mp4" }) });

    const file = await fetchUrlAsFile("https://example.com/");

    expect(file.name).toBe("imported.mp4");
  });

  it("throws on a non-OK response — callers own the message", async () => {
    stubFetch({ ok: false, status: 404, blob: async () => new Blob([]) });

    await expect(fetchUrlAsFile("https://example.com/missing.png")).rejects.toThrow("HTTP 404");
  });
});
