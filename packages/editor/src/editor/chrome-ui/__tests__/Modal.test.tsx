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

  /* The trap re-ran on every render because it depended on the escape
     handler's identity, and every setup ends by focusing the first focusable
     — the close button. One keystroke in any modal field moved focus to the
     ✕: the CMS collection wizard took "R" of "Recipes" and sent "ecipes" to
     the close button. Reproduced live before this test existed. */
  it("keeps focus in a field while its state changes on every keystroke", () => {
    function Host() {
      const [value, setValue] = React.useState("");
      /* Inline handler on purpose: this is what every caller passes, and its
         fresh identity per render is what broke the trap. */
      return (
        <Modal open onClose={() => {}} title="Name it">
          <input
            aria-label="Collection name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Modal>
      );
    }
    render(<Host />);
    const input = screen.getByLabelText("Collection name") as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: "R" } });
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "Re" } });
    fireEvent.change(input, { target: { value: "Rec" } });
    expect(input.value).toBe("Rec");
    expect(document.activeElement).toBe(input);
  });

  /* Board 183:16 — "losing a filled form to a stray click is the cheapest
     possible way to lose trust". A dirty modal answers the scrim with a pulse
     and stays where it is. */
  it("a dirty modal survives a scrim click; a clean one still closes", () => {
    const onClose = vi.fn();
    const { rerender, container } = render(
      <Modal open onClose={onClose} title="Page settings" dirty />,
    );
    const scrim = container.ownerDocument.querySelector<HTMLElement>(
      '[role="dialog"]',
    )!.parentElement!;
    fireEvent.mouseDown(scrim);
    expect(onClose).not.toHaveBeenCalled();

    rerender(<Modal open onClose={onClose} title="Page settings" />);
    fireEvent.mouseDown(
      container.ownerDocument.querySelector<HTMLElement>('[role="dialog"]')!.parentElement!,
    );
    expect(onClose).toHaveBeenCalledTimes(1);
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
