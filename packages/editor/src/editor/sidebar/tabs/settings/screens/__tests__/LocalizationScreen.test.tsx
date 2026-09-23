/**
 * LocalizationScreen tests — Clone 3397:32376 Localization: the amber strip,
 * the Default card (locale select + auto-redirect), the Locales table and
 * its pills, the two reads behind them (3397:33194 / 3397:33241), the
 * save-error banner (3397:33288), the save handler's write, the header's
 * `Add locale` and the two dialogs it opens.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within, act } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

const { api } = vi.hoisted(() => ({
  api: {
    siteDetail: {
      settings: {
        get: { query: vi.fn() },
        update: { mutate: vi.fn() },
      },
      locales: { query: vi.fn() },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => api,
}));

import { LocalizationScreen } from "../LocalizationScreen";

const getMock = api.siteDetail.settings.get.query;
const updateMock = api.siteDetail.settings.update.mutate;
const localesMock = api.siteDetail.locales.query;

const settingsRow = () => ({ defaultLocale: "en", enabledLocales: ["en", "fr", "ar"], localeAutoRedirect: true });
const summary = () => ({
  total: 6,
  locales: [
    { code: "en", path: "/", translated: 6, total: 6, status: "LIVE", pending: [] },
    { code: "fr", path: "/fr", translated: 4, total: 6, status: "PENDING", pending: ["Contact", "Privacy"] },
    { code: "ar", path: "/ar", translated: 0, total: 6, status: "NOT_STARTED", pending: ["Home", "Menu", "Contact", "About", "Reservations", "Privacy"] },
  ],
});

beforeEach(() => {
  getMock.mockReset().mockResolvedValue(settingsRow());
  updateMock.mockReset().mockResolvedValue({});
  localesMock.mockReset().mockResolvedValue(summary());
});

afterEach(() => cleanup());

interface SetupOpts {
  projectId?: string | null;
  composer?: ReturnType<typeof createMockComposer> | null;
  onDirtyChange?: (d: boolean) => void;
  registerSaveHandler?: (h: (() => Promise<void>) | null) => void;
  registerHeaderAction?: (node: React.ReactNode | null) => void;
  onLoadStateChange?: (s: "loading" | "ready" | "error") => void;
  saveError?: string | null;
}

function setup(opts: SetupOpts = {}) {
  const composer =
    opts.composer === undefined
      ? createMockComposer({ projectSettings: { seo: { language: "en", siteName: "Acme" } }, projectMetadata: { name: "Bella Cucina" } })
      : opts.composer;
  const utils = render(
    <LocalizationScreen
      composer={composer}
      projectId={opts.projectId === undefined ? "s1" : opts.projectId}
      onDirtyChange={opts.onDirtyChange}
      registerSaveHandler={opts.registerSaveHandler}
      registerHeaderAction={opts.registerHeaderAction}
      onLoadStateChange={opts.onLoadStateChange}
      saveError={opts.saveError}
    />,
  );
  return { composer, ...utils };
}

/** Holds the latest handler the screen registered — what the shell's Save runs. */
function saveHandlerSpy() {
  const box: { current: (() => Promise<void>) | null } = { current: null };
  const register = vi.fn((h: (() => Promise<void>) | null) => {
    box.current = h;
  });
  return { box, register };
}

/** Renders whatever the screen hands the header slot, the way the shell will. */
function HeaderHost(props: { render: (register: (node: React.ReactNode | null) => void) => React.ReactNode }) {
  const [node, setNode] = React.useState<React.ReactNode>(null);
  const register = React.useCallback((next: React.ReactNode | null) => setNode(next), []);
  return (
    <>
      <div data-testid="header-slot">{node}</div>
      {props.render(register)}
    </>
  );
}

const loaded = () => waitFor(() => expect(screen.getByTestId("set-card-default")).toBeInTheDocument());
const defaultSelect = () => screen.getByTestId("set-loc-default") as HTMLSelectElement;
const redirect = () => screen.getByTestId("set-loc-redirect");
const row = (code: string) => screen.getByTestId(`set-loc-row-${code}`);

