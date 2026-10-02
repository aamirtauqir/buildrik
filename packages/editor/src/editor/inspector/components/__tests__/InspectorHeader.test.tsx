// @vitest-environment jsdom
/**
 * InspectorHeader — board 1's header: the element path (crumbs go there),
 * icon + name, ✦ AI, ⋯, ✕ hide (⌘\), and the status marks only when true.
 * Real Composer.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import { EVENTS } from "@/shared/constants/events";
import { ToastProvider } from "@/editor/chrome-ui";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { InspectorHeader } from "../InspectorHeader";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let c: Composer;
let section: Element;
let heading: Element;

beforeEach(() => {
  cleanup();
  c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const s = c.elements.createElement("section");
  c.elements.addElement(s, root);
  section = c.elements.getElement(s.getId())!;
  const h = c.elements.createElement("heading", { content: "Hi" });
  c.elements.addElement(h, section.getId());
  heading = c.elements.getElement(h.getId())!;
  c.selection.select(heading);
});

const mount = (over: Partial<React.ComponentProps<typeof InspectorHeader>> = {}) =>
  render(
    <ToastProvider>
      <InspectorHeader
        composer={c}
        element={{ id: heading.getId(), type: "heading" }}
        selectedIds={[heading.getId()]}
        binding={null}
        locked={false}
        {...over}
      />
    </ToastProvider>
  );

describe("InspectorHeader", () => {
  it("draws the path page › ancestors › element, as a named landmark", () => {
    mount();
    const nav = screen.getByRole("navigation", { name: "Element path" });
    expect(nav.textContent).toBe("Home›Section›Heading");
  });

  it("an ancestor crumb selects it; the page crumb clears the selection", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Section" }));
    expect(c.selection.getSelected()?.getId()).toBe(section.getId());
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(c.selection.getSelected()).toBeFalsy();
  });

  it("carries ✦ AI, ⋯ and ✕ — and ✕ hides the inspector", () => {
    const hide = vi.fn();
    c.on(EVENTS.UI_TOGGLE_INSPECTOR, hide);
    mount();
    expect(screen.getByTestId("inspector-ai-chip")).toHaveTextContent("✦ AI");
    /* Every board draws the chip 40 wide. */
    expect(screen.getByTestId("inspector-ai-chip").className).toContain("tw:w-10");
    expect(screen.getByTestId("inspector-element-menu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide inspector (⌘\\)" }));
    expect(hide).toHaveBeenCalled();
  });

  it("status marks appear only when true", () => {
    const { unmount } = mount();
    expect(screen.queryByTestId("inspector-status-marks")).toBeNull();
    unmount();
    mount({ locked: true, binding: { label: "Specials.title", missing: true, collectionId: "x" } });
    expect(screen.getByTestId("inspector-mark-locked")).toHaveTextContent("Locked");
    expect(screen.getByTestId("inspector-bound-chip")).toHaveTextContent("Specials.title · missing");
  });

  it("boards 24/25: the binding is a bordered chip with a ▾ — accent when bound, error-tinted when missing", () => {
    const { unmount } = mount({ binding: { label: "Menu.name", missing: false, collectionId: "m" } });
    let chip = screen.getByTestId("inspector-bound-chip");
    expect(chip).toHaveAttribute("data-tone", "bound");
    expect(chip.className).toContain("tw:border ");
    expect(chip.querySelectorAll("svg")).toHaveLength(2);
    unmount();
    mount({ binding: { label: "Specials.title", missing: true, collectionId: "x" } });
    chip = screen.getByTestId("inspector-bound-chip");
    expect(chip).toHaveAttribute("data-tone", "missing");
    expect(chip.className).toContain("--bk-error-tint");
  });

  it("the binding chip opens Behaviour › CMS binding", () => {
    const focus = vi.fn();
    c.on(EVENTS.UI_INSPECTOR_FOCUS_SECTION, focus);
    mount({ binding: { label: "Menu.name", missing: false, collectionId: "m" } });
    fireEvent.click(screen.getByTestId("inspector-bound-chip"));
    expect(focus).toHaveBeenCalledWith({ section: "cms-binding" });
  });

  it("multi: '3 selected · Headings', path to the common parent", () => {
    const more = [1, 2].map(() => {
      const h = c.elements.createElement("heading");
      c.elements.addElement(h, section.getId());
      return h.getId();
    });
    mount({ selectedIds: [heading.getId(), ...more] });
    expect(screen.getByTestId("inspector-element-name")).toHaveTextContent("3 selected · Headings");
    // Board 22: the path is the shared parent's ("Home › Hero"), not repeated
    // as a last crumb, and the name row draws no type icon.
    const nav = screen.getByRole("navigation", { name: "Element path" });
    expect(nav.textContent).toBe("Home›Section");
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe("Section");
    expect(screen.queryByTestId("inspector-type-icon")).toBeNull();
  });

  it("single: the name row draws the type icon", () => {
    mount();
    expect(screen.getByTestId("inspector-type-icon")).toBeInTheDocument();
  });
});
