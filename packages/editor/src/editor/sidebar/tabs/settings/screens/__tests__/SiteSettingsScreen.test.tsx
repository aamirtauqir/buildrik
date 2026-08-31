/**
 * SiteSettingsScreen tests — field rendering, edit behavior, markDirty wiring,
 * flush-handler contract (registerFlushHandler → composer.setProjectSettings).
 *
 * Drill-in nav + central savebar are covered in ../__tests__/SettingsTab.test.tsx.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import type { ProjectSettings } from "@/shared/types/project";
import { SiteSettingsScreen } from "../SiteSettingsScreen";

const baseSettings = () => ({
  seo: {
    siteName: "Acme Site",
    favicon: "https://acme.test/favicon.ico",
    language: "fr",
    twitterHandle: "@keepme",
    socialLinks: {
      twitter: "https://twitter.com/acme",
      facebook: "https://facebook.com/acme",
      linkedin: "https://linkedin.com/company/acme",
    },
  },
});

function setup(opts: {
  onDirtyChange?: (d: boolean) => void;
  registerFlushHandler?: (h: (() => void) | null) => void;
  settings?: Record<string, unknown>;
} = {}) {
  const composer = createMockComposer({ projectSettings: opts.settings ?? baseSettings() });
  const utils = render(
    <SiteSettingsScreen
      composer={composer}
      onDirtyChange={opts.onDirtyChange}
      registerFlushHandler={opts.registerFlushHandler}
    />,
  );
  return { composer, ...utils };
}

describe("SiteSettingsScreen — field rendering", () => {
  it("renders Site Identity fields prefilled from composer projectSettings", () => {
    setup();
    expect(
      (screen.getByPlaceholderText("Bella Cucina") as HTMLInputElement).value,
    ).toBe("Acme Site");
    expect(
      (screen.getByPlaceholderText("https://example.com/favicon.ico") as HTMLInputElement).value,
    ).toBe("https://acme.test/favicon.ico");
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("fr");
  });

  it("renders Social Links fields prefilled from seo.socialLinks", () => {
    setup();
    expect((screen.getByLabelText(/twitter/i) as HTMLInputElement).value).toBe(
      "https://twitter.com/acme",
    );
    expect((screen.getByLabelText(/facebook/i) as HTMLInputElement).value).toBe(
      "https://facebook.com/acme",
    );
    expect((screen.getByLabelText(/linkedin/i) as HTMLInputElement).value).toBe(
      "https://linkedin.com/company/acme",
    );
  });

  it("falls back to defaults when composer settings are empty", () => {
    setup({ settings: {} });
    expect((screen.getByPlaceholderText("Bella Cucina") as HTMLInputElement).value).toBe("");
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("en");
  });

  it("renders the Legal section links (Privacy / Terms) with new-tab attrs", () => {
    setup();
    const privacy = screen.getByRole("link", { name: /privacy policy/i });
    const terms = screen.getByRole("link", { name: /terms of service/i });
    expect(privacy.getAttribute("href")).toBe("/privacy");
    expect(terms.getAttribute("href")).toBe("/terms");
    [privacy, terms].forEach((a) => {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toContain("noopener");
    });
  });
});

describe("SiteSettingsScreen — edit behavior + markDirty wiring", () => {
  it("starts clean: onDirtyChange fires with false on mount", () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("editing Site Name updates the input and marks the screen dirty (identity section)", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    const input = screen.getByPlaceholderText("Bella Cucina") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Renamed Site" } });
    expect(input.value).toBe("Renamed Site");
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
  });

  it("changing the language select marks dirty", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "de" } });
    expect(select.value).toBe("de");
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
  });

  it("editing a social link marks dirty via the social section's markDirty", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    fireEvent.change(screen.getByLabelText(/twitter/i), {
      target: { value: "https://twitter.com/renamed" },
    });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
  });

  it("does NOT write to composer per keystroke — edits stay in the local buffer", () => {
    const { composer } = setup();
    fireEvent.change(screen.getByPlaceholderText("Bella Cucina"), {
      target: { value: "Typed But Not Flushed" },
    });
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
  });

  it("resyncs displayed values when composer settings change externally (SETTINGS_CHANGE)", async () => {
    const { composer } = setup();
    act(() => {
      composer.setProjectSettings({
        seo: { ...baseSettings().seo, siteName: "External Rename" },
      } as Partial<ProjectSettings>);
    });
    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText("Bella Cucina") as HTMLInputElement).value,
      ).toBe("External Rename");
    });
  });
});

describe("SiteSettingsScreen — flush handler contract", () => {
  it("registers a flush handler on mount and clears it on unmount", () => {
    const registerFlushHandler = vi.fn();
    const { unmount } = setup({ registerFlushHandler });
    expect(registerFlushHandler).toHaveBeenCalledWith(expect.any(Function));
    unmount();
    expect(registerFlushHandler).toHaveBeenLastCalledWith(null);
  });

  it("flush pushes the typed identity + social values into composer.setProjectSettings, preserving sibling seo keys", () => {
    let flush: (() => void) | null = null;
    const registerFlushHandler = vi.fn((h: (() => void) | null) => {
      flush = h;
    });
    const { composer } = setup({ registerFlushHandler });

    fireEvent.change(screen.getByPlaceholderText("Bella Cucina"), {
      target: { value: "Flushed Name" },
    });
    fireEvent.change(screen.getByLabelText(/twitter/i), {
      target: { value: "https://twitter.com/flushed" },
    });

    expect(flush).toBeTypeOf("function");
    act(() => flush!());

    expect(composer.setProjectSettings).toHaveBeenCalledTimes(1);
    const settings = composer.getProjectSettings() as ReturnType<typeof baseSettings>;
    expect(settings.seo.siteName).toBe("Flushed Name");
    expect(settings.seo.socialLinks.twitter).toBe("https://twitter.com/flushed");
    // Untouched fields survive the flush.
    expect(settings.seo.favicon).toBe("https://acme.test/favicon.ico");
    expect(settings.seo.socialLinks.facebook).toBe("https://facebook.com/acme");
    // Sibling seo key owned by SeoScreen is preserved (spread of current.seo).
    expect(settings.seo.twitterHandle).toBe("@keepme");
  });
});
