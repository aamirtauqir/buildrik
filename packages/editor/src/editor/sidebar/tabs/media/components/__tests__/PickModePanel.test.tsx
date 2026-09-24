/**
 * PickModePanel — boards 6764:59051 (idle) / 6881:91481 (chosen).
 * Audit G3-008: a click chooses, only `Use selected image` applies.
 * Audit G3-061: the drawer is the one picker; its links open the upload modal.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { PickModePanel } from "../PickModePanel";
import type { LibraryItem } from "../../data/mediaTypes";
import type { AssetPickRequest } from "../../data/assetPick";

vi.mock("@/editor/media/UploadAssetModal", () => ({
  UploadAssetModal: ({ open, pane, forLabel }: { open: boolean; pane: string; forLabel?: string }) =>
    open ? <div data-testid="upload-modal" data-pane={pane} data-for={forLabel} /> : null,
}));

const item = (key: string, name: string, type: LibraryItem["type"] = "img"): LibraryItem =>
  ({ key, name, displayName: name, type, src: `blob:${key}`, size: 1, createdAt: "", mimeType: "image/jpeg" }) as LibraryItem;

const ITEMS = [item("hero", "hero-dark.jpg"), item("menu", "menu-01.jpg"), item("clip", "intro.mp4", "vid")];

function makeComposer(elementType = "image") {
  return { elements: { getElement: () => ({ getType: () => elementType }) } } as never;
}

function mount(request: AssetPickRequest = { elementId: "el", label: "Menu preview" }, over: Partial<React.ComponentProps<typeof PickModePanel>> = {}) {
  const props = {
    composer: makeComposer(),
    request,
    items: ITEMS,
    usageMap: new Map<string, number>(),
    searchQuery: "",
    onSearchChange: vi.fn(),
    onUse: vi.fn(),
    onCancel: vi.fn(),
    ...over,
  };
  render(
    <ToastProvider>
      <PickModePanel {...props} />
    </ToastProvider>,
  );
  return props;
}

const cards = () => screen.getAllByTestId("media-card");

describe("6764:59051 · Choose image — pick mode", () => {
  it("titles the drawer Choose image and says what it is for", () => {
    mount();
    expect(screen.getByText("Choose image")).toBeInTheDocument();
    expect(screen.getByTestId("media-pick-for")).toHaveTextContent("For Menu preview · Image");
  });

  it("drops a label that only repeats the kind", () => {
    mount({ elementId: "el", label: "image" });
    expect(screen.getByTestId("media-pick-for")).toHaveTextContent(/^Image$/);
  });

  it("shows only the element's kind — an image field never lists a video", () => {
    mount();
    expect(cards()).toHaveLength(2);
    expect(screen.queryByLabelText("intro.mp4 asset")).toBeNull();
  });

  it("a video element picks videos", () => {
    mount({ elementId: "el" }, { composer: makeComposer("video") });
    expect(screen.getByText("Choose video")).toBeInTheDocument();
    expect(cards()).toHaveLength(1);
  });

  it("the field's own allowedTypes win over the element", () => {
    mount({ allowedTypes: ["video"], onSelect: vi.fn() });
    expect(cards()).toHaveLength(1);
  });
});

describe("G3-008 · two steps — choose, then Use selected image (6881:91481)", () => {
  it("Use selected image is disabled until a card is chosen", () => {
    mount();
    expect(screen.getByTestId("media-pick-use")).toBeDisabled();
    expect(screen.getByTestId("media-pick-use")).toHaveTextContent("Use selected image");
  });

  it("a click chooses the card and applies NOTHING", () => {
    const props = mount();
    fireEvent.click(screen.getByLabelText("menu-01.jpg asset"));
    expect(props.onUse).not.toHaveBeenCalled();
    expect(screen.getByLabelText("menu-01.jpg asset")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("hero-dark.jpg asset")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByTestId("media-card-picked")).toHaveLength(1);
    expect(screen.getByTestId("media-pick-use")).toBeEnabled();
  });

  it("Use selected image applies the chosen card", () => {
    const props = mount();
    fireEvent.click(screen.getByLabelText("menu-01.jpg asset"));
    fireEvent.click(screen.getByTestId("media-pick-use"));
    expect(props.onUse).toHaveBeenCalledWith("menu");
  });

  it("Cancel and ✕ both leave pick mode without applying", () => {
    const props = mount();
    fireEvent.click(screen.getByTestId("media-pick-cancel"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel choosing" }));
    expect(props.onCancel).toHaveBeenCalledTimes(2);
    expect(props.onUse).not.toHaveBeenCalled();
  });
});

describe("prefilled search stays, visible and clearable", () => {
  it("a starting search opens under Filter, narrows the grid and clears in one click", () => {
    const props = mount({ elementId: "el", label: "Hero" }, { searchQuery: "hero" });
    expect(screen.getByTestId("media-pick-search")).toHaveValue("hero");
    expect(cards()).toHaveLength(1);
    fireEvent.click(screen.getByTestId("media-pick-search-clear"));
    expect(props.onSearchChange).toHaveBeenCalledWith("");
  });

  it("a search that matches nothing says so", () => {
    mount(undefined, { searchQuery: "zzz" });
    expect(screen.getByTestId("media-pick-empty")).toHaveTextContent('Nothing matches "zzz".');
  });

  it("Filter reveals the search when there is none", () => {
    mount();
    expect(screen.queryByTestId("media-pick-search")).toBeNull();
    fireEvent.click(screen.getByTestId("media-pick-filter"));
    expect(screen.getByTestId("media-pick-search")).toBeInTheDocument();
  });
});

describe("G3-061 · ↑ Upload / From URL open the upload modal for the same pick", () => {
  it("Upload opens it on Upload, From URL on From URL, both for this element", () => {
    mount();
    fireEvent.click(screen.getByTestId("media-pick-upload"));
    expect(screen.getByTestId("upload-modal")).toHaveAttribute("data-pane", "upload");
    expect(screen.getByTestId("upload-modal")).toHaveAttribute("data-for", "Menu preview");
  });

  it("From URL opens it on the URL door", () => {
    mount();
    fireEvent.click(screen.getByTestId("media-pick-url"));
    expect(screen.getByTestId("upload-modal")).toHaveAttribute("data-pane", "url");
  });
});
