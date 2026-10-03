/**
 * LocalizationScreen — Phase B Languages: 8135:214023 (default) and
 * 8135:214262 (remove-locale confirm). Default locale is a footer field;
 * Add / Remove write the enabled list at once (SA-16) and never carry the
 * staged default; Remove asks first only when translations exist (Q-B6);
 * SA-05's auto-redirect value is never sent.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

const { api } = vi.hoisted(() => ({
  api: {
    siteDetail: {
      settings: { get: { query: vi.fn() }, update: { mutate: vi.fn() } },
      locales: { query: vi.fn() },
    },
  },
}));

vi.mock("@/services/api-client", () => ({ getBuildrikClient: () => api }));
vi.mock("@/services/BuildrikSyncProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/BuildrikSyncProvider")>()),
  updateSiteColumns: (id: string, patch: Record<string, unknown>) => api.siteDetail.settings.update.mutate({ id, ...patch }),
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

function setup(opts: { projectId?: string | null; saveError?: string | null; readOnly?: boolean } = {}) {
  const composer = Object.assign(
    createMockComposer({ projectSettings: { seo: { language: "en", siteName: "Acme" } }, projectMetadata: { name: "Bella Cucina" } }),
    { adoptSavedProjectSettings: vi.fn() },
  );
  const props = { onDirtyChange: vi.fn(), registerSaveHandler: vi.fn(), onLoadStateChange: vi.fn() };
  render(
    <LocalizationScreen
      composer={composer}
      projectId={opts.projectId === undefined ? "s1" : opts.projectId}
      saveError={opts.saveError}
      readOnly={opts.readOnly}
      {...props}
    />,
  );
  return { composer, props };
}

const loaded = () => waitFor(() => expect(screen.getByTestId("set-loc-table")).toBeInTheDocument());
const lastSave = (fn: { mock: { calls: unknown[][] } }) => fn.mock.calls[fn.mock.calls.length - 1]?.[0] as (() => Promise<void>) | null;

describe("Languages · 8135:214023", () => {
  it("draws Default locale and Locales: Saves immediately, Add locale, LOCALE · TRANSLATED PAGES rows", async () => {
    setup();
    await loaded();
    expect(getMock).toHaveBeenCalledWith({ siteId: "s1" });
    expect(localesMock).toHaveBeenCalledWith({ siteId: "s1" });
    expect(screen.getByTestId("set-card-title-default-locale")).toHaveTextContent("Default locale");
    expect(screen.getByText("Save the default locale with Save below.")).toBeInTheDocument();
    expect(screen.getByTestId("set-card-title-locales")).toHaveTextContent("Locales");
    expect(screen.getByText("Saves immediately")).toBeInTheDocument();
    expect(screen.getByTestId("set-loc-add")).toHaveTextContent("Add locale");
    expect(screen.getByText("Locale")).toBeInTheDocument();
    expect(screen.getByText("Translated pages")).toBeInTheDocument();
    expect(screen.getByTestId("set-loc-row-open-fr")).toHaveTextContent("French (fr)");
    expect(screen.getByTestId("set-loc-row-pages-fr")).toHaveTextContent("4 of 6");
    expect(screen.getByTestId("set-loc-row-default-en")).toHaveTextContent("Default");
    expect(screen.queryByTestId("set-loc-row-remove-en")).toBeNull();
    expect(screen.getByTestId("set-loc-row-remove-fr")).toHaveTextContent("Remove");
    expect(screen.queryByText(/Auto-redirect/i)).toBeNull();
    expect(screen.queryByTestId("set-loc-restore")).toBeNull();
  });

  it("the default select lists the enabled locales as `<Language> (<code>)`", async () => {
    setup();
    await loaded();
    const options = Array.from((screen.getByTestId("set-loc-default") as HTMLSelectElement).options).map((o) => o.textContent);
    expect(options).toEqual(["English (en)", "French (fr)", "Arabic (ar)"]);
  });

  it("shows the dashboard-only message with no projectId and reads nothing", () => {
    setup({ projectId: null });
    expect(screen.getByText("Open this site from the dashboard to manage locales.")).toBeInTheDocument();
    expect(getMock).not.toHaveBeenCalled();
  });

  it("a failed read is the load-error card with Try again", async () => {
    localesMock.mockRejectedValueOnce(new Error("network"));
    setup();
    await waitFor(() => expect(screen.getByTestId("set-load-retry")).toBeInTheDocument());
    expect(screen.getByTestId("set-load-title")).toHaveTextContent("Languages");
    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
  });

  it("says per-language pages publish later in one muted line, not a strip (owner, 2026-10-04)", async () => {
    setup();
    await loaded();
    const note = screen.getByTestId("set-loc-publish-note");
    expect(note.tagName).toBe("P");
    expect(note).toHaveTextContent("Per-language pages publish in a later release.");
    expect(note.className).toContain("tw:text-[var(--bk-ink-muted)]");
    expect(note.className).not.toMatch(/tw:bg-|tw:border/);
  });

  it("read-only draws Add locale and Remove disabled (writes stay in view)", async () => {
    setup({ readOnly: true });
    await loaded();
    expect((screen.getByTestId("set-loc-add") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("set-loc-row-remove-fr") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Languages — the default locale is a footer field", () => {
  it("picking one stages it: dirty, and Save writes only defaultLocale, then adopts seo.language as saved", async () => {
    const { composer, props } = setup();
    await loaded();
    expect(lastSave(props.registerSaveHandler)).toBeNull();
    fireEvent.change(screen.getByTestId("set-loc-default"), { target: { value: "fr" } });
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(true);
    const save = lastSave(props.registerSaveHandler)!;
    await act(async () => { await save(); });
    expect(updateMock).toHaveBeenCalledWith({ id: "s1", defaultLocale: "fr" });
    expect(composer.adoptSavedProjectSettings).toHaveBeenCalledWith(expect.objectContaining({ seo: expect.objectContaining({ language: "fr" }) }));
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("a refused Save rejects and keeps the staged value", async () => {
    updateMock.mockRejectedValueOnce(new Error("nope"));
    const { props } = setup();
    await loaded();
    fireEvent.change(screen.getByTestId("set-loc-default"), { target: { value: "ar" } });
    await expect(lastSave(props.registerSaveHandler)!()).rejects.toThrow("nope");
    expect((screen.getByTestId("set-loc-default") as HTMLSelectElement).value).toBe("ar");
  });
});

describe("Languages — locales save immediately", () => {
  it("Remove of a locale with no translations writes the list at once, without the staged default", async () => {
    setup();
    await loaded();
    fireEvent.change(screen.getByTestId("set-loc-default"), { target: { value: "fr" } });
    fireEvent.click(screen.getByTestId("set-loc-row-remove-ar"));
    await waitFor(() => expect(updateMock).toHaveBeenCalledWith({ id: "s1", enabledLocales: ["en", "fr"] }));
    expect(screen.queryByTestId("set-loc-remove-confirm")).toBeNull();
    await waitFor(() => expect(screen.queryByTestId("set-loc-row-ar")).toBeNull());
    expect(localesMock).toHaveBeenCalledTimes(2);
  });

  it("8135:214262: a locale with translations asks first, says they are kept, and Cancel writes nothing", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-loc-row-remove-fr"));
    expect(screen.getByTestId("set-loc-remove-title")).toHaveTextContent("Remove French?");
    expect(screen.getByTestId("set-loc-remove-body")).toHaveTextContent(
      "4 of 6 pages have French translations. They are kept and come back if you add French again.",
    );
    expect(screen.getByTestId("set-loc-remove-ok")).toHaveTextContent("Remove French");
    fireEvent.click(screen.getByTestId("set-loc-remove-cancel"));
    expect(updateMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("set-loc-row-remove-fr"));
    fireEvent.click(screen.getByTestId("set-loc-remove-ok"));
    await waitFor(() => expect(updateMock).toHaveBeenCalledWith({ id: "s1", enabledLocales: ["en", "ar"] }));
  });

  it("removing the staged default puts the select back on the saved one", async () => {
    setup();
    await loaded();
    fireEvent.change(screen.getByTestId("set-loc-default"), { target: { value: "ar" } });
    fireEvent.click(screen.getByTestId("set-loc-row-remove-ar"));
    await waitFor(() => expect((screen.getByTestId("set-loc-default") as HTMLSelectElement).value).toBe("en"));
  });

  it("a refused Remove says so on the card", async () => {
    updateMock.mockRejectedValueOnce(new Error("Server said no"));
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-loc-row-remove-ar"));
    expect(await screen.findByTestId("set-loc-action-error")).toHaveTextContent("Arabic was not removed: Server said no");
    expect(screen.getByTestId("set-loc-row-ar")).toBeInTheDocument();
  });

  it("Add locale writes at once — the list plus the code, the default only when asked — and closes", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-loc-add"));
    expect(screen.getByTestId("set-loc-dialog-scope")).toHaveTextContent("Bella Cucina · Languages");
    fireEvent.change(screen.getByTestId("set-loc-language"), { target: { value: "de" } });
    fireEvent.click(screen.getByTestId("set-loc-create"));
    await waitFor(() => expect(updateMock).toHaveBeenCalledWith({ id: "s1", enabledLocales: ["en", "fr", "ar", "de"] }));
    await waitFor(() => expect(screen.queryByTestId("set-loc-dialog")).toBeNull());

    fireEvent.click(screen.getByTestId("set-loc-add"));
    fireEvent.change(screen.getByTestId("set-loc-language"), { target: { value: "es" } });
    fireEvent.click(screen.getByTestId("set-loc-set-default"));
    fireEvent.click(screen.getByTestId("set-loc-create"));
    await waitFor(() =>
      expect(updateMock).toHaveBeenLastCalledWith({ id: "s1", enabledLocales: ["en", "fr", "ar", "de", "es"], defaultLocale: "es" }),
    );
  });

  it("a refused Create stays in the dialog with its error line", async () => {
    updateMock.mockRejectedValueOnce(new Error("The default locale must be in the enabled locales list."));
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-loc-add"));
    fireEvent.click(screen.getByTestId("set-loc-create"));
    expect(await screen.findByTestId("set-loc-error")).toHaveTextContent("The default locale must be in the enabled locales list.");
  });

  it("a locale's name opens its Translation checklist", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-loc-row-open-ar"));
    expect(screen.getByTestId("set-loc-check-title")).toHaveTextContent("Arabic · Translation checklist");
    fireEvent.click(screen.getByTestId("set-loc-check-back"));
    expect(screen.queryByTestId("set-loc-check")).toBeNull();
  });
});
