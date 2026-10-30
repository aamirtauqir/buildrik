// @vitest-environment jsdom
/**
 * 2L9 A11: the element's real aria-* / data-* attributes, editable; an
 * authored-empty one is removable; the internal id is read-only.
 * @license BSD-3-Clause
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { CustomAttributesList } from "../DataAttributeEditor";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

describe("Custom attributes (A11)", () => {
  it("lists aria-* and data-*, edits a value in one step, removes an authored-empty one, shows the internal id read-only", () => {
    const c = createTestComposer();
    const root = c.elements.createPage("Home").root.id;
    const el = c.elements.createElement("heading", { attributes: { "aria-label": "Our approach", "data-section": "", title: "x" } });
    c.elements.addElement(el, root);
    c.history.flushPending();
    render(<CustomAttributesList composer={c} elementId={el.getId()} />);
    expect(screen.getByTestId("inspector-custom-attributes")).toHaveTextContent("Custom attributes2 set");
    const input = screen.getByTestId("custom-attr-aria-label").querySelector("input")!;
    fireEvent.change(input, { target: { value: "Approach" } });
    fireEvent.blur(input);
    expect(c.elements.getElement(el.getId())!.getAttribute("aria-label")).toBe("Approach");
    fireEvent.click(screen.getByTestId("custom-attr-remove-data-section"));
    expect(c.elements.getElement(el.getId())!.getAttribute("data-section")).toBeUndefined();
    expect(screen.getByTestId("custom-attr-internal-id")).toHaveTextContent(el.getId());
  });
});
