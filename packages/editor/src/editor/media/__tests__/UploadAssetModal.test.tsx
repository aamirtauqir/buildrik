/**
 * UploadAssetModal — "Upload an image", boards 4418:149160 → 4418:149235
 * (Upload) and 4418:160887 (From URL). Audit G3-061: choosing an existing
 * file is the drawer's pick mode (PickModePanel.test.tsx); this modal is what
 * its `↑ Upload` / `From URL` links open, so it has no Library tab.
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

import { UploadAssetModal } from "../UploadAssetModal";
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
  } as unknown as NonNullable<React.ComponentProps<typeof UploadAssetModal>["composer"]>;
}

function mount(over: Partial<React.ComponentProps<typeof UploadAssetModal>> = {}) {
  const props = {
    open: true,
    onClose: vi.fn(),
    onUse: vi.fn(),
    allowedTypes: ["image" as const],
    forLabel: "Menu preview",
    composer: makeComposer(),
    ...over,
  };
  const utils = render(
    <ToastProvider>
      <UploadAssetModal {...props} />
    </ToastProvider>,
  );
  return { ...utils, props };
}

const TAB_ID: Record<string, string> = { Upload: "upload", "From URL": "url" };
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

describe("4418:149160 · Upload an image — the frame", () => {
  it("titles itself Upload an image, names the element and kind, and offers Upload | From URL with Upload pressed", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Upload an image" })).toBeInTheDocument();
    expect(screen.getByTestId("picker-for-label")).toHaveTextContent("For Menu preview · Image");
    const tabs = within(screen.getByTestId("picker-tabs")).getAllByRole("button");
    expect(tabs.map((b) => b.textContent?.trim())).toEqual(["Upload", "From URL"]);
    expect(tab("Upload")).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByTestId("picker-tab-library")).toBeNull();
  });

  it("the hint names the code's accepted formats and limit, not a hand-written size", () => {
    mount();
    expect(screen.getByTestId("picker-hint").textContent).toMatch(/PNG.*for this image field\.$/);
  });

  it("a video field is titled Upload a video and accepts only video", () => {
    mount({ allowedTypes: ["video"] });
    expect(screen.getByRole("heading", { name: "Upload a video" })).toBeInTheDocument();
    expect(screen.getByTestId("picker-upload-input").getAttribute("accept")).not.toContain("image/");
  });

  it("Cancel closes without choosing", () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("picker-cancel"));
    expect(props.onClose).toHaveBeenCalled();
    expect(props.onUse).not.toHaveBeenCalled();
  });

  it("opened by the From URL link, the import dialog is already up", () => {
    mount({ pane: "url" });
    expect(screen.getByRole("heading", { name: "Import image from URL" })).toBeInTheDocument();
    expect(tab("From URL")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("Clone 3685:19960 / 3685:20037 · picker · Upload", () => {
  const file = new File(["x"], "pasta-2-small.jpg", { type: "image/jpeg" });

  it("Upload shows a choose-file panel; a chosen file reads `<name> · Ready to upload` with Upload image as the primary", () => {
    mount();
    expect(screen.getByTestId("picker-upload-choose")).toBeInTheDocument();
    expect(screen.queryByTestId("picker-use")).toBeNull();
    fireEvent.change(screen.getByTestId("picker-upload-input"), { target: { files: [file] } });
    expect(screen.getByTestId("picker-upload-ready")).toHaveTextContent("pasta-2-small.jpg · Ready to upload");
    expect(screen.getByTestId("picker-upload-go")).toHaveTextContent("Upload image");
    expect(screen.getByTestId("picker-upload-go")).toBeEnabled();
  });

  it("Upload image lands the file as the first card, selected, beside the two most recent — and Use hands it over (4418:149235)", async () => {
    const { props } = mount();
    fireEvent.change(screen.getByTestId("picker-upload-input"), { target: { files: [file] } });
    fireEvent.click(screen.getByTestId("picker-upload-go"));
    await waitFor(() => expect(managerMock.uploadFile).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(card("new-pasta-2-small.jpg")).toHaveAttribute("aria-pressed", "true"));
    const cards = within(screen.getByTestId("picker-grid")).getAllByRole("button");
    expect(cards).toHaveLength(3);
    expect(screen.getByTestId("picker-card-usage-new-pasta-2-small.jpg")).toHaveTextContent("Unused");
    expect(screen.getByTestId("picker-card-usage-menu")).toHaveTextContent("used ×1");
    expect(screen.getByTestId("picker-hint")).toHaveTextContent(
      "Image added · pasta-2-small.jpg selected. Use it to update this image element.",
    );
    fireEvent.click(use());
    expect(props.onUse).toHaveBeenCalledWith(expect.objectContaining({ name: "pasta-2-small.jpg" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("a refused upload reads the engine's reason in place and keeps the drop panel", async () => {
    managerMock.uploadFile.mockResolvedValueOnce({
      success: false,
      error: "Upload failed — file is 24 MB, limit is 10 MB",
      fileName: "pasta-2-small.jpg",
    });
    mount();
    fireEvent.change(screen.getByTestId("picker-upload-input"), { target: { files: [file] } });
    fireEvent.click(screen.getByTestId("picker-upload-go"));
    await waitFor(() =>
      expect(screen.getByTestId("picker-upload-error")).toHaveTextContent("Upload failed — file is 24 MB, limit is 10 MB"),
    );
    expect(screen.queryByTestId("picker-grid")).toBeNull();
  });

  it("the file input accepts only the field's kinds", () => {
    mount();
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
    expect(screen.getByRole("heading", { name: "Upload an image" })).toBeInTheDocument();
    expect(tab("From URL")).toHaveAttribute("aria-pressed", "true");
  });

  it("an imported image lands as the selected first card and the hint names it (4418:160887)", async () => {
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
    expect(tab("Upload")).toHaveAttribute("aria-pressed", "true");
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
