/**
 * SiteFontsModal — Clone 3686:42317 "Site fonts", 3695:45594 "Font added",
 * 3695:45606 "No fonts found" (Assets · Clone Phase 5). One `it` per
 * prototype fact a DOM assertion can prove; the visual half is the shot
 * pair the live walk takes.
 *
 * The dialog is mounted once (StudioPanels) and opened by the composer
 * event every door emits — `ui:site-fonts` with the file to highlight —
 * so the door-to-dialog wiring is proved here against a real emitter, not
 * in a shell harness (there is none that renders StudioPanels).
 *
 * The model under it (`MediaAsset.siteFont`, the Composer's gated
 * registration) has its own tests in engine/; this file only asserts what
 * the dialog writes (`media.updateAsset(id, { siteFont })`) and shows.
 *
 * @license BSD-3-Clause
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { EventEmitter } from "@/engine/EventEmitter";
import type { Composer } from "@/engine/Composer";
import type { MediaAsset } from "@/shared/types/media";
import { makeAsset } from "../../__tests__/libraryFixture";
import { SiteFontsModal } from "../SiteFontsModal";

/* The prototype's fixture file plus a second, already-added one so both
   states are on screen at once; an image that must never get a card. */
const interVar = makeAsset({
  id: "inter",
  type: "font",
  name: "Inter-Var",
  originalName: "Inter-Var.woff2",
  src: "blob:inter",
  mimeType: "font/woff2",
});
const grotesk = makeAsset({
  id: "grotesk",
  type: "font",
  name: "Space_Grotesk-Bold",
  originalName: "Space_Grotesk-Bold.otf",
  src: "https://cdn/grotesk.otf",
  mimeType: "font/otf",
  siteFont: true,
});
const hero = makeAsset({ id: "hero", originalName: "hero-dark.jpg", src: "blob:hero", mimeType: "image/jpeg" });

/** A composer with a real event bus — the doors emit, the dialog listens. */
function makeComposer(initial: MediaAsset[]) {
  const bus = new EventEmitter();
  const mediaBus = new EventEmitter();
  const assets = [...initial];
  const updateAsset = vi.fn(async (id: string, updates: Partial<MediaAsset>) => {
    const i = assets.findIndex((a) => a.id === id);
    if (i < 0) return null;
    assets[i] = { ...assets[i], ...updates };
    mediaBus.emit("media:updated", { asset: assets[i], changes: updates });
    return assets[i];
  });
  const composer = {
    on: (e: string, h: (p: unknown) => void) => bus.on(e, h),
    off: (e: string, h: (p: unknown) => void) => bus.off(e, h),
    emit: (e: string, p?: unknown) => bus.emit(e, p),
    media: {
      on: (e: string, h: (p: unknown) => void) => mediaBus.on(e, h),
      off: (e: string, h: (p: unknown) => void) => mediaBus.off(e, h),
      getAssets: vi.fn((o?: { type?: string }) => assets.filter((a) => !o?.type || a.type === o.type)),
      updateAsset,
    },
  } as unknown as Composer;
  const upload = (asset: MediaAsset) => {
    assets.push(asset);
    mediaBus.emit("media:added", asset);
  };
  return { composer, updateAsset, upload };
}

function mount(initial: MediaAsset[] = [interVar, grotesk, hero]) {
  const made = makeComposer(initial);
  const utils = render(<SiteFontsModal composer={made.composer} />);
  return { ...utils, ...made };
}

function open(composer: Composer, assetId?: string) {
  act(() => {
    composer.emit("ui:site-fonts", assetId ? { assetId } : {});
  });
}

