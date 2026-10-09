// @vitest-environment jsdom
/**
 * StatusMarks — the status row under the inspector header (boards 23–26):
 * only when true, its own padded row, and the binding chip that opens
 * Behaviour › CMS binding. Real Composer.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import type { Composer } from "@/engine/Composer";
import { EVENTS } from "@/shared/constants/events";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { StatusMarks } from "../StatusMarks";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let c: Composer;
let headingId: string;

beforeEach(() => {
  cleanup();
  c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const h = c.elements.createElement("heading", { content: "Hi" });
  c.elements.addElement(h, root);
  headingId = h.getId();
});

const mount = (over: Partial<React.ComponentProps<typeof StatusMarks>> = {}) =>
  render(<StatusMarks composer={c} elementId={headingId} binding={null} locked={false} {...over} />);

describe("StatusMarks", () => {
  it("renders nothing when no mark is true", () => {
    mount();
    expect(screen.queryByTestId("inspector-status-marks")).toBeNull();
  });

  it("is its own row: 4 · 12 around the chip (boards 24/25), 8 · 16 around a text mark (board 26's note)", () => {
    mount({ locked: true, binding: { label: "Specials.title", missing: true, collectionId: "x" } });
    const row = screen.getByTestId("inspector-status-marks");
    expect(row.className).toContain("tw:px-3");
    expect(row.className).toContain("tw:py-1");
    expect(screen.getByTestId("inspector-mark-locked").className).toContain("tw:px-1 tw:py-1");
    expect(screen.getByTestId("inspector-mark-locked")).toHaveTextContent("Locked");
    expect(screen.getByTestId("inspector-bound-chip")).toHaveTextContent("Specials.title · missing");
  });

  it("boards 24/25: the binding is a 28-tall chip with a ▾ — gray-50 + accent when bound, error border + tint when missing", () => {
    const { unmount } = mount({ binding: { label: "Menu.name", missing: false, collectionId: "m" } });
    let chip = screen.getByTestId("inspector-bound-chip");
    expect(chip).toHaveAttribute("data-tone", "bound");
    expect(chip.className).toContain("tw:border-transparent");
    expect(chip.className).toContain("--bk-gray-50");
    expect(chip.className).toContain("tw:h-7");
    expect(chip.querySelectorAll("svg")).toHaveLength(2);
    unmount();
    mount({ binding: { label: "Specials.title", missing: true, collectionId: "x" } });
    chip = screen.getByTestId("inspector-bound-chip");
    expect(chip).toHaveAttribute("data-tone", "missing");
    expect(chip.className).toContain("--bk-error-tint");
    expect(chip.className).toContain("tw:border-[var(--bk-error)]");
  });

  it("the binding chip opens Behaviour › CMS binding", () => {
    const focus = vi.fn();
    c.on(EVENTS.UI_INSPECTOR_FOCUS_SECTION, focus);
    mount({ binding: { label: "Menu.name", missing: false, collectionId: "m" } });
    fireEvent.click(screen.getByTestId("inspector-bound-chip"));
    expect(focus).toHaveBeenCalledWith({ section: "cms-binding" });
  });

  /* L2-028: renaming the master left "Component: <old name>" until reselect. */
  it("the component mark follows a master rename", () => {
    const master = { id: "cmp-1", name: "Audit Feature Card" };
    vi.spyOn(c.components, "getInstanceByElementId").mockReturnValue({ componentId: "cmp-1" } as never);
    vi.spyOn(c.components, "getComponent").mockImplementation(() => ({ ...master }) as never);
    mount();
    expect(screen.getByTestId("inspector-mark-component").textContent).toContain("Audit Feature Card");
    master.name = "Audit Card Renamed";
    act(() => c.emit(EVENTS.COMPONENT_UPDATED, { id: "cmp-1" }));
    expect(screen.getByTestId("inspector-mark-component").textContent).toContain("Audit Card Renamed");
  });
});
