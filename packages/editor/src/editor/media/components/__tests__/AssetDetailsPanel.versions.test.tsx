/**
 * AssetDetailsPanel — tabs, version history + revert, used-in counts,
 * replace-all picker, action row routing. Complements the existing
 * AssetDetailsPanel.altText.test.tsx (P7 alt-text coverage).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { LibraryItem } from "../../../sidebar/tabs/media/data/mediaTypes";
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
    },
  } as unknown as AssetDetailsPanelProps["composer"];
}

function mount(over: Partial<AssetDetailsPanelProps> = {}) {
  const props: AssetDetailsPanelProps = {
    selectedItem: makeItem(),
    versions: [],
    usageCount: 0,
    libraryItems: [],
    onSelectAsset: vi.fn(),
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

describe("AssetDetailsPanel — empty + details", () => {
  it("renders the placeholder when no asset is selected", () => {
    mount({ selectedItem: null });
    expect(screen.getByText("Select an asset to see details.")).toBeInTheDocument();
  });

  it("renders filename, type/size subline and the details KV block", () => {
    mount({ selectedItem: makeItem({ width: 640, height: 480 }) });
    expect(screen.getByText("logo.png")).toBeInTheDocument();
    expect(screen.getByText(/IMG ·/)).toBeInTheDocument();
    expect(screen.getByText("640 × 480 px")).toBeInTheDocument();
    expect(screen.getByText("image/png")).toBeInTheDocument();
  });
});

describe("AssetDetailsPanel — versions tab", () => {
  const current = makeItem({ key: "v2", name: "logo_v2222" });
  const older = makeItem({
    key: "v1",
    name: "logo_v1111",
    src: "https://example.com/logo-old.png",
    createdAt: "2026-06-01T10:00:00.000Z",
  });

  it("hides the Versions tab when there is a single version", () => {
    mount({ versions: [current] });
    expect(screen.queryByText(/Versions ·/)).not.toBeInTheDocument();
  });

  it("shows 'Versions · N' and marks the newest row CURRENT", () => {
    mount({ selectedItem: current, versions: [current, older] });
    fireEvent.click(screen.getByText("Versions · 2"));
    expect(screen.getByText("CURRENT")).toBeInTheDocument();
    expect(screen.getByText(/logo_v1111/)).toBeInTheDocument();
  });

  it("clicking an older version row selects that asset", () => {
    const { props } = mount({ selectedItem: current, versions: [current, older] });
    fireEvent.click(screen.getByText("Versions · 2"));
    fireEvent.click(screen.getByText(/logo_v1111/));
    expect(props.onSelectAsset).toHaveBeenCalledWith("v1");
  });

  it("Revert replaces all usages of the current src with the older src + toasts", () => {
    const { props } = mount({ selectedItem: current, versions: [current, older] });
    fireEvent.click(screen.getByText("Versions · 2"));
    fireEvent.click(screen.getByText("Revert"));
    expect(props.composer.mediaOps.replaceAcross).toHaveBeenCalledWith(
      current.src,
      older.src,
    );
    expect(props.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Reverted to logo_v1111", tone: "success" }),
    );
    // stopPropagation: the row click handler must not also fire
    expect(props.onSelectAsset).not.toHaveBeenCalled();
  });

  it("no Revert button on the current (first) row", () => {
    mount({ selectedItem: current, versions: [current, older] });
    fireEvent.click(screen.getByText("Versions · 2"));
    // exactly one Revert for the single older version
    expect(screen.getAllByText("Revert")).toHaveLength(1);
  });
});

describe("AssetDetailsPanel — used-in tab", () => {
  it("zero usage shows the empty message", () => {
    mount({ usageCount: 0 });
    fireEvent.click(screen.getByText("Used in · 0"));
    expect(screen.getByText("Not used on any page yet")).toBeInTheDocument();
  });

  it("non-zero usage shows the element count", () => {
    mount({ usageCount: 3 });
    fireEvent.click(screen.getByText("Used in · 3"));
    expect(screen.getByText("3 elements reference this asset")).toBeInTheDocument();
  });
});

describe("AssetDetailsPanel — replace-all picker", () => {
  const selected = makeItem({ key: "sel", name: "hero.jpg" });
  const sameType = makeItem({ key: "alt1", name: "alt.jpg", src: "https://example.com/alt.jpg" });
  const otherType = makeItem({ key: "fnt1", name: "font.woff", type: "fnt" });

  it("Replace all button is hidden at zero usage", () => {
    mount({ selectedItem: selected, usageCount: 0 });
    expect(screen.queryByText("Replace all")).not.toBeInTheDocument();
  });

  it("opens the picker listing only same-type candidates, excluding the asset itself", () => {
    mount({
      selectedItem: selected,
      usageCount: 2,
      libraryItems: [selected, sameType, otherType],
    });
    fireEvent.click(screen.getByText("Replace all"));
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
    fireEvent.click(screen.getByText("Replace all"));
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
      mediaOps: { replaceAcross: vi.fn(() => ({ replaced: [], failed: ["el-9"] })) },
    } as unknown as AssetDetailsPanelProps["composer"];
    const { props } = mount({
      selectedItem: selected,
      usageCount: 1,
      libraryItems: [selected, sameType],
      composer,
    });
    fireEvent.click(screen.getByText("Replace all"));
    fireEvent.click(screen.getByText("alt.jpg"));
    expect(props.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: "1 replacement failed", tone: "error" }),
    );
  });

  it("shows the empty message when no same-type candidates exist", () => {
    mount({ selectedItem: selected, usageCount: 1, libraryItems: [selected, otherType] });
    fireEvent.click(screen.getByText("Replace all"));
    expect(screen.getByText(/No other images/)).toBeInTheDocument();
  });
});

describe("AssetDetailsPanel — action row", () => {
  it("Insert inserts the selected key", () => {
    const { props } = mount();
    fireEvent.click(screen.getByText("Insert"));
    expect(props.onInsert).toHaveBeenCalledWith("asset-1");
  });

  it("images get Edit → onEditImage", () => {
    const { props } = mount();
    fireEvent.click(screen.getByText("Edit"));
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
    fireEvent.click(screen.getByText("Delete"));
    expect(props.onRequestDelete).toHaveBeenCalledWith("asset-1");
  });
});
