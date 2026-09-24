/**
 * PreviewOverlay tests — in-shell preview (shell state 7): sandboxed iframe
 * render, "‹ Back to canvas" + Escape exit, hidden when no html.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => ({
    siteDetail: { sharing: { list: { query: () => new Promise(() => {}) }, create: { mutate: vi.fn() } } },
  }),
}));

import { PreviewOverlay } from "../PreviewOverlay";
import { ToastProvider } from "@/editor/chrome-ui";

afterEach(() => cleanup());

describe("PreviewOverlay", () => {
  it("renders nothing without html", () => {
    render(<PreviewOverlay html={null} onDone={vi.fn()} />);
    expect(screen.queryByTestId("preview-overlay")).toBeNull();
  });

  it("renders the sanitized html in a fully sandboxed iframe", () => {
    render(<PreviewOverlay html="<h1>hi</h1>" onDone={vi.fn()} />);
    const frame = screen.getByTitle("Site preview") as HTMLIFrameElement;
    expect(frame.getAttribute("srcDoc") ?? frame.getAttribute("srcdoc")).toBe("<h1>hi</h1>");
    expect(frame.getAttribute("sandbox")).toBe("");
  });

  /* Board 4418:165611 (C5 G1-086): the way out is "‹ Back to canvas" in the
     preview's own bar; the Done pill is gone, and each device names its width. */
  it("'‹ Back to canvas' exits, and each device names its width", () => {
    const onDone = vi.fn();
    render(<PreviewOverlay html="<p>x</p>" onDone={onDone} />);
    expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
    expect(screen.getByTestId("bp-cell-desktop")).toHaveTextContent("Desktop1320px");
    expect(screen.getByTestId("bp-cell-tablet")).toHaveTextContent("Tablet768px");
    expect(screen.getByTestId("bp-cell-mobile")).toHaveTextContent("Mobile375px");
    fireEvent.click(screen.getByRole("button", { name: "‹ Back to canvas" }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("Escape exits", () => {
    const onDone = vi.fn();
    render(<PreviewOverlay html="<p>x</p>" onDone={onDone} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  /* Board 807:8663. The row was recorded unbuildable on "PreviewOverlay has no
     device frame"; DeviceFramePreview has existed all along and the overlay
     simply did not use it. Asserted through the frame's own geometry — the
     screen div carries the device width — rather than through a class name,
     because a class can be present while the frame renders nothing. */
  const frame = () => screen.getByTitle("Site preview") as HTMLIFrameElement;

  it("a narrow device puts the page inside the device frame, and desktop does not", () => {
    render(<PreviewOverlay html="<p>x</p>" onDone={vi.fn()} />);
    expect(frame().parentElement?.style.width).toBe("");

    fireEvent.click(screen.getByRole("button", { name: /^Mobile/ }));
    expect(frame().parentElement?.style.width).toBe("375px");

    fireEvent.click(screen.getByRole("button", { name: /^Tablet/ }));
    expect(frame().parentElement?.style.width).toBe("768px");

    fireEvent.click(screen.getByRole("button", { name: /^Desktop/ }));
    expect(frame().parentElement?.style.width).toBe("");
  });

  it("the device row is reachable while the overlay covers the canvas", () => {
    render(<PreviewOverlay html="<p>x</p>" onDone={vi.fn()} />);
    // The editor's own device control is under the overlay, so the preview has
    // to carry one or the responsive check cannot be done here at all.
    expect(screen.getByRole("group", { name: "Breakpoint" })).toBeInTheDocument();
  });

  /* B1 / G1-022: the preview bar carries Share (boards 4418:165611 · 165563 ·
     120075), which opens the same share modal as the site menu row. Hidden
     without a site — there is no share link to mint. */
  it("hides Share button when siteId is null", () => {
    render(<PreviewOverlay html="<p>x</p>" onDone={vi.fn()} siteId={null} />);
    expect(screen.queryByTestId("preview-share-button")).toBeNull();
  });

  it("Share opens the share modal", async () => {
    render(
      <ToastProvider>
        <PreviewOverlay html="<p>x</p>" onDone={vi.fn()} siteId="site-abc" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByTestId("preview-share-button"));
    expect(await screen.findByTestId("preview-share-modal")).toHaveTextContent("Share preview");
  });
});
