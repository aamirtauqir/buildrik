/**
 * L1-019 (editor audit 2026-10-08): text, buttons and inputs (< 50 px tall)
 * had no left/right edge handle, so a horizontal resize had to be a corner
 * drag that also pinned the height. E and W show on every element now,
 * shortened to fit between the corners.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { SelectionHandles } from "../SelectionHandles";

describe("SelectionHandles — width-only edges on short elements", () => {
  it("a 40 px tall button gets E and W handles that stay inside its height", () => {
    render(<SelectionHandles left={100} top={200} width={136} height={40} onHandleMouseDown={vi.fn()} />);
    for (const name of ["Resize from right edge", "Resize from left edge"]) {
      const handle = screen.getByRole("button", { name });
      const top = parseFloat(handle.style.top);
      const h = parseFloat(handle.style.height);
      expect(top).toBeGreaterThanOrEqual(200);
      expect(top + h).toBeLessThanOrEqual(240);
    }
  });

  it("a tall element keeps the 24 px edge handle", () => {
    render(<SelectionHandles left={0} top={0} width={300} height={200} onHandleMouseDown={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Resize from right edge" }).style.height).toBe("24px");
  });
});
