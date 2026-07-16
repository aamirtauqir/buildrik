/**
 * LockedScreen tests — pro / enterprise / coming-soon variants + CTA wiring.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";
import { LockedScreen } from "../LockedScreen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("LockedScreen — pro / enterprise variants", () => {
  it("pro variant shows a Pro title + generic upgrade copy + Upgrade Now CTA", () => {
    render(<LockedScreen variant="pro" />);
    expect(screen.getByText(/Available in Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/Upgrade your plan to unlock this feature/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upgrade to pro plan/i })).toBeInTheDocument();
  });

  it("enterprise variant shows an Enterprise title + aria label", () => {
    render(<LockedScreen variant="enterprise" />);
    expect(screen.getByText(/Available in Enterprise/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upgrade to enterprise plan/i })).toBeInTheDocument();
  });

  it("uses a custom message when provided", () => {
    render(<LockedScreen variant="pro" message="Custom teams-only copy" />);
    expect(screen.getByText("Custom teams-only copy")).toBeInTheDocument();
  });

  it("invokes onUpgrade instead of opening the billing tab when a handler is given", () => {
    const onUpgrade = vi.fn();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<LockedScreen variant="pro" onUpgrade={onUpgrade} />);
    fireEvent.click(screen.getByRole("button", { name: /upgrade to pro plan/i }));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("falls back to opening the dashboard billing URL in a new tab", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<LockedScreen variant="enterprise" />);
    fireEvent.click(screen.getByRole("button", { name: /upgrade to enterprise plan/i }));
    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url, target] = openSpy.mock.calls[0];
    expect(String(url)).toMatch(/\/dashboard\/billing$/);
    expect(target).toBe("_blank");
  });
});

describe("LockedScreen — coming-soon variant", () => {
  it("renders the default 'Coming Soon' title and no upgrade CTA", () => {
    render(<LockedScreen variant="coming-soon" />);
    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("uses a custom title + message", () => {
    render(<LockedScreen variant="coming-soon" title="Almost there" message="Ships next week" />);
    expect(screen.getByText("Almost there")).toBeInTheDocument();
    expect(screen.getByText("Ships next week")).toBeInTheDocument();
  });

  it("renders a waitlist CTA that fires onWaitlist", () => {
    const onWaitlist = vi.fn();
    render(
      <LockedScreen variant="coming-soon" waitlistLabel="Get notified →" onWaitlist={onWaitlist} />
    );
    const cta = screen.getByRole("button", { name: /get notified/i });
    fireEvent.click(cta);
    expect(onWaitlist).toHaveBeenCalledTimes(1);
  });

  it("omits the waitlist CTA when no label is passed", () => {
    render(<LockedScreen variant="coming-soon" onWaitlist={vi.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
