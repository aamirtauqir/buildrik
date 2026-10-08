/**
 * The Light / Dark switch sits in the preview card's header row, beside the
 * zoom (BRP1-M8 8224:240644 keeps the page frame clear) — it used to be laid
 * over the top of the page frame, on the page's own content.
 *
 * @license BSD-3-Clause
 */
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { BrandLivePreview } from "../BrandLivePreview";

function fakeComposer(children: number) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    exportHTML: () => ({ combined: "<!doctype html><html><head></head><body><p>Hi</p></body></html>" }),
    elements: {
      getActivePage: () => ({ name: "Home", root: { id: "root" } }),
      getElement: () => ({ getChildren: () => new Array(children) }),
    },
  } as never;
}

describe("BrandLivePreview — the Light / Dark switch", () => {
  it.each([
    ["a page with content", 1],
    ["an empty page", 0],
  ])("sits in the header row on %s, never over the page frame", (_label, children) => {
    const utils = render(
      <BrandLivePreview composer={fakeComposer(children)} tokens={[]} mode="light" controls={<span data-testid="seg" />} />,
    );
    const seg = utils.getByTestId("seg");
    expect(seg.closest("header")).toBeTruthy();
    expect(utils.queryByTestId("brand-live-preview-frame")?.contains(seg) ?? false).toBe(false);
  });
});
