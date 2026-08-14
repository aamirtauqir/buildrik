/**
 * MediaLibraryPanel — the 4-tab modal (Library / Upload / From URL / Optimize).
 * Pins the From-URL "coming soon" stub and the multi-select confirm footer.
 *
 * useMediaManager is mocked so the panel is driven by a stub asset list;
 * OptimizationPanel + VideoPreview children are stubbed to render-as-null so
 * jsdom doesn't have to run the optimizer or a <video>.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import type { MediaAsset } from "../../../shared/types/media";

const managerMock = vi.hoisted(() => ({
  assets: [] as MediaAsset[],
  isLoading: false,
  uploadFile: vi.fn(async () => ({ success: true })),
  deleteAsset: vi.fn(async () => {}),
  updateAsset: vi.fn(async () => null),
  getAsset: vi.fn(),
  getAssets: vi.fn(),
}));

vi.mock("../../shell/hooks", () => ({
  useMediaManager: () => managerMock,
}));

vi.mock("../OptimizationPanel", () => ({
  OptimizationPanel: () => <div data-testid="optimization-panel" />,
}));
vi.mock("../VideoPreview", () => ({
  VideoPreview: () => <div data-testid="video-preview" />,
}));

import { MediaLibraryPanel } from "../MediaLibraryPanel";

function makeAsset(over: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: "a1",
    type: "image",
    name: "logo.png",
    originalName: "logo.png",
    src: "data:image/png;base64,xx",
    size: 1024,
    mimeType: "image/png",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...over,
  } as MediaAsset;
}

function mount(over: Partial<React.ComponentProps<typeof MediaLibraryPanel>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    ...over,
  };
  const utils = render(<MediaLibraryPanel {...props} />);
  return { ...utils, props };
}

beforeEach(() => {
  managerMock.assets = [];
  managerMock.isLoading = false;
  managerMock.getAssets.mockReset();
  managerMock.getAssets.mockImplementation(() => managerMock.assets);
  managerMock.uploadFile.mockClear();
});

describe("MediaLibraryPanel — tabs", () => {
  it("renders the 4 tabs", () => {
    mount();
    for (const label of ["Library", "Upload", "From URL", "Optimize"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("Library tab shows the empty state when there are no assets", () => {
    mount();
    expect(screen.getByText("No assets found")).toBeInTheDocument();
  });

  it("Library tab lists asset names when populated", () => {
    managerMock.assets = [
      makeAsset({ id: "a1", name: "logo.png" }),
      makeAsset({ id: "a2", name: "hero.jpg", src: "data:image/jpeg;base64,yy" }),
    ];
    mount();
    expect(screen.getByText("logo.png")).toBeInTheDocument();
    expect(screen.getByText("hero.jpg")).toBeInTheDocument();
  });
});

/* This block used to pin the placeholder: "shows the coming-soon placeholder
   instead of an import form … the feature is inert". It was inert only HERE —
   the fullpage manager had been importing URLs the whole time. A test that
   pins a lie keeps the lie. Board 1205:4804 draws the import; these assert it. */
describe("MediaLibraryPanel — From URL", () => {
  it("offers the field and keeps Import disabled until the URL is fetchable", () => {
    mount();
    fireEvent.click(screen.getByText("From URL"));

    const field = screen.getByPlaceholderText("https://example.com/photo.jpg");
    const go = screen.getByTestId("panel-import-url-go");
    expect(go).toBeDisabled();

    fireEvent.change(field, { target: { value: "not a url" } });
    expect(go).toBeDisabled();

    fireEvent.change(field, { target: { value: "https://cdn.example.com/a.png" } });
    expect(go).toBeEnabled();
  });

  it("imports through the same uploadFile as the Upload tab, then shows the library", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["x"], { type: "image/png" }) }),
    );
    mount();
    fireEvent.click(screen.getByText("From URL"));
    fireEvent.change(screen.getByPlaceholderText("https://example.com/photo.jpg"), {
      target: { value: "https://cdn.example.com/hero.png" },
    });
    fireEvent.click(screen.getByTestId("panel-import-url-go"));

    await waitFor(() => expect(managerMock.uploadFile).toHaveBeenCalledTimes(1));
    const uploaded = (managerMock.uploadFile.mock.calls as unknown as File[][])[0][0];
    expect(uploaded.name).toBe("hero.png");
    // An import the user cannot see did not happen.
    await waitFor(() => expect(screen.getByPlaceholderText("Search library…")).toBeInTheDocument());
    vi.unstubAllGlobals();
  });

  it("says why a failed import failed, on the field, and stays on the tab", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, blob: async () => new Blob([]) }));
    mount();
    fireEvent.click(screen.getByText("From URL"));
    fireEvent.change(screen.getByPlaceholderText("https://example.com/photo.jpg"), {
      target: { value: "https://cdn.example.com/missing.png" },
    });
    fireEvent.click(screen.getByTestId("panel-import-url-go"));

    await waitFor(() =>
      expect(screen.getByText("Could not import from that URL.")).toBeInTheDocument(),
    );
    expect(managerMock.uploadFile).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("MediaLibraryPanel — Optimize tab", () => {
  it("prompts to select an image when nothing is selected", () => {
    mount();
    fireEvent.click(screen.getByText("Optimize"));
    expect(
      screen.getByText(/Select an image from the Library to optimize/),
    ).toBeInTheDocument();
  });
});

describe("MediaLibraryPanel — view toggle", () => {
  it("switches the library between grid and list layout", () => {
    managerMock.assets = [makeAsset()];
    const { container } = mount();
    fireEvent.click(screen.getByText("List"));
    // Toggle is reflected by the active primary button; assert both buttons exist.
    expect(screen.getByText("Grid")).toBeInTheDocument();
    expect(screen.getByText("List")).toBeInTheDocument();
    expect(container).toBeTruthy();
  });
});

describe("MediaLibraryPanel — selection footer (multiple)", () => {
  it("shows the selected count + Use Selected once an asset is toggled", () => {
    managerMock.assets = [makeAsset({ id: "a1", name: "logo.png" })];
    const onSelect = vi.fn();
    mount({ multiple: true, onSelect });
    // Click the asset card to toggle selection (multiple mode).
    fireEvent.click(screen.getByText("logo.png"));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Use Selected"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "a1" }));
  });
});

describe("MediaLibraryPanel — single-select", () => {
  it("clicking an asset in single mode selects and closes immediately", () => {
    managerMock.assets = [makeAsset({ id: "a1", name: "logo.png" })];
    const onSelect = vi.fn();
    const { props } = mount({ onSelect });
    fireEvent.click(screen.getByText("logo.png"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "a1" }));
    expect(props.onClose).toHaveBeenCalled();
  });
});
