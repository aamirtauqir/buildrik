/**
 * L4-020: after a reload, Brand read "unused" / "Used by 0 elements" for a
 * token a button was still bound to — usage was rebuilt only on element
 * events, and a project load emits none. The count must be right straight
 * after importProject, and so must the element breakdown ("Used by" list and
 * canvas highlight), or delete skips its replace dialog for a used token.
 *
 * @license BSD-3-Clause
 */
import { beforeAll, describe, it, expect } from "vitest";
import { Composer } from "../Composer";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function loaded(): { composer: Composer; tokenId: string } {
  const composer = new Composer({} as never);
  const token = composer.getProjectSettings().designTokens?.[0];
  composer.importProject({
    pages: [{
      id: "p", name: "Home", slug: "", isHome: true,
      root: {
        id: "root", type: "container", tagName: "div",
        children: [
          { id: "btn", type: "button", tagName: "button", content: "Go", children: [],
            styles: { backgroundColor: "var(--buildrick-design-color-primary)" } },
        ],
      },
    }],
    styles: [],
  } as never);
  return { composer, tokenId: token?.id ?? "color-primary" };
}

describe("token usage straight after a project load", () => {
  it("counts the bound element", () => {
    const { composer, tokenId } = loaded();
    expect(composer.designSystem.tokenUsage.getUsage(tokenId)).toBe(1);
  });

  it("lists the bound element in the breakdown", () => {
    const { composer, tokenId } = loaded();
    expect(composer.designSystem.tokenUsage.getBreakdown(tokenId)).toEqual([
      { elementId: "btn", styleProp: "backgroundColor" },
    ]);
  });
});
