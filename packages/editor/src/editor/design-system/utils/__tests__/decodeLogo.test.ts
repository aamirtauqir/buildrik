// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { decodeLogoColors } from "../decodeLogo";
import { downscaleSize, extractSvgColors } from "@/engine/designSystem/brandColors";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const file = (body: BlobPart, name: string, type: string) => new File([body], name, { type });

describe("decodeLogoColors (spec §9, D16: the logo never leaves the browser)", () => {
  it("reads an SVG as markup and never rasterizes it", async () => {
    const bitmap = vi.fn();
    vi.stubGlobal("createImageBitmap", bitmap);
    const svg = `<svg><path fill="#1A56DB"/><path fill="#F59E0B"/></svg>`;
    await expect(decodeLogoColors(file(svg, "logo.svg", "image/svg+xml"))).resolves.toEqual(extractSvgColors(svg));
    expect(bitmap).not.toHaveBeenCalled();
  });

  it("refuses an image over 5 MB and an SVG over 1 MB as TOO_BIG", async () => {
    await expect(decodeLogoColors(file(new Uint8Array(6 * 1024 * 1024), "big.png", "image/png"))).rejects.toThrow("TOO_BIG");
    await expect(decodeLogoColors(file("x".repeat(1024 * 1024 + 1), "big.svg", "image/svg+xml"))).rejects.toThrow("TOO_BIG");
  });

  it("refuses what is not PNG, JPEG, WebP or SVG as UNSUPPORTED", async () => {
    await expect(decodeLogoColors(file("hello", "notes.txt", "text/plain"))).rejects.toThrow("UNSUPPORTED");
  });

  it("draws a large bitmap downscaled to ≤ 4 MP and quantizes its pixels", async () => {
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 6000, height: 4000, close })));
    const drawImage = vi.fn();
    const pixels = new Uint8ClampedArray([26, 86, 219, 255, 26, 86, 219, 255]);
    const getImageData = vi.fn(() => ({ data: pixels }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage, getImageData } as never);
    const out = await decodeLogoColors(file(new Uint8Array(10), "logo.png", "image/png"));
    const { width, height } = downscaleSize(6000, 4000);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, width, height);
    expect(getImageData).toHaveBeenCalledWith(0, 0, width, height);
    expect(out).toEqual([{ hex: "#1A56DB", count: 2 }]);
    expect(close).toHaveBeenCalled();
  });
});
