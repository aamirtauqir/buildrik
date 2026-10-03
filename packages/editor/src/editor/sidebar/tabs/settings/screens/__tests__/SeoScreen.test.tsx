/**
 * SeoScreen — Phase B SEO: 8135:214533 (Defaults · Social profiles · Pages
 * strip · Indexing ›), 8135:214820 (Indexing open: switch, canonical,
 * editable robots.txt, Reset to default) and 8135:215066 (indexing off
 * notice). Flush returns the column-backed SEO keys incl. all six social
 * links; a changed canonical URL saves through the screen's own handler.
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
    siteDetail: {
      settings: { get: { query: vi.fn() } },
      domains: { list: { query: vi.fn() } },
    },
  },
  sync: { saveSiteSettings: vi.fn() },
}));

vi.mock("@/services/api-client", () => ({ getBuildrikClient: () => api }));
vi.mock("@/services/BuildrikSyncProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/BuildrikSyncProvider")>()),
  saveSiteSettings: sync.saveSiteSettings,
}));

import { SeoScreen, robotsPreview, sitemapOrigin } from "../SeoScreen";

const getMock = api.siteDetail.settings.get.query;
const domainsMock = api.siteDetail.domains.list.query;

const serverRow = () => ({
  metaTitle: "Acme · Home",
  metaDescription: "We make things.",
  ogImage: "https://acme.test/og.png",
  canonicalUrl: "https://acme.test",
  allowIndexing: true,
  robotsTxt: null,
  socialLinks: { facebook: "https://facebook.com/acme", instagram: "https://instagram.com/acme" },
});

beforeEach(() => {
  getMock.mockReset().mockResolvedValue(serverRow());
  domainsMock.mockReset().mockResolvedValue([{ domain: "acme.com", status: "VERIFIED", isPrimary: true }]);
  sync.saveSiteSettings.mockReset().mockResolvedValue({ legacyAnalyticsIds: [] });
});
afterEach(() => cleanup());

function setup(opts: { projectId?: string | null; saveError?: string | null; seo?: Record<string, unknown> } = {}) {
  const composer = Object.assign(
    createMockComposer({
      projectSettings: { seo: { siteName: "Acme", twitterHandle: "@acme", metaTitle: "Composer title", ...opts.seo } },
      projectMetadata: { name: "Acme", publishedUrl: null } as never,
    }),
    { adoptSavedProjectSettings: vi.fn(), isDirty: vi.fn(() => false), markSaved: vi.fn() },
  );
  const props = {
    onDirtyChange: vi.fn(),
    registerFlushHandler: vi.fn(),
    registerSaveHandler: vi.fn(),
    registerFieldErrors: vi.fn(),
  };
  render(<SeoScreen composer={composer} projectId={opts.projectId === undefined ? "s1" : opts.projectId} saveError={opts.saveError} {...props} />);
  return { composer, props };
}

const loaded = () => waitFor(() => expect(screen.getByTestId("set-card-defaults")).toBeInTheDocument());
const input = (id: string) => document.getElementById(id) as HTMLInputElement;
const last = <T,>(fn: { mock: { calls: unknown[][] } }) => {
  const calls = fn.mock.calls.filter((c) => c[0] !== null);
  return calls[calls.length - 1]?.[0] as T | undefined;
};

describe("SEO · 8135:214533 — Defaults, Social profiles, the Pages strip, Indexing closed", () => {
  it("fills Defaults from the Site row and lists all six networks", async () => {
    setup();
    await loaded();
    expect(input("seo-meta-title").value).toBe("Acme · Home");
    expect(input("seo-meta-description").value).toBe("We make things.");
    expect(input("seo-og").value).toBe("https://acme.test/og.png");
    for (const [id, label] of [
      ["twitter", "Twitter/X"],
      ["facebook", "Facebook"],
      ["linkedin", "LinkedIn"],
      ["instagram", "Instagram"],
      ["youtube", "YouTube"],
      ["github", "GitHub"],
    ]) {
      expect(screen.getByLabelText(label).id).toBe(`social-${id}`);
    }
    expect(input("social-instagram").value).toBe("https://instagram.com/acme");
    expect(screen.getByTestId("set-seo-pages-strip")).toHaveTextContent(
      "Page titles and descriptions can be overridden per page in Pages ›",
    );
    expect(screen.getByTestId("set-card-indexing")).toHaveAttribute("data-open", "false");
    expect(screen.queryByLabelText("Twitter Handle")).toBeNull();
  });

  it("offers the old Twitter handle in the Twitter/X field when the link is empty", async () => {
    setup();
    await loaded();
    expect(input("social-twitter").value).toBe("@acme");
  });

  it("Pages › opens the Pages panel", async () => {
    const { composer } = setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-seo-pages-link"));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_PANEL_OPEN, { panel: "pages" });
  });

  it("without a projectId shows the composer's values and requests nothing", () => {
    setup({ projectId: null });
    expect(input("seo-meta-title").value).toBe("Composer title");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("shows the load card and Try again when the read fails", async () => {
    getMock.mockRejectedValueOnce(new Error("network"));
    setup();
    await waitFor(() => expect(screen.getByTestId("set-load-retry")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
  });

  it("renders the shell's save error above the cards", async () => {
    setup({ saveError: "SEO settings were not saved." });
    await loaded();
    expect(screen.getByTestId("set-save-error")).toHaveTextContent("SEO settings were not saved.");
  });
});

describe("SEO › Indexing — 8135:214820 / 8135:215066", () => {
  it("opens to the switch, the canonical URL and an editable robots.txt whose placeholder is the generated default", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-card-toggle-indexing"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(input("seo-canonical").value).toBe("https://acme.test");
    const robots = document.getElementById("seo-robots") as HTMLTextAreaElement;
    expect(robots.value).toBe("");
    expect(robots.placeholder).toBe("User-agent: *\nAllow: /\nSitemap: https://acme.com/sitemap.xml");
    expect(screen.getByText("Leave blank to use the generated default shown above.")).toBeInTheDocument();
  });

  it("turning indexing off flips the default to Disallow and shows the notice", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-card-toggle-indexing"));
    expect(screen.queryByTestId("set-seo-indexing-off")).toBeNull();
    fireEvent.click(screen.getByRole("switch"));
    expect((document.getElementById("seo-robots") as HTMLTextAreaElement).placeholder).toBe("User-agent: *\nDisallow: /");
    expect(screen.getByTestId("set-seo-indexing-off")).toHaveTextContent(
      "Indexing is off. Search engines will be asked not to include this site after the next publish.",
    );
  });

  it("Reset to default empties a custom robots.txt", async () => {
    getMock.mockResolvedValue({ ...serverRow(), robotsTxt: "Disallow: /x" });
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-card-toggle-indexing"));
    const robots = document.getElementById("seo-robots") as HTMLTextAreaElement;
    expect(robots.value).toBe("Disallow: /x");
    fireEvent.click(screen.getByTestId("set-seo-robots-reset"));
    expect(robots.value).toBe("");
  });

  it("search lands on canonical: focusing the closed card's anchor opens it", async () => {
    setup();
    await loaded();
    act(() => document.getElementById("seo-canonical")!.focus());
    await waitFor(() => expect(document.activeElement).toBe(input("seo-canonical")));
  });
});

describe("SEO — what Save sends", () => {
  it("the flush returns the column keys incl. the six social links, robots and indexing, without writing the composer", async () => {
    const { composer, props } = setup();
    await loaded();
    fireEvent.change(input("social-github"), { target: { value: "https://github.com/acme" } });
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(true);
    const next = last<() => ProjectSettings>(props.registerFlushHandler)!();
    expect(next.seo).toMatchObject({
      metaTitle: "Acme · Home",
      metaDescription: "We make things.",
      defaultOgImage: "https://acme.test/og.png",
      allowIndexing: true,
      robotsTxt: "",
      socialLinks: {
        twitter: "@acme",
        facebook: "https://facebook.com/acme",
        linkedin: "",
        instagram: "https://instagram.com/acme",
        youtube: "",
        github: "https://github.com/acme",
      },
    });
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
    expect(last(props.registerSaveHandler)).toBeUndefined();
  });

  it("a changed canonical URL saves through the screen's handler, in the same settings.update", async () => {
    const { props } = setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-card-toggle-indexing"));
    fireEvent.change(input("seo-canonical"), { target: { value: "https://acme.com" } });
    await act(async () => { await last<() => Promise<void>>(props.registerSaveHandler)!(); });
    expect(sync.saveSiteSettings).toHaveBeenCalledWith("s1", expect.objectContaining({ columns: expect.objectContaining({ canonicalUrl: "https://acme.com" }) }));
  });

  it("refusals the shared schema knows are said inline and keep Save off", async () => {
    const { props } = setup();
    await loaded();
    fireEvent.change(input("seo-og"), { target: { value: "javascript:alert(1)" } });
    fireEvent.change(input("social-facebook"), { target: { value: "http://facebook.com/acme" } });
    fireEvent.change(input("seo-meta-title"), { target: { value: "x".repeat(61) } });
    expect(screen.getByText("Use an https:// address or a path on this site (/image.png).")).toBeInTheDocument();
    expect(screen.getByText("Use an https:// link.")).toBeInTheDocument();
    expect(screen.getByText("Keep it under 60 characters — search results cut it there.")).toBeInTheDocument();
    expect(props.registerFieldErrors).toHaveBeenLastCalledWith(
      expect.objectContaining({
        "seo.defaultOgImage": expect.any(String),
        "seo.socialLinks.facebook": "Use an https:// link.",
        "seo.metaTitle": expect.any(String),
      }),
    );
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
    expect(robotsPreview({ robotsTxt: "Disallow: /x", allowIndexing: true, origin: "https://a.com" })).toBe("Disallow: /x");
  });
});
