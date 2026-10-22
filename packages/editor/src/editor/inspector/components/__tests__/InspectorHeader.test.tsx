// @vitest-environment jsdom
/**
 * InspectorHeader — Shell/InspectorHeader (2L9 `497:339496`, plan Task 1.4):
 * Target row (icon + name, ⋯, ✕ hide (⌘\)) and the "Editing" row — a
 * read-only `${breakpoint} ·` prefix + the state Select. The element path is
 * a third row only on a collection's template page. The status marks are
 * their own row. Real Composer.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import type { CMSCollection } from "@/shared/types/cms";
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

/** The active page (Home → index.html) becomes a collection's template page. */
const makeTemplatePage = () =>
  vi
    .spyOn(c.cms.collections, "getAllCollections")
    .mockReturnValue([{ id: "col", name: "Blog", pageTemplatePath: "index.html" } as CMSCollection]);

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

  it('the Editing select is reachable by Tab and labelled "Editing"', async () => {
    const user = userEvent.setup();
    mount();
    const select = screen.getByRole("combobox", { name: "Editing" });
    const hide = screen.getByRole("button", { name: "Hide inspector (⌘\\)" });
    hide.focus();
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

  it("84 tall like the board: 12 padding, a 24 target row and a 32 Editing row, 4 apart; no status marks inside", () => {
    mount();
    const header = screen.getByTestId("inspector-header");
    expect(header.className).toContain("tw:p-3");
    expect(header.className).toContain("tw:gap-1");
    expect(rowOf("inspector-target-row").className).toContain("tw:h-6");
    expect(rowOf("inspector-editing-row").className).toContain("tw:h-8");
    expect(header.children).toHaveLength(2);
    expect(header.querySelector('[data-testid="inspector-status-marks"]')).toBeNull();
  });

  it("off a template page there is no element path", () => {
    mount();
    expect(screen.queryByRole("navigation", { name: "Element path" })).toBeNull();
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

    for (const template of [false, true]) {
      cleanup();
      if (template) makeTemplatePage();
      mount({ element: { id: section.getId(), type: "section" }, selectedIds: [section.getId()] });
      const shallow = shape();
      cleanup();
      mount({ element: { id: deep.getId(), type: "text" }, selectedIds: [deep.getId()] });
      /* Same rows, same row classes → same height (84, or 104 on a template). */
      expect(shape()).toEqual(shallow);
      expect(shallow).toHaveLength(template ? 3 : 2);
    }
  });

  describe("on a collection template page (the 104 variant)", () => {
    beforeEach(makeTemplatePage);

    it("draws the path page › ancestors › element, as a named landmark", () => {
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
  });

  it("single: the name row draws the type icon", () => {
    mount();
    expect(screen.getByTestId("inspector-type-icon")).toBeInTheDocument();
  });
});
