/**
 * Settings Tab Tests — pencil screens 17-28
 * Covers: dirty dot indicator, save error state, sett-save-error class
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { DomainsScreen } from "../screens/DomainsScreen";
import { IntegrationsScreen } from "../screens/IntegrationsScreen";
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

describe("DomainsScreen", () => {
  it("saves normalized custom domain into publishing settings", () => {
    const composer = makeComposer({
      getProjectSettings: vi.fn(() => ({
        seo: {},
        publishing: {
          provider: "netlify",
        },
      })),
    });

    render(<DomainsScreen composer={composer as never} onDirtyChange={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/www.example.com/i), {
      target: { value: "HTTPS://WWW.Example.com/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /connect domain/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(composer.setProjectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        publishing: expect.objectContaining({
          provider: "netlify",
          customDomain: expect.objectContaining({
            hostname: "www.example.com",
            status: "pending",
          }),
        }),
      })
    );
  });
});

describe("IntegrationsScreen", () => {
  it("saves stripe and email integration settings", () => {
    const composer = makeComposer({
      getProjectSettings: vi.fn(() => ({
        seo: {},
        integrations: {},
      })),
    });

    render(<IntegrationsScreen composer={composer as never} onDirtyChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("switch", { name: /enable stripe/i }));
    fireEvent.change(screen.getByLabelText(/stripe publishable key/i), {
      target: { value: "pk_test_123" },
    });

    fireEvent.change(screen.getByLabelText(/email provider/i), {
      target: { value: "mailchimp" },
    });
    fireEvent.change(screen.getByLabelText(/email api key/i), {
      target: { value: "api-key-123" },
    });
    fireEvent.change(screen.getByLabelText(/audience or list id/i), {
      target: { value: "list_123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(composer.setProjectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        integrations: expect.objectContaining({
          stripe: expect.objectContaining({
            enabled: true,
            publishableKey: "pk_test_123",
          }),
          email: expect.objectContaining({
            enabled: true,
            provider: "mailchimp",
            apiKey: "api-key-123",
            listId: "list_123",
          }),
        }),
      })
    );
  });
});
