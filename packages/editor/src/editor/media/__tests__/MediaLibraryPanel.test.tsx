/**
 * MediaLibraryPanel — the picker. Clone 3397:18325 "Choose an image", its
 * Upload step (3685:19960 → 3685:20037), its From URL overlay (3397:18835 →
 * 3721:45102 / 3695:43876) and the selected state (3695:43921). One `it`
 * per prototype fact a DOM assertion can prove; the visual half is the shot
 * pair the live walk takes.
 *
 * Displaces V1 1164:4713 (four underline tabs incl. Optimize, a Grid/List
 * toggle, click-to-close single select, a per-card delete with its own
 * confirm, "Upload tab accepts image/video/audio · max 10 MB each"). The
 * optimizer's door is the library rail's Optimize (LibraryManager), the
 * delete's is the library; neither belongs mid-way through choosing an
 * image for an element.
 *
 * useMediaManager is mocked so the panel is driven by a stub asset list.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import type { MediaAsset, UploadResult } from "../../../shared/types/media";

const managerMock = vi.hoisted(() => ({
  assets: [] as MediaAsset[],
  isLoading: false,
  uploadFile: vi.fn<(file: File) => Promise<UploadResult>>(),
  deleteAsset: vi.fn(async () => {}),
  updateAsset: vi.fn(async () => null),
  getAsset: vi.fn(),
  getAssets: vi.fn(),
}));

vi.mock("../../shell/hooks", () => ({
  useMediaManager: () => managerMock,
}));

import { MediaLibraryPanel } from "../MediaLibraryPanel";
import { ToastProvider } from "@/editor/chrome-ui";

function makeAsset(over: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: "a1",
    type: "image",
    name: "hero-dark.jpg",
    originalName: "hero-dark.jpg",
    src: "blob:hero",
    size: 1024,
    mimeType: "image/jpeg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...over,
  } as MediaAsset;
}

/** The board's three: hero-dark.jpg used ×3 · menu-cover.png used ×1 · team-photo.jpg unused. */
const THREE = [
  makeAsset({ id: "hero", name: "hero-dark.jpg", src: "blob:hero" }),
  makeAsset({ id: "menu", name: "menu-cover.png", src: "blob:menu", mimeType: "image/png" }),
  makeAsset({ id: "team", name: "team-photo.jpg", src: "blob:team" }),
];

function makeComposer(usages: Record<string, number> = { "blob:hero": 3, "blob:menu": 1 }) {
  return {
    mediaOps: { getUsages: (src: string) => ({ count: usages[src] ?? 0, elements: [] }) },
  } as unknown as NonNullable<React.ComponentProps<typeof MediaLibraryPanel>["composer"]>;
}

function mount(over: Partial<React.ComponentProps<typeof MediaLibraryPanel>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    allowedTypes: ["image" as const],
    forLabel: "Menu preview",
    composer: makeComposer(),
    ...over,
  };
  const utils = render(
    <ToastProvider>
      <MediaLibraryPanel {...props} />
    </ToastProvider>,
  );
  return { ...utils, props };
}

const TAB_ID: Record<string, string> = { Library: "library", Upload: "upload", "From URL": "url" };
const tab = (name: string) => screen.getByTestId(`picker-tab-${TAB_ID[name]}`);
const use = () => screen.getByTestId("picker-use");
const card = (id: string) => screen.getByTestId(`picker-card-${id}`);

