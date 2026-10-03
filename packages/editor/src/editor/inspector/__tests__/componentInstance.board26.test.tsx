// @vitest-environment jsdom
/**
 * Board 26 on a real Composer + ProInspector: a component instance's root
 * container draws Component · Size · Spacing · Fill · Border — no Layout and
 * no Text inside (its structure and text are the master's) — unless the
 * instance already overrides one of their properties. The "◆ Component" mark
 * is its own row between the header and the tabs.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { ProInspector } from "../ProInspector";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

async function setup() {
  const c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const banner = c.elements.createElement("container" as never, {} as never);
  c.elements.addElement(banner, root);
  const comp = (await c.components.createComponent("Reservation banner", banner.getId()))!;
  const id = (await c.components.instantiateComponent(comp.id, root))!;
  const show = async (elementId: string) => {
    cleanup();
    const el = c.elements.getElement(elementId)!;
    c.selection.select(el);
    render(
      <ToastProvider>
        <ProInspector composer={c} currentBreakpoint="desktop" selectedElement={{ id: elementId, type: el.getType(), tagName: el.getTagName() }} />
      </ToastProvider>
    );
    await act(async () => {});
  };
  return { c, id, show, plainId: banner.getId() };
}

const section = (id: string) => document.getElementById(`inspector-section-${id}`);

describe("board 26 — component instance", () => {
  it("draws no Layout and no Text inside on the instance root", async () => {
    const { id, show, plainId } = await setup();
    await show(plainId);
    expect(section("layout"), "a plain container keeps Layout").not.toBeNull();
    expect(section("text-inside"), "a plain container keeps Text inside").not.toBeNull();
    await show(id);
    for (const s of ["component", "size", "spacing", "fill", "border"]) expect(section(s), s).not.toBeNull();
    expect(section("layout")).toBeNull();
    expect(section("text-inside")).toBeNull();
  });

  it("an instance that already overrides a Layout property still shows Layout", async () => {
    const { c, id, show } = await setup();
    c.elements.getElement(id)!.setStyle("display", "flex");
    await show(id);
    expect(section("layout")).not.toBeNull();
    expect(section("text-inside")).toBeNull();
  });

  it("the status mark is its own row between the header and the tabs", async () => {
    const { id, show } = await setup();
    await show(id);
    const marks = screen.getByTestId("inspector-status-marks");
    expect(screen.getByTestId("inspector-header").contains(marks)).toBe(false);
    expect(marks.previousElementSibling).toBe(screen.getByTestId("inspector-header"));
    expect(screen.getByTestId("inspector-mark-component")).toHaveTextContent("Component: Reservation banner");
  });
});