describe("LocalizationScreen — the frame's strip and two cards", () => {
  it("reads both the Site row and the locales summary, then draws the strip, Default and Locales", async () => {
    setup();
    await loaded();
    expect(getMock).toHaveBeenCalledWith({ siteId: "s1" });
    expect(localesMock).toHaveBeenCalledWith({ siteId: "s1" });
    expect(screen.getByTestId("set-loc-restore")).toHaveTextContent(
      "Restoring a site version leaves this configuration unchanged.",
    );
    expect(screen.getByTestId("set-card-default")).toHaveTextContent("Default");
    expect(screen.getByTestId("set-card-locales")).toHaveTextContent("Locales");
    expect(screen.getByLabelText("Default locale")).toBe(defaultSelect());
    expect(defaultSelect().id).toBe("default-locale");
    expect(screen.getByRole("switch", { name: "Auto-redirect by browser" })).toBe(redirect());
    expect(redirect().id).toBe("locale-auto-redirect");
  });

  it("prefills the default, the enabled locales as `<Language> (<code>)` options, and the redirect", async () => {
    setup();
    await loaded();
    expect(defaultSelect().value).toBe("en");
    expect(Array.from(defaultSelect().options).map((o) => o.text)).toEqual(["English (en)", "French (fr)", "Arabic (ar)"]);
    expect(redirect()).toHaveAttribute("aria-checked", "true");
  });

  it("falls back to a single English locale, redirect off, when the row is empty", async () => {
    getMock.mockResolvedValue({});
    localesMock.mockResolvedValue({ total: 0, locales: [] });
    setup();
    await loaded();
    expect(defaultSelect().value).toBe("en");
    expect(defaultSelect().options).toHaveLength(1);
    expect(redirect()).toHaveAttribute("aria-checked", "false");
  });

  it("draws the table's four columns and one row per enabled locale — path, pages and pill", async () => {
    setup();
    await loaded();
    const table = screen.getByTestId("set-loc-table");
    expect(table.id).toBe("locales");
    expect(within(table).getAllByRole("columnheader").slice(0, 4).map((th) => th.textContent)).toEqual([
      "Locale",
      "Path",
      "Pages translated",
      "Status",
    ]);
    expect(row("en")).toHaveTextContent("English");
    expect(row("en")).toHaveTextContent("/");
    expect(screen.getByTestId("set-loc-row-pages-en")).toHaveTextContent("6 of 6");
    expect(screen.getByTestId("set-loc-row-status-en")).toHaveTextContent("Live");
    expect(row("fr")).toHaveTextContent("/fr");
    expect(screen.getByTestId("set-loc-row-pages-fr")).toHaveTextContent("4 of 6");
    expect(screen.getByTestId("set-loc-row-status-fr")).toHaveTextContent("Pending");
    expect(screen.getByTestId("set-loc-row-pages-ar")).toHaveTextContent("0 of 6");
    expect(screen.getByTestId("set-loc-row-status-ar")).toHaveTextContent("Not started");
  });

  it("tones the pills green / amber / grey", async () => {
    setup();
    await loaded();
    expect(screen.getByTestId("set-loc-row-status-en")).toHaveClass("tw:bg-[var(--bk-success-tint)]");
    expect(screen.getByTestId("set-loc-row-status-fr")).toHaveClass("tw:bg-[var(--bk-warning-tint)]");
    expect(screen.getByTestId("set-loc-row-status-ar")).toHaveClass("tw:bg-[var(--bk-bg-subtle)]");
  });

  it("shows the dashboard-only message with no projectId and reads nothing", () => {
    setup({ projectId: null });
    expect(screen.getByText(/Open this site from the dashboard to manage locales/i)).toBeInTheDocument();
    expect(getMock).not.toHaveBeenCalled();
    expect(localesMock).not.toHaveBeenCalled();
  });
});

