import { ToastProvider } from "@/editor/chrome-ui";
/**
 * §15 AssetDetailOverlay Edit tab — alt-text input — Phase 6 Task 35.
 *
 * Board 146:2: alt text sits on the HUB above the fold — initializes from
 * item.altText, commits via onUpdate on blur, and lets the user edit
 * even when no current alt is set.
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
        onEditImage={() => {}}
        {...extra}
      />
    </ToastProvider>,
  );
}

describe("§15 — Edit tab alt-text input", () => {
  it("Edit tab shows alt-text input initialized from item.altText", () => {
    renderOverlay(makeItem({ altText: "Hero banner" }));
    const input = screen.getByLabelText(/alt text/i) as HTMLInputElement;
    expect(input.value).toBe("Hero banner");
  });

  it("Edit tab shows empty alt-text input when item has no altText", () => {
    renderOverlay(makeItem());
    const input = screen.getByLabelText(/alt text/i) as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("onBlur commits altText via onUpdate(key, { altText })", () => {
    const onUpdate = vi.fn(async () => {});
    renderOverlay(makeItem(), { onUpdate });
    const input = screen.getByLabelText(/alt text/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "New alt text" } });
    fireEvent.blur(input);
    expect(onUpdate).toHaveBeenCalledWith("a1", { altText: "New alt text" });
  });

  it("Enter key commits altText via onUpdate", () => {
    const onUpdate = vi.fn(async () => {});
    renderOverlay(makeItem(), { onUpdate });
    const input = screen.getByLabelText(/alt text/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Logo for site" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(onUpdate).toHaveBeenCalledWith("a1", { altText: "Logo for site" });
  });

  it("does NOT call onUpdate if alt text unchanged", () => {
    const onUpdate = vi.fn(async () => {});
    renderOverlay(makeItem({ altText: "Same" }), { onUpdate });
    const input = screen.getByLabelText(/alt text/i) as HTMLInputElement;
    fireEvent.blur(input);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  // Board 146:2: "Edit image ›" hub row opens the image-editor modal.
  it("Edit image row fires onEditImage with the item", () => {
    const onEditImage = vi.fn();
    renderOverlay(makeItem(), { onEditImage });
    fireEvent.click(screen.getByTestId("media-detail-edit"));
    expect(onEditImage).toHaveBeenCalledTimes(1);
  });
});