const dialog = () => screen.getByTestId("site-fonts");
const card = (id: string) => within(screen.getByTestId(`site-font-${id}`));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Clone 3686:42317 · Assets · Site fonts", () => {
  it("is closed until a door emits ui:site-fonts, then reads the board's copy with one card per font FILE", () => {
    const { composer } = mount();
    expect(screen.queryByTestId("site-fonts")).toBeNull();

    open(composer);

    expect(screen.getByTestId("site-fonts-title")).toHaveTextContent("Site fonts");
    expect(screen.getByTestId("site-fonts-body")).toHaveTextContent(
      "Manage this site's fonts. Built-in Inter stays available.",
    );
    expect(screen.getByTestId("site-fonts-search")).toHaveAttribute("placeholder", "Search fonts");
    expect(screen.getByTestId("site-fonts-section")).toHaveTextContent("Uploaded fonts");

    // `<Family> · <file>` — the family is what the FontManager derives from
    // the file (stem, `-`/`_` → spaces), not the display name.
    expect(card("inter").getByTestId("site-font-name-inter")).toHaveTextContent("Inter Var · Inter-Var.woff2");
    expect(card("inter").getByTestId("site-font-sample-inter")).toHaveTextContent(
      "The quick brown fox jumps over the lazy dog.",
    );
    expect(card("inter").getByTestId("site-font-add-inter")).toHaveTextContent("Add font");
    expect(card("inter").queryByTestId("site-font-remove-inter")).toBeNull();

    // An added font reads Added, with the code's undo beside it.
    expect(card("grotesk").getByTestId("site-font-name-grotesk")).toHaveTextContent(
      "Space Grotesk Bold · Space_Grotesk-Bold.otf",
    );
    expect(card("grotesk").getByTestId("site-font-added-grotesk")).toHaveTextContent("Added");
    expect(card("grotesk").getByTestId("site-font-remove-grotesk")).toHaveTextContent("Remove");
    expect(card("grotesk").queryByTestId("site-font-add-grotesk")).toBeNull();

    // Font files only.
    expect(screen.queryByTestId("site-font-hero")).toBeNull();
    expect(screen.getByTestId("site-fonts-cancel")).toHaveTextContent("Cancel");
  });

  it("the file the door named is highlighted; the others are not", () => {
    const { composer } = mount();
    open(composer, "grotesk");
    expect(screen.getByTestId("site-font-grotesk")).toHaveAttribute("data-highlighted", "true");
    expect(screen.getByTestId("site-font-inter")).not.toHaveAttribute("data-highlighted");
  });

  it("Cancel closes the dialog", () => {
    const { composer } = mount();
    open(composer);
    fireEvent.click(screen.getByTestId("site-fonts-cancel"));
    expect(screen.queryByTestId("site-fonts")).toBeNull();
  });

  it("with no font in the library it says so, naming the code's own accepted files", () => {
    const { composer } = mount([hero]);
    open(composer);
    expect(screen.getByTestId("site-fonts-empty")).toHaveTextContent(
      "No uploaded fonts yet. Upload a .woff2, .woff, .ttf or .otf file to the Asset library to add it here.",
    );
    expect(screen.queryByTestId("site-fonts-list")).toBeNull();
  });

  it("a font uploaded while the dialog is open gets a card — the list follows the library's events", () => {
    const { composer, upload } = mount([interVar]);
    open(composer);
    expect(screen.queryByTestId("site-font-grotesk")).toBeNull();
    act(() => upload(grotesk));
    expect(screen.getByTestId("site-font-grotesk")).toBeInTheDocument();
  });

  it("loads one sample face per file while open — so an un-added font still previews — and drops them on close", () => {
    const faces = new Set<{ family: string; source: string }>();
    class MockFontFace {
      constructor(public family: string, public source: string) {}
      load = vi.fn(async () => this);
    }
    vi.stubGlobal("FontFace", MockFontFace);
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: {
        add: (f: { family: string; source: string }) => faces.add(f),
        delete: (f: { family: string; source: string }) => faces.delete(f),
      },
    });

    const { composer } = mount();
    open(composer);
    expect(faces.size).toBe(2);
    const sources = [...faces].map((f) => f.source);
    expect(sources).toContain("url(blob:inter)");
    expect(sources).toContain("url(https://cdn/grotesk.otf)");
    // The sample is set in the face the dialog loaded, not in the family the
    // FontManager registers — that face is the pickers', and it is gone for
    // an un-added file.
    const interFace = [...faces].find((f) => f.source === "url(blob:inter)")!;
    expect(screen.getByTestId("site-font-sample-inter").style.fontFamily).toContain(interFace.family);

    fireEvent.click(screen.getByTestId("site-fonts-cancel"));
    expect(faces.size).toBe(0);
  });
});

