/**
 * AssetDetailsPanel — P7 alt text section tests.
 *
 * Covers: editor render, user-typed edit triggers onUpdateAltText, the
 * character counter, non-image hides the section, missing handlers hide it.
 *
 * @license BSD-3-Clause
 */

import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { AssetDetailsPanel } from "../AssetDetailsPanel";
import type { LibraryItem } from "@/editor/sidebar/tabs/media/data/mediaTypes";

function makeImage(overrides: Partial<LibraryItem> = {}): LibraryItem {
  return {
    key: "asset-1",
    name: "photo.jpg",
    type: "img",
    src: "https://blob.example/photo.jpg",
    size: 12345,
    mimeType: "image/jpeg",
    createdAt: "2026-05-09T00:00:00Z",
    ...overrides,
  };
}

function renderPanel(overrides: Partial<React.ComponentProps<typeof AssetDetailsPanel>> = {}) {
  const composer = {
    mediaOps: {
      replaceAcross: vi.fn(),
      getUsages: vi.fn(() => ({ count: 0, places: [] })),
      getUsagesByPage: vi.fn(() => new Map()),
    },
    elements: { getAllPages: vi.fn(() => []) },
  } as any;
  const props = {
    selectedItem: makeImage(),
    versions: [],
    usageCount: 0,
    libraryItems: [],
    onOpenVersions: vi.fn(),
    onInsert: vi.fn(),
    onEditImage: vi.fn(),
    onOpenRename: vi.fn(),
    onRequestDelete: vi.fn(),
    composer,
    addToast: vi.fn(),
    onUpdateAltText: vi.fn(),
    ...overrides,
  };
  return { ...render(<AssetDetailsPanel {...props} />), props };
}

describe("AssetDetailsPanel — alt text section (P7)", () => {
  it("renders the alt-text section for image assets when handlers are provided", () => {
    const { getByTestId } = renderPanel();
    expect(getByTestId("alt-text-section")).toBeTruthy();
  });

  it("shows current alt text in the textarea", () => {
    const { container } = renderPanel({
      selectedItem: makeImage({ altText: "A red bicycle." }),
    });
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    expect(textarea.value).toBe("A red bicycle.");
  });

  it("calls onUpdateAltText with the new value when the user types", () => {
    const onUpdateAltText = vi.fn();
    const { container } = renderPanel({ onUpdateAltText });
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "User typed this" } });
    expect(onUpdateAltText).toHaveBeenCalledWith("asset-1", "User typed this");
  });

  it("enforces the 125-char max via maxLength attribute", () => {
    const { container } = renderPanel();
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(125);
  });

  it("shows a character counter", () => {
    const { getByText } = renderPanel({
      selectedItem: makeImage({ altText: "Hello" }),
    });
    expect(getByText("5 / 125")).toBeTruthy();
  });

  it("4418:58292: filled alt text sits in the board's box", () => {
    const { getByTestId } = renderPanel({ selectedItem: makeImage({ altText: "A red bicycle." }) });
    expect(getByTestId("alt-text-box")).toBeTruthy();
  });

  it("empty alt text keeps the plain field", () => {
    const { queryByTestId } = renderPanel();
    expect(queryByTestId("alt-text-box")).toBeNull();
  });

  it("hides the alt-text section for non-image assets (videos, fonts, icons)", () => {
    for (const type of ["vid", "fnt", "ico"] as const) {
      const { queryByTestId, unmount } = renderPanel({
        selectedItem: makeImage({ key: `${type}-key`, type }),
      });
      expect(queryByTestId("alt-text-section")).toBeNull();
      unmount();
    }
  });

  it("hides the alt-text section when onUpdateAltText is not provided", () => {
    const { queryByTestId } = renderPanel({ onUpdateAltText: undefined });
    expect(queryByTestId("alt-text-section")).toBeNull();
  });
});
