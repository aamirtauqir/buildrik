import { ToastProvider } from "@/editor/chrome-ui";
/**
 * §15 AssetDetailOverlay footer Replace action — Phase 6 Task 37.
 *
 * Board 146:2: Replace is the "Replace across site" hub row — img/vid only.
 * when onReplaceAcross is provided AND item is img/vid, fires the
 * callback on click, and is hidden for fonts/icons.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { AssetDetailOverlay } from "../AssetDetailOverlay";
import type { LibraryItem } from "../../data/mediaTypes";

function makeItem(overrides: Partial<LibraryItem> = {}): LibraryItem {
  return {
    key: "a1",
    name: "hero",
    type: "img",
    src: "data:image/png;base64,",
    size: 100,
    createdAt: "2026-01-01T00:00:00.000Z",
    mimeType: "image/png",
    ...overrides,
  };
}

function renderOverlay(
  item: LibraryItem,
  extra: Partial<React.ComponentProps<typeof AssetDetailOverlay>> = {},
) {
  return render(
    <ToastProvider>
      <AssetDetailOverlay
        item={item}
        onClose={() => {}}
        {...extra}
      />
    </ToastProvider>,
  );
}

describe("§15 — footer Replace action", () => {
  it("Replace button renders for images when onReplaceAcross provided", () => {
    renderOverlay(makeItem(), { onReplaceAcross: vi.fn() });
    expect(
      screen.getByTestId("media-detail-replace"),
    ).toBeInTheDocument();
  });

  it("Replace button renders for videos when onReplaceAcross provided", () => {
    renderOverlay(makeItem({ type: "vid", mimeType: "video/mp4" }), {
      onReplaceAcross: vi.fn(),
    });
    expect(
      screen.getByTestId("media-detail-replace"),
    ).toBeInTheDocument();
  });

  it("Replace button hidden when onReplaceAcross omitted", () => {
    renderOverlay(makeItem());
    expect(
      screen.queryByTestId("media-detail-replace"),
    ).not.toBeInTheDocument();
  });

  it("Replace button hidden for icons (not img/vid)", () => {
    renderOverlay(makeItem({ type: "ico", mimeType: "image/svg+xml" }), {
      onReplaceAcross: vi.fn(),
    });
    expect(
      screen.queryByTestId("media-detail-replace"),
    ).not.toBeInTheDocument();
  });

  it("Replace button hidden for fonts (not img/vid)", () => {
    renderOverlay(makeItem({ type: "fnt", mimeType: "font/ttf" }), {
      onReplaceAcross: vi.fn(),
    });
    expect(
      screen.queryByTestId("media-detail-replace"),
    ).not.toBeInTheDocument();
  });

  it("Replace click fires onReplaceAcross with the item", () => {
    const onReplaceAcross = vi.fn();
    renderOverlay(makeItem(), { onReplaceAcross });
    fireEvent.click(screen.getByTestId("media-detail-replace"));
    expect(onReplaceAcross).toHaveBeenCalledTimes(1);
    expect(onReplaceAcross.mock.calls[0][0]?.key).toBe("a1");
  });
});