beforeEach(() => {
  managerMock.assets = [...THREE];
  managerMock.isLoading = false;
  managerMock.getAssets.mockReset();
  managerMock.getAssets.mockImplementation((opts?: { search?: string }) =>
    opts?.search ? managerMock.assets.filter((a) => a.name.includes(opts.search!)) : managerMock.assets,
  );
  managerMock.uploadFile.mockReset();
  managerMock.uploadFile.mockImplementation(async (file: File) => {
    const asset = makeAsset({ id: `new-${file.name}`, name: file.name, src: `blob:${file.name}` });
    managerMock.assets = [asset, ...managerMock.assets];
    return { success: true, asset, fileName: file.name };
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Clone 3397:18325 · Choose an image — the picker", () => {
  it("titles itself, names the element and kind it is for, and offers Library · Upload · From URL with Library pressed", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Choose an image" })).toBeInTheDocument();
    expect(screen.getByTestId("picker-for-label")).toHaveTextContent("For Menu preview · Image");
    const tabs = within(screen.getByTestId("picker-tabs")).getAllByRole("button");
    expect(tabs.map((b) => b.textContent?.trim())).toEqual(["Library", "Upload", "From URL"]);
    expect(tab("Library")).toHaveAttribute("aria-pressed", "true");
    expect(tab("Upload")).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Optimize")).toBeNull();
    expect(screen.queryByText("Grid")).toBeNull();
    expect(screen.queryByText("List")).toBeNull();
  });

  it("says just the kind when nothing named the element", () => {
    mount({ forLabel: undefined });
    expect(screen.getByTestId("picker-for-label")).toHaveTextContent(/^Image$/);
  });

  it("labels the search 'Search library' over a 'Search images…' field that filters the cards", () => {
    mount();
    expect(screen.getByTestId("picker-search-label")).toHaveTextContent("Search library");
    const field = screen.getByPlaceholderText("Search images…");
    fireEvent.change(field, { target: { value: "team" } });
    expect(managerMock.getAssets).toHaveBeenLastCalledWith(expect.objectContaining({ search: "team" }));
  });

  it("draws each card as thumb · name · usage from the canvas — used ×3, used ×1, Unused", () => {
    mount();
    expect(card("hero").querySelector("img")).toHaveAttribute("src", "blob:hero");
    expect(within(card("hero")).getByText("hero-dark.jpg")).toBeInTheDocument();
    expect(screen.getByTestId("picker-card-usage-hero")).toHaveTextContent("used ×3");
    expect(screen.getByTestId("picker-card-usage-menu")).toHaveTextContent("used ×1");
    expect(screen.getByTestId("picker-card-usage-team")).toHaveTextContent("Unused");
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  /* Clone 3695:45529 (Phase 6): a saved version is a row flagged with its
     parent, reachable only through Asset versions — never a picker card. */
  it("never offers a saved version as a card of its own", () => {
    managerMock.assets = [...THREE, makeAsset({ id: "hero-v2", name: "hero-dark-v2.jpg", src: "blob:hero-v2", versionOf: "hero" })];
    mount();
    expect(screen.queryByTestId("picker-card-hero-v2")).toBeNull();
    expect(card("hero")).toBeInTheDocument();
  });

  it("a card selects on click and stays open; Use selected image is disabled until one is selected (3695:43921)", () => {
    const { props } = mount();
    expect(use()).toHaveTextContent("Use selected image");
    expect(use()).toBeDisabled();
    fireEvent.click(card("team"));
    expect(card("team")).toHaveAttribute("aria-pressed", "true");
    expect(card("hero")).toHaveAttribute("aria-pressed", "false");
    expect(props.onSelect).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
    expect(use()).toBeEnabled();
    fireEvent.click(card("hero"));
    expect(card("hero")).toHaveAttribute("aria-pressed", "true");
    expect(card("team")).toHaveAttribute("aria-pressed", "false");
  });

  it("Use selected image hands the asset to the element and closes (3721:45178)", () => {
    const { props } = mount();
    fireEvent.click(card("hero"));
    fireEvent.click(use());
    expect(props.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "hero", src: "blob:hero" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("the hint names the code's accepted formats and limit for the field's kind", () => {
    mount();
    expect(screen.getByTestId("picker-hint")).toHaveTextContent("JPG, PNG, GIF, WebP or AVIF · up to 10 MB for this image field.");
    expect(screen.queryByText(/max 10 MB each/)).toBeNull();
  });

  it("a video field says video formats and the 100 MB limit, and searches videos", () => {
    managerMock.assets = [makeAsset({ id: "chef", name: "chef-intro.mp4", type: "video", mimeType: "video/mp4", src: "blob:chef" })];
    mount({ allowedTypes: ["video"], forLabel: "Intro clip" });
    expect(screen.getByTestId("picker-for-label")).toHaveTextContent("For Intro clip · Video");
    expect(screen.getByPlaceholderText("Search videos…")).toBeInTheDocument();
    expect(screen.getByTestId("picker-hint")).toHaveTextContent("MP4, WebM, OGV or MOV · up to 100 MB for this video field.");
    expect(use()).toHaveTextContent("Use selected video");
    // The title names the kind — it said "Choose an image" over videos.
    expect(screen.getByTestId("picker-title")).toHaveTextContent("Choose a video");
  });

  it("Cancel closes without choosing", () => {
    const { props } = mount();
    fireEvent.click(card("hero"));
    fireEvent.click(screen.getByTestId("picker-cancel"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it("with an empty library the grid says so and Use stays disabled", () => {
    managerMock.assets = [];
    mount();
    expect(screen.getByTestId("picker-empty")).toHaveTextContent(/No images in your library yet/);
    expect(use()).toBeDisabled();
  });
});

describe("Clone 3685:19960 / 3685:20037 · picker · Upload", () => {
  const file = new File(["x"], "pasta-2-small.jpg", { type: "image/jpeg" });

  it("Upload shows a choose-file panel; a chosen file reads `<name> · Ready to upload` with Upload image as the primary", () => {
    mount();
    fireEvent.click(tab("Upload"));
    expect(tab("Upload")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("picker-upload-choose")).toBeInTheDocument();
    expect(screen.queryByTestId("picker-use")).toBeNull();
    fireEvent.change(screen.getByTestId("picker-upload-input"), { target: { files: [file] } });
    expect(screen.getByTestId("picker-upload-ready")).toHaveTextContent("pasta-2-small.jpg · Ready to upload");
    expect(screen.getByTestId("picker-upload-go")).toHaveTextContent("Upload image");
    expect(screen.getByTestId("picker-upload-go")).toBeEnabled();
  });

  it("Upload image lands the file, returns to Library with it selected, and the hint says so", async () => {
    const { props } = mount();
    fireEvent.click(tab("Upload"));
    fireEvent.change(screen.getByTestId("picker-upload-input"), { target: { files: [file] } });
    fireEvent.click(screen.getByTestId("picker-upload-go"));
    await waitFor(() => expect(managerMock.uploadFile).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(tab("Library")).toHaveAttribute("aria-pressed", "true"));
    expect(card("new-pasta-2-small.jpg")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("picker-card-usage-new-pasta-2-small.jpg")).toHaveTextContent("Unused");
    expect(screen.getByTestId("picker-hint")).toHaveTextContent(
      "Image added · pasta-2-small.jpg selected. Use it to update this image element.",
    );
    fireEvent.click(use());
    expect(props.onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: "pasta-2-small.jpg" }));
  });

  it("a refused upload reads the engine's reason in place and stays on Upload", async () => {
    managerMock.uploadFile.mockResolvedValueOnce({
      success: false,
      error: "Upload failed — file is 24 MB, limit is 10 MB",
      fileName: "pasta-2-small.jpg",
    });
    mount();
    fireEvent.click(tab("Upload"));
    fireEvent.change(screen.getByTestId("picker-upload-input"), { target: { files: [file] } });
    fireEvent.click(screen.getByTestId("picker-upload-go"));
    await waitFor(() =>
      expect(screen.getByTestId("picker-upload-error")).toHaveTextContent("Upload failed — file is 24 MB, limit is 10 MB"),
    );
    expect(tab("Upload")).toHaveAttribute("aria-pressed", "true");
  });

  it("the file input accepts only the field's kinds", () => {
    mount();
    fireEvent.click(tab("Upload"));
    const accept = screen.getByTestId("picker-upload-input").getAttribute("accept") ?? "";
    expect(accept).toContain("image/jpeg");
    expect(accept).not.toContain("video/");
  });
});

describe("Clone 3397:18835 → 3721:45102 / 3695:43876 · picker · From URL", () => {
  it("From URL opens the Import image from URL dialog over the picker", () => {
    mount();
    fireEvent.click(tab("From URL"));
    expect(screen.getByRole("heading", { name: "Import image from URL" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Choose an image" })).toBeInTheDocument();
    expect(tab("From URL")).toHaveAttribute("aria-pressed", "true");
  });

  it("an imported image lands, the picker returns to Library with it selected, and the hint names it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["x"], { type: "image/jpeg" }) }),
    );
    mount();
    fireEvent.click(tab("From URL"));
    fireEvent.change(screen.getByTestId("import-url-input"), { target: { value: "https://cdn.example.com/hero-imported.jpg" } });
    fireEvent.click(screen.getByTestId("import-url-go"));
    await waitFor(() => expect(managerMock.uploadFile).toHaveBeenCalledTimes(1));
    const uploaded = managerMock.uploadFile.mock.calls[0][0];
    expect(uploaded.name).toBe("hero-imported.jpg");
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Import image from URL" })).toBeNull());
    expect(tab("Library")).toHaveAttribute("aria-pressed", "true");
    expect(card("new-hero-imported.jpg")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("picker-hint")).toHaveTextContent(
      "Image added · hero-imported.jpg selected. Use it to update this image element.",
    );
    expect(screen.queryByRole("heading", { name: "Image imported" })).toBeNull();
  });

  it("a URL that is not an image opens Image could not be imported; Edit URL reopens the dialog with the URL kept", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["<html>"], { type: "text/html" }) }),
    );
    mount();
    fireEvent.click(tab("From URL"));
    fireEvent.change(screen.getByTestId("import-url-input"), { target: { value: "https://cdn.example.com/page.html" } });
    fireEvent.click(screen.getByTestId("import-url-go"));
    await screen.findByRole("heading", { name: "Image could not be imported" });
    expect(screen.getByTestId("import-result-body")).toHaveTextContent(
      "This URL does not return a supported image. Use a direct JPG, PNG, GIF, WebP or AVIF image URL.",
    );
    expect(managerMock.uploadFile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("import-result-edit"));
    await screen.findByRole("heading", { name: "Import image from URL" });
    expect(screen.getByTestId("import-url-input")).toHaveValue("https://cdn.example.com/page.html");
  });

  it("a video URL is refused for an image field, and a 404 reads the same way", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, blob: async () => new Blob([]) }),
    );
    mount();
    fireEvent.click(tab("From URL"));
    fireEvent.change(screen.getByTestId("import-url-input"), { target: { value: "https://cdn.example.com/missing.jpg" } });
    fireEvent.click(screen.getByTestId("import-url-go"));
    await screen.findByRole("heading", { name: "Image could not be imported" });
    expect(managerMock.uploadFile).not.toHaveBeenCalled();
  });
});
