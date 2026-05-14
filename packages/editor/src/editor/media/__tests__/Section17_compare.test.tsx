/**
 * §17 ImageEditorModal Before/After compare toggle — Phase 8 Task 44-50.
 *
 * Asserts the Compare button:
 *   - Renders in header with "Compare" label by default
 *   - On pointerdown switches label to "Original" + sets aria-pressed
 *   - On pointerup reverts label + aria-pressed
 *   - Keyboard Space/Enter toggles same way
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { ImageEditorModal } from "../ImageEditorModal";

// react-easy-crop renders an <img> + interactive overlay. In jsdom the
// image won't decode but we only assert on the Compare button + state.
vi.mock("react-easy-crop", () => ({
  default: () => <div data-testid="cropper-mock" />,
}));

function renderModal(extra: Partial<React.ComponentProps<typeof ImageEditorModal>> = {}) {
  return render(
    <ImageEditorModal
      isOpen
      onClose={() => {}}
      imageSrc="data:image/png;base64,iVBORw0KGgo="
      onSave={async () => {}}
      onError={() => {}}
      {...extra}
    />,
  );
}

describe("§17 — Compare toggle", () => {
  it("renders Compare button with default label", () => {
    renderModal();
    const btn = screen.getByRole("button", {
      name: /hold to compare with original/i,
    });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn).toHaveTextContent(/Compare/i);
  });

  it("pointerDown sets aria-pressed=true and label = Original", () => {
    renderModal();
    const btn = screen.getByRole("button", {
      name: /hold to compare with original/i,
    });
    fireEvent.pointerDown(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).toHaveTextContent(/Original/i);
  });

  it("pointerUp restores aria-pressed=false and label = Compare", () => {
    renderModal();
    const btn = screen.getByRole("button", {
      name: /hold to compare with original/i,
    });
    fireEvent.pointerDown(btn);
    fireEvent.pointerUp(btn);
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn).toHaveTextContent(/Compare/i);
  });

  it("pointerLeave releases the comparing state", () => {
    renderModal();
    const btn = screen.getByRole("button", {
      name: /hold to compare with original/i,
    });
    fireEvent.pointerDown(btn);
    fireEvent.pointerLeave(btn);
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("Space key holds, then releases", () => {
    renderModal();
    const btn = screen.getByRole("button", {
      name: /hold to compare with original/i,
    });
    fireEvent.keyDown(btn, { key: " ", code: "Space" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyUp(btn, { key: " ", code: "Space" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("blur releases comparing state (safety release)", () => {
    renderModal();
    const btn = screen.getByRole("button", {
      name: /hold to compare with original/i,
    });
    fireEvent.pointerDown(btn);
    fireEvent.blur(btn);
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });
});
