/**
 * `portal` — a popover wider than the column its trigger sits in.
 *
 * The inspector's ⋯ menu is 320 wide over the canvas (board 30); anchored
 * inside the 300px column it was clipped at the column's edge. With `portal`
 * the panel mounts in the overlay root at fixed coordinates that reproduce
 * the anchored placement: bottom-end = right edge on the trigger's, 4px below.
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

function mountColumn() {
  const col = document.createElement("aside");
  col.className = "col";
  col.style.overflow = "hidden";
  Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value: 1440 });
  Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: 900 });
  document.body.appendChild(col);
  /* Trigger: the 24px ⋯ at 1368..1392 × 90..114; panel 320 × 300. */
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const r =
      this.getAttribute?.("role") === "dialog"
        ? { left: 0, right: 320, top: 0, bottom: 300, width: 320, height: 300 }
        : { left: 1368, right: 1392, top: 90, bottom: 114, width: 24, height: 24 };
    return { x: r.left, y: r.top, toJSON: () => ({}), ...r } as DOMRect;
  };
  return col;
}

describe("Popover portal", () => {
  it("mounts in the overlay root, fixed, right edge on the trigger and 4px below it (bottom-end)", async () => {
    const col = mountColumn();
    render(
      <Popover open onClose={() => {}} trigger={<button>⋯</button>} label="Element actions" placement="bottom-end" portal>
        <div>rows</div>
      </Popover>,
      { container: col },
    );
    const dialog = await screen.findByRole("dialog", { name: "Element actions" });
    expect(col.contains(dialog)).toBe(false);
    expect(document.getElementById("bk-overlay-root")?.contains(dialog)).toBe(true);
    expect(dialog.className).toContain("tw:fixed");
    expect(dialog.className).not.toContain("tw:absolute");
    expect(dialog.style.left).toBe(`${1392 - 320}px`);
    expect(dialog.style.top).toBe("118px");
  });

  it("a press inside the portalled panel is not outside; a press elsewhere closes", async () => {
    const col = mountColumn();
    const onClose = vi.fn();
    render(
      <Popover open onClose={onClose} trigger={<button>⋯</button>} label="Element actions" placement="bottom-end" portal>
        <button>Duplicate</button>
      </Popover>,
      { container: col },
    );
    const item = await screen.findByRole("button", { name: "Duplicate" });
    act(() => {
      fireEvent.pointerDown(item);
    });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it("opening moves focus into the panel (Tab from the trigger would not reach it)", async () => {
    const col = mountColumn();
    render(
      <Popover open onClose={() => {}} trigger={<button>⋯</button>} label="Element actions" placement="bottom-end" portal>
        <button>Duplicate</button>
      </Popover>,
      { container: col },
    );
    const item = await screen.findByRole("button", { name: "Duplicate" });
    expect(document.activeElement).toBe(item);
  });
});
