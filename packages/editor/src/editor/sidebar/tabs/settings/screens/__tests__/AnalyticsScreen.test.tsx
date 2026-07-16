/**
 * AnalyticsScreen tests — GA measurement-ID + Meta Pixel ID validation,
 * input normalization (uppercase / digit-stripping), success notes,
 * dirty wiring, flush-handler contract.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import { AnalyticsScreen } from "../AnalyticsScreen";

const GA_PLACEHOLDER = "G-XXXXXXXXXX";
const PIXEL_PLACEHOLDER = "1234567890123456";

function setup(opts: {
  onDirtyChange?: (d: boolean) => void;
  registerFlushHandler?: (h: (() => void) | null) => void;
  settings?: Record<string, unknown>;
} = {}) {
  const composer = createMockComposer({ projectSettings: opts.settings ?? {} });
  const utils = render(
    <AnalyticsScreen
      composer={composer}
      onDirtyChange={opts.onDirtyChange}
      registerFlushHandler={opts.registerFlushHandler}
    />,
  );
  return { composer, ...utils };
}

const gaInput = () => screen.getByPlaceholderText(GA_PLACEHOLDER) as HTMLInputElement;
const pixelInput = () => screen.getByPlaceholderText(PIXEL_PLACEHOLDER) as HTMLInputElement;

describe("AnalyticsScreen — loading existing settings", () => {
  it("prefills GA / Pixel / cookie state from composer analytics settings", () => {
    setup({
      settings: {
        analytics: {
          googleAnalytics: { enabled: true, measurementId: "G-ABCD123456" },
          facebookPixel: { enabled: true, pixelId: "123456789012345" },
          cookieConsent: { enabled: false },
        },
      },
    });
    expect(gaInput().value).toBe("G-ABCD123456");
    expect(pixelInput().value).toBe("123456789012345");
    expect(
      screen.getByRole("switch", { name: /enable google analytics/i }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.getByRole("switch", { name: /enable meta pixel/i }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.getByRole("switch", { name: /show cookie banner/i }).getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("defaults: empty IDs, tracking off, cookie banner ON", () => {
    setup();
    expect(gaInput().value).toBe("");
    expect(pixelInput().value).toBe("");
    expect(
      screen.getByRole("switch", { name: /enable google analytics/i }).getAttribute("aria-checked"),
    ).toBe("false");
    expect(
      screen.getByRole("switch", { name: /show cookie banner/i }).getAttribute("aria-checked"),
    ).toBe("true");
  });
});

describe("AnalyticsScreen — GA measurement ID validation", () => {
  it("accepts a valid G- + 10 alphanumeric ID (no error, aria-invalid=false)", () => {
    setup();
    fireEvent.change(gaInput(), { target: { value: "G-ABCD123456" } });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(gaInput().getAttribute("aria-invalid")).toBe("false");
  });

  it("uppercases typed input before validating (g-abcd123456 → G-ABCD123456, valid)", () => {
    setup();
    fireEvent.change(gaInput(), { target: { value: "g-abcd123456" } });
    expect(gaInput().value).toBe("G-ABCD123456");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("rejects a malformed ID: shows role=alert error + aria-invalid=true", () => {
    setup();
    fireEvent.change(gaInput(), { target: { value: "G-123" } });
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/should start with G- followed\s+by 10 characters/);
    expect(gaInput().getAttribute("aria-invalid")).toBe("true");
    expect(gaInput().getAttribute("aria-describedby")).toBe("ga-error");
  });

  it("rejects an 11-char suffix (too long)", () => {
    setup();
    fireEvent.change(gaInput(), { target: { value: "G-ABCD1234567" } });
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("empty ID is not an error state", () => {
    setup();
    fireEvent.change(gaInput(), { target: { value: "G-123" } });
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.change(gaInput(), { target: { value: "" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the success note only when GA is enabled AND the ID is valid", () => {
    setup();
    const successRe = /Tracking will be added to your published site automatically/;
    fireEvent.change(gaInput(), { target: { value: "G-ABCD123456" } });
    expect(screen.queryByText(successRe)).toBeNull(); // valid but not enabled
    fireEvent.click(screen.getByRole("switch", { name: /enable google analytics/i }));
    expect(screen.getByText(successRe)).toBeTruthy();
    // Invalidate the ID — success note disappears.
    fireEvent.change(gaInput(), { target: { value: "G-123" } });
    expect(screen.queryByText(successRe)).toBeNull();
  });
});

describe("AnalyticsScreen — Meta Pixel ID validation", () => {
  it("strips non-digit characters as the user types", () => {
    setup();
    fireEvent.change(pixelInput(), { target: { value: "12ab34-cd56" } });
    expect(pixelInput().value).toBe("123456");
  });

  it("rejects IDs that are not 15-16 digits", () => {
    setup();
    fireEvent.change(pixelInput(), { target: { value: "12345678" } });
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/15 or 16 digits/);
    expect(pixelInput().getAttribute("aria-invalid")).toBe("true");
  });

  it("accepts 15-digit and 16-digit IDs", () => {
    setup();
    fireEvent.change(pixelInput(), { target: { value: "123456789012345" } });
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.change(pixelInput(), { target: { value: "1234567890123456" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("AnalyticsScreen — dirty wiring + flush handler", () => {
  it("starts clean; any field edit or switch toggle marks dirty", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByRole("switch", { name: /show cookie banner/i }));
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
  });

  it("registers a flush handler and clears it on unmount", () => {
    const registerFlushHandler = vi.fn();
    const { unmount } = setup({ registerFlushHandler });
    expect(registerFlushHandler).toHaveBeenCalledWith(expect.any(Function));
    unmount();
    expect(registerFlushHandler).toHaveBeenLastCalledWith(null);
  });

  it("flush writes analytics config; enabled flags are ANDed with a non-empty ID", () => {
    let flush: (() => void) | null = null;
    const registerFlushHandler = vi.fn((h: (() => void) | null) => {
      flush = h;
    });
    const { composer } = setup({ registerFlushHandler });

    fireEvent.change(gaInput(), { target: { value: "G-ABCD123456" } });
    fireEvent.click(screen.getByRole("switch", { name: /enable google analytics/i }));
    // Enable pixel WITHOUT an ID — flushed `enabled` must resolve false.
    fireEvent.click(screen.getByRole("switch", { name: /enable meta pixel/i }));
    fireEvent.click(screen.getByRole("switch", { name: /show cookie banner/i }));

    expect(flush).toBeTypeOf("function");
    act(() => flush!());

    expect(composer.setProjectSettings).toHaveBeenCalledTimes(1);
    const settings = composer.getProjectSettings() as {
      analytics: {
        googleAnalytics: { enabled: boolean; measurementId: string };
        facebookPixel: { enabled: boolean; pixelId: string };
        cookieConsent: { enabled: boolean };
      };
    };
    expect(settings.analytics.googleAnalytics).toEqual({
      enabled: true,
      measurementId: "G-ABCD123456",
    });
    expect(settings.analytics.facebookPixel).toEqual({ enabled: false, pixelId: "" });
    expect(settings.analytics.cookieConsent).toEqual({ enabled: false });
  });
});
