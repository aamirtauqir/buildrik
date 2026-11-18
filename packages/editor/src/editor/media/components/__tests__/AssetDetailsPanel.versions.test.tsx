/**
 * AssetDetailsPanel — the VERSIONS block (Clone 3695:45529 / 3697:20326,
 * Phase 6), used-in counts, replace-all picker, action row routing.
 * Complements the existing AssetDetailsPanel.altText.test.tsx (P7 alt-text
 * coverage).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { LibraryItem, VersionEntry } from "@/editor/sidebar/tabs/media/data/mediaTypes";
import { AssetDetailsPanel, type AssetDetailsPanelProps } from "../AssetDetailsPanel";

function makeItem(over: Partial<LibraryItem> = {}): LibraryItem {
  return {
    key: "asset-1",
    name: "logo.png",
    type: "img",
    src: "https://example.com/logo.png",
    thumb: "https://example.com/logo-thumb.png",
    size: 4096,
    createdAt: "2026-07-01T10:00:00.000Z",
    mimeType: "image/png",
    assetSource: "uploaded",
    ...over,
  } as LibraryItem;
}

function makeComposer() {
  return {
    mediaOps: {
      replaceAcross: vi.fn(() => ({ replaced: ["el-1", "el-2"], failed: [] })),
      getUsagesByPage: vi.fn(() => new Map()),
    },
    elements: { getAllPages: vi.fn(() => []) },
  } as unknown as AssetDetailsPanelProps["composer"];
}

function mount(over: Partial<AssetDetailsPanelProps> = {}) {
  const props: AssetDetailsPanelProps = {
    selectedItem: makeItem(),
    versions: [],
    usageCount: 0,
    libraryItems: [],
    onOpenVersions: vi.fn(),
    onInsert: vi.fn(),
    onEditImage: vi.fn(),
    onOpenRename: vi.fn(),
    onRequestDelete: vi.fn(),
    composer: makeComposer(),
    addToast: vi.fn(),
    ...over,
  };
  const utils = render(<AssetDetailsPanel {...props} />);
  return { ...utils, props };
}

function entry(item: LibraryItem, index: number, placements = 0, pages: string[] = []): VersionEntry {
  return { item, index, placements, pages };
}

describe("AssetDetailsPanel — empty + details", () => {
  it("renders the placeholder when no asset is selected", () => {
    mount({ selectedItem: null });
    expect(screen.getByText("Select an asset to see details.")).toBeInTheDocument();
  });

  // 2L9 199:37199 — the name heads the rail; one facts line under the preview.
  it("renders filename and the one-line meta", () => {
    mount({ selectedItem: makeItem({ width: 640, height: 480 }) });
    expect(screen.getByTestId("mgr-det-title")).toHaveTextContent("logo.png");
    expect(screen.getByTestId("mgr-det-meta")).toHaveTextContent("640 × 480 · PNG · 4 KB");
  });
});

/* The marker follows the placements (199:38433): the version the site
   carries reads Selected, the rest Available; a row swaps nothing. */
describe("AssetDetailsPanel — Versions tab (199:38433)", () => {
  const original = makeItem({ key: "hero", name: "hero-dark", displayName: "hero-dark.jpg", src: "https://example.com/hero.jpg" });
  const saved = makeItem({
    key: "hero-v2",
    name: "hero-dark-v2",
    src: "https://example.com/hero-v2.jpg",
    versionOf: "hero",
    createdAt: "2026-09-02T10:00:00.000Z",
  });
  const open = () => fireEvent.click(screen.getByTestId("mgr-det-tab-versions"));

  it("once v2 is applied, v2 reads Selected and v1 Available, newest first", () => {
    mount({ selectedItem: original, versions: [entry(original, 1), entry(saved, 2, 3, ["Home"])] });
    open();
    const rows = within(screen.getByTestId("mgr-det-versions")).getAllByTestId(/^mgr-det-version-/);
    expect(rows.map((r) => r.getAttribute("data-testid"))).toEqual(["mgr-det-version-hero-v2", "mgr-det-version-hero"]);
    expect(rows[0]).toHaveTextContent("Version 2 · Selected · Used in 1 page");
    expect(rows[1]).toHaveTextContent("Version 1 · Available");
  });

  it("a row opens Asset versions; nothing on the row swaps the site's placements", () => {
    const { props } = mount({ selectedItem: original, versions: [entry(original, 1, 3, ["Home"]), entry(saved, 2)] });
    open();
    fireEvent.click(screen.getByTestId("mgr-det-version-hero-v2"));
    expect(props.onOpenVersions).toHaveBeenCalledTimes(1);
    expect(props.composer.mediaOps.replaceAcross).not.toHaveBeenCalled();
  });
});

