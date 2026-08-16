/**
 * LockedScreen tests — pro / enterprise variants + CTA wiring.
 *
 * The coming-soon block that sat here asserted a waitlist CTA firing onWaitlist,
 * and passed while the variant was unreachable: SettingsTab is the only
 * construction site and SCREEN_PLAN_REQUIREMENTS types it "pro" | "enterprise".
 * The test supplied the variant it was testing.
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
    expect(String(url)).toMatch(/\/dashboard\/settings\/billing$/);
    expect(target).toBe("_blank");
  });
});

