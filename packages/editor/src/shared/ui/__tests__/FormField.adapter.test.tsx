/**
 * Phase 4 contract tests — verify FormField adapter shim correctly bridges
 * legacy FormField API onto the vibcoder FormField primitive.
 *
 * Strategy: bridge.
 *   label/required/htmlFor/disabled → vibcoder forwarded as-is.
 *   error → vibcoder error (HelperText tone="error").
 *   description/warning/success → vibcoder helper (with marker classNames
 *     for warning/success on the root since vibcoder helper has no warning
 *     tone and we don't forward success tone).
 *   layout "horizontal" → vibcoder row={true}.
 *   size sm|lg → marker className bd-form-field--{x}.
 *   optional → marker className "is-optional".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "../FormField";

describe("FormField adapter shim (bridge to vibcoder)", () => {
  it("renders the vibcoder bd-form-field root", () => {
    const { container } = render(
      <FormField label="Name">
        <input data-testid="x" />
      </FormField>,
    );
    expect(container.querySelector(".bd-form-field")).not.toBeNull();
  });

  it("renders the label inside vibcoder Label", () => {
    render(
      <FormField label="Display Name">
        <input />
      </FormField>,
    );
    expect(screen.getByText("Display Name")).not.toBeNull();
  });

  it("forwards children into the vibcoder root", () => {
    render(
      <FormField label="x">
        <input data-testid="child" />
      </FormField>,
    );
    expect(screen.getByTestId("child")).not.toBeNull();
  });

  it("required=true renders the vibcoder required marker", () => {
    const { container } = render(
      <FormField label="Name" required>
        <input />
      </FormField>,
    );
    expect(container.querySelector(".bd-form-field--required")).not.toBeNull();
  });

  it("error string renders helper text via vibcoder error path", () => {
    render(
      <FormField label="Name" error="Required">
        <input />
      </FormField>,
    );
    expect(screen.getByText("Required")).not.toBeNull();
  });

  it("error overrides description (mutex)", () => {
    render(
      <FormField label="Name" description="hint" error="bad">
        <input />
      </FormField>,
    );
    expect(screen.getByText("bad")).not.toBeNull();
    expect(screen.queryByText("hint")).toBeNull();
  });

  it("warning string renders as helper text + adds 'is-warning' marker", () => {
    const { container } = render(
      <FormField label="Name" warning="watch out">
        <input />
      </FormField>,
    );
    expect(container.querySelector(".is-warning")).not.toBeNull();
    expect(screen.getByText("watch out")).not.toBeNull();
  });

  it("success string renders as helper text + adds 'is-success' marker", () => {
    const { container } = render(
      <FormField label="Name" success="great">
        <input />
      </FormField>,
    );
    expect(container.querySelector(".is-success")).not.toBeNull();
    expect(screen.getByText("great")).not.toBeNull();
  });

  it("description renders as helper text when no error/warning/success", () => {
    render(
      <FormField label="Name" description="hint text">
        <input />
      </FormField>,
    );
    expect(screen.getByText("hint text")).not.toBeNull();
  });

  it("layout 'horizontal' adds vibcoder bd-form-field--row", () => {
    const { container } = render(
      <FormField label="Name" layout="horizontal">
        <input />
      </FormField>,
    );
    expect(container.querySelector(".bd-form-field--row")).not.toBeNull();
  });

  it("layout 'vertical' (default) does NOT add row modifier", () => {
    const { container } = render(
      <FormField label="Name">
        <input />
      </FormField>,
    );
    expect(container.querySelector(".bd-form-field--row")).toBeNull();
  });

  it("size 'sm' adds bd-form-field--sm marker class", () => {
    const { container } = render(
      <FormField label="Name" size="sm">
        <input />
      </FormField>,
    );
    expect(container.querySelector(".bd-form-field--sm")).not.toBeNull();
  });

  it("size 'md' (default) does NOT add a size marker", () => {
    const { container } = render(
      <FormField label="Name">
        <input />
      </FormField>,
    );
    const root = container.querySelector(".bd-form-field") as HTMLElement;
    expect(root.className).not.toMatch(/bd-form-field--(sm|lg)/);
  });

  it("disabled=true adds vibcoder is-disabled marker", () => {
    const { container } = render(
      <FormField label="Name" disabled>
        <input />
      </FormField>,
    );
    expect(container.querySelector(".is-disabled")).not.toBeNull();
  });

  it("optional=true adds 'is-optional' marker class", () => {
    const { container } = render(
      <FormField label="Name" optional>
        <input />
      </FormField>,
    );
    expect(container.querySelector(".is-optional")).not.toBeNull();
  });

  it("missing label adds 'is-labelless' marker class", () => {
    const { container } = render(
      <FormField>
        <input />
      </FormField>,
    );
    expect(container.querySelector(".is-labelless")).not.toBeNull();
  });

  it("forwards htmlFor to the vibcoder Label", () => {
    const { container } = render(
      <FormField label="Name" htmlFor="x-input">
        <input id="x-input" />
      </FormField>,
    );
    const label = container.querySelector("label");
    expect(label?.getAttribute("for")).toBe("x-input");
  });
});
