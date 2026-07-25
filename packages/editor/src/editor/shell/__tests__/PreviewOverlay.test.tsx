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
});
