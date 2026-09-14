/**
 * SeoScreen tests — Clone 3397:32076 SEO defaults: the info strip, the Site
 * SEO card, the Indexing card (switch + robots.txt preview), the server read
 * behind them (3953:26646 / 3953:26785), the save-error banner (3951:26319),
 * dirty wiring and the flush-handler contract.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor, cleanup } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

const { api } = vi.hoisted(() => ({
  api: {
    siteDetail: {
      settings: { get: { query: vi.fn() } },
      domains: { list: { query: vi.fn() } },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => api,
}));

import { SeoScreen, robotsPreview, sitemapOrigin } from "../SeoScreen";

const getMock = api.siteDetail.settings.get.query;
const domainsMock = api.siteDetail.domains.list.query;

const serverRow = () => ({
  metaTitle: "Acme — Wood-fired",
  metaDescription: "Hand-stretched daily.",
  ogImage: "https://acme.test/og.png",
  allowIndexing: true,
  robotsTxt: null,
});

const baseSettings = () => ({
  seo: {
    siteName: "Keep Me",
    twitterHandle: "@acme",
    metaTitle: "Composer title",
    defaultOgImage: "https://composer.test/og.png",
  },
});

beforeEach(() => {
  getMock.mockReset().mockResolvedValue(serverRow());
  domainsMock.mockReset().mockResolvedValue([]);
});

afterEach(() => cleanup());

function setup(opts: {
  projectId?: string | null;
  onDirtyChange?: (d: boolean) => void;
  registerFlushHandler?: (h: (() => void) | null) => void;
  onLoadStateChange?: (s: "loading" | "ready" | "error") => void;
  saveError?: string | null;
  settings?: Record<string, unknown>;
  publishedUrl?: string | null;
} = {}) {
  const composer = createMockComposer({
    projectSettings: opts.settings ?? baseSettings(),
    projectMetadata: { domain: null, publishedUrl: opts.publishedUrl ?? null },
  });
  const utils = render(
    <SeoScreen
      composer={composer}
      projectId={opts.projectId === undefined ? "s1" : opts.projectId}
      onDirtyChange={opts.onDirtyChange}
      registerFlushHandler={opts.registerFlushHandler}
      onLoadStateChange={opts.onLoadStateChange}
      saveError={opts.saveError}
    />,
  );
  return { composer, ...utils };
}

const metaTitle = () => screen.getByLabelText("Meta title") as HTMLInputElement;
const metaDescription = () => screen.getByLabelText("Meta description") as HTMLInputElement;
const twitterHandle = () => screen.getByLabelText("Twitter Handle") as HTMLInputElement;
const ogImage = () => screen.getByLabelText("Default OG Image URL") as HTMLInputElement;
const indexing = () => screen.getByRole("switch", { name: "Allow search indexing" });
const robots = () => screen.getByLabelText("robots.txt");

const loaded = () => waitFor(() => expect(screen.getByTestId("set-card-site-seo")).toBeInTheDocument());

describe("SeoScreen — the frame's strip and two cards", () => {
  it("draws the info strip, Site SEO and Indexing, with the field ids the walk drives", async () => {
    setup();
    await loaded();
    expect(screen.getByText(/Site-wide SEO defaults are set here/)).toHaveTextContent(
      "values set there override these defaults.",
    );
    expect(screen.getByTestId("set-card-site-seo")).toHaveTextContent("Site SEO");
    expect(screen.getByTestId("set-card-indexing")).toHaveTextContent("Indexing");
    expect(metaTitle().id).toBe("seo-meta-title");
    expect(metaDescription().id).toBe("seo-meta-description");
    expect(twitterHandle().id).toBe("seo-twitter");
    expect(ogImage().id).toBe("seo-og");
    expect(indexing().id).toBe("seo-allow-indexing");
    expect(robots().id).toBe("seo-robots");
    // The frame has no title template — the field went with it.
    expect(screen.queryByLabelText(/title template/i)).toBeNull();
  });

  it("prefills the Site columns from the server row and the handle from the composer", async () => {
    setup();
    await loaded();
    expect(metaTitle().value).toBe("Acme — Wood-fired");
    expect(metaDescription().value).toBe("Hand-stretched daily.");
    expect(ogImage().value).toBe("https://acme.test/og.png");
    expect(indexing()).toHaveAttribute("aria-checked", "true");
    expect(twitterHandle().value).toBe("@acme");
    expect(getMock).toHaveBeenCalledWith({ siteId: "s1" });
    expect(domainsMock).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("without a projectId shows the composer's values and requests nothing", () => {
    setup({ projectId: null });
    expect(metaTitle().value).toBe("Composer title");
    expect(getMock).not.toHaveBeenCalled();
  });
});

describe("SeoScreen — robots.txt preview follows the switch, the domain and the row", () => {
  it("defaults to Allow with the sitemap on the primary verified domain", async () => {
    domainsMock.mockResolvedValue([
      { domain: "old.example", status: "VERIFIED", isPrimary: false },
      { domain: "bellacucina.com", status: "VERIFIED", isPrimary: true },
      { domain: "pending.example", status: "PENDING", isPrimary: false },
    ]);
    setup();
    await loaded();
    expect(robots().textContent).toBe("User-agent: *\nAllow: /\nSitemap: https://bellacucina.com/sitemap.xml");
  });

  it("falls back to the published host when no domain is verified", async () => {
    setup({ publishedUrl: "https://acme-site.vercel.app/" });
    await loaded();
    expect(robots().textContent).toBe("User-agent: *\nAllow: /\nSitemap: https://acme-site.vercel.app/sitemap.xml");
  });

  it("names no sitemap host it does not know", async () => {
    setup();
    await loaded();
    expect(robots().textContent).toBe("User-agent: *\nAllow: /");
  });

  /* No sitemap when indexing is off — a staging site asking to be crawled is
     the opposite of what the switch means (mirrors lib/publish-files.ts). */
  it("flips to Disallow, without a sitemap, when the switch is turned off — and marks dirty", async () => {
    const onDirtyChange = vi.fn();
    setup({ publishedUrl: "https://acme-site.vercel.app", onDirtyChange });
    await loaded();
    fireEvent.click(indexing());
    expect(indexing()).toHaveAttribute("aria-checked", "false");
    expect(robots().textContent).toBe("User-agent: *\nDisallow: /");
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
  });

  it("shows Site.robotsTxt verbatim when the row carries one", async () => {
    getMock.mockResolvedValue({ ...serverRow(), robotsTxt: "User-agent: *\nDisallow: /staff\n" });
    setup({ publishedUrl: "https://acme-site.vercel.app" });
    await loaded();
    expect(robots().textContent).toBe("User-agent: *\nDisallow: /staff\n");
  });

  it("still loads when the domains read fails — the preview just has no host", async () => {
    domainsMock.mockRejectedValue(new Error("FORBIDDEN"));
    setup();
    await loaded();
    expect(robots().textContent).toBe("User-agent: *\nAllow: /");
  });
});

