/**
 * §15 AssetDetailOverlay Edit tab — alt-text input — Phase 6 Task 35.
 *
 * Asserts the Edit tab exposes an alt-text Input that initializes from
 * item.altText, commits via onUpdate on blur, and lets the user edit
 * even when no current alt is set.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { ToastProvider } from "@/editor/shared/vibcoder";
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
        onInsert={() => {}}
        onRename={async () => {}}
        onDelete={() => {}}
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
    fireEvent.click(screen.getByRole("tab", { name: /edit/i }));
    const input = screen.getByLabelText(/alt text/i) as HTMLInputElement;
    expect(input.value).toBe("Hero banner");
  });

  it("Edit tab shows empty alt-text input when item has no altText", () => {
    renderOverlay(makeItem());
    fireEvent.click(screen.getByRole("tab", { name: /edit/i }));
    const input = screen.getByLabelText(/alt text/i) as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("onBlur commits altText via onUpdate(key, { altText })", () => {
    const onUpdate = vi.fn(async () => {});
    renderOverlay(makeItem(), { onUpdate });
    fireEvent.click(screen.getByRole("tab", { name: /edit/i }));
    const input = screen.getByLabelText(/alt text/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "New alt text" } });
    fireEvent.blur(input);
    expect(onUpdate).toHaveBeenCalledWith("a1", { altText: "New alt text" });
  });

  it("Enter key commits altText via onUpdate", () => {
    const onUpdate = vi.fn(async () => {});
    renderOverlay(makeItem(), { onUpdate });
    fireEvent.click(screen.getByRole("tab", { name: /edit/i }));
    const input = screen.getByLabelText(/alt text/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Logo for site" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(onUpdate).toHaveBeenCalledWith("a1", { altText: "Logo for site" });
  });

  it("does NOT call onUpdate if alt text unchanged", () => {
    const onUpdate = vi.fn(async () => {});
    renderOverlay(makeItem({ altText: "Same" }), { onUpdate });
    fireEvent.click(screen.getByRole("tab", { name: /edit/i }));
    const input = screen.getByLabelText(/alt text/i) as HTMLInputElement;
    fireEvent.blur(input);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("Open image editor button still present and fires onEditImage", () => {
    const onEditImage = vi.fn();
    renderOverlay(makeItem(), { onEditImage });
    fireEvent.click(screen.getByRole("tab", { name: /edit/i }));
    fireEvent.click(screen.getByRole("button", { name: /open image editor/i }));
    expect(onEditImage).toHaveBeenCalledTimes(1);
  });
});
