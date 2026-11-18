// @vitest-environment jsdom
/**
 * Reset style review — 2L9 255:91826 (S20): names the layer and the exact
 * properties, removes them in one step on Remove, and nothing on Cancel.
 *
 * @license BSD-3-Clause
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/editor/chrome-ui";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { ResetStyleReview, propertyList } from "../ResetStyleReview";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function setup() {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  c.elements.setActivePage(page.id);
  const el = c.elements.createElement("heading" as never, { content: "Hi" } as never);
  c.elements.addElement(el, page.root.id);
  el.setStyles({ "font-family": "Inter", "font-size": "48px", "font-weight": "700", "line-height": "1.1" });
  c.selection.select(el);
  const onClose = vi.fn();
  render(
    <ToastProvider>
      <ResetStyleReview composer={c} elementId={el.getId()} onClose={onClose} />
    </ToastProvider>,
  );
  return { c, el, onClose };
}

describe("Reset style review (S20)", () => {
  it("names the layer and the exact properties it removes", () => {
    setup();
    expect(screen.getByText("Reset local style")).toBeInTheDocument();
    expect(screen.getByText(/· Desktop · Default state$/)).toBeInTheDocument();
    expect(screen.getByTestId("inspector-reset-properties")).toHaveTextContent(
      "Remove 4 local properties: font family, font size, font weight and line height.",
    );
    expect(propertyList(["color"])).toBe("color");
  });

  it("Remove clears the element's own styles in one step and closes; Cancel removes nothing", () => {
    const { c, el, onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(Object.keys(c.elements.getElement(el.getId())!.getStyles())).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Remove 4 local properties" }));
    expect(c.elements.getElement(el.getId())!.getStyles()).toEqual({});
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
