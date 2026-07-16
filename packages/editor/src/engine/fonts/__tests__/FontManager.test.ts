/**
 * FontManager — system font registry, Google Fonts fetch/cache/load (link
 * injection into document.head), custom font upload (FontFace), favorites,
 * filtering, and events.
 *
 * jsdom neither loads stylesheets nor implements FontFace, so:
 *  - document.head.appendChild is spied to fire link.onload/onerror manually
 *  - FontFace is stubbed globally
 *  - document.fonts.add is provided on the test-setup document.fonts stub
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FontManager } from "../FontManager";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "../../Composer";
import type { GoogleFont } from "@/shared/types/fonts";

function makeManager(config?: ConstructorParameters<typeof FontManager>[1]) {
  return new FontManager({} as unknown as Composer, config);
}

function googleApiResponse() {
  return {
    items: [
      { family: "Inter", category: "sans-serif", variants: ["regular", "500", "700italic"] },
      { family: "Playfair Display", category: "serif", variants: ["regular", "700"] },
    ],
  };
}

function mockFetchOk() {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    statusText: "OK",
    json: async () => googleApiResponse(),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("system fonts", () => {
  it("registers the system font set as loaded on construction", () => {
    const manager = makeManager();
    const arial = manager.getFont("arial");
    expect(arial?.source).toBe("system");
    expect(arial?.loaded).toBe(true);
    expect(manager.getAllFonts({ source: "system" }).length).toBeGreaterThanOrEqual(6);
  });
});

describe("fetchGoogleFonts", () => {
  it("maps API items to GoogleFont entries, registers them, and emits google-fonts:fetched", async () => {
    const fetchMock = mockFetchOk();
    const manager = makeManager();
    const fetched = vi.fn();
    manager.on(EVENTS.FONTS_GOOGLE_FETCHED, fetched);

    const fonts = await manager.fetchGoogleFonts();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("sort=popularity"));
    expect(fonts).toHaveLength(2);
    const inter = manager.getFont("google-inter") as GoogleFont;
    expect(inter.source).toBe("google");
    expect(inter.googleFamily).toBe("Inter");
    expect(inter.popularity).toBe(1);
    // "regular" → 400 normal; "700italic" → 700 italic
    expect(inter.variants).toContainEqual({ weight: 400, style: "normal" });
    expect(inter.variants).toContainEqual({ weight: 700, style: "italic" });
    expect(fetched).toHaveBeenCalledWith({ count: 2 });
  });

  it("appends the API key when configured", async () => {
    const fetchMock = mockFetchOk();
    const manager = makeManager({ apiKey: "KEY123" });

    await manager.fetchGoogleFonts();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("key=KEY123"));
  });

  it("serves the second call from cache without refetching", async () => {
    const fetchMock = mockFetchOk();
    const manager = makeManager();

    await manager.fetchGoogleFonts();
    await manager.fetchGoogleFonts();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("emits google-fonts:error and returns [] on HTTP failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, statusText: "Forbidden", json: async () => ({}) })),
    );
    const manager = makeManager();
    const errored = vi.fn();
    manager.on(EVENTS.FONTS_GOOGLE_ERROR, errored);

    const fonts = await manager.fetchGoogleFonts();

    expect(fonts).toEqual([]);
    expect(errored).toHaveBeenCalledWith({ error: expect.any(Error) });
  });
});

describe("loadGoogleFont — stylesheet link injection", () => {
  let appendedLinks: HTMLLinkElement[];
  let appendSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    appendedLinks = [];
    appendSpy = vi
      .spyOn(document.head, "appendChild")
      .mockImplementation((node: Node) => {
        const link = node as HTMLLinkElement;
        appendedLinks.push(link);
        queueMicrotask(() => link.onload?.(new Event("load")));
        return node;
      });
  });

  it("injects a fonts.googleapis.com css2 link with family, weights, and display", async () => {
    mockFetchOk();
    const manager = makeManager();
    await manager.fetchGoogleFonts();
    const loaded = vi.fn();
    manager.on(EVENTS.FONT_LOADED, loaded);

    await manager.loadGoogleFont("google-playfair-display");

    expect(appendedLinks).toHaveLength(1);
    const link = appendedLinks[0];
    expect(link.rel).toBe("stylesheet");
    expect(link.href).toContain("https://fonts.googleapis.com/css2?family=Playfair+Display");
    // 400 renders as empty weight string, 700 as "700"; display defaults to swap.
    expect(link.href).toContain("wght@;700");
    expect(link.href).toContain("display=swap");

    expect(manager.isLoaded("google-playfair-display")).toBe(true);
    expect(manager.getFont("google-playfair-display")?.loaded).toBe(true);
    expect(loaded).toHaveBeenCalledWith({ font: expect.objectContaining({ family: "Playfair Display" }) });
  });

  it("is idempotent — second load does not inject another link", async () => {
    mockFetchOk();
    const manager = makeManager();
    await manager.fetchGoogleFonts();

    await manager.loadGoogleFont("google-inter");
    await manager.loadGoogleFont("google-inter");

    expect(appendedLinks).toHaveLength(1);
  });

  it("honors options.variants and options.display in the URL", async () => {
    mockFetchOk();
    const manager = makeManager();
    await manager.fetchGoogleFonts();

    await manager.loadGoogleFont("google-inter", {
      variants: [{ weight: 500, style: "normal" }],
      display: "block",
    });

    expect(appendedLinks[0].href).toContain("wght@500");
    expect(appendedLinks[0].href).toContain("display=block");
  });

  it("throws for an unknown or non-google font id", async () => {
    const manager = makeManager();
    await expect(manager.loadGoogleFont("ghost")).rejects.toThrow(/not found/);
    await expect(manager.loadGoogleFont("arial")).rejects.toThrow(/not found/);
  });

  it("emits font:error, calls onError, and rethrows when the stylesheet fails to load", async () => {
    appendSpy.mockImplementation((node: Node) => {
      const link = node as HTMLLinkElement;
      queueMicrotask(() => link.onerror?.(new Event("error")));
      return node;
    });
    mockFetchOk();
    const manager = makeManager();
    await manager.fetchGoogleFonts();
    const errored = vi.fn();
    const onError = vi.fn();
    manager.on(EVENTS.FONT_ERROR, errored);

    await expect(manager.loadGoogleFont("google-inter", { onError })).rejects.toThrow(
      /Failed to load font/,
    );
    expect(errored).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(manager.isLoaded("google-inter")).toBe(false);
  });

  it("invokes options.onLoad with the font on success", async () => {
    mockFetchOk();
    const manager = makeManager();
    await manager.fetchGoogleFonts();
    const onLoad = vi.fn();

    await manager.loadGoogleFont("google-inter", { onLoad });

    expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ id: "google-inter" }));
  });
});

describe("custom fonts (uploadFont)", () => {
  class MockFontFace {
    constructor(
      public family: string,
      public source: string,
      public descriptors: { weight: string; style: string },
    ) {}
    load = vi.fn(async () => this);
  }

  beforeEach(() => {
    vi.stubGlobal("FontFace", MockFontFace);
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { add: vi.fn(), load: () => Promise.resolve([]), ready: Promise.resolve() },
    });
  });

  it("uploads, parses variants from file keys, loads via FontFace, and emits events", async () => {
    const manager = makeManager();
    const uploaded = vi.fn();
    const loaded = vi.fn();
    manager.on(EVENTS.FONT_UPLOADED, uploaded);
    manager.on(EVENTS.FONT_LOADED, loaded);

    const files = new Map<string, File>([
      ["400-normal", new File(["aa"], "brand-regular.woff2")],
      ["700-italic", new File(["bb"], "brand-bolditalic.woff2")],
    ]);
    const font = await manager.uploadFont({ family: "Brand Sans", category: "sans-serif", files });

    expect(font.id).toMatch(/^custom-brand-sans-/);
    expect(font.source).toBe("custom");
    expect(font.variants).toHaveLength(2);
    expect(font.variants[0]).toMatchObject({ weight: 400, style: "normal" });
    expect(font.variants[1]).toMatchObject({ weight: 700, style: "italic" });
    // Files converted to data URLs.
    expect(font.files["400-normal"]).toMatch(/^data:/);
    expect(font.variants.every((v) => v.loaded)).toBe(true);

    expect(manager.isLoaded(font.id)).toBe(true);
    expect(
      (document.fonts as unknown as { add: ReturnType<typeof vi.fn> }).add,
    ).toHaveBeenCalledTimes(2);
    expect(uploaded).toHaveBeenCalledWith({ font });
    expect(loaded).toHaveBeenCalledWith({ font });
  });

  it("snaps invalid weights to the nearest valid weight and defaults bad styles to normal", async () => {
    const manager = makeManager();
    const files = new Map<string, File>([["433-fancy", new File(["cc"], "odd.woff2")]]);

    const font = await manager.uploadFont({ family: "Odd", category: "display", files });

    expect(font.variants[0]).toMatchObject({ weight: 400, style: "normal" });
  });

  it("deleteFont removes custom fonts and emits font:deleted; system fonts are protected", async () => {
    const manager = makeManager();
    const deleted = vi.fn();
    manager.on(EVENTS.FONT_DELETED, deleted);
    const files = new Map<string, File>([["400-normal", new File(["aa"], "x.woff2")]]);
    const font = await manager.uploadFont({ family: "Temp", category: "sans-serif", files });

    manager.deleteFont(font.id);
    expect(manager.getFont(font.id)).toBeUndefined();
    expect(manager.isLoaded(font.id)).toBe(false);
    expect(deleted).toHaveBeenCalledWith({ font });

    manager.deleteFont("arial");
    expect(manager.getFont("arial")).toBeDefined();
    expect(deleted).toHaveBeenCalledTimes(1);
  });
});

describe("favorites + filtering", () => {
  it("toggleFavorite flips the flag and emits font:favorite-toggled", () => {
    const manager = makeManager();
    const toggled = vi.fn();
    manager.on(EVENTS.FONT_FAVORITE_TOGGLED, toggled);

    manager.toggleFavorite("arial");
    expect(manager.getFont("arial")?.favorite).toBe(true);
    expect(toggled).toHaveBeenCalledWith({ font: expect.objectContaining({ id: "arial" }) });

    manager.toggleFavorite("arial");
    expect(manager.getFont("arial")?.favorite).toBe(false);
  });

  it("toggleFavorite on an unknown id emits nothing", () => {
    const manager = makeManager();
    const toggled = vi.fn();
    manager.on(EVENTS.FONT_FAVORITE_TOGGLED, toggled);
    manager.toggleFavorite("ghost");
    expect(toggled).not.toHaveBeenCalled();
  });

  it("getAllFonts filters by favoritesOnly / query / category", () => {
    const manager = makeManager();
    manager.toggleFavorite("georgia");

    expect(manager.getAllFonts({ favoritesOnly: true }).map((f) => f.id)).toEqual(["georgia"]);
    expect(manager.getAllFonts({ query: "times" }).map((f) => f.id)).toEqual(["times-new-roman"]);
    expect(manager.getAllFonts({ category: "monospace" }).map((f) => f.id)).toEqual([
      "courier-new",
    ]);
  });

  it("getAllFonts sorts by name asc and desc", () => {
    const manager = makeManager();
    const asc = manager.getAllFonts({ sortBy: "name", sortOrder: "asc" }).map((f) => f.family);
    const desc = manager.getAllFonts({ sortBy: "name", sortOrder: "desc" }).map((f) => f.family);
    expect(asc[0]).toBe("Arial");
    expect(desc[0]).toBe("Verdana");
  });
});

describe("destroy", () => {
  it("clears fonts, loaded set, cache, and listeners", async () => {
    mockFetchOk();
    const manager = makeManager();
    await manager.fetchGoogleFonts();
    const handler = vi.fn();
    manager.on(EVENTS.FONT_FAVORITE_TOGGLED, handler);

    manager.destroy();

    expect(manager.getAllFonts()).toHaveLength(0);
    expect(manager.getLoadedFonts()).toHaveLength(0);
    manager.toggleFavorite("arial");
    expect(handler).not.toHaveBeenCalled();
  });
});
