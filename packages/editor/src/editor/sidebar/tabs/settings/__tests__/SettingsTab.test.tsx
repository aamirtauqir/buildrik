/**
 * Settings Tab Tests — new shell, central savebar, no auto-save-on-blur
 *
 * Covers:
 *   SettingsTab: 6-row snav, active-row flip, Branding placeholder + Open Palette
 *                wiring, savebar DOM presence.
 *   SiteSettingsScreen: no auto-save-on-blur, onDirtyChange propagation.
 *
 * Note: useSettingsScreen is mocked to prevent the infinite render loop that
 * arises when inline selector functions re-create on every render (the hook's
 * useCallback depends on `selector`, which is a new arrow function each render).
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";

// ── Mock useSettingsScreen before component imports ───────────────────────────
//
// The hook is mocked at this level because the production implementation uses
// `useCallback([composer, selector])` where `selector` is always a new inline
// arrow function — causing an infinite re-render loop in jsdom. The mock
// preserves the same external contract: { value, isDirty, markDirty, markClean }.
vi.mock("../hooks/useSettingsScreen", () => ({
  useSettingsScreen: vi.fn(
    (composer: { getProjectSettings?: () => unknown } | null | undefined, selector: (s: unknown) => unknown, defaultValue: unknown) => {
      const raw = composer?.getProjectSettings?.() ?? {};
      const initialValue = (() => {
        try {
          return selector(raw);
        } catch {
          return defaultValue;
        }
      })();
      const [value] = React.useState(initialValue);
      const [isDirty, setIsDirty] = React.useState(false);
      return {
        value,
        isDirty,
        markDirty: () => setIsDirty(true),
        markClean: () => setIsDirty(false),
        reload: vi.fn(),
      };
    }
  ),
}));

import { SettingsTab } from "../SettingsTab";
import { SiteSettingsScreen } from "../screens/SiteSettingsScreen";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildMockComposer() {
  const settings = {
    seo: {
      siteName: "Initial Site",
      favicon: "",
      language: "en",
      socialLinks: { twitter: "", facebook: "", linkedin: "" },
    },
  };
  return {
    getProjectSettings: vi.fn(() => ({
      ...settings,
      seo: { ...settings.seo, socialLinks: { ...settings.seo.socialLinks } },
    })),
    setProjectSettings: vi.fn((next: unknown) => {
      Object.assign(settings, next);
    }),
    saveProject: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    off: vi.fn(),
  };
}

/** Returns all .bd-set-snav-row buttons from the document */
function snavRows(): HTMLElement[] {
  return Array.from(document.querySelectorAll(".bd-set-snav-row")) as HTMLElement[];
}

