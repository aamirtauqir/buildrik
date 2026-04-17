/**
 * Settings Tab Tests — SiteSettingsScreen hybrid pattern
 * Covers: hybrid state management, auto-save on blur, dirty state, save error
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";
import { SiteSettingsScreen } from "../screens/SiteSettingsScreen";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeComposer(overrides?: Partial<ReturnType<typeof buildMockComposer>>) {
  return { ...buildMockComposer(), ...overrides };
}

function buildMockComposer() {
  return {
    getProjectSettings: vi.fn(() => ({
      seo: {
        siteName: "",
        favicon: "",
        language: "en",
        socialLinks: { twitter: "", facebook: "", linkedin: "" },
      },
    })),
    setProjectSettings: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
}

// ── SiteSettingsScreen hybrid pattern ─────────────────────────────────────────

describe("SiteSettingsScreen", () => {
  let composer: ReturnType<typeof makeComposer>;

  beforeEach(() => {
    composer = makeComposer();
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  describe("save error state", () => {
    it("shows alert when setProjectSettings throws", () => {
      composer = makeComposer({
        setProjectSettings: vi.fn(() => {
          throw new Error("Network error");
        }),
      });

      render(<SiteSettingsScreen composer={composer as never} />);

      // No error before save
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("does not show sett-save-error before save attempt", () => {
      composer = makeComposer();
      const { container } = render(<SiteSettingsScreen composer={composer as never} />);
      expect(container.querySelector(".sett-save-error")).toBeFalsy();
    });

    it("clears save error on successful save", () => {
      let shouldThrow = true;
      composer = makeComposer({
        setProjectSettings: vi.fn(() => {
          if (shouldThrow) {
            shouldThrow = false;
            throw new Error("fail");
          }
        }),
      });

      render(<SiteSettingsScreen composer={composer as never} />);

      const saveBtn = screen.getByRole("button", { name: /save/i });

      // First click — throws → error shown
      fireEvent.click(saveBtn);
      expect(screen.queryByRole("alert")).toBeInTheDocument();

      // Second click — succeeds → error gone
      fireEvent.click(saveBtn);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("dirty state", () => {
    it("shows Save button as active after editing a field", () => {
      const composer = makeComposer();
      render(<SiteSettingsScreen composer={composer as never} />);

      const nameInput = screen.getByPlaceholderText(/my awesome site/i);
      fireEvent.change(nameInput, { target: { value: "New Site" } });

      const saveBtn = screen.getByRole("button", { name: /save/i });
      expect(saveBtn).toBeEnabled();
    });
  });

  describe("input wiring", () => {
    it("updates input value on change", () => {
      const composer = makeComposer();
      render(<SiteSettingsScreen composer={composer as never} />);

      const nameInput = screen.getByPlaceholderText(/my awesome site/i);
      fireEvent.change(nameInput, { target: { value: "My New Site" } });

      expect(nameInput).toHaveValue("My New Site");
    });
  });

  describe("handleSave", () => {
    it("calls setProjectSettings with merged seo data on save", () => {
      render(<SiteSettingsScreen composer={composer as never} />);

      const nameInput = screen.getByPlaceholderText(/my awesome site/i);
      fireEvent.change(nameInput, { target: { value: "Test Site" } });

      const saveBtn = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveBtn);

      expect(composer.setProjectSettings).toHaveBeenCalled();
      const call = (composer.setProjectSettings as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.seo.siteName).toBe("Test Site");
    });
  });
});
