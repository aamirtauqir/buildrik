/**
 * SiteSettingsScreen — Phase B General: 8135:212718 (default), 8135:212966
 * (Advanced open), 8135:213477 (slug format), 8135:213221 (slug taken),
 * 8135:213733 (slug confirm). The Site row fills the card, the flush returns
 * the settings the shell saves, a slug change saves through the screen's own
 * handler after the confirm, and the icons upload through `upload.presign`.
 *
 * The visual half is the live walk beside the boards.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor, cleanup } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import type { ProjectSettings } from "@/shared/types/project";
import { EVENTS } from "@/shared/constants/events";

const { api, sync } = vi.hoisted(() => ({
  api: {
    siteDetail: { settings: { get: { query: vi.fn() } } },
    upload: { presign: { mutate: vi.fn() }, confirm: { mutate: vi.fn() } },
  },
  sync: { saveSiteSettings: vi.fn() },
}));

vi.mock("@/services/api-client", () => ({ getBuildrikClient: () => api }));
vi.mock("@/services/BuildrikSyncProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/BuildrikSyncProvider")>()),
  saveSiteSettings: sync.saveSiteSettings,
}));

import { SiteSettingsScreen, SLUG_FORMAT_ERROR, SLUG_TAKEN_ERROR } from "../SiteSettingsScreen";
import { SiteColumnsLockedContext } from "../../shared";
import { SettingsSaveCancelled, SettingsSaveError } from "@/services/BuildrikSyncProvider";

const getMock = api.siteDetail.settings.get.query;

const serverRow = () => ({
  name: "Acme Site",
  slug: "acme-site",
  favicon: "https://acme.test/favicon.ico",
  touchIcon: null,
  defaultLocale: "fr",
});

const baseSettings = () => ({
  seo: { siteName: "Composer Name", favicon: "https://composer.test/favicon.ico", language: "de", twitterHandle: "@keepme", author: "Ada" },
});

beforeEach(() => {
  getMock.mockReset().mockResolvedValue(serverRow());
  sync.saveSiteSettings.mockReset().mockResolvedValue({ legacyAnalyticsIds: [] });
});
afterEach(() => cleanup());

type Handler<T> = ((h: T | null) => void) & { mock: { calls: unknown[][] } };

function setup(opts: { projectId?: string | null; saveError?: string | null; siteColumnsLocked?: boolean; publishedUrl?: string; readOnly?: boolean } = {}) {
  const composer = createMockComposer({
    projectSettings: baseSettings(),
    projectMetadata: { name: "Acme Site", publishedUrl: opts.publishedUrl ?? null } as never,
  });
  const extra = Object.assign(composer, {
    adoptSavedProjectSettings: vi.fn(),
    isDirty: vi.fn(() => false),
    markSaved: vi.fn(),
  });
  const props = {
    onDirtyChange: vi.fn(),
    registerFlushHandler: vi.fn() as Handler<() => ProjectSettings | void>,
    registerSaveHandler: vi.fn() as Handler<() => Promise<void>>,
    registerFieldErrors: vi.fn(),
    registerFooterMessage: vi.fn(),
    onLoadStateChange: vi.fn(),
    registerRetryLoad: vi.fn(),
  };
  const utils = render(
    <SiteSettingsScreen
      composer={extra}
      projectId={opts.projectId === undefined ? "s1" : opts.projectId}
      saveError={opts.saveError}
      readOnly={opts.readOnly}
      {...props}
    />,
    {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <SiteColumnsLockedContext.Provider value={opts.siteColumnsLocked ?? false}>{children}</SiteColumnsLockedContext.Provider>
      ),
    },
  );
  return { composer: extra, props, ...utils };
}

const loaded = () => waitFor(() => expect(screen.getByTestId("set-card-site-identity")).toBeInTheDocument());
const input = (id: string) => document.getElementById(id) as HTMLInputElement;
const lastHandler = <T,>(fn: { mock: { calls: unknown[][] } }) => {
  const calls = fn.mock.calls.filter((c) => c[0] !== null);
  return calls[calls.length - 1]?.[0] as T | undefined;
};
const openAdvanced = () => fireEvent.click(screen.getByTestId("set-card-toggle-advanced"));

describe("General · 8135:212718 — Site identity from the Site row", () => {
  it("draws name, author, favicon + touch icon uploads, favicon URL and the Languages link; no social or language fields", async () => {
    setup();
    await loaded();
    expect(screen.getByTestId("set-card-title-site-identity")).toHaveTextContent("Site identity");
    expect(input("site-name").value).toBe("Acme Site");
    expect(input("site-author").value).toBe("Ada");
    expect(input("favicon-url").value).toBe("https://acme.test/favicon.ico");
    expect(screen.getByTestId("set-favicon-upload")).toHaveTextContent("Upload favicon");
    expect(screen.getByTestId("set-touch-icon-upload")).toHaveTextContent("Upload touch icon");
    expect(screen.getByTestId("set-field-touch-icon")).toHaveTextContent("PNG · 180×180 recommended");
    expect(screen.getByTestId("set-general-language")).toHaveTextContent("French (fr) · Manage in Languages ›");
    expect(screen.queryByLabelText("Twitter")).toBeNull();
    expect(screen.queryByLabelText("Site Language")).toBeNull();
    expect(getMock).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("previews the favicon image, and the site's initials where there is none", async () => {
    setup();
    await loaded();
    expect(screen.getByTestId("set-favicon-preview").querySelector("img")).toHaveAttribute("src", "https://acme.test/favicon.ico");
    expect(screen.getByTestId("set-touch-icon-preview")).toHaveTextContent("AS");
  });

  it("the Languages link opens Settings on Languages", async () => {
    const { composer } = setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-general-language"));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_SETTINGS_OPEN, { screen: "localization" });
  });

  it("without a projectId shows the composer's values and makes no request", () => {
    setup({ projectId: null });
    expect(input("site-name").value).toBe("Composer Name");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("shows the load card while reading and Try again after a failure", async () => {
    getMock.mockRejectedValueOnce(new Error("network"));
    setup();
    await waitFor(() => expect(screen.getByTestId("set-load-retry")).toBeInTheDocument());
    expect(screen.getByTestId("set-load-title")).toHaveTextContent("Site identity");
    getMock.mockResolvedValueOnce(serverRow());
    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
  });

  it("renders the shell's save error above the cards", async () => {
    setup({ saveError: "Site settings were not saved." });
    await loaded();
    expect(screen.getByTestId("set-save-error")).toHaveTextContent("Site settings were not saved.");
  });

  it("locks the Site-column fields below ADMIN; Author stays editable", async () => {
    setup({ siteColumnsLocked: true });
    await loaded();
    expect(input("site-name").matches(":disabled")).toBe(true);
    expect(input("favicon-url").matches(":disabled")).toBe(true);
    expect(input("site-author").matches(":disabled")).toBe(false);
  });
});

describe("General — read-only (role below ADMIN)", () => {
  it("drops the upload buttons and the Languages link; the values stay readable", async () => {
    setup({ readOnly: true });
    await loaded();
    expect(screen.queryByTestId("set-favicon-upload")).toBeNull();
    expect(screen.queryByTestId("set-touch-icon-upload")).toBeNull();
    expect(screen.queryByTestId("set-general-language")).toBeNull();
    expect(screen.getByText("French (fr)")).toBeInTheDocument();
  });
});

describe("General — edits and the flush", () => {
  it("an edit reports dirty; the name is checked inline and reported to the shell", async () => {
    const { props } = setup();
    await loaded();
    fireEvent.change(input("site-name"), { target: { value: "A" } });
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByText("Needs at least 2 characters.")).toBeInTheDocument();
    expect(props.registerFieldErrors).toHaveBeenLastCalledWith({ "seo.siteName": "Needs at least 2 characters." });
  });

  it("the flush returns name, favicon, touch icon and seo.author over the composer's settings, without writing them", async () => {
    const { composer, props } = setup();
    await loaded();
    fireEvent.change(input("site-name"), { target: { value: "Acme Two" } });
    fireEvent.change(input("site-author"), { target: { value: "  Grace  " } });
    const next = lastHandler<() => ProjectSettings>(props.registerFlushHandler)!();
    expect(next.seo).toMatchObject({
      siteName: "Acme Two",
      favicon: "https://acme.test/favicon.ico",
      touchIcon: "",
      author: "Grace",
      twitterHandle: "@keepme",
    });
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
    expect(composer.mergeProjectMetadata).toHaveBeenCalledWith({ name: "Acme Two" });
  });
});

describe("General › Advanced — 8135:212966 / 213477 / 213221 / 213733", () => {
  it("is collapsed; opening it shows the slug, its rule and the default URL", async () => {
    setup({ publishedUrl: "https://acme-site.vercel.app/" });
    await loaded();
    expect(document.getElementById("site-slug")?.tagName).toBe("SPAN");
    openAdvanced();
    expect(input("site-slug").value).toBe("acme-site");
    expect(screen.getByText("Use lowercase letters, numbers and hyphens.")).toBeInTheDocument();
    expect(screen.getByTestId("set-general-default-url")).toHaveTextContent("Current default URL · acme-site.vercel.app");
  });

  it("search lands on the slug: focusing the closed card's anchor opens it", async () => {
    setup();
    await loaded();
    act(() => document.getElementById("site-slug")!.focus());
    await waitFor(() => expect(document.activeElement).toBe(input("site-slug")));
    expect(input("site-slug").tagName).toBe("INPUT");
  });

  it("a slug of the wrong shape says so and keeps Save off", async () => {
    const { props } = setup();
    await loaded();
    openAdvanced();
    fireEvent.change(input("site-slug"), { target: { value: "Bella Cucina!" } });
    expect(screen.getByTestId("set-general-slug-error")).toHaveTextContent(SLUG_FORMAT_ERROR);
    expect(props.registerFieldErrors).toHaveBeenLastCalledWith({ slug: SLUG_FORMAT_ERROR });
    expect(lastHandler(props.registerSaveHandler)).toBeUndefined();
    // 8135:213477: the footer says what blocks Save — and stops once it is fixed.
    expect(props.registerFooterMessage).toHaveBeenLastCalledWith("Fix the site URL before saving");
    fireEvent.change(input("site-slug"), { target: { value: "bella-cucina" } });
    expect(props.registerFooterMessage).toHaveBeenLastCalledWith(null);
  });

  it("a valid change saves through the screen's own handler: confirm names old → new, then one save carries the slug", async () => {
    const { composer, props } = setup();
    await loaded();
    openAdvanced();
    fireEvent.change(input("site-slug"), { target: { value: "acme-two" } });
    const save = lastHandler<() => Promise<void>>(props.registerSaveHandler)!;
    let done!: Promise<void>;
    act(() => { done = save(); });
    await waitFor(() => expect(screen.getByTestId("set-slug-confirm")).toBeInTheDocument());
    expect(screen.getByTestId("set-slug-confirm-title")).toHaveTextContent("Change the site URL?");
    expect(screen.getByTestId("set-slug-confirm-body")).toHaveTextContent("acme-site → acme-two.");
    fireEvent.click(screen.getByTestId("set-slug-confirm-ok"));
    await act(async () => { await done; });
    expect(sync.saveSiteSettings).toHaveBeenCalledWith("s1", expect.objectContaining({ columns: expect.objectContaining({ slug: "acme-two" }) }));
    expect(composer.adoptSavedProjectSettings).toHaveBeenCalled();
  });

  it("Cancel saves nothing", async () => {
    const { props } = setup();
    await loaded();
    openAdvanced();
    fireEvent.change(input("site-slug"), { target: { value: "acme-two" } });
    const save = lastHandler<() => Promise<void>>(props.registerSaveHandler)!;
    let done!: Promise<void>;
    act(() => { done = save(); });
    await waitFor(() => expect(screen.getByTestId("set-slug-confirm")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("set-slug-confirm-cancel"));
    /* A cancel, not a failure: the shell shows no "not saved" banner for it. */
    await expect(done).rejects.toBeInstanceOf(SettingsSaveCancelled);
    expect(sync.saveSiteSettings).not.toHaveBeenCalled();
  });

  it("a taken slug comes back on the field, and Save stays off until it changes", async () => {
    sync.saveSiteSettings.mockRejectedValueOnce(new SettingsSaveError("Another site already uses that URL slug."));
    const { props } = setup();
    await loaded();
    openAdvanced();
    fireEvent.change(input("site-slug"), { target: { value: "taken-one" } });
    const save = lastHandler<() => Promise<void>>(props.registerSaveHandler)!;
    let done!: Promise<void>;
    act(() => { done = save(); });
    await waitFor(() => expect(screen.getByTestId("set-slug-confirm")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("set-slug-confirm-ok"));
    await expect(done).rejects.toMatchObject({ fieldErrors: { slug: SLUG_TAKEN_ERROR } });
    await waitFor(() => expect(screen.getByTestId("set-general-slug-error")).toHaveTextContent(SLUG_TAKEN_ERROR));
    expect(props.registerFieldErrors).toHaveBeenLastCalledWith({ slug: SLUG_TAKEN_ERROR });
    fireEvent.change(input("site-slug"), { target: { value: "taken-two" } });
    expect(screen.queryByTestId("set-general-slug-error")).toBeNull();
  });
});

describe("General — icon upload", () => {
  it("presigns, PUTs the file and shows the confirmed URL as the touch icon", async () => {
    api.upload.presign.mutate.mockResolvedValue({ fileId: "f1", uploadUrl: "/api/upload/f1" });
    api.upload.confirm.mutate.mockResolvedValue({ cdnUrl: "https://blob.test/touch.png" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const { props } = setup();
    await loaded();
    const file = new File(["x"], "touch.png", { type: "image/png" });
    await act(async () => {
      fireEvent.change(screen.getByTestId("set-touch-icon-file"), { target: { files: [file] } });
    });
    await waitFor(() =>
      expect(screen.getByTestId("set-touch-icon-preview").querySelector("img")).toHaveAttribute("src", "https://blob.test/touch.png"),
    );
    expect(api.upload.presign.mutate).toHaveBeenCalledWith({ fileName: "touch.png", fileType: "image/png", context: "touch_icon", siteId: "s1" });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/upload/f1"), expect.objectContaining({ method: "PUT" }));
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(true);
    const next = lastHandler<() => ProjectSettings>(props.registerFlushHandler)!();
    expect(next.seo?.touchIcon).toBe("https://blob.test/touch.png");
    vi.unstubAllGlobals();
  });
});
