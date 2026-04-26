import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FormField } from "./FormField";

describe("vibcoder FormField wrapper", () => {
  it("renders <div> with bd-form-field base class + label + children content", () => {
    const { container } = render(
      <FormField label="Name">
        <input data-testid="ctrl" />
      </FormField>,
    );
    const root = container.querySelector("div.bd-form-field");
    expect(root).toBeTruthy();
    expect(root!.querySelector("label.bd-label")!.textContent).toBe("Name");
    expect(root!.querySelector("[data-testid='ctrl']")).toBeTruthy();
  });

  it("OMITS variant modifiers when no variant prop set (default)", () => {
    const { container } = render(
      <FormField label="x">
        <input />
      </FormField>,
    );
    const cls = container.querySelector(".bd-form-field")!.className;
    expect(cls).not.toContain("bd-form-field--inline");
    expect(cls).not.toContain("bd-form-field--row");
    expect(cls).not.toContain("bd-form-field--required");
    expect(cls).not.toContain("is-disabled");
  });

  it("emits each variant modifier when its boolean prop is true", () => {
    const { container } = render(
      <FormField label="x" inline row required disabled>
        <input />
      </FormField>,
    );
    const cls = container.querySelector(".bd-form-field")!.className;
    expect(cls).toContain("bd-form-field--inline");
    expect(cls).toContain("bd-form-field--row");
    expect(cls).toContain("bd-form-field--required");
    expect(cls).toContain("is-disabled");
  });

  it("renders helper text with default (muted) tone — no tone modifier", () => {
    const { container } = render(
      <FormField label="x" helper="hint">
        <input />
      </FormField>,
    );
    const helper = container.querySelector("p.bd-helper-text");
    expect(helper).toBeTruthy();
    expect(helper!.textContent).toBe("hint");
    expect(helper!.className).not.toContain("bd-helper-text--error");
  });

  it("renders error text with bd-helper-text--error tone", () => {
    const { container } = render(
      <FormField label="x" error="bad">
        <input />
      </FormField>,
    );
    const helper = container.querySelector("p.bd-helper-text");
    expect(helper).toBeTruthy();
    expect(helper!.textContent).toBe("bad");
    expect(helper!.className).toContain("bd-helper-text--error");
  });

  it("error overrides helper when both are passed (error wins)", () => {
    const { container } = render(
      <FormField label="x" helper="hint" error="bad">
        <input />
      </FormField>,
    );
    const helpers = container.querySelectorAll("p.bd-helper-text");
    expect(helpers.length).toBe(1);
    expect(helpers[0].textContent).toBe("bad");
    expect(helpers[0].className).toContain("bd-helper-text--error");
  });

  it("treats error=\"\" as absent and falls through to helper (locked behavior — controlled-form pattern emits empty string for no error)", () => {
    const { container } = render(
      <FormField label="Email" helper="We'll never share it." error="">
        <input type="email" />
      </FormField>,
    );
    // helper text should render with default/muted tone
    const helper = container.querySelector(".bd-helper-text");
    expect(helper).toBeTruthy();
    expect(helper!.textContent).toBe("We'll never share it.");
    // and the helper should NOT carry the error tone
    expect(helper!.className).not.toContain("bd-helper-text--error");
  });

  it("OMITS helper-text element when neither helper nor error is set", () => {
    const { container } = render(
      <FormField label="x">
        <input />
      </FormField>,
    );
    expect(container.querySelector(".bd-helper-text")).toBeNull();
  });

  it("forwards required to Label (renders __required marker)", () => {
    const { container } = render(
      <FormField label="x" required>
        <input />
      </FormField>,
    );
    expect(container.querySelector(".bd-label__required")).toBeTruthy();
  });

  it("forwards htmlFor to Label", () => {
    const { container } = render(
      <FormField label="x" htmlFor="my-input">
        <input id="my-input" />
      </FormField>,
    );
    expect(container.querySelector("label")!.getAttribute("for")).toBe(
      "my-input",
    );
  });

  it("merges caller className", () => {
    const { container } = render(
      <FormField label="x" className="extra">
        <input />
      </FormField>,
    );
    expect(container.querySelector(".bd-form-field")!.className).toContain(
      "extra",
    );
  });

  it("forwards ref to root <div>", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <FormField label="x" ref={ref}>
        <input />
      </FormField>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current!.classList.contains("bd-form-field")).toBe(true);
  });

  it("renders content slot children verbatim (no clone, no inject)", () => {
    const { getByTestId } = render(
      <FormField label="x">
        <select data-testid="ctrl">
          <option>a</option>
        </select>
      </FormField>,
    );
    expect(getByTestId("ctrl").tagName).toBe("SELECT");
  });
});
