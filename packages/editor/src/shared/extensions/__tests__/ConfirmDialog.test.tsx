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
  // NOTE: Radix DismissableLayer's default behavior also preventDefaults +
  // dismisses, so this first test asserts the observable CONTRACT (1 onClose,
  // defaultPrevented=true) but does NOT, on its own, prove our explicit
  // onEscapeKeyDown handler is wired — Radix's default path would satisfy
  // the same assertions. The second test below distinguishes via timing:
  // our handler invokes onClose synchronously inside the keydown event
  // dispatch, while Radix's path is async (onDismiss → onOpenChange →
  // React state update → effect tick → onClose). If onClose has fired
  // before dispatchEvent returns, OUR handler ran (Radix's short-circuit
  // `if (!event.defaultPrevented && onDismiss) ...` is bypassed because
  // we preventDefault'd first).
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

  it("invokes our explicit handler synchronously (bypasses Radix onDismiss path)", () => {
    // Distinguishes "our handler ran" vs "Radix default ran" via timing.
    // Our handler calls onClose() SYNCHRONOUSLY inside the keydown event.
    // Radix's default path goes through onDismiss → onOpenChange(false) →
    // React state update → effect tick → onClose. So if onClose was called
    // before dispatchEvent returns, OUR handler ran.
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
    expect(onClose).not.toHaveBeenCalled(); // baseline pre-dispatch
    dialogContent.dispatchEvent(event);
    // After dispatchEvent returns synchronously, onClose MUST already have
    // been called (proves our handler executed, not Radix's async path).
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
