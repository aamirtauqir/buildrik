/**
 * SeoScreen tests — Twitter handle + default OG image field behavior,
 * dirty wiring, flush-handler contract.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import { SeoScreen } from "../SeoScreen";

const baseSettings = () => ({
  seo: {
    siteName: "Keep Me",
    twitterHandle: "@acme",
    defaultOgImage: "https://acme.test/og.png",
  },
});

function setup(opts: {
  onDirtyChange?: (d: boolean) => void;
  registerFlushHandler?: (h: (() => void) | null) => void;
  settings?: Record<string, unknown>;
} = {}) {
  const composer = createMockComposer({ projectSettings: opts.settings ?? baseSettings() });
  const utils = render(
    <SeoScreen
      composer={composer}
      onDirtyChange={opts.onDirtyChange}
      registerFlushHandler={opts.registerFlushHandler}
    />,
  );
  return { composer, ...utils };
}

describe("SeoScreen — field behavior", () => {
  it("renders fields prefilled from composer seo settings", () => {
    setup();
    expect((screen.getByLabelText(/twitter handle/i) as HTMLInputElement).value).toBe("@acme");
    expect((screen.getByLabelText(/default og image url/i) as HTMLInputElement).value).toBe(
      "https://acme.test/og.png",
    );
  });

  it("falls back to empty defaults when settings are missing", () => {
    setup({ settings: {} });
    expect((screen.getByLabelText(/twitter handle/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/default og image url/i) as HTMLInputElement).value).toBe("");
  });

  it("renders the per-page SEO signpost note", () => {
    setup();
    expect(screen.getByText(/Per-page SEO .* is set in each page/)).toBeTruthy();
  });

  it("starts clean, then typing in either field marks the screen dirty", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);

    const handle = screen.getByLabelText(/twitter handle/i) as HTMLInputElement;
    fireEvent.change(handle, { target: { value: "@renamed" } });
    expect(handle.value).toBe("@renamed");
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
  });

  it("does NOT write to composer per keystroke", () => {
    const { composer } = setup();
    fireEvent.change(screen.getByLabelText(/default og image url/i), {
      target: { value: "https://acme.test/new-og.png" },
    });
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
  });

  it("resyncs when composer settings change externally (SETTINGS_CHANGE)", async () => {
    const { composer } = setup();
    act(() => {
      composer.setProjectSettings({
        seo: { ...baseSettings().seo, twitterHandle: "@external" },
      });
    });
    await waitFor(() => {
      expect((screen.getByLabelText(/twitter handle/i) as HTMLInputElement).value).toBe(
        "@external",
      );
    });
  });
});

describe("SeoScreen — flush handler contract", () => {
  it("registers a flush handler on mount and clears it on unmount", () => {
    const registerFlushHandler = vi.fn();
    const { unmount } = setup({ registerFlushHandler });
    expect(registerFlushHandler).toHaveBeenCalledWith(expect.any(Function));
    unmount();
    expect(registerFlushHandler).toHaveBeenLastCalledWith(null);
  });

  it("flush writes twitterHandle + defaultOgImage into composer, preserving sibling seo keys", () => {
    let flush: (() => void) | null = null;
    const registerFlushHandler = vi.fn((h: (() => void) | null) => {
      flush = h;
    });
    const { composer } = setup({ registerFlushHandler });

    fireEvent.change(screen.getByLabelText(/twitter handle/i), {
      target: { value: "@flushed" },
    });
    fireEvent.change(screen.getByLabelText(/default og image url/i), {
      target: { value: "https://acme.test/flushed.png" },
    });

    expect(flush).toBeTypeOf("function");
    act(() => flush!());

    expect(composer.setProjectSettings).toHaveBeenCalledTimes(1);
    const settings = composer.getProjectSettings() as ReturnType<typeof baseSettings>;
    expect(settings.seo.twitterHandle).toBe("@flushed");
    expect(settings.seo.defaultOgImage).toBe("https://acme.test/flushed.png");
    // siteName is owned by SiteSettingsScreen — flush must not clobber it.
    expect(settings.seo.siteName).toBe("Keep Me");
  });
});
