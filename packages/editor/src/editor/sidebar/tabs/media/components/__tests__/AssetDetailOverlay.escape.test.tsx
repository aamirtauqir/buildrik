/**
 * AssetDetailOverlay — Escape belongs to the topmost layer.
 *
 * REGRESSION: the drill-in listens for Escape on window, so while the image
 * editor modal it opened was up, one keystroke closed the modal AND navigated
 * the drawer behind it. Found on the live walk of boards 303:1997/303:2032.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { AssetDetailOverlay } from "../AssetDetailOverlay";
import type { LibraryItem } from "../../data/mediaTypes";

const item: LibraryItem = {
  key: "a1",
  name: "hero",
  type: "img",
  src: "data:image/png;base64,",
  size: 100,
  createdAt: "2026-01-01T00:00:00.000Z",
  mimeType: "image/png",
};

function mountOverlay(onClose = vi.fn()) {
  render(
    <ToastProvider>
      <AssetDetailOverlay item={item} onClose={onClose} onEditImage={() => {}} />
    </ToastProvider>,
  );
  return onClose;
}

/** Stand-in for the image editor: a modal dialog mounted above the drill-in. */
function mountModalAbove(): HTMLElement {
  const modal = document.createElement("div");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  document.body.appendChild(modal);
  return modal;
}

afterEach(() => {
  document.querySelectorAll("body > [role='dialog']").forEach((n) => n.remove());
});

describe("AssetDetailOverlay — Escape ownership", () => {
  it("Escape closes the drill-in when nothing is above it", () => {
    const onClose = mountOverlay();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape is ignored while a modal it opened sits above", () => {
    const onClose = mountOverlay();
    mountModalAbove();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("a sub-view does not pop while a modal sits above", () => {
    mountOverlay();
    fireEvent.click(screen.getByTestId("media-detail-used"));
    expect(screen.getByText(/used in/i)).toBeInTheDocument();
    mountModalAbove();
    fireEvent.keyDown(window, { key: "Escape" });
    // Still on the used-in view — the modal owns the keystroke.
    expect(screen.getByText(/used in/i)).toBeInTheDocument();
  });
});
