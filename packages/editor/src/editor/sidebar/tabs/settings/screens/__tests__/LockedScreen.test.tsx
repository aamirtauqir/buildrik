/**
 * LockedScreen tests — Clone 3397:32859 (Custom code on a FREE plan): the
 * one card — plan pill, `<Feature> is a Pro feature`, the body line,
 * `Upgrade to Pro` → dashboard billing — and the enterprise variant.
 *
 * The coming-soon block that sat here asserted a waitlist CTA firing
 * onWaitlist, and passed while the variant was unreachable: SettingsTab is
 * the only construction site and SCREEN_PLAN_REQUIREMENTS types it
 * "pro" | "enterprise". The test supplied the variant it was testing.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";
import { LockedScreen, LOCKED_COPY } from "../LockedScreen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("LockedScreen — the frame's card", () => {
  it("draws the PRO pill, `Custom code is a Pro feature`, the body and `Upgrade to Pro`", () => {
    render(<LockedScreen variant="pro" {...LOCKED_COPY["custom-code"]} />);
    const card = screen.getByTestId("set-locked");
    expect(card).toHaveTextContent("Pro");
    expect(screen.getByRole("heading", { name: "Custom code is a Pro feature" })).toBeInTheDocument();
    expect(card).toHaveTextContent(
      "Custom code injects your own <head> markup, end-of-<body> scripts and CSS into every published page — analytics, fonts, chat widgets. It ships on every publish.",
    );
    expect(screen.getByTestId("set-locked-upgrade")).toHaveTextContent("Upgrade to Pro");
    expect(screen.getByRole("button", { name: /upgrade to pro plan/i })).toBe(screen.getByTestId("set-locked-upgrade"));
  });

  it("is generic — Integrations gets its own subject and body", () => {
    render(<LockedScreen variant="pro" {...LOCKED_COPY.integrations} />);
    expect(screen.getByRole("heading", { name: "Integrations is a Pro feature" })).toBeInTheDocument();
    expect(screen.getByTestId("set-locked")).toHaveTextContent(/connect your published site/i);
  });

  it("enterprise variant names Enterprise in the title, pill and CTA", () => {
    render(<LockedScreen variant="enterprise" feature="Custom code" />);
    expect(screen.getByRole("heading", { name: "Custom code is an Enterprise feature" })).toBeInTheDocument();
    expect(screen.getByTestId("set-locked-upgrade")).toHaveTextContent("Upgrade to Enterprise");
    expect(screen.getByRole("button", { name: /upgrade to enterprise plan/i })).toBeInTheDocument();
  });

  it("falls back to a generic subject and body when the shell passes none", () => {
    render(<LockedScreen variant="pro" />);
    expect(screen.getByRole("heading", { name: "This feature is a Pro feature" })).toBeInTheDocument();
    expect(screen.getByTestId("set-locked")).toHaveTextContent("Upgrade your plan to unlock it.");
  });
});

describe("LockedScreen — the upgrade door", () => {
  it("invokes onUpgrade instead of opening the billing tab when a handler is given", () => {
    const onUpgrade = vi.fn();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<LockedScreen variant="pro" onUpgrade={onUpgrade} />);
    fireEvent.click(screen.getByTestId("set-locked-upgrade"));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("falls back to opening the dashboard billing URL in a new tab", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<LockedScreen variant="pro" {...LOCKED_COPY["custom-code"]} />);
    fireEvent.click(screen.getByTestId("set-locked-upgrade"));
    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url, target] = openSpy.mock.calls[0];
    expect(String(url)).toMatch(/\/dashboard\/settings\/billing$/);
    expect(target).toBe("_blank");
  });
});
