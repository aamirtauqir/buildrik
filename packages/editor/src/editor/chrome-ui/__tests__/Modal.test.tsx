/**
 * Modal — keyboard and focus contract.
 *
 * Moved from `editor/ui/__tests__/organisms.test.tsx` (Task 6, flowbite
 * big-bang) when Modal ported to chrome-ui — same describe block, new home.
 * A modal that looks right and traps nobody is a modal that loses keyboard
 * users the moment it opens.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { Modal } from "../index";
import { Button } from "flowbite-react";

describe("Modal", () => {
  it("is a labelled dialog", () => {
    render(<Modal open onClose={() => {}} title="Delete 3 pages" />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(screen.getByText("Delete 3 pages")).toBeTruthy();
  });

  it("renders nothing when closed", () => {
    render(<Modal open={false} onClose={() => {}} title="Hidden" />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("moves focus into the dialog on open", () => {
    render(
      <Modal open onClose={() => {}} title="Confirm" footer={<Button>Delete 3 pages</Button>} />,
    );
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Delete 3 pages" }));
  });

  it("Escape closes", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Confirm" footer={<Button>Go</Button>} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("returns focus to the trigger when it closes", () => {
    function Harness() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <Modal open={open} onClose={() => setOpen(false)} title="T" footer={<Button>Inside</Button>} />
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Inside" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
  });

  it("scrim click closes by default and can be opted out of", () => {
    const onClose = vi.fn();
    const { rerender, container } = render(<Modal open onClose={onClose} title="A" />);
    fireEvent.mouseDown(container.ownerDocument.querySelector('[role="dialog"]')!.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(<Modal open onClose={onClose} title="A" dismissOnScrimClick={false} />);
    fireEvent.mouseDown(container.ownerDocument.querySelector('[role="dialog"]')!.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
