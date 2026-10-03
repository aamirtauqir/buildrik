// @vitest-environment jsdom
/**
 * StatusLine (replaced LockedBanner) — why the panel is read-only and the one
 * way out: "Locked — unlock to edit · Unlock" (board 23; the shared
 * unlock-element command, one undo step) and the save-conflict line (board 29).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { StatusLine } from "../StatusLine";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

const idle = { pending: false, resolve: vi.fn() };

describe("StatusLine", () => {
  it("says nothing when the element is editable", () => {
    const { container } = render(<StatusLine composer={null} elementId="x" locked={false} conflict={idle} />);
    expect(container.textContent).toBe("");
  });

  it("locked: the line, and Unlock unlocks in one undo step", () => {
    const c = createTestComposer();
    const root = c.elements.createPage("Home").root.id;
    const h = c.elements.createElement("heading");
    c.elements.addElement(h, root);
    const el = c.elements.getElement(h.getId())!;
    el.setLocked(true);
    c.history.flushPending();
    render(<StatusLine composer={c} elementId={el.getId()} locked conflict={idle} />);
    expect(screen.getByTestId("inspector-status-line")).toHaveTextContent("Locked — unlock to edit");
    fireEvent.click(screen.getByTestId("inspector-unlock"));
    expect(c.elements.getElement(el.getId())!.isLocked()).toBe(false);
    c.history.flushPending();
    c.history.undo();
    expect(c.elements.getElement(el.getId())!.isLocked()).toBe(true);
  });

  it("a pending save conflict wins, and Resolve reopens its dialog", () => {
    const resolve = vi.fn();
    render(<StatusLine composer={null} elementId="x" locked conflict={{ pending: true, resolve }} />);
    expect(screen.getByTestId("inspector-status-line")).toHaveTextContent("This site changed elsewhere — resolve to keep editing");
    fireEvent.click(screen.getByTestId("inspector-resolve"));
    expect(resolve).toHaveBeenCalled();
  });

  it("board 29: the conflict line is warning-tinted; the locked line is not", () => {
    const { unmount } = render(<StatusLine composer={null} elementId="x" locked={false} conflict={{ pending: true, resolve: vi.fn() }} />);
    let line = screen.getByTestId("inspector-status-line");
    expect(line).toHaveAttribute("data-tone", "warning");
    expect(line.className).toContain("--bk-warning-tint");
    unmount();
    render(<StatusLine composer={null} elementId="x" locked conflict={idle} />);
    line = screen.getByTestId("inspector-status-line");
    expect(line).toHaveAttribute("data-tone", "muted");
    expect(line.className).not.toContain("--bk-warning-tint");
    /* Boards 23 / 29 pad the line 6 · 16; the 24px action gives its extra 8 back. */
    expect(line.className).toContain("tw:px-4");
    expect(line.className).toContain("tw:py-1.5");
    expect(screen.getByTestId("inspector-unlock").className).toContain("tw:-my-1");
  });
});
