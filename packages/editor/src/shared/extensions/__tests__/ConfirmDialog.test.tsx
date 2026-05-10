/**
 * ConfirmDialog tests — covers Escape preventDefault + onClose dispatch.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ConfirmDialog } from "../ConfirmDialog";

afterEach(cleanup);

describe("ConfirmDialog — Escape handling", () => {
  it("calls onClose AND preventDefault on Escape", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Discard?"
        message="Unsaved changes."
      />,
    );
    const dialogContent = screen.getByRole("dialog");
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    dialogContent.dispatchEvent(event);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });
});
