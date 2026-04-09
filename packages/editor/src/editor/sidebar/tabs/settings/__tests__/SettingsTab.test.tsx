/**
 * Settings Tab Tests — pencil screens 17-28
 * Covers: dirty dot indicator, save error state, sett-save-error class
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { SiteSettingsScreen } from "../screens/SiteSettingsScreen";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeComposer(overrides?: Partial<ReturnType<typeof buildMockComposer>>) {
  return { ...buildMockComposer(), ...overrides };
}

function buildMockComposer() {
  return {
    getProjectSettings: vi.fn(() => ({ seo: {} })),
    setProjectSettings: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
}

// ── SiteSettingsScreen save error state ──────────────────────────────────────

describe("SiteSettingsScreen save error state", () => {
  it("shows sett-save-error when setProjectSettings throws", () => {
    const composer = makeComposer({
      setProjectSettings: vi.fn(() => {
        throw new Error("Network error");
      }),
    });

    render(
      <SiteSettingsScreen
        composer={composer as never}
        onDirtyChange={vi.fn()}
      />
    );

    // Trigger save by clicking the Save button
    const saveBtn = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveBtn);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/failed to save settings/i)).toBeInTheDocument();
  });

  it("applies sett-save-error class to error container", () => {
    const composer = makeComposer({
      setProjectSettings: vi.fn(() => {
        throw new Error("oops");
      }),
    });

    const { container } = render(
      <SiteSettingsScreen
        composer={composer as never}
        onDirtyChange={vi.fn()}
      />
    );

    const saveBtn = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveBtn);

    expect(container.querySelector(".sett-save-error")).toBeTruthy();
  });

  it("does not show sett-save-error before save attempt", () => {
    const composer = makeComposer();
    const { container } = render(
      <SiteSettingsScreen
        composer={composer as never}
        onDirtyChange={vi.fn()}
      />
    );
    expect(container.querySelector(".sett-save-error")).toBeFalsy();
  });

  it("clears save error on successful save", () => {
    const setProjectSettings = vi.fn()
      .mockImplementationOnce(() => { throw new Error("fail"); })
      .mockImplementationOnce(() => undefined);

    const composer = makeComposer({ setProjectSettings });

    render(
      <SiteSettingsScreen
        composer={composer as never}
        onDirtyChange={vi.fn()}
      />
    );

    const saveBtn = screen.getByRole("button", { name: /save/i });

    // First click — throws → error shown
    fireEvent.click(saveBtn);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Second click — succeeds → error gone
    fireEvent.click(saveBtn);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls onDirtyChange(true) when a field is edited", () => {
    const onDirtyChange = vi.fn();
    const composer = makeComposer();

    render(
      <SiteSettingsScreen
        composer={composer as never}
        onDirtyChange={onDirtyChange}
      />
    );

    const nameInput = screen.getByPlaceholderText(/my awesome site/i);
    fireEvent.change(nameInput, { target: { value: "New Site" } });

    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });

  it("calls onDirtyChange(false) after a successful save", () => {
    const onDirtyChange = vi.fn();
    const composer = makeComposer();

    render(
      <SiteSettingsScreen
        composer={composer as never}
        onDirtyChange={onDirtyChange}
      />
    );

    // Edit a field to make it dirty
    const nameInput = screen.getByPlaceholderText(/my awesome site/i);
    fireEvent.change(nameInput, { target: { value: "New Site" } });

    // Save
    const saveBtn = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveBtn);

    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });
});
