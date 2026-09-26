// @vitest-environment jsdom
/**
 * useContentIssueScanner against a REAL Composer and the element shape the
 * dashboard actually stores (`pages.blocks` on buildrik_verify S2/Home).
 * Live verification (results-editor-b2.md, B-14/A02-9) saw the Issues count
 * stay at 12 with a no-alt image and a dead `#page:` link loaded — the
 * detector's own unit suite was green because it is fed hand-built pages.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { Composer } from "@/engine";
import type { ProjectData } from "@/shared/types";
import { useContentIssueScanner } from "../useContentIssueScanner";

let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
beforeAll(() => {
  originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string) {
    if (id !== "2d") return null;
    return {
      canvas: this,
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: () => {},
      drawImage: () => {},
      fillRect: () => {},
      clearRect: () => {},
      measureText: () => ({ width: 0 }),
    } as unknown as CanvasRenderingContext2D;
  } as typeof HTMLCanvasElement.prototype.getContext;
});
afterAll(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

/** Verbatim shape of S2/Home's stored `blocks` (trimmed to the rows that matter). */
function storedProject(): ProjectData {
  return {
    pages: [
      {
        id: "cmuhr2uvp001as9fro0gobt8t",
        name: "Home",
        slug: "home",
        root: {
          id: "root",
          type: "container",
          tagName: "div",
          classes: ["buildrick-page-root"],
          children: [
            {
              id: "section-33",
              type: "section",
              tagName: "section",
              children: [
                { id: "heading-30", type: "heading", tagName: "h1", content: "Hi", children: [] },
              ],
            },
            {
              id: "el-verify-b2-img-noalt",
              type: "image",
              tagName: "img",
              children: [],
              attributes: { src: "https://placehold.co/300x200" },
            },
            {
              id: "el-verify-b2-link-dead",
              type: "link",
              tagName: "a",
              content: "Dead",
              children: [],
              attributes: { href: "#page:does-not-exist-xyz" },
            },
          ],
        },
      },
      {
        id: "cmuhr2uvs001cs9frvhea3hfn",
        name: "Services",
        slug: "services",
        root: { id: "root-services", type: "container", tagName: "div", children: [] },
      },
    ],
  } as unknown as ProjectData;
}

describe("useContentIssueScanner (real Composer)", () => {
  it("flags the stored no-alt image and dead #page: link after importProject", async () => {
    const composer = new Composer({} as never);
    await composer.whenReady();
    const { result } = renderHook(() => useContentIssueScanner(composer));
    act(() => composer.importProject(storedProject()));

    await waitFor(() => {
      const ids = result.current.issues.map((i) => i.id);
      expect(ids).toContain("content:alt:el-verify-b2-img-noalt");
      expect(ids).toContain("content:link-dead-page:el-verify-b2-link-dead");
    });
  });

  it("flags an image added after load (live tree, not the page snapshot)", async () => {
    const composer = new Composer({} as never);
    await composer.whenReady();
    composer.importProject({
      pages: [{ id: "p1", name: "Home", root: { id: "r1", type: "container", tagName: "div", children: [] } }],
    } as unknown as ProjectData);
    const { result } = renderHook(() => useContentIssueScanner(composer));

    act(() => {
      const img = composer.elements.createElement("image", { attributes: { src: "https://x.test/a.png" } });
      composer.elements.addElement(img, "r1");
    });
    act(() => result.current.rescan());

    await waitFor(() => {
      expect(result.current.issues.some((i) => i.contentKind === "missing-alt")).toBe(true);
    });
  });
});
