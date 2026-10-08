/**
 * The highlight BRP1-M5 / M7 draw on the canvas is drawn in the live
 * preview's page (the workspace covers the canvas): one outline rule per
 * highlighted `data-buildrick-id`, removed when the highlight is cleared.
 */
import { fireEvent, render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as React from "react";
import { EventEmitter } from "@/engine/EventEmitter";
import type { Composer } from "@/engine/Composer";
import { BrandLivePreview } from "../BrandLivePreview";

function fakeComposer(): Composer {
  const c = new EventEmitter() as unknown as Composer;
  Object.assign(c, {
    exportHTML: () => ({ combined: '<html><head></head><body><a data-buildrick-id="a">x</a></body></html>' }),
    elements: { getActivePage: () => ({ name: "Home", root: { id: "r" } }), getElement: () => ({ getChildren: () => [1] }) },
  });
  return c;
}

const highlightRule = (container: HTMLElement) =>
  container.querySelector("iframe")?.contentDocument?.head.querySelector("style[data-bk-highlight]")?.textContent ?? "";

describe("BrandLivePreview — highlight", () => {
  it("outlines exactly the highlighted elements, and clears", () => {
    const composer = fakeComposer();
    const { container, rerender } = render(<BrandLivePreview composer={composer} tokens={[]} mode="light" highlightIds={["a", "b"]} />);
    // The real frame writes its blocks on load (srcdoc); jsdom never loads it.
    fireEvent.load(container.querySelector("iframe")!);
    const css = highlightRule(container);
    expect(css).toContain('[data-buildrick-id="a"]');
    expect(css).toContain('[data-buildrick-id="b"]');
    expect(css).toContain("outline");
    rerender(<BrandLivePreview composer={composer} tokens={[]} mode="light" highlightIds={[]} />);
    expect(highlightRule(container)).toBe("");
  });
});
