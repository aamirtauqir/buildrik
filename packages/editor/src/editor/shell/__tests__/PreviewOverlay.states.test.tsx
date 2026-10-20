/**
 * Design decision 9 (DR-T6): the preview's own build states — building,
 * failed (cause, Try again, Back to editor), failing again (Copy error
 * details) — with focus on the heading, and Escape from inside the frame.
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PreviewOverlay } from "../PreviewOverlay";

afterEach(cleanup);

describe("PreviewOverlay — build states", () => {
  it("building: says so, focuses the heading, shows no stale page", () => {
    render(<PreviewOverlay html={null} status="building" onDone={vi.fn()} />);
    const heading = screen.getByRole("heading", { name: "Building preview…" });
    expect(document.activeElement).toBe(heading);
    expect(screen.queryByTitle("Site preview")).toBeNull();
  });

  it("failed once: cause, Try again, Back to editor", () => {
    const onRetry = vi.fn();
    const onDone = vi.fn();
    render(
      <PreviewOverlay html={null} status="error" error="Collection list has no source" attempts={1} onRetry={onRetry} onDone={onDone} />,
    );
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Preview couldn’t be built" }));
    expect(screen.getByText("Collection list has no source")).toBeTruthy();
    expect(screen.queryByTestId("preview-copy-error")).toBeNull();
    fireEvent.click(screen.getByTestId("preview-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("preview-back-to-editor"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("failed again: Still failing, with the details to copy", () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });
    render(<PreviewOverlay html={null} status="error" error="boom at line 3" attempts={2} onRetry={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Still failing" })).toBeTruthy();
    fireEvent.click(screen.getByTestId("preview-copy-error"));
    expect(writeText).toHaveBeenCalledWith("boom at line 3");
  });

  it("Escape typed inside the frame closes the preview", () => {
    const onDone = vi.fn();
    render(<PreviewOverlay html="<p>hi</p>" onDone={onDone} />);
    const frame = screen.getByTitle("Site preview") as HTMLIFrameElement;
    /* The frame's bridge forwards Escape (no same-origin access, BD-34). */
    window.dispatchEvent(new MessageEvent("message", { data: { source: "bk-preview", type: "escape" }, source: frame.contentWindow as Window }));
    expect(onDone).toHaveBeenCalled();
  });
});
