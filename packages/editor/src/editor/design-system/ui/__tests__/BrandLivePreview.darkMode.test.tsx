/**
 * BRP1-M8 dark-preview (8224:240644): turning Dark mode Auto on an Off site
 * previews the page in dark before anything is saved. The frame's document is
 * the SAVED export — an Off site's, with no Auto page rules — so the staged
 * block has to carry the page rules the export gains once Auto is saved:
 * the body painted with the page background and body text in the text token.
 * Without them the preview showed dark tokens on a white page.
 */
import { fireEvent, render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as React from "react";
import { EventEmitter } from "@/engine/EventEmitter";
import type { Composer } from "@/engine/Composer";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { BrandLivePreview } from "../BrandLivePreview";

function fakeComposer(): Composer {
  const c = new EventEmitter() as unknown as Composer;
  Object.assign(c, {
    exportHTML: () => ({ combined: "<html><head></head><body><h1>x</h1></body></html>" }),
    elements: { getActivePage: () => ({ name: "Home", root: { id: "r" } }), getElement: () => ({ getChildren: () => [1] }) },
  });
  return c;
}

const staged = (container: HTMLElement) =>
  container.querySelector("iframe")?.contentDocument?.head.querySelector("style[data-bk-staged]")?.textContent ?? "";

describe("BrandLivePreview — the page under a Dark mode Auto preview", () => {
  it("paints the body with the page background and the text token when the previewed site is Auto", () => {
    const { container } = render(<BrandLivePreview composer={fakeComposer()} tokens={DEFAULT_TOKENS} mode="dark" darkMode="auto" />);
    fireEvent.load(container.querySelector("iframe")!);
    const css = staged(container).replace(/\s/g, "");
    expect(css).toContain("body{background-color:var(--buildrick-design-color-page-background)}");
    expect(css).toMatch(/body\{color:var\(--buildrick-design-color-text,#[0-9A-Fa-f]{6}\)\}/);
  });

  it("adds no page rules for an Off site — its export has none", () => {
    const { container } = render(<BrandLivePreview composer={fakeComposer()} tokens={DEFAULT_TOKENS} mode="light" darkMode="off" />);
    fireEvent.load(container.querySelector("iframe")!);
    expect(staged(container)).not.toMatch(/body\s*\{/);
  });
});
