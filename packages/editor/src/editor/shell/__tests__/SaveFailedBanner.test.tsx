/**
 * SaveFailedBanner tests — the anchor-rect fallback must not clamp the
 * banner to a near-0-width column when the canvas collapses without
 * unmounting (full-page Settings/Preview/Brand).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SaveFailedBanner } from "../SaveFailedBanner";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("SaveFailedBanner", () => {
  it("renders the retry/keep-editing copy and doors", () => {
    render(
      <SaveFailedBanner where="My Site · Home" leaving={false} busy={false} onRetry={vi.fn()} onKeepEditing={vi.fn()} />,
    );
    expect(screen.getByText("Couldn't save My Site · Home")).toBeInTheDocument();
    expect(screen.getByTestId("save-failed-retry")).toHaveTextContent("Retry save");
    expect(screen.getByTestId("save-failed-keep")).toHaveTextContent("Keep editing");
  });

  it("falls back to the default position when the toast anchor is a real, sized element", () => {
    const anchor = document.createElement("div");
    anchor.setAttribute("data-bk-toast-anchor", "");
    Object.assign(anchor.style, { position: "absolute" });
    document.body.appendChild(anchor);
    vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue({
      left: 300,
      top: 40,
      width: 800,
      height: 600,
      right: 1100,
      bottom: 640,
      x: 300,
      y: 40,
      toJSON() {},
    });
    render(<SaveFailedBanner where="Site · Home" leaving={false} busy={false} onRetry={vi.fn()} onKeepEditing={vi.fn()} />);
    const banner = screen.getByTestId("save-failed-banner");
    expect(banner.style.left).toBe("308px");
    expect(banner.style.width).toBe("784px");
  });

  /* The canvas column collapses to 0 width in full-page views without
     unmounting (Settings, Preview, Brand). Before this fix the banner used
     `col.width - 16` unguarded, clamping to a ~0-width column that wrapped
     every word onto its own line and sat over whatever was at x:0 — measured
     live at 32×482 over the Settings nav rail. */
  it("falls back to the default fixed position when the toast anchor has collapsed to 0 width", () => {
    const anchor = document.createElement("div");
    anchor.setAttribute("data-bk-toast-anchor", "");
    document.body.appendChild(anchor);
    vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON() {},
    });
    render(<SaveFailedBanner where="Site · Home" leaving={false} busy={false} onRetry={vi.fn()} onKeepEditing={vi.fn()} />);
    const banner = screen.getByTestId("save-failed-banner");
    expect(banner.style.left).toBe("68px");
    expect(banner.style.width).toBe("");
    expect(banner.style.right).toBe("336px");
  });

  it("falls back to the default fixed position when no toast anchor exists at all", () => {
    render(<SaveFailedBanner where="Site · Home" leaving={false} busy={false} onRetry={vi.fn()} onKeepEditing={vi.fn()} />);
    const banner = screen.getByTestId("save-failed-banner");
    expect(banner.style.left).toBe("68px");
    expect(banner.style.right).toBe("336px");
  });
});
