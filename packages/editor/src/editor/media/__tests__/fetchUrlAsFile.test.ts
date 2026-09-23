/**
 * The two import-from-URL surfaces share one implementation because they used
 * to disagree about whether the feature existed at all: the fullpage manager
 * imported, the picker modal said "coming soon".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { UrlImportError, fetchUrlAsFile, isFetchableUrl } from "../fetchUrlAsFile";

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

  it("throws `unreachable` on a non-OK response or a network failure — callers own the dialog", async () => {
    stubFetch({ ok: false, status: 404, blob: async () => new Blob([]) });
    await expect(fetchUrlAsFile("https://example.com/missing.png")).rejects.toMatchObject({ reason: "unreachable" });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(fetchUrlAsFile("https://example.com/offline.png")).rejects.toBeInstanceOf(UrlImportError);
  });

  // Clone 3695:43876 — "This URL does not return a supported image." What
  // "supported" means is the upload gate's own table, so an HTML page, or a
  // video handed to an image-only field, is refused HERE with a reason the
  // dialog can name, instead of by the upload with a bare "Unsupported file
  // type: text/html".
  it("throws `unsupported` when the body is not a kind the caller accepts", async () => {
    stubFetch({ ok: true, blob: async () => new Blob(["<html>"], { type: "text/html" }) });
    await expect(fetchUrlAsFile("https://example.com/page")).rejects.toMatchObject({ reason: "unsupported" });

    stubFetch({ ok: true, blob: async () => new Blob(["x"], { type: "video/mp4" }) });
    await expect(fetchUrlAsFile("https://example.com/clip.mp4", ["image"])).rejects.toMatchObject({ reason: "unsupported" });
    await expect(fetchUrlAsFile("https://example.com/clip.mp4", ["video"])).resolves.toHaveProperty("name", "clip.mp4");
  });
});
