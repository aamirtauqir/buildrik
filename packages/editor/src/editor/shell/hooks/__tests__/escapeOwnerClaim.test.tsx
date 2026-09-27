/**
 * P-6 edges — the `data-bk-escape-owner` claim is a COUNT (the column, Issues
 * and AI hooks can overlap), and the engine's deselect stands down for an
 * open dialog as well as a menu.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommandCenter } from "@/engine/commands/CommandCenter";
import type { Composer } from "@/engine";
import { useColumnPanelEscape } from "../useColumnPanelEscape";

function Column({ active }: { active: boolean }) {
  useColumnPanelEscape(active, () => {});
  return null;
}

const centers: CommandCenter[] = [];
afterEach(() => {
  cleanup();
  centers.splice(0).forEach((c) => c.destroy());
  document.body.removeAttribute("data-bk-escape-owner");
  document.body.innerHTML = "";
});

describe("useColumnPanelEscape — overlapping claims", () => {
  it("releasing one of two owners keeps the claim; releasing both clears it", () => {
    const a = render(<Column active />);
    const b = render(<Column active />);
    expect(document.body.getAttribute("data-bk-escape-owner")).toBe("2");
    a.unmount();
    expect(document.body.getAttribute("data-bk-escape-owner")).toBe("1");
    b.unmount();
    expect(document.body.hasAttribute("data-bk-escape-owner")).toBe(false);
  });

  it("an inactive panel claims nothing, and deactivating releases", () => {
    const view = render(<Column active={false} />);
    expect(document.body.hasAttribute("data-bk-escape-owner")).toBe(false);
    view.rerender(<Column active />);
    expect(document.body.getAttribute("data-bk-escape-owner")).toBe("1");
    view.rerender(<Column active={false} />);
    expect(document.body.hasAttribute("data-bk-escape-owner")).toBe(false);
  });
});

describe("CommandCenter deselect — ESCAPE_OWNERS carve-out", () => {
  it("an open dialog keeps the selection; once it is gone Escape deselects", () => {
    const composer = {
      readOnly: false,
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      selection: { getSelectedIds: vi.fn(() => ["el-1"]), clear: vi.fn() },
      elements: { getElement: vi.fn(() => null) },
    };
    centers.push(new CommandCenter(composer as unknown as Composer));
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    document.body.appendChild(dialog);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(composer.selection.clear).not.toHaveBeenCalled();
    dialog.remove();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(composer.selection.clear).toHaveBeenCalledTimes(1);
  });
});
