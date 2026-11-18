/**
 * BatchEligibility — 2L9 247:28097 (B01): counts and names from real
 * eligibility (typography-taking and not locked); the size is a draft until
 * "Apply to N eligible …", which writes only the eligible ones, in one step.
 *
 * @license BSD-3-Clause
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { BatchEligibility } from "../BatchEligibility";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function stage() {
  const c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const add = (type: string) => {
    const e = c.elements.createElement(type as never, {} as never);
    c.elements.addElement(e, root);
    return c.elements.getElement(e.getId())!;
  };
  const h1 = add("heading");
  const h2 = add("heading");
  const img = add("image");
  h1.setStyle("font-size", "48px");
  h2.setStyle("font-size", "32px");
  img.setLocked(true);
  c.history.flushPending();
  return { c, h1, h2, img };
}

describe("BatchEligibility (2L9 B01)", () => {
  it("names who can change and who is excluded; Mixed for differing sizes", () => {
    const { c, h1, h2, img } = stage();
    render(<BatchEligibility composer={c} elements={[h1, h2, img]} />);
    expect(screen.getByText("Typography eligibility")).toBeInTheDocument();
    expect(screen.getByTestId("inspector-batch-eligibility")).toHaveTextContent(
      "2 headings can change font size. Locked image is excluded and remains unchanged.",
    );
    expect(screen.getByRole("textbox", { name: /^Font size/ })).toHaveAttribute("placeholder", "Mixed");
    expect(screen.getByRole("button", { name: "Apply to 2 eligible headings" })).toBeDisabled();
  });

  it("Apply writes the size to the eligible ones only, as one Undo step", () => {
    const { c, h1, h2, img } = stage();
    render(<BatchEligibility composer={c} elements={[h1, h2, img]} />);
    fireEvent.change(screen.getByRole("textbox", { name: /^Font size/ }), { target: { value: "40" } });
    expect(h1.getStyles()["font-size"]).toBe("48px");
    fireEvent.click(screen.getByRole("button", { name: "Apply to 2 eligible headings" }));
    expect(c.elements.getElement(h1.getId())!.getStyles()["font-size"]).toBe("40px");
    expect(c.elements.getElement(h2.getId())!.getStyles()["font-size"]).toBe("40px");
    expect(c.elements.getElement(img.getId())!.getStyles()["font-size"]).toBeUndefined();
    c.history.flushPending();
    c.history.undo();
    expect(c.elements.getElement(h1.getId())!.getStyles()["font-size"]).toBe("48px");
    expect(c.elements.getElement(h2.getId())!.getStyles()["font-size"]).toBe("32px");
  });

  it("nothing when every selected element is eligible", () => {
    const { c, h1, h2 } = stage();
    const { container } = render(<BatchEligibility composer={c} elements={[h1, h2]} />);
    expect(container.textContent).toBe("");
  });
});
