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

  it("names a brand refusal instead of blaming the connection, and offers no pointless retry (I1)", () => {
    render(
      <SaveFailedBanner
        where="My Site · Home"
        leaving={false}
        busy={false}
        refusal="alias target missing: nowhere"
        onRetry={vi.fn()}
        onKeepEditing={vi.fn()}
      />,
    );
    expect(screen.getByTestId("save-failed-banner")).toHaveTextContent("The brand change was refused: alias target missing: nowhere");
    expect(screen.getByTestId("save-failed-banner")).not.toHaveTextContent("Check your connection");
    expect(screen.queryByTestId("save-failed-retry")).toBeNull();
    expect(screen.getByTestId("save-failed-keep")).toBeInTheDocument();
  });

  it("does not tell a user whose Brand is read-only to undo a brand change they cannot make", () => {
    render(
      <SaveFailedBanner
        where="My Site · Home"
        leaving={false}
        busy={false}
        refusal="alias target missing: nowhere"
        brandLocked
        onRetry={vi.fn()}
        onKeepEditing={vi.fn()}
      />,
    );
    const banner = screen.getByTestId("save-failed-banner");
    expect(banner).not.toHaveTextContent(/undo/i);
    expect(banner).toHaveTextContent(/reload/i);
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

  const anchorWithRect = (left: number, width: number) => {
    const anchor = document.createElement("div");
    anchor.setAttribute("data-bk-toast-anchor", "");
    document.body.appendChild(anchor);
    vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue({
      left,
      top: 0,
      width,
      height: width ? 900 : 0,
      right: left + width,
      bottom: width ? 900 : 0,
      x: left,
      y: 0,
      toJSON() {},
    });
  };

  /* Full-page views (Settings, Brand, Templates) cover the canvas column and
     squeeze it without unmounting it. The fallback must clear their shared
     256px nav at x:0 — the old 68px-left default sat on top of it. */
  const expectFullPageFallback = () => {
    const banner = screen.getByTestId("save-failed-banner");
    expect(banner.style.left).toBe("264px");
    expect(banner.style.top).toBe("8px");
    expect(banner.style.right).toBe("8px");
    expect(banner.style.width).toBe("");
  };

  it("falls back clear of the full-page nav when the toast anchor has collapsed to 0 width", () => {
    anchorWithRect(0, 0);
    render(<SaveFailedBanner where="Site · Home" leaving={false} busy={false} onRetry={vi.fn()} onKeepEditing={vi.fn()} />);
    expectFullPageFallback();
  });

  /* Measured live in full-page Brand at 1440×900: the column was squeezed to
     a 48px sliver at x:0, not 0 — the banner rendered 32px wide over the
     Brand nav with one word per line. A column too narrow to hold the card
     is the same case as no column. */
  it("falls back clear of the full-page nav when the toast anchor is a non-zero sliver", () => {
    anchorWithRect(0, 48);
    render(<SaveFailedBanner where="Site · Home" leaving={false} busy={false} onRetry={vi.fn()} onKeepEditing={vi.fn()} />);
    expectFullPageFallback();
  });

  it("falls back clear of the full-page nav when no toast anchor exists at all", () => {
    render(<SaveFailedBanner where="Site · Home" leaving={false} busy={false} onRetry={vi.fn()} onKeepEditing={vi.fn()} />);
    expectFullPageFallback();
  });
});