describe("LocalizationScreen — the server states", () => {
  it("draws the loading card with the brief's eyebrow and line, and reports loading", () => {
    getMock.mockReturnValue(new Promise(() => {}));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });
    const card = screen.getByTestId("set-load-card");
    expect(card).toHaveAttribute("data-state", "loading");
    expect(screen.getByTestId("set-load-title")).toHaveTextContent("Localization");
    expect(screen.getByTestId("set-load-line")).toHaveTextContent("Default locale, enabled locales and translation progress.");
    expect(screen.getByTestId("set-load-state")).toHaveTextContent("Loading…");
    expect(onLoadStateChange).toHaveBeenCalledWith("loading");
    expect(screen.queryByTestId("set-card-default")).toBeNull();
  });

  it("a failed locales read is the load-error card with Try again, which re-runs both reads", async () => {
    localesMock.mockRejectedValueOnce(new Error("boom"));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });
    await waitFor(() => expect(screen.getByTestId("set-load-card")).toHaveAttribute("data-state", "error"));
    expect(screen.getByTestId("set-load-state")).toHaveTextContent(
      "Couldn't load your locales. Check your connection, then try again.",
    );
    expect(onLoadStateChange).toHaveBeenCalledWith("error");
    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(localesMock).toHaveBeenCalledTimes(2);
    expect(onLoadStateChange).toHaveBeenLastCalledWith("ready");
  });

  it("a failed settings read is the same load-error", async () => {
    getMock.mockRejectedValueOnce(new Error("boom"));
    setup();
    await waitFor(() => expect(screen.getByTestId("set-load-card")).toHaveAttribute("data-state", "error"));
  });

  it("draws the shell's save-error banner above the strip", async () => {
    setup({ saveError: "Localization settings were not saved. Your changes are still here. Review the values, then retry." });
    await loaded();
    const banner = screen.getByTestId("set-save-error");
    expect(banner).toHaveTextContent("Localization settings were not saved.");
    expect(banner.compareDocumentPosition(screen.getByTestId("set-loc-restore")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("LocalizationScreen — edits, dirty and the save handler", () => {
  it("registers no save handler while clean, one once something changed, and reports dirty", async () => {
    const { box, register } = saveHandlerSpy();
    const onDirtyChange = vi.fn();
    setup({ registerSaveHandler: register, onDirtyChange });
    await loaded();
    expect(box.current).toBeNull();
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    fireEvent.click(redirect());
    await waitFor(() => expect(box.current).not.toBeNull());
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });

  it("the handler writes defaultLocale, enabledLocales and localeAutoRedirect, then re-reads the table", async () => {
    const { box, register } = saveHandlerSpy();
    setup({ registerSaveHandler: register });
    await loaded();
    fireEvent.change(defaultSelect(), { target: { value: "fr" } });
    fireEvent.click(redirect());
    await waitFor(() => expect(box.current).not.toBeNull());
    await act(async () => {
      await box.current!();
    });
    expect(updateMock).toHaveBeenCalledWith({
      id: "s1",
      defaultLocale: "fr",
      enabledLocales: ["en", "fr", "ar"],
      localeAutoRedirect: false,
    });
    expect(localesMock).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(box.current).toBeNull());
  });

  it("the handler rejects when the write is refused, and the edits stay", async () => {
    updateMock.mockRejectedValueOnce(new Error("BAD_REQUEST"));
    const { box, register } = saveHandlerSpy();
    setup({ registerSaveHandler: register });
    await loaded();
    fireEvent.change(defaultSelect(), { target: { value: "ar" } });
    await waitFor(() => expect(box.current).not.toBeNull());
    await expect(box.current!()).rejects.toThrow("BAD_REQUEST");
    expect(defaultSelect().value).toBe("ar");
    expect(box.current).not.toBeNull();
  });

  it("a changed default moves the `/` path before Save", async () => {
    setup();
    await loaded();
    fireEvent.change(defaultSelect(), { target: { value: "fr" } });
    expect(row("fr")).toHaveTextContent("/");
    expect(row("en")).toHaveTextContent("/en");
  });

  it("Remove sits on non-default rows only, hides the row, and the next Save omits the code", async () => {
    const { box, register } = saveHandlerSpy();
    setup({ registerSaveHandler: register });
    await loaded();
    expect(screen.queryByTestId("set-loc-row-remove-en")).toBeNull();
    fireEvent.click(screen.getByTestId("set-loc-row-remove-ar"));
    expect(screen.queryByTestId("set-loc-row-ar")).toBeNull();
    expect(Array.from(defaultSelect().options).map((o) => o.value)).toEqual(["en", "fr"]);
    await waitFor(() => expect(box.current).not.toBeNull());
    await act(async () => {
      await box.current!();
    });
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ enabledLocales: ["en", "fr"] }));
  });

  it("Remove is disabled when only the default would remain", async () => {
    getMock.mockResolvedValue({ defaultLocale: "en", enabledLocales: ["en", "fr"] });
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-loc-row-remove-fr"));
    expect(screen.queryByTestId("set-loc-row-fr")).toBeNull();
    expect(screen.queryByTestId("set-loc-row-remove-en")).toBeNull();
  });
});

/* The exported document's language comes from the project's SEO block, which
   no screen wrote — so every head shipped `<html lang="en">` however the
   site's default locale was set, while the og:locale two lines below it told
   the truth. */
describe("LocalizationScreen — the document language follows the default locale", () => {
  it("writes the chosen locale into the project's SEO language on save, keeping the rest", async () => {
    const { box, register } = saveHandlerSpy();
    const { composer } = setup({ registerSaveHandler: register });
    await loaded();
    fireEvent.change(defaultSelect(), { target: { value: "fr" } });
    await waitFor(() => expect(box.current).not.toBeNull());
    await act(async () => {
      await box.current!();
    });
    expect(composer!.setProjectSettings).toHaveBeenCalledWith(
      expect.objectContaining({ seo: expect.objectContaining({ language: "fr", siteName: "Acme" }) }),
    );
  });

  it("leaves the composer alone when the language already matches", async () => {
    const { box, register } = saveHandlerSpy();
    const { composer } = setup({ registerSaveHandler: register });
    await loaded();
    fireEvent.click(redirect());
    await waitFor(() => expect(box.current).not.toBeNull());
    await act(async () => {
      await box.current!();
    });
    expect(updateMock).toHaveBeenCalled();
    expect(composer!.setProjectSettings).not.toHaveBeenCalled();
  });
});