describe("Clone 3695:45594 · Assets · Font added", () => {
  it("Add font writes siteFont: true and swaps to Font added, naming the family; Done closes everything", async () => {
    const { composer, updateAsset } = mount();
    open(composer);

    fireEvent.click(card("inter").getByTestId("site-font-add-inter"));

    await waitFor(() => expect(updateAsset).toHaveBeenCalledWith("inter", { siteFont: true }));
    const added = await screen.findByTestId("site-fonts-added");
    expect(within(added).getByTestId("site-fonts-added-title")).toHaveTextContent("Font added");
    expect(within(added).getByTestId("site-fonts-added-body")).toHaveTextContent(
      "Uploaded Inter Var is now available in the font pickers. Existing text is unchanged until you choose this font.",
    );
    expect(screen.queryByTestId("site-fonts")).toBeNull();

    fireEvent.click(within(added).getByTestId("site-fonts-added-done"));
    expect(screen.queryByTestId("site-fonts-added")).toBeNull();
    expect(screen.queryByTestId("site-fonts")).toBeNull();
  });

  it("Manage site fonts goes back to Site fonts, where the card now reads Added · Remove", async () => {
    const { composer } = mount();
    open(composer);
    fireEvent.click(card("inter").getByTestId("site-font-add-inter"));
    const added = await screen.findByTestId("site-fonts-added");

    fireEvent.click(within(added).getByTestId("site-fonts-added-manage"));

    expect(dialog()).toBeInTheDocument();
    expect(card("inter").getByTestId("site-font-added-inter")).toHaveTextContent("Added");
    expect(card("inter").getByTestId("site-font-remove-inter")).toBeInTheDocument();
    expect(card("inter").queryByTestId("site-font-add-inter")).toBeNull();
  });

  it("Remove writes siteFont: false and the card offers Add font again", async () => {
    const { composer, updateAsset } = mount();
    open(composer);

    fireEvent.click(card("grotesk").getByTestId("site-font-remove-grotesk"));

    await waitFor(() => expect(updateAsset).toHaveBeenCalledWith("grotesk", { siteFont: false }));
    expect(card("grotesk").getByTestId("site-font-add-grotesk")).toBeInTheDocument();
    expect(card("grotesk").queryByTestId("site-font-added-grotesk")).toBeNull();
    // Removing is the undo; it has no result dialog of its own.
    expect(screen.queryByTestId("site-fonts-added")).toBeNull();
    expect(dialog()).toBeInTheDocument();
  });
});

describe("Clone 3695:45606 · Assets · No fonts found", () => {
  it("search narrows the cards as you type; Enter on a query nothing matches swaps to No fonts found", () => {
    const { composer } = mount();
    open(composer);
    const search = screen.getByTestId("site-fonts-search");

    fireEvent.change(search, { target: { value: "grot" } });
    expect(screen.queryByTestId("site-font-inter")).toBeNull();
    expect(screen.getByTestId("site-font-grotesk")).toBeInTheDocument();

    // A match by the file name, not only the family.
    fireEvent.change(search, { target: { value: "woff2" } });
    expect(screen.getByTestId("site-font-inter")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "interx" } });
    expect(screen.queryByTestId("site-font-inter")).toBeNull();
    expect(screen.queryByTestId("site-font-grotesk")).toBeNull();
    expect(screen.queryByTestId("site-fonts-none")).toBeNull();

    fireEvent.keyDown(search, { key: "Enter" });

    const none = screen.getByTestId("site-fonts-none");
    expect(within(none).getByTestId("site-fonts-none-title")).toHaveTextContent("No fonts found");
    expect(within(none).getByTestId("site-fonts-none-body")).toHaveTextContent(
      'No fonts match "interx". Clear the search to browse available fonts.',
    );
    expect(screen.queryByTestId("site-fonts")).toBeNull();
  });

  it("Enter on a query that matches stays on the list", () => {
    const { composer } = mount();
    open(composer);
    const search = screen.getByTestId("site-fonts-search");
    fireEvent.change(search, { target: { value: "inter" } });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(dialog()).toBeInTheDocument();
    expect(screen.queryByTestId("site-fonts-none")).toBeNull();
  });

  it("Clear search returns to Site fonts with the query cleared and every card back", () => {
    const { composer } = mount();
    open(composer);
    const search = screen.getByTestId("site-fonts-search");
    fireEvent.change(search, { target: { value: "interx" } });
    fireEvent.keyDown(search, { key: "Enter" });

    fireEvent.click(within(screen.getByTestId("site-fonts-none")).getByTestId("site-fonts-none-clear"));

    expect(dialog()).toBeInTheDocument();
    expect(screen.getByTestId("site-fonts-search")).toHaveValue("");
    expect(screen.getByTestId("site-font-inter")).toBeInTheDocument();
    expect(screen.getByTestId("site-font-grotesk")).toBeInTheDocument();
  });

  it("Cancel on No fonts found closes everything", () => {
    const { composer } = mount();
    open(composer);
    const search = screen.getByTestId("site-fonts-search");
    fireEvent.change(search, { target: { value: "interx" } });
    fireEvent.keyDown(search, { key: "Enter" });

    fireEvent.click(within(screen.getByTestId("site-fonts-none")).getByTestId("site-fonts-none-cancel"));

    expect(screen.queryByTestId("site-fonts-none")).toBeNull();
    expect(screen.queryByTestId("site-fonts")).toBeNull();
  });

  it("a reopened dialog starts clean — no query, list view", () => {
    const { composer } = mount();
    open(composer);
    fireEvent.change(screen.getByTestId("site-fonts-search"), { target: { value: "interx" } });
    fireEvent.keyDown(screen.getByTestId("site-fonts-search"), { key: "Enter" });
    fireEvent.click(screen.getByTestId("site-fonts-none-cancel"));

    open(composer);

    expect(dialog()).toBeInTheDocument();
    expect(screen.getByTestId("site-fonts-search")).toHaveValue("");
  });
});
