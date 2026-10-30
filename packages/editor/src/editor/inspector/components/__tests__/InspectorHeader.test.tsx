// @vitest-environment jsdom
/**
 * InspectorHeader — Shell/InspectorHeader (2L9 `497:339496`, plan Task 1.4):
 * Target row (icon + name, ⋯, ✕ hide (⌘\)) and the "Editing" row — a
 * read-only `${breakpoint} ·` prefix + the state Select, with the element
 * path between them on every page (2L9 S31; owner rule 2026-10-26: the board
 * wins over the template-page-only default). The status marks are their own
 * row. Real Composer.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import type { PseudoStateId } from "@/shared/types";
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

type Props = React.ComponentProps<typeof InspectorHeader>;
const baseProps = (over: Partial<Props> = {}): Props => ({
  composer: c,
  element: { id: heading.getId(), type: "heading" },
  selectedIds: [heading.getId()],
  breakpointLabel: "Desktop",
  activeTab: "style",
  state: "normal",
  onStateChange: () => {},
  ...over,
});
const mount = (over: Partial<Props> = {}) =>
  render(
    <ToastProvider>
      <InspectorHeader {...baseProps(over)} />
    </ToastProvider>
  );

const rowOf = (testId: string) => screen.getByTestId(testId);

describe("InspectorHeader", () => {
  it('one "Editing" select shows "Desktop · Default state"; no separate breakpoint line', () => {
    mount();
    const row = rowOf("inspector-editing-row");
    const select = screen.getByLabelText("Editing") as HTMLSelectElement;
    expect(select.tagName).toBe("SELECT");
    expect(row.contains(select)).toBe(true);
    expect(screen.getByTestId("inspector-breakpoint-prefix").textContent).toBe("Desktop ·");
    expect(select.selectedOptions[0].textContent).toBe("Default state");
    expect(`${screen.getByTestId("inspector-breakpoint-prefix").textContent} ${select.selectedOptions[0].textContent}`).toBe(
      "Desktop · Default state"
    );
    /* No second breakpoint readout anywhere in the header. */
    expect(screen.getByTestId("inspector-header").textContent?.match(/Desktop/g)).toHaveLength(1);
    expect(screen.queryAllByRole("combobox")).toHaveLength(1);
  });

  /* B-10 / boards 161:8480, 161:13919, 36:2: the context line follows the
     tab. Content and Behavior writes are breakpoint- and state-independent,
     so those tabs carry no state Select. */
  describe("the context line follows the active tab (B-10)", () => {
    it('Content reads "Content · All breakpoints", with no state Select', () => {
      mount({ activeTab: "content" });
      expect(rowOf("inspector-editing-row").textContent).toBe("Content · All breakpoints");
      expect(screen.queryByRole("combobox")).toBeNull();
      expect(rowOf("inspector-editing-row").className).toContain("tw:h-8");
    });

    it('Behavior reads "Behavior · {type}", with no state Select', () => {
      mount({ activeTab: "behaviour" });
      expect(rowOf("inspector-editing-row").textContent).toBe("Behavior · Heading");
      expect(screen.queryByRole("combobox")).toBeNull();
    });

    it.each(["style", "effects"] as const)('%s keeps "Editing {breakpoint} · {state}" with the state Select', (tab) => {
      mount({ activeTab: tab, breakpointLabel: "Tablet" });
      expect(screen.getByTestId("inspector-breakpoint-prefix").textContent).toBe("Tablet ·");
      expect(screen.getByRole("combobox", { name: "Editing" })).toBeTruthy();
    });
  });

  it('the Editing select is reachable by Tab and labelled "Editing"', async () => {
    const user = userEvent.setup();
    mount();
    const select = screen.getByRole("combobox", { name: "Editing" });
    /* The last focusable before it is the path's last link crumb. */
    screen.getByRole("button", { name: "Section" }).focus();
    await user.tab();
    expect(document.activeElement).toBe(select);
  });

  it("Editing options are states only; changing breakpoint in the topbar updates the prefix", () => {
    const onStateChange = vi.fn();
    const view = mount({ onStateChange });
    const select = screen.getByRole("combobox", { name: "Editing" }) as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual([
      "Default state",
      "Hover state",
      "Focus state",
      "Active state",
      "Disabled state",
    ]);
    fireEvent.change(select, { target: { value: "hover" } });
    expect(onStateChange).toHaveBeenCalledWith("hover");
    /* The breakpoint is a prop from the topbar switcher — the header offers no
       way to change it, and re-renders its prefix when it changes. */
    view.rerender(
      <ToastProvider>
        <InspectorHeader {...baseProps({ breakpointLabel: "Tablet", state: "hover" as PseudoStateId })} />
      </ToastProvider>
    );
    expect(screen.getByTestId("inspector-breakpoint-prefix").textContent).toBe("Tablet ·");
    expect((screen.getByRole("combobox", { name: "Editing" }) as HTMLSelectElement).selectedOptions[0].textContent).toBe(
      "Hover state"
    );
  });

  it("a state with overrides at this breakpoint says so in its option", () => {
    mount({ statesWithOverrides: new Set<PseudoStateId>(["hover"]) });
    const select = screen.getByRole("combobox", { name: "Editing" }) as HTMLSelectElement;
    expect(select.options[1].textContent).toBe("Hover state · edited");
  });

  it("carries ⋯ and ✕ — and ✕ hides the inspector", () => {
    const hide = vi.fn();
    c.on(EVENTS.UI_TOGGLE_INSPECTOR, hide);
    mount();
    expect(screen.getByTestId("inspector-element-menu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide inspector (⌘\\)" }));
    expect(hide).toHaveBeenCalled();
  });

  it("inspector-ai-chip does not render (owner: no AI in the UI)", () => {
    mount();
    expect(screen.queryByTestId("inspector-ai-chip")).toBeNull();
    expect(screen.queryByRole("button", { name: /AI/ })).toBeNull();
  });

  it("104 tall like the boards: target row, path row, a 32 Editing row; no status marks inside", () => {
    mount();
    const header = screen.getByTestId("inspector-header");
    expect(header.className).toContain("tw:p-3");
    expect(header.className).toContain("tw:gap-1");
    expect(rowOf("inspector-target-row").className).toContain("tw:h-6");
    expect(rowOf("inspector-path-row").className).toContain("tw:h-4");
    expect(rowOf("inspector-editing-row").className).toContain("tw:h-8");
    expect([...header.children].map((r) => r.getAttribute("data-testid"))).toEqual(["inspector-target-row", "inspector-path-row", "inspector-editing-row"]);
    expect(header.querySelector('[data-testid="inspector-status-marks"]')).toBeNull();
  });

  it("header height is equal for a depth-1 and a depth-4 selection on the same page", () => {
    const root = c.elements.getActivePage()!.root.id;
    const a = c.elements.createElement("container");
    c.elements.addElement(a, root);
    const b = c.elements.createElement("container");
    c.elements.addElement(b, a.getId());
    const d = c.elements.createElement("container");
    c.elements.addElement(d, b.getId());
    const deep = c.elements.createElement("text", { content: "deep" });
    c.elements.addElement(deep, d.getId());
    const shape = () => [...screen.getByTestId("inspector-header").children].map((r) => r.className);
    mount({ element: { id: section.getId(), type: "section" }, selectedIds: [section.getId()] });
    const shallow = shape();
    cleanup();
    mount({ element: { id: deep.getId(), type: "text" }, selectedIds: [deep.getId()] });
    expect(shape()).toEqual(shallow);
    expect(shallow).toHaveLength(3);
  });

  describe("the element path (S31 258:37248)", () => {
    it("draws page › ancestors › element on any page, as a named landmark", () => {
      mount();
      const nav = screen.getByRole("navigation", { name: "Element path" });
      expect(nav.textContent).toBe("Home›Section›Heading");
      expect(nav.className).toContain("tw:h-4");
    });

    it("an ancestor crumb selects it; the page crumb clears the selection", () => {
      mount();
      fireEvent.click(screen.getByRole("button", { name: "Section" }));
      expect(c.selection.getSelected()?.getId()).toBe(section.getId());
      fireEvent.click(screen.getByRole("button", { name: "Home" }));
      expect(c.selection.getSelected()).toBeFalsy();
    });

    it("a longer path reads '… › parent › element'; … opens Selection path, each crumb selectable", () => {
      const box = c.elements.createElement("container");
      c.elements.addElement(box, section.getId());
      const h = c.elements.createElement("heading", { content: "Deep" });
      c.elements.addElement(h, box.getId());
      mount({ element: { id: h.getId(), type: "heading" }, selectedIds: [h.getId()] });
      expect(screen.getByRole("navigation", { name: "Element path" }).textContent).toBe("Container›Heading");
      expect(screen.getByTestId("inspector-path-row").textContent).toBe("…›Container›Heading");
      fireEvent.click(screen.getByTestId("inspector-path-more"));
      const menu = screen.getByRole("menu", { name: "Selection path" });
      expect([...menu.querySelectorAll('[role="menuitem"]')].map((m) => m.textContent)).toEqual(["Home", "Section", "Container", "Heading"]);
      fireEvent.click(screen.getByRole("menuitem", { name: "Section" }));
      expect(c.selection.getSelected()?.getId()).toBe(section.getId());
    });

    it("multi: '3 selected · Headings', path to the common parent", () => {
      const more = [1, 2].map(() => {
        const h = c.elements.createElement("heading");
        c.elements.addElement(h, section.getId());
        return h.getId();
      });
      mount({ selectedIds: [heading.getId(), ...more] });
      expect(screen.getByTestId("inspector-element-name")).toHaveTextContent("3 selected · Headings");
      const nav = screen.getByRole("navigation", { name: "Element path" });
      expect(nav.textContent).toBe("Home›Section");
      expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe("Section");
      expect(screen.queryByTestId("inspector-type-icon")).toBeNull();
    });

    it("multi: a type label ending in s pluralises with -es ('2 selected · Progresses')", () => {
      const bars = [0, 1].map(() => {
        const p = c.elements.createElement("progress");
        c.elements.addElement(p, section.getId());
        return p.getId();
      });
      mount({ element: { id: bars[0], type: "progress" }, selectedIds: bars });
      expect(screen.getByTestId("inspector-element-name")).toHaveTextContent("2 selected · Progresses");
    });
  });

  it("B5-D04: a bound element names its source in the name row; it opens Dynamic bindings", () => {
    const emit = vi.spyOn(c, "emit");
    mount({ boundTo: "Blog.title" });
    const chip = screen.getByTestId("inspector-bound-chip");
    expect(rowOf("inspector-target-row").contains(chip)).toBe(true);
    expect(chip).toHaveTextContent("Blog.title");
    fireEvent.click(chip);
    expect(emit).toHaveBeenCalledWith(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "cms-binding" });
  });

  it("IC06: just detached — the path row says what it was and what stayed", () => {
    mount({ detachedFrom: "Hero card" });
    expect(screen.getByTestId("inspector-detached-lines")).toHaveTextContent("Hero card · local groupDetached · content and styles retained");
    expect(screen.queryByRole("navigation", { name: "Element path" })).toBeNull();
  });

  it("S02: a load failure replaces the context line", () => {
    mount({ loadFailedLine: "Could not load Fieldwork Studio" });
    expect(screen.getByTestId("inspector-load-failed-line")).toHaveTextContent("Could not load Fieldwork Studio");
    expect(screen.queryByRole("combobox", { name: "Editing" })).toBeNull();
  });

  it("single: the name row draws the type icon", () => {
    mount();
    expect(screen.getByTestId("inspector-type-icon")).toBeInTheDocument();
  });
});
