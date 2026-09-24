/**
 * Owner ruling 2026-09-24: Escape closes Publish / Review / History in the
 * right column — not over an open modal/menu inside, not while typing.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useColumnPanelEscape } from "../useColumnPanelEscape";

function Host({ active, onClose, children }: { active: boolean; onClose: () => void; children?: React.ReactNode }) {
  useColumnPanelEscape(active, onClose);
  return <div>{children}</div>;
}

afterEach(cleanup);

describe("useColumnPanelEscape", () => {
  it("Escape closes the column panel", () => {
    const onClose = vi.fn();
    render(<Host active onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no column panel is open, or for other keys", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Host active={false} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    rerender(<Host active onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("an open modal or menu inside takes the Escape first", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Host active onClose={onClose}><div role="menu" /></Host>);
    fireEvent.keyDown(window, { key: "Escape" });
    rerender(<Host active onClose={onClose}><div role="dialog" /></Host>);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("not while typing in a field", () => {
    const onClose = vi.fn();
    const { getByRole } = render(<Host active onClose={onClose}><textarea /></Host>);
    fireEvent.keyDown(getByRole("textbox"), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("reads the overlay before the overlay's own Escape handler can remove it", () => {
    const onClose = vi.fn();
    function Menu() {
      const [open, setOpen] = React.useState(true);
      React.useEffect(() => {
        const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
      }, []);
      return open ? <div role="menu" /> : null;
    }
    render(<Host active onClose={onClose}><Menu /></Host>);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
