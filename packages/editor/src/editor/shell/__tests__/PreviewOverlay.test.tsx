/**
 * PreviewOverlay tests — in-shell preview (shell state 7): sandboxed iframe
 * render, Done + Escape exits, hidden when no html.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PreviewOverlay } from "../PreviewOverlay";

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

  it("'Done' exits", () => {
    const onDone = vi.fn();
    render(<PreviewOverlay html="<p>x</p>" onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
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
});
