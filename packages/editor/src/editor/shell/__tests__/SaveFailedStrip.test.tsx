/**
 * SaveFailedStrip — board C05 `10:2199`: the failed save is a strip over the
 * canvas column (not the slot's bar), and still one error surface: it shares
 * the connection id, so "Can't reach" replaces it instead of stacking.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { act, render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { SaveFailedStrip } from "../SaveFailedStrip";
import { GlobalBannerSlot } from "../GlobalBannerSlot";
import { BANNER_ID, clearGlobalBanner, saveFailedBanner, showCantReachBanner, showGlobalBanner, showSessionExpiredBanner } from "../globalBanners";

afterEach(() => {
  act(() => Object.values(BANNER_ID).forEach(clearGlobalBanner));
  cleanup();
});

const both = () =>
  render(
    <>
      <GlobalBannerSlot />
      <SaveFailedStrip />
    </>,
  );

describe("SaveFailedStrip (C05 10:2199)", () => {
  it("draws the failed save as the canvas strip — ⚠, the line, a white Retry — and not as the slot's bar", () => {
    const retry = vi.fn();
    both();
    act(() => showGlobalBanner(saveFailedBanner({ where: "Fieldwork · Home", retry })));
    expect(screen.getByTestId("save-failed-message").textContent).toBe("Couldn't save Fieldwork · Home. Your changes are kept.");
    expect(screen.queryByTestId("global-banner")).toBeNull();
    const button = screen.getByTestId("save-failed-retry");
    expect(button.className).toContain("tw:bg-white");
    fireEvent.click(button);
    expect(retry).toHaveBeenCalledOnce();
  });

  it("is replaced by Can't reach (same condition), never stacked with it", () => {
    both();
    act(() => showGlobalBanner(saveFailedBanner({ where: "S · Home", retry: () => {} })));
    act(() => showCantReachBanner(() => {}));
    expect(screen.queryByTestId("save-failed-banner")).toBeNull();
    expect(screen.getAllByTestId("global-banner")).toHaveLength(1);
  });

  it("steps aside while the session-expired banner holds the slot", () => {
    both();
    act(() => showGlobalBanner(saveFailedBanner({ where: "S · Home", retry: () => {} })));
    act(() => showSessionExpiredBanner(() => {}));
    expect(screen.queryByTestId("save-failed-banner")).toBeNull();
  });
});