describe("robotsPreview / sitemapOrigin — pure", () => {
  it("prefers the primary verified domain, then any verified, then the published origin", () => {
    expect(sitemapOrigin([{ domain: "b.com", status: "VERIFIED", isPrimary: false }, { domain: "a.com", status: "VERIFIED", isPrimary: true }], null)).toBe("https://a.com");
    expect(sitemapOrigin([{ domain: "b.com", status: "VERIFIED", isPrimary: false }], null)).toBe("https://b.com");
    expect(sitemapOrigin([{ domain: "p.com", status: "PENDING", isPrimary: true }], "https://x.vercel.app/path")).toBe("https://x.vercel.app");
    expect(sitemapOrigin([], "not a url")).toBeNull();
    expect(sitemapOrigin([], null)).toBeNull();
  });

  it("builds the default from the switch and origin, and returns a custom file untouched", () => {
    expect(robotsPreview({ robotsTxt: "", allowIndexing: true, origin: "https://a.com" })).toBe(
      "User-agent: *\nAllow: /\nSitemap: https://a.com/sitemap.xml",
    );
    expect(robotsPreview({ robotsTxt: "", allowIndexing: false, origin: "https://a.com" })).toBe("User-agent: *\nDisallow: /");
    expect(robotsPreview({ robotsTxt: "  ", allowIndexing: true, origin: null })).toBe("User-agent: *\nAllow: /");
    expect(robotsPreview({ robotsTxt: "Disallow: /x", allowIndexing: true, origin: "https://a.com" })).toBe("Disallow: /x");
  });
});

describe("SeoScreen — loading, load-error and save-error", () => {
  it("shows the SEO DEFAULTS load card while the row is on its way", async () => {
    let resolve!: (row: unknown) => void;
    getMock.mockReturnValue(new Promise((r) => { resolve = r; }));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });
    expect(screen.getByTestId("set-load-title")).toHaveTextContent("SEO defaults");
    expect(screen.getByTestId("set-load-card")).toHaveTextContent("Title, description and social preview defaults.");
    expect(screen.getByTestId("set-load-state")).toHaveTextContent("Loading…");
    expect(onLoadStateChange).toHaveBeenLastCalledWith("loading");
    await act(async () => { resolve(serverRow()); });
    await loaded();
    expect(onLoadStateChange).toHaveBeenLastCalledWith("ready");
  });

  it("shows the error line + Try again when the read fails, and Try again re-reads", async () => {
    getMock.mockRejectedValueOnce(new Error("network"));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });
    await waitFor(() => expect(screen.getByTestId("set-load-retry")).toBeInTheDocument());
    expect(screen.getByTestId("set-load-state")).toHaveTextContent(
      "Couldn't load your SEO defaults. Check your connection, then try again.",
    );
    expect(onLoadStateChange).toHaveBeenLastCalledWith("error");
    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it("renders the shell's saveError above the strip and cards", async () => {
    setup({ saveError: "SEO defaults were not saved. Your changes are still here. Review the values, then retry." });
    await loaded();
    expect(screen.getByTestId("set-save-error")).toHaveTextContent(/SEO defaults were not saved/);
    expect(metaTitle().value).toBe("Acme — Wood-fired");
  });
});

