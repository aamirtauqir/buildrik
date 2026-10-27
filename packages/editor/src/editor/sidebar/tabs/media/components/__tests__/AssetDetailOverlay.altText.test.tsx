/**
 * The drawer hub's alt text is the user's own field: no AI Generate /
 * Regenerate (owner, 2026-10-17 — no AI entry points in the editor UI).
 * re-baseline: asset alt text (the G3-022 Generate states are gone).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { AssetDetailOverlay } from "../AssetDetailOverlay";
import type { LibraryItem } from "@/editor/sidebar/tabs/media/data/mediaTypes";

const base: LibraryItem = {
  key: "a1",
  name: "hero",
  type: "img",
  src: "https://cdn.example/hero.png",
  size: 100,
  createdAt: "2026-01-01T00:00:00.000Z",
  mimeType: "image/png",
  assetId: "a1",
};

function mount(item: LibraryItem, onUpdate = vi.fn(async () => {})) {
  render(
    <ToastProvider>
      <AssetDetailOverlay item={item} onClose={vi.fn()} onUpdate={onUpdate} />
    </ToastProvider>,
  );
  return onUpdate;
}

describe("AssetDetailOverlay — alt text", () => {
  it("offers no Generate or Regenerate, empty or filled", () => {
    mount(base);
    expect(screen.queryByText(/Generate/)).toBeNull();
    mount({ ...base, key: "a2", altText: "A sunlit studio" });
    expect(screen.queryByText(/Regenerate/)).toBeNull();
  });

  it("saves what the user writes on blur", () => {
    const onUpdate = mount(base);
    const field = screen.getByLabelText("Alt text");
    fireEvent.change(field, { target: { value: "A sunlit studio" } });
    fireEvent.blur(field);
    expect(onUpdate).toHaveBeenCalledWith("a1", { altText: "A sunlit studio" });
  });
});