describe("LocalizationScreen — the header's Add locale and the dialogs", () => {
  function setupWithHeader() {
    const composer = createMockComposer({ projectSettings: { seo: {} }, projectMetadata: { name: "Bella Cucina" } });
    render(
      <HeaderHost
        render={(register) => (
          <LocalizationScreen composer={composer} projectId="s1" registerHeaderAction={register} />
        )}
      />,
    );
  }

  it("hands the shell `Add locale` once the rows are here — not while loading", async () => {
    getMock.mockReturnValue(new Promise(() => {}));
    setupWithHeader();
    expect(screen.queryByTestId("set-loc-add")).toBeNull();
  });

  it("Add locale opens the dialog scoped to the site, listing only the locales not yet enabled", async () => {
    setupWithHeader();
    await loaded();
    const add = await screen.findByTestId("set-loc-add");
    expect(within(screen.getByTestId("header-slot")).getByTestId("set-loc-add")).toBe(add);
    expect(add).toHaveTextContent("Add locale");
    expect(add).toHaveClass("tw:h-8");
    fireEvent.click(add);
    expect(screen.getByTestId("set-loc-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("set-loc-dialog-scope")).toHaveTextContent("Bella Cucina · Localization");
    const options = Array.from((screen.getByTestId("set-loc-language") as HTMLSelectElement).options).map((o) => o.value);
    expect(options).not.toContain("en");
    expect(options).not.toContain("fr");
    expect(options).not.toContain("ar");
    expect(options).toContain("es");
  });

  it("Create locale writes at once — the enabled list plus the code, the default when asked — closes, and re-reads", async () => {
    setupWithHeader();
    await loaded();
    fireEvent.click(await screen.findByTestId("set-loc-add"));
    fireEvent.change(screen.getByTestId("set-loc-language"), { target: { value: "de" } });
    fireEvent.click(screen.getByTestId("set-loc-set-default"));
    fireEvent.click(screen.getByTestId("set-loc-create"));
    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith({
        id: "s1",
        defaultLocale: "de",
        enabledLocales: ["en", "fr", "ar", "de"],
        localeAutoRedirect: true,
      }),
    );
    await waitFor(() => expect(screen.queryByTestId("set-loc-dialog")).toBeNull());
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2));
    expect(localesMock).toHaveBeenCalledTimes(2);
  });

  it("a refused Create stays in the dialog with its error line", async () => {
    updateMock.mockRejectedValueOnce(new Error("The default locale must be in the enabled locales list."));
    setupWithHeader();
    await loaded();
    fireEvent.click(await screen.findByTestId("set-loc-add"));
    fireEvent.click(screen.getByTestId("set-loc-create"));
    expect(await screen.findByTestId("set-loc-error")).toHaveTextContent("The default locale must be in the enabled locales list.");
    expect(screen.getByTestId("set-loc-dialog")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it("a row opens the Translation checklist for that locale; Back closes it", async () => {
    setupWithHeader();
    await loaded();
    fireEvent.click(row("ar"));
    expect(screen.getByTestId("set-loc-check")).toBeInTheDocument();
    expect(screen.getByTestId("set-loc-check-title")).toHaveTextContent("Arabic · Translation checklist");
    expect(screen.getByTestId("set-loc-check-meta")).toHaveTextContent("Bella Cucina · /ar · Draft · 0 of 6 pages");
    expect(screen.getByTestId("set-loc-check-line")).toHaveTextContent(
      "Right-to-left locale. Begin with Home, then Menu, Contact, About, Reservations and Privacy.",
    );
    fireEvent.click(screen.getByTestId("set-loc-check-back"));
    expect(screen.queryByTestId("set-loc-check")).toBeNull();
  });

  it("the locale name is the row's keyboard door, and Remove does not open the checklist", async () => {
    setupWithHeader();
    await loaded();
    fireEvent.click(screen.getByTestId("set-loc-row-remove-fr"));
    expect(screen.queryByTestId("set-loc-check")).toBeNull();
    fireEvent.click(screen.getByTestId("set-loc-row-open-en"));
    expect(screen.getByTestId("set-loc-check-title")).toHaveTextContent("English · Translation checklist");
    expect(screen.getByTestId("set-loc-check-meta")).toHaveTextContent("Bella Cucina · / · Live · 6 of 6 pages");
  });
});
