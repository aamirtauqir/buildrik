/**
 * LocalizationScreen tests — load, add/remove locale guards, default change, save.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import * as React from "react";

const { api } = vi.hoisted(() => ({
  api: {
    siteDetail: {
      settings: {
        get: { query: vi.fn() },
        update: { mutate: vi.fn() },
      },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  createBuildrikApiClient: () => api,
}));

import { LocalizationScreen } from "../LocalizationScreen";

const getMock = api.siteDetail.settings.get.query;
const updateMock = api.siteDetail.settings.update.mutate;

beforeEach(() => {
  getMock.mockReset().mockResolvedValue({});
  updateMock.mockReset().mockResolvedValue({});
});

afterEach(() => cleanup());

function setup(props: { projectId?: string | null } = {}) {
  return render(
    <LocalizationScreen projectId={props.projectId === undefined ? "s1" : props.projectId} />
  );
}

// The enabled-locales list <li> rows; each has a Remove button.
function localeRow(code: string) {
  const chip = screen.getAllByText(code, { selector: "span" })[0];
  return chip.closest("li") as HTMLElement;
}

describe("LocalizationScreen — gating + loading", () => {
  it("shows the dashboard-only message with no projectId", () => {
    setup({ projectId: null });
    expect(screen.getByText(/Open this site from the dashboard to manage locales/i)).toBeInTheDocument();
    expect(getMock).not.toHaveBeenCalled();
  });

  it("prefills default + enabled locales from settings", async () => {
    getMock.mockResolvedValue({ defaultLocale: "fr", enabledLocales: ["fr", "de"] });
    setup();
    expect(await screen.findByText(/Enabled locales \(2\)/)).toBeInTheDocument();
    // The default badge sits in the fr row.
    expect(within(localeRow("fr")).getByText(/Default/i)).toBeInTheDocument();
  });

  it("defaults to a single 'en' locale when settings are empty", async () => {
    setup();
    expect(await screen.findByText(/Enabled locales \(1\)/)).toBeInTheDocument();
    expect(within(localeRow("en")).getByText(/Default/i)).toBeInTheDocument();
  });
});

describe("LocalizationScreen — add / remove guards", () => {
  it("adds a chosen locale and grows the enabled list", async () => {
    setup();
    await screen.findByText(/Enabled locales \(1\)/);
    // The 'Add locale' select is the last combobox (default select is first).
    const combos = screen.getAllByRole("combobox");
    fireEvent.change(combos[combos.length - 1], { target: { value: "fr" } });
    fireEvent.click(screen.getByRole("button", { name: /^Add$/ }));
    expect(await screen.findByText(/Enabled locales \(2\)/)).toBeInTheDocument();
    expect(within(localeRow("fr")).getByText("French")).toBeInTheDocument();
  });

  it("disables Remove on the default locale (guard: cannot remove default)", async () => {
    getMock.mockResolvedValue({ defaultLocale: "en", enabledLocales: ["en", "fr"] });
    setup();
    await screen.findByText(/Enabled locales \(2\)/);
    const enRemove = within(localeRow("en")).getByRole("button", { name: /remove/i });
    expect(enRemove).toBeDisabled();
  });

  it("removes a non-default locale", async () => {
    getMock.mockResolvedValue({ defaultLocale: "en", enabledLocales: ["en", "fr"] });
    setup();
    await screen.findByText(/Enabled locales \(2\)/);
    fireEvent.click(within(localeRow("fr")).getByRole("button", { name: /remove/i }));
    expect(await screen.findByText(/Enabled locales \(1\)/)).toBeInTheDocument();
    expect(screen.queryByText("French")).toBeNull();
  });

  it("disables Remove when only one (default) locale remains (guard: keep >=1)", async () => {
    setup();
    await screen.findByText(/Enabled locales \(1\)/);
    const enRemove = within(localeRow("en")).getByRole("button", { name: /remove/i });
    expect(enRemove).toBeDisabled();
  });
});

describe("LocalizationScreen — default change + save", () => {
  it("changes the default locale via the select", async () => {
    getMock.mockResolvedValue({ defaultLocale: "en", enabledLocales: ["en", "fr"] });
    setup();
    await screen.findByText(/Enabled locales \(2\)/);
    const defaultSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    fireEvent.change(defaultSelect, { target: { value: "fr" } });
    // The default badge now moves to the fr row.
    expect(within(localeRow("fr")).getByText(/Default/i)).toBeInTheDocument();
  });

  it("saves defaultLocale + enabledLocales after an edit", async () => {
    getMock.mockResolvedValue({ defaultLocale: "en", enabledLocales: ["en", "fr"] });
    setup();
    await screen.findByText(/Enabled locales \(2\)/);
    fireEvent.click(within(localeRow("fr")).getByRole("button", { name: /remove/i }));
    fireEvent.click(screen.getByRole("button", { name: /save locales/i }));
    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith({
        id: "s1",
        defaultLocale: "en",
        enabledLocales: ["en"],
      })
    );
  });

  it("Save stays disabled until something is dirty", async () => {
    setup();
    await screen.findByText(/Enabled locales \(1\)/);
    expect(screen.getByRole("button", { name: /save locales/i })).toBeDisabled();
  });
});
