import { describe, it, expect, vi, afterEach } from "vitest";

const html2canvas = vi.fn();
vi.mock("html2canvas", () => ({ default: html2canvas }));

import { captureAndUploadThumbnail } from "../captureThumbnail";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  html2canvas.mockReset();
});

describe("captureAndUploadThumbnail", () => {
  it("renders the page in a sandboxed frame (same origin, no scripts) and still captures it", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    let sandbox: string | null = null;
    let renderedTitle = "";
    html2canvas.mockImplementation(async (target: HTMLElement) => {
      const frame = document.querySelector("iframe");
      sandbox = frame?.getAttribute("sandbox") ?? null;
      renderedTitle = target.querySelector("h1")?.textContent ?? "";
      return { toBlob: (cb: (b: Blob) => void) => cb(new Blob(["png"], { type: "image/png" })) };
    });

    const run = captureAndUploadThumbnail("site-1", "<!doctype html><html><body><h1>Hello</h1></body></html>");
    await vi.runAllTimersAsync();
    await run;

    expect(sandbox).toBe("allow-same-origin");
    expect(renderedTitle).toBe("Hello");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/site-thumbnail/site-1"), expect.anything());
    expect(document.querySelector("iframe")).toBeNull();
  });
});
