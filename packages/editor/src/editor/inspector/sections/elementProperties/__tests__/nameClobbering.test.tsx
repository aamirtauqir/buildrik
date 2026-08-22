/**
 * The Name field must say when the name will not survive.
 *
 * The inspector offers a Name field on input, select and textarea, with the
 * placeholder `field_name`. A user naming a name field `name` — the most
 * natural thing to type — loses it: DOMPurify strips a `name` whose value
 * collides with a DOM property, because `name="name"` inside a form makes
 * `form.name` return the input rather than the form's name.
 *
 * The value disappears at publish, not at typing. The editor shows it, the
 * canvas shows it, and the field arrives at the visitor's browser unnamed, so
 * whatever they type in it is dropped from the submission. Silently losing what
 * someone typed is never the right answer, so the field says so.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ElementPropertiesSection } from "../index";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";

function setup(type = "input") {
  const el = makeMockElement({ id: "e1", type });
  const composer = makeMockComposer({ element: el });
  render(
    <ElementPropertiesSection
      selectedElement={{ id: "e1", type }}
      composer={composer as never}
      isOpen={true}
    />
  );
  return screen.getByLabelText(/^Name$/i) as HTMLInputElement;
}

describe("form field Name", () => {
  it("warns when the name will be stripped as DOM clobbering", () => {
    const input = setup();
    fireEvent.change(input, { target: { value: "name" } });
    expect(screen.getByText(/survive publishing/i)).toBeInTheDocument();
  });

  it("names every value that gets stripped, not just the one typed", () => {
    const input = setup();
    for (const bad of ["id", "submit", "action", "method"]) {
      fireEvent.change(input, { target: { value: bad } });
      expect(screen.getByText(/survive publishing/i)).toBeInTheDocument();
    }
  });

  it("says nothing for a name that survives", () => {
    const input = setup();
    fireEvent.change(input, { target: { value: "fullname" } });
    expect(screen.queryByText(/survive publishing/i)).not.toBeInTheDocument();
  });

  it("says nothing on an empty field", () => {
    const input = setup();
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.queryByText(/survive publishing/i)).not.toBeInTheDocument();
  });
});
