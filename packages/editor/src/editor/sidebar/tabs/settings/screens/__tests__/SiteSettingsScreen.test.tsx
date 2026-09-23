/**
 * SiteSettingsScreen tests — Clone 3397:32011 General: the two cards and
 * their fields, the server read behind them (3953:26363 loading, 3953:26503
 * load-error + Try again), the save-error banner (3950:26309), dirty wiring
 * and the flush-handler contract (registerFlushHandler →
 * composer.setProjectSettings).
 *
 * The site-name / favicon / language columns reach `Site.*` through the sync
 * provider's dual-save map — covered in
 * src/services/__tests__/buildrik-sync-provider.test.ts.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor, cleanup } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import type { ProjectSettings } from "@/shared/types/project";

const { api } = vi.hoisted(() => ({
  api: {
    siteDetail: {
      settings: { get: { query: vi.fn() } },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => api,
}));

import { SiteSettingsScreen } from "../SiteSettingsScreen";

const getMock = api.siteDetail.settings.get.query;

const serverRow = () => ({
  name: "Acme Site",
  favicon: "https://acme.test/favicon.ico",
  defaultLocale: "fr",
  enabledLocales: ["en", "fr"],
  socialLinks: {
    twitter: "https://twitter.com/acme",
    facebook: "https://facebook.com/acme",
    linkedin: "https://linkedin.com/company/acme",
  },
});

const baseSettings = () => ({
  seo: {
    siteName: "Composer Name",
    favicon: "https://composer.test/favicon.ico",
    language: "de",
    twitterHandle: "@keepme",
    socialLinks: {
      twitter: "https://twitter.com/composer",
      facebook: "https://facebook.com/composer",
      linkedin: "https://linkedin.com/company/composer",
    },
  },
});

beforeEach(() => {
  getMock.mockReset().mockResolvedValue(serverRow());
});

afterEach(() => cleanup());

function setup(opts: {
  projectId?: string | null;
  onDirtyChange?: (d: boolean) => void;
  registerFlushHandler?: (h: (() => void) | null) => void;
  onLoadStateChange?: (s: "loading" | "ready" | "error") => void;
  registerRetryLoad?: (fn: (() => void) | null) => void;
  saveError?: string | null;
  settings?: Record<string, unknown>;
} = {}) {
  const composer = createMockComposer({ projectSettings: opts.settings ?? baseSettings() });
  const utils = render(
    <SiteSettingsScreen
      composer={composer}
      projectId={opts.projectId === undefined ? "s1" : opts.projectId}
      onDirtyChange={opts.onDirtyChange}
      registerFlushHandler={opts.registerFlushHandler}
      onLoadStateChange={opts.onLoadStateChange}
      registerRetryLoad={opts.registerRetryLoad}
      saveError={opts.saveError}
    />,
  );
  return { composer, ...utils };
}

const siteName = () => screen.getByLabelText("Site name") as HTMLInputElement;
const favicon = () => screen.getByLabelText("Favicon URL") as HTMLInputElement;
const language = () => screen.getByLabelText("Site Language") as HTMLSelectElement;
const twitter = () => screen.getByLabelText("Twitter") as HTMLInputElement;

const loaded = () => waitFor(() => expect(screen.getByTestId("set-card-site-identity")).toBeInTheDocument());

describe("SiteSettingsScreen — the frame's two cards, filled from the Site row", () => {
  it("draws Site identity and Social links, with the field ids the walk drives", async () => {
    setup();
    await loaded();
    expect(screen.getByTestId("set-card-site-identity")).toHaveTextContent("Site identity");
    expect(screen.getByTestId("set-card-social-links")).toHaveTextContent("Social links");
    expect(siteName().id).toBe("site-name");
    expect(favicon().id).toBe("favicon-url");
    expect(language().id).toBe("site-language");
    expect(twitter().id).toBe("social-twitter");
    expect(screen.getByLabelText("Facebook").id).toBe("social-facebook");
    expect(screen.getByLabelText("LinkedIn").id).toBe("social-linkedin");
    expect(getMock).toHaveBeenCalledWith({ siteId: "s1" });
  });

  /* The composer's copy of these columns is as old as the editor session; the
     frame wants the row as it is when the screen opens. Server values win. */
  it("prefills from the server row, not the composer's stale copy", async () => {
    setup();
    await loaded();
    expect(siteName().value).toBe("Acme Site");
    expect(favicon().value).toBe("https://acme.test/favicon.ico");
    expect(language().value).toBe("fr");
    expect(twitter().value).toBe("https://twitter.com/acme");
    expect((screen.getByLabelText("Facebook") as HTMLInputElement).value).toBe("https://facebook.com/acme");
    expect((screen.getByLabelText("LinkedIn") as HTMLInputElement).value).toBe("https://linkedin.com/company/acme");
  });

  it("labels the language options `<Language> (<code>)`, the frame's shape", async () => {
    setup();
    await loaded();
    const options = Array.from(language().querySelectorAll("option")).map((o) => o.textContent);
    expect(options).toContain("English (en)");
    expect(options).toContain("French (fr)");
  });

  /* A row whose locale the list does not carry must keep it — otherwise the
     select falls to the first option and the next Save changes the language. */
  it("keeps a locale the product's list does not carry", async () => {
    getMock.mockResolvedValue({ ...serverRow(), defaultLocale: "en-US" });
    setup();
    await loaded();
    expect(language().value).toBe("en-US");
    expect(screen.getByRole("option", { name: "EN-US (en-US)" })).toBeInTheDocument();
  });

  it("reads a Json socialLinks column defensively — non-string values are empty fields", async () => {
    getMock.mockResolvedValue({ ...serverRow(), socialLinks: { twitter: 42 } });
    setup();
    await loaded();
    expect(twitter().value).toBe("");
  });

  /* No Site row to read: the standalone demo. The composer's values stand and
     nothing is requested. */
  it("without a projectId shows the composer's values at once and makes no request", () => {
    const onLoadStateChange = vi.fn();
    setup({ projectId: null, onLoadStateChange });
    expect(siteName().value).toBe("Composer Name");
    expect(language().value).toBe("de");
    expect(getMock).not.toHaveBeenCalled();
    expect(onLoadStateChange).toHaveBeenLastCalledWith("ready");
  });
});