describe("SeoScreen — edit behavior + dirty wiring", () => {
  it("starts clean, then typing in a field marks the screen dirty", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    await loaded();
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    fireEvent.change(twitterHandle(), { target: { value: "@renamed" } });
    expect(twitterHandle().value).toBe("@renamed");
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
  });

  it("does NOT write to composer per keystroke", async () => {
    const { composer } = setup();
    await loaded();
    fireEvent.change(ogImage(), { target: { value: "https://acme.test/new-og.png" } });
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
  });

  it("resyncs when composer settings change externally (SETTINGS_CHANGE)", async () => {
    const { composer } = setup();
    await loaded();
    act(() => {
      composer.setProjectSettings({ seo: { ...baseSettings().seo, twitterHandle: "@external" } });
    });
    await waitFor(() => expect(twitterHandle().value).toBe("@external"));
  });
});

describe("SeoScreen — flush handler contract", () => {
  it("registers a flush handler on mount and clears it on unmount", async () => {
    const registerFlushHandler = vi.fn();
    const { unmount } = setup({ registerFlushHandler });
    await loaded();
    expect(registerFlushHandler).toHaveBeenCalledWith(expect.any(Function));
    unmount();
    expect(registerFlushHandler).toHaveBeenLastCalledWith(null);
  });

  it("flush writes the six SEO keys into composer, preserving sibling seo keys", async () => {
    let flush: (() => void) | null = null;
    const registerFlushHandler = vi.fn((h: (() => void) | null) => { flush = h; });
    getMock.mockResolvedValue({ ...serverRow(), robotsTxt: "Disallow: /x" });
    const { composer } = setup({ registerFlushHandler });
    await loaded();

    fireEvent.change(metaTitle(), { target: { value: "Flushed title" } });
    fireEvent.change(metaDescription(), { target: { value: "Flushed description" } });
    fireEvent.change(twitterHandle(), { target: { value: "@flushed" } });
    fireEvent.change(ogImage(), { target: { value: "https://acme.test/flushed.png" } });
    fireEvent.click(indexing());

    act(() => flush!());

    expect(composer.setProjectSettings).toHaveBeenCalledTimes(1);
    const settings = composer.getProjectSettings() as { seo: Record<string, unknown> };
    expect(settings.seo).toMatchObject({
      metaTitle: "Flushed title",
      metaDescription: "Flushed description",
      twitterHandle: "@flushed",
      defaultOgImage: "https://acme.test/flushed.png",
      allowIndexing: false,
      robotsTxt: "Disallow: /x",
      // siteName is owned by SiteSettingsScreen — flush must not clobber it.
      siteName: "Keep Me",
    });
    expect(settings.seo).not.toHaveProperty("metaTitleTemplate");
  });
});

/* The columns are `max(60)` / `max(160)` / `url()` on the server. Said under
   the field before Save has to say it in a banner. */
describe("SeoScreen — the fields say what the server will accept", () => {
  it("flags an OG image URL with no scheme, inline, and marks the input invalid", async () => {
    setup();
    await loaded();
    fireEvent.change(ogImage(), { target: { value: "mysite.com/og.png" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/full URL/i);
    expect(ogImage()).toHaveAttribute("aria-invalid", "true");
  });

  it("accepts a full https URL and says nothing about an empty field", async () => {
    setup();
    await loaded();
    fireEvent.change(ogImage(), { target: { value: "https://mysite.com/og.png" } });
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.change(ogImage(), { target: { value: "" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("flags a meta title over 60 and a description over 160", async () => {
    setup();
    await loaded();
    fireEvent.change(metaTitle(), { target: { value: "x".repeat(61) } });
    expect(screen.getByRole("alert")).toHaveTextContent(/under 60 characters/);
    expect(metaTitle()).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(metaTitle(), { target: { value: "x".repeat(60) } });
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.change(metaDescription(), { target: { value: "y".repeat(161) } });
    expect(screen.getByRole("alert")).toHaveTextContent(/under 160 characters/);
  });
});
