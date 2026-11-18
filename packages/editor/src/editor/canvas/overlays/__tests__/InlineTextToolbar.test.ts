/**
 * placeInlineToolbar — the inline text toolbar sits ABOVE the text being
 * edited, flips below when there is no room, and stays inside the visible
 * canvas (audit 2026-10-20 #16: it covered the text and ran past the edge).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { placeInlineToolbar } from "../InlineTextToolbar";

const bounds = { top: 100, left: 300, right: 1100, bottom: 800 };
const size = { width: 400, height: 34 };

describe("placeInlineToolbar", () => {
  it("sits above the element with a gap when there is room", () => {
    const pos = placeInlineToolbar({ top: 300, left: 400, bottom: 360 }, size, bounds);
    expect(pos.top).toBe(300 - 8 - 34);
    expect(pos.left).toBe(400);
  });

  it("flips below when the element is at the top of the viewport — never over the text", () => {
    const anchor = { top: 120, left: 400, bottom: 230 };
    const pos = placeInlineToolbar(anchor, size, bounds);
    expect(pos.top).toBe(230 + 8);
  });

  it("is pulled left so its right edge stays inside the viewport", () => {
    const pos = placeInlineToolbar({ top: 300, left: 900, bottom: 360 }, size, bounds);
    expect(pos.left + size.width).toBeLessThanOrEqual(bounds.right - 8);
  });

  it("never starts left of the viewport", () => {
    const pos = placeInlineToolbar({ top: 300, left: 100, bottom: 360 }, size, bounds);
    expect(pos.left).toBe(bounds.left + 8);
  });

  it("stays inside the viewport when the element fills it", () => {
    const pos = placeInlineToolbar({ top: 50, left: 400, bottom: 900 }, size, bounds);
    expect(pos.top).toBeGreaterThanOrEqual(bounds.top + 8);
    expect(pos.top + size.height).toBeLessThanOrEqual(bounds.bottom - 8);
  });
});
