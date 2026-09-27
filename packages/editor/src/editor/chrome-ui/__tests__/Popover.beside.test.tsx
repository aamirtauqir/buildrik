/**
 * P-4 — a `beside` popover escapes its column.
 *
 * The inspector's colour picker opens beside the inspector column, over the
 * canvas. It used to stay a DOM child of the trigger, inside the inspector's
 * scroll container, which clips everything past its left edge: measured live,
 * `elementFromPoint` at the panel's centre returned the canvas. The panel now
 * mounts in the shared overlay root with fixed coordinates.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Popover } from "../index";

const orig = Element.prototype.getBoundingClientRect;
afterEach(() => {
  Element.prototype.getBoundingClientRect = orig;
  document.querySelectorAll(".col").forEach((n) => n.remove());
  delete (document.documentElement as unknown as Record<string, unknown>).clientWidth;
  delete (document.documentElement as unknown as Record<string, unknown>).clientHeight;
});

/** The trigger's viewport top — a test moves it to simulate scrolling. */
let triggerTop = 490;

function mountColumn() {
  triggerTop = 490;
  const col = document.createElement("aside");
  col.className = "col";
  col.style.overflow = "auto";
  Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value: 1440 });
  Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: 900 });
  document.body.appendChild(col);
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const r = this.classList?.contains("col")
      ? { left: 1140, right: 1440, top: 56, bottom: 900, width: 300, height: 844 }
      : this.getAttribute?.("role") === "dialog"
        ? { left: 0, right: 282, top: 0, bottom: 341, width: 282, height: 341 }
        : { left: 1160, right: 1420, top: triggerTop, bottom: triggerTop + 28, width: 260, height: 28 };
    return { x: r.left, y: r.top, toJSON: () => ({}), ...r } as DOMRect;
  };
  return col;
}

describe("Popover beside= (P-4)", () => {
  it("renders the panel outside the clipping column, in the overlay root, fixed beside the column", async () => {
    const col = mountColumn();
    render(
      <Popover open onClose={() => {}} trigger={<button>Fill</button>} label="Fill" beside=".col">
        <div>tokens</div>
      </Popover>,
      { container: col },
    );
    const dialog = await screen.findByRole("dialog", { name: "Fill" });
    expect(col.contains(dialog)).toBe(false);
    expect(document.getElementById("bk-overlay-root")?.contains(dialog)).toBe(true);
    expect(dialog.className).toContain("tw:fixed");
    expect(dialog.className).not.toContain("tw:absolute");
    // Right edge 9px clear of the column (1140 - 9 - 282 = 849), top on the trigger.
    expect(dialog.style.left).toBe("849px");
    expect(dialog.style.top).toBe("490px");
  });

  it("a press inside the portalled panel does not count as outside", async () => {
    const col = mountColumn();
    const onClose = vi.fn();
    render(
      <Popover open onClose={onClose} trigger={<button>Fill</button>} label="Fill" beside=".col">
        <button>Primary</button>
      </Popover>,
      { container: col },
    );
    const item = await screen.findByRole("button", { name: "Primary" });
    act(() => {
      fireEvent.pointerDown(item);
    });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("re-places the panel when an ancestor scrolls", async () => {
    const col = mountColumn();
    render(
      <Popover open onClose={() => {}} trigger={<button>Fill</button>} label="Fill" beside=".col">
        <div>tokens</div>
      </Popover>,
      { container: col },
    );
    const dialog = await screen.findByRole("dialog", { name: "Fill" });
    expect(dialog.style.top).toBe("490px");
    triggerTop = 300;
    act(() => {
      fireEvent.scroll(col);
    });
    expect(dialog.style.top).toBe("300px");
  });

  it("stops re-placing on scroll once closed", async () => {
    const col = mountColumn();
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { rerender } = render(
      <Popover open onClose={() => {}} trigger={<button>Fill</button>} label="Fill" beside=".col">
        <div>tokens</div>
      </Popover>,
      { container: col },
    );
    await screen.findByRole("dialog", { name: "Fill" });
    rerender(
      <Popover open={false} onClose={() => {}} trigger={<button>Fill</button>} label="Fill" beside=".col">
        <div>tokens</div>
      </Popover>,
    );
    expect(removeSpy.mock.calls.some(([type, , capture]) => type === "scroll" && capture === true)).toBe(true);
    removeSpy.mockRestore();
  });

  it("opening moves focus to the panel's first focusable element", async () => {
    const col = mountColumn();
    render(
      <Popover open onClose={() => {}} trigger={<button>Fill</button>} label="Fill" beside=".col">
        <p>Brand colours</p>
        <button>Primary</button>
        <button>Secondary</button>
      </Popover>,
      { container: col },
    );
    const first = await screen.findByRole("button", { name: "Primary" });
    expect(document.activeElement).toBe(first);
  });

  it("Escape returns focus to the trigger", async () => {
    const col = mountColumn();
    const onClose = vi.fn();
    render(
      <Popover open onClose={onClose} trigger={<button>Fill</button>} label="Fill" beside=".col">
        <button>Primary</button>
      </Popover>,
      { container: col },
    );
    const first = await screen.findByRole("button", { name: "Primary" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fill" }));
  });

  it("closing from inside the panel (a pick) returns focus to the trigger", async () => {
    const col = mountColumn();
    const panel = (open: boolean) => (
      <Popover open={open} onClose={() => {}} trigger={<button>Fill</button>} label="Fill" beside=".col">
        <button>Primary</button>
      </Popover>
    );
    const { rerender } = render(panel(true), { container: col });
    await screen.findByRole("button", { name: "Primary" });
    rerender(panel(false));
    expect(screen.queryByRole("dialog", { name: "Fill" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fill" }));
  });

  it("closing after focus left the panel does not pull focus back", async () => {
    const col = mountColumn();
    const outside = document.createElement("input");
    document.body.appendChild(outside);
    const panel = (open: boolean) => (
      <Popover open={open} onClose={() => {}} trigger={<button>Fill</button>} label="Fill" beside=".col">
        <button>Primary</button>
      </Popover>
    );
    const { rerender } = render(panel(true), { container: col });
    await screen.findByRole("button", { name: "Primary" });
    act(() => outside.focus());
    rerender(panel(false));
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });
});
