/**
 * L2-020: the master thumbnail was captured onto WHITE as a JPEG, so white
 * text on a translucent fill baked into an empty white picture no well could
 * rescue. It is captured with a transparent background into a format that
 * keeps alpha, so the preview well decides what it sits on.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it, vi } from "vitest";

const html2canvas = vi.hoisted(() => vi.fn());
vi.mock("html2canvas", () => ({ default: html2canvas }));

import { captureComponentThumbnail } from "../captureComponentThumbnail";

describe("captureComponentThumbnail (L2-020)", () => {
  it("captures with a transparent background into an alpha-keeping format", async () => {
    const node = document.createElement("div");
    node.setAttribute("data-buildrick-id", "el-1");
    Object.defineProperty(node, "offsetWidth", { value: 256 });
    Object.defineProperty(node, "offsetHeight", { value: 100 });
    document.body.appendChild(node);
    const toDataURL = vi.fn((_type: string, _quality?: number) => "data:image/webp;base64,AAAA");
    html2canvas.mockResolvedValue({ toDataURL });
    const updateComponentMetadata = vi.fn(async () => undefined);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0));
    await captureComponentThumbnail({ components: { updateComponentMetadata } } as never, "c1", "el-1");
    expect(html2canvas.mock.calls[0][1]).toMatchObject({ backgroundColor: null });
    expect(toDataURL.mock.calls[0][0]).toBe("image/webp");
    expect(updateComponentMetadata).toHaveBeenCalledWith("c1", { thumbnail: "data:image/webp;base64,AAAA" });
    vi.unstubAllGlobals();
    node.remove();
  });
});