describe("SiteSettingsScreen — loading and load-error (3953:26363 / 3953:26503)", () => {
  it("shows the SITE IDENTITY load card while the row is on its way, and tells the shell", async () => {
    let resolve!: (row: unknown) => void;
    getMock.mockReturnValue(new Promise((r) => { resolve = r; }));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });

    expect(screen.getByTestId("set-load-card")).toBeInTheDocument();
    expect(screen.getByTestId("set-load-title")).toHaveTextContent("Site identity");
    expect(screen.getByTestId("set-load-card")).toHaveTextContent("Site name, favicon, language and social profiles.");
    expect(screen.getByTestId("set-load-state")).toHaveTextContent("Loading…");
    expect(screen.queryByTestId("set-load-retry")).toBeNull();
    expect(onLoadStateChange).toHaveBeenLastCalledWith("loading");

    await act(async () => { resolve(serverRow()); });
    await loaded();
    expect(onLoadStateChange).toHaveBeenLastCalledWith("ready");
  });

  it("shows the error line + Try again when the read fails, and Try again re-reads", async () => {
    getMock.mockRejectedValueOnce(new Error("network"));
    const onLoadStateChange = vi.fn();
    const registerRetryLoad = vi.fn();
    setup({ onLoadStateChange, registerRetryLoad });

    await waitFor(() => expect(screen.getByTestId("set-load-retry")).toBeInTheDocument());
    expect(screen.getByTestId("set-load-state")).toHaveTextContent(
      "Couldn't load your site settings. Check your connection, then try again.",
    );
    expect(onLoadStateChange).toHaveBeenLastCalledWith("error");
    // The shell holds the same retry the card's button calls.
    expect(registerRetryLoad).toHaveBeenCalledWith(expect.any(Function));

    getMock.mockResolvedValueOnce(serverRow());
    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(siteName().value).toBe("Acme Site");
    expect(onLoadStateChange).toHaveBeenLastCalledWith("ready");
  });

  it("clears the registered retry on unmount", async () => {
    const registerRetryLoad = vi.fn();
    const { unmount } = setup({ registerRetryLoad });
    await loaded();
    unmount();
    expect(registerRetryLoad).toHaveBeenLastCalledWith(null);
  });
});

describe("SiteSettingsScreen — save-error banner (3950:26309)", () => {
  it("renders the shell's saveError above the cards, fields untouched", async () => {
    setup({ saveError: "Site settings were not saved. Your changes are still here. Review the values, then retry." });
    await loaded();
    expect(screen.getByTestId("set-save-error")).toHaveTextContent(/were not saved/);
    expect(screen.getByRole("alert")).toBe(screen.getByTestId("set-save-error"));
    expect(siteName().value).toBe("Acme Site");
  });

  it("renders no banner when there is no save error", async () => {
    setup();
    await loaded();
    expect(screen.queryByTestId("set-save-error")).toBeNull();
  });
});

/* `Site.name` is `z.string().min(2).max(100)` on the server. Said under the
   field before Save has to say it in a banner. */
