/**
 * AssetDetailsPanel — P7 alt text section tests.
 *
 * Covers: editor render, one commit per blur / Enter (M-4, never per
 * keystroke), the character counter, a refused save shown under the field,
 * non-image hides the section, missing handlers hide it.
 *
 * @license BSD-3-Clause
 */

import { render, fireEvent, waitFor } from "@testing-library/react";
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
    onUpdateAltText: vi.fn().mockResolvedValue(undefined),
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

  it("M-4: typing writes nothing; blur commits the trimmed text once", () => {
    const onUpdateAltText = vi.fn().mockResolvedValue(undefined);
    const { container } = renderPanel({ onUpdateAltText });
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "User" } });
    fireEvent.change(textarea, { target: { value: "User typed this " } });
    expect(onUpdateAltText).not.toHaveBeenCalled();
    fireEvent.blur(textarea);
    expect(onUpdateAltText).toHaveBeenCalledTimes(1);
    expect(onUpdateAltText).toHaveBeenCalledWith("asset-1", "User typed this");
  });

  it("M-4: Enter commits once (via the blur it triggers); Shift+Enter does not", () => {
    const onUpdateAltText = vi.fn().mockResolvedValue(undefined);
    const { container } = renderPanel({ onUpdateAltText });
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.focus();
    fireEvent.change(textarea, { target: { value: "A bike" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onUpdateAltText).not.toHaveBeenCalled();
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onUpdateAltText).toHaveBeenCalledTimes(1);
    expect(onUpdateAltText).toHaveBeenCalledWith("asset-1", "A bike");
  });

  it("M-4: blur with unchanged text sends nothing", () => {
    const onUpdateAltText = vi.fn().mockResolvedValue(undefined);
    const { container } = renderPanel({ onUpdateAltText, selectedItem: makeImage({ altText: "Same" }) });
    fireEvent.blur(container.querySelector("textarea") as HTMLTextAreaElement);
    expect(onUpdateAltText).not.toHaveBeenCalled();
  });

  it("M-4: a refused save is shown under the field", async () => {
    const onUpdateAltText = vi.fn().mockRejectedValue(new Error("refused"));
    const { container, findByTestId } = renderPanel({ onUpdateAltText });
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "x" } });
    fireEvent.blur(textarea);
    await waitFor(() => expect(onUpdateAltText).toHaveBeenCalled());
    expect(await findByTestId("alt-text-error")).toBeTruthy();
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
