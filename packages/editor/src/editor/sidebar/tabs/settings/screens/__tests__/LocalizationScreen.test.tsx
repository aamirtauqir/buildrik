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

function makeComposer(seo: Record<string, unknown> = {}) {
  let settings: Record<string, unknown> = { seo };
  return {
    getProjectSettings: () => settings,
    setProjectSettings: vi.fn((next: Record<string, unknown>) => {
      settings = next;
    }),
    get settings() {
      return settings;
    },
  };
}

function setup(props: { projectId?: string | null; composer?: unknown } = {}) {
  return render(
    <LocalizationScreen
      composer={props.composer as never}
      projectId={props.projectId === undefined ? "s1" : props.projectId}
    />
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

/* The exported document's language comes from the project's SEO block, which
   no screen wrote — so all three heads shipped `<html lang="en">` however the
   site's default locale was set, while the og:locale two lines below it told
   the truth. Walked live: Settings › Localization → French → Save, and the
   preview head reads `<html lang="fr">`. */
describe("LocalizationScreen — the document language follows the default locale", () => {
  it("writes the chosen locale into the project's SEO language on save", async () => {
    getMock.mockResolvedValue({ defaultLocale: "en", enabledLocales: ["en", "fr"] });
    const composer = makeComposer({ language: "en", siteName: "Acme" });
    setup({ composer });
    await screen.findByText(/Enabled locales \(2\)/);

    const defaultSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    fireEvent.change(defaultSelect, { target: { value: "fr" } });
    fireEvent.click(screen.getByRole("button", { name: /save locales/i }));

    await waitFor(() =>
      expect(composer.setProjectSettings).toHaveBeenCalledWith(
        expect.objectContaining({ seo: expect.objectContaining({ language: "fr" }) })
      )
    );
    // the rest of the SEO block survives the write
    expect(composer.setProjectSettings).toHaveBeenCalledWith(
      expect.objectContaining({ seo: expect.objectContaining({ siteName: "Acme" }) })
    );
  });

  it("leaves the composer alone when the language already matches", async () => {
    getMock.mockResolvedValue({ defaultLocale: "en", enabledLocales: ["en", "fr"] });
    const composer = makeComposer({ language: "en" });
    setup({ composer });
    await screen.findByText(/Enabled locales \(2\)/);

    fireEvent.click(within(localeRow("fr")).getByRole("button", { name: /remove/i }));
    fireEvent.click(screen.getByRole("button", { name: /save locales/i }));

    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
  });
});