/** Finds a snav row by its label text */
function snavRow(label: string): HTMLElement | undefined {
  return snavRows().find(
    (r) => r.querySelector(".bd-set-snav-label")?.textContent?.trim() === label
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SettingsTab shell
// ─────────────────────────────────────────────────────────────────────────────

describe("SettingsTab", () => {
  it("renders the A1 day-1 nav: 10 in-tab sections + 8 workspace deep-links", () => {
    render(<SettingsTab composer={buildMockComposer() as never} />);
    const labels = snavRows()
      .map((r) => r.querySelector(".bd-set-snav-label")?.textContent?.trim())
      .filter(Boolean);
    // In-tab sections (3 groups: SITE / DISTRIBUTION / PLUMBING).
    expect(labels).toEqual(
      expect.arrayContaining([
        "General", "Branding", "SEO",
        "Analytics", "Localization",
        "Custom code", "Redirects", "Headers", "Forms", "Integrations",
      ])
    );
    // Workspace deep-links (open dashboard URLs in new tab).
    expect(labels).toEqual(
      expect.arrayContaining([
        "Domains", "Members", "Billing", "API tokens",
        "Webhooks", "Environments", "Audit log", "Versions",
      ])
    );
  });

  it("General row is active (.on class) by default", () => {
    render(<SettingsTab composer={buildMockComposer() as never} />);
    const general = snavRow("General");
    expect(general).toBeTruthy();
    expect(general?.className).toMatch(/\bon\b/);
  });

  it("clicking the SEO row flips .on class to that row and removes it from General", () => {
    render(<SettingsTab composer={buildMockComposer() as never} />);
    const seo = snavRow("SEO");
    expect(seo).toBeTruthy();
    fireEvent.click(seo!);
    expect(seo!.className).toMatch(/\bon\b/);
    expect(snavRow("General")?.className).not.toMatch(/\bon\b/);
  });

  it("clicking a snav row sets aria-current='page' on that row", () => {
    render(<SettingsTab composer={buildMockComposer() as never} />);
    const integrations = snavRow("Integrations");
    fireEvent.click(integrations!);
    expect(integrations?.getAttribute("aria-current")).toBe("page");
  });

  it("renders Branding placeholder with 'Design tokens' heading when Branding row is selected", () => {
    render(<SettingsTab composer={buildMockComposer() as never} />);
    fireEvent.click(snavRow("Branding")!);
    expect(screen.getByText(/Design tokens/i)).toBeInTheDocument();
  });

  it("Open Palette button calls onOpenDesignTab when provided", () => {
    const onOpenDesignTab = vi.fn();
    render(
      <SettingsTab
        composer={buildMockComposer() as never}
        onOpenDesignTab={onOpenDesignTab}
      />
    );
    fireEvent.click(snavRow("Branding")!);
    const openBtn = screen.getByRole("button", { name: /Open Palette/i });
    fireEvent.click(openBtn);
    expect(onOpenDesignTab).toHaveBeenCalledTimes(1);
  });

  it("Open Palette button is disabled when onOpenDesignTab is not passed", () => {
    render(<SettingsTab composer={buildMockComposer() as never} />);
    fireEvent.click(snavRow("Branding")!);
    const openBtn = screen.getByRole("button", { name: /Open Palette/i });
    expect(openBtn).toBeDisabled();
  });

  it("savebar DOM node is present and starts without .on class (hidden)", () => {
    const { container } = render(<SettingsTab composer={buildMockComposer() as never} />);
    const savebar = container.querySelector(".bd-set-savebar");
    expect(savebar).toBeInTheDocument();
    expect(savebar?.className).not.toMatch(/\bon\b/);
  });

  it("savebar has correct aria attributes when hidden", () => {
    const { container } = render(<SettingsTab composer={buildMockComposer() as never} />);
    const savebar = container.querySelector(".bd-set-savebar");
    expect(savebar?.getAttribute("aria-hidden")).toBe("true");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SiteSettingsScreen — no auto-save-on-blur
// ─────────────────────────────────────────────────────────────────────────────

describe("SiteSettingsScreen — no auto-save-on-blur", () => {
  it("typing into site name and blurring does NOT call saveProject", () => {
    const composer = buildMockComposer();
    render(<SiteSettingsScreen composer={composer as never} />);
    const input = screen.getByDisplayValue("Initial Site");
    fireEvent.change(input, { target: { value: "New Name" } });
    fireEvent.blur(input);
    expect(composer.saveProject).not.toHaveBeenCalled();
  });

  it("changing a field does NOT call saveProject immediately", () => {
    const composer = buildMockComposer();
    render(<SiteSettingsScreen composer={composer as never} />);
    const input = screen.getByDisplayValue("Initial Site");
    fireEvent.change(input, { target: { value: "New Name" } });
    expect(composer.saveProject).not.toHaveBeenCalled();
  });

  it("onDirtyChange fires true after editing a field", () => {
    const onDirtyChange = vi.fn();
    const composer = buildMockComposer();
    render(<SiteSettingsScreen composer={composer as never} onDirtyChange={onDirtyChange} />);
    const input = screen.getByDisplayValue("Initial Site");
    fireEvent.change(input, { target: { value: "Edited" } });
    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });

  it("input value reflects the typed change", () => {
    const composer = buildMockComposer();
    render(<SiteSettingsScreen composer={composer as never} />);
    const input = screen.getByDisplayValue("Initial Site");
    fireEvent.change(input, { target: { value: "My Updated Site" } });
    expect(input).toHaveValue("My Updated Site");
  });

  it("does not render a Save button inside the screen (save is in the central savebar)", () => {
    const composer = buildMockComposer();
    render(<SiteSettingsScreen composer={composer as never} />);
    // Screen itself should not have a Save button — save lives in SettingsTab's savebar
    expect(screen.queryByRole("button", { name: /^save$/i })).not.toBeInTheDocument();
  });
});
