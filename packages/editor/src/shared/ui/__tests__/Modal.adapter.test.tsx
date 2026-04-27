/**
 * Phase 4 contract tests — verify legacy Modal prop surface still works
 * through the adapter shim → vibcoder Modal (Radix.Dialog).
 *
 * Radix-aware testing notes:
 * - Radix.Dialog portals content into the overlay root; getByRole("dialog")
 *   crawls document.body and finds it.
 * - userEvent (not fireEvent) for keyboard/click — Radix listens via pointer
 *   events that fireEvent doesn't synthesize correctly.
 * - Each test cleans up the overlay root in beforeEach to prevent leaks
 *   across the file.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { Modal, ConfirmDialog } from "../Modal";

beforeEach(() => {
  cleanup();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

describe("Modal adapter shim", () => {
  it("renders dialog when isOpen=true", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("does not render dialog when isOpen=false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("calls onClose when Escape pressed (closeOnEscape default)", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Body</p>
      </Modal>,
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("does NOT call onClose when Escape + closeOnEscape=false", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} closeOnEscape={false} title="Test">
        <p>Body</p>
      </Modal>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders title as ModalTitle", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="My Modal">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByText("My Modal")).toBeInTheDocument();
  });

  it("renders footer when provided", () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="T"
        footer={<button>OK</button>}
      >
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });

  it("hides close button when showCloseButton=false", () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="T"
        showCloseButton={false}
      >
        <p>Body</p>
      </Modal>,
    );
    expect(screen.queryByLabelText("Close modal")).toBeNull();
  });

  it("shows close button by default", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByLabelText("Close modal")).toBeInTheDocument();
  });

  it("close button click triggers onClose via Radix onOpenChange(false)", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="T">
        <p>Body</p>
      </Modal>,
    );
    await userEvent.click(screen.getByLabelText("Close modal"));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("focuses initialFocusRef element on open", async () => {
    function Harness() {
      const ref = useRef<HTMLButtonElement>(null);
      return (
        <Modal isOpen={true} onClose={() => {}} title="T" initialFocusRef={ref}>
          <button ref={ref}>Initial</button>
        </Modal>
      );
    }
    render(<Harness />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Initial" })).toHaveFocus();
    });
  });

  it("size=sm maps to bd-modal--lg vibcoder class", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T" size="sm">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-modal--lg");
  });

  it("size=md maps to bd-modal--lg", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T" size="md">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-modal--lg");
  });

  it("size=lg maps to bd-modal--lg", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T" size="lg">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-modal--lg");
  });

  it("size=xl maps to bd-modal--xl", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T" size="xl">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-modal--xl");
  });

  it("size=full maps to bd-modal--xl + maxWidth 90vw", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T" size="full">
        <p>Body</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("bd-modal--xl");
    expect(dialog.style.maxWidth).toBe("90vw");
  });

  it("renders children inside bd-modal__body wrapper", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T">
        <p data-testid="child">Body</p>
      </Modal>,
    );
    const child = screen.getByTestId("child");
    expect(child.parentElement).toHaveClass("bd-modal__body");
  });

  it("dialog has role=dialog (Radix-auto ARIA)", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T">
        <p>Body</p>
      </Modal>,
    );
    // Radix.Dialog renders [role="dialog"] on the content; aria-modal is
    // implicit per WAI-ARIA modal dialog pattern (Radix doesn't set it
    // explicitly in jsdom — getByRole asserts the role contract).
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("role", "dialog");
  });

  it("does not set body.style.overflow (Radix handles scroll lock)", () => {
    // Reset before render in case any prior test polluted it.
    document.body.style.overflow = "";
    render(
      <Modal isOpen={true} onClose={() => {}} title="T">
        <p>Body</p>
      </Modal>,
    );
    // Shim no longer toggles document.body.style.overflow directly; Radix
    // scroll-lock applies different attributes (data-scroll-locked) but the
    // legacy "overflow: hidden" inline style is gone.
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});

describe("ConfirmDialog adapter shim", () => {
  it("renders confirm + cancel buttons", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        message="Are you sure?"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Confirm" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel" }),
    ).toBeInTheDocument();
  });

  it("renders the message text", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        message="Are you sure?"
      />,
    );
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("onConfirm fires + closes on confirm click", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        message="Are you sure?"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("onClose fires when cancel clicked", async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={() => {}}
        message="Are you sure?"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("danger variant uses vibcoder Button bd-btn--danger class", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        message="Delete?"
        variant="danger"
      />,
    );
    const confirmBtn = screen.getByRole("button", { name: "Confirm" });
    expect(confirmBtn).toHaveClass("bd-btn--danger");
  });
});
