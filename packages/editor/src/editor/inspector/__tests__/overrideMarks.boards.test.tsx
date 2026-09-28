// @vitest-environment jsdom
/**
 * Boards 27 / 28 end to end on a real Composer + ProInspector: the context
 * row's counts come from useFieldOverrides, the section frame draws the
 * note / header dot, and the FIELD that is overridden draws its own dot —
 * all from the same field context (boards 26, 27, 28).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { ProInspector } from "../ProInspector";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

function mount(type: string, breakpoint: "desktop" | "tablet" = "desktop") {
  const c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const el = c.elements.createElement(type as never, { content: "x" } as never);
  c.elements.addElement(el, root);
  c.selection.select(el);
  const id = el.getId();
  const view = () => (
    <ToastProvider>
      <ProInspector composer={c} currentBreakpoint={breakpoint} selectedElement={{ id, type: el.getType(), tagName: el.getTagName() }} />
    </ToastProvider>
  );
  return { c, id, view };
}

describe("override marks — boards 27 / 28", () => {
  it("27: :hover shows '1 :hover override · Reset' and Fill's note; Reset clears both", async () => {
    const { c, id, view } = mount("button");
    c.styles.setRule(`[data-buildrick-id="${id}"]`, { "background-color": "red" }, { pseudo: ":hover" });
    render(view());
    fireEvent.click(screen.getByTestId("inspector-state-chip"));
    fireEvent.click(screen.getByTestId("inspector-state-opt-hover"));
    await act(async () => {});
    expect(screen.getByTestId("inspector-state-overrides").textContent).toContain("1 :hover override");
    const fill = document.getElementById("inspector-section-fill")!;
    expect(within(fill).getByTestId("inspector-section-note").textContent).toBe("Overridden on :hover");
    /* The Colour row itself carries the dot (board 27 "Colour ●"). */
    expect(within(fill).getByTestId("inspector-override-dot-pseudo")).toBeTruthy();
    act(() => fireEvent.click(screen.getByTestId("inspector-state-reset")));
    expect(screen.queryByTestId("inspector-state-overrides")).toBeNull();
    expect(screen.queryByTestId("inspector-section-note")).toBeNull();
  });

  it("28: Tablet · 1 override, 'Size' header dot + note; Revert clears them", () => {
    const { c, id, view } = mount("heading", "tablet");
    c.styles.setBreakpointStyle(id, "tablet", { width: "480px" });
    render(view());
    expect(screen.getByTestId("inspector-bp-chip").textContent).toContain("Tablet · 1 override");
    const size = document.getElementById("inspector-section-size")!;
    expect(within(size).getByRole("img", { name: "Overridden on Tablet" })).toBeTruthy();
    expect(within(size).getByTestId("inspector-section-note").textContent).toBe("Overridden on Tablet");
    act(() => fireEvent.click(screen.getByTestId("inspector-bp-revert")));
    expect(screen.queryByTestId("inspector-section-note")).toBeNull();
  });

  it("26: an instance's padding edit puts a master dot on that SpacingBox side and the note on Spacing", async () => {
    const c = createTestComposer();
    const root = c.elements.createPage("Home").root.id;
    const banner = c.elements.createElement("container" as never, {} as never);
    c.elements.addElement(banner, root);
    const comp = (await c.components.createComponent("Reservation banner", banner.getId()))!;
    const id = (await c.components.instantiateComponent(comp.id, root))!;
    c.elements.getElement(id)!.setStyle("padding-top", "32px");
    const el = c.elements.getElement(id)!;
    c.selection.select(el);
    render(
      <ToastProvider>
        <ProInspector composer={c} currentBreakpoint="desktop" selectedElement={{ id, type: el.getType(), tagName: el.getTagName() }} />
      </ToastProvider>
    );
    await act(async () => {});
    const spacing = document.getElementById("inspector-section-spacing")!;
    const side = within(spacing).getByTestId("inspector-spacing-padding-top");
    expect(within(side).getByRole("button", { name: "Overrides master" })).toBeTruthy();
    expect(within(spacing).getByTestId("inspector-section-note").textContent).toBe("Padding overrides master");
  });
});