describe("SiteSettingsScreen — the site name says what the server will accept", () => {
  it("flags a one-character name inline and marks the input invalid", async () => {
    setup();
    await loaded();
    fireEvent.change(siteName(), { target: { value: "A" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 2 characters/i);
    expect(siteName()).toHaveAttribute("aria-invalid", "true");
  });

  it("flags an emptied name — the column cannot be cleared", async () => {
    setup();
    await loaded();
    fireEvent.change(siteName(), { target: { value: "" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/give the site a name/i);
  });

  it("accepts a normal name", async () => {
    setup();
    await loaded();
    fireEvent.change(siteName(), { target: { value: "Renamed Site" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  /* `Site.defaultLocale ∈ Site.enabledLocales` is a server invariant
     (`DEFAULT_LOCALE_NOT_ENABLED` refuses the whole mirror). The select
     offers every locale the product knows; picking one the site has not
     enabled is warned about here, not discovered in a banner. */
  it("warns when the picked language is not one of the site's enabled locales", async () => {
    setup();
    await loaded();
    fireEvent.change(language(), { target: { value: "de" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/German is not enabled for this site yet/);
    expect(language()).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(language(), { target: { value: "en" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("checks nothing against enabled locales without a Site row", () => {
    setup({ projectId: null });
    fireEvent.change(language(), { target: { value: "ja" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("SiteSettingsScreen — edit behavior + markDirty wiring", () => {
  it("starts clean: onDirtyChange fires with false on mount", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    await loaded();
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("editing Site name updates the input and marks the screen dirty (identity section)", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    await loaded();
    fireEvent.change(siteName(), { target: { value: "Renamed Site" } });
    expect(siteName().value).toBe("Renamed Site");
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
  });

  it("changing the language select marks dirty", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    await loaded();
    fireEvent.change(language(), { target: { value: "de" } });
    expect(language().value).toBe("de");
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
  });

  it("editing a social link marks dirty via the social section's markDirty", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    await loaded();
    fireEvent.change(twitter(), { target: { value: "https://twitter.com/renamed" } });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
  });

  it("does NOT write to composer per keystroke — edits stay in the local buffer", async () => {
    const { composer } = setup();
    await loaded();
    fireEvent.change(siteName(), { target: { value: "Typed But Not Flushed" } });
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
  });

  it("resyncs displayed values when composer settings change externally (SETTINGS_CHANGE)", async () => {
    const { composer } = setup();
    await loaded();
    act(() => {
      composer.setProjectSettings({
        seo: { ...baseSettings().seo, siteName: "External Rename" },
      } as Partial<ProjectSettings>);
    });
    await waitFor(() => expect(siteName().value).toBe("External Rename"));
  });
});

describe("SiteSettingsScreen — flush handler contract", () => {
  it("registers a flush handler on mount and clears it on unmount", async () => {
    const registerFlushHandler = vi.fn();
    const { unmount } = setup({ registerFlushHandler });
    await loaded();
    expect(registerFlushHandler).toHaveBeenCalledWith(expect.any(Function));
    unmount();
    expect(registerFlushHandler).toHaveBeenLastCalledWith(null);
  });

  it("flush pushes the typed identity + social values into composer.setProjectSettings, preserving sibling seo keys", async () => {
    let flush: (() => void) | null = null;
    const registerFlushHandler = vi.fn((h: (() => void) | null) => {
      flush = h;
    });
    const { composer } = setup({ registerFlushHandler });
    await loaded();

    fireEvent.change(siteName(), { target: { value: "Flushed Name" } });
    fireEvent.change(twitter(), { target: { value: "https://twitter.com/flushed" } });

    expect(flush).toBeTypeOf("function");
    act(() => flush!());

    expect(composer.setProjectSettings).toHaveBeenCalledTimes(1);
    const settings = composer.getProjectSettings() as ReturnType<typeof baseSettings>;
    expect(settings.seo.siteName).toBe("Flushed Name");
    expect(settings.seo.socialLinks.twitter).toBe("https://twitter.com/flushed");
    // Untouched fields carry the SERVER's values into the composer — that is
    // the copy the dual-save map then sends back to Site.*.
    expect(settings.seo.favicon).toBe("https://acme.test/favicon.ico");
    expect(settings.seo.language).toBe("fr");
    expect(settings.seo.socialLinks.facebook).toBe("https://facebook.com/acme");
    // Sibling seo key owned by SeoScreen is preserved (spread of current.seo).
    expect(settings.seo.twitterHandle).toBe("@keepme");
  });

  /* Board 1172:4867's Project settings modal is superseded by this screen;
     its Author and Canvas grid live here and reach the engine on the flush. */
  it("flush writes Author to the project metadata and the Canvas grid to the engine", async () => {
    let flush: (() => void) | null = null;
    const registerFlushHandler = vi.fn((h: (() => void) | null) => {
      flush = h;
    });
    const { composer } = setup({ registerFlushHandler });
    await loaded();
    fireEvent.change(screen.getByLabelText("Author"), { target: { value: "Bella Cucina team" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Grid size/ }), { target: { value: "8" } });
    act(() => flush!());
    expect(composer.updateProjectMetadata).toHaveBeenCalledWith(expect.objectContaining({ author: "Bella Cucina team" }));
    expect(composer.setGridSize).toHaveBeenCalledWith(8);
    // G2-034: snapping follows the canvas Grid toggle — no switch here.
    expect(screen.queryByRole("switch", { name: "Snap to grid" })).toBeNull();
    expect(composer.setSnapToGrid).not.toHaveBeenCalled();
  });
});
