/**
 * G3-021 — board 4418:61698: the drawer's asset hub carries the library's
 * own actions under the destination rows: Insert to canvas · Rename… ·
 * Copy URL · Download · Delete.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { AssetDetailOverlay } from "../AssetDetailOverlay";
import type { LibraryItem } from "../../data/mediaTypes";

const item: LibraryItem = {
  key: "a1",
  name: "hero",
  type: "img",
  src: "https://cdn.example/hero.png",
  size: 100,
  createdAt: "2026-01-01T00:00:00.000Z",
  mimeType: "image/png",
};

function mount(extra: Partial<React.ComponentProps<typeof AssetDetailOverlay>> = {}) {
  const handlers = {
    onInsert: vi.fn(),
    onRename: vi.fn(),
    onCopyUrl: vi.fn(),
    onDownload: vi.fn(),
    onDelete: vi.fn(),
  };
  render(
    <ToastProvider>
      <AssetDetailOverlay item={item} onClose={vi.fn()} {...handlers} {...extra} />
    </ToastProvider>,
  );
  return handlers;
}

describe("AssetDetailOverlay — G3-021 library actions in the hub (4418:61698)", () => {
  it("lists the five actions in the board's order", () => {
    mount();
    const rows = within(screen.getByTestId("media-detail-actions")).getAllByRole("button");
    expect(rows.map((r) => r.textContent?.trim())).toEqual([
      "Insert to canvas",
      "Rename…",
      "Copy URL",
      "Download",
      "Delete",
    ]);
  });

  it("each row hands the asset to its handler", () => {
    const h = mount();
    for (const [id, fn] of [
      ["media-detail-insert", h.onInsert],
      ["media-detail-rename", h.onRename],
      ["media-detail-copy-url", h.onCopyUrl],
      ["media-detail-download", h.onDownload],
      ["media-detail-delete", h.onDelete],
    ] as const) {
      fireEvent.click(screen.getByTestId(id));
      expect(fn).toHaveBeenCalledWith(item);
    }
  });

  it("a viewer sees Rename and Delete disabled with the reason, never hidden", () => {
    const h = mount({ viewOnly: { rename: "View only — ask an editor to rename", delete: "View only — ask an editor to delete" } });
    const rename = screen.getByTestId("media-detail-rename");
    const del = screen.getByTestId("media-detail-delete");
    expect(rename).toBeDisabled();
    expect(del).toBeDisabled();
    expect(rename.getAttribute("title")).toMatch(/rename/);
    fireEvent.click(del);
    expect(h.onDelete).not.toHaveBeenCalled();
  });
});