describe("AssetDetailsPanel — Usage tab", () => {
  it("non-zero usage with untraceable pages falls back to the count", () => {
    mount({ usageCount: 3 });
    fireEvent.click(screen.getByTestId("mgr-det-tab-usage"));
    expect(screen.getByTestId("mgr-det-used")).toHaveTextContent("Used in 3 places");
  });
});

describe("AssetDetailsPanel — replace-all picker", () => {
  const selected = makeItem({ key: "sel", name: "hero.jpg" });
  const sameType = makeItem({ key: "alt1", name: "alt.jpg", src: "https://example.com/alt.jpg" });
  const otherType = makeItem({ key: "fnt1", name: "font.woff", type: "fnt" });

  it("Replace across site… is disabled at zero usage", () => {
    mount({ selectedItem: selected, usageCount: 0 });
    fireEvent.click(screen.getByTestId("mgr-det-more"));
    expect(screen.getByRole("menuitem", { name: "Replace across site…" })).toBeDisabled();
  });

  it("opens the picker listing only same-type candidates, excluding the asset itself", () => {
    mount({
      selectedItem: selected,
      usageCount: 2,
      libraryItems: [selected, sameType, otherType],
    });
    fireEvent.click(screen.getByTestId("mgr-det-more"));
    fireEvent.click(screen.getByText("Replace across site…"));
    expect(screen.getByText(/Replace "hero.jpg" across 2 uses/)).toBeInTheDocument();
    expect(screen.getByText("alt.jpg")).toBeInTheDocument();
    expect(screen.queryByText("font.woff")).not.toBeInTheDocument();
  });

  it("choosing a candidate calls replaceAcross and toasts the replaced count", () => {
    const { props } = mount({
      selectedItem: selected,
      usageCount: 2,
      libraryItems: [selected, sameType],
    });
    fireEvent.click(screen.getByTestId("mgr-det-more"));
    fireEvent.click(screen.getByText("Replace across site…"));
    fireEvent.click(screen.getByText("alt.jpg"));
    expect(props.composer.mediaOps.replaceAcross).toHaveBeenCalledWith(
      selected.src,
      sameType.src,
    );
    expect(props.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Replaced in 2 elements", tone: "success" }),
    );
    // picker closes
    expect(screen.queryByText(/across 2 uses/)).not.toBeInTheDocument();
  });

  it("failed replacements surface an error toast", () => {
    const composer = {
      mediaOps: {
        replaceAcross: vi.fn(() => ({ replaced: [], failed: ["el-9"] })),
        getUsagesByPage: vi.fn(() => new Map()),
      },
      elements: { getAllPages: vi.fn(() => []) },
    } as unknown as AssetDetailsPanelProps["composer"];
    const { props } = mount({
      selectedItem: selected,
      usageCount: 1,
      libraryItems: [selected, sameType],
      composer,
    });
    fireEvent.click(screen.getByTestId("mgr-det-more"));
    fireEvent.click(screen.getByText("Replace across site…"));
    fireEvent.click(screen.getByText("alt.jpg"));
    expect(props.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: "1 replacement failed", tone: "error" }),
    );
  });

  it("shows the empty message when no same-type candidates exist", () => {
    mount({ selectedItem: selected, usageCount: 1, libraryItems: [selected, otherType] });
    fireEvent.click(screen.getByTestId("mgr-det-more"));
    fireEvent.click(screen.getByText("Replace across site…"));
    expect(screen.getByText(/No other images/)).toBeInTheDocument();
  });
});

describe("AssetDetailsPanel — action row", () => {
  it("Insert inserts the selected key", () => {
    const { props } = mount();
    fireEvent.click(screen.getByText("Place on canvas"));
    expect(props.onInsert).toHaveBeenCalledWith("asset-1");
  });

  it("images get Edit image → onEditImage", () => {
    const { props } = mount();
    fireEvent.click(screen.getByText("Edit image"));
    expect(props.onEditImage).toHaveBeenCalledWith(props.selectedItem);
    expect(props.onOpenRename).not.toHaveBeenCalled();
  });

  it("non-images get Rename → onOpenRename", () => {
    const font = makeItem({ key: "f", name: "Inter.woff2", type: "fnt" });
    const { props } = mount({ selectedItem: font });
    fireEvent.click(screen.getByText("Rename"));
    expect(props.onOpenRename).toHaveBeenCalledWith(font);
    expect(props.onEditImage).not.toHaveBeenCalled();
  });

  it("Delete requests deletion by key", () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("mgr-det-more"));
    fireEvent.click(screen.getByText("Delete asset…"));
    expect(props.onRequestDelete).toHaveBeenCalledWith("asset-1");
  });
});
