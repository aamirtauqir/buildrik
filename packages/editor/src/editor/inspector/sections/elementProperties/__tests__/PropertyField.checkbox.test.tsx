/**
 * P-11(b): boolean attributes. HTML writes them present-and-empty
 * (`controls=""`, `required=""`) — that is ON — but the panel read "" as
 * unchecked. And the caption beside each box showed the state, not the
 * property: "Disabled ☐ Disabled", "Required ☐ Disabled". The label names
 * the property and is the checkbox's accessible name (DD-22).
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ElementPropertiesSection } from "../index";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";

function setup(type: string, attrs: Record<string, string> = {}) {
  const el = makeMockElement({ id: "e1", type, attrs });
  const composer = makeMockComposer({ element: el });
  render(<ElementPropertiesSection selectedElement={{ id: "e1", type }} composer={composer as never} isOpen />);
  return { el };
}

afterEach(cleanup);

describe("boolean attribute checkboxes (P-11b)", () => {
  it("a present-but-empty attribute reads as checked", () => {
    setup("video", { controls: "" });
    expect(screen.getByRole("checkbox", { name: "Show Controls" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Autoplay" })).not.toBeChecked();
  });

  it('"true" and the attribute\'s own name read as checked; "false" does not', () => {
    setup("input", { required: "true", disabled: "disabled", readonly: "false" });
    expect(screen.getByRole("checkbox", { name: "Required" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Disabled" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Read Only" })).not.toBeChecked();
  });

  it("the caption names the property, once, and never shows the state", () => {
    setup("input");
    expect(screen.getAllByText("Disabled")).toHaveLength(1);
    expect(screen.queryByText("Enabled")).toBeNull();
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("clicking the label toggles its own checkbox", () => {
    const { el } = setup("input");
    fireEvent.click(screen.getByText("Required"));
    expect(el.setAttribute).toHaveBeenCalledWith("required", "true");
  });
});
